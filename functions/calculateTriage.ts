import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ltv, annual_income, category, income_type, purpose } = await req.json();

    let score = 0;
    const factors = [];

    // LTV scoring
    if (ltv > 90) {
      score += 30;
      factors.push('High LTV (>90%)');
    } else if (ltv >= 75) {
      score += 20;
      factors.push('Elevated LTV (75-90%)');
    } else if (ltv >= 60) {
      score += 5;
      factors.push('Moderate LTV');
    } else if (ltv < 60) {
      score -= 10;
    }

    // Income scoring
    if (annual_income) {
      if (annual_income < 20000) {
        score += 25;
        factors.push('Low income (<£20k)');
      } else if (annual_income < 30000) {
        score += 10;
        factors.push('Below average income');
      } else if (annual_income > 80000) {
        score -= 10;
      } else if (annual_income > 50000) {
        score -= 5;
      }
    }

    // Income type scoring
    if (income_type === 'self_employed') {
      score += 15;
      factors.push('Self-employed income');
    } else if (income_type === 'contractor') {
      score += 10;
      factors.push('Contractor income');
    }



    // Category complexity
    if (category === 'later_life') {
      score += 15;
      factors.push('Specialist category (Later Life)');
    } else if (category === 'ltd_company') {
      score += 15;
      factors.push('Specialist category (Ltd Co)');
    } else if (category === 'buy_to_let') {
      score += 5;
      factors.push('BTL complexity');
    }

    // Purpose scoring
    if (purpose === 'rate_expiry') {
      score -= 5;
    }

    // Determine rating
    let rating, color, label, description;
    if (score < 0) {
      rating = 'blue';
      color = '#3B82F6';
      label = 'Quick Win';
      description = 'Perfect case, any lender, fast approval';
    } else if (score < 20) {
      rating = 'green';
      color = '#10B981';
      label = 'Good Case';
      description = 'Minimal broker effort';
    } else if (score < 40) {
      rating = 'yellow';
      color = '#F59E0B';
      label = 'Needs Attention';
      description = 'Requires broker expertise';
    } else {
      rating = 'red';
      color = '#EF4444';
      label = 'Complex';
      description = 'Specialist required, high effort';
    }

    return Response.json({
      rating,
      color,
      label,
      description,
      score,
      factors,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Triage calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});