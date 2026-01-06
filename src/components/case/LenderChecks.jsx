import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, AlertTriangle, XCircle, Clock,
  ShieldCheck, ShieldAlert, ShieldX
} from 'lucide-react';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  eligible: {
    label: 'Eligible',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: ShieldCheck,
    iconColor: 'text-emerald-600'
  },
  review_required: {
    label: 'Review Required',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: ShieldAlert,
    iconColor: 'text-amber-600'
  },
  likely_decline: {
    label: 'Likely Decline',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: ShieldX,
    iconColor: 'text-red-600'
  }
};

const CONFIDENCE_CONFIG = {
  high: { label: 'High', color: 'text-emerald-600' },
  medium: { label: 'Medium', color: 'text-amber-600' },
  low: { label: 'Low', color: 'text-slate-500' }
};

export default function LenderChecks({ checks = [] }) {
  if (!checks || checks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Clock className="w-8 h-8 mb-2" />
        <p className="text-sm">No lender eligibility checks performed yet</p>
        <p className="text-xs mt-1">Checks run automatically during market analysis</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="border-0 shadow-sm bg-slate-50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Lenders Checked</p>
              <p className="text-2xl font-bold text-slate-900">{checks.length}</p>
            </div>
            <div className="flex gap-3">
              <div className="text-center">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-1">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-xs text-slate-500">
                  {checks.filter(c => c.overall_status === 'eligible').length}
                </p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-1">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-xs text-slate-500">
                  {checks.filter(c => c.overall_status === 'review_required').length}
                </p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-1">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-xs text-slate-500">
                  {checks.filter(c => c.overall_status === 'likely_decline').length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Lender Checks */}
      {checks.map((check, idx) => {
        const statusConfig = STATUS_CONFIG[check.overall_status] || STATUS_CONFIG.review_required;
        const StatusIcon = statusConfig.icon;
        const confidence = CONFIDENCE_CONFIG[check.confidence] || CONFIDENCE_CONFIG.medium;

        return (
          <Card key={idx} className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">
                    {check.lender_name}
                  </CardTitle>
                  {check.checked_at && (
                    <p className="text-xs text-slate-500 mt-1">
                      Checked {format(new Date(check.checked_at), 'dd MMM yyyy, HH:mm')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${statusConfig.color} border`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <span className={confidence.color}>{confidence.label}</span> confidence
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Passes */}
              {check.passes && check.passes.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-900">Criteria Passed</span>
                  </div>
                  <ul className="space-y-1">
                    {check.passes.map((pass, i) => (
                      <li key={i} className="text-sm text-slate-600 pl-6">
                        • {pass}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {check.warnings && check.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-900">Requires Attention</span>
                  </div>
                  <ul className="space-y-1">
                    {check.warnings.map((warning, i) => (
                      <li key={i} className="text-sm text-amber-800 pl-6">
                        • {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Blockers */}
              {check.blockers && check.blockers.length > 0 && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-900">Likely Blockers</span>
                  </div>
                  <ul className="space-y-1">
                    {check.blockers.map((blocker, i) => (
                      <li key={i} className="text-sm text-red-800 pl-6">
                        • {blocker}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Notes */}
              {check.notes && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-700">{check.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}