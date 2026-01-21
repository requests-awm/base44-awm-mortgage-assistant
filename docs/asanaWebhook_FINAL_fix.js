import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// FINAL ATTEMPT: WILDCARD EXPOSE HEADERS + 200 OK
Deno.serve(async (req) => {
    try {
        // Only allow POST requests
        if (req.method !== 'POST') {
            return Response.json(
                { error: 'Method not allowed' },
                { status: 405 }
            );
        }

        const timestamp = new Date().toISOString();
        const hookSecret = req.headers.get('X-Hook-Secret');
        const bodyText = await req.text();

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📨 ASANA WEBHOOK REQUEST');
        console.log(`⏰ Timestamp: ${timestamp}`);
        console.log(`🔐 Hook Secret Header: ${hookSecret ? 'Present' : 'Absent'}`);

        // PART 1: HANDSHAKE VERIFICATION
        if (hookSecret) {
            console.log('🤝 HANDSHAKE DETECTED');
            console.log(`✅ Storing hook secret: ${hookSecret}`);
            console.log('✅ Sending 200 OK with Wildcard Expose Headers');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            // FINAL FIX: Use wildcard to expose ALL headers + 200 OK
            // Some gateways strip headers on 204 options, so we stick to 200
            return new Response(null, {
                status: 200,
                headers: {
                    'X-Hook-Secret': hookSecret,
                    'Access-Control-Expose-Headers': '*', // 👈 Force ALL headers to be visible
                    'Access-Control-Allow-Origin': '*'    // Standard CORS
                }
            });
        }

        // PART 2: REAL EVENT PROCESSING
        console.log('📨 EVENT RECEIVED (not handshake)');

        let eventData;
        try {
            eventData = JSON.parse(bodyText);
        } catch (parseError) {
            console.error('❌ Failed to parse event body:', parseError.message);
            return Response.json({ success: true, message: 'Invalid JSON' }, { status: 200 });
        }

        const event = eventData.events?.[0];
        if (!event) {
            return Response.json({ success: true, message: 'No events' }, { status: 200 });
        }

        const taskGid = event.resource?.gid;
        const action = event.action;
        const sectionGid = event.parent?.gid;

        console.log(`📌 Action: ${action} | Task: ${taskGid}`);

        if (action !== 'added' || !taskGid) {
            return Response.json({ success: true, message: 'Ignored' }, { status: 200 });
        }

        // Initialize Base44 client
        const base44 = {
            asServiceRole: {
                entities: {
                    MortgageCase: {
                        filter: async (filter) => {
                            const { createClient } = await import('npm:@base44/sdk@0.8.6');
                            const client = createClient(Deno.env.get('BASE44_APP_ID'), null);
                            return await client.asServiceRole.entities.MortgageCase.filter(filter);
                        },
                        create: async (data) => {
                            const { createClient } = await import('npm:@base44/sdk@0.8.6');
                            const client = createClient(Deno.env.get('BASE44_APP_ID'), null);
                            return await client.asServiceRole.entities.MortgageCase.create(data);
                        }
                    }
                }
            }
        };

        // CHECK FOR DUPLICATE
        const existingCases = await base44.asServiceRole.entities.MortgageCase.filter({ asana_task_gid: taskGid });
        if (existingCases.length > 0) {
            console.log(`⚠️ Duplicate case exists: ${existingCases[0].reference}`);
            return Response.json({ success: true, message: 'Duplicate' }, { status: 200 });
        }

        console.log(`✅ Creating new case for task ${taskGid}`);
        const asanaToken = Deno.env.get('ASANA_API_TOKEN');
        const asanaProjectGid = Deno.env.get('ASANA_PROJECT_GID') || '1212782871770137';

        // FETCH DETAILS & CREATE CASE
        let clientName = 'Asana Task';
        let clientEmail, insightlyId, brokerAppointed, internalIntroducer;

        if (asanaToken) {
            try {
                const resp = await fetch(`https://app.asana.com/api/1.0/tasks/${taskGid}?opt_fields=name,custom_fields`, {
                    headers: { 'Authorization': `Bearer ${asanaToken}` }
                });
                if (resp.ok) {
                    const data = await resp.json();
                    clientName = data.data.name || clientName;
                    data.data.custom_fields?.forEach(f => {
                        if (f.gid === '1202693938754570') insightlyId = f.text_value;
                        if (f.gid === '1202694315710867') clientName = f.text_value;
                        if (f.gid === '1202694285232176') clientEmail = f.text_value;
                        if (f.gid === '1211493772039109') brokerAppointed = f.text_value;
                        if (f.gid === '1212556552447200') internalIntroducer = f.text_value;
                    });
                }
            } catch (e) { console.error('Asana fetch failed', e); }
        }

        const currentYear = new Date().getFullYear();
        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const caseReference = `AWM-${currentYear}-W${randomSuffix}`;

        const newCase = await base44.asServiceRole.entities.MortgageCase.create({
            reference: caseReference,
            asana_task_gid: taskGid,
            asana_project_gid: asanaProjectGid,
            asana_section: sectionGid,
            client_name: clientName,
            client_email: clientEmail,
            insightly_id: insightlyId,
            internal_introducer: internalIntroducer,
            mortgage_broker_appointed: brokerAppointed,
            case_type: 'case',
            case_status: 'incomplete',
            created_from_asana: true,
            stage: 'intake_received',
            asana_last_synced: new Date().toISOString()
        });

        // POST COMMENT
        if (asanaToken) {
            try {
                await fetch(`https://app.asana.com/api/1.0/tasks/${taskGid}/stories`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${asanaToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: { text: `🔗 CASE LINKED: ${caseReference}\nStatus: Awaiting intake` } })
                });
            } catch (e) { }
        }

        return Response.json({ success: true, id: newCase.id }, { status: 200 });

    } catch (error) {
        console.error('❌ Error:', error.message);
        return Response.json({ error: 'Server error' }, { status: 500 });
    }
});
