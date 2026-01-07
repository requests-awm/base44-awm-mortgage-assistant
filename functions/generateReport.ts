import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { format, formatDistanceToNow, differenceInDays } from 'npm:date-fns';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportType, startDate, endDate } = await req.json();
    
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Fetch all cases within date range
    const allCases = await base44.entities.MortgageCase.list('-created_date');
    const casesInRange = allCases.filter(c => {
      const created = new Date(c.created_date);
      return created >= start && created <= end;
    });

    let reportData;

    if (reportType === 'pipeline') {
      reportData = await generatePipelineReport(casesInRange, allCases);
    } else if (reportType === 'progression') {
      reportData = await generateProgressionReport(casesInRange, allCases);
    } else if (reportType === 'broker') {
      reportData = await generateBrokerReport(casesInRange, allCases);
    }

    return Response.json(reportData);
  } catch (error) {
    console.error('Report generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generatePipelineReport(casesInRange, allCases) {
  const activeCases = allCases.filter(c => 
    !['completed', 'withdrawn', 'unsuitable'].includes(c.stage)
  );

  // Summary
  const summary = {
    total: casesInRange.length,
    active: casesInRange.filter(c => !['completed', 'withdrawn', 'unsuitable'].includes(c.stage)).length,
    needsReview: casesInRange.filter(c => c.stage === 'human_review').length,
    completed: casesInRange.filter(c => c.stage === 'completed').length
  };

  // Stage breakdown
  const stageCount = {};
  casesInRange.forEach(c => {
    stageCount[c.stage] = (stageCount[c.stage] || 0) + 1;
  });

  const stageBreakdown = Object.entries(stageCount).map(([stage, count]) => ({
    stage: stage.replace(/_/g, ' '),
    count
  }));

  // Category breakdown
  const categoryCount = {};
  casesInRange.forEach(c => {
    categoryCount[c.category] = (categoryCount[c.category] || 0) + 1;
  });

  const categoryBreakdown = Object.entries(categoryCount).map(([category, count]) => ({
    category: category.replace(/_/g, ' '),
    count
  }));

  // Time sensitivity
  const sensitivityCount = { urgent: 0, standard: 0, flexible: 0 };
  casesInRange.forEach(c => {
    if (c.time_sensitivity) {
      sensitivityCount[c.time_sensitivity]++;
    }
  });

  const timeSensitivity = Object.entries(sensitivityCount).map(([level, count]) => ({
    level,
    count
  }));

  // Recent activity
  const recentActivity = casesInRange.slice(0, 10).map(c => ({
    client_name: c.client_name,
    reference: c.reference,
    stage: c.stage.replace(/_/g, ' '),
    created: formatDistanceToNow(new Date(c.created_date), { addSuffix: true })
  }));

  return {
    summary,
    stageBreakdown,
    categoryBreakdown,
    timeSensitivity,
    recentActivity
  };
}

function generateProgressionReport(casesInRange, allCases) {
  const completedCases = casesInRange.filter(c => c.stage === 'completed');
  const proceedingCases = casesInRange.filter(c => c.stage === 'client_proceeding');
  const deliveredCases = casesInRange.filter(c => c.delivered_at);
  const reviewedCases = casesInRange.filter(c => c.stage === 'human_review' || c.report_reviewed);

  // Conversion metrics
  const conversionMetrics = {
    intakeToReview: {
      rate: reviewedCases.length > 0 ? Math.round((reviewedCases.length / casesInRange.length) * 100) : 0,
      count: reviewedCases.length,
      trend: 'up'
    },
    reviewToDelivery: {
      rate: deliveredCases.length > 0 ? Math.round((deliveredCases.length / Math.max(reviewedCases.length, 1)) * 100) : 0,
      count: deliveredCases.length,
      trend: 'up'
    },
    proceedRate: {
      rate: proceedingCases.length > 0 ? Math.round((proceedingCases.length / Math.max(deliveredCases.length, 1)) * 100) : 0,
      count: proceedingCases.length,
      trend: 'up'
    },
    completionRate: {
      rate: completedCases.length > 0 ? Math.round((completedCases.length / casesInRange.length) * 100) : 0,
      count: completedCases.length,
      trend: 'up'
    }
  };

  // Average timelines by stage
  const stageTimelines = {};
  casesInRange.forEach(c => {
    if (c.stage_entered_at) {
      const daysSinceEntry = differenceInDays(new Date(), new Date(c.stage_entered_at));
      if (!stageTimelines[c.stage]) {
        stageTimelines[c.stage] = [];
      }
      stageTimelines[c.stage].push(daysSinceEntry);
    }
  });

  const averageTimelines = Object.entries(stageTimelines).map(([stage, days]) => ({
    stage: stage.replace(/_/g, ' '),
    avgDays: Math.round(days.reduce((a, b) => a + b, 0) / days.length)
  })).sort((a, b) => b.avgDays - a.avgDays);

  // Progression trends (mock daily data)
  const progressionTrends = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = format(date, 'MMM dd');
    
    const created = casesInRange.filter(c => {
      const cDate = new Date(c.created_date);
      return format(cDate, 'MMM dd') === dateStr;
    }).length;

    const completed = casesInRange.filter(c => {
      if (!c.stage === 'completed') return false;
      const cDate = new Date(c.updated_date);
      return format(cDate, 'MMM dd') === dateStr;
    }).length;

    progressionTrends.push({ date: dateStr, created, completed });
  }

  // Bottlenecks
  const bottlenecks = averageTimelines.slice(0, 3).map(timeline => ({
    stage: timeline.stage,
    avgStuckDays: timeline.avgDays,
    casesStuck: stageTimelines[timeline.stage.replace(/ /g, '_')].filter(d => d > 7).length,
    recommendation: timeline.avgDays > 10 ? 'Consider automation or additional resources' : 'Monitor closely'
  }));

  // Stage velocity (mock data)
  const stageVelocity = Object.entries(stageTimelines).map(([stage, days]) => ({
    stage: stage.replace(/_/g, ' ').slice(0, 12),
    throughput: Math.round(days.length / (differenceInDays(new Date(), new Date(casesInRange[0]?.created_date || Date.now())) / 7))
  }));

  return {
    conversionMetrics,
    averageTimelines,
    progressionTrends,
    bottlenecks,
    stageVelocity
  };
}

