import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, User, Building, Banknote, AlertTriangle, 
  CheckCircle, ArrowRight, Pause, MessageSquare,
  FileText, Eye, Calendar
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

  const triageDotColors = {
    blue: '#3B82F6',
    green: '#10B981',
    yellow: '#D1B36A',
    red: '#EF4444'
  };

  const triageLabels = {
    blue: 'Quick Win',
    green: 'Good Case',
    yellow: 'Needs Attention',
    red: 'Complex'
  };

  const getTimelineDisplay = () => {
    if (!mortgageCase.timeline_urgency || mortgageCase.timeline_urgency === 'standard') return null;

    const daysText = mortgageCase.days_until_deadline 
      ? `${Math.abs(mortgageCase.days_until_deadline)} days`
      : '';

    if (mortgageCase.timeline_urgency === 'overdue') {
      return <div className="flex items-center gap-1.5 text-sm text-red-600 font-medium">⏰ OVERDUE - {daysText} past deadline</div>;
    }
    if (mortgageCase.timeline_urgency === 'critical') {
      return <div className="flex items-center gap-1.5 text-sm text-red-600 font-medium">⏰ URGENT - Expires in {daysText}</div>;
    }
    if (mortgageCase.timeline_urgency === 'soon') {
      return <div className="flex items-center gap-1.5 text-sm text-amber-600 font-medium">⏰ Soon - {daysText}</div>;
    }
    return null;
  };

  return (
    <Link to={createPageUrl(`CaseDetail?id=${mortgageCase.id}`)}>
      <Card className="hover:shadow-[0_2px_8px_rgba(14,27,42,0.12)] transition-shadow duration-200 cursor-pointer border border-slate-200 bg-white group">
        <CardContent className="p-4">
          {/* TOP: Client Name & Asana */}
          <div className="flex items-start justify-between gap-3 mb-1">
            <h3 className="font-semibold text-[16px] text-slate-900 leading-tight">{mortgageCase.client_name}</h3>
            <div className="flex items-center gap-2">
              {mortgageCase.asana_task_url && (
                <a
                  href={mortgageCase.asana_task_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-shrink-0 p-1 rounded hover:bg-blue-50 transition-colors"
                  title="View in Asana"
                >
                  <svg className="w-[18px] h-[18px] text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-12.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm-4.5 4.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm9 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
          <p className="text-[13px] text-slate-500 mb-4">{mortgageCase.reference}</p>

          {/* MIDDLE: Status Lines */}
          <div className="space-y-2 mb-4">
            {/* Line 1: Triage + Lender Count */}
            <div className="flex items-center gap-2 text-[14px] text-slate-700">
              <span 
                className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: triageDotColors[triageData.rating] }}
              />
              <span>{triageLabels[triageData.rating]}</span>
              {mortgageCase.total_lender_matches > 0 && (
                <>
                  <span className="text-slate-400">•</span>
                  <span>{mortgageCase.total_lender_matches} lenders</span>
                </>
              )}
            </div>

            {/* Line 2: Timeline (conditional) */}
            {getTimelineDisplay()}

            {/* Line 3: Email Status */}
            <div className="text-[14px]">
              {mortgageCase.email_status === 'draft' && (
                <span className="text-blue-600">✉️ Draft Ready</span>
              )}
              {mortgageCase.email_status === 'scheduled' && mortgageCase.email_scheduled_send_time && (
                <span className="text-[#D1B36A]">📅 Scheduled {format(new Date(mortgageCase.email_scheduled_send_time), 'dd MMM')}</span>
              )}
              {mortgageCase.email_status === 'sent' && mortgageCase.email_sent_at && (
                <span className="text-emerald-600">✅ Sent {format(new Date(mortgageCase.email_sent_at), 'dd MMM')}</span>
              )}
              {mortgageCase.email_status === 'failed' && (
                <span className="text-red-600">⚠️ Draft Failed</span>
              )}
              {mortgageCase.email_status === 'not_generated' && (
                <span className="text-slate-400">Draft pending</span>
              )}
            </div>
          </div>

          {/* BOTTOM: Quick Facts */}
          <div className="text-[12px] text-slate-500 mb-3 mt-2 leading-[1.3]">
            {formatCurrency(mortgageCase.loan_amount)} loan
            {mortgageCase.ltv && <> • {mortgageCase.ltv}% LTV</>}
            <> • {PURPOSE_LABELS[mortgageCase.purpose] || mortgageCase.purpose}</>
            {mortgageCase.referring_team_member && (
              <div className="mt-1 text-slate-400">
                👤 {mortgageCase.referring_team_member}
              </div>
            )}
          </div>

          {/* FOOTER: Timestamp */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              {formatDistanceToNow(new Date(mortgageCase.created_date), { addSuffix: true })}
            </span>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}