import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ltv, category, annual_income, income_type, loan_amount, client_age, term_years } = await req.json();

    // Fetch all active lenders
    const allLenders = await base44.entities.Lender.filter({ is_active: true });

    const matchedLenders = [];
    const rejectedLenders = [];

    for (const lender of allLenders) {
      let isRejected = false;
      const rejectionReasons = [];
      const matchReasons = [];

      // Determine relevant max LTV and min income based on category
      let relevantMaxLtv;
      let relevantMinIncome;
      
      if (category === 'buy_to_let') {
        relevantMaxLtv = lender.max_ltv_btl || 0;
        relevantMinIncome = lender.min_income_btl || 0;
      } else {
        relevantMaxLtv = lender.max_ltv_residential || 0;
        relevantMinIncome = lender.min_income_residential || 0;
      }

      // REJECTION RULES

      // Reject if LTV exceeds lender's max
      if (ltv > relevantMaxLtv) {
        isRejected = true;
        rejectionReasons.push(`LTV ${ltv}% exceeds maximum ${relevantMaxLtv}%`);
      } else {
        matchReasons.push(`LTV ${ltv}% is within their ${relevantMaxLtv}% ${category === 'buy_to_let' ? 'BTL' : 'residential'} limit`);
      }

      // Reject if loan amount exceeds max at this LTV
      if (loan_amount && lender.max_loan_at_max_ltv && loan_amount > lender.max_loan_at_max_ltv) {
        isRejected = true;
        rejectionReasons.push(`Loan £${loan_amount.toLocaleString()} exceeds maximum £${lender.max_loan_at_max_ltv.toLocaleString()} at this LTV`);
      } else if (loan_amount && lender.max_loan_at_max_ltv) {
        matchReasons.push(`Loan amount £${loan_amount.toLocaleString()} within their limit of £${lender.max_loan_at_max_ltv.toLocaleString()}`);
      }

      // Reject if income below minimum (if minimum is set)
      if (relevantMinIncome > 0 && annual_income < relevantMinIncome) {
        isRejected = true;
        rejectionReasons.push(`Income £${annual_income.toLocaleString()} below minimum £${relevantMinIncome.toLocaleString()}`);
      } else if (relevantMinIncome > 0) {
        matchReasons.push(`Income £${annual_income.toLocaleString()} meets minimum £${relevantMinIncome.toLocaleString()}`);
      }

      // Reject if self-employed not accepted
      if (income_type === 'self_employed' && !lender.self_employed_accepted) {
        isRejected = true;
        rejectionReasons.push('Does not accept self-employed applicants');
      } else if (income_type === 'self_employed' && lender.self_employed_accepted) {
        matchReasons.push(`Accepts self-employed (${lender.min_years_trading || 2} years trading required)`);
      }

      // Reject if age exceeds max at end of term
      if (client_age && term_years && lender.max_age_end_of_term > 0) {
        const ageAtEndOfTerm = client_age + term_years;
        if (ageAtEndOfTerm > lender.max_age_end_of_term) {
          isRejected = true;
          rejectionReasons.push(`Age ${ageAtEndOfTerm} at end of term exceeds maximum ${lender.max_age_end_of_term}`);
        } else {
          matchReasons.push(`Age ${ageAtEndOfTerm} at end of term within limit of ${lender.max_age_end_of_term}`);
        }
      }

      // Check if employed is accepted (all lenders accept)
      if (income_type === 'employed') {
        matchReasons.push('Accepts employed applicants');
      }

      // If not rejected, calculate confidence score
      if (!isRejected) {
        let confidence = 50; // Baseline
        const confidenceBreakdown = [{ reason: 'Base confidence', points: 50 }];

        // Add 20% if well within LTV limits (10% buffer)
        if (ltv < (relevantMaxLtv - 10)) {
          confidence += 20;
          confidenceBreakdown.push({ reason: 'LTV well within limits', points: 20 });
        }

        // Add 15% if high income
        if (annual_income > 50000) {
          confidence += 15;
          confidenceBreakdown.push({ reason: 'High income', points: 15 });
        }

        // Add 15% if residential category
        if (category === 'residential') {
          confidence += 15;
          confidenceBreakdown.push({ reason: 'Residential category', points: 15 });
        }

        // Add 10% if fast processing
        if (lender.processing_speed === 'fast') {
          confidence += 10;
          confidenceBreakdown.push({ reason: 'Fast processing speed', points: 10 });
        }

        // Subtract 10% if self-employed (slightly harder)
        if (income_type === 'self_employed') {
          confidence -= 10;
          confidenceBreakdown.push({ reason: 'Self-employed applicant', points: -10 });
        }

        // Cap at 100, floor at 0
        confidence = Math.max(0, Math.min(100, confidence));

        matchedLenders.push({
          name: lender.name,
          short_name: lender.short_name || lender.name,
          category: lender.category || null,
          confidence: confidence,
          max_ltv: relevantMaxLtv,
          notes: lender.notes || null,
          match_reasons: matchReasons,
          confidence_breakdown: confidenceBreakdown
        });
      } else {
        rejectedLenders.push({
          name: lender.name,
          category: lender.category || null,
          rejection_reasons: rejectionReasons
        });
      }
    }

    // Sort alphabetically by name
    matchedLenders.sort((a, b) => a.name.localeCompare(b.name));
    rejectedLenders.sort((a, b) => a.name.localeCompare(b.name));

    return Response.json({
      total_matches: matchedLenders.length,
      lenders: matchedLenders,
      rejected_lenders: rejectedLenders,
      total_rejected: rejectedLenders.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Lender matching error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});