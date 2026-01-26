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

export default async function lookupTeamEmail(context: any, { team_name }: { team_name: string }) {
  try {
    console.log('[LOOKUP] Finding team email for:', team_name);

    if (!team_name) {
      console.log('[LOOKUP] No team name provided');
      return {
        success: false,
        team_email: null,
        message: 'No team name provided'
      };
    }

    // Query TeamDirectory
    const team = await context.entities.TeamDirectory.findOne({
      team_name: team_name,
      active: true
    });

    if (!team) {
      console.log('[LOOKUP] Team not found in directory:', team_name);
      return {
        success: false,
        team_email: null,
        message: `Team not found: ${team_name}`
      };
    }

    console.log('[LOOKUP] Found team email:', team.team_email);

    return {
      success: true,
      team_email: team.team_email,
      team_name: team.team_name
    };

  } catch (error) {
    console.error('[LOOKUP] Team lookup failed:', error);
    return {
      success: false,
      team_email: null,
      error: error.message
    };
  }
}
