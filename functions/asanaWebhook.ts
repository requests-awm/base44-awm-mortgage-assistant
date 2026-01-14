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
    
    if (body) {
      try {
        const data = JSON.parse(body);
        console.log(`✅ Event parsed successfully`);
        console.log(`📌 Event type: ${data.events?.[0]?.type || 'unknown'}`);
        console.log(`📌 Resource type: ${data.events?.[0]?.resource?.resource_type || 'unknown'}`);
      } catch (parseError) {
        console.warn('⚠️ Failed to parse event body:', parseError.message);
      }
    }

    console.log('✅ Event received and logged');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return Response.json(
      { 
        success: true, 
        message: 'Event received' 
      },
      { status: 200 }
    );

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