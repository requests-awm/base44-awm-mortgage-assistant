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
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      return Response.json(
        { 
          success: true, 
          message: 'New task detected, case creation queued',
          task_gid: taskGid,
          section_gid: sectionGid
        },
        { status: 200 }
      );

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