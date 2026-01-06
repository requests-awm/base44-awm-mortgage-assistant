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
            return Response.json({ error: 'Case ID is required' }, { status: 400 });
        }

        // Get case details
        const cases = await base44.asServiceRole.entities.MortgageCase.filter({ id: caseId });
        const mortgageCase = cases[0];

        if (!mortgageCase) {
            return Response.json({ error: 'Case not found' }, { status: 404 });
        }

        if (!mortgageCase.indicative_report) {
            return Response.json({ error: 'No report available to send' }, { status: 400 });
        }

        if (!mortgageCase.client_email) {
            return Response.json({ error: 'No client email address' }, { status: 400 });
        }

        const report = mortgageCase.indicative_report;

        // Build email content
        const lenderList = report.lender_directions?.map(ld => 
            `• ${ld.lender_name}: ${ld.suitability}\n  ${ld.notes || ''}`
        ).join('\n\n') || 'No lender directions available';

        const emailBody = `
Dear ${mortgageCase.client_name},

Thank you for your mortgage enquiry. We have completed our initial market analysis and are pleased to share our indicative findings.

INDICATIVE MORTGAGE OPTIONS

Property Value: £${mortgageCase.property_value?.toLocaleString()}
Loan Amount: £${mortgageCase.loan_amount?.toLocaleString()}
Loan-to-Value: ${mortgageCase.ltv}%

MARKET POSITION: ${report.is_placeable ? 'PLACEABLE' : 'REQUIRES REVIEW'}
Confidence: ${report.confidence?.toUpperCase()}

${report.rate_range_low && report.rate_range_high ? 
`Indicative Rate Range: ${report.rate_range_low}% - ${report.rate_range_high}%` : ''}
${report.product_category ? `Product Category: ${report.product_category}` : ''}

LENDER DIRECTIONS:
${lenderList}

${report.risks_assumptions?.length > 0 ? `
IMPORTANT CONSIDERATIONS:
${report.risks_assumptions.map(r => `• ${r}`).join('\n')}
` : ''}

NEXT STEPS:
${report.next_steps || 'Please confirm if you would like to proceed with a full mortgage application.'}

IMPORTANT DISCLAIMERS:
• This is an indicative assessment only, not a mortgage offer
• Rates and products are subject to change
• Full underwriting and credit checks are required
• Proceeding to application will incur a £750 advisory fee

To proceed with your mortgage application, please reply to this email confirming:
1. You wish to proceed with a full application
2. You acknowledge the £750 advisory fee

If you have any questions, please don't hesitate to contact us.

Best regards,
AWM Mortgage Team

Reference: ${mortgageCase.reference}
`;

        // Send email
        await base44.asServiceRole.integrations.Core.SendEmail({
            from_name: 'AWM Mortgage Team',
            to: mortgageCase.client_email,
            subject: `Your Mortgage Options - ${mortgageCase.reference}`,
            body: emailBody
        });

        // Update case
        await base44.asServiceRole.entities.MortgageCase.update(caseId, {
            delivered_at: new Date().toISOString(),
            stage: 'awaiting_decision',
            stage_entered_at: new Date().toISOString(),
            chase_count: 0,
            last_chase_at: null
        });

        // Create audit log
        await base44.asServiceRole.entities.AuditLog.create({
            case_id: caseId,
            action: 'Report delivered to client',
            action_category: 'delivery',
            actor: 'user',
            actor_email: user.email,
            details: {
                to: mortgageCase.client_email,
                sent_at: new Date().toISOString()
            },
            stage_from: mortgageCase.stage,
            stage_to: 'awaiting_decision',
            timestamp: new Date().toISOString()
        });

        return Response.json({ 
            success: true,
            message: 'Report sent successfully',
            delivered_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error sending report:', error);
        return Response.json({ 
            error: error.message || 'Failed to send report' 
        }, { status: 500 });
    }
});