import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

    // Log the request
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📨 ASANA WEBHOOK REQUEST');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`⏰ Timestamp: ${timestamp}`);
    console.log(`🔐 Hook Secret Header: ${hookSecret ? 'Present' : 'Absent'}`);
    console.log(`📋 Request Headers:`, {
      'content-type': req.headers.get('content-type'),
      'x-hook-secret': hookSecret,
      'x-hook-id': req.headers.get('x-hook-id'),
      'user-agent': req.headers.get('user-agent'),
    });
    console.log(`📦 Body Length: ${bodyText.length} bytes`);
    if (bodyText && bodyText.length < 1000) {
      console.log(`📦 Body: ${bodyText}`);
    } else if (bodyText) {
      console.log(`📦 Body (truncated): ${bodyText.substring(0, 500)}...`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // PART 1: HANDSHAKE VERIFICATION
    if (hookSecret) {
      console.log(' HANDSHAKE DETECTED');
      console.log(`✅ Storing hook secret: ${hookSecret}`);
      
      console.log('✅ Handshake completed successfully');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // FIXED: Return empty body for handshake as per Asana requirement
      return new Response(null, {
        status: 200,
        headers: {
          'X-Hook-Secret': hookSecret
        }
      });
    }

    // PART 2: REAL EVENT PROCESSING
    console.log('📨 EVENT RECEIVED (not handshake)');
    
    let eventData;
    try {
      eventData = JSON.parse(bodyText);
      console.log(`✅ Event parsed successfully`);
    } catch (parseError) {
      console.error('❌ Failed to parse event body:', parseError.message);
      return Response.json(
        { 
          success: true, 
          message: 'Event received but could not parse' 
        },
        { status: 200 }
      );
    }

    // Extract event details
    const event = eventData.events?.[0];
    if (!event) {
      console.warn('⚠️ No events in payload');
      return Response.json(
        { 
          success: true, 
          message: 'No events to process' 
        },
        { status: 200 }
      );
    }

    const taskGid = event.resource?.gid;
    const sectionGid = event.parent?.gid;
    const action = event.action;

    console.log(`📌 Event Action: ${action}`);
    console.log(`📌 Task GID: ${taskGid}`);
    console.log(`📌 Section GID: ${sectionGid}`);
    console.log(`📌 Resource Type: ${event.resource?.resource_type || 'unknown'}`);

    // Only process "added" action (ignore other actions for now)
    if (action !== 'added') {
      console.log(`⏭️ Ignoring action "${action}"`);
      return Response.json(
        { 
          success: true, 
          message: `Action "${action}" ignored` 
        },
        { status: 200 }
      );
    }

    if (!taskGid) {
      console.warn('⚠️ No task GID in event');
      return Response.json(
        { 
          success: true, 
          message: 'No task GID found' 
        },
        { status: 200 }
      );
    }

    // Initialize Base44 client without authentication (using service role)
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
    console.log(`🔍 Checking for duplicate case with asana_task_gid: ${taskGid}`);
    try {
      const existingCases = await base44.asServiceRole.entities.MortgageCase.filter({
        asana_task_gid: taskGid
      });

      if (existingCases && existingCases.length > 0) {
        const existingCase = existingCases[0];
        console.log(`⚠️ DUPLICATE DETECTED: Case matches existing case ${existingCase.reference}`);
        
        return Response.json(
          { 
            success: true, 
            message: 'Case already exists',
            case_reference: existingCase.reference
          },
          { status: 200 }
        );
      }

      // NO DUPLICATE FOUND
      console.log(`✅ No duplicate found - processing new case from task ${taskGid}`);
      
      const asanaToken = Deno.env.get('ASANA_API_TOKEN');
      const asanaProjectGid = Deno.env.get('ASANA_PROJECT_GID') || '1212782871770137';

      if (!asanaToken) {
        console.error('❌ ASANA_API_TOKEN not set');
        return Response.json({ success: false, error: 'Configuration missing' }, { status: 500 });
      }

      // FETCH TASK DETAILS
      let taskDetails = { name: null, custom_fields: [] };
      try {
        const asanaResponse = await fetch(
          `https://app.asana.com/api/1.0/tasks/${taskGid}?opt_fields=name,custom_fields`,
          {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${asanaToken}` }
          }
        );
        if (asanaResponse.ok) {
          const asanaData = await asanaResponse.json();
          taskDetails = asanaData.data;
          console.log(`✅ Fetched task: ${taskDetails.name}`);
        }
      } catch (err) {
        console.error(`⚠️ Failed to fetch task details: ${err.message}`);
      }

      // EXTRACT FIELDS
      let clientName, clientEmail, insightlyId, brokerAppointed, internalIntroducer;
      if (taskDetails.custom_fields) {
        taskDetails.custom_fields.forEach(field => {
          if (field.gid === '1202693938754570') insightlyId = field.text_value;
          if (field.gid === '1202694315710867') clientName = field.text_value;
          if (field.gid === '1202694285232176') clientEmail = field.text_value;
          if (field.gid === '1211493772039109') brokerAppointed = field.text_value;
          if (field.gid === '1212556552447200') internalIntroducer = field.text_value;
        });
      }

      // GENERATE REFERENCE
      const currentYear = new Date().getFullYear();
      let nextNumber = 1;
      // In production specific logic for finding max reference would go here
      // For now using simple logic or random specific to webhook to avoid collision
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const caseReference = `AWM-${currentYear}-W${randomSuffix}`;

      // CREATE CASE
      const caseData = {
        reference: caseReference,
        asana_task_gid: taskGid,
        asana_project_gid: asanaProjectGid,
        asana_section: sectionGid,
        client_name: clientName || taskDetails.name || 'Asana Task',
        client_email: clientEmail,
        insightly_id: insightlyId,
        internal_introducer: internalIntroducer,
        mortgage_broker_appointed: brokerAppointed,
        case_type: 'case',
        case_status: 'incomplete',
        created_from_asana: true,
        stage: 'intake_received',
        asana_last_synced: new Date().toISOString()
      };

      console.log(`💾 Creating MortgageCase ${caseReference}`);
      const newCase = await base44.asServiceRole.entities.MortgageCase.create(caseData);

      // POST COMMENT
      try {
        await fetch(
          `https://app.asana.com/api/1.0/tasks/${taskGid}/stories`,
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${asanaToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: {
                text: `🔗 MORTGAGE CASE LINKED TO BASE44\nStatus: Awaiting intake completion\nCase ID: ${caseReference}\n⏳ Next Step: Assistant to complete intake form`
              }
            })
          }
        );
        console.log(`✅ Posted confirmation comment to Asana`);
      } catch (e) {
        console.warn(`⚠️ Failed to post comment: ${e.message}`);
      }

      return Response.json(
        { 
          success: true, 
          message: 'Case created successfully',
          case_reference: caseReference,
          case_id: newCase.id
        },
        { status: 200 }
      );

    } catch (dbError) {
      console.error('❌ Database error:', dbError.message);
      return Response.json({ success: true, message: 'Processing error logged', error: dbError.message }, { status: 200 });
    }

  } catch (error) {
    console.error('❌ WEBHOOK ERROR:', error.message);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});