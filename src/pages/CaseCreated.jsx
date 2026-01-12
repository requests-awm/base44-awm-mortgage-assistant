import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Mail, Loader2, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import EmailDraftModal from '@/components/email/EmailDraftModal';

const TRIAGE_CONFIG = {
  blue: { color: '#3B82F6', label: 'Quick Win', emoji: '🔵' },
  green: { color: '#10B981', label: 'Good Case', emoji: '🟢' },
  yellow: { color: '#F59E0B', label: 'Needs Attention', emoji: '🟡' },
  red: { color: '#EF4444', label: 'Complex', emoji: '🔴' }
};

const TIMELINE_CONFIG = {
  overdue: { label: 'OVERDUE', color: 'text-red-600', icon: '🚨' },
  critical: { label: 'URGENT', color: 'text-red-600', icon: '⚠️' },
  soon: { label: 'DUE SOON', color: 'text-amber-600', icon: '⏰' },
  standard: { label: 'Standard', color: 'text-slate-500', icon: '' }
};

export default function CaseCreated() {
  const [searchParams] = useSearchParams();
  const caseId = searchParams.get('id');
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [generationError, setGenerationError] = useState(null);

  const { data: mortgageCase, isLoading } = useQuery({
    queryKey: ['mortgageCase', caseId],
    queryFn: () => base44.entities.MortgageCase.filter({ id: caseId }).then(cases => cases[0]),
    enabled: !!caseId
  });

  useEffect(() => {
    if (!caseId) {
      navigate(createPageUrl('Dashboard'));
    }
  }, [caseId, navigate]);

  const handleGenerateEmail = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      const response = await base44.functions.invoke('generateIndicativeEmail', {
        case_id: caseId
      });
      
      if (response.data.success) {
        toast.success('Email draft generated!');
        setShowEmailModal(true);
      } else {
        throw new Error(response.data.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Email generation error:', error);
      setGenerationError(error.message);
      toast.error('Failed to generate email: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading || !mortgageCase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const triageConfig = TRIAGE_CONFIG[mortgageCase.triage_rating] || TRIAGE_CONFIG.green;
  const timelineConfig = mortgageCase.client_deadline 
    ? TIMELINE_CONFIG[mortgageCase.timeline_urgency] || TIMELINE_CONFIG.standard
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100">
      <div className="max-w-3xl mx-auto p-6 lg:p-8 pt-12">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Case Created Successfully</h1>
          <p className="text-slate-500">
            Ready for next steps
          </p>
        </div>

        {/* Case Summary Card */}
        <Card className="mb-8 shadow-lg">
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Client Name */}
              <div>
                <p className="text-sm text-slate-500 mb-1">Client Name</p>
                <h2 className="text-2xl font-bold text-slate-900">{mortgageCase.client_name}</h2>
              </div>

              {/* Case Reference */}
              <div>
                <p className="text-sm text-slate-500 mb-1">Case Reference</p>
                <p className="text-lg font-mono font-semibold text-slate-700">{mortgageCase.reference}</p>
              </div>

              {/* Key Information Grid */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                {/* Triage Rating */}
                <div>
                  <p className="text-sm text-slate-500 mb-2">Complexity Rating</p>
                  <div className="flex items-center gap-2">
                    <span style={{ color: triageConfig.color }} className="text-2xl">
                      {triageConfig.emoji}
                    </span>
                    <span className="font-semibold text-slate-900">{triageConfig.label}</span>
                  </div>
                </div>

                {/* Lender Count */}
                <div>
                  <p className="text-sm text-slate-500 mb-2">Lender Matches</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {mortgageCase.total_lender_matches || 0}
                  </p>
                </div>
              </div>

              {/* Timeline Status (if exists) */}
              {timelineConfig && mortgageCase.days_until_deadline !== null && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50">
                    <Clock className={`w-5 h-5 ${timelineConfig.color}`} />
                    <div className="flex-1">
                      <p className={`font-semibold ${timelineConfig.color}`}>
                        {timelineConfig.icon} {timelineConfig.label}
                      </p>
                      <p className="text-sm text-slate-600">
                        {mortgageCase.days_until_deadline < 0 
                          ? `${Math.abs(mortgageCase.days_until_deadline)} days overdue`
                          : `${mortgageCase.days_until_deadline} days remaining`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-4 mb-6">
          <Button
            onClick={handleGenerateEmail}
            disabled={isGenerating}
            className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating with AI...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5 mr-2" />
                📧 Generate Email Draft
              </>
            )}
          </Button>

          {generationError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">
                ❌ Email generation failed. Please try again.
              </p>
            </div>
          )}

          <Link to={createPageUrl('Dashboard')} className="block">
            <Button
              variant="outline"
              className="w-full h-12 text-base"
            >
              Go to Dashboard →
            </Button>
          </Link>
        </div>

        {/* Helper Text */}
        <p className="text-center text-sm text-slate-500 max-w-xl mx-auto">
          Generate an AI-powered email draft now while details are fresh, or save the case 
          and generate the email later from the case detail page.
        </p>

        {/* Email Draft Modal */}
        {showEmailModal && mortgageCase && (
          <EmailDraftModal
            isOpen={showEmailModal}
            onClose={() => {
              setShowEmailModal(false);
              navigate(createPageUrl('Dashboard'));
            }}
            caseData={mortgageCase}
          />
        )}
      </div>
    </div>
  );
}