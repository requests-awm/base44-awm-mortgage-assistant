import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Check if settings already exist
        const existing = await base44.asServiceRole.entities.EmailSettings.list();
        
        if (existing.length > 0) {
            return Response.json({ 
                message: 'Email settings already exist',
                settings: existing[0]
            });
        }
        
        // Create default email settings
        const settings = await base44.asServiceRole.entities.EmailSettings.create({
            batch_send_time: "16:00",
            batch_send_timezone: "Europe/London",
            batch_send_enabled: true,
            instant_send_enabled: true,
            sender_email: "requests@ascotwm.com",
            max_batch_size: 50,
            retry_failed_sends: true,
            retry_max_attempts: 3
        });
        
        return Response.json({ 
            message: 'Email settings created successfully',
            settings
        });
        
    } catch (error) {
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});