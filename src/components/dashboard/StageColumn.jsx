import React from 'react';
import { Badge } from "@/components/ui/badge";
import CaseCard from './CaseCard';

export default function StageColumn({ title, cases, color, icon: Icon, count }) {
  return (
    <div className="flex flex-col min-w-[300px] max-w-[320px]">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-slate-500" />}
          <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
        </div>
        <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-xs">
          {count ?? cases.length}
        </Badge>
      </div>

      {/* Cases */}
      <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1">
        {cases.length === 0 ? (
          <div className="flex items-center justify-center h-24 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm">
            No cases
          </div>
        ) : (
          cases.map(c => (
            <CaseCard key={c.id} mortgageCase={c} />
          ))
        )}
      </div>
    </div>
  );
}