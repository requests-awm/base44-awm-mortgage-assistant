import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  FileText, Download, Mail, Loader2, TrendingUp, 
  BarChart3, Users, Clock, Calendar, FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays, subWeeks, subMonths } from 'date-fns';
import PipelineReport from '@/components/reports/PipelineReport';
import CaseProgressionReport from '@/components/reports/CaseProgressionReport';
import BrokerPerformanceReport from '@/components/reports/BrokerPerformanceReport';

const DATE_RANGES = [
  { value: '7', label: 'Last 7 Days' },
  { value: '14', label: 'Last 14 Days' },
  { value: '30', label: 'Last 30 Days' },
  { value: '60', label: 'Last 60 Days' },
  { value: '90', label: 'Last 90 Days' },
  { value: 'custom', label: 'Custom Range' }
];

export default function Reports() {
  const [activeReport, setActiveReport] = useState('pipeline');
  const [dateRange, setDateRange] = useState('30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [exportFormat, setExportFormat] = useState('pdf');

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['reportData', activeReport, dateRange, customStart, customEnd],
    queryFn: async () => {
      let startDate, endDate;
      
      if (dateRange === 'custom') {
        startDate = customStart ? new Date(customStart) : subDays(new Date(), 30);
        endDate = customEnd ? new Date(customEnd) : new Date();
      } else {
        startDate = subDays(new Date(), parseInt(dateRange));
        endDate = new Date();
      }

      const response = await base44.functions.invoke('generateReport', {
        reportType: activeReport,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      return response.data;
    }
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      let startDate, endDate;
      
      if (dateRange === 'custom') {
        startDate = customStart ? new Date(customStart) : subDays(new Date(), 30);
        endDate = customEnd ? new Date(customEnd) : new Date();
      } else {
        startDate = subDays(new Date(), parseInt(dateRange));
        endDate = new Date();
      }

      const response = await base44.functions.invoke('exportReport', {
        reportType: activeReport,
        format: exportFormat,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      return response.data;
    },
    onSuccess: (data) => {
      if (exportFormat === 'csv') {
        const blob = new Blob([data.content], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        // PDF - returned as base64
        const blob = new Blob([Uint8Array.from(atob(data.content), c => c.charCodeAt(0))], { 
          type: 'application/pdf' 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
      toast.success(`Report exported as ${exportFormat.toUpperCase()}`);
    },
    onError: (error) => {
      toast.error('Export failed: ' + error.message);
    }
  });

  const emailMutation = useMutation({
    mutationFn: async (emailAddress) => {
      let startDate, endDate;
      
      if (dateRange === 'custom') {
        startDate = customStart ? new Date(customStart) : subDays(new Date(), 30);
        endDate = customEnd ? new Date(customEnd) : new Date();
      } else {
        startDate = subDays(new Date(), parseInt(dateRange));
        endDate = new Date();
      }

      return await base44.functions.invoke('emailReport', {
        reportType: activeReport,
        emailTo: emailAddress,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
    },
    onSuccess: () => {
      toast.success('Report emailed successfully');
    },
    onError: (error) => {
      toast.error('Failed to email report: ' + error.message);
    }
  });

  const handleEmailReport = () => {
    const email = prompt('Enter email address:');
    if (email) {
      emailMutation.mutate(email);
    }
  };

  const REPORT_CONFIGS = {
    pipeline: {
      title: 'Pipeline Status Report',
      description: 'Overview of cases by stage, status, and timeline',
      icon: BarChart3,
      color: 'blue'
    },
    progression: {
      title: 'Case Progression Report',
      description: 'Track case movement through stages and conversion rates',
      icon: TrendingUp,
      color: 'emerald'
    },
    broker: {
      title: 'Broker Performance Report',
      description: 'Analyze broker activity, conversion rates, and workload',
      icon: Users,
      color: 'purple'
    }
  };

  const currentConfig = REPORT_CONFIGS[activeReport];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <FileText className="w-7 h-7" />
            Reporting Suite
          </h1>
          <p className="text-slate-500 mt-1">
            Generate, export, and automate comprehensive reports
          </p>
        </div>

        {/* Report Type Selector */}
        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(REPORT_CONFIGS).map(([key, config]) => {
                const Icon = config.icon;
                const isActive = activeReport === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveReport(key)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      isActive 
                        ? 'border-slate-900 bg-slate-50' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                      isActive ? 'bg-slate-900' : `bg-${config.color}-100`
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        isActive ? 'text-white' : `text-${config.color}-600`
                      }`} />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">{config.title}</h3>
                    <p className="text-xs text-slate-500">{config.description}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filters & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date Range
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGES.map(range => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {dateRange === 'custom' && (
                <div className="space-y-2 pt-2">
                  <div>
                    <Label className="text-xs">Start Date</Label>
                    <Input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">End Date</Label>
                    <Input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <Button 
                onClick={() => refetch()} 
                className="w-full"
                variant="outline"
              >
                Refresh Report
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs mb-2 block">Format</Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                    <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={() => exportMutation.mutate()}
                disabled={exportMutation.isPending || isLoading}
                className="w-full bg-slate-900 hover:bg-slate-800"
              >
                {exportMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Download {exportFormat.toUpperCase()}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-slate-600">
                Send this report directly to stakeholders
              </p>
              <Button 
                onClick={handleEmailReport}
                disabled={emailMutation.isPending || isLoading}
                variant="outline"
                className="w-full"
              >
                {emailMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Email Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Report Content */}
        {isLoading ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400 mb-3" />
              <p className="text-slate-500">Generating report...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {activeReport === 'pipeline' && <PipelineReport data={reportData} />}
            {activeReport === 'progression' && <CaseProgressionReport data={reportData} />}
            {activeReport === 'broker' && <BrokerPerformanceReport data={reportData} />}
          </>
        )}
      </div>
    </div>
  );
}