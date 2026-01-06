import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, User, Building, Banknote, Clock, 
  FileText, Play, Pause, CheckCircle, AlertTriangle,
  MessageSquare, Send, RefreshCw, Loader2, Eye,
  Calendar, Mail, Phone, ExternalLink, ShieldCheck
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import IndicativeReport from '@/components/case/IndicativeReport';
import CaseTimeline from '@/components/case/CaseTimeline';
import FeeAcknowledgement from '@/components/case/FeeAcknowledgement';
import LenderChecks from '@/components/case/LenderChecks';
import UnderwritingAnalysis from '@/components/case/UnderwritingAnalysis';

const STAGE_CONFIG = {
  intake_received: { label: 'Intake Received', color: 'bg-slate-100 text-slate-700' },
  data_completion: { label: 'Data Completion', color: 'bg-amber-100 text-amber-700' },
  market_analysis: { label: 'Market Analysis', color: 'bg-blue-100 text-blue-700' },
  human_review: { label: 'Human Review', color: 'bg-purple-100 text-purple-700' },
  pending_delivery: { label: 'Pending Delivery', color: 'bg-indigo-100 text-indigo-700' },
  awaiting_decision: { label: 'Awaiting Decision', color: 'bg-cyan-100 text-cyan-700' },
  decision_chase: { label: 'Decision Chase', color: 'bg-orange-100 text-orange-700' },
  client_proceeding: { label: 'Client Proceeding', color: 'bg-emerald-100 text-emerald-700' },
  broker_validation: { label: 'Broker Validation', color: 'bg-teal-100 text-teal-700' },
  application_submitted: { label: 'Application Submitted', color: 'bg-green-100 text-green-700' },
  offer_received: { label: 'Offer Received', color: 'bg-green-200 text-green-800' },
  completed: { label: 'Completed', color: 'bg-green-500 text-white' },
  withdrawn: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-600' },
  unsuitable: { label: 'Unsuitable', color: 'bg-red-100 text-red-700' }
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

export default function CaseDetail() {
  const params = new URLSearchParams(window.location.search);
  const caseId = params.get('id');
  const queryClient = useQueryClient();

  const { data: caseData, isLoading } = useQuery({
    queryKey: ['mortgageCase', caseId],
    queryFn: async () => {
      const cases = await base44.entities.MortgageCase.filter({ id: caseId });
      return cases[0];
    },
    enabled: !!caseId
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['auditLogs', caseId],
    queryFn: () => base44.entities.AuditLog.filter({ case_id: caseId }, '-created_date'),
    enabled: !!caseId
  });

  const updateMutation = useMutation({
    mutationFn: async (updates) => {
      const user = await base44.auth.me();
      await base44.entities.MortgageCase.update(caseId, updates);
      
      if (updates.stage && updates.stage !== caseData.stage) {
        await base44.entities.AuditLog.create({
          case_id: caseId,
          action: `Stage changed to ${STAGE_CONFIG[updates.stage]?.label}`,
          action_category: 'stage_change',
          actor: 'user',
          actor_email: user?.email,
          stage_from: caseData.stage,
          stage_to: updates.stage,
          timestamp: new Date().toISOString()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mortgageCase', caseId]);
      queryClient.invalidateQueries(['auditLogs', caseId]);
      toast.success('Case updated');
    }
  });

  const handleFeeAcknowledge = async () => {
    await updateMutation.mutateAsync({
      fee_acknowledged: true,
      fee_acknowledged_at: new Date().toISOString(),
      invoicing_triggered: true
    });
    
    const user = await base44.auth.me();
    await base44.entities.AuditLog.create({
      case_id: caseId,
      action: 'Fee acknowledgement recorded',
      action_category: 'commercial',
      actor: 'user',
      actor_email: user?.email,
      timestamp: new Date().toISOString()
    });
  };

  const handleTogglePause = async () => {
    await updateMutation.mutateAsync({
      agent_paused: !caseData.agent_paused,
      pause_reason: !caseData.agent_paused ? 'Manual pause' : null
    });
  };

  const runAnalysisMutation = useMutation({
    mutationFn: async () => {
      // Move to market_analysis stage to trigger automated processing
      await updateMutation.mutateAsync({
        stage: 'market_analysis',
        stage_entered_at: new Date().toISOString()
      });
      
      // Call the backend function to process immediately
      await base44.functions.invoke('processMarketAnalysis', {});
    },
    onSuccess: () => {
      toast.success('Report generation started - refresh in 30-60 seconds');
      setTimeout(() => {
        queryClient.invalidateQueries(['mortgageCase', caseId]);
      }, 2000);
    },
    onError: (error) => {
      toast.error('Failed to start analysis: ' + error.message);
    }
  });

  const handleApproveReport = async () => {
    const user = await base44.auth.me();
    await updateMutation.mutateAsync({
      report_reviewed: true,
      report_reviewer: user?.email,
      stage: 'pending_delivery',
      stage_entered_at: new Date().toISOString()
    });
    
    await base44.entities.AuditLog.create({
      case_id: caseId,
      action: 'Report approved for delivery',
      action_category: 'delivery',
      actor: 'user',
      actor_email: user?.email,
      stage_from: 'human_review',
      stage_to: 'pending_delivery',
      timestamp: new Date().toISOString()
    });
  };

  const sendReportMutation = useMutation({
    mutationFn: async () => {
      return await base44.functions.invoke('sendReportEmail', { caseId });
    },
    onSuccess: () => {
      toast.success('Report sent to client successfully');
      queryClient.invalidateQueries(['mortgageCase', caseId]);
      queryClient.invalidateQueries(['auditLogs', caseId]);
    },
    onError: (error) => {
      toast.error('Failed to send report: ' + error.message);
    }
  });

  const runUnderwritingMutation = useMutation({
    mutationFn: async () => {
      return await base44.functions.invoke('runUnderwritingAnalysis', { caseId });
    },
    onSuccess: () => {
      toast.success('Underwriting analysis completed');
      queryClient.invalidateQueries(['mortgageCase', caseId]);
    },
    onError: (error) => {
      toast.error('Analysis failed: ' + error.message);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <AlertTriangle className="w-12 h-12 text-slate-400 mb-4" />
        <h1 className="text-xl font-semibold text-slate-900">Case not found</h1>
        <Link to={createPageUrl('Dashboard')}>
          <Button variant="link" className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const stage = STAGE_CONFIG[caseData.stage] || STAGE_CONFIG.intake_received;

  const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-GB', { 
      style: 'currency', 
      currency: 'GBP',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" className="mb-4 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pipeline
            </Button>
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{caseData.client_name}</h1>
                {caseData.agent_paused && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    <Pause className="w-3 h-3 mr-1" />
                    Paused
                  </Badge>
                )}
              </div>
              <p className="text-slate-500 mt-1 font-mono">{caseData.reference}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge className={`${stage.color} text-sm py-1.5 px-3`}>
                {stage.label}
              </Badge>
              
              {/* Run Analysis Button - show if no report yet */}
              {!caseData.indicative_report && !['market_analysis', 'human_review'].includes(caseData.stage) && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => runAnalysisMutation.mutate()}
                  disabled={runAnalysisMutation.isPending || caseData.agent_paused}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {runAnalysisMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Building className="w-4 h-4 mr-1" />
                      Run Analysis
                    </>
                  )}
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleTogglePause}
                disabled={updateMutation.isPending}
              >
                {caseData.agent_paused ? (
                  <>
                    <Play className="w-4 h-4 mr-1" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 mr-1" />
                    Pause
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Processing Banner */}
        {caseData.stage === 'market_analysis' && (
          <Card className="border-0 shadow-lg bg-blue-50 border-blue-200 mb-6">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <div className="absolute inset-0 rounded-full border-2 border-blue-200" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                    Generating Indicative Report
                    <span className="inline-flex items-center gap-1 text-xs font-normal text-blue-700">
                      <Clock className="w-3 h-3" />
                      30-60 seconds
                    </span>
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Analyzing market position, checking lender eligibility, and preparing report...
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => queryClient.invalidateQueries(['mortgageCase', caseId])}
                    className="mt-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Refresh Status
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="overview">
              <TabsList className="bg-white/80 mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="report">Indicative Report</TabsTrigger>
                <TabsTrigger value="checks">Lender Checks</TabsTrigger>
                <TabsTrigger value="underwriting">Underwriting</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Case Summary */}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Category</p>
                        <p className="font-medium text-slate-900">
                          {CATEGORY_LABELS[caseData.category] || caseData.category}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Purpose</p>
                        <p className="font-medium text-slate-900">
                          {PURPOSE_LABELS[caseData.purpose] || caseData.purpose}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Property Value</p>
                        <p className="font-medium text-slate-900">
                          {formatCurrency(caseData.property_value)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Loan Amount</p>
                        <p className="font-medium text-slate-900">
                          {formatCurrency(caseData.loan_amount)}
                        </p>
                      </div>
                    </div>

                    {caseData.ltv && (
                      <div className="mt-6 pt-6 border-t">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-slate-500">Loan-to-Value</span>
                          <span className={`font-semibold ${
                            caseData.ltv <= 75 ? 'text-emerald-600' :
                            caseData.ltv <= 85 ? 'text-amber-600' :
                            'text-orange-600'
                          }`}>{caseData.ltv}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              caseData.ltv <= 75 ? 'bg-emerald-400' :
                              caseData.ltv <= 85 ? 'bg-amber-400' :
                              'bg-orange-400'
                            }`}
                            style={{ width: `${Math.min(caseData.ltv, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Client Contact */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-500" />
                      Client Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {caseData.client_email && (
                        <div className="flex items-center gap-3 text-sm">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-700">{caseData.client_email}</span>
                        </div>
                      )}
                      {caseData.client_phone && (
                        <div className="flex items-center gap-3 text-sm">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-700">{caseData.client_phone}</span>
                        </div>
                      )}
                      {caseData.income_type && (
                        <div className="flex items-center gap-3 text-sm">
                          <Banknote className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-700 capitalize">{caseData.income_type.replace('_', ' ')}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Fee Acknowledgement (show when client proceeding) */}
                {caseData.stage === 'client_proceeding' && (
                  <FeeAcknowledgement 
                    caseData={caseData}
                    onAcknowledge={handleFeeAcknowledge}
                    isSubmitting={updateMutation.isPending}
                  />
                )}

                {/* Human Review Actions */}
                {caseData.stage === 'human_review' && caseData.indicative_report && (
                  <Card className="border-0 shadow-sm bg-purple-50/50 border-purple-200">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-purple-100 rounded-xl">
                          <Eye className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-purple-900">Report Ready for Review</h3>
                          <p className="text-sm text-purple-700 mt-1">
                            Review the indicative report and approve for client delivery
                          </p>
                          <Button 
                            onClick={handleApproveReport}
                            disabled={updateMutation.isPending}
                            className="mt-4 bg-purple-600 hover:bg-purple-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve & Schedule Delivery
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Pending Delivery Actions */}
                {caseData.stage === 'pending_delivery' && caseData.indicative_report && (
                  <Card className="border-0 shadow-sm bg-blue-50/50 border-blue-200">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                          <Send className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-blue-900">Ready to Send to Client</h3>
                          <p className="text-sm text-blue-700 mt-1">
                            Report approved. Send to {caseData.client_email}
                          </p>
                          <Button 
                            onClick={() => sendReportMutation.mutate()}
                            disabled={sendReportMutation.isPending || !caseData.client_email}
                            className="mt-4 bg-blue-600 hover:bg-blue-700"
                          >
                            {sendReportMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-2" />
                                Send Report to Client
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Awaiting Decision Status */}
                {['awaiting_decision', 'decision_chase'].includes(caseData.stage) && (
                  <Card className="border-0 shadow-sm bg-amber-50/50 border-amber-200">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-amber-100 rounded-xl">
                          <MessageSquare className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-amber-900">
                            {caseData.stage === 'decision_chase' ? 'Following Up with Client' : 'Awaiting Client Decision'}
                          </h3>
                          <p className="text-sm text-amber-700 mt-1">
                            Report delivered {caseData.delivered_at && formatDistanceToNow(new Date(caseData.delivered_at), { addSuffix: true })}
                          </p>
                          {caseData.chase_count > 0 && (
                            <p className="text-xs text-amber-600 mt-2">
                              Follow-up attempts: {caseData.chase_count}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="report">
                {caseData.indicative_report ? (
                  <IndicativeReport report={caseData.indicative_report} caseData={caseData} />
                ) : (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-12 text-center">
                      <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="font-medium text-slate-900 mb-1">No Report Yet</h3>
                      <p className="text-sm text-slate-500">
                        The indicative report will appear here once generated
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="checks">
                <LenderChecks checks={caseData.lender_checks} />
              </TabsContent>

              <TabsContent value="underwriting">
                <div className="mb-4">
                  <Button
                    onClick={() => runUnderwritingMutation.mutate()}
                    disabled={runUnderwritingMutation.isPending || caseData.agent_paused}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {runUnderwritingMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Run Underwriting Analysis
                      </>
                    )}
                  </Button>
                </div>
                <UnderwritingAnalysis analysis={caseData.underwriting_analysis} />
              </TabsContent>

              <TabsContent value="activity">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Case Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CaseTimeline logs={auditLogs} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Portal Link */}
            {caseData.client_email && (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-50 to-blue-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-indigo-600" />
                    Client Portal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-600 mb-3">
                    Share this link with the client to view their report and respond
                  </p>
                  <div className="flex gap-2">
                    <Input 
                      value={`${window.location.origin}/portal/${caseData.reference}`}
                      readOnly
                      className="text-xs bg-white/80"
                    />
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/portal/${caseData.reference}`);
                        toast.success('Link copied');
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Key Dates */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  Key Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500">Created</p>
                  <p className="text-sm font-medium">
                    {format(new Date(caseData.created_date), 'dd MMM yyyy, HH:mm')}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(caseData.created_date), { addSuffix: true })}
                  </p>
                </div>
                {caseData.rate_expiry_date && (
                  <div>
                    <p className="text-xs text-slate-500">Rate Expiry</p>
                    <p className="text-sm font-medium">
                      {format(new Date(caseData.rate_expiry_date), 'dd MMM yyyy')}
                    </p>
                  </div>
                )}
                {caseData.scheduled_delivery_at && (
                  <div>
                    <p className="text-xs text-slate-500">Scheduled Delivery</p>
                    <p className="text-sm font-medium">
                      {format(new Date(caseData.scheduled_delivery_at), 'dd MMM yyyy, HH:mm')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Referral Info */}
            {caseData.referred_by && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" />
                    Referral
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700">{caseData.referred_by}</p>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {caseData.intake_type === 'referral' ? 'Referral Only' : 'Full Intake'}
                  </Badge>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {caseData.notes && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{caseData.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Flags */}
            {caseData.flags && caseData.flags.length > 0 && (
              <Card className="border-0 shadow-sm border-amber-200 bg-amber-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-amber-800">
                    <AlertTriangle className="w-4 h-4" />
                    Flags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {caseData.flags.map((flag, idx) => (
                      <Badge key={idx} variant="outline" className="text-amber-700 border-amber-300">
                        {flag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}