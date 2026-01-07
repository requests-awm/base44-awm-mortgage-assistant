import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Edit3, Save, Sparkles, AlertTriangle, 
  CheckCircle, Loader2, FileText 
} from 'lucide-react';
import { format } from 'date-fns';

export default function ReportDraftEditor({ 
  caseData, 
  onSaveDraft, 
  onRegenerateSuggestion,
  isSaving = false,
  isRegenerating = false
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({
    summary: '',
    lender_directions: '',
    risks_assumptions: '',
    next_steps: ''
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (caseData?.report_draft) {
      setDraft(caseData.report_draft);
    } else if (caseData?.indicative_report) {
      const report = caseData.indicative_report;
      setDraft({
        summary: generateSummaryText(report, caseData),
        lender_directions: generateLenderDirectionsText(report),
        risks_assumptions: report.risks_assumptions?.join('\n• ') || '',
        next_steps: report.next_steps || ''
      });
    }
  }, [caseData]);

  const generateSummaryText = (report, caseData) => {
    if (!report) return '';
    const confidence = report.confidence || 'medium';
    const placeable = report.is_placeable ? 'placeable' : 'may require specialist review';
    const rateRange = report.rate_range_low && report.rate_range_high 
      ? `${report.rate_range_low}% - ${report.rate_range_high}%`
      : 'to be confirmed';
    
    return `Based on our initial assessment, this case appears ${placeable} with ${confidence} confidence.

Property Value: £${caseData?.property_value?.toLocaleString() || 'TBC'}
Loan Amount: £${caseData?.loan_amount?.toLocaleString() || 'TBC'}
LTV: ${caseData?.ltv || 'TBC'}%

Indicative rate range: ${rateRange}
Product category: ${report.product_category || 'Standard residential'}`;
  };

  const generateLenderDirectionsText = (report) => {
    if (!report?.lender_directions?.length) return '';
    return report.lender_directions.map(d => 
      `${d.lender_name}: ${d.suitability}${d.notes ? ` - ${d.notes}` : ''}`
    ).join('\n\n');
  };

  const handleFieldChange = (field, value) => {
    setDraft(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    await onSaveDraft(draft);
    setHasChanges(false);
    setIsEditing(false);
  };

  const handleRegenerate = async (field) => {
    if (onRegenerateSuggestion) {
      const newValue = await onRegenerateSuggestion(field, caseData);
      if (newValue) {
        handleFieldChange(field, newValue);
      }
    }
  };

  const lastEditedInfo = caseData?.report_draft?.last_edited_by 
    ? `Last edited by ${caseData.report_draft.last_edited_by} on ${format(new Date(caseData.report_draft.last_edited_at), 'dd MMM yyyy HH:mm')}`
    : null;

  if (!caseData?.indicative_report && !caseData?.report_draft) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-medium text-slate-900 mb-1">No Report Draft Yet</h3>
          <p className="text-sm text-slate-500">
            Run analysis first to generate the indicative report
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-slate-500" />
            Report Draft
            {hasChanges && (
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                Unsaved changes
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setHasChanges(false);
                    if (caseData?.report_draft) {
                      setDraft(caseData.report_draft);
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || !hasChanges}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-1" />
                  )}
                  Save Draft
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="w-4 h-4 mr-1" />
                Edit Draft
              </Button>
            )}
          </div>
        </div>
        {lastEditedInfo && (
          <p className="text-xs text-slate-500 mt-1">{lastEditedInfo}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Summary</Label>
            {isEditing && onRegenerateSuggestion && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleRegenerate('summary')}
                disabled={isRegenerating}
                className="text-xs h-7"
              >
                {isRegenerating ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3 mr-1" />
                )}
                Regenerate
              </Button>
            )}
          </div>
          {isEditing ? (
            <Textarea
              value={draft.summary}
              onChange={(e) => handleFieldChange('summary', e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
          ) : (
            <div className="p-4 bg-slate-50 rounded-lg text-sm whitespace-pre-wrap">
              {draft.summary || 'No summary available'}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Indicative Lender Directions</Label>
            {isEditing && onRegenerateSuggestion && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleRegenerate('lender_directions')}
                disabled={isRegenerating}
                className="text-xs h-7"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Regenerate
              </Button>
            )}
          </div>
          {isEditing ? (
            <Textarea
              value={draft.lender_directions}
              onChange={(e) => handleFieldChange('lender_directions', e.target.value)}
              rows={5}
              className="font-mono text-sm"
              placeholder="Lender 1: Suitability assessment&#10;Lender 2: Suitability assessment"
            />
          ) : (
            <div className="p-4 bg-slate-50 rounded-lg text-sm whitespace-pre-wrap">
              {draft.lender_directions || 'No lender directions available'}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Risks & Assumptions</Label>
            {isEditing && onRegenerateSuggestion && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleRegenerate('risks_assumptions')}
                disabled={isRegenerating}
                className="text-xs h-7"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Regenerate
              </Button>
            )}
          </div>
          {isEditing ? (
            <Textarea
              value={draft.risks_assumptions}
              onChange={(e) => handleFieldChange('risks_assumptions', e.target.value)}
              rows={4}
              className="font-mono text-sm"
              placeholder="• Risk or assumption 1&#10;• Risk or assumption 2"
            />
          ) : (
            <div className="p-4 bg-amber-50 rounded-lg text-sm whitespace-pre-wrap border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 inline mr-2" />
              {draft.risks_assumptions || 'No risks or assumptions documented'}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Next Steps</Label>
            {isEditing && onRegenerateSuggestion && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleRegenerate('next_steps')}
                disabled={isRegenerating}
                className="text-xs h-7"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Regenerate
              </Button>
            )}
          </div>
          {isEditing ? (
            <Textarea
              value={draft.next_steps}
              onChange={(e) => handleFieldChange('next_steps', e.target.value)}
              rows={3}
              className="font-mono text-sm"
            />
          ) : (
            <div className="p-4 bg-blue-50 rounded-lg text-sm whitespace-pre-wrap border border-blue-200">
              <CheckCircle className="w-4 h-4 text-blue-600 inline mr-2" />
              {draft.next_steps || 'No next steps defined'}
            </div>
          )}
        </div>

        <Alert className="bg-slate-100 border-slate-300">
          <AlertTriangle className="h-4 w-4 text-slate-600" />
          <AlertDescription className="text-slate-600 text-xs">
            <strong>Important:</strong> This is an indicative assessment only, not a formal mortgage recommendation. 
            Final recommendations will be made by a qualified broker following full analysis and fact-find.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}