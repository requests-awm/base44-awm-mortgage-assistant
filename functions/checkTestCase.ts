import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const cases = await base44.asServiceRole.entities.MortgageCase.filter({ 
      reference: 'TEST-2025-001' 
    });
    
    const testCase = cases[0];
    
    if (!testCase) {
      return Response.json({ 
        error: 'Case not found',
        reference: 'TEST-2025-001'
      });
    }
    
    return Response.json({
      case_status: testCase.case_status,
      case_id: testCase.id,
      activated_at: testCase.activated_at,
      client_name: testCase.client_name,
      property_value: testCase.property_value,
      loan_amount: testCase.loan_amount,
      purpose: testCase.purpose,
      category: testCase.category,
      created_from_asana: testCase.created_from_asana,
      reference: testCase.reference,
      stage: testCase.stage
    });
  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { 
      status: 500 
    });
  }
});