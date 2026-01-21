/**
 * BASE44 FUNCTION: createCaseFromN8n
 *
 * PURPOSE: Receives pre-processed data from n8n and creates a MortgageCase
 *
 * WHY THIS EXISTS:
 * - The original asanaWebhook function handles Asana's complex handshake protocol
 * - n8n handles the Asana webhook natively, so we don't need handshake logic
 * - This endpoint is simpler, cleaner, and purpose-built for n8n integration
 *
 * ENDPOINT: https://app.base44.com/api/695d6a9a166167143c3f74bb/createCaseFromN8n
 * METHOD: POST
 *
 * EXPECTED PAYLOAD FROM n8n:
 * {
 *   asana_task_gid: "1234567890",
 *   asana_project_gid: "1212782871770137",
 *   asana_section: "1212791395605236",
 *   case_reference: "AWM-2026-W001",
 *   client_name: "John Smith",
 *   client_email: "john@example.com",
 *   insightly_id: "INS-123",
 *   internal_introducer: "Jane Doe",
 *   mortgage_broker_appointed: "Yes",
 *   case_type: "case",
 *   case_status: "incomplete",
 *   created_from_asana: true,
 *   stage: "intake_received"
 * }
 *
 * SETUP IN BASE44:
 * 1. Go to Functions in Base44
 * 2. Create new function named "createCaseFromN8n"
 * 3. Paste this code
 * 4. Set as PUBLIC endpoint
 * 5. Save and publish
 */

Deno.serve(async (req) => {
    // CORS headers for external access
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return Response.json(
            { success: false, error: 'Method not allowed' },
            { status: 405, headers: corsHeaders }
        );
    }

    const timestamp = new Date().toISOString();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📨 N8N REQUEST RECEIVED');
    console.log(`⏰ Timestamp: ${timestamp}`);

    try {
        // Parse the incoming JSON from n8n
        const payload = await req.json();

        console.log('📦 Payload received:', JSON.stringify(payload, null, 2));

        // Validate required fields
        if (!payload.asana_task_gid) {
            console.error('❌ Missing asana_task_gid');
            return Response.json(
                { success: false, error: 'Missing asana_task_gid' },
                { status: 400, headers: corsHeaders }
            );
        }

        // Initialize Base44 client
        const { createClient } = await import('npm:@base44/sdk@0.8.6');
        const client = createClient(Deno.env.get('BASE44_APP_ID'), null);

        // CHECK FOR DUPLICATE - Critical to prevent double-creation
        console.log(`🔍 Checking for duplicate: asana_task_gid = ${payload.asana_task_gid}`);

        const existingCases = await client.asServiceRole.entities.MortgageCase.filter({
            asana_task_gid: payload.asana_task_gid
        });

        if (existingCases && existingCases.length > 0) {
            console.log(`⚠️ Duplicate case exists: ${existingCases[0].reference}`);
            return Response.json(
                {
                    success: true,
                    message: 'Duplicate - case already exists',
                    existing_reference: existingCases[0].reference,
                    existing_id: existingCases[0].id
                },
                { status: 200, headers: corsHeaders }
            );
        }

        // CREATE THE CASE
        console.log(`✅ Creating new case: ${payload.case_reference}`);

        const newCase = await client.asServiceRole.entities.MortgageCase.create({
            // Identifiers
            reference: payload.case_reference,
            asana_task_gid: payload.asana_task_gid,
            asana_project_gid: payload.asana_project_gid,
            asana_section: payload.asana_section,

            // Client data from Asana custom fields
            client_name: payload.client_name || 'Unknown Client',
            client_email: payload.client_email || null,
            insightly_id: payload.insightly_id || null,
            internal_introducer: payload.internal_introducer || null,
            mortgage_broker_appointed: payload.mortgage_broker_appointed || null,

            // Case defaults
            case_type: payload.case_type || 'case',
            case_status: payload.case_status || 'incomplete',
            created_from_asana: payload.created_from_asana !== false, // Default true
            stage: payload.stage || 'intake_received',

            // Timestamps
            asana_last_synced: timestamp,
            created_at: timestamp
        });

        console.log(`✅ Case created successfully: ${newCase.id}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        return Response.json(
            {
                success: true,
                message: 'Case created successfully',
                case_id: newCase.id,
                case_reference: payload.case_reference
            },
            { status: 200, headers: corsHeaders }
        );

    } catch (error) {
        console.error('❌ Error creating case:', error.message);
        console.error('Stack:', error.stack);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        return Response.json(
            {
                success: false,
                error: 'Failed to create case',
                details: error.message
            },
            { status: 500, headers: corsHeaders }
        );
    }
});
