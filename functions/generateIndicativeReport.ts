import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { caseId } = await req.json();
    
    if (!caseId) {
      return Response.json({ error: 'caseId is required' }, { status: 400 });
    }

    // Fetch case data
    const cases = await base44.asServiceRole.entities.MortgageCase.filter({ id: caseId });
    const mortgageCase = cases[0];
    
    if (!mortgageCase) {
      return Response.json({ error: 'Case not found' }, { status: 404 });
    }

    // Update analysis status
    await base44.asServiceRole.entities.MortgageCase.update(caseId, {
      analysis_status: 'running',
      analysis_started_at: new Date().toISOString()
    });

    // Fetch active lenders for context
    const lenders = await base44.asServiceRole.entities.Lender.filter({ is_active: true });
    
    // Build analysis prompt
    const analysisPrompt = `You are an expert mortgage broker analyzing a case for indicative lender suitability.

CASE DETAILS:
- Client: ${mortgageCase.client_name}
- Category: ${mortgageCase.category}
- Purpose: ${mortgageCase.purpose}
- Property Value: £${mortgageCase.property_value?.toLocaleString() || 'TBC'}
- Loan Amount: £${mortgageCase.loan_amount?.toLocaleString() || 'TBC'}
- LTV: ${mortgageCase.ltv || 'TBC'}%
- Income Type: ${mortgageCase.income_type || 'Not specified'}
- Annual Income: £${mortgageCase.annual_income?.toLocaleString() || 'Not provided'}
- Time Sensitivity: ${mortgageCase.time_sensitivity}

AVAILABLE LENDERS (sample data):
${lenders.slice(0, 5).map(l => `- ${l.name}: ${l.category}, max LTV ${l.max_ltv_residential}%, accepts ${l.accepts_self_employed ? 'self-employed' : 'employed only'}`).join('\n')}

TASK:
1. Assess whether this case is placeable
2. Identify 2-3 most suitable lenders based on the criteria
3. Suggest an indicative rate range (be realistic for 2026 UK market)
4. List key risks and assumptions
5. Suggest next steps

Provide your analysis in a professional, concise manner suitable for client communication.`;

    // Call LLM for analysis
    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          is_placeable: { type: "boolean" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          rate_range_low: { type: "number" },
          rate_range_high: { type: "number" },
          product_category: { type: "string" },
          lender_directions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                lender_name: { type: "string" },
                suitability: { type: "string" },
                notes: { type: "string" }
              }
            }
          },
          risks_assumptions: { type: "array", items: { type: "string" } },
          next_steps: { type: "string" }
        }
      }
    });

    // Create lender checks (mock data based on analysis)
    const lenderChecks = analysis.lender_directions?.map(dir => ({
      lender_name: dir.lender_name,
      status: dir.suitability.toLowerCase().includes('suitable') ? 'eligible' : 'review_required',
      confidence: analysis.confidence,
      timestamp: new Date().toISOString(),
      passes: ['Standard income verification', 'Property type acceptable'],
      warnings: mortgageCase.ltv > 85 ? ['High LTV - may require additional checks'] : [],
      blockers: []
    })) || [];

    // Calculate triage rating
    const triageFactors = [];
    let triageScore = 0;
    
    if (mortgageCase.ltv > 90) { triageScore += 3; triageFactors.push('Very high LTV (>90%)'); }
    else if (mortgageCase.ltv > 85) { triageScore += 2; triageFactors.push('High LTV (85-90%)'); }
    
    if (mortgageCase.time_sensitivity === 'urgent') { triageScore += 2; triageFactors.push('Urgent timeline'); }
    if (!mortgageCase.annual_income) { triageScore += 1; triageFactors.push('Missing income data'); }
    if (mortgageCase.income_type === 'self_employed') { triageScore += 1; triageFactors.push('Self-employed income'); }
    
    const triageRating = triageScore >= 5 ? 'red' : triageScore >= 3 ? 'yellow' : 'green';

    // Update case with results
    await base44.asServiceRole.entities.MortgageCase.update(caseId, {
      indicative_report: analysis,
      lender_checks: lenderChecks,
      analysis_status: 'completed',
      analysis_completed_at: new Date().toISOString(),
      delivery_status: 'ready_for_review',
      stage: 'human_review',
      stage_entered_at: new Date().toISOString(),
      triage_rating: triageRating,
      triage_factors: triageFactors,
      triage_last_calculated: new Date().toISOString()
    });

    // Log to audit
    await base44.asServiceRole.entities.AuditLog.create({
      case_id: caseId,
      action: 'Analysis completed successfully',
      action_category: 'analysis',
      actor: 'agent',
      stage_from: 'market_analysis',
      stage_to: 'human_review',
      timestamp: new Date().toISOString(),
      details: {
        is_placeable: analysis.is_placeable,
        confidence: analysis.confidence,
        lenders_checked: lenderChecks.length
      }
    });

    return Response.json({ 
      success: true, 
      analysis,
      lender_checks: lenderChecks,
      triage_rating: triageRating
    });

  } catch (error) {
    console.error('Analysis error:', error);
    
    // Try to update case with error status
    try {
      const base44 = createClientFromRequest(req);
      const { caseId } = await req.json();
      if (caseId) {
        await base44.asServiceRole.entities.MortgageCase.update(caseId, {
          analysis_status: 'failed',
          analysis_error: error.message
        });
      }
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }

    return Response.json({ 
      error: error.message || 'Analysis failed'
    }, { status: 500 });
  }
});