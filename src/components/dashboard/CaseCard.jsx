import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, User, Building, Banknote, AlertTriangle, 
  CheckCircle, ArrowRight, Pause, MessageSquare,
  FileText, Eye
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { TriageBadge, calculateTriageRating } from '@/components/dashboard/TriageBadge.jsx';

const STAGE_CONFIG = {
  intake_received: { label: 'Intake Received', color: 'bg-slate-100 text-slate-700', icon: FileText },
  data_completion: { label: 'Data Completion', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  market_analysis: { label: 'Market Analysis', color: 'bg-blue-100 text-blue-700', icon: Building },
  human_review: { label: 'Human Review', color: 'bg-purple-100 text-purple-700', icon: Eye },
  pending_delivery: { label: 'Pending Delivery', color: 'bg-indigo-100 text-indigo-700', icon: Clock },
  awaiting_decision: { label: 'Awaiting Decision', color: 'bg-cyan-100 text-cyan-700', icon: MessageSquare },
  decision_chase: { label: 'Decision Chase', color: 'bg-orange-100 text-orange-700', icon: MessageSquare },
  client_proceeding: { label: 'Client Proceeding', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  broker_validation: { label: 'Broker Validation', color: 'bg-teal-100 text-teal-700', icon: User },
  application_submitted: { label: 'Application Submitted', color: 'bg-green-100 text-green-700', icon: FileText },
  offer_received: { label: 'Offer Received', color: 'bg-green-200 text-green-800', icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-green-500 text-white', icon: CheckCircle },
  withdrawn: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-600', icon: Pause },
  unsuitable: { label: 'Unsuitable', color: 'bg-red-100 text-red-700', icon: AlertTriangle }
};

const CATEGORY_LABELS = {
  residential: 'Residential',
  buy_to_let: 'Buy-to-Let',
  later_life: 'Later Life',
  ltd_company: 'Ltd Company'
};

const PURPOSE_LABELS = {
  purchase: 'Purchase',
  remortgage: 'Remortgage',
  rate_expiry: 'Rate Expiry'
};

export default function CaseCard({ mortgageCase, compact = false }) {
  const stage = STAGE_CONFIG[mortgageCase.stage] || STAGE_CONFIG.intake_received;
  const StageIcon = stage.icon;

  const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-GB', { 
      style: 'currency', 
      currency: 'GBP',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Calculate triage if not already set
  const triageData = mortgageCase.triage_rating 
    ? { rating: mortgageCase.triage_rating, factors: mortgageCase.triage_factors || [] }
    : calculateTriageRating(mortgageCase);

  if (compact) {
    return (
      <Link to={createPageUrl(`CaseDetail?id=${mortgageCase.id}`)}>
        <Card className="hover:shadow-md transition-all cursor-pointer border-0 bg-white/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  mortgageCase.agent_paused ? 'bg-amber-400' :
                  ['client_proceeding', 'broker_validation', 'offer_received', 'completed'].includes(mortgageCase.stage) 
                    ? 'bg-emerald-400' 
                    : 'bg-blue-400'
                }`} />
                <div>
                  <p className="font-medium text-slate-900">{mortgageCase.client_name}</p>
                  <p className="text-xs text-slate-500">{mortgageCase.reference}</p>
                </div>
              </div>
              <Badge className={`${stage.color} text-xs`}>{stage.label}</Badge>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link to={createPageUrl(`CaseDetail?id=${mortgageCase.id}`)}>
      <Card className="hover:shadow-lg transition-all cursor-pointer border-0 bg-white/80 backdrop-blur-sm group">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-slate-900">{mortgageCase.client_name}</h3>
                <TriageBadge 
                  rating={triageData.rating} 
                  factors={triageData.factors}
                  showLabel={false}
                  size="sm"
                />
                {mortgageCase.agent_paused && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                    <Pause className="w-3 h-3 mr-1" />
                    Paused
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{mortgageCase.reference}</p>
            </div>
            <Badge className={`${stage.color} flex items-center gap-1`}>
              <StageIcon className="w-3 h-3" />
              {stage.label}
            </Badge>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Building className="w-4 h-4 text-slate-400" />
              <span>{CATEGORY_LABELS[mortgageCase.category] || mortgageCase.category}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>{PURPOSE_LABELS[mortgageCase.purpose] || mortgageCase.purpose}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Banknote className="w-4 h-4 text-slate-400" />
              <span>{formatCurrency(mortgageCase.loan_amount)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{formatDistanceToNow(new Date(mortgageCase.created_date), { addSuffix: true })}</span>
            </div>
          </div>

          {/* LTV Indicator */}
          {mortgageCase.ltv && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-500">LTV</span>
                <span className={`font-medium ${
                  mortgageCase.ltv <= 75 ? 'text-emerald-600' :
                  mortgageCase.ltv <= 85 ? 'text-amber-600' :
                  'text-orange-600'
                }`}>{mortgageCase.ltv}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    mortgageCase.ltv <= 75 ? 'bg-emerald-400' :
                    mortgageCase.ltv <= 85 ? 'bg-amber-400' :
                    'bg-orange-400'
                  }`}
                  style={{ width: `${Math.min(mortgageCase.ltv, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Flags */}
          {mortgageCase.flags && mortgageCase.flags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {mortgageCase.flags.map((flag, idx) => (
                <Badge key={idx} variant="outline" className="text-xs text-slate-600">
                  {flag}
                </Badge>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {mortgageCase.referred_by && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <User className="w-3 h-3" />
                <span>{mortgageCase.referred_by.split('@')[0]}</span>
              </div>
            )}
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}