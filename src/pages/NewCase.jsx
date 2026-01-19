import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import IntakeForm from '@/components/intake/IntakeForm';
import { toast } from 'sonner';

export default function NewCase() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data) => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🆕 CREATING NEW CASE');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[NewCase] Mutation started with data:', data);
      const user = await base44.auth.me();
      console.log('[NewCase] User:', user);

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
      
      const userIdentifier = user?.full_name || user?.email;
      console.log('[NewCase] Creating case for user:', userIdentifier);

      const caseData = {
        ...data,
        reference,
        case_type: 'case',
        created_from_asana: false,
        stage: 'intake_received',
        created_by: userIdentifier,
        assigned_to: userIdentifier,
        last_activity_by: userIdentifier,
        data_complete: true,
        stage_entered_at: new Date().toISOString(),
        triage_rating: rating,
        triage_factors: factors,
        triage_last_calculated: timestamp,
        timeline_urgency: timelineData.urgency,
        days_until_deadline: timelineData.days_left,
        email_status: 'not_generated',
        ...lenderMatchData
      };

      console.log('[NewCase] Case data:', { 
        created_by: caseData.created_by, 
        assigned_to: caseData.assigned_to,
        referring_team_member: caseData.referring_team_member,
        referring_team: caseData.referring_team
      });

      const newCase = await base44.entities.MortgageCase.create(caseData);
      console.log('[NewCase] Case created:', newCase.id);

      // Create audit log
      await base44.entities.AuditLog.create({
        case_id: newCase.id,
        action: 'Mortgage intake completed',
        action_category: 'intake',
        actor: 'user',
        actor_email: user?.email,
        stage_to: caseData.stage,
        timestamp: new Date().toISOString()
      });

      console.log('✅ Case created successfully:', newCase.reference);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      return newCase;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['mortgageCases']);
      toast.success(`✅ Case ${data.reference} created successfully`);
      navigate(createPageUrl(`Dashboard?highlight=${data.id}`));
    },
    onError: (error) => {
      console.error('❌ Failed to create case:', error);
      toast.error('Failed to create case. Please try again.');
    }
  });

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