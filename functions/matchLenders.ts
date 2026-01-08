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

    // Fetch all active lenders
    const allLenders = await base44.asServiceRole.entities.Lender.filter({ is_active: true });

    // Filter lenders based on rules
    const matchedLenders = allLenders.filter(lender => {
      const ltv = mortgageCase.ltv || 0;
      const income = mortgageCase.annual_income || 0;
      const category = mortgageCase.category;

      // High Street rules
      if (lender.category === 'high_street') {
        if (ltv > 90) return false;
        if (category === 'ltd_company') return false;
        if (income < 25000) return false;
      }

      // Specialist rules
      if (lender.category === 'specialist') {
        if (ltv > 95) return false;
      }

      // Building Society rules
      if (lender.category === 'building_society') {
        if (ltv > 85) return false;
        if (category === 'later_life') return false;
      }

      return true;
    });

    // Calculate confidence scores
    const lendersWithConfidence = matchedLenders.map(lender => {
      let confidence = 50; // Baseline

      if (mortgageCase.ltv && mortgageCase.ltv < 75) {
        confidence += 20;
      }

      if (mortgageCase.annual_income && mortgageCase.annual_income > 50000) {
        confidence += 15;
      }

      if (mortgageCase.category === 'residential') {
        confidence += 15;
      }

      // Cap at 100%
      confidence = Math.min(confidence, 100);

      return {
        name: lender.name,
        type: lender.category,
        confidence: confidence
      };
    });

    // Sort alphabetically by name
    lendersWithConfidence.sort((a, b) => a.name.localeCompare(b.name));

    return Response.json({
      success: true,
      total_matches: lendersWithConfidence.length,
      lenders: lendersWithConfidence
    });

  } catch (error) {
    console.error('Lender matching error:', error);
    return Response.json({ 
      error: error.message || 'Lender matching failed'
    }, { status: 500 });
  }
});