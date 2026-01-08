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
      let isRejected = false;

      // Determine relevant max LTV based on category
      let relevantMaxLtv;
      if (category === 'buy_to_let') {
        relevantMaxLtv = lender.max_ltv_btl || 0;
      } else {
        // residential, later_life, or ltd_company use residential LTV
        relevantMaxLtv = lender.max_ltv_residential || 0;
      }

      // REJECTION RULES
      // Reject if LTV exceeds lender's max
      if (ltv > relevantMaxLtv) {
        isRejected = true;
      }

      // Reject if income below minimum
      if (annual_income < lender.min_income) {
        isRejected = true;
      }

      // Reject if self-employed not accepted
      if (income_type === 'self_employed' && !lender.accepts_self_employed) {
        isRejected = true;
      }

      // Reject if contractor not accepted
      if (income_type === 'contractor' && !lender.accepts_contractors) {
        isRejected = true;
      }

      // Reject if ltd_company not accepted
      if (category === 'ltd_company' && !lender.accepts_ltd_company) {
        isRejected = true;
      }

      // Reject if ltd_company not in products offered
      if (category === 'ltd_company' && !lender.products_offered?.includes('ltd_company')) {
        isRejected = true;
      }

      // If not rejected, calculate confidence score
      if (!isRejected) {
        let confidence = 50; // Baseline

        // Add 20% if well within LTV limits (10% buffer)
        if (ltv < (relevantMaxLtv - 10)) {
          confidence += 20;
        }

        // Add 15% if high income
        if (annual_income > 50000) {
          confidence += 15;
        }

        // Add 15% if residential category
        if (category === 'residential') {
          confidence += 15;
        }

        // Add 10% if fast processing
        if (lender.processing_speed === 'fast') {
          confidence += 10;
        }

        // Subtract 10% if self-employed (slightly harder)
        if (income_type === 'self_employed') {
          confidence -= 10;
        }

        // Cap at 100, floor at 0
        confidence = Math.max(0, Math.min(100, confidence));

        matchedLenders.push({
          name: lender.name,
          category: lender.category,
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