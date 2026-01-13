import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Building, Search, Filter, TrendingUp, Users, 
  Phone, Mail, ExternalLink, Calendar, Package,
  AlertTriangle, CheckCircle, Loader2, ArrowUpDown
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORY_LABELS = {
  high_street: 'High Street',
  building_society: 'Building Society',
  specialist: 'Specialist',
  private_bank: 'Private Bank',
  challenger: 'Challenger'
};

const CATEGORY_COLORS = {
  high_street: 'bg-blue-100 text-blue-700',
  building_society: 'bg-green-100 text-green-700',
  specialist: 'bg-purple-100 text-purple-700',
  private_bank: 'bg-amber-100 text-amber-700',
  challenger: 'bg-pink-100 text-pink-700'
};

import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

export default function LenderDashboard() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [selectedLender, setSelectedLender] = useState(null);

  const { data: lenders = [], isLoading: loadingLenders } = useQuery({
    queryKey: ['lenders'],
    queryFn: () => base44.entities.Lender.list()
  });

  // Filter and sort
  const filteredLenders = useMemo(() => {
    let filtered = lenders.filter(l => {
      const matchesSearch = !search || 
        l.name?.toLowerCase().includes(search.toLowerCase()) ||
        l.short_name?.toLowerCase().includes(search.toLowerCase());
      
      const matchesType = typeFilter === 'all' || l.type === typeFilter;
      
      return matchesSearch && matchesType && l.is_active;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'type':
          return (a.type || '').localeCompare(b.type || '');
        case 'updated':
          return new Date(b.last_updated || 0) - new Date(a.last_updated || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [lenders, search, typeFilter, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const activeLenders = lenders.filter(l => l.is_active).length;
    const needsUpdate = lenders.filter(l => {
      if (!l.last_updated) return true;
      const daysSince = (Date.now() - new Date(l.last_updated).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince > 90;
    }).length;

    return { activeLenders, needsUpdate };
  }, [lenders]);

  if (loadingLenders) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Lender Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of all active lenders and their product offerings</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Active Lenders</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.activeLenders}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Building className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Available Products</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.totalProducts}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Needs Update</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.needsUpdate}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search lenders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/80 border-slate-200"
            />
          </div>

          <div className="flex items-center gap-3">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48 bg-white/80">
                <SelectValue placeholder="Lender Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="High Street">High Street</SelectItem>
                <SelectItem value="Building Society">Building Society</SelectItem>
                <SelectItem value="Specialist">Specialist</SelectItem>
                <SelectItem value="Challenger">Challenger</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48 bg-white/80">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="type">Type</SelectItem>
                <SelectItem value="updated">Last Updated</SelectItem>
              </SelectContent>
            </Select>

            <Link to={createPageUrl('Lenders')}>
              <Button variant="outline">
                <Building className="w-4 h-4 mr-2" />
                Manage
              </Button>
            </Link>
          </div>
        </div>

        {/* Lenders Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredLenders.map(lender => {
            const needsUpdate = !lender.last_updated || 
              (Date.now() - new Date(lender.last_updated).getTime()) / (1000 * 60 * 60 * 24) > 90;
            
            // Format helpers
            const formatPercent = (val) => val ? `${val}%` : '-';
            const formatMoney = (val) => val ? `£${val.toLocaleString()}` : '-';

            return (
              <Card 
                key={lender.id} 
                className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:ring-2 hover:ring-[#D1B36A]/50"
                onClick={() => setSelectedLender(lender)}
              >
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900">
                        {lender.name}
                      </CardTitle>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">{lender.type}</p>
                    </div>
                    {needsUpdate && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 text-[10px] px-1.5 h-5">
                        Update needed
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  {/* Key Stats */}
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Max LTV</span>
                      <span className="font-semibold text-slate-900">
                        {formatPercent(lender.max_ltv_residential)} (Res) <span className="text-slate-300">|</span> {formatPercent(lender.max_ltv_btl)} (BTL)
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Min Income</span>
                      <span className="font-semibold text-slate-900">{formatMoney(lender.min_income)}</span>
                    </div>
                  </div>

                  {/* Boolean Flags */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className={`flex items-center gap-2 text-sm ${lender.self_employed_accepted ? 'text-slate-700' : 'text-slate-400'}`}>
                      {lender.self_employed_accepted ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <div className="w-4 h-4 flex items-center justify-center text-slate-300">✗</div>}
                      <span>Self-Employed OK</span>
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${lender.later_life_products ? 'text-slate-700' : 'text-slate-400'}`}>
                      {lender.later_life_products ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <div className="w-4 h-4 flex items-center justify-center text-slate-300">✗</div>}
                      <span>Later Life Products</span>
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${lender.ltd_company_btl ? 'text-slate-700' : 'text-slate-400'}`}>
                      {lender.ltd_company_btl ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <div className="w-4 h-4 flex items-center justify-center text-slate-300">✗</div>}
                      <span>Ltd Company BTL</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-4 mt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100">
                    <span>
                      Updated {lender.last_updated ? formatDistanceToNow(new Date(lender.last_updated), { addSuffix: true }) : 'never'}
                    </span>
                    <div className="flex gap-3 font-medium">
                      {lender.criteria_url && (
                        <a 
                          href={lender.criteria_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          View Criteria
                        </a>
                      )}
                      <span className="text-slate-300">|</span>
                      <button className="text-slate-600 hover:text-slate-900 hover:underline">Edit</button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Detail Modal */}
        <Dialog open={!!selectedLender} onOpenChange={(open) => !open && setSelectedLender(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedLender && (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between pr-8">
                    <div>
                      <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                        {selectedLender.name}
                        {selectedLender.criteria_url && (
                          <a 
                            href={selectedLender.criteria_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </a>
                        )}
                      </DialogTitle>
                      <p className="text-slate-500 mt-1">{selectedLender.type}</p>
                    </div>
                    {(!selectedLender.last_updated || (Date.now() - new Date(selectedLender.last_updated).getTime()) / (1000 * 60 * 60 * 24) > 90) && (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">Update Needed</Badge>
                    )}
                  </div>
                </DialogHeader>

                <div className="space-y-8 py-4">
                  {/* Key Criteria Grid */}
                  <div className="grid grid-cols-2 gap-6 p-5 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Residential</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Max LTV:</span>
                          <span className="font-semibold">{selectedLender.max_ltv_residential}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Min Income:</span>
                          <span className="font-semibold">£{(selectedLender.min_income || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Self-Employed:</span>
                          <span className={selectedLender.self_employed_accepted ? "text-emerald-600 font-medium" : "text-slate-400"}>
                            {selectedLender.self_employed_accepted ? "Accepted" : "No"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Later Life:</span>
                          <span className={selectedLender.later_life_products ? "text-emerald-600 font-medium" : "text-slate-400"}>
                            {selectedLender.later_life_products ? "Available" : "No"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>HMO:</span>
                          <span className={selectedLender.hmo_mortgages ? "text-emerald-600 font-medium" : "text-slate-400"}>
                            {selectedLender.hmo_mortgages ? "Available" : "No"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Buy-to-Let</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Max LTV:</span>
                          <span className="font-semibold">{selectedLender.max_ltv_btl}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ltd Company:</span>
                          <span className={selectedLender.ltd_company_btl ? "text-emerald-600 font-medium" : "text-slate-400"}>
                            {selectedLender.ltd_company_btl ? "Accepted" : "No"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Text Sections */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-emerald-700 flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4" /> Strengths
                      </h3>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {selectedLender.strengths || "No strengths listed."}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-700 flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4" /> Weaknesses
                      </h3>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {selectedLender.weaknesses || "No weaknesses listed."}
                      </p>
                    </div>
                  </div>

                  {selectedLender.notable_criteria && (
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">Notable Criteria</h3>
                      <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 border-l-4 border-blue-500">
                        {selectedLender.notable_criteria}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-slate-400 text-center pt-4 border-t">
                    Last updated: {selectedLender.last_updated ? format(new Date(selectedLender.last_updated), 'dd MMM yyyy') : 'Never'}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {filteredLenders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Building className="w-12 h-12 mb-3" />
            <p>No lenders found</p>
          </div>
        )}
      </div>
    </div>
  );
}