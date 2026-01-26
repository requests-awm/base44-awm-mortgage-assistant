/**
 * Confirm Email Sent - Zapier Callback
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

export default async function confirmEmailSent(
  context: any,
  {
    case_id,
    zapier_task_id,
    gmail_message_id,
    sent_at
  }: {
    case_id: string;
    zapier_task_id?: string;
    gmail_message_id?: string;
    sent_at?: string;
  }
) {
  try {
    console.log('[CONFIRM] Confirming email sent for case:', case_id);

    if (!case_id) {
      throw new Error('case_id is required');
    }

    // Fetch case
    const caseData = await context.entities.MortgageCase.findById(case_id);

    if (!caseData) {
      throw new Error(`Case not found: ${case_id}`);
    }

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

    await context.entities.MortgageCase.update(case_id, updateData);

    console.log('[CONFIRM] Case updated successfully');

    // Create audit log entry
    await context.entities.AuditLog.create({
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

    console.log('[CONFIRM] Audit log created');

    return {
      success: true,
      message: 'Email delivery confirmed',
      case_id,
      email_status: 'sent',
      sent_at: updateData.email_sent_at,
      zapier_task_id,
      gmail_message_id
    };

  } catch (error) {
    console.error('[CONFIRM] Failed to confirm email sent:', error);
    return {
      success: false,
      error: error.message,
      case_id
    };
  }
}
