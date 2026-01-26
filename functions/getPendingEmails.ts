/**
 * Get Pending Emails for Zapier
 *
 * Purpose: Query cases ready for email sending (scheduled batch or instant)
 * Called by Zapier to fetch pending emails for sending
 *
 * Query Logic:
 * - zapier_trigger_pending = true
 * - email_scheduled_send_time <= NOW
 * - email_status = 'scheduled'
 *
 * Returns: Array of cases with enriched data (broker name, team email)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('[GET_PENDING] Fetching pending emails...');

    const now = new Date().toISOString();

    // Query cases ready to send
    const pendingCases = await base44.entities.MortgageCase.find({
      zapier_trigger_pending: true,
      email_status: 'scheduled',
      email_scheduled_send_time: { $lte: now }
    });

    console.log(`[GET_PENDING] Found ${pendingCases.length} pending cases`);

    if (pendingCases.length === 0) {
      return Response.json({
        success: true,
        message: 'No pending emails to send',
        count: 0,
        emails: []
      });
    }

    // Enrich each case with broker name and team email
    const enrichedEmails = await Promise.all(
      pendingCases.map(async (caseData) => {
        let brokerName = null;
        let teamEmail = null;

        // Lookup broker name
        if (caseData.mortgage_broker_appointed) {
          const brokerResults = await base44.entities.BrokerDirectory.filter({
            broker_email: caseData.mortgage_broker_appointed,
            active: true
          });
          const brokerLookup = brokerResults && brokerResults.length > 0 ? brokerResults[0] : null;
          brokerName = brokerLookup?.display_name || null;
        }

        // Lookup team email
        if (caseData.referring_team) {
          const teamResults = await base44.entities.TeamDirectory.filter({
            team_name: caseData.referring_team,
            active: true
          });
          const teamLookup = teamResults && teamResults.length > 0 ? teamResults[0] : null;
          teamEmail = teamLookup?.team_email || null;
        }

        return {
          case_id: caseData.id,
          reference: caseData.reference,
          client_name: caseData.client_name,
          client_email: caseData.client_email,
          email_subject: caseData.email_subject,
          email_draft: caseData.email_draft,
          broker_name: brokerName,
          team_email: teamEmail,
          scheduled_send_time: caseData.email_scheduled_send_time,
          email_sent_by: caseData.email_sent_by
        };
      })
    );

    console.log(`[GET_PENDING] Enriched ${enrichedEmails.length} emails with broker/team data`);

    return Response.json({
      success: true,
      message: `Found ${enrichedEmails.length} emails ready to send`,
      count: enrichedEmails.length,
      emails: enrichedEmails,
      fetched_at: now
    });

  } catch (error) {
    console.error('[GET_PENDING] Failed to fetch pending emails:', error);
    return Response.json({
      success: false,
      error: error.message,
      count: 0,
      emails: []
    }, { status: 500 });
  }
});
