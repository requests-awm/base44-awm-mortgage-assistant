/**
 * Seed TeamDirectory Entity
 *
 * Purpose: Populate TeamDirectory with initial adviser team data
 * for email CC functionality
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

    console.log('[SEED] Starting TeamDirectory seed...');

    const teams = [
      {
        team_name: 'Team Solo',
        team_email: 'solo@ascotwm.com',
        active: true
      },
      {
        team_name: 'Team Royal',
        team_email: 'royal@ascotwm.com',
        active: true
      },
      {
        team_name: 'Team Blue',
        team_email: 'blue@ascotwm.com',
        active: true
      },
      {
        team_name: 'Team Hurricane Catriona',
        team_email: 'hurricanecatriona@ascotwm.com',
        active: true
      },
      {
        team_name: 'Team Quest',
        team_email: 'quest@ascotwm.com',
        active: true
      }
    ];

    const results = [];

    for (const team of teams) {
      // Check if team already exists using filter
      const existing = await base44.asServiceRole.entities.TeamDirectory.filter({
        team_name: team.team_name
      });

      if (existing && existing.length > 0) {
        console.log(`[SEED] Team already exists: ${team.team_name}`);
        results.push({ status: 'skipped', team: team.team_name });
        continue;
      }

      // Create team
      const created = await base44.asServiceRole.entities.TeamDirectory.create(team);
      console.log(`[SEED] Created team: ${team.team_name}`);
      results.push({ status: 'created', team: team.team_name, id: created.id });
    }

    console.log('[SEED] TeamDirectory seed complete');

    return Response.json({
      success: true,
      message: 'TeamDirectory seeded successfully',
      results
    });

  } catch (error) {
    console.error('[SEED] TeamDirectory seed failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
