import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { FileText, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

const STAGE_COLORS = {
  intake_received: '#64748b',
  data_completion: '#f59e0b',
  market_analysis: '#3b82f6',
  human_review: '#a855f7',
  pending_delivery: '#6366f1',
  awaiting_decision: '#06b6d4',
  decision_chase: '#f97316',
  client_proceeding: '#10b981',
  broker_validation: '#14b8a6',
  application_submitted: '#22c55e',
  offer_received: '#84cc16',
  completed: '#16a34a',
  withdrawn: '#6b7280',
  unsuitable: '#ef4444'
};

export default function PipelineReport({ data }) {
  if (!data) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-12 text-center">
          <p className="text-slate-500">No data available</p>
        </CardContent>
      </Card>
    );
  }

  const { summary, stageBreakdown, categoryBreakdown, timeSensitivity, recentActivity } = data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Total Cases</p>
                <p className="text-2xl font-bold text-slate-900">{summary.total}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Active</p>
                <p className="text-2xl font-bold text-slate-900">{summary.active}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Needs Review</p>
                <p className="text-2xl font-bold text-slate-900">{summary.needsReview}</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Completed</p>
                <p className="text-2xl font-bold text-slate-900">{summary.completed}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stage Breakdown */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Cases by Stage</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stageBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="stage" 
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={11}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#a855f7'][index % 4]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Time Sensitivity */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Time Sensitivity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeSensitivity.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={
                      item.level === 'urgent' ? 'border-red-300 text-red-700' :
                      item.level === 'standard' ? 'border-blue-300 text-blue-700' :
                      'border-slate-300 text-slate-700'
                    }>
                      {item.level}
                    </Badge>
                    <span className="text-sm text-slate-700">{item.count} cases</span>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          item.level === 'urgent' ? 'bg-red-400' :
                          item.level === 'standard' ? 'bg-blue-400' :
                          'bg-slate-400'
                        }`}
                        style={{ width: `${(item.count / summary.total) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">
                    {Math.round((item.count / summary.total) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-900">{activity.client_name}</p>
                  <p className="text-xs text-slate-500">{activity.reference}</p>
                </div>
                <div className="text-right">
                  <Badge className="text-xs">{activity.stage}</Badge>
                  <p className="text-xs text-slate-500 mt-1">{activity.created}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}