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
  Calendar, Mail, Phone, ExternalLink, ShieldCheck,
  Edit, Trash2, ArrowUpDown
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import IndicativeReport from '@/components/case/IndicativeReport';
import CaseTimeline from '@/components/case/CaseTimeline';
import FeeAcknowledgement from '@/components/case/FeeAcknowledgement';
import LenderChecks from '@/components/case/LenderChecks';
import UnderwritingAnalysis from '@/components/case/UnderwritingAnalysis';
import ReportDraftEditor from '@/components/case/ReportDraftEditor';
import DeliveryScheduler from '@/components/case/DeliveryScheduler';
import { TriageBadge, calculateTriageRating } from '@/components/dashboard/TriageBadge.jsx';
import EditCaseDialog from '@/components/case/EditCaseDialog';
import { useNavigate } from 'react-router-dom';
import EmailDraftModal from '@/components/email/EmailDraftModal';
import CaseInfoCard from '@/components/case/CaseInfoCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState('confidence');
  const [sortOrder, setSortOrder] = useState('desc');

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
      const user = await base44.auth.me();
      // Update analysis status
      await base44.entities.MortgageCase.update(caseId, {
        analysis_status: 'queued',
        stage: 'market_analysis',
        stage_entered_at: new Date().toISOString()
      });
      
      // Call the backend function to process immediately
      const result = await base44.functions.invoke('generateIndicativeReport', { caseId });
      return result;
    },
    onSuccess: () => {
      toast.success('Analysis complete - reviewing report');
      queryClient.invalidateQueries(['mortgageCase', caseId]);
    },
    onError: (error) => {
      toast.error('Analysis failed: ' + error.message);
      base44.entities.MortgageCase.update(caseId, {
        analysis_status: 'failed',
        analysis_error: error.message
      });
      queryClient.invalidateQueries(['mortgageCase', caseId]);
    }
  });

  const saveDraftMutation = useMutation({
    mutationFn: async (draftData) => {
      const user = await base44.auth.me();
      return await base44.entities.MortgageCase.update(caseId, {
        report_draft: {
          ...draftData,
          last_edited_by: user?.email,
          last_edited_at: new Date().toISOString()
        }
      });
    },
    onSuccess: () => {
      toast.success('Draft saved');
      queryClient.invalidateQueries(['mortgageCase', caseId]);
    }
  });

  const handleApproveAndSchedule = async (scheduleData) => {
    const user = await base44.auth.me();
    await updateMutation.mutateAsync({
      delivery_status: 'approved',
      delivery_scheduled_at: scheduleData.delivery_scheduled_at,
      fast_track: scheduleData.fast_track,
      delivery_approved_by: user?.email,
      delivery_approved_at: new Date().toISOString(),
      report_reviewed: true,
      report_reviewer: user?.email,
      stage: 'pending_delivery',
      stage_entered_at: new Date().toISOString()
    });
    
    await base44.entities.AuditLog.create({
      case_id: caseId,
      action: `Report approved for delivery ${scheduleData.fast_track ? '(fast-track)' : ''}`,
      action_category: 'delivery',
      actor: 'user',
      actor_email: user?.email,
      stage_from: 'human_review',
      stage_to: 'pending_delivery',
      timestamp: new Date().toISOString()
    });
    
    // If fast-track, trigger immediate send
    if (scheduleData.fast_track) {
      await base44.functions.invoke('sendReportEmail', { caseId });
    }
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

  const editMutation = useMutation({
    mutationFn: async (updates) => {
      console.log('🔄 Saving case updates...', updates);
      const user = await base44.auth.me();
      
      // Recalculate timeline urgency if deadline changed
      if (updates.client_deadline !== caseData.client_deadline) {
        console.log('📅 Timeline changed, recalculating urgency...');
        const timelineResponse = await base44.functions.invoke('calculateTimelineUrgency', {
          client_deadline: updates.client_deadline
        });
        updates.timeline_urgency = timelineResponse.data.urgency;
        updates.days_until_deadline = timelineResponse.data.days_left;
        console.log('✅ Timeline urgency:', timelineResponse.data.urgency);
      }
      
      // Check if financial data changed - recalculate triage and lender matching
      const financialChanged = 
        updates.property_value !== caseData.property_value ||
        updates.loan_amount !== caseData.loan_amount ||
        updates.annual_income !== caseData.annual_income ||
        updates.category !== caseData.category ||
        updates.income_type !== caseData.income_type;
      
      if (financialChanged && updates.ltv) {
        console.log('💰 Financial data changed, recalculating triage & lenders...');
        console.log('   Old LTV:', caseData.ltv, '-> New LTV:', updates.ltv);
        
        // Recalculate triage
        console.log('🎯 Calling calculateTriage...');
        const triageResponse = await base44.functions.invoke('calculateTriage', {
          ltv: updates.ltv,
          annual_income: updates.annual_income || 0,
          category: updates.category,
          income_type: updates.income_type,
          purpose: updates.purpose
        });
        
        updates.triage_rating = triageResponse.data.rating;
        updates.triage_factors = triageResponse.data.factors;
        updates.triage_last_calculated = new Date().toISOString();
        console.log('✅ Triage recalculated:', triageResponse.data.rating);
        
        // Recalculate lender matching
        console.log('🏦 Calling matchLenders...');
        const lenderResponse = await base44.functions.invoke('matchLenders', {
          ltv: updates.ltv,
          loan_amount: updates.loan_amount,
          annual_income: updates.annual_income || 0,
          income_type: updates.income_type,
          category: updates.category,
          client_age: 35 // Default if not tracked
        });
        
        updates.matched_lenders = lenderResponse.data.matched;
        updates.rejected_lenders = lenderResponse.data.rejected;
        updates.total_lender_matches = lenderResponse.data.matched.length;
        updates.total_rejected_lenders = lenderResponse.data.rejected.length;
        updates.lender_match_calculated_at = new Date().toISOString();
        console.log('✅ Lenders matched:', lenderResponse.data.matched.length);
      }
      
      console.log('💾 Saving to database...');
      await base44.entities.MortgageCase.update(caseId, updates);
      
      await base44.entities.AuditLog.create({
        case_id: caseId,
        action: 'Case details updated' + (financialChanged ? ' (triage & lenders recalculated)' : ''),
        action_category: 'manual_override',
        actor: 'user',
        actor_email: user?.email,
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ Case update complete!');
    },
    onSuccess: (_, updates) => {
      const financialChanged = 
        updates.property_value !== caseData.property_value ||
        updates.loan_amount !== caseData.loan_amount ||
        updates.annual_income !== caseData.annual_income ||
        updates.category !== caseData.category ||
        updates.income_type !== caseData.income_type;
      
      queryClient.invalidateQueries(['mortgageCase', caseId]);
      queryClient.invalidateQueries(['auditLogs', caseId]);
      setIsEditDialogOpen(false);
      toast.success(financialChanged ? 'Case updated - triage recalculated' : 'Case updated successfully');
    },
    onError: (error) => {
      console.error('❌ Edit mutation failed:', error);
      toast.error('Failed to update case: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.MortgageCase.delete(caseId);
      await base44.entities.AuditLog.delete({ case_id: caseId });
    },
    onSuccess: () => {
      toast.success('Case deleted successfully');
      navigate(createPageUrl('Dashboard'));
    },
    onError: (error) => {
      toast.error('Failed to delete case: ' + error.message);
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

  const CATEGORY_LABELS = {
    high_street: 'High Street',
    building_society: 'Building Society',
    specialist: 'Specialist',
    private_bank: 'Private Bank',
    challenger: 'Challenger'
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (confidence >= 60) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-orange-50 text-orange-700 border-orange-200';
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const sortedMatchedLenders = [...(caseData?.matched_lenders || [])].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'confidence') {
      comparison = (b.confidence || 0) - (a.confidence || 0);
    } else if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === 'category') {
      comparison = (a.category || '').localeCompare(b.category || '');
    } else if (sortBy === 'max_ltv') {
      comparison = (b.max_ltv || 0) - (a.max_ltv || 0);
    }
    return sortOrder === 'desc' ? comparison : -comparison;
  });

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
                <TriageBadge 
                  rating={(caseData.triage_rating || calculateTriageRating(caseData).rating)}
                  factors={(caseData.triage_factors || calculateTriageRating(caseData).factors)}
                />
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
              {caseData.asana_task_url && (
                <a
                  href={caseData.asana_task_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#f06a6a] text-[#f06a6a] hover:bg-[#f06a6a] hover:text-white"
                  >
                    <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-12.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm-4.5 4.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm9 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/>
                    </svg>
                    View in Asana
                  </Button>
                </a>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEmailModalOpen(true)}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
              >
                <Mail className="w-4 h-4 mr-1" />
                Email
              </Button>

              <Button
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
                className="bg-[#D1B36A] text-[#0E1B2A] font-semibold hover:bg-[#DBC17D]"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
              
              <Badge className={`${stage.color} text-sm py-1.5 px-3`}>
                {stage.label}
              </Badge>
              
              {/* Run Analysis Button - show if no analysis yet */}
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
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Building className="w-4 h-4 mr-1" />
                      Generate AI Analysis
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
                    Running AI Analysis
                    <span className="inline-flex items-center gap-1 text-xs font-normal text-blue-700">
                      <Clock className="w-3 h-3" />
                      30-60 seconds
                    </span>
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    AI is analyzing lender matches, checking eligibility criteria, and building recommendations...
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
                <TabsTrigger value="report">AI Analysis</TabsTrigger>
                <TabsTrigger value="draft">Email Draft</TabsTrigger>
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

                {/* Matched Lenders */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building className="w-4 h-4 text-slate-500" />
                      Matched Lenders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(caseData.total_lender_matches || 0) === 0 ? (
                      <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>No lenders matched - review criteria in Lender Checks tab</span>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50">
                                <TableHead>
                                  <button
                                    onClick={() => handleSort('name')}
                                    className="flex items-center gap-1 hover:text-slate-900 font-semibold"
                                  >
                                    Lender Name
                                    {sortBy === 'name' && (
                                      <span className="text-xs">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                                    )}
                                  </button>
                                </TableHead>
                                <TableHead>
                                  <button
                                    onClick={() => handleSort('category')}
                                    className="flex items-center gap-1 hover:text-slate-900 font-semibold"
                                  >
                                    Type
                                    {sortBy === 'category' && (
                                      <span className="text-xs">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                                    )}
                                  </button>
                                </TableHead>
                                <TableHead>
                                  <button
                                    onClick={() => handleSort('confidence')}
                                    className="flex items-center gap-1 hover:text-slate-900 font-semibold"
                                  >
                                    Confidence
                                    {sortBy === 'confidence' && (
                                      <span className="text-xs">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                                    )}
                                  </button>
                                </TableHead>
                                <TableHead>
                                  <button
                                    onClick={() => handleSort('max_ltv')}
                                    className="flex items-center gap-1 hover:text-slate-900 font-semibold"
                                  >
                                    Max LTV
                                    {sortBy === 'max_ltv' && (
                                      <span className="text-xs">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                                    )}
                                  </button>
                                </TableHead>
                                <TableHead className="font-semibold">Notes</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sortedMatchedLenders.map((lender, idx) => (
                                <TableRow key={idx}>
                                  <TableCell className="font-medium">{lender.name}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs">
                                      {CATEGORY_LABELS[lender.category] || lender.category || 'Unknown'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={`${getConfidenceColor(lender.confidence)} border font-semibold`}>
                                      {lender.confidence}%
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <span className="font-medium text-slate-700">{lender.max_ltv}%</span>
                                  </TableCell>
                                  <TableCell>
                                    {lender.notes ? (
                                      lender.notes.length > 50 ? (
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <button className="text-sm text-slate-600 hover:text-slate-900 text-left">
                                                {lender.notes.substring(0, 50)}...
                                              </button>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs">
                                              <p className="text-sm">{lender.notes}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      ) : (
                                        <span className="text-sm text-slate-600">{lender.notes}</span>
                                      )
                                    ) : (
                                      <span className="text-sm text-slate-400">—</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {caseData.lender_match_calculated_at && (
                          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 text-right">
                            Last calculated: {formatDistanceToNow(new Date(caseData.lender_match_calculated_at), { addSuffix: true })}
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Current Mortgage Details */}
                {caseData.purpose === 'remortgage' && (caseData.existing_lender || caseData.existing_rate || caseData.existing_product_end_date) && (
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Building className="w-4 h-4 text-slate-500" />
                        Current Mortgage
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {caseData.existing_lender && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Lender</span>
                            <span className="text-slate-900 font-medium">{caseData.existing_lender}</span>
                          </div>
                        )}
                        {caseData.existing_rate && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Current Rate</span>
                            <span className="text-slate-900 font-medium">{caseData.existing_rate}%</span>
                          </div>
                        )}
                        {caseData.existing_product_type && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Product Type</span>
                            <span className="text-slate-700">{caseData.existing_product_type}</span>
                          </div>
                        )}
                        {caseData.existing_product_end_date && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Product Ends</span>
                              <span className="text-slate-700">{format(new Date(caseData.existing_product_end_date), 'dd MMM yyyy')}</span>
                            </div>
                            {(() => {
                              const endDate = new Date(caseData.existing_product_end_date);
                              const today = new Date();
                              const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

                              if (daysUntilExpiry < 30) {
                                return (
                                  <Badge className="bg-red-100 text-red-700 border-red-200">
                                    {daysUntilExpiry < 0 ? 'EXPIRED' : `URGENT - Expires in ${daysUntilExpiry} days`}
                                  </Badge>
                                );
                              } else if (daysUntilExpiry <= 90) {
                                return (
                                  <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                                    Expiring soon - {daysUntilExpiry} days
                                  </Badge>
                                );
                              } else {
                                return (
                                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                    {daysUntilExpiry} days remaining
                                  </Badge>
                                );
                              }
                            })()}
                          </div>
                        )}
                        {caseData.existing_monthly_payment && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Monthly Payment</span>
                            <span className="text-slate-900 font-medium">{formatCurrency(caseData.existing_monthly_payment)}</span>
                          </div>
                        )}
                        {caseData.switching_reason && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Switching Reason</span>
                            <span className="text-slate-700">{caseData.switching_reason}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

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

                {/* Linked Systems */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-slate-500" />
                      Linked Systems
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {caseData.asana_task_url ? (
                      <div className="flex items-center gap-3 text-sm">
                        <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-12.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm-4.5 4.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm9 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/>
                        </svg>
                        <span className="text-slate-600">Asana Task:</span>
                        <a
                          href={caseData.asana_task_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 hover:underline font-mono text-xs"
                        >
                          {caseData.asana_task_gid}
                        </a>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No Asana task linked</p>
                    )}
                  </CardContent>
                </Card>

                {/* Email Section */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-500" />
                      Client Email
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {caseData.email_status === 'not_generated' ? (
                      <div className="text-sm text-slate-500 space-y-3">
                        <p>No email draft generated yet</p>
                        <Button
                          size="sm"
                          onClick={() => setIsEmailModalOpen(true)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Generate Email with AI
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          {caseData.email_status === 'draft' && (
                            <Badge className="bg-blue-100 text-blue-700">
                              ✉️ Draft Ready
                            </Badge>
                          )}
                          {caseData.email_status === 'sent' && (
                            <Badge className="bg-emerald-100 text-emerald-700">
                              ✓ Sent
                            </Badge>
                          )}
                          {caseData.email_status === 'failed' && (
                            <Badge className="bg-red-100 text-red-700">
                              ⚠️ Generation Failed
                            </Badge>
                          )}
                          <span className="text-xs text-slate-500">v{caseData.email_version || 1}</span>
                        </div>

                        {/* Subject Preview */}
                        {caseData.email_subject && (
                          <div className="border-l-2 border-blue-200 pl-3">
                            <p className="text-xs text-slate-500 mb-1">Subject:</p>
                            <p className="font-medium text-sm text-slate-900">{caseData.email_subject}</p>
                          </div>
                        )}

                        {/* Body Preview */}
                        {caseData.email_draft && (
                          <div className="border-l-2 border-slate-200 pl-3">
                            <p className="text-xs text-slate-500 mb-1">Preview:</p>
                            <p className="text-sm text-slate-600">
                              {caseData.email_draft.substring(0, 120)}...
                            </p>
                          </div>
                        )}

                        {/* Timeline */}
                        <div className="text-xs text-slate-500 space-y-1">
                          {caseData.email_generated_at && (
                            <p>Generated: {formatDistanceToNow(new Date(caseData.email_generated_at), { addSuffix: true })}</p>
                          )}
                          {caseData.email_sent_at && (
                            <p>Sent: {format(new Date(caseData.email_sent_at), 'dd MMM yyyy HH:mm')} by {caseData.email_sent_by}</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsEmailModalOpen(true)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Full Draft
                          </Button>
                        </div>
                      </div>
                    )}
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
                          <h3 className="font-semibold text-purple-900">AI Analysis Complete</h3>
                          <p className="text-sm text-purple-700 mt-1">
                            Review the AI analysis, then go to "Email Draft" tab to prepare client communication
                          </p>
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
                          <h3 className="font-semibold text-blue-900">Ready to Send Email</h3>
                          <p className="text-sm text-blue-700 mt-1">
                            Email approved. Send to {caseData.client_email}
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
                                Send Email to Client
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
                            Email delivered {caseData.delivered_at && formatDistanceToNow(new Date(caseData.delivered_at), { addSuffix: true })}
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
                      <h3 className="font-medium text-slate-900 mb-1">No AI Analysis Yet</h3>
                      <p className="text-sm text-slate-500">
                        AI analysis with lender matches and eligibility checks will appear here once generated
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="draft" className="space-y-6">
                <ReportDraftEditor
                  caseData={caseData}
                  onSaveDraft={(draft) => saveDraftMutation.mutate(draft)}
                  isSaving={saveDraftMutation.isPending}
                />
                
                {caseData.stage === 'human_review' && (
                  <DeliveryScheduler
                    caseData={caseData}
                    onApproveAndSchedule={handleApproveAndSchedule}
                    isSubmitting={updateMutation.isPending}
                  />
                )}
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
            {/* Case Information */}
            <CaseInfoCard caseData={caseData} />

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

      {/* Edit Dialog */}
      <EditCaseDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        caseData={caseData}
        onSave={(updates) => editMutation.mutate(updates)}
        isSaving={editMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Case?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this case? This action cannot be undone.
              All associated data including reports, audit logs, and communications will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Case'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>

        {/* Email Draft Modal */}
        <EmailDraftModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          caseData={caseData}
        />
      </div>
    );
  }