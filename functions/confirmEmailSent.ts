/**
 * Confirm Email Sent - Zapier Callback Function
 *
 * Purpose: Update MortgageCase after Zapier successfully sends email
 * Called by Zapier webhook after Gmail delivery
 *
 * Updates:
 * - email_status = 'sent'
 * - zapier_trigger_pending = false
 * - zapier_sent_confirmation = true
 * - zapier_task_id = Zapier execution ID
 * - gmail_message_id = Gmail message ID
 * - email_sent_at = Timestamp (if not already set)
 *
 * Audit Trail:
 * - Creates AuditLog entry for compliance
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const requestId = `REQ-${Date.now()}`;

  try {
    const base44 = createClientFromRequest(req);
    const {
      case_id,
      zapier_task_id,
      gmail_message_id,
      sent_at
    } = await req.json();

    console.log(`[EMAIL_CONFIRM][${requestId}] Starting confirmation for case:`, case_id);

    if (!case_id) {
      console.error(`[EMAIL_CONFIRM][${requestId}] ERROR: No case_id provided`);
      throw new Error('case_id is required');
    }

    // Fetch case using filter (Base44 pattern)
    console.log(`[EMAIL_CONFIRM][${requestId}] Fetching case from MortgageCase...`);
    const caseResults = await base44.entities.MortgageCase.filter({ id: case_id });
    const caseData = caseResults && caseResults.length > 0 ? caseResults[0] : null;

    if (!caseData) {
      console.error(`[EMAIL_CONFIRM][${requestId}] ERROR: Case not found:`, case_id);
      throw new Error(`Case not found: ${case_id}`);
    }

    console.log(`[EMAIL_CONFIRM][${requestId}] Case found, preparing update...`);

    // Update case
    const updateData: any = {
      email_status: 'sent',
      zapier_trigger_pending: false,
      zapier_sent_confirmation: true
    };

    if (zapier_task_id) {
      updateData.zapier_task_id = zapier_task_id;
    }

    if (gmail_message_id) {
      updateData.gmail_message_id = gmail_message_id;
    }

    // Set email_sent_at if not already set (manual send sets it, Zapier confirms it)
    if (!caseData.email_sent_at && sent_at) {
      updateData.email_sent_at = sent_at;
    } else if (!caseData.email_sent_at) {
      updateData.email_sent_at = new Date().toISOString();
    }

    await base44.asServiceRole.entities.MortgageCase.update(case_id, updateData);

    console.log(`[EMAIL_CONFIRM][${requestId}] Case updated successfully`);

    // Create audit log entry
    console.log(`[EMAIL_CONFIRM][${requestId}] Creating audit log...`);
    await base44.asServiceRole.entities.AuditLog.create({
      case_id: case_id,
      action: 'Email sent via Zapier',
      action_category: 'delivery',
      actor: 'zapier',
      actor_email: 'requests@ascotwm.com',
      timestamp: updateData.email_sent_at,
      metadata: {
        zapier_task_id,
        gmail_message_id,
        broker_name: caseData.assigned_mortgage_broker_name,
        team: caseData.referring_team
      }
    });

    console.log(`[EMAIL_CONFIRM][${requestId}] SUCCESS - Audit log created`);

    return Response.json({
      success: true,
      message: 'Email delivery confirmed',
      case_id,
      email_status: 'sent',
      sent_at: updateData.email_sent_at,
      zapier_task_id,
      gmail_message_id
    });

  } catch (error) {
    console.error(`[EMAIL_CONFIRM][${requestId}] EXCEPTION:`, error);
    return Response.json({
      success: false,
      error: error.message,
      case_id
    }, { status: 500 });
  }
});
