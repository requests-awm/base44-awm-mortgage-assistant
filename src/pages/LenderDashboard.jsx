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

export default function LenderDashboard() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const { data: lenders = [], isLoading: loadingLenders } = useQuery({
    queryKey: ['lenders'],
    queryFn: () => base44.entities.Lender.list()
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['lenderProducts'],
    queryFn: () => base44.entities.LenderProduct.list()
  });

  // Filter and sort
  const filteredLenders = useMemo(() => {
    let filtered = lenders.filter(l => {
      const matchesSearch = !search || 
        l.name?.toLowerCase().includes(search.toLowerCase()) ||
        l.short_name?.toLowerCase().includes(search.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || l.category === categoryFilter;
      
      return matchesSearch && matchesCategory && l.is_active;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        case 'updated':
          return new Date(b.last_criteria_update || 0) - new Date(a.last_criteria_update || 0);
        case 'products':
          const aCount = products.filter(p => p.lender_id === a.id).length;
          const bCount = products.filter(p => p.lender_id === b.id).length;
          return bCount - aCount;
        default:
          return 0;
      }
    });

    return filtered;
  }, [lenders, products, search, categoryFilter, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const activeLenders = lenders.filter(l => l.is_active).length;
    const totalProducts = products.filter(p => p.is_available).length;
    const needsUpdate = lenders.filter(l => {
      if (!l.last_criteria_update) return true;
      const daysSince = (Date.now() - new Date(l.last_criteria_update).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince > 90;
    }).length;

    return { activeLenders, totalProducts, needsUpdate };
  }, [lenders, products]);

  if (loadingLenders || loadingProducts) {
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
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48 bg-white/80">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="high_street">High Street</SelectItem>
                <SelectItem value="building_society">Building Society</SelectItem>
                <SelectItem value="specialist">Specialist</SelectItem>
                <SelectItem value="private_bank">Private Bank</SelectItem>
                <SelectItem value="challenger">Challenger</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48 bg-white/80">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="updated">Last Updated</SelectItem>
                <SelectItem value="products">Product Count</SelectItem>
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
            const lenderProducts = products.filter(p => p.lender_id === lender.id && p.is_available);
            const needsUpdate = !lender.last_criteria_update || 
              (Date.now() - new Date(lender.last_criteria_update).getTime()) / (1000 * 60 * 60 * 24) > 90;

            return (
              <Card key={lender.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold text-slate-900">
                        {lender.name}
                      </CardTitle>
                      {lender.short_name && (
                        <p className="text-xs text-slate-500 mt-0.5">{lender.short_name}</p>
                      )}
                    </div>
                    <Badge className={`${CATEGORY_COLORS[lender.category]} text-xs`}>
                      {CATEGORY_LABELS[lender.category]}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Products */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-700">Products</span>
                    </div>
                    <span className="font-semibold text-slate-900">{lenderProducts.length}</span>
                  </div>

                  {/* Product Types */}
                  {lender.products_offered && lender.products_offered.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-2">Offerings</p>
                      <div className="flex flex-wrap gap-1.5">
                        {lender.products_offered.map((type, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs capitalize">
                            {type.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* BDM Contact */}
                  {lender.bdm_contact && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{lender.bdm_contact}</span>
                    </div>
                  )}

                  {/* Last Update */}
                  <div className="pt-3 border-t flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" />
                      {lender.last_criteria_update ? (
                        <span>Updated {formatDistanceToNow(new Date(lender.last_criteria_update), { addSuffix: true })}</span>
                      ) : (
                        <span>Never updated</span>
                      )}
                    </div>
                    {needsUpdate && (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                        Update needed
                      </Badge>
                    )}
                  </div>

                  {/* Criteria URL */}
                  {lender.criteria_url && (
                    <a 
                      href={lender.criteria_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Criteria
                    </a>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

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