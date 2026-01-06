import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue,
  color = 'slate'
}) {
  const colorClasses = {
    slate: 'bg-slate-50 text-slate-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600'
  };

  return (
    <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <div className={`p-2.5 rounded-xl ${colorClasses[color]}`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>

        {trend !== undefined && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
            {trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
            {trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
            {trend === 'neutral' && <Minus className="w-3.5 h-3.5 text-slate-400" />}
            <span className={`text-xs font-medium ${
              trend === 'up' ? 'text-emerald-600' :
              trend === 'down' ? 'text-red-600' :
              'text-slate-500'
            }`}>
              {trendValue}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}