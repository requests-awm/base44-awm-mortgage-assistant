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
  return (
    <Card className="border-0 shadow-sm bg-[#12243A]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">{title}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-white/60 mt-1">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <div className="p-2.5 rounded-xl bg-[#D1B36A]/20">
              <Icon className="w-5 h-5 text-[#D1B36A]" />
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