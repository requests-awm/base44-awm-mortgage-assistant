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
import { TimelineBadge } from '@/components/dashboard/TimelineBadge.jsx';

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
          style={{ borderLeft: `4px solid ${triageData.rating === 'red' ? '#EF4444' : triageData.rating === 'yellow' ? '#F59E0B' : '#10B981'}` }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-medium text-slate-900">{mortgageCase.client_name}</p>
                  <p className="text-xs text-slate-500">{mortgageCase.reference}</p>
                </div>
              </div>
              <span className="text-xs text-slate-500">{stage.label}</span>
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
        style={{ borderLeft: `4px solid ${triageColor}` }}
      >
        <CardContent className="p-6">
          {/* Triage and Timeline at top */}
          <div className="mb-5 flex items-center justify-between gap-2">
            <TriageBadge 
              rating={triageData.rating} 
              factors={triageData.factors}
              showLabel={true}
              size="sm"
            />
            <div className="flex flex-col items-end gap-1">
              {mortgageCase.timeline_urgency && (
                <TimelineBadge 
                  urgency={mortgageCase.timeline_urgency}
                  daysLeft={mortgageCase.days_until_deadline}
                  size="sm"
                />
              )}
              {mortgageCase.purpose === 'remortgage' && mortgageCase.existing_product_end_date && (
                <div className="text-xs text-slate-500">
                  Deal expires: {(() => {
                    const endDate = new Date(mortgageCase.existing_product_end_date);
                    const today = new Date();
                    const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                    const dateStr = format(endDate, 'dd/MM/yyyy');
                    
                    if (daysUntilExpiry < 30) {
                      return <span className="text-red-600 font-medium">{dateStr}</span>;
                    } else if (daysUntilExpiry <= 90) {
                      return <span className="text-amber-600 font-medium">{dateStr}</span>;
                    }
                    return dateStr;
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Client Name & Reference */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-lg text-slate-900">{mortgageCase.client_name}</h3>
              {mortgageCase.asana_task_url && (
                <a
                  href={mortgageCase.asana_task_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-shrink-0 p-1.5 rounded-lg bg-[#f06a6a]/10 hover:bg-[#f06a6a]/20 transition-colors group border border-[#f06a6a]/20"
                  title="View in Asana"
                >
                  <svg className="w-5 h-5 text-[#f06a6a] group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-12.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm-4.5 4.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm9 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/>
                  </svg>
                </a>
              )}
            </div>
            <p className="text-sm text-slate-500">{mortgageCase.reference}</p>
          </div>

          {/* Status */}
          <div className="mb-5">
            <p className="text-sm text-slate-500">{stage.label}</p>
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
            {mortgageCase.total_lender_matches > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Building className="w-3 h-3" />
                <span>{mortgageCase.total_lender_matches} lenders matched</span>
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