import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, AlertTriangle, AlertCircle, ArrowRight,
  Building, TrendingUp, Shield, Info
} from 'lucide-react';

export default function IndicativeReport({ report, caseData }) {
  if (!report) return null;

  const confidenceConfig = {
    high: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    medium: { color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
    low: { color: 'bg-red-100 text-red-700', icon: AlertCircle }
  };

  const conf = confidenceConfig[report.confidence] || confidenceConfig.medium;
  const ConfIcon = conf.icon;

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-slate-100">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Indicative Market Position</h3>
              <p className="text-sm text-slate-500 mt-1">
                Generated {report.generated_at ? new Date(report.generated_at).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                }) : 'recently'}
              </p>
            </div>
            <Badge className={`${conf.color} flex items-center gap-1`}>
              <ConfIcon className="w-3.5 h-3.5" />
              {report.confidence?.charAt(0).toUpperCase() + report.confidence?.slice(1)} Confidence
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Placeability</p>
              <div className="flex items-center gap-2">
                {report.is_placeable ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span className="font-semibold text-emerald-700">Likely Placeable</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="font-semibold text-red-700">Concerns Identified</span>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Indicative Rate Range</p>
              <p className="font-semibold text-slate-900 text-lg">
                {report.rate_range_low?.toFixed(2)}% – {report.rate_range_high?.toFixed(2)}%
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Product Category</p>
              <p className="font-semibold text-slate-900">
                {report.product_category || 'Standard'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lender Directions */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-500" />
            Indicative Lender Directions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {report.lender_directions?.map((lender, idx) => (
              <div 
                key={idx}
                className="flex items-start justify-between p-4 bg-slate-50 rounded-xl"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-slate-900">{lender.lender_name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {lender.suitability}
                    </Badge>
                  </div>
                  {lender.notes && (
                    <p className="text-sm text-slate-500 mt-1">{lender.notes}</p>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risks & Assumptions */}
      {report.risks_assumptions && report.risks_assumptions.length > 0 && (
        <Card className="border-0 shadow-sm border-amber-100 bg-amber-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-800">
              <Shield className="w-4 h-4" />
              Risks & Assumptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.risks_assumptions.map((risk, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-amber-800">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      {report.next_steps && (
        <Card className="border-0 shadow-sm bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-blue-800">
              <TrendingUp className="w-4 h-4" />
              Suggested Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-800">{report.next_steps}</p>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <div className="p-4 bg-slate-100 rounded-xl">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-600">
            <strong>Important:</strong> This is an indicative assessment only and does not constitute 
            a mortgage recommendation. Final lender selection will be determined by your broker 
            following full analysis and regulated advice. Rates shown are illustrative and subject 
            to change. Terms and conditions apply.
          </p>
        </div>
      </div>
    </div>
  );
}