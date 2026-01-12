import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Calendar, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function CaseInfoCard({ caseData }) {
  const [isReassigning, setIsReassigning] = useState(false);
  const queryClient = useQueryClient();

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list()
  });

  const reassignMutation = useMutation({
    mutationFn: async (newAssignee) => {
      const user = await base44.auth.me();
      await base44.entities.MortgageCase.update(caseData.id, {
        assigned_to: newAssignee,
        last_activity_by: user.full_name || user.email
      });

      await base44.entities.AuditLog.create({
        case_id: caseData.id,
        action: `Case reassigned to ${newAssignee}`,
        action_category: 'manual_override',
        actor: 'user',
        actor_email: user.email,
        timestamp: new Date().toISOString()
      });
    },
    onSuccess: (_, newAssignee) => {
      queryClient.invalidateQueries(['mortgageCase', caseData.id]);
      toast.success(`Case reassigned to ${newAssignee}`);
      setIsReassigning(false);
    }
  });

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="w-4 h-4 text-slate-500" />
          Case Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {caseData.created_by && (
          <div>
            <p className="text-xs text-slate-500 mb-1">Created by</p>
            <p className="text-sm font-medium text-slate-900">{caseData.created_by}</p>
            {caseData.created_date && (
              <p className="text-xs text-slate-400">
                {format(new Date(caseData.created_date), 'dd MMM yyyy, HH:mm')}
              </p>
            )}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-slate-500">Assigned to</p>
            {!isReassigning && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReassigning(true)}
                className="h-6 px-2 text-xs text-slate-500 hover:text-slate-700"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Reassign
              </Button>
            )}
          </div>
          {isReassigning ? (
            <div className="space-y-2">
              <Select onValueChange={(val) => reassignMutation.mutate(val)}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select user..." />
                </SelectTrigger>
                <SelectContent>
                  {allUsers.map(user => (
                    <SelectItem key={user.id} value={user.full_name || user.email}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReassigning(false)}
                className="w-full h-7 text-xs"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <p className="text-sm font-medium text-slate-900">
              {caseData.assigned_to || <span className="text-slate-400">Unassigned</span>}
            </p>
          )}
        </div>

        {caseData.referral_source && (
          <div>
            <p className="text-xs text-slate-500 mb-1">Referral source</p>
            <p className="text-sm text-slate-700">{caseData.referral_source}</p>
          </div>
        )}

        {caseData.referring_team_member && (
          <div>
            <p className="text-xs text-slate-500 mb-1">Referred by</p>
            <p className="text-sm font-medium text-slate-900">{caseData.referring_team_member}</p>
            {caseData.referring_team && (
              <p className="text-xs text-slate-500 mt-0.5">{caseData.referring_team}</p>
            )}
          </div>
        )}

        {caseData.last_activity_by && (
          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Last activity</p>
            <p className="text-sm text-slate-700">{caseData.last_activity_by}</p>
            {caseData.updated_date && (
              <p className="text-xs text-slate-400">
                {format(new Date(caseData.updated_date), 'dd MMM yyyy, HH:mm')}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}