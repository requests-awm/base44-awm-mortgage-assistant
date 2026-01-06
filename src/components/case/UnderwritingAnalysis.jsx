import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, CheckCircle, XCircle, Info, TrendingUp,
  ShieldAlert, Clock, FileText, Lightbulb, Target
} from 'lucide-react';
import { format } from 'date-fns';

const RISK_CONFIG = {
  low: { label: 'Low Risk', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, iconColor: 'text-emerald-600' },
  medium: { label: 'Medium Risk', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle, iconColor: 'text-amber-600' },
  high: { label: 'High Risk', color: 'bg-red-100 text-red-700', icon: XCircle, iconColor: 'text-red-600' }
};

const SEVERITY_CONFIG = {
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700 border-red-200' },
  major: { label: 'Major', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  minor: { label: 'Minor', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
};

export default function UnderwritingAnalysis({ analysis }) {
  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <ShieldAlert className="w-8 h-8 mb-2" />
        <p className="text-sm">No underwriting analysis available</p>
        <p className="text-xs mt-1">Run analysis to check case against lender criteria</p>
      </div>
    );
  }

  const riskConfig = RISK_CONFIG[analysis.overall_risk_level] || RISK_CONFIG.medium;
  const RiskIcon = riskConfig.icon;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Underwriting Assessment</h3>
              {analysis.analyzed_at && (
                <p className="text-xs text-slate-500 mt-1">
                  Analyzed {format(new Date(analysis.analyzed_at), 'dd MMM yyyy, HH:mm')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Badge className={`${riskConfig.color} text-sm py-1.5 px-3`}>
                <RiskIcon className="w-3 h-3 mr-1" />
                {riskConfig.label}
              </Badge>
              <Badge variant={analysis.underwritable ? "default" : "secondary"} className="text-sm py-1.5 px-3">
                {analysis.underwritable ? 'Underwritable' : 'Needs Work'}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">Confidence</p>
              <p className="text-lg font-semibold text-slate-900 capitalize">{analysis.confidence}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">Blockers</p>
              <p className="text-lg font-semibold text-red-700">{analysis.blockers?.length || 0}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">Warnings</p>
              <p className="text-lg font-semibold text-amber-700">{analysis.warnings?.length || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blockers */}
      {analysis.blockers && analysis.blockers.length > 0 && (
        <Card className="border-0 shadow-sm border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-900">
              <XCircle className="w-4 h-4" />
              Critical Blockers ({analysis.blockers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.blockers.map((blocker, idx) => (
              <div key={idx} className="p-4 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={SEVERITY_CONFIG[blocker.severity]?.color || SEVERITY_CONFIG.major.color}>
                      {blocker.severity}
                    </Badge>
                    <span className="text-xs text-slate-500 uppercase">{blocker.category}</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-red-900 mb-2">{blocker.description}</p>
                {blocker.affected_lenders && blocker.affected_lenders.length > 0 && (
                  <p className="text-xs text-red-700 mb-2">
                    Affects: {blocker.affected_lenders.join(', ')}
                  </p>
                )}
                {blocker.mitigation && (
                  <div className="mt-3 p-3 bg-white rounded border border-red-200">
                    <p className="text-xs font-medium text-slate-700 mb-1">Mitigation Strategy:</p>
                    <p className="text-xs text-slate-600">{blocker.mitigation}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {analysis.warnings && analysis.warnings.length > 0 && (
        <Card className="border-0 shadow-sm border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-900">
              <AlertTriangle className="w-4 h-4" />
              Areas of Concern ({analysis.warnings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.warnings.map((warning, idx) => (
              <div key={idx} className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-slate-500 uppercase">{warning.category}</span>
                </div>
                <p className="text-sm text-amber-900 mb-2">{warning.description}</p>
                {warning.recommendation && (
                  <p className="text-xs text-amber-700">
                    <span className="font-medium">Recommendation:</span> {warning.recommendation}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Missing Information */}
      {analysis.missing_information && analysis.missing_information.length > 0 && (
        <Card className="border-0 shadow-sm border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-blue-900">
              <Info className="w-4 h-4" />
              Missing Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.missing_information.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-blue-800">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recommended Products */}
      {analysis.recommended_products && analysis.recommended_products.length > 0 && (
        <Card className="border-0 shadow-sm border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-emerald-900">
              <Target className="w-4 h-4" />
              Recommended Products ({analysis.recommended_products.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.recommended_products.map((product, idx) => (
              <div key={idx} className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-emerald-900">{product.lender_name}</h4>
                    <p className="text-sm text-emerald-700">{product.product_name}</p>
                  </div>
                  <Badge className="bg-emerald-600 text-white">
                    {product.suitability_score}/100
                  </Badge>
                </div>
                {product.key_features && product.key_features.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-slate-700 mb-1">Key Features:</p>
                    <ul className="space-y-1">
                      {product.key_features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                          <CheckCircle className="w-3 h-3 text-emerald-600 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {product.potential_issues && product.potential_issues.length > 0 && (
                  <div className="mt-3 p-2 bg-white rounded border border-emerald-200">
                    <p className="text-xs font-medium text-slate-700 mb-1">Watch Out:</p>
                    <ul className="space-y-1">
                      {product.potential_issues.map((issue, i) => (
                        <li key={i} className="text-xs text-slate-600">• {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Alternative Options */}
      {analysis.alternative_options && analysis.alternative_options.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-slate-900">
              <Lightbulb className="w-4 h-4" />
              Alternative Strategies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.alternative_options.map((option, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-900 mb-2">{option.strategy}</h4>
                <p className="text-sm text-slate-600 mb-2">{option.description}</p>
                {option.potential_lenders && option.potential_lenders.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {option.potential_lenders.map((lender, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {lender}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      {analysis.next_steps && analysis.next_steps.length > 0 && (
        <Card className="border-0 shadow-sm bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-blue-900">
              <FileText className="w-4 h-4" />
              Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {analysis.next_steps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-blue-800">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-semibold text-blue-900">
                    {idx + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Broker Notes */}
      {analysis.broker_notes && (
        <Card className="border-0 shadow-sm border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-slate-900">
              <FileText className="w-4 h-4" />
              Broker Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{analysis.broker_notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}