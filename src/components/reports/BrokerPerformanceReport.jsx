import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Award, TrendingUp, Clock } from 'lucide-react';

export default function BrokerPerformanceReport({ data }) {
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
    topPerformers, 
    brokerMetrics, 
    workloadDistribution, 
    responseTimeAnalysis 
  } = data;

  return (
    <div className="space-y-6">
      {/* Top Performers */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-green-50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topPerformers.map((broker, idx) => (
              <div key={idx} className="p-4 bg-white rounded-xl border border-emerald-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                      idx === 1 ? 'bg-slate-200 text-slate-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {idx + 1}
                    </div>
                    <span className="font-medium text-slate-900">{broker.name}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-slate-500">Cases</p>
                    <p className="font-semibold text-slate-900">{broker.casesCompleted}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Conversion</p>
                    <p className="font-semibold text-emerald-600">{broker.conversionRate}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Broker Metrics Comparison */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Broker Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={brokerMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="broker" 
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={11}
              />
              <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
              <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
              <Tooltip />
              <Bar yAxisId="left" dataKey="casesHandled" fill="#3b82f6" name="Cases Handled" />
              <Bar yAxisId="right" dataKey="conversionRate" fill="#10b981" name="Conversion %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workload Distribution */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Workload Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workloadDistribution.map((broker, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm font-medium text-slate-900">{broker.name}</span>
                      <p className="text-xs text-slate-500">{broker.activeCases} active cases</p>
                    </div>
                    <Badge variant="outline" className={
                      broker.workloadStatus === 'high' ? 'border-red-300 text-red-700' :
                      broker.workloadStatus === 'medium' ? 'border-amber-300 text-amber-700' :
                      'border-green-300 text-green-700'
                    }>
                      {broker.workloadStatus}
                    </Badge>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        broker.workloadStatus === 'high' ? 'bg-red-400' :
                        broker.workloadStatus === 'medium' ? 'bg-amber-400' :
                        'bg-green-400'
                      }`}
                      style={{ width: `${broker.capacityPercentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Response Time Analysis */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Response Time Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {responseTimeAnalysis.map((broker, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-900">{broker.name}</span>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {broker.avgResponseHours}h
                      </p>
                      <p className="text-xs text-slate-500">avg response</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {broker.trend === 'improving' ? (
                      <>
                        <TrendingUp className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Improving</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-3 h-3 text-red-600 rotate-180" />
                        <span className="text-red-600">Needs attention</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Broker Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Detailed Broker Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-slate-600 font-medium">Broker</th>
                  <th className="text-center py-3 px-4 text-slate-600 font-medium">Active</th>
                  <th className="text-center py-3 px-4 text-slate-600 font-medium">Completed</th>
                  <th className="text-center py-3 px-4 text-slate-600 font-medium">Conversion</th>
                  <th className="text-center py-3 px-4 text-slate-600 font-medium">Avg Time</th>
                  <th className="text-center py-3 px-4 text-slate-600 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {brokerMetrics.map((broker, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-900">{broker.broker}</td>
                    <td className="py-3 px-4 text-center">{broker.activeCases}</td>
                    <td className="py-3 px-4 text-center">{broker.casesHandled}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-semibold ${
                        broker.conversionRate >= 70 ? 'text-emerald-600' :
                        broker.conversionRate >= 50 ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {broker.conversionRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">{broker.avgDaysToComplete}d</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline" className={
                        broker.performance === 'excellent' ? 'border-emerald-300 text-emerald-700' :
                        broker.performance === 'good' ? 'border-blue-300 text-blue-700' :
                        'border-amber-300 text-amber-700'
                      }>
                        {broker.performance}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}