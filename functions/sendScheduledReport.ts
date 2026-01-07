import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { subDays, subWeeks, format } from 'npm:date-fns';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This function runs as a scheduled task, so no user authentication needed
    // We'll use service role to access data

    const { frequency, reportType, recipients } = await req.json();

    console.log(`Generating ${frequency} ${reportType} report for ${recipients.join(', ')}`);

    // Determine date range based on frequency
    let startDate, endDate;
    endDate = new Date();

    if (frequency === 'daily') {
      startDate = subDays(endDate, 1);
    } else if (frequency === 'weekly') {
      startDate = subWeeks(endDate, 1);
    } else {
      // monthly
      startDate = subDays(endDate, 30);
    }

    // Generate report data using service role
    const allCases = await base44.asServiceRole.entities.MortgageCase.list('-created_date');
    const casesInRange = allCases.filter(c => {
      const created = new Date(c.created_date);
      return created >= startDate && created <= endDate;
    });

    // Generate simple summary for automated reports
    const summary = {
      total: casesInRange.length,
      active: casesInRange.filter(c => !['completed', 'withdrawn', 'unsuitable'].includes(c.stage)).length,
      needsReview: casesInRange.filter(c => c.stage === 'human_review').length,
      completed: casesInRange.filter(c => c.stage === 'completed').length,
      newCases: casesInRange.filter(c => {
        const daysSinceCreated = Math.floor((Date.now() - new Date(c.created_date).getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceCreated <= (frequency === 'daily' ? 1 : 7);
      }).length
    };

    const start = format(startDate, 'dd MMM yyyy');
    const end = format(endDate, 'dd MMM yyyy');

    // Build email body
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e293b;">AWM ${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Summary Report</h2>
        <p style="color: #64748b;">Period: ${start} to ${end}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">

        <h3 style="color: #1e293b;">Key Metrics</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
          <div style="padding: 15px; background: #f8fafc; border-radius: 8px;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">New Cases</p>
            <p style="color: #1e293b; font-size: 24px; font-weight: bold; margin: 5px 0 0 0;">${summary.newCases}</p>
          </div>
          <div style="padding: 15px; background: #f8fafc; border-radius: 8px;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">Active Cases</p>
            <p style="color: #1e293b; font-size: 24px; font-weight: bold; margin: 5px 0 0 0;">${summary.active}</p>
          </div>
          <div style="padding: 15px; background: #fef3c7; border-radius: 8px;">
            <p style="color: #92400e; font-size: 12px; margin: 0;">Needs Review</p>
            <p style="color: #92400e; font-size: 24px; font-weight: bold; margin: 5px 0 0 0;">${summary.needsReview}</p>
          </div>
          <div style="padding: 15px; background: #d1fae5; border-radius: 8px;">
            <p style="color: #065f46; font-size: 12px; margin: 0;">Completed</p>
            <p style="color: #065f46; font-size: 24px; font-weight: bold; margin: 5px 0 0 0;">${summary.completed}</p>
          </div>
        </div>

        ${summary.needsReview > 0 ? `
          <div style="padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <strong style="color: #92400e;">Action Required:</strong>
            <p style="color: #92400e; margin: 5px 0 0 0;">${summary.needsReview} case${summary.needsReview > 1 ? 's' : ''} awaiting human review.</p>
          </div>
        ` : ''}

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="color: #94a3b8; font-size: 12px;">
          This is an automated ${frequency} report from AWM Mortgage Pre-Quote & Triage Agent.
        </p>
      </div>
    `;

    // Send to all recipients
    for (const recipient of recipients) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: recipient,
        subject: `AWM ${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Summary - ${format(endDate, 'dd MMM yyyy')}`,
        body: emailBody
      });
      console.log(`Report sent to ${recipient}`);
    }

    return Response.json({ 
      success: true, 
      reportsSent: recipients.length,
      summary 
    });
  } catch (error) {
    console.error('Scheduled report error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});