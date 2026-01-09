import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function RemortgageFields({ formData, updateField }) {
  const { data: lenders = [], isLoading } = useQuery({
    queryKey: ['activeLenders'],
    queryFn: async () => {
      const allLenders = await base44.entities.Lender.filter({ is_active: true });
      return allLenders.sort((a, b) => a.name.localeCompare(b.name));
    }
  });

  // Determine if we should show "Other" text input
  const isCustomLender = formData.existing_lender && 
    !lenders.some(l => l.name === formData.existing_lender) &&
    formData.existing_lender !== '';
  
  const [showOtherInput, setShowOtherInput] = useState(isCustomLender);

  useEffect(() => {
    // Update showOtherInput when lenders load or existing_lender changes
    if (lenders.length > 0 && formData.existing_lender) {
      const isKnownLender = lenders.some(l => l.name === formData.existing_lender);
      setShowOtherInput(!isKnownLender && formData.existing_lender !== '');
    }
  }, [lenders, formData.existing_lender]);

  const handleLenderChange = (value) => {
    if (value === 'Other') {
      setShowOtherInput(true);
      updateField('existing_lender', '');
    } else {
      setShowOtherInput(false);
      updateField('existing_lender', value);
    }
  };

  return (
    <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-4">
      <h4 className="font-medium text-slate-900 text-sm">Current Mortgage Details (Optional)</h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs">Current Lender</Label>
          {showOtherInput ? (
            <div className="space-y-2">
              <Input
                value={formData.existing_lender}
                onChange={(e) => updateField('existing_lender', e.target.value)}
                placeholder="Enter lender name"
                className="bg-white"
              />
              <button
                type="button"
                onClick={() => {
                  setShowOtherInput(false);
                  updateField('existing_lender', '');
                }}
                className="text-xs text-blue-600 hover:text-blue-700 underline"
              >
                ← Select from list
              </button>
            </div>
          ) : (
            <Select 
              value={formData.existing_lender || undefined} 
              onValueChange={handleLenderChange}
              disabled={isLoading}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder={isLoading ? "Loading lenders..." : "Select lender"} />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {lenders.map((lender) => (
                  <SelectItem key={lender.id} value={lender.name}>
                    {lender.name}
                  </SelectItem>
                ))}
                <SelectItem value="Other">Other (custom)</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="existing_rate" className="text-xs">Current Rate (%)</Label>
          <div className="relative">
            <Input
              id="existing_rate"
              type="number"
              step="0.01"
              value={formData.existing_rate}
              onChange={(e) => updateField('existing_rate', e.target.value)}
              placeholder="e.g., 2.18"
              className="bg-white pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs">Product Type</Label>
          <Select value={formData.existing_product_type} onValueChange={(v) => updateField('existing_product_type', v)}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Fixed">Fixed</SelectItem>
              <SelectItem value="Tracker">Tracker</SelectItem>
              <SelectItem value="Variable">Variable</SelectItem>
              <SelectItem value="Discounted">Discounted</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="existing_product_end_date" className="text-xs">Product End Date</Label>
          <Input
            id="existing_product_end_date"
            type="date"
            value={formData.existing_product_end_date}
            onChange={(e) => updateField('existing_product_end_date', e.target.value)}
            className="bg-white"
          />
          <p className="text-xs text-slate-500">When does your current deal end?</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="existing_monthly_payment" className="text-xs">Current Monthly Payment</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">£</span>
            <Input
              id="existing_monthly_payment"
              type="number"
              value={formData.existing_monthly_payment}
              onChange={(e) => updateField('existing_monthly_payment', e.target.value)}
              placeholder="e.g., 850"
              className="bg-white pl-8"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Reason for Switching</Label>
          <Select value={formData.switching_reason} onValueChange={(v) => updateField('switching_reason', v)}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select reason" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Rate Expiry">Rate Expiry</SelectItem>
              <SelectItem value="Better Rate Available">Better Rate Available</SelectItem>
              <SelectItem value="Change in Circumstances">Change in Circumstances</SelectItem>
              <SelectItem value="Debt Consolidation">Debt Consolidation</SelectItem>
              <SelectItem value="Capital Raise">Capital Raise</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}