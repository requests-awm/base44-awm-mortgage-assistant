import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] createCaseFromN8n - Request received:`, req.method);

  // CORS headers for external access
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return Response.json(
      { success: false, error: 'Method not allowed. Use POST.' },
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    // Parse JSON payload
    const payload = await req.json();
    console.log('[createCaseFromN8n] Payload received:', payload);

    const base44 = createClientFromRequest(req);

    // Check for duplicates using asana_task_gid
    if (payload.asana_task_gid) {
      const existingCases = await base44.asServiceRole.entities.MortgageCase.filter({
        asana_task_gid: payload.asana_task_gid
      });

      if (existingCases.length > 0) {
        const existingCase = existingCases[0];
        console.log('[createCaseFromN8n] Duplicate detected:', existingCase.reference);
        
        return Response.json({
          success: true,
          message: 'Duplicate - case already exists',
          existing_reference: existingCase.reference,
          case_id: existingCase.id
        }, { status: 200, headers: corsHeaders });
      }
    }

    // Prepare case data
    const caseData = {
      reference: payload.case_reference || `AWM-${Date.now().toString(36).toUpperCase()}`,
      asana_task_gid: payload.asana_task_gid || null,
      asana_project_gid: payload.asana_project_gid || null,
      asana_section: payload.asana_section || null,
      asana_task_url: payload.asana_task_gid 
        ? `https://app.asana.com/0/0/${payload.asana_task_gid}`
        : null,
      client_name: payload.client_name || 'Unknown Client',
      client_email: payload.client_email || null,
      insightly_id: payload.insightly_id || null,
      internal_introducer: payload.internal_introducer || null,
      mortgage_broker_appointed: payload.mortgage_broker_appointed || null,
      case_type: payload.case_type || 'case',
      case_status: payload.case_status || 'incomplete',
      created_from_asana: true,
      stage: payload.stage || 'intake_received',
      stage_entered_at: new Date().toISOString(),
      asana_last_synced: new Date().toISOString(),
      data_complete: false,
      email_status: 'not_generated'
    };

    console.log('[createCaseFromN8n] Creating case with data:', caseData);

    // Create the MortgageCase using service role (no user auth needed)
    const newCase = await base44.asServiceRole.entities.MortgageCase.create(caseData);
    
    console.log('[createCaseFromN8n] ✅ Case created successfully:', {
      id: newCase.id,
      reference: newCase.reference,
      asana_task_gid: newCase.asana_task_gid
    });

    // Create audit log
    try {
      await base44.asServiceRole.entities.AuditLog.create({
        case_id: newCase.id,
        action: 'Case created from n8n webhook',
        action_category: 'intake',
        actor: 'agent',
        details: {
          source: 'n8n',
          asana_task_gid: payload.asana_task_gid,
          timestamp: new Date().toISOString()
        },
        stage_to: caseData.stage,
        timestamp: new Date().toISOString()
      });
    } catch (auditError) {
      console.error('[createCaseFromN8n] Audit log failed (non-critical):', auditError.message);
    }

    // Return success response
    return Response.json({
      success: true,
      case_id: newCase.id,
      case_reference: newCase.reference,
      message: 'Case created successfully from n8n'
    }, { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('[createCaseFromN8n] ❌ Error:', error.message);
    console.error('[createCaseFromN8n] Stack:', error.stack);
    
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500, headers: corsHeaders });
  }
});