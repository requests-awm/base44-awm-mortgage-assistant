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
        <Card 
          className="hover:shadow-md transition-all cursor-pointer border-0 bg-white/60 backdrop-blur-sm"
          style={{ borderLeft: `5px solid ${triageData.rating === 'red' ? '#EF4444' : triageData.rating === 'yellow' ? '#F59E0B' : '#10B981'}` }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-medium text-slate-900">{mortgageCase.client_name}</p>
                  <p className="text-xs text-slate-500">{mortgageCase.reference}</p>
                </div>
              </div>
              <span className="text-xs" style={{ color: '#6B7280' }}>{stage.label}</span>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  const triageColor = triageData.rating === 'red' ? '#EF4444' : triageData.rating === 'yellow' ? '#F59E0B' : '#10B981';

  return (
    <Link to={createPageUrl(`CaseDetail?id=${mortgageCase.id}`)}>
      <Card 
        className="hover:shadow-lg transition-all cursor-pointer border-0 bg-white/80 backdrop-blur-sm group"
        style={{ borderLeft: `5px solid ${triageColor}` }}
      >
        <CardContent className="p-6">
          {/* Triage at top */}
          <div className="mb-5">
            <TriageBadge 
              rating={triageData.rating} 
              factors={triageData.factors}
              showLabel={true}
              size="sm"
            />
          </div>

          {/* Client Name & Reference */}
          <div className="mb-4">
            <h3 className="font-semibold text-lg text-slate-900 mb-1">{mortgageCase.client_name}</h3>
            <p className="text-sm text-slate-500">{mortgageCase.reference}</p>
          </div>

          {/* Status */}
          <div className="mb-5">
            <p className="text-xs" style={{ color: '#6B7280' }}>{stage.label}</p>
          </div>

          {/* Details Grid */}
          <div className="space-y-2.5 mb-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">{CATEGORY_LABELS[mortgageCase.category] || mortgageCase.category}</span>
              <span className="text-slate-700">{PURPOSE_LABELS[mortgageCase.purpose] || mortgageCase.purpose}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Loan</span>
              <span className="text-slate-900 font-medium">{formatCurrency(mortgageCase.loan_amount)}</span>
            </div>
            {mortgageCase.ltv && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">LTV</span>
                <span className="text-slate-700">{mortgageCase.ltv}%</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              {formatDistanceToNow(new Date(mortgageCase.created_date), { addSuffix: true })}
            </span>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}