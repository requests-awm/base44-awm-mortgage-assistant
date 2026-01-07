import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { format } from 'npm:date-fns';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportType, emailTo, startDate, endDate } = await req.json();

    // Generate report data
    const reportResponse = await base44.functions.invoke('generateReport', {
      reportType,
      startDate,
      endDate
    });
    const reportData = reportResponse.data;

    const start = format(new Date(startDate), 'dd MMM yyyy');
    const end = format(new Date(endDate), 'dd MMM yyyy');

    // Build email body
    let emailBody = generateEmailBody(reportType, reportData, start, end);

    // Send email
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: emailTo,
      subject: `AWM ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report - ${start} to ${end}`,
      body: emailBody
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Email report error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateEmailBody(reportType, data, startDate, endDate) {
  let body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e293b;">AWM ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</h2>
      <p style="color: #64748b;">Period: ${startDate} to ${endDate}</p>
      <p style="color: #64748b;">Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
  `;

  if (reportType === 'pipeline') {
    body += `
      <h3 style="color: #1e293b;">Summary</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Total Cases</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${data.summary.total}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Active Cases</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${data.summary.active}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Needs Review</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #f59e0b;">${data.summary.needsReview}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Completed</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #10b981;">${data.summary.completed}</td>
        </tr>
      </table>

      <h3 style="color: #1e293b; margin-top: 30px;">Stage Breakdown</h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${data.stageBreakdown.map(s => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${s.stage}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${s.count}</td>
          </tr>
        `).join('')}
      </table>
    `;
  } else if (reportType === 'progression') {
    body += `
      <h3 style="color: #1e293b;">Conversion Metrics</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Intake → Review</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${data.conversionMetrics.intakeToReview.rate}%</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">${data.conversionMetrics.intakeToReview.count} cases</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Review → Delivery</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${data.conversionMetrics.reviewToDelivery.rate}%</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">${data.conversionMetrics.reviewToDelivery.count} cases</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Proceed Rate</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${data.conversionMetrics.proceedRate.rate}%</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">${data.conversionMetrics.proceedRate.count} proceeded</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Completion Rate</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #10b981;">${data.conversionMetrics.completionRate.rate}%</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">${data.conversionMetrics.completionRate.count} completed</td>
        </tr>
      </table>
    `;
  } else if (reportType === 'broker') {
    body += `
      <h3 style="color: #1e293b;">Top Performers</h3>
      <ol style="padding-left: 20px;">
        ${data.topPerformers.map(p => `
          <li style="margin-bottom: 10px;">
            <strong>${p.name}</strong><br>
            <span style="color: #64748b;">Cases: ${p.casesCompleted} | Conversion: ${p.conversionRate}%</span>
          </li>
        `).join('')}
      </ol>

      <h3 style="color: #1e293b; margin-top: 30px;">All Brokers</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #e2e8f0;">Broker</th>
            <th style="padding: 8px; text-align: center; border-bottom: 2px solid #e2e8f0;">Cases</th>
            <th style="padding: 8px; text-align: center; border-bottom: 2px solid #e2e8f0;">Conversion</th>
          </tr>
        </thead>
        <tbody>
          ${data.brokerMetrics.map(b => `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${b.broker}</td>
              <td style="padding: 8px; text-align: center; border-bottom: 1px solid #e2e8f0;">${b.casesHandled}</td>
              <td style="padding: 8px; text-align: center; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: ${b.conversionRate >= 70 ? '#10b981' : b.conversionRate >= 50 ? '#f59e0b' : '#ef4444'};">${b.conversionRate}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  body += `
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
      <p style="color: #94a3b8; font-size: 12px;">
        This is an automated report from AWM Mortgage Pre-Quote & Triage Agent.
      </p>
    </div>
  `;

  return body;
}