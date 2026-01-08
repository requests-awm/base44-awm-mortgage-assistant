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

    // Call Gemini API for analysis
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    const promptWithSchema = `${analysisPrompt}

IMPORTANT: You must respond with a valid JSON object matching this exact schema:
{
  "is_placeable": boolean,
  "confidence": "high" | "medium" | "low",
  "rate_range_low": number,
  "rate_range_high": number,
  "product_category": string,
  "lender_directions": [
    {
      "lender_name": string,
      "suitability": string,
      "notes": string
    }
  ],
  "risks_assumptions": [string],
  "next_steps": string
}

Respond ONLY with the JSON object, no additional text.`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptWithSchema }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const geminiResponse = await response.json();
    const generatedText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error('No response from Gemini API');
    }

    // Parse JSON from response (remove markdown code blocks if present)
    const cleanedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis = JSON.parse(cleanedText);

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