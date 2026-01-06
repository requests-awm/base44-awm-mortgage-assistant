import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        console.log('Starting chase processing...');

        // Get system settings
        const allSettings = await base44.asServiceRole.entities.SystemSettings.list();
        const settingsMap = {};
        allSettings.forEach(s => {
            settingsMap[s.setting_key] = s.setting_value;
        });

        const firstChaseAfterHours = parseInt(settingsMap.first_chase_after_hours || '48');
        const subsequentChaseIntervalHours = parseInt(settingsMap.subsequent_chase_interval_hours || '72');
        const maxChaseAttempts = parseInt(settingsMap.max_chase_attempts || '3');

        // Find cases awaiting decision or in chase stage
        const casesToCheck = await base44.asServiceRole.entities.MortgageCase.filter({
            stage: { $in: ['awaiting_decision', 'decision_chase'] },
            client_decision: 'pending',
            agent_paused: false
        });

        console.log(`Found ${casesToCheck.length} cases to check for chases`);

        const results = [];

        for (const mortgageCase of casesToCheck) {
            try {
                if (!mortgageCase.delivered_at || !mortgageCase.client_email) {
                    continue;
                }

                const now = new Date();
                const deliveredAt = new Date(mortgageCase.delivered_at);
                const lastChaseAt = mortgageCase.last_chase_at ? new Date(mortgageCase.last_chase_at) : null;
                const chaseCount = mortgageCase.chase_count || 0;

                // Check if chase is needed
                let shouldChase = false;
                let chaseReason = '';

                if (chaseCount === 0) {
                    // First chase after initial delivery
                    const hoursSinceDelivery = (now - deliveredAt) / (1000 * 60 * 60);
                    if (hoursSinceDelivery >= firstChaseAfterHours) {
                        shouldChase = true;
                        chaseReason = 'First follow-up';
                    }
                } else if (chaseCount < maxChaseAttempts && lastChaseAt) {
                    // Subsequent chases
                    const hoursSinceLastChase = (now - lastChaseAt) / (1000 * 60 * 60);
                    if (hoursSinceLastChase >= subsequentChaseIntervalHours) {
                        shouldChase = true;
                        chaseReason = `Follow-up attempt ${chaseCount + 1}`;
                    }
                }

                if (!shouldChase) {
                    continue;
                }

                console.log(`Sending chase for case ${mortgageCase.reference} (${chaseReason})`);

                // Build chase email
                const isFirstChase = chaseCount === 0;
                const isFinalChase = chaseCount === maxChaseAttempts - 1;

                const emailBody = `
Dear ${mortgageCase.client_name},

${isFirstChase ? 
`We hope you received our indicative mortgage report sent on ${new Date(deliveredAt).toLocaleDateString()}.` :
`We're following up on your mortgage enquiry (Reference: ${mortgageCase.reference}).`}

We wanted to check if you've had a chance to review our indicative mortgage options and whether you'd like to proceed with a full application.

To move forward, please reply to this email confirming:
1. You wish to proceed with a full mortgage application
2. You acknowledge the £750 advisory fee

${isFinalChase ? `
IMPORTANT: This is our final follow-up. If we don't hear from you within the next few days, we'll assume you've decided not to proceed at this time and will close your case. 

You're always welcome to get in touch again in the future if your circumstances change.
` : `
If you have any questions or need clarification on any aspect of the report, please don't hesitate to ask.
`}

Best regards,
AWM Mortgage Team

Reference: ${mortgageCase.reference}
`;

                // Send chase email
                await base44.asServiceRole.integrations.Core.SendEmail({
                    from_name: 'AWM Mortgage Team',
                    to: mortgageCase.client_email,
                    subject: `${isFinalChase ? 'Final ' : ''}Follow-up: Your Mortgage Options - ${mortgageCase.reference}`,
                    body: emailBody
                });

                const newChaseCount = chaseCount + 1;
                const newStage = newChaseCount >= maxChaseAttempts ? 'withdrawn' : 'decision_chase';

                // Update case
                await base44.asServiceRole.entities.MortgageCase.update(mortgageCase.id, {
                    chase_count: newChaseCount,
                    last_chase_at: now.toISOString(),
                    stage: newStage,
                    stage_entered_at: now.toISOString(),
                    ...(newStage === 'withdrawn' && { client_decision: 'no_response' })
                });

                // Create chase log
                await base44.asServiceRole.entities.ChaseLog.create({
                    case_id: mortgageCase.id,
                    chase_number: newChaseCount,
                    chase_type: 'email',
                    message_summary: chaseReason,
                    sent_at: now.toISOString(),
                    triggered_by: 'agent'
                });

                // Create audit log
                await base44.asServiceRole.entities.AuditLog.create({
                    case_id: mortgageCase.id,
                    action: `Chase email sent (attempt ${newChaseCount})`,
                    action_category: 'chase',
                    actor: 'agent',
                    details: {
                        chase_number: newChaseCount,
                        to: mortgageCase.client_email,
                        is_final: isFinalChase
                    },
                    stage_from: mortgageCase.stage,
                    stage_to: newStage,
                    timestamp: now.toISOString()
                });

                results.push({
                    case_id: mortgageCase.id,
                    reference: mortgageCase.reference,
                    chase_number: newChaseCount,
                    status: 'sent'
                });

                console.log(`✓ Chase sent for ${mortgageCase.reference}`);

            } catch (error) {
                console.error(`Failed to process chase for case ${mortgageCase.id}:`, error);
                results.push({
                    case_id: mortgageCase.id,
                    reference: mortgageCase.reference,
                    status: 'error',
                    error: error.message
                });
            }
        }

        return Response.json({
            success: true,
            processed: casesToCheck.length,
            chases_sent: results.filter(r => r.status === 'sent').length,
            results
        });

    } catch (error) {
        console.error('Chase processing failed:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});