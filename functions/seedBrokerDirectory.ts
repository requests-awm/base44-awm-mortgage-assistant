/**
 * Seed BrokerDirectory Entity
 *
 * Purpose: Populate BrokerDirectory with initial mortgage broker data
 * for Gmail display name masking
 *
 * Usage: Run once during Phase 3-01 schema setup
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

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
      const existing = await base44.asServiceRole.entities.BrokerDirectory.findOne({
        broker_email: broker.broker_email
      });

      if (existing) {
        console.log(`[SEED] Broker already exists: ${broker.display_name}`);
        results.push({ status: 'skipped', broker: broker.display_name });
        continue;
      }

      // Create broker
      const created = await base44.asServiceRole.entities.BrokerDirectory.create(broker);
      console.log(`[SEED] Created broker: ${broker.display_name}`);
      results.push({ status: 'created', broker: broker.display_name, id: created.id });
    }

    console.log('[SEED] BrokerDirectory seed complete');

    return Response.json({
      success: true,
      message: 'BrokerDirectory seeded successfully',
      results
    });

  } catch (error) {
    console.error('[SEED] BrokerDirectory seed failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
