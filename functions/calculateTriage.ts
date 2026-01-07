import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { ltv, annual_income, time_sensitivity, category } = await req.json();

        let score = 0;
        const factors = [];
        const timestamp = new Date().toISOString();

        // LTV rules
        if (ltv > 90) {
            score += 30;
            factors.push("High LTV (>90%)");
        } else if (ltv >= 75) {
            score += 15;
            factors.push("Elevated LTV (75-90%)");
        } else if (ltv < 75) {
            score -= 10;
        }

        // Income rules
        if (!annual_income || annual_income < 20000) {
            score += 20;
            factors.push("Low income (<£20k)");
        }

        // Time sensitivity rules
        if (time_sensitivity === "urgent") {
            score += 10;
            factors.push("Urgent timeline");
        }

        // Category rules
        if (category === "later_life" || category === "ltd_company") {
            score += 15;
            factors.push("Specialist category");
        }
        
        // Determine rating and color
        let rating;
        let color;
        if (score >= 40) {
            rating = "red";
            color = "#EF4444";
        } else if (score >= 20) {
            rating = "yellow";
            color = "#F59E0B";
        } else {
            rating = "green";
            color = "#10B981";
        }

        return Response.json({ rating, color, score, factors, timestamp });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});