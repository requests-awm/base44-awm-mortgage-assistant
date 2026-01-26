/**
 * Lookup Team Email
 *
 * Purpose: Get team group email from team name for CC functionality
 *
 * Usage: Called before sending email via Zapier to determine CC recipients
 *
 * @param team_name - Team name from MortgageCase.referring_team
 * @returns Team group email address, or null if not found
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { team_name } = await req.json();

    console.log('[LOOKUP] Finding team email for:', team_name);

    if (!team_name) {
      console.log('[LOOKUP] No team name provided');
      return Response.json({
        success: false,
        team_email: null,
        message: 'No team name provided'
      });
    }

    // Query TeamDirectory
    const teamResults = await base44.entities.TeamDirectory.filter({
      team_name: team_name,
      active: true
    });
    const team = teamResults && teamResults.length > 0 ? teamResults[0] : null;

    if (!team) {
      console.log('[LOOKUP] Team not found in directory:', team_name);
      return Response.json({
        success: false,
        team_email: null,
        message: `Team not found: ${team_name}`
      });
    }

    console.log('[LOOKUP] Found team email:', team.team_email);

    return Response.json({
      success: true,
      team_email: team.team_email,
      team_name: team.team_name
    });

  } catch (error) {
    console.error('[LOOKUP] Team lookup failed:', error);
    return Response.json({
      success: false,
      team_email: null,
      error: error.message
    }, { status: 500 });
  }
});
