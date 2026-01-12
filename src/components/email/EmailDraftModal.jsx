import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Save, Send, X, Check, Copy, RotateCcw, Sparkles, ChevronDown, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, addHours, addDays } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function EmailDraftModal({ isOpen, onClose, caseData }) {
  const [subject, setSubject] = useState(caseData?.email_subject || '');
  const [body, setBody] = useState(caseData?.email_draft || '');
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // 'saving', 'saved', ''
  const [isGenerating, setIsGenerating] = useState(false);
  const [sendMode, setSendMode] = useState('manual'); // 'manual' or 'scheduled'
  const [scheduledDateTime, setScheduledDateTime] = useState(() => {
    const tomorrow9am = addDays(new Date(), 1);
    tomorrow9am.setHours(9, 0, 0, 0);
    return format(tomorrow9am, "yyyy-MM-dd'T'HH:mm");
  });
  const autoSaveTimeoutRef = useRef(null);
  const queryClient = useQueryClient();

  const isScheduled = caseData?.email_status === 'scheduled';

  // Calculate email stats
  const emailStats = useMemo(() => {
    const charCount = subject.length + body.length;
    const wordCount = body.split(/\s+/).filter(w => w.length > 0).length;
    const readTimeMinutes = Math.ceil(wordCount / 200);
    
    // Simple tone detection
    let tone = 'Professional';
    const lowerBody = body.toLowerCase();
    if (lowerBody.includes('delighted') || lowerBody.includes('pleased') || lowerBody.includes('warm')) {
      tone = 'Friendly';
    } else if (lowerBody.includes('must') || lowerBody.includes('urgently') || lowerBody.includes('soon')) {
      tone = 'Urgent';
    } else if (body.includes('hereby') || body.includes('pursuant') || lowerBody.includes('corporate')) {
      tone = 'Formal';
    }
    
    return { charCount, wordCount, readTimeMinutes, tone };
  }, [subject, body]);

  // Auto-generate email when modal opens if no draft exists
  useEffect(() => {
    if (isOpen && (!caseData?.email_draft || caseData?.email_status === 'not_generated')) {
      generateEmail();
    } else if (isOpen) {
      setSubject(caseData?.email_subject || '');
      setBody(caseData?.email_draft || '');
      setIsDirty(false);
    }
  }, [isOpen, caseData?.id]);

  const generateEmail = async (options = {}) => {
    console.log('[MODAL] Starting email generation for case:', caseData.id, options);
    setIsGenerating(true);
    try {
      console.log('[MODAL] Calling backend function...');
      const response = await base44.functions.invoke('generateIndicativeEmail', {
        case_id: caseData.id,
        ...options
      });
      
      console.log('[MODAL] Backend response:', response);
      
      if (response.data.success) {
        console.log('[MODAL] Success! Draft length:', response.data.draft.length);
        setSubject(response.data.subject);
        setBody(response.data.draft);
        setIsDirty(false);
        queryClient.invalidateQueries(['mortgageCase', caseData.id]);
        
        if (options.use_default) {
          toast.success('Default template applied');
        } else if (options.adjustment) {
          toast.success(`Email adjusted: ${options.adjustment}`);
        } else {
          toast.success(`Email generated (v${response.data.version})`);
        }
      } else {
        console.error('[MODAL] Generation failed:', response.data.error);
        throw new Error(response.data.error || 'Generation failed');
      }
    } catch (error) {
      console.error('[MODAL] Email generation error:', error);
      toast.error('Failed to generate email: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

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

  const handleAdjustment = (adjustment) => {
    generateEmail({ adjustment });
  };

  const handleUseDefault = () => {
    generateEmail({ use_default: true });
  };

  const copyToClipboard = async () => {
    const fullEmail = `Subject: ${subject}\n\n${body}`;
    await navigator.clipboard.writeText(fullEmail);
    toast.success('✓ Copied to clipboard!');
  };

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
        email_sent_by: user.email,
        last_activity_by: user.full_name || user.email
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

  const scheduleEmailMutation = useMutation({
    mutationFn: async () => {
      const scheduledTime = new Date(scheduledDateTime);
      const now = new Date();
      const oneHourFromNow = addHours(now, 1);

      if (scheduledTime < oneHourFromNow) {
        throw new Error('Schedule time must be at least 1 hour in the future');
      }

      if (!subject || !body) {
        throw new Error('Email must have subject and body');
      }

      const user = await base44.auth.me();
      await base44.entities.MortgageCase.update(caseData.id, {
        email_subject: subject,
        email_draft: body,
        email_scheduled_send_time: scheduledTime.toISOString(),
        email_status: 'scheduled',
        zapier_trigger_pending: true,
        last_activity_by: user.full_name || user.email
      });

      await base44.entities.AuditLog.create({
        case_id: caseData.id,
        action: `Email scheduled for ${format(scheduledTime, 'dd MMM yyyy HH:mm')}`,
        action_category: 'delivery',
        actor: 'user',
        actor_email: user.email,
        timestamp: new Date().toISOString()
      });

      return scheduledTime;
    },
    onSuccess: (scheduledTime) => {
      queryClient.invalidateQueries(['mortgageCase', caseData.id]);
      queryClient.invalidateQueries(['mortgageCases']);
      toast.success(`✅ Email scheduled for ${format(scheduledTime, 'EEEE, dd MMM \'at\' HH:mm')}`);
      onClose();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const cancelScheduleMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      await base44.entities.MortgageCase.update(caseData.id, {
        email_status: 'draft',
        zapier_trigger_pending: false,
        email_scheduled_send_time: null,
        last_activity_by: user.full_name || user.email
      });

      await base44.entities.AuditLog.create({
        case_id: caseData.id,
        action: 'Email schedule cancelled',
        action_category: 'delivery',
        actor: 'user',
        actor_email: user.email,
        timestamp: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mortgageCase', caseData.id]);
      queryClient.invalidateQueries(['mortgageCases']);
      toast.success('Schedule cancelled. Email is now a draft.');
      setSendMode('manual');
    },
    onError: (error) => {
      toast.error('Failed to cancel schedule: ' + error.message);
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[98vw] max-w-[1400px] max-h-[92vh] overflow-y-auto overflow-x-hidden p-10">
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

        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <div className="text-center">
              <p className="text-lg font-medium text-slate-900">Generating email with AI...</p>
              <p className="text-sm text-slate-500 mt-1">This may take 5-10 seconds</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="email_subject" className="text-sm font-medium text-slate-700">Subject</Label>
            <Input
              id="email_subject"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setIsDirty(true);
              }}
              maxLength={100}
              placeholder="Email subject line"
              className="text-[16px] font-semibold py-3 px-4 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="email_body" className="text-sm font-medium text-slate-700">Email Body</Label>
            <Textarea
              id="email_body"
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                setIsDirty(true);
              }}
              className="w-full min-h-[450px] text-[15px] leading-relaxed p-5 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg resize-none overflow-x-hidden"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif', 
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                wordBreak: 'normal',
                overflowWrap: 'break-word',
                boxSizing: 'border-box'
              }}
              placeholder="Email content will appear here..."
            />
          </div>

          {/* Email Stats */}
          <div className="flex items-center justify-between text-[13px] text-slate-600 pt-3 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <span>{emailStats.charCount} characters</span>
              <span className="text-slate-400">•</span>
              <span>{emailStats.wordCount} words</span>
              <span className="text-slate-400">•</span>
              <span>{emailStats.readTimeMinutes} min read</span>
              {caseData?.email_generated_at && (
                <>
                  <span className="text-slate-400">•</span>
                  <span>Generated {format(new Date(caseData.email_generated_at), 'dd MMM HH:mm')}</span>
                </>
              )}
            </div>
            <Badge variant="outline" className="text-[13px] px-3 py-1">
              {emailStats.tone}
            </Badge>
          </div>

          {/* Send Options Section */}
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Send Options</h3>
            
            <div className="space-y-3">
              {/* Manual Send Option */}
              <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="sendMode"
                  value="manual"
                  checked={sendMode === 'manual'}
                  onChange={(e) => setSendMode(e.target.value)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Manual Send</p>
                  <p className="text-sm text-slate-500">Copy email to Gmail and send manually</p>
                </div>
              </label>

              {/* Scheduled Send Option */}
              <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="sendMode"
                  value="scheduled"
                  checked={sendMode === 'scheduled'}
                  onChange={(e) => setSendMode(e.target.value)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Schedule Send via Zapier</p>
                  <p className="text-sm text-slate-500 mb-3">Automatically send at scheduled time</p>
                  
                  {sendMode === 'scheduled' && (
                    <div className="space-y-2">
                      <Label htmlFor="scheduledDateTime" className="text-sm">Schedule for:</Label>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <Input
                          id="scheduledDateTime"
                          type="datetime-local"
                          value={scheduledDateTime}
                          onChange={(e) => setScheduledDateTime(e.target.value)}
                          min={format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm")}
                          max={format(addDays(new Date(), 30), "yyyy-MM-dd'T'HH:mm")}
                          step="900"
                          className="flex-1"
                        />
                      </div>
                      <p className="text-xs text-slate-500">Minimum 1 hour from now, business hours recommended (9am-5pm)</p>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>
          </div>
        )}

        <DialogFooter className="flex flex-row gap-3 justify-between pt-6 border-t border-slate-200">
          <div className="flex gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 text-[15px]"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adjusting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Adjust Tone & Focus
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="text-[13px] font-semibold">Tone Options</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleAdjustment('formal')} className="text-[15px] py-2.5">
                  Make More Formal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAdjustment('friendly')} className="text-[15px] py-2.5">
                  Make More Friendly
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAdjustment('urgent')} className="text-[15px] py-2.5">
                  Add Urgency
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[13px] font-semibold">Focus Options</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleAdjustment('savings')} className="text-[15px] py-2.5">
                  Emphasize Savings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAdjustment('speed')} className="text-[15px] py-2.5">
                  Highlight Speed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAdjustment('experience')} className="text-[15px] py-2.5">
                  Stress Experience
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              className="h-10 text-[15px]"
              onClick={handleUseDefault}
              disabled={isGenerating}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>

            <Button
              variant="outline"
              className="h-10 text-[15px]"
              onClick={copyToClipboard}
              disabled={!body}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
          </div>

          <div className="flex gap-3">
            {isScheduled && (
              <Button
                variant="outline"
                className="h-10 text-[15px] border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => cancelScheduleMutation.mutate()}
                disabled={cancelScheduleMutation.isPending}
              >
                {cancelScheduleMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Cancel Schedule
                  </>
                )}
              </Button>
            )}

            <Button
              variant="outline"
              className="h-10 text-[15px]"
              onClick={() => saveMutation.mutate()}
              disabled={!isDirty || saveMutation.isPending || isGenerating}
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

            {sendMode === 'manual' ? (
              <Button
                className="h-10 text-[15px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-6"
                onClick={() => markSentMutation.mutate()}
                disabled={markSentMutation.isPending || isGenerating || !body}
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
            ) : (
              <Button
                className="h-10 text-[15px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-6"
                onClick={() => scheduleEmailMutation.mutate()}
                disabled={scheduleEmailMutation.isPending || isGenerating || !body || !subject}
              >
                {scheduleEmailMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Email →
                  </>
                )}
              </Button>
            )}

            <Button variant="ghost" className="h-10 text-[15px]" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}