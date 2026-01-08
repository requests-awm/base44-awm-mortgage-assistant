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
  AlertTriangle, Building, TrendingUp, Users, Loader2
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
    
    return matchesSearch && matchesFilter && matchesTriage;
  });

  // Calculate triage counts
  const triageCounts = cases.reduce((acc, c) => {
    const triage = c.triage_rating || calculateTriageRating(c).rating;
    acc[triage] = (acc[triage] || 0) + 1;
    return acc;
  }, { red: 0, yellow: 0, green: 0 });

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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                <TabsTrigger value="all">All Priority</TabsTrigger>
                <TabsTrigger 
                  value="red" 
                  className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700"
                >
                  Urgent ({triageCounts.red})
                </TabsTrigger>
                <TabsTrigger 
                  value="yellow" 
                  className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700"
                >
                  Review ({triageCounts.yellow})
                </TabsTrigger>
                <TabsTrigger 
                  value="green" 
                  className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700"
                >
                  Strong ({triageCounts.green})
                </TabsTrigger>
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

        {/* Kanban View */}
        {view === 'kanban' && (
          <div className="flex gap-5 overflow-x-auto pb-4">
            <StageColumn
              title="Pipeline"
              icon={FileText}
              cases={getCasesByStages(STAGE_GROUPS.pipeline)}
            />
            <StageColumn
              title="Review & Delivery"
              icon={Clock}
              cases={getCasesByStages(STAGE_GROUPS.review)}
            />
            <StageColumn
              title="Client Decision"
              icon={MessageSquare}
              cases={getCasesByStages(STAGE_GROUPS.active)}
            />
            <StageColumn
              title="Broker Stage"
              icon={Users}
              cases={getCasesByStages(STAGE_GROUPS.broker)}
            />
            <StageColumn
              title="Closed"
              icon={CheckCircle}
              cases={getCasesByStages(STAGE_GROUPS.closed)}
            />
          </div>
        )}

        {/* List View */}
        {view === 'list' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCases.map(c => (
              <CaseCard key={c.id} mortgageCase={c} />
            ))}
            {filteredCases.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400">
                <FileText className="w-12 h-12 mb-3" />
                <p>No cases found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}