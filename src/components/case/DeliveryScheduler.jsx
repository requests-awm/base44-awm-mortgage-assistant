import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Send, Clock, Calendar, CheckCircle, AlertTriangle, 
  Loader2, Eye, Mail, Zap 
} from 'lucide-react';
import { format, addDays, setHours, setMinutes, isWeekend, nextMonday } from 'date-fns';

function calculateDefaultDeliveryTime(baseDate = new Date()) {
  let deliveryDate = addDays(baseDate, 1);
  
  if (isWeekend(deliveryDate)) {
    deliveryDate = nextMonday(deliveryDate);
  }
  
  deliveryDate = setHours(deliveryDate, 9);
  deliveryDate = setMinutes(deliveryDate, 0);
  
  return deliveryDate;
}

function getQuickOptions() {
  const now = new Date();
  const today5pm = setMinutes(setHours(now, 17), 0);
  const tomorrow9am = calculateDefaultDeliveryTime(now);
  
  return [
    { 
      value: 'tomorrow_9am', 
      label: 'Tomorrow 9am', 
      date: tomorrow9am,
      isDefault: true
    },
    { 
      value: 'today_5pm', 
      label: 'Today 5pm', 
      date: today5pm,
      disabled: now > today5pm
    },
    { 
      value: 'custom', 
      label: 'Custom time', 
      date: null 
    }
  ];
}

export default function DeliveryScheduler({ 
  caseData, 
  onApproveAndSchedule,
  isSubmitting = false 
}) {
  const [selectedOption, setSelectedOption] = useState('tomorrow_9am');
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('09:00');
  const [fastTrack, setFastTrack] = useState(false);

  const quickOptions = getQuickOptions();

  const getScheduledTime = () => {
    if (fastTrack) {
      return new Date();
    }
    
    if (selectedOption === 'custom' && customDate) {
      const [hours, minutes] = customTime.split(':');
      let date = new Date(customDate);
      date = setHours(date, parseInt(hours));
      date = setMinutes(date, parseInt(minutes));
      return date;
    }
    
    const option = quickOptions.find(o => o.value === selectedOption);
    return option?.date || calculateDefaultDeliveryTime();
  };

  const handleApprove = () => {
    const scheduledTime = getScheduledTime();
    onApproveAndSchedule({
      delivery_scheduled_at: scheduledTime.toISOString(),
      fast_track: fastTrack
    });
  };

  const generateEmailPreview = () => {
    const report = caseData?.report_draft || caseData?.indicative_report;
    if (!report) return null;

    return {
      to: caseData?.client_email || '[Client email]',
      subject: `Your Mortgage Assessment - ${caseData?.reference}`,
      body: `Dear ${caseData?.client_name},

Thank you for your recent enquiry regarding your mortgage requirements.

We have completed our initial assessment and I am pleased to provide you with an indicative overview of your options.

${report.summary || 'Based on the information provided, we have identified potential lending options for your consideration.'}

This is an indicative assessment only. To proceed with a formal recommendation, please confirm you would like to move forward and we will arrange a detailed fact-find appointment.

Kind regards,
AWM Mortgage Team`
    };
  };

  const emailPreview = generateEmailPreview();
  const scheduledTime = getScheduledTime();

  const reportReady = caseData?.analysis_status === 'completed' && 
    (caseData?.report_draft || caseData?.indicative_report);

  if (!reportReady) {
    return (
      <Card className="border-0 shadow-sm bg-slate-50">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <p className="text-sm text-slate-600">
            Analysis must be completed before scheduling delivery
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-emerald-900">
          <Send className="w-4 h-4" />
          Approve & Schedule Delivery
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex items-start space-x-3 p-3 bg-white/60 rounded-lg">
          <Checkbox 
            id="fast-track" 
            checked={fastTrack}
            onCheckedChange={setFastTrack}
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="fast-track"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-500" />
              Fast-track delivery
            </label>
            <p className="text-xs text-slate-500">
              Send immediately after approval (within 5 minutes)
            </p>
          </div>
        </div>

        {!fastTrack && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Scheduled Send Time</Label>
            <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
              {quickOptions.map(option => (
                <div 
                  key={option.value}
                  className={`flex items-center space-x-3 p-3 bg-white/60 rounded-lg ${option.disabled ? 'opacity-50' : ''}`}
                >
                  <RadioGroupItem 
                    value={option.value} 
                    id={option.value}
                    disabled={option.disabled}
                  />
                  <Label 
                    htmlFor={option.value} 
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    <Clock className="w-4 h-4 text-slate-500" />
                    {option.label}
                    {option.isDefault && (
                      <Badge variant="outline" className="text-xs">Recommended</Badge>
                    )}
                    {option.date && (
                      <span className="text-xs text-slate-500 ml-auto">
                        {format(option.date, 'EEE dd MMM, HH:mm')}
                      </span>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {selectedOption === 'custom' && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-white/60 rounded-lg">
                <div className="space-y-1">
                  <Label className="text-xs">Date</Label>
                  <Input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Time</Label>
                  <Input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-3 bg-white rounded-lg border border-emerald-200">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span className="font-medium text-emerald-900">
              {fastTrack 
                ? 'Will be sent immediately after approval'
                : `Scheduled for: ${format(scheduledTime, 'EEEE dd MMMM yyyy, HH:mm')}`
              }
            </span>
          </div>
        </div>

        <Accordion type="single" collapsible>
          <AccordionItem value="preview" className="border-0">
            <AccordionTrigger className="text-sm py-2 hover:no-underline">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Preview Email
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {emailPreview && (
                <div className="p-4 bg-white rounded-lg text-sm space-y-3 border">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Mail className="w-4 h-4" />
                    <span>To: {emailPreview.to}</span>
                  </div>
                  <div className="font-medium">{emailPreview.subject}</div>
                  <div className="whitespace-pre-wrap text-slate-600 border-t pt-3">
                    {emailPreview.body}
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Alert className="bg-white/80 border-emerald-300">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800 text-xs">
            By approving, you confirm this indicative report has been reviewed and is ready for client communication.
            {!fastTrack && ' The email will be sent via your connected Gmail account.'}
          </AlertDescription>
        </Alert>

        <Button 
          onClick={handleApprove}
          disabled={isSubmitting || !caseData?.client_email}
          className="w-full bg-emerald-600 hover:bg-emerald-700"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve & {fastTrack ? 'Send Now' : 'Schedule Delivery'}
            </>
          )}
        </Button>

        {!caseData?.client_email && (
          <p className="text-xs text-red-500 text-center">
            Client email is required to schedule delivery
          </p>
        )}
      </CardContent>
    </Card>
  );
}