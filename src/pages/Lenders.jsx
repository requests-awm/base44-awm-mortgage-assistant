import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, Search, Building, CheckCircle, AlertCircle, 
  Pencil, Loader2, ExternalLink, User
} from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'high_street', label: 'High Street' },
  { value: 'building_society', label: 'Building Society' },
  { value: 'specialist', label: 'Specialist' },
  { value: 'private_bank', label: 'Private Bank' },
  { value: 'challenger', label: 'Challenger' }
];

const PRODUCTS = [
  { value: 'residential', label: 'Residential' },
  { value: 'buy_to_let', label: 'Buy-to-Let' },
  { value: 'later_life', label: 'Later Life' },
  { value: 'ltd_company', label: 'Ltd Company' },
  { value: 'bridging', label: 'Bridging' }
];

const CREDIT_STANCES = [
  { value: 'strict', label: 'Strict' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'flexible', label: 'Flexible' }
];

export default function Lenders() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingLender, setEditingLender] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: lenders = [], isLoading } = useQuery({
    queryKey: ['lenders'],
    queryFn: () => base44.entities.Lender.list('name')
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (data.id) {
        return await base44.entities.Lender.update(data.id, data);
      }
      return await base44.entities.Lender.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lenders']);
      setIsDialogOpen(false);
      setEditingLender(null);
      toast.success('Lender saved');
    }
  });

  const filteredLenders = lenders.filter(l => {
    const matchesSearch = !search || 
      l.name?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || l.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (lender) => {
    setEditingLender(lender);
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingLender({
      name: '',
      category: 'high_street',
      products_offered: [],
      is_active: true,
      accepts_self_employed: true,
      accepts_contractors: true,
      accepts_ltd_company: false,
      credit_stance: 'moderate'
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Lender Directory</h1>
            <p className="text-slate-500 mt-1">Knowledge base for market analysis</p>
          </div>
          <Button onClick={handleNew} className="bg-slate-900 hover:bg-slate-800">
            <Plus className="w-4 h-4 mr-2" />
            Add Lender
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search lenders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/80"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48 bg-white/80">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lenders Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLenders.map(lender => (
              <Card 
                key={lender.id} 
                className={`border-0 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                  !lender.is_active ? 'opacity-60' : ''
                }`}
                onClick={() => handleEdit(lender)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Building className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{lender.name}</h3>
                        <p className="text-xs text-slate-500 capitalize">
                          {lender.category?.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    {!lender.is_active && (
                      <Badge variant="outline" className="text-xs text-slate-500">Inactive</Badge>
                    )}
                  </div>

                  {/* Products */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {lender.products_offered?.slice(0, 3).map((p, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {p.replace('_', ' ')}
                      </Badge>
                    ))}
                    {lender.products_offered?.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{lender.products_offered.length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {lender.max_ltv_residential && (
                      <div className="flex items-center gap-1 text-slate-600">
                        <span className="text-slate-400">Max LTV:</span>
                        <span className="font-medium">{lender.max_ltv_residential}%</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-slate-600">
                      <span className="text-slate-400">Credit:</span>
                      <span className="font-medium capitalize">{lender.credit_stance}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    {lender.accepts_self_employed && (
                      <div className="flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle className="w-3 h-3" />
                        SE
                      </div>
                    )}
                    {lender.accepts_contractors && (
                      <div className="flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle className="w-3 h-3" />
                        Contractors
                      </div>
                    )}
                    {lender.accepts_ltd_company && (
                      <div className="flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle className="w-3 h-3" />
                        Ltd
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredLenders.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400">
                <Building className="w-12 h-12 mb-3" />
                <p>No lenders found</p>
              </div>
            )}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingLender?.id ? 'Edit Lender' : 'Add New Lender'}
              </DialogTitle>
            </DialogHeader>

            {editingLender && (
              <LenderForm 
                lender={editingLender}
                onSave={(data) => saveMutation.mutate(data)}
                isSaving={saveMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function LenderForm({ lender, onSave, isSaving }) {
  const [formData, setFormData] = useState(lender);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleProduct = (product) => {
    const current = formData.products_offered || [];
    const updated = current.includes(product)
      ? current.filter(p => p !== product)
      : [...current, product];
    updateField('products_offered', updated);
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Lender Name</Label>
          <Input
            value={formData.name || ''}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="e.g., Nationwide"
          />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={formData.category} onValueChange={(v) => updateField('category', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products */}
      <div className="space-y-2">
        <Label>Products Offered</Label>
        <div className="flex flex-wrap gap-2">
          {PRODUCTS.map(p => (
            <Badge
              key={p.value}
              variant={formData.products_offered?.includes(p.value) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleProduct(p.value)}
            >
              {p.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* LTV Limits */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Max LTV Residential (%)</Label>
          <Input
            type="number"
            value={formData.max_ltv_residential || ''}
            onChange={(e) => updateField('max_ltv_residential', parseFloat(e.target.value))}
            placeholder="e.g., 95"
          />
        </div>
        <div className="space-y-2">
          <Label>Max LTV BTL (%)</Label>
          <Input
            type="number"
            value={formData.max_ltv_btl || ''}
            onChange={(e) => updateField('max_ltv_btl', parseFloat(e.target.value))}
            placeholder="e.g., 75"
          />
        </div>
      </div>

      {/* Credit Stance */}
      <div className="space-y-2">
        <Label>Credit Stance</Label>
        <Select value={formData.credit_stance} onValueChange={(v) => updateField('credit_stance', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CREDIT_STANCES.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Acceptance Criteria */}
      <div className="space-y-3">
        <Label>Acceptance Criteria</Label>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-sm">Accepts Self-Employed</span>
            <Switch
              checked={formData.accepts_self_employed}
              onCheckedChange={(v) => updateField('accepts_self_employed', v)}
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-sm">Accepts Contractors</span>
            <Switch
              checked={formData.accepts_contractors}
              onCheckedChange={(v) => updateField('accepts_contractors', v)}
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-sm">Accepts Ltd Company</span>
            <Switch
              checked={formData.accepts_ltd_company}
              onCheckedChange={(v) => updateField('accepts_ltd_company', v)}
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label>Broker Notes</Label>
        <Textarea
          value={formData.notes || ''}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder="Experience notes, edge cases, tips..."
          rows={4}
        />
      </div>

      {/* BDM Contact */}
      <div className="space-y-2">
        <Label>BDM Contact</Label>
        <Input
          value={formData.bdm_contact || ''}
          onChange={(e) => updateField('bdm_contact', e.target.value)}
          placeholder="Name and contact details"
        />
      </div>

      {/* Active Status */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div>
          <Label>Active Lender</Label>
          <p className="text-xs text-slate-500 mt-0.5">Include in market analysis</p>
        </div>
        <Switch
          checked={formData.is_active}
          onCheckedChange={(v) => updateField('is_active', v)}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          onClick={() => onSave(formData)}
          disabled={isSaving || !formData.name}
          className="bg-slate-900 hover:bg-slate-800"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Lender'
          )}
        </Button>
      </div>
    </div>
  );
}