/**
 * Seed BrokerDirectory Entity
 *
 * Purpose: Populate BrokerDirectory with initial mortgage broker data
 * for Gmail display name masking
 *
 * Usage: Run once during Phase 3-01 schema setup
 */

export default async function seedBrokerDirectory(context: any) {
  try {
    console.log('[SEED] Starting BrokerDirectory seed...');

    const brokers = [
      {
        broker_email: 'nwabisa.janda@ascotwm.com',
        display_name: 'Nwabisa Janda',
        active: true
      },
      {
        broker_email: 'dextter.roberts@ascotwm.com',
        display_name: 'Dextter Roberts',
        active: true
      }
    ];

    const results = [];

    for (const broker of brokers) {
      // Check if broker already exists
      const existing = await context.entities.BrokerDirectory.findOne({
        broker_email: broker.broker_email
      });

      if (existing) {
        console.log(`[SEED] Broker already exists: ${broker.display_name}`);
        results.push({ status: 'skipped', broker: broker.display_name });
        continue;
      }

      // Create broker
      const created = await context.entities.BrokerDirectory.create(broker);
      console.log(`[SEED] Created broker: ${broker.display_name}`);
      results.push({ status: 'created', broker: broker.display_name, id: created.id });
    }

    console.log('[SEED] BrokerDirectory seed complete');

    return {
      success: true,
      message: 'BrokerDirectory seeded successfully',
      results
    };

  } catch (error) {
    console.error('[SEED] BrokerDirectory seed failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
