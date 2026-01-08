import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ltv, category, annual_income, income_type } = await req.json();

    // Fetch all active lenders
    const allLenders = await base44.entities.Lender.filter({ is_active: true });

    const matchedLenders = [];

    for (const lender of allLenders) {
      let isMatch = false;

      // Apply matching rules based on lender category
      if (lender.category === 'high_street') {
        // HIGH STREET rules
        if (ltv <= 90 && category !== 'ltd_company' && annual_income >= 25000) {
          isMatch = true;
        }
      } else if (lender.category === 'specialist') {
        // SPECIALIST rules
        if (ltv <= 95) {
          isMatch = true;
        }
      } else if (lender.category === 'building_society') {
        // BUILDING SOCIETY rules
        if (ltv <= 85 && category !== 'later_life') {
          isMatch = true;
        }
      }

      // If matched, calculate confidence score
      if (isMatch) {
        let confidence = 50; // Baseline

        // Add bonuses
        if (ltv < 75) confidence += 20;
        if (annual_income > 50000) confidence += 15;
        if (category === 'residential') confidence += 15;

        // Cap at 100
        confidence = Math.min(confidence, 100);

        matchedLenders.push({
          name: lender.name,
          type: lender.category,
          confidence: confidence
        });
      }
    }

    // Sort alphabetically by name
    matchedLenders.sort((a, b) => a.name.localeCompare(b.name));

    return Response.json({
      total_matches: matchedLenders.length,
      lenders: matchedLenders,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Lender matching error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});