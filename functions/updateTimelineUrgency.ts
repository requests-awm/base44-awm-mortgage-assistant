import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // This is called by scheduled task, no user auth needed
    const openStages = [
      'intake_received', 'data_completion', 'market_analysis', 
      'human_review', 'pending_delivery', 'awaiting_decision',
      'decision_chase', 'client_proceeding', 'broker_validation',
      'application_submitted', 'offer_received'
    ];

    // Fetch all open cases
    const allCases = await base44.asServiceRole.entities.MortgageCase.list();
    const openCases = allCases.filter(c => openStages.includes(c.stage));

    let updated = 0;
    let overdue = 0;

    for (const mortgageCase of openCases) {
      if (!mortgageCase.client_deadline) {
        // Update to standard if not already
        if (mortgageCase.timeline_urgency !== 'standard') {
          await base44.asServiceRole.entities.MortgageCase.update(mortgageCase.id, {
            timeline_urgency: 'standard',
            days_until_deadline: null
          });
          updated++;
        }
        continue;
      }

      const now = new Date();
      const deadline = new Date(mortgageCase.client_deadline);
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysLeft = Math.ceil((deadline - now) / msPerDay);

      let urgency;
      if (daysLeft < 0) {
        urgency = 'overdue';
        overdue++;
      } else if (daysLeft <= 7) {
        urgency = 'critical';
      } else if (daysLeft <= 30) {
        urgency = 'soon';
      } else {
        urgency = 'standard';
      }

      // Update if changed
      if (mortgageCase.timeline_urgency !== urgency || mortgageCase.days_until_deadline !== daysLeft) {
        await base44.asServiceRole.entities.MortgageCase.update(mortgageCase.id, {
          timeline_urgency: urgency,
          days_until_deadline: daysLeft
        });
        updated++;
      }
    }

    return Response.json({
      success: true,
      cases_checked: openCases.length,
      cases_updated: updated,
      overdue_cases: overdue,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Timeline update error:', error);
    return Response.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});