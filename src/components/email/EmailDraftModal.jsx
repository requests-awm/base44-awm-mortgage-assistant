import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Save, Send, X, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function EmailDraftModal({ isOpen, onClose, caseData }) {
  const [subject, setSubject] = useState(caseData?.email_subject || '');
  const [body, setBody] = useState(caseData?.email_draft || '');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // 'saving', 'saved', ''
  const autoSaveTimeoutRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    setSubject(caseData?.email_subject || '');
    setBody(caseData?.email_draft || '');
    setIsDirty(false);
  }, [caseData]);

  // Auto-save functionality
  useEffect(() => {
    if (isDirty && (subject !== caseData?.email_subject || body !== caseData?.email_draft)) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave();
      }, 30000); // 30 seconds
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [subject, body, isDirty]);

  const handleAutoSave = async () => {
    if (!isDirty) return;
    
    setSaveStatus('saving');
    try {
      await base44.entities.MortgageCase.update(caseData.id, {
        email_subject: subject,
        email_draft: body
      });
      setSaveStatus('saved');
      setIsDirty(false);
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveStatus('');
    }
  };

  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('generateIndicativeEmail', {
        case_id: caseData.id
      });
      return response.data;
    },
    onSuccess: (data) => {
      setSubject(data.subject);
      setBody(data.draft);
      setIsDirty(false);
      queryClient.invalidateQueries(['mortgageCase', caseData.id]);
      toast.success(`Email regenerated (v${data.version})`);
    },
    onError: (error) => {
      toast.error('Failed to regenerate email: ' + error.message);
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.MortgageCase.update(caseData.id, {
        email_subject: subject,
        email_draft: body
      });
    },
    onSuccess: () => {
      setIsDirty(false);
      queryClient.invalidateQueries(['mortgageCase', caseData.id]);
      toast.success('Draft saved');
    },
    onError: (error) => {
      toast.error('Failed to save: ' + error.message);
    }
  });

  const markSentMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      await base44.entities.MortgageCase.update(caseData.id, {
        email_status: 'sent',
        email_sent_at: new Date().toISOString(),
        email_sent_by: user.email
      });

      await base44.entities.AuditLog.create({
        case_id: caseData.id,
        action: 'Email marked as sent',
        action_category: 'delivery',
        actor: 'user',
        actor_email: user.email,
        timestamp: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mortgageCase', caseData.id]);
      toast.success('Email marked as sent');
      onClose();
    },
    onError: (error) => {
      toast.error('Failed to mark as sent: ' + error.message);
    }
  });

  const characterCount = body.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Email Draft - Version {caseData?.email_version || 1}</DialogTitle>
            {saveStatus === 'saving' && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-xs text-emerald-600 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Auto-saved
              </span>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email_subject">Subject</Label>
            <Input
              id="email_subject"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setIsDirty(true);
              }}
              maxLength={100}
              placeholder="Email subject line"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email_body">Email Body</Label>
            <Textarea
              id="email_body"
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                setIsDirty(true);
              }}
              rows={16}
              className="font-mono text-sm"
              placeholder="Email content will appear here..."
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t">
            <div className="flex items-center gap-4">
              {caseData?.email_generated_at && (
                <span>
                  Generated {format(new Date(caseData.email_generated_at), 'dd MMM yyyy HH:mm')}
                </span>
              )}
              <span>Version {caseData?.email_version || 1}</span>
            </div>
            <span>{characterCount} characters</span>
          </div>
        </div>

        <DialogFooter className="flex flex-row gap-2 justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => regenerateMutation.mutate()}
              disabled={regenerateMutation.isPending}
            >
              {regenerateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate with AI
                </>
              )}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={!isDirty || saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </>
              )}
            </Button>

            <Button
              size="sm"
              onClick={() => markSentMutation.mutate()}
              disabled={markSentMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {markSentMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Marking...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Mark as Sent
                </>
              )}
            </Button>

            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}