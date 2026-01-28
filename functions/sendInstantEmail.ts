import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Proxy function to trigger Zapier webhook for instant email sending
 * Avoids CORS issues by making server-side request
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get authenticated user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const payload = await req.json();

    // Validate required fields
    if (!payload.case_id || !payload.client_email || !payload.email_subject || !payload.email_draft) {
      return Response.json(
        { success: false, error: 'Missing required fields: case_id, client_email, email_subject, email_draft' },
        { status: 400 }
      );
    }

    console.log('[INSTANT SEND PROXY] Triggering Zapier webhook for case:', payload.case_id);

    // Zapier webhook URL
    const ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/25927525/uqlxaap/';

    // Trigger Zapier webhook (server-side, no CORS!)
    const zapierResponse = await fetch(ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!zapierResponse.ok) {
      console.error('[INSTANT SEND PROXY] Zapier webhook failed:', zapierResponse.status, zapierResponse.statusText);
      return Response.json(
        { success: false, error: `Zapier webhook failed: ${zapierResponse.status} ${zapierResponse.statusText}` },
        { status: 500 }
      );
    }

    console.log('[INSTANT SEND PROXY] Zapier webhook triggered successfully');

    return Response.json({
      success: true,
      message: 'Email sent via Zapier',
      broker_name: payload.broker_display_name,
      case_id: payload.case_id
    });

  } catch (error) {
    console.error('[INSTANT SEND PROXY] Error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
});