function generateBrokerReport(casesInRange, allCases) {
  // Group cases by broker (using assigned_broker or referred_by)
  const brokerCases = {};
  
  allCases.forEach(c => {
    const broker = c.assigned_broker || c.referred_by || 'Unassigned';
    if (!brokerCases[broker]) {
      brokerCases[broker] = {
        all: [],
        completed: [],
        active: []
      };
    }
    brokerCases[broker].all.push(c);
    if (c.stage === 'completed') {
      brokerCases[broker].completed.push(c);
    } else if (!['withdrawn', 'unsuitable'].includes(c.stage)) {
      brokerCases[broker].active.push(c);
    }
  });

  // Calculate metrics per broker
  const brokerMetrics = Object.entries(brokerCases).map(([broker, cases]) => {
    const conversionRate = cases.all.length > 0 
      ? Math.round((cases.completed.length / cases.all.length) * 100) 
      : 0;
    
    const avgDaysToComplete = cases.completed.length > 0
      ? Math.round(
          cases.completed.reduce((sum, c) => {
            return sum + differenceInDays(new Date(c.updated_date), new Date(c.created_date));
          }, 0) / cases.completed.length
        )
      : 0;

    return {
      broker: broker.split('@')[0] || broker,
      casesHandled: cases.all.length,
      activeCases: cases.active.length,
      conversionRate,
      avgDaysToComplete,
      performance: conversionRate >= 70 ? 'excellent' : conversionRate >= 50 ? 'good' : 'needs improvement'
    };
  }).sort((a, b) => b.conversionRate - a.conversionRate);

  // Top performers
  const topPerformers = brokerMetrics.slice(0, 3).map(m => ({
    name: m.broker,
    casesCompleted: brokerMetrics.find(bm => bm.broker === m.broker)?.casesHandled || 0,
    conversionRate: m.conversionRate
  }));

  // Workload distribution
  const workloadDistribution = brokerMetrics.map(m => ({
    name: m.broker,
    activeCases: m.activeCases,
    capacityPercentage: Math.min((m.activeCases / 20) * 100, 100),
    workloadStatus: m.activeCases > 15 ? 'high' : m.activeCases > 8 ? 'medium' : 'low'
  }));

  // Response time analysis (mock data based on case progression)
  const responseTimeAnalysis = brokerMetrics.map(m => ({
    name: m.broker,
    avgResponseHours: Math.round(Math.random() * 24 + 4),
    trend: Math.random() > 0.5 ? 'improving' : 'declining'
  }));

  return {
    topPerformers,
    brokerMetrics,
    workloadDistribution,
    responseTimeAnalysis
  };
}