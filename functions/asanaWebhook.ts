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
    const body = await req.text();

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
    console.log(`📦 Body Length: ${body.length} bytes`);
    if (body && body.length < 1000) {
      console.log(`📦 Body: ${body}`);
    } else if (body) {
      console.log(`📦 Body (truncated): ${body.substring(0, 500)}...`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // PART 1: HANDSHAKE VERIFICATION
    if (hookSecret) {
      console.log('🤝 HANDSHAKE DETECTED');
      console.log(`✅ Storing hook secret: ${hookSecret}`);
      
      // Note: In production, this should be stored securely
      // For now, we'll return success (the actual persistence 
      // should be handled by setting ASANA_WEBHOOK_SECRET env var)
      
      console.log('✅ Handshake completed successfully');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      return Response.json(
        { 
          success: true, 
          message: 'Handshake completed' 
        },
        {
          status: 200,
          headers: {
            'X-Hook-Secret': hookSecret,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // PART 2: REAL EVENT PROCESSING
    console.log('📨 EVENT RECEIVED (not handshake)');
    
    let eventData;
    try {
      eventData = JSON.parse(body);
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
    console.log(`📌 Event Type: ${event.type || 'unknown'}`);
    console.log(`📌 Full Events Array:`, JSON.stringify(eventData.events, null, 2));

    // Only process "added" action (ignore other actions for now)
    if (action !== 'added') {
      console.log(`⏭️ Ignoring action "${action}" (only processing "added" events)`);
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

    // Initialize Base44 client
    const base44 = createClientFromRequest(req);

    // CHECK FOR DUPLICATE
    console.log(`🔍 Checking for duplicate case with asana_task_gid: ${taskGid}`);
    try {
      const existingCases = await base44.asServiceRole.entities.MortgageCase.filter({
        asana_task_gid: taskGid
      });

      if (existingCases && existingCases.length > 0) {
        const existingCase = existingCases[0];
        console.log(`⚠️ DUPLICATE DETECTED`);
        console.log(`📋 Case Reference: ${existingCase.reference}`);
        console.log(`📋 Case ID: ${existingCase.id}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        return Response.json(
          { 
            success: true, 
            message: 'Case already exists',
            case_reference: existingCase.reference,
            case_id: existingCase.id
          },
          { status: 200 }
        );
      }

      // NO DUPLICATE FOUND
      console.log(`✅ No duplicate found - new task detected`);
      console.log(`📨 Task GID ${taskGid} will be queued for case creation`);
      
      // FETCH TASK DETAILS FROM ASANA
      console.log(`🔗 Fetching task details from Asana API...`);
      const asanaToken = Deno.env.get('ASANA_API_TOKEN');
      const asanaProjectGid = Deno.env.get('ASANA_PROJECT_GID') || '1212782871770137';

      if (!asanaToken) {
        console.error('❌ ASANA_API_TOKEN not set in environment');
        return Response.json(
          { 
            success: false, 
            message: 'Asana API token not configured',
            error: 'ASANA_API_TOKEN missing'
          },
          { status: 500 }
        );
      }

      let taskDetails;
      try {
        const asanaResponse = await fetch(
          `https://app.asana.com/api/1.0/tasks/${taskGid}?opt_fields=name,custom_fields`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${asanaToken}`,
              'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(3000) // 3 second timeout
          }
        );

        if (!asanaResponse.ok) {
          console.error(`❌ Asana API error: ${asanaResponse.status} ${asanaResponse.statusText}`);
          const errorBody = await asanaResponse.text();
          console.error(`📌 Error body: ${errorBody}`);
          throw new Error(`Asana API returned ${asanaResponse.status}`);
        }

        const asanaData = await asanaResponse.json();
        taskDetails = asanaData.data;
        console.log(`✅ Task details fetched from Asana`);
        console.log(`📌 Task name: ${taskDetails.name}`);
      } catch (asanaError) {
        console.error(`❌ Asana API fetch failed: ${asanaError.message}`);
        console.warn(`⚠️ Will create case with limited data`);
        taskDetails = { name: null, custom_fields: [] };
      }

      // EXTRACT CUSTOM FIELDS
      console.log(`📋 Extracting custom fields from Asana response...`);
      let clientName = null;
      let clientEmail = null;
      let insightlyId = null;
      let brokerAppointed = null;
      let internalIntroducer = null;

      if (taskDetails.custom_fields && Array.isArray(taskDetails.custom_fields)) {
        for (const field of taskDetails.custom_fields) {
          if (field.gid === '1202693938754570') {
            insightlyId = field.text_value;
            console.log(`📌 Insightly ID: ${insightlyId}`);
          } else if (field.gid === '1202694315710867') {
            clientName = field.text_value;
            console.log(`📌 Client Name: ${clientName}`);
          } else if (field.gid === '1202694285232176') {
            clientEmail = field.text_value;
            console.log(`📌 Client Email: ${clientEmail}`);
          } else if (field.gid === '1211493772039109') {
            brokerAppointed = field.text_value;
            console.log(`📌 Broker Appointed: ${brokerAppointed}`);
          } else if (field.gid === '1212556552447200') {
            internalIntroducer = field.text_value;
            console.log(`📌 Internal Introducer: ${internalIntroducer}`);
          }
        }
      }

      // GENERATE CASE REFERENCE
      console.log(`🔢 Generating case reference...`);
      const currentYear = new Date().getFullYear();
      
      try {
        // Query existing cases for this year
        const existingCasesThisYear = await base44.asServiceRole.entities.MortgageCase.filter({});
        
        // Find highest number for this year
        let highestNumber = 0;
        for (const caseRecord of existingCasesThisYear) {
          if (caseRecord.reference && caseRecord.reference.startsWith(`AWM-${currentYear}-`)) {
            const numberStr = caseRecord.reference.replace(`AWM-${currentYear}-`, '');
            const number = parseInt(numberStr, 10);
            if (!isNaN(number) && number > highestNumber) {
              highestNumber = number;
            }
          }
        }

        const nextNumber = highestNumber + 1;
        const caseReference = `AWM-${currentYear}-${String(nextNumber).padStart(3, '0')}`;
        console.log(`✅ Case reference generated: ${caseReference}`);

        // CREATE MORTGAGECASE RECORD
        console.log(`💾 Creating MortgageCase record...`);
        const caseData = {
          reference: caseReference,
          asana_task_gid: taskGid,
          asana_project_gid: asanaProjectGid,
          asana_section: sectionGid,
          client_name: clientName || 'Asana Task',
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

        console.log(`📦 Case data to create:`, JSON.stringify(caseData, null, 2));

        const newCase = await base44.asServiceRole.entities.MortgageCase.create(caseData);
        console.log(`✅ MortgageCase created successfully`);
        console.log(`📌 Case ID: ${newCase.id}`);
        console.log(`📌 Case Reference: ${newCase.reference}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        return Response.json(
          { 
            success: true, 
            message: 'Case created successfully',
            case_reference: newCase.reference,
            case_id: newCase.id,
            task_gid: taskGid
          },
          { status: 200 }
        );

      } catch (caseCreationError) {
        console.error(`❌ Case creation failed: ${caseCreationError.message}`);
        console.error(`📌 Error details:`, caseCreationError);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        return Response.json(
          { 
            success: false, 
            message: 'Failed to create case',
            error: caseCreationError.message,
            task_gid: taskGid
          },
          { status: 500 }
        );
      }

    } catch (dbError) {
      console.error('❌ Database error checking for duplicates:', dbError.message);
      console.error('📌 Error details:', dbError);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Still return 200 to acknowledge the webhook
      return Response.json(
        { 
          success: true, 
          message: 'Event received (processing error logged)',
          error: dbError.message
        },
        { status: 200 }
      );
    }

  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ WEBHOOK ERROR');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return Response.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
});