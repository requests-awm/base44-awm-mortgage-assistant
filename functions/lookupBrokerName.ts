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

export default async function lookupBrokerName(context: any, { broker_email }: { broker_email: string }) {
  try {
    console.log('[LOOKUP] Finding broker name for:', broker_email);

    if (!broker_email) {
      console.log('[LOOKUP] No broker email provided');
      return {
        success: false,
        broker_name: null,
        message: 'No broker email provided'
      };
    }

    // Query BrokerDirectory
    const broker = await context.entities.BrokerDirectory.findOne({
      broker_email: broker_email,
      active: true
    });

    if (!broker) {
      console.log('[LOOKUP] Broker not found in directory:', broker_email);
      return {
        success: false,
        broker_name: null,
        message: `Broker not found: ${broker_email}`
      };
    }

    console.log('[LOOKUP] Found broker:', broker.display_name);

    return {
      success: true,
      broker_name: broker.display_name,
      broker_email: broker.broker_email
    };

  } catch (error) {
    console.error('[LOOKUP] Broker lookup failed:', error);
    return {
      success: false,
      broker_name: null,
      error: error.message
    };
  }
}
