import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Check if teams already exist
        const existing = await base44.asServiceRole.entities.TeamDirectory.list();
        
        if (existing.length > 0) {
            return Response.json({ 
                message: 'Team directory already populated',
                teams: existing
            });
        }
        
        // Create default teams
        const teams = [
            {
                team_name: "Team Solo",
                team_email: "teamsolo@ascotwm.com",
                active: true
            },
            {
                team_name: "Team Duo",
                team_email: "teamduo@ascotwm.com",
                active: true
            },
            {
                team_name: "Team Trio",
                team_email: "teamtrio@ascotwm.com",
                active: true
            }
        ];
        
        const created = await base44.asServiceRole.entities.TeamDirectory.bulkCreate(teams);
        
        return Response.json({ 
            message: `Created ${created.length} teams successfully`,
            teams: created
        });
        
    } catch (error) {
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});