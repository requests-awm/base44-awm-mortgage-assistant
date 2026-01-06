import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Banknote, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

export default function FeeAcknowledgement({ 
  caseData, 
  onAcknowledge, 
  isSubmitting 
}) {
  const [confirmed, setConfirmed] = useState(false);

  if (caseData.fee_acknowledged) {
    return (
      <Card className="border-0 shadow-sm bg-emerald-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-emerald-900">Fee Acknowledged</h3>
              <p className="text-sm text-emerald-700 mt-1">
                Client acknowledged the £750 commitment fee on{' '}
                {caseData.fee_acknowledged_at 
                  ? new Date(caseData.fee_acknowledged_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })
                  : 'record'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <Banknote className="w-5 h-5" />
          Commercial Commitment Required
        </CardTitle>
        <CardDescription className="text-amber-700">
          Before broker engagement, client must acknowledge fee liability
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-white border-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Fee Structure:</strong> The firm earns a procuration fee on completion. 
            If the case is cancelled after work begins, a £750 cancellation fee applies.
          </AlertDescription>
        </Alert>

        <div className="flex items-start gap-3 p-4 bg-white rounded-xl">
          <Checkbox 
            id="confirm-fee" 
            checked={confirmed}
            onCheckedChange={setConfirmed}
          />
          <label htmlFor="confirm-fee" className="text-sm text-slate-700 cursor-pointer">
            I confirm the client has acknowledged the £750 fee liability that applies if the 
            case is cancelled after broker work has commenced. This acknowledgement has been 
            recorded via email or documented client consent.
          </label>
        </div>

        <Button 
          onClick={onAcknowledge}
          disabled={!confirmed || isSubmitting}
          className="w-full bg-amber-600 hover:bg-amber-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Recording...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Record Fee Acknowledgement
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}