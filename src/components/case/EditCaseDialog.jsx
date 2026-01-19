import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from 'lucide-react';
import RemortgageFields from '@/components/intake/RemortgageFields';

const CATEGORIES = [
  { value: 'residential', label: 'Residential' },
  { value: 'buy_to_let', label: 'Buy-to-Let' },
  { value: 'later_life', label: 'Later Life' },
  { value: 'ltd_company', label: 'Ltd Company' }
];

const PURPOSES = [
  { value: 'purchase', label: 'Purchase' },
  { value: 'remortgage', label: 'Remortgage' },
  { value: 'rate_expiry', label: 'Rate Expiry' }
];

const INCOME_TYPES = [
  { value: 'employed', label: 'Employed' },
  { value: 'self_employed', label: 'Self Employed' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'retired', label: 'Retired' },
  { value: 'mixed', label: 'Mixed Income' }
];

export default function EditCaseDialog({ isOpen, onClose, caseData, onSave, isSaving }) {
  const [formData, setFormData] = useState({
    client_name: caseData?.client_name || '',
    client_email: caseData?.client_email || '',
    client_phone: caseData?.client_phone || '',
    category: caseData?.category || '',
    purpose: caseData?.purpose || '',
    existing_lender: caseData?.existing_lender || '',
    existing_rate: caseData?.existing_rate || '',
    existing_product_type: caseData?.existing_product_type || '',
    existing_product_end_date: caseData?.existing_product_end_date || '',
    existing_monthly_payment: caseData?.existing_monthly_payment || '',
    switching_reason: caseData?.switching_reason || '',
    property_value: caseData?.property_value || '',
    loan_amount: caseData?.loan_amount || '',
    income_type: caseData?.income_type || '',
    annual_income: caseData?.annual_income || '',
    client_deadline: caseData?.client_deadline || '',
    rate_expiry_date: caseData?.rate_expiry_date || '',
    asana_task_gid: caseData?.asana_task_gid || '',
    notes: caseData?.notes || ''
  });

  // Update form when caseData changes
  React.useEffect(() => {
    if (caseData && isOpen) {
      const loadedData = {
        client_name: caseData.client_name || '',
        client_email: caseData.client_email || '',
        client_phone: caseData.client_phone || '',
        category: caseData.category || '',
        purpose: caseData.purpose || '',
        existing_lender: caseData.existing_lender || '',
        existing_rate: caseData.existing_rate || '',
        existing_product_type: caseData.existing_product_type || '',
        existing_product_end_date: caseData.existing_product_end_date || '',
        existing_monthly_payment: caseData.existing_monthly_payment || '',
        switching_reason: caseData.switching_reason || '',
        property_value: caseData.property_value || '',
        loan_amount: caseData.loan_amount || '',
        income_type: caseData.income_type || '',
        annual_income: caseData.annual_income || '',
        client_deadline: caseData.client_deadline || '',
        rate_expiry_date: caseData.rate_expiry_date || '',
        asana_task_gid: caseData.asana_task_gid || '',
        notes: caseData.notes || ''
      };
      console.log('📋 Loaded case for editing:', {
        property_value: loadedData.property_value,
        loan_amount: loadedData.loan_amount,
        ltv: caseData.ltv,
        triage_rating: caseData.triage_rating
      });
      setFormData(loadedData);
    }
  }, [caseData, isOpen]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Validation function for required fields
  const REQUIRED_FIELDS = [
    'client_name',
    'client_email',
    'client_phone',
    'property_value',
    'loan_amount',
    'purpose',
    'category',
    'annual_income',
    'income_type'
  ];

  const missingFields = REQUIRED_FIELDS.filter(field => !formData[field] || formData[field].toString().trim() === '');
  const isFormValid = missingFields.length === 0;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isFormValid) {
      return;
    }
    
    const ltv = formData.property_value && formData.loan_amount 
      ? (parseFloat(formData.loan_amount) / parseFloat(formData.property_value)) * 100 
      : null;

    onSave({
      ...formData,
      property_value: parseFloat(formData.property_value) || null,
      loan_amount: parseFloat(formData.loan_amount) || null,
      annual_income: parseFloat(formData.annual_income) || null,
      existing_rate: parseFloat(formData.existing_rate) || null,
      existing_monthly_payment: parseFloat(formData.existing_monthly_payment) || null,
      ltv: ltv ? Math.round(ltv * 10) / 10 : null
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Case Details</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Validation Errors */}
          {!isFormValid && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm font-semibold text-red-900 mb-2">Please fill in all required fields:</p>
              <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                {missingFields.map(field => (
                  <li key={field}>
                    {field.replace(/_/g, ' ').charAt(0).toUpperCase() + field.replace(/_/g, ' ').slice(1)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Client Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Client Information</h3>
            <div className="space-y-2">
              <Label htmlFor="edit_client_name">Client Name <span className="text-red-600">*</span></Label>
              <Input
                id="edit_client_name"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_client_email">Email <span className="text-red-600">*</span></Label>
                <Input
                  id="edit_client_email"
                  type="email"
                  value={formData.client_email}
                  onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_client_phone">Phone</Label>
                <Input
                  id="edit_client_phone"
                  value={formData.client_phone}
                  onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Mortgage Details */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold text-slate-900">Mortgage Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Purpose</Label>
                <Select value={formData.purpose} onValueChange={(v) => setFormData({ ...formData, purpose: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    {PURPOSES.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Existing Mortgage (Remortgage only) */}
          {formData.purpose === 'remortgage' && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold text-slate-900">Current Mortgage</h3>
              <RemortgageFields formData={formData} updateField={updateField} />
            </div>
          )}

          {/* Financial Details */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold text-slate-900">Financial Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_property_value">Property Value (£)</Label>
                <Input
                  id="edit_property_value"
                  type="number"
                  value={formData.property_value}
                  onChange={(e) => setFormData({ ...formData, property_value: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_loan_amount">Loan Amount (£)</Label>
                <Input
                  id="edit_loan_amount"
                  type="number"
                  value={formData.loan_amount}
                  onChange={(e) => setFormData({ ...formData, loan_amount: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Income Type</Label>
                <Select value={formData.income_type} onValueChange={(v) => setFormData({ ...formData, income_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select income type" />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_annual_income">Annual Income (£)</Label>
                <Input
                  id="edit_annual_income"
                  type="number"
                  value={formData.annual_income}
                  onChange={(e) => setFormData({ ...formData, annual_income: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Timing */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold text-slate-900">Timeline</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_client_deadline">Client Deadline</Label>
                <Input
                  id="edit_client_deadline"
                  type="date"
                  value={formData.client_deadline}
                  onChange={(e) => setFormData({ ...formData, client_deadline: e.target.value })}
                />
              </div>
              {formData.purpose === 'rate_expiry' && (
                <div className="space-y-2">
                  <Label htmlFor="edit_rate_expiry_date">Rate Expiry Date</Label>
                  <Input
                    id="edit_rate_expiry_date"
                    type="date"
                    value={formData.rate_expiry_date}
                    onChange={(e) => setFormData({ ...formData, rate_expiry_date: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Asana Integration */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold text-slate-900">Asana Integration</h3>
            <div className="space-y-2">
              <Label htmlFor="edit_asana_task_gid">Asana Task ID</Label>
              <Input
                id="edit_asana_task_gid"
                value={formData.asana_task_gid}
                onChange={(e) => setFormData({ ...formData, asana_task_gid: e.target.value })}
                placeholder="e.g., 1234567890"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="edit_notes">Notes</Label>
            <Textarea
              id="edit_notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="bg-[#D1B36A] text-[#0E1B2A] font-semibold hover:bg-[#DBC17D]">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recalculating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}