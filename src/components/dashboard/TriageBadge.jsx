import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

const TRIAGE_CONFIG = {
  red: {
    label: 'Red',
    color: 'bg-red-500 text-white hover:bg-red-600',
    dotColor: 'bg-red-500',
    icon: AlertTriangle,
    description: 'Urgent attention required'
  },
  yellow: {
    label: 'Yellow',
    color: 'bg-amber-400 text-amber-900 hover:bg-amber-500',
    dotColor: 'bg-amber-400',
    icon: AlertCircle,
    description: 'Watch / Missing data'
  },
  green: {
    label: 'Green',
    color: 'bg-emerald-500 text-white hover:bg-emerald-600',
    dotColor: 'bg-emerald-500',
    icon: CheckCircle,
    description: 'On track'
  }
};

export function TriageBadge({ rating, factors = [], showLabel = true, size = 'default' }) {
  const config = TRIAGE_CONFIG[rating] || TRIAGE_CONFIG.green;
  const Icon = config.icon;

  const badge = (
    <Badge 
      className={`${config.color} ${size === 'sm' ? 'text-xs px-1.5 py-0' : ''}`}
    >
      <Icon className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} ${showLabel ? 'mr-1' : ''}`} />
      {showLabel && config.label}
    </Badge>
  );

  if (factors && factors.length > 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-medium mb-1">{config.description}</p>
            <ul className="text-xs space-y-0.5">
              {factors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-1">
                  <span className="text-slate-400">•</span>
                  {factor}
                </li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}

export function TriageDot({ rating, size = 'default' }) {
  const config = TRIAGE_CONFIG[rating] || TRIAGE_CONFIG.green;
  const sizeClasses = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';
  
  return (
    <span className={`${sizeClasses} rounded-full ${config.dotColor} inline-block`} />
  );
}

export function calculateTriageRating(caseData) {
  const factors = [];
  let score = 0;

  if (caseData.ltv > 90) { 
    score += 3; 
    factors.push('Very high LTV (>90%)'); 
  } else if (caseData.ltv > 85) { 
    score += 2; 
    factors.push('High LTV (85-90%)'); 
  }

  if (caseData.time_sensitivity === 'urgent') { 
    score += 2; 
    factors.push('Urgent timeline'); 
  }
  
  if (caseData.rate_expiry_date) {
    const expiryDate = new Date(caseData.rate_expiry_date);
    const daysUntilExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry < 30 && daysUntilExpiry > 0) {
      score += 1;
      factors.push(`Rate expiring in ${daysUntilExpiry} days`);
    }
  }

  if (!caseData.annual_income) { 
    score += 1; 
    factors.push('Missing income data'); 
  }
  if (!caseData.client_email && !caseData.client_phone) { 
    score += 2; 
    factors.push('No contact details'); 
  }

  if (caseData.analysis_status === 'failed') { 
    score += 3; 
    factors.push('Analysis failed'); 
  }

  if (caseData.income_type === 'self_employed') { 
    score += 1; 
    factors.push('Self-employed income'); 
  }
  if (caseData.flags?.includes('adverse_credit')) { 
    score += 2; 
    factors.push('Adverse credit history'); 
  }
  if (caseData.category === 'ltd_company') {
    score += 1;
    factors.push('Ltd company purchase');
  }

  if (caseData.stage === 'decision_chase' && caseData.chase_count > 2) { 
    score += 1; 
    factors.push('Multiple chase attempts'); 
  }

  const rating = score >= 5 ? 'red' : score >= 3 ? 'yellow' : 'green';
  return { rating, factors, score };
}

export default TriageBadge;