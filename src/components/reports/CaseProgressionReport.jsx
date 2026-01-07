import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Clock, Target } from 'lucide-react';

export default function CaseProgressionReport({ data }) {
  if (!data) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-12 text-center">
          <p className="text-slate-500">No data available</p>
        </CardContent>
      </Card>
    );
  }

  const { 
    conversionMetrics, 
    averageTimelines, 
    progressionTrends, 
    bottlenecks,
    stageVelocity 
  } = data;

  return (
    <div className="space-y-6">
      {/* Conversion Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500">Intake → Review</p>
              {conversionMetrics.intakeToReview.trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {conversionMetrics.intakeToReview.rate}%
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {conversionMetrics.intakeToReview.count} cases
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500">Review → Delivery</p>
              {conversionMetrics.reviewToDelivery.trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {conversionMetrics.reviewToDelivery.rate}%
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {conversionMetrics.reviewToDelivery.count} cases
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500">Proceed Rate</p>
              {conversionMetrics.proceedRate.trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {conversionMetrics.proceedRate.rate}%
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {conversionMetrics.proceedRate.count} proceeded
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500">Completion Rate</p>
              {conversionMetrics.completionRate.trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {conversionMetrics.completionRate.rate}%
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {conversionMetrics.completionRate.count} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progression Trend */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Case Progression Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={progressionTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" fontSize={11} />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="created" 
                stackId="1"
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.6}
                name="Created"
              />
              <Area 
                type="monotone" 
                dataKey="completed" 
                stackId="2"
                stroke="#10b981" 
                fill="#10b981" 
                fillOpacity={0.6}
                name="Completed"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Average Timelines */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Average Stage Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {averageTimelines.map((timeline, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-700">{timeline.stage}</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {timeline.avgDays} days
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-400 rounded-full"
                      style={{ width: `${(timeline.avgDays / 10) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bottlenecks */}
        <Card className="border-0 shadow-sm border-amber-200 bg-amber-50/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-amber-800">
              <Target className="w-4 h-4" />
              Identified Bottlenecks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bottlenecks.map((bottleneck, idx) => (
                <div key={idx} className="p-3 bg-white rounded-lg border border-amber-200">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium text-slate-900">{bottleneck.stage}</span>
                    <Badge variant="outline" className="border-amber-300 text-amber-700">
                      {bottleneck.casesStuck} stuck
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600">{bottleneck.avgStuckDays} days avg</p>
                  {bottleneck.recommendation && (
                    <p className="text-xs text-amber-700 mt-2 italic">
                      💡 {bottleneck.recommendation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stage Velocity */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Stage Velocity (Cases per Week)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stageVelocity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="stage" angle={-45} textAnchor="end" height={80} fontSize={11} />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="throughput" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}