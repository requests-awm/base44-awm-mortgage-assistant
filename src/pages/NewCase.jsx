import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import IntakeForm from '@/components/intake/IntakeForm';
import { toast } from 'sonner';

export default function NewCase() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState(false);
  const [createdCase, setCreatedCase] = useState(null);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();

      // Generate reference
      const reference = `AWM-${Date.now().toString(36).toUpperCase()}`;

      // Auto-generate Asana URL if GID provided
      if (data.asana_task_gid) {
        data.asana_task_url = `https://app.asana.com/0/0/${data.asana_task_gid}`;
      }
      
      // Calculate triage rating
      const triageResponse = await base44.functions.invoke('calculateTriage', {
        ltv: data.ltv,
        annual_income: data.annual_income,
        category: data.category,
        income_type: data.income_type,
        purpose: data.purpose
      });
      const { rating, factors, timestamp } = triageResponse.data;
      
      // Calculate timeline urgency if deadline provided
      let timelineData = { urgency: 'standard', days_left: null };
      if (data.client_deadline) {
        const timelineResponse = await base44.functions.invoke('calculateTimelineUrgency', {
          client_deadline: data.client_deadline
        });
        timelineData = timelineResponse.data;
      }
      
      // Match lenders
      let lenderMatchData = {
        matched_lenders: [],
        total_lender_matches: 0,
        lender_match_calculated_at: null
      };
      
      try {
        const matchResponse = await base44.functions.invoke('matchLenders', {
          ltv: data.ltv,
          category: data.category,
          annual_income: data.annual_income,
          income_type: data.income_type
        });
        
        lenderMatchData = {
          matched_lenders: matchResponse.data.lenders,
          rejected_lenders: matchResponse.data.rejected_lenders || [],
          total_lender_matches: matchResponse.data.total_matches,
          total_rejected_lenders: matchResponse.data.total_rejected || 0,
          lender_match_calculated_at: matchResponse.data.timestamp
        };
      } catch (error) {
        console.error('Lender matching failed:', error);
        // Continue with case creation even if matching fails
      }
      
      const caseData = {
        ...data,
        reference,
        stage: data.intake_type === 'referral' ? 'data_completion' : 'intake_received',
        referred_by: user?.email,
        created_by: user?.full_name || user?.email,
        assigned_to: user?.full_name || user?.email,
        last_activity_by: user?.full_name || user?.email,
        data_complete: data.intake_type !== 'referral',
        stage_entered_at: new Date().toISOString(),
        triage_rating: rating,
        triage_factors: factors,
        triage_last_calculated: timestamp,
        timeline_urgency: timelineData.urgency,
        days_until_deadline: timelineData.days_left,
        ...lenderMatchData
      };

      const newCase = await base44.entities.MortgageCase.create(caseData);

      // Create audit log
      await base44.entities.AuditLog.create({
        case_id: newCase.id,
        action: data.intake_type === 'referral' 
          ? 'Mortgage referral logged' 
          : 'Mortgage intake completed',
        action_category: 'intake',
        actor: 'user',
        actor_email: user?.email,
        stage_to: caseData.stage,
        timestamp: new Date().toISOString()
      });

      // Auto-generate email draft (non-blocking)
      try {
        await base44.functions.invoke('generateIndicativeEmail', { case_id: newCase.id });
      } catch (emailError) {
        console.error('Email generation failed:', emailError);
        // Don't block case creation if email fails
        await base44.entities.MortgageCase.update(newCase.id, {
          email_status: 'failed'
        });
      }

      return newCase;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['mortgageCases']);
      setCreatedCase(data);
      setSuccess(true);
      toast.success('Case created! Email draft generated.');
    },
    onError: (error) => {
      toast.error('Failed to create case: ' + error.message);
    }
  });

  if (success && createdCase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Case Created</h1>
          <p className="text-slate-500 mb-6">
            Reference: <span className="font-mono font-semibold">{createdCase.reference}</span>
          </p>
          <p className="text-sm text-slate-500 mb-8">
            {createdCase.stage === 'data_completion' 
              ? 'The mortgage team will complete the intake and begin processing.'
              : 'The agent will now validate data and begin market analysis.'}
          </p>
          <div className="flex gap-3 justify-center">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
            <Link to={createPageUrl(`CaseDetail?id=${createdCase.id}`)}>
              <Button className="bg-slate-900 hover:bg-slate-800">View Case</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100">
      <div className="max-w-2xl mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" className="mb-4 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">New Mortgage Intake</h1>
          <p className="text-slate-500 mt-1">
            Create a new case for agent-assisted processing
          </p>
        </div>

        {/* Intake Form */}
        <IntakeForm
          onSubmit={(data) => createMutation.mutate(data)}
          isSubmitting={createMutation.isPending}
        />
      </div>
    </div>
  );
}