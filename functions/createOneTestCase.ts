import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const testCase = await base44.entities.MortgageCase.create({
      reference: 'TEST-2025-001',
      client_name: 'Jane Test',
      client_email: 'jane@test.com',
      asana_task_gid: 'TEST-123',
      case_status: 'incomplete',
      created_from_asana: true,
      case_type: 'case',
      stage: 'intake_received',
      email_status: 'not_generated',
      property_value: null,
      loan_amount: null,
      category: null,
      purpose: null,
      annual_income: null,
      income_type: null,
      client_phone: null,
      referring_team_member: null,
      referring_team: null
    });

    console.log(`✅ Test case created: ${testCase.reference}`);

    return Response.json({
      success: true,
      caseId: testCase.id,
      reference: testCase.reference,
      url: `/intake-form?case_id=${testCase.id}`
    });

  } catch (error) {
    console.error('Error creating test case:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});