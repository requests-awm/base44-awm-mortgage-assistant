import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Find cases in market_analysis stage
        const cases = await base44.asServiceRole.entities.MortgageCase.filter({
            stage: 'market_analysis',
            agent_paused: false
        });

        console.log(`Found ${cases.length} cases ready for market analysis`);

        const results = [];

        for (const mortgageCase of cases) {
            try {
                console.log(`Processing case ${mortgageCase.reference}...`);

                // Get lender data for context
                const lenders = await base44.asServiceRole.entities.Lender.filter({
                    is_active: true
                });

                // Build context for agent
                const caseContext = `
MORTGAGE CASE ANALYSIS REQUEST

Case Reference: ${mortgageCase.reference}
Client: ${mortgageCase.client_name}

CASE DETAILS:
- Category: ${mortgageCase.category}
- Purpose: ${mortgageCase.purpose}
- Property Value: £${mortgageCase.property_value?.toLocaleString()}
- Loan Amount: £${mortgageCase.loan_amount?.toLocaleString()}
- LTV: ${mortgageCase.ltv}%
- Income Type: ${mortgageCase.income_type}
- Annual Income: ${mortgageCase.annual_income ? `£${mortgageCase.annual_income.toLocaleString()}` : 'Not provided'}
- Time Sensitivity: ${mortgageCase.time_sensitivity}
${mortgageCase.rate_expiry_date ? `- Rate Expiry: ${mortgageCase.rate_expiry_date}` : ''}
${mortgageCase.notes ? `- Notes: ${mortgageCase.notes}` : ''}

AVAILABLE LENDERS (${lenders.length} active):
${lenders.slice(0, 20).map(l => `
- ${l.name} (${l.category})
  Products: ${l.products_offered?.join(', ')}
  Max LTV Residential: ${l.max_ltv_residential}%, BTL: ${l.max_ltv_btl}%
  Accepts: ${l.accepts_self_employed ? 'SE' : ''} ${l.accepts_contractors ? 'Contractors' : ''} ${l.accepts_ltd_company ? 'Ltd' : ''}
  Credit Stance: ${l.credit_stance}
  ${l.notes ? `Notes: ${l.notes}` : ''}
`).join('\n')}

TASK:
Generate an indicative mortgage options report for this case. Your response MUST be ONLY a valid JSON object with this exact structure:

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

CRITICAL REQUIREMENTS:
- Provide 2-5 lender directions (NEVER just one)
- Use probabilistic language
- Include rate ranges not exact rates
- List all assumptions and risks
- Be specific about why each lender is suitable
- Consider the client's income type and LTV carefully

Respond with ONLY the JSON object, no other text.
`;

                // Call the agent
                const agentResponse = await base44.asServiceRole.agents.chat({
                    agent_name: 'mortgage_triage',
                    messages: [
                        {
                            role: 'user',
                            content: caseContext
                        }
                    ]
                });

                console.log('Agent raw response:', agentResponse);

                // Extract JSON from response
                let report;
                const lastMessage = agentResponse.messages[agentResponse.messages.length - 1];
                const content = lastMessage?.content || '';

                // Try to extract JSON from markdown code blocks or raw text
                const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                                content.match(/```\s*([\s\S]*?)\s*```/) ||
                                [null, content];
                
                const jsonString = jsonMatch[1] || content;
                
                try {
                    report = JSON.parse(jsonString.trim());
                } catch (parseError) {
                    console.error('Failed to parse agent response as JSON:', jsonString);
                    throw new Error('Agent did not return valid JSON');
                }

                // Add generation timestamp
                report.generated_at = new Date().toISOString();

                // Update case with report
                await base44.asServiceRole.entities.MortgageCase.update(mortgageCase.id, {
                    indicative_report: report,
                    stage: 'human_review',
                    stage_entered_at: new Date().toISOString()
                });

                // Create audit log
                await base44.asServiceRole.entities.AuditLog.create({
                    case_id: mortgageCase.id,
                    action: 'Indicative report generated',
                    action_category: 'analysis',
                    actor: 'agent',
                    stage_from: 'market_analysis',
                    stage_to: 'human_review',
                    details: {
                        confidence: report.confidence,
                        lender_count: report.lender_directions?.length
                    },
                    timestamp: new Date().toISOString()
                });

                console.log(`✓ Successfully processed case ${mortgageCase.reference}`);
                results.push({
                    case_id: mortgageCase.id,
                    reference: mortgageCase.reference,
                    status: 'success'
                });

            } catch (caseError) {
                console.error(`Failed to process case ${mortgageCase.reference}:`, caseError);
                
                // Log failure but continue with other cases
                await base44.asServiceRole.entities.AuditLog.create({
                    case_id: mortgageCase.id,
                    action: 'Report generation failed',
                    action_category: 'analysis',
                    actor: 'agent',
                    details: {
                        error: caseError.message
                    },
                    timestamp: new Date().toISOString()
                });

                results.push({
                    case_id: mortgageCase.id,
                    reference: mortgageCase.reference,
                    status: 'error',
                    error: caseError.message
                });
            }
        }

        return Response.json({
            processed: results.length,
            results
        });

    } catch (error) {
        console.error('Function error:', error);
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
});