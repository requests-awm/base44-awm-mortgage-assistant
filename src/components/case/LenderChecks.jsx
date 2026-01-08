import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  CheckCircle, AlertTriangle, XCircle, Clock,
  ShieldCheck, ShieldAlert, ShieldX, RefreshCw, Info
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

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

const CATEGORY_LABELS = {
  high_street: 'High Street',
  building_society: 'Building Society',
  specialist: 'Specialist',
  private_bank: 'Private Bank',
  challenger: 'Challenger'
};

const getConfidenceColor = (confidence) => {
  if (confidence >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (confidence >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-orange-600 bg-orange-50 border-orange-200';
};

export default function LenderChecks({ checks = [], caseData, onRecalculate, isRecalculating }) {
  const [sortBy, setSortBy] = useState('confidence');
  const [sortOrder, setSortOrder] = useState('desc');

  const matchedLenders = caseData?.matched_lenders || [];
  const totalMatches = caseData?.total_lender_matches || 0;
  const lastCalculated = caseData?.lender_match_calculated_at;

  // Sort matched lenders
  const sortedMatches = [...matchedLenders].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'confidence') {
      comparison = (b.confidence || 0) - (a.confidence || 0);
    } else if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === 'category') {
      comparison = (a.category || '').localeCompare(b.category || '');
    }
    return sortOrder === 'desc' ? comparison : -comparison;
  });

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Initial Match Assessment Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Initial Match Assessment</h3>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Info className="w-4 h-4" />
            <span>These lenders may be suitable - verify in TRIGOLD before proceeding</span>
          </div>
        </div>

        {/* Metadata */}
        {lastCalculated && (
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Last calculated</p>
                <p className="text-sm font-medium text-slate-700">
                  {formatDistanceToNow(new Date(lastCalculated), { addSuffix: true })}
                </p>
              </div>
            </div>
            {onRecalculate && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRecalculate}
                disabled={isRecalculating}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRecalculating ? 'animate-spin' : ''}`} />
                Recalculate Matches
              </Button>
            )}
          </div>
        )}

        {/* Empty State */}
        {totalMatches === 0 ? (
          <Card className="border-0 shadow-sm bg-amber-50 border-amber-200">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="p-3 bg-amber-100 rounded-lg h-fit">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-amber-900 mb-2">No lenders matched based on current criteria</h4>
                  <ul className="space-y-1 text-sm text-amber-800">
                    <li>• LTV may be too high</li>
                    <li>• Income may be too low</li>
                    <li>• Category may require specialist lenders</li>
                  </ul>
                  <p className="text-sm text-amber-700 mt-3 font-medium">
                    Review case details or consult senior broker
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Table View */}
            <Card className="border-0 shadow-sm hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1 hover:text-slate-900 font-semibold"
                      >
                        Lender Name
                        {sortBy === 'name' && (
                          <span className="text-xs">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('category')}
                        className="flex items-center gap-1 hover:text-slate-900 font-semibold"
                      >
                        Type
                        {sortBy === 'category' && (
                          <span className="text-xs">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('confidence')}
                        className="flex items-center gap-1 hover:text-slate-900 font-semibold"
                      >
                        Confidence
                        {sortBy === 'confidence' && (
                          <span className="text-xs">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="font-semibold">Max LTV</TableHead>
                    <TableHead className="font-semibold">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedMatches.map((lender, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{lender.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {CATEGORY_LABELS[lender.category] || lender.category || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getConfidenceColor(lender.confidence)} border font-semibold`}>
                          {lender.confidence}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-slate-700">{lender.max_ltv}%</span>
                      </TableCell>
                      <TableCell>
                        {lender.notes ? (
                          lender.notes.length > 60 ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button className="text-sm text-slate-600 hover:text-slate-900 text-left">
                                    {lender.notes.substring(0, 60)}...
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-sm">{lender.notes}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-sm text-slate-600">{lender.notes}</span>
                          )
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {sortedMatches.map((lender, idx) => (
                <Card key={idx} className="border-0 shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-900">{lender.name}</h4>
                        <Badge variant="outline" className="text-xs mt-1">
                          {CATEGORY_LABELS[lender.category] || lender.category || 'Unknown'}
                        </Badge>
                      </div>
                      <Badge className={`${getConfidenceColor(lender.confidence)} border font-semibold`}>
                        {lender.confidence}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <p className="text-xs text-slate-500">Max LTV</p>
                        <p className="font-medium text-slate-700">{lender.max_ltv}%</p>
                      </div>
                    </div>
                    {lender.notes && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-slate-600">{lender.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Existing Lender Checks Section */}
      {checks && checks.length > 0 && (
        <div className="space-y-4 pt-6 border-t">
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
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Detailed Eligibility Checks</h3>
        </div>

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
              {/* Recommended Products */}
              {check.recommended_products && check.recommended_products.length > 0 && (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-900">Recommended Products</span>
                  </div>
                  <ul className="space-y-1">
                    {check.recommended_products.map((product, i) => (
                      <li key={i} className="text-sm text-emerald-800 font-medium pl-6">
                        • {product}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

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
      )}
    </div>
  );
}