import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';
import { format } from 'npm:date-fns';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportType, format: exportFormat, startDate, endDate } = await req.json();

    // Generate report data
    const reportResponse = await base44.functions.invoke('generateReport', {
      reportType,
      startDate,
      endDate
    });
    const reportData = reportResponse.data;

    const start = format(new Date(startDate), 'yyyy-MM-dd');
    const end = format(new Date(endDate), 'yyyy-MM-dd');
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');

    if (exportFormat === 'csv') {
      const csv = generateCSV(reportType, reportData);
      return Response.json({
        content: csv,
        filename: `${reportType}-report-${timestamp}.csv`
      });
    } else {
      const pdf = generatePDF(reportType, reportData, start, end);
      const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdf)));
      return Response.json({
        content: pdfBase64,
        filename: `${reportType}-report-${timestamp}.pdf`
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateCSV(reportType, data) {
  let csv = '';

  if (reportType === 'pipeline') {
    csv = 'Pipeline Status Report\n\n';
    csv += 'Summary\n';
    csv += 'Metric,Value\n';
    csv += `Total Cases,${data.summary.total}\n`;
    csv += `Active Cases,${data.summary.active}\n`;
    csv += `Needs Review,${data.summary.needsReview}\n`;
    csv += `Completed,${data.summary.completed}\n\n`;
    
    csv += 'Stage Breakdown\n';
    csv += 'Stage,Count\n';
    data.stageBreakdown.forEach(s => {
      csv += `${s.stage},${s.count}\n`;
    });

    csv += '\nCategory Distribution\n';
    csv += 'Category,Count\n';
    data.categoryBreakdown.forEach(c => {
      csv += `${c.category},${c.count}\n`;
    });
  } else if (reportType === 'progression') {
    csv = 'Case Progression Report\n\n';
    csv += 'Conversion Metrics\n';
    csv += 'Metric,Rate,Count\n';
    csv += `Intake to Review,${data.conversionMetrics.intakeToReview.rate}%,${data.conversionMetrics.intakeToReview.count}\n`;
    csv += `Review to Delivery,${data.conversionMetrics.reviewToDelivery.rate}%,${data.conversionMetrics.reviewToDelivery.count}\n`;
    csv += `Proceed Rate,${data.conversionMetrics.proceedRate.rate}%,${data.conversionMetrics.proceedRate.count}\n`;
    csv += `Completion Rate,${data.conversionMetrics.completionRate.rate}%,${data.conversionMetrics.completionRate.count}\n\n`;

    csv += 'Average Stage Duration\n';
    csv += 'Stage,Days\n';
    data.averageTimelines.forEach(t => {
      csv += `${t.stage},${t.avgDays}\n`;
    });
  } else if (reportType === 'broker') {
    csv = 'Broker Performance Report\n\n';
    csv += 'Broker,Cases Handled,Active Cases,Conversion Rate,Avg Days to Complete,Performance\n';
    data.brokerMetrics.forEach(b => {
      csv += `${b.broker},${b.casesHandled},${b.activeCases},${b.conversionRate}%,${b.avgDaysToComplete},${b.performance}\n`;
    });
  }

  return csv;
}

function generatePDF(reportType, data, startDate, endDate) {
  const doc = new jsPDF();
  let yPos = 20;

  // Header
  doc.setFontSize(20);
  doc.text(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`, 20, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.text(`Period: ${startDate} to ${endDate}`, 20, yPos);
  doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 20, yPos + 5);
  yPos += 20;

  if (reportType === 'pipeline') {
    // Summary
    doc.setFontSize(14);
    doc.text('Summary', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.text(`Total Cases: ${data.summary.total}`, 30, yPos);
    doc.text(`Active: ${data.summary.active}`, 30, yPos + 6);
    doc.text(`Needs Review: ${data.summary.needsReview}`, 30, yPos + 12);
    doc.text(`Completed: ${data.summary.completed}`, 30, yPos + 18);
    yPos += 30;

    // Stage Breakdown
    doc.setFontSize(14);
    doc.text('Stage Breakdown', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    data.stageBreakdown.forEach(s => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(`${s.stage}: ${s.count}`, 30, yPos);
      yPos += 6;
    });
  } else if (reportType === 'progression') {
    doc.setFontSize(14);
    doc.text('Conversion Metrics', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.text(`Intake → Review: ${data.conversionMetrics.intakeToReview.rate}% (${data.conversionMetrics.intakeToReview.count})`, 30, yPos);
    doc.text(`Review → Delivery: ${data.conversionMetrics.reviewToDelivery.rate}% (${data.conversionMetrics.reviewToDelivery.count})`, 30, yPos + 6);
    doc.text(`Proceed Rate: ${data.conversionMetrics.proceedRate.rate}% (${data.conversionMetrics.proceedRate.count})`, 30, yPos + 12);
    doc.text(`Completion Rate: ${data.conversionMetrics.completionRate.rate}% (${data.conversionMetrics.completionRate.count})`, 30, yPos + 18);
    yPos += 30;

    doc.setFontSize(14);
    doc.text('Average Stage Duration', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    data.averageTimelines.forEach(t => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(`${t.stage}: ${t.avgDays} days`, 30, yPos);
      yPos += 6;
    });
  } else if (reportType === 'broker') {
    doc.setFontSize(14);
    doc.text('Broker Performance', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    data.brokerMetrics.forEach(b => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(`${b.broker}`, 30, yPos);
      doc.text(`Cases: ${b.casesHandled} | Active: ${b.activeCases} | Conversion: ${b.conversionRate}%`, 35, yPos + 5);
      yPos += 12;
    });
  }

  return doc.output('arraybuffer');
}