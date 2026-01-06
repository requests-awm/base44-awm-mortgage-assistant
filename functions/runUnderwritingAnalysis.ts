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
            return Response.json({ error: 'Case ID required' }, { status: 400 });
        }

        // Get case
        const cases = await base44.asServiceRole.entities.MortgageCase.filter({ id: caseId });
        const mortgageCase = cases[0];

        if (!mortgageCase) {
            return Response.json({ error: 'Case not found' }, { status: 404 });
        }

        // Get all active lenders
        const lenders = await base44.asServiceRole.entities.Lender.filter({
            is_active: true,
            products_offered: { $in: [mortgageCase.category] }
        });

        // Get all available products for this category
        const products = await base44.asServiceRole.entities.LenderProduct.filter({
            category: mortgageCase.category,
            is_available: true
        });

        console.log(`Analyzing case against ${lenders.length} lenders and ${products.length} products`);

        // Build analysis context
        const analysisContext = `
UNDERWRITING ANALYSIS REQUEST

Case Reference: ${mortgageCase.reference}
Client: ${mortgageCase.client_name}

CASE DETAILS:
- Category: ${mortgageCase.category}
- Purpose: ${mortgageCase.purpose}
- Property Value: £${mortgageCase.property_value?.toLocaleString()}
- Loan Amount: £${mortgageCase.loan_amount?.toLocaleString()}
- LTV: ${mortgageCase.ltv}%
- Income Type: ${mortgageCase.income_type}
- Annual Income: ${mortgageCase.annual_income ? `£${mortgageCase.annual_income.toLocaleString()}` : 'NOT PROVIDED'}
- Time Sensitivity: ${mortgageCase.time_sensitivity}
${mortgageCase.rate_expiry_date ? `- Rate Expiry: ${mortgageCase.rate_expiry_date}` : ''}

AVAILABLE LENDERS (${lenders.length}):
${lenders.map(l => `
${l.name} (${l.category}):
- Max LTV: ${mortgageCase.category === 'buy_to_let' ? l.max_ltv_btl : l.max_ltv_residential}%
- Min Income: ${l.min_income ? `£${l.min_income}` : 'None'}
- Min Credit Score: ${l.min_credit_score || 'Not specified'}
- Max Age: ${l.max_age || 'Not specified'}
- Max Term: ${l.max_loan_term_years || 'Not specified'} years
- Credit Stance: ${l.credit_stance}
- Accepts: ${l.accepts_self_employed ? 'SE ' : ''}${l.accepts_contractors ? 'Contractors ' : ''}${l.accepts_ltd_company ? 'Ltd' : ''}
- Property Restrictions: ${l.property_type_restrictions ? JSON.stringify(l.property_type_restrictions) : 'None'}
${l.notes ? `- Notes: ${l.notes}` : ''}
`).join('\n')}

AVAILABLE PRODUCTS (${products.length}):
${products.slice(0, 30).map(p => `
${p.lender_name} - ${p.product_name}:
- Rate: ${p.initial_rate}% ${p.rate_type} for ${p.initial_period_months} months
- LTV Range: ${p.min_ltv || 0}-${p.max_ltv}%
- Loan Range: £${p.min_loan_amount || 0}-£${p.max_loan_amount || 'unlimited'}
- Property Value Range: £${p.min_property_value || 0}-£${p.max_property_value || 'unlimited'}
- Fees: Arrangement £${p.arrangement_fee || 0}, Booking £${p.booking_fee || 0}
- Max Term: ${p.max_term_years} years
- Income Requirements: ${p.income_requirements ? JSON.stringify(p.income_requirements) : 'Standard'}
- Credit Requirements: ${p.credit_requirements ? JSON.stringify(p.credit_requirements) : 'Standard'}
- Property Criteria: ${p.property_criteria ? JSON.stringify(p.property_criteria) : 'Standard'}
- Age Criteria: ${p.age_criteria ? JSON.stringify(p.age_criteria) : 'Standard'}
`).join('\n')}

TASK:
Perform a comprehensive underwriting analysis of this case against ALL available lender and product criteria.

CRITICAL: Your response MUST be ONLY a valid JSON object (no markdown, no explanation) with this EXACT structure:

{
  "overall_risk_level": "low" | "medium" | "high",
  "underwritable": boolean,
  "confidence": "high" | "medium" | "low",
  "blockers": [
    {
      "severity": "critical" | "major" | "minor",
      "category": string,
      "description": string,
      "affected_lenders": [string],
      "mitigation": string
    }
  ],
  "warnings": [
    {
      "category": string,
      "description": string,
      "recommendation": string
    }
  ],
  "missing_information": [string],
  "recommended_products": [
    {
      "lender_name": string,
      "product_name": string,
      "product_id": string,
      "suitability_score": number,
      "key_features": [string],
      "potential_issues": [string]
    }
  ],
  "alternative_options": [
    {
      "strategy": string,
      "description": string,
      "potential_lenders": [string]
    }
  ],
  "next_steps": [string],
  "broker_notes": string
}

Be thorough and specific. Reference actual criteria. Identify ALL potential issues.
`;

        // Call underwriting agent
        const agentResponse = await base44.asServiceRole.agents.chat({
            agent_name: 'underwriting_assistant',
            messages: [{ role: 'user', content: analysisContext }]
        });

        console.log('Agent response received');

        // Parse response
        const lastMessage = agentResponse.messages[agentResponse.messages.length - 1];
        const content = lastMessage?.content || '';

        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                         content.match(/```\s*([\s\S]*?)\s*```/) ||
                         [null, content];
        
        const jsonString = jsonMatch[1] || content;
        let analysis;
        
        try {
            analysis = JSON.parse(jsonString.trim());
        } catch (parseError) {
            console.error('Failed to parse agent response:', jsonString);
            throw new Error('Agent did not return valid JSON');
        }

        // Add metadata
        analysis.analyzed_at = new Date().toISOString();
        analysis.analyzed_by = user.email;

        // Store analysis in case
        await base44.asServiceRole.entities.MortgageCase.update(caseId, {
            underwriting_analysis: analysis
        });

        // Create audit log
        await base44.asServiceRole.entities.AuditLog.create({
            case_id: caseId,
            action: 'Underwriting analysis completed',
            action_category: 'analysis',
            actor: 'user',
            actor_email: user.email,
            details: {
                risk_level: analysis.overall_risk_level,
                underwritable: analysis.underwritable,
                blockers_count: analysis.blockers?.length || 0,
                warnings_count: analysis.warnings?.length || 0
            },
            timestamp: new Date().toISOString()
        });

        return Response.json({ 
            success: true,
            analysis
        });

    } catch (error) {
        console.error('Underwriting analysis error:', error);
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
});