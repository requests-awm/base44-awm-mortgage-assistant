import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const currentYear = new Date().getFullYear();
    
    const scenarios = [
      {
        name: 'Mostly Complete Case',
        data: {
          client_name: 'Jane Smith',
          client_email: 'jane@example.com',
          client_phone: '07123456789',
          property_value: 350000,
          loan_amount: 280000,
          purpose: 'purchase',
          // Missing: category, income, employment
          case_status: 'incomplete',
          created_from_asana: true,
          asana_task_gid: `TEST-${Date.now()}-1`
        }
      },
      {
        name: 'Minimal Data Case',
        data: {
          client_name: 'Bob Johnson',
          client_email: 'bob@example.com',
          // Missing almost everything
          case_status: 'incomplete',
          created_from_asana: true,
          asana_task_gid: `TEST-${Date.now()}-2`
        }
      },
      {
        name: 'No Client Info Case',
        data: {
          property_value: 500000,
          loan_amount: 400000,
          purpose: 'remortgage',
          // Missing client details
          case_status: 'incomplete',
          created_from_asana: true,
          asana_task_gid: `TEST-${Date.now()}-3`
        }
      },
      {
        name: 'Remortgage Case with Existing Details',
        data: {
          client_name: 'Sarah Williams',
          client_email: 'sarah@example.com',
          client_phone: '+447987654321',
          property_value: 450000,
          loan_amount: 270000,
          purpose: 'remortgage',
          existing_lender: 'Halifax',
          existing_rate: 3.5,
          existing_product_type: 'Fixed',
          existing_product_end_date: '2026-06-30',
          existing_monthly_payment: 1500,
          switching_reason: 'Rate Expiry',
          // Missing: category, income, employment
          case_status: 'incomplete',
          created_from_asana: true,
          asana_task_gid: `TEST-${Date.now()}-4`
        }
      },
      {
        name: 'Case with Deadline',
        data: {
          client_name: 'Tom Davis',
          client_email: 'tom@example.com',
          client_phone: '020 1234 5678',
          property_value: 600000,
          loan_amount: 450000,
          purpose: 'purchase',
          client_deadline: '2026-02-15',
          // Missing: category, income, employment
          case_status: 'incomplete',
          created_from_asana: true,
          asana_task_gid: `TEST-${Date.now()}-5`
        }
      }
    ];

    const createdCases = [];

    for (const scenario of scenarios) {
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const caseReference = `AWM-${currentYear}-TEST${randomSuffix}`;

      const testCase = await base44.asServiceRole.entities.MortgageCase.create({
        ...scenario.data,
        reference: caseReference,
        case_type: 'case',
        stage: 'intake_received',
        email_status: 'not_generated'
      });

      console.log(`✅ ${scenario.name}: ${testCase.reference}`);
      createdCases.push({
        id: testCase.id,
        reference: testCase.reference,
        scenario: scenario.name,
        url: `/intake-form?case_id=${testCase.id}`
      });
    }

    return Response.json({
      success: true,
      message: `Created ${createdCases.length} test cases`,
      cases: createdCases
    });

  } catch (error) {
    console.error('Error seeding test data:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});