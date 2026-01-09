import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calculateTriageRating } from '@/components/dashboard/TriageBadge.jsx';
import { 
  Plus, Search, Filter, LayoutGrid, List, 
  FileText, Clock, CheckCircle, MessageSquare,
  AlertTriangle, Building, TrendingUp, Users, Loader2, ChevronDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import MetricCard from '@/components/dashboard/MetricCard';
import CaseCard from '@/components/dashboard/CaseCard';
import StageColumn from '@/components/dashboard/StageColumn';

// Stage groupings for Kanban view
const STAGE_GROUPS = {
  pipeline: ['intake_received', 'data_completion', 'market_analysis'],
  review: ['human_review', 'pending_delivery'],
  active: ['awaiting_decision', 'decision_chase', 'client_proceeding'],
  broker: ['broker_validation', 'application_submitted', 'offer_received'],
  closed: ['completed', 'withdrawn', 'unsuitable']
};

export default function Dashboard() {
  const [view, setView] = useState('kanban');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [triageFilter, setTriageFilter] = useState('all');
  const [timelineFilter, setTimelineFilter] = useState('all');
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('dashboardActiveTab') || 'my-work';
  });
  const [expandedSections, setExpandedSections] = useState({
    urgent: true,
    thisWeek: false,
    readyToSend: true,
    waiting: false
  });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    sessionStorage.setItem('dashboardActiveTab', tab);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['mortgageCases'],
    queryFn: () => base44.entities.MortgageCase.list('-created_date')
  });

  // Filter cases
  const filteredCases = cases.filter(c => {
    const matchesSearch = !search || 
      c.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.reference?.toLowerCase().includes(search.toLowerCase());
    
    let matchesFilter = true;
    if (filter === 'paused') matchesFilter = c.agent_paused;
    else if (filter === 'active') matchesFilter = !['completed', 'withdrawn', 'unsuitable'].includes(c.stage);
    
    // Triage filter
    let matchesTriage = true;
    if (triageFilter !== 'all') {
      const triage = c.triage_rating || calculateTriageRating(c).rating;
      matchesTriage = triage === triageFilter;
    }
    
    // Timeline filter
    let matchesTimeline = true;
    if (timelineFilter !== 'all') {
      matchesTimeline = c.timeline_urgency === timelineFilter;
    }
    
    return matchesSearch && matchesFilter && matchesTriage && matchesTimeline;
  });

  // Calculate metrics
  const activeCases = cases.filter(c => !['completed', 'withdrawn', 'unsuitable'].includes(c.stage));
  const awaitingDecision = cases.filter(c => ['awaiting_decision', 'decision_chase'].includes(c.stage));
  const thisWeek = cases.filter(c => {
    const created = new Date(c.created_date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return created > weekAgo;
  });
  const needingReview = cases.filter(c => c.stage === 'human_review');

  // Group by stage for Kanban
  const getCasesByStages = (stages) => {
    return filteredCases.filter(c => stages.includes(c.stage));
  };

  // My Work section filters
  const getUrgentCases = () => {
    return cases
      .filter(c => c.timeline_urgency === 'critical' || c.timeline_urgency === 'overdue')
      .sort((a, b) => (a.days_until_deadline || 999) - (b.days_until_deadline || 999));
  };

  const getThisWeekCases = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const urgentIds = new Set(getUrgentCases().map(c => c.id));
    
    return cases
      .filter(c => {
        if (urgentIds.has(c.id)) return false;
        const created = new Date(c.created_date);
        const withinWeek = created > weekAgo;
        const deadlineSoon = c.days_until_deadline && c.days_until_deadline <= 7 && c.days_until_deadline > 0;
        return withinWeek || deadlineSoon;
      })
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  };

  const getReadyToSendCases = () => {
    return cases
      .filter(c => c.email_status === 'draft')
      .sort((a, b) => new Date(b.email_generated_at || 0) - new Date(a.email_generated_at || 0));
  };

  const getWaitingCases = () => {
    return cases
      .filter(c => ['awaiting_decision', 'decision_chase'].includes(c.stage))
      .sort((a, b) => new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100">
      <div className="max-w-[1600px] mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mortgage Pipeline</h1>
            <p className="text-slate-500 mt-1">Pre-quote triage & workflow management</p>
          </div>
          <Link to={createPageUrl('NewCase')}>
            <Button className="bg-slate-900 hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" />
              New Intake
            </Button>
          </Link>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Active Cases"
            value={activeCases.length}
            subtitle="In pipeline"
            icon={FileText}
            color="blue"
          />
          <MetricCard
            title="Awaiting Decision"
            value={awaitingDecision.length}
            subtitle="Client response needed"
            icon={MessageSquare}
            color="amber"
          />
          <MetricCard
            title="New This Week"
            value={thisWeek.length}
            subtitle="Cases created"
            icon={TrendingUp}
            color="emerald"
          />
          <MetricCard
            title="Needs Review"
            value={needingReview.length}
            subtitle="Reports ready"
            icon={AlertTriangle}
            color="purple"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-6 border-b border-slate-200">
          <button
            onClick={() => handleTabChange('my-work')}
            className={`flex items-center gap-2 px-5 py-3 text-[16px] transition-all ${
              activeTab === 'my-work'
                ? 'text-[#3B82F6] font-semibold border-b-[3px] border-[#3B82F6]'
                : 'text-slate-500 hover:text-slate-700 hover:bg-blue-50'
            }`}
          >
            📋 My Work
          </button>
          <button
            onClick={() => handleTabChange('pipeline')}
            className={`flex items-center gap-2 px-5 py-3 text-[16px] transition-all ${
              activeTab === 'pipeline'
                ? 'text-[#3B82F6] font-semibold border-b-[3px] border-[#3B82F6]'
                : 'text-slate-500 hover:text-slate-700 hover:bg-blue-50'
            }`}
          >
            🔄 Pipeline
          </button>
          <button
            onClick={() => handleTabChange('all-cases')}
            className={`flex items-center gap-2 px-5 py-3 text-[16px] transition-all ${
              activeTab === 'all-cases'
                ? 'text-[#3B82F6] font-semibold border-b-[3px] border-[#3B82F6]'
                : 'text-slate-500 hover:text-slate-700 hover:bg-blue-50'
            }`}
          >
            📊 All Cases
          </button>
        </div>

        {/* Filters & View Toggle */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name or reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/80 border-slate-200"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList className="bg-white/80">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="paused">Paused</TabsTrigger>
              </TabsList>
            </Tabs>

            <Tabs value={triageFilter} onValueChange={setTriageFilter}>
              <TabsList className="bg-white/80">
                <TabsTrigger value="all">All Complexity</TabsTrigger>
                <TabsTrigger value="blue" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">Quick Win</TabsTrigger>
                <TabsTrigger value="green" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700">Good Case</TabsTrigger>
                <TabsTrigger value="yellow" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700">Needs Attention</TabsTrigger>
                <TabsTrigger value="red" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700">Complex</TabsTrigger>
              </TabsList>
            </Tabs>

            <Tabs value={timelineFilter} onValueChange={setTimelineFilter}>
              <TabsList className="bg-white/80">
                <TabsTrigger value="all">All Timeline</TabsTrigger>
                <TabsTrigger value="overdue" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700">Overdue</TabsTrigger>
                <TabsTrigger value="critical" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700">Critical</TabsTrigger>
                <TabsTrigger value="soon" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700">Soon</TabsTrigger>
                <TabsTrigger value="standard" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-700">Standard</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex bg-white/80 rounded-lg p-1 border border-slate-200">
              <button
                onClick={() => setView('kanban')}
                className={`p-2 rounded transition-all ${view === 'kanban' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded transition-all ${view === 'list' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* My Work View */}
        <div id="my-work-view" style={{ display: activeTab === 'my-work' ? 'block' : 'none' }}>
          <div className="space-y-8">
            {/* URGENT Section */}
            <div>
              <button
                onClick={() => toggleSection('urgent')}
                className="flex items-center justify-between w-full mb-4 group"
              >
                <h2 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                  ⚠️ URGENT ({getUrgentCases().length})
                  <ChevronDown 
                    className={`w-5 h-5 transition-transform ${expandedSections.urgent ? '' : '-rotate-90'}`}
                  />
                </h2>
              </button>
              {expandedSections.urgent && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {getUrgentCases().length === 0 ? (
                    <p className="text-slate-400 col-span-full">No urgent cases</p>
                  ) : (
                    getUrgentCases().map(c => (
                      <CaseCard key={c.id} mortgageCase={c} />
                    ))
                  )}
                </div>
              )}
            </div>

            {/* THIS WEEK Section */}
            <div>
              <button
                onClick={() => toggleSection('thisWeek')}
                className="flex items-center justify-between w-full mb-4 group"
              >
                <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                  📅 THIS WEEK ({getThisWeekCases().length})
                  <ChevronDown 
                    className={`w-5 h-5 transition-transform ${expandedSections.thisWeek ? '' : '-rotate-90'}`}
                  />
                </h2>
              </button>
              {expandedSections.thisWeek && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {getThisWeekCases().length === 0 ? (
                    <p className="text-slate-400 col-span-full">No cases this week</p>
                  ) : (
                    getThisWeekCases().map(c => (
                      <CaseCard key={c.id} mortgageCase={c} />
                    ))
                  )}
                </div>
              )}
            </div>

            {/* READY TO SEND Section */}
            <div>
              <button
                onClick={() => toggleSection('readyToSend')}
                className="flex items-center justify-between w-full mb-4 group"
              >
                <h2 className="text-lg font-semibold text-emerald-600 flex items-center gap-2">
                  ✅ READY TO SEND ({getReadyToSendCases().length})
                  <ChevronDown 
                    className={`w-5 h-5 transition-transform ${expandedSections.readyToSend ? '' : '-rotate-90'}`}
                  />
                </h2>
              </button>
              {expandedSections.readyToSend && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {getReadyToSendCases().length === 0 ? (
                    <p className="text-slate-400 col-span-full">No drafts ready</p>
                  ) : (
                    getReadyToSendCases().map(c => (
                      <CaseCard key={c.id} mortgageCase={c} />
                    ))
                  )}
                </div>
              )}
            </div>

            {/* WAITING ON CLIENT Section */}
            <div>
              <button
                onClick={() => toggleSection('waiting')}
                className="flex items-center justify-between w-full mb-4 group"
              >
                <h2 className="text-lg font-semibold text-slate-500 flex items-center gap-2">
                  ⏸️ WAITING ({getWaitingCases().length})
                  <ChevronDown 
                    className={`w-5 h-5 transition-transform ${expandedSections.waiting ? '' : '-rotate-90'}`}
                  />
                </h2>
              </button>
              {expandedSections.waiting && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {getWaitingCases().length === 0 ? (
                    <p className="text-slate-400 col-span-full">No cases waiting</p>
                  ) : (
                    getWaitingCases().map(c => (
                      <CaseCard key={c.id} mortgageCase={c} />
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pipeline View */}
        <div id="pipeline-view" style={{ display: activeTab === 'pipeline' ? 'block' : 'none' }}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {/* Pipeline Column */}
            <div className="flex-1 min-w-[280px] border-r border-slate-200 pr-4">
              <div className="sticky top-0 bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 pb-3 mb-3 z-10">
                <h3 className="text-[16px] font-semibold text-slate-700">
                  Pipeline <span className="text-slate-400 font-normal">({getCasesByStages(STAGE_GROUPS.pipeline).length})</span>
                </h3>
              </div>
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {getCasesByStages(STAGE_GROUPS.pipeline).length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No cases</p>
                ) : (
                  getCasesByStages(STAGE_GROUPS.pipeline).map(c => (
                    <CaseCard key={c.id} mortgageCase={c} />
                  ))
                )}
              </div>
            </div>

            {/* Review & Delivery Column */}
            <div className="flex-1 min-w-[280px] border-r border-slate-200 pr-4">
              <div className="sticky top-0 bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 pb-3 mb-3 z-10">
                <h3 className="text-[16px] font-semibold text-slate-700">
                  Review & Delivery <span className="text-slate-400 font-normal">({getCasesByStages(STAGE_GROUPS.review).length})</span>
                </h3>
              </div>
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {getCasesByStages(STAGE_GROUPS.review).length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No cases</p>
                ) : (
                  getCasesByStages(STAGE_GROUPS.review).map(c => (
                    <CaseCard key={c.id} mortgageCase={c} />
                  ))
                )}
              </div>
            </div>

            {/* Client Decision Column */}
            <div className="flex-1 min-w-[280px] border-r border-slate-200 pr-4">
              <div className="sticky top-0 bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 pb-3 mb-3 z-10">
                <h3 className="text-[16px] font-semibold text-slate-700">
                  Client Decision <span className="text-slate-400 font-normal">({getCasesByStages(STAGE_GROUPS.active).length})</span>
                </h3>
              </div>
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {getCasesByStages(STAGE_GROUPS.active).length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No cases</p>
                ) : (
                  getCasesByStages(STAGE_GROUPS.active).map(c => (
                    <CaseCard key={c.id} mortgageCase={c} />
                  ))
                )}
              </div>
            </div>

            {/* Broker Stage Column */}
            <div className="flex-1 min-w-[280px] border-r border-slate-200 pr-4">
              <div className="sticky top-0 bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 pb-3 mb-3 z-10">
                <h3 className="text-[16px] font-semibold text-slate-700">
                  Broker Stage <span className="text-slate-400 font-normal">({getCasesByStages(STAGE_GROUPS.broker).length})</span>
                </h3>
              </div>
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {getCasesByStages(STAGE_GROUPS.broker).length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No cases</p>
                ) : (
                  getCasesByStages(STAGE_GROUPS.broker).map(c => (
                    <CaseCard key={c.id} mortgageCase={c} />
                  ))
                )}
              </div>
            </div>

            {/* Closed Column */}
            <div className="flex-1 min-w-[280px]">
              <div className="sticky top-0 bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 pb-3 mb-3 z-10">
                <h3 className="text-[16px] font-semibold text-slate-700">
                  Closed <span className="text-slate-400 font-normal">({getCasesByStages(STAGE_GROUPS.closed).length})</span>
                </h3>
              </div>
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {getCasesByStages(STAGE_GROUPS.closed).length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No cases</p>
                ) : (
                  getCasesByStages(STAGE_GROUPS.closed).map(c => (
                    <CaseCard key={c.id} mortgageCase={c} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* All Cases View */}
        <div id="all-cases-view" style={{ display: activeTab === 'all-cases' ? 'block' : 'none' }}>
          <div className="flex items-center justify-center py-16 text-slate-400">
            <p>All Cases view content will be added here</p>
          </div>
        </div>
      </div>
    </div>
  );
}