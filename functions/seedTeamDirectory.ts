/**
 * Seed TeamDirectory Entity
 *
 * Purpose: Populate TeamDirectory with initial adviser team data
 * for email CC functionality
 *
 * Usage: Run once during Phase 3-01 schema setup
 */

export default async function seedTeamDirectory(context: any) {
  try {
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
      // Check if team already exists
      const existing = await context.entities.TeamDirectory.findOne({
        team_name: team.team_name
      });

      if (existing) {
        console.log(`[SEED] Team already exists: ${team.team_name}`);
        results.push({ status: 'skipped', team: team.team_name });
        continue;
      }

      // Create team
      const created = await context.entities.TeamDirectory.create(team);
      console.log(`[SEED] Created team: ${team.team_name}`);
      results.push({ status: 'created', team: team.team_name, id: created.id });
    }

    console.log('[SEED] TeamDirectory seed complete');

    return {
      success: true,
      message: 'TeamDirectory seeded successfully',
      results
    };

  } catch (error) {
    console.error('[SEED] TeamDirectory seed failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
