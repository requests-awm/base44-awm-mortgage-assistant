/**
 * Lookup Broker Display Name
 *
 * Purpose: Get Gmail display name from broker email for email masking
 *
 * Usage: Called before sending email via Zapier
 *
 * @param broker_email - Email address from MortgageCase.mortgage_broker_appointed
 * @returns Display name for Gmail From field, or null if not found
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const requestId = `REQ-${Date.now()}`;

  try {
    const base44 = createClientFromRequest(req);
    const { broker_email } = await req.json();

    console.log(`[BROKER_LOOKUP][${requestId}] Starting lookup for:`, broker_email);

    if (!broker_email) {
      console.log(`[BROKER_LOOKUP][${requestId}] ERROR: No broker email provided`);
      return Response.json({
        success: false,
        broker_name: null,
        message: 'No broker email provided'
      });
    }

    // Query BrokerDirectory
    console.log(`[BROKER_LOOKUP][${requestId}] Querying BrokerDirectory...`);
    const brokerResults = await base44.entities.BrokerDirectory.filter({
      broker_email: broker_email,
      active: true
    });
    console.log(`[BROKER_LOOKUP][${requestId}] Query returned ${brokerResults ? brokerResults.length : 0} results`);

    const broker = brokerResults && brokerResults.length > 0 ? brokerResults[0] : null;

    if (!broker) {
      console.log(`[BROKER_LOOKUP][${requestId}] Broker not found in directory:`, broker_email);
      return Response.json({
        success: false,
        broker_name: null,
        message: `Broker not found: ${broker_email}`
      });
    }

    console.log(`[BROKER_LOOKUP][${requestId}] SUCCESS - Found display name:`, broker.display_name);

    return Response.json({
      success: true,
      broker_name: broker.display_name,
      broker_email: broker.broker_email
    });

  } catch (error) {
    console.error(`[BROKER_LOOKUP][${requestId}] EXCEPTION:`, error);
    return Response.json({
      success: false,
      broker_name: null,
      error: error.message
    }, { status: 500 });
  }
});
