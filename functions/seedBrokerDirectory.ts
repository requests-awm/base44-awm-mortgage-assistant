import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Check if brokers already exist
        const existing = await base44.asServiceRole.entities.BrokerDirectory.list();
        
        if (existing.length > 0) {
            return Response.json({ 
                message: 'Broker directory already populated',
                brokers: existing
            });
        }
        
        // Create default brokers
        const brokers = [
            {
                broker_email: "broker1@ascotwm.com",
                display_name: "Sarah Mitchell",
                active: true
            },
            {
                broker_email: "broker2@ascotwm.com",
                display_name: "James Thompson",
                active: true
            },
            {
                broker_email: "broker3@ascotwm.com",
                display_name: "Emily Roberts",
                active: true
            }
        ];
        
        const created = await base44.asServiceRole.entities.BrokerDirectory.bulkCreate(brokers);
        
        return Response.json({ 
            message: `Created ${created.length} brokers successfully`,
            brokers: created
        });
        
    } catch (error) {
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});