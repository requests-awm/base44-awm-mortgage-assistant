import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, X, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const REQUIRED_FIELDS = [
  { key: 'property_value', label: 'Property Value' },
  { key: 'loan_amount', label: 'Loan Amount' },
  { key: 'annual_income', label: 'Annual Income' },
  { key: 'income_type', label: 'Employment Type' },
  { key: 'category', label: 'Category' },
  { key: 'purpose', label: 'Purpose' },
  { key: 'client_name', label: 'Client Name' },
  { key: 'client_email', label: 'Client Email' },
  { key: 'client_phone', label: 'Client Phone' }
];

export default function IncompleteCaseCard({ mortgageCase }) {
  const completedFields = REQUIRED_FIELDS.filter(field => {
    const value = mortgageCase[field.key];
    return value !== null && value !== undefined && value !== '';
  });

  const completionPercentage = Math.round((completedFields.length / REQUIRED_FIELDS.length) * 100);

  return (
    <Card className="border-l-4 border-l-amber-400 bg-white hover:shadow-lg transition-all cursor-pointer border border-slate-200">
      <Link to={createPageUrl(`CaseDetail?id=${mortgageCase.id}`)}>
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-slate-900">{mortgageCase.reference}</h3>
                {mortgageCase.asana_task_gid && (
                  <span className="text-xs text-emerald-600 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Asana
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600">
                Created {formatDistanceToNow(new Date(mortgageCase.created_date), { addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Client Info Checklist */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              {mortgageCase.client_name ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <X className="w-4 h-4 text-red-500" />
              )}
              <span className={mortgageCase.client_name ? 'text-slate-700' : 'text-slate-400'}>
                Client Name: {mortgageCase.client_name || 'Missing'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              {mortgageCase.client_email ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <X className="w-4 h-4 text-red-500" />
              )}
              <span className={mortgageCase.client_email ? 'text-slate-700' : 'text-slate-400'}>
                Email: {mortgageCase.client_email || 'Missing'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              {mortgageCase.client_phone ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <X className="w-4 h-4 text-red-500" />
              )}
              <span className={mortgageCase.client_phone ? 'text-slate-700' : 'text-slate-400'}>
                Phone: {mortgageCase.client_phone || 'Missing'}
              </span>
            </div>
          </div>

          {/* Required Fields Summary */}
          <div className="bg-white/60 rounded-lg p-3 mb-4 border border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">Required Fields</span>
              <span className="text-xs font-bold text-amber-700">
                {completedFields.length}/{REQUIRED_FIELDS.length}
              </span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>

          {/* Missing Fields List */}
          {completedFields.length < REQUIRED_FIELDS.length && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-600 mb-2">Still needed:</p>
              <div className="flex flex-wrap gap-1">
                {REQUIRED_FIELDS.filter(field => {
                  const value = mortgageCase[field.key];
                  return !value || value === '';
                }).map(field => (
                  <span 
                    key={field.key}
                    className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-md border border-amber-300"
                  >
                    {field.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          <Button 
            className="w-full bg-[#D1B36A] hover:bg-[#DBC17D] text-[#0E1B2A] font-semibold"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = createPageUrl(`CaseDetail?id=${mortgageCase.id}`);
            }}
          >
            Complete Intake
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Link>
    </Card>
  );
}