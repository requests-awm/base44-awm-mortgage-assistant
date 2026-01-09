import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Save, Send, X, Check, Copy, RotateCcw, Sparkles, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
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
  const autoSaveTimeoutRef = useRef(null);
  const queryClient = useQueryClient();

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

        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <div className="text-center">
              <p className="text-lg font-medium text-slate-900">Generating email with AI...</p>
              <p className="text-sm text-slate-500 mt-1">This may take 5-10 seconds</p>
            </div>
          </div>
        ) : (
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

          {/* Email Stats */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t">
            <div className="flex items-center gap-4">
              <span>{emailStats.charCount} characters</span>
              <span>•</span>
              <span>{emailStats.wordCount} words</span>
              <span>•</span>
              <span>{emailStats.readTimeMinutes} min read</span>
              {caseData?.email_generated_at && (
                <>
                  <span>•</span>
                  <span>
                    Generated {format(new Date(caseData.email_generated_at), 'dd MMM HH:mm')}
                  </span>
                </>
              )}
            </div>
            <Badge variant="outline" className="text-xs">
              Tone: {emailStats.tone}
            </Badge>
          </div>
          </div>
        )}

        <DialogFooter className="flex flex-row gap-2 justify-between">
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
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
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Tone Options</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleAdjustment('formal')}>
                  Make More Formal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAdjustment('friendly')}>
                  Make More Friendly
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAdjustment('urgent')}>
                  Add Urgency
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Focus Options</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleAdjustment('savings')}>
                  Emphasize Savings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAdjustment('speed')}>
                  Highlight Speed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAdjustment('experience')}>
                  Stress Experience
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              onClick={handleUseDefault}
              disabled={isGenerating}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              disabled={!body}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
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

            <Button
              size="sm"
              onClick={() => markSentMutation.mutate()}
              disabled={markSentMutation.isPending || isGenerating || !body}
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