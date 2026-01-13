import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertTriangle, ArrowRight, User, Building, Banknote, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
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

export default function IntakeForm({ onSubmit, isSubmitting, initialData = {} }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    asana_task_gid: initialData.asana_task_gid || '',
    client_name: initialData.client_name || '',
    client_email: initialData.client_email || '',
    client_phone: initialData.client_phone || '',
    referring_team_member: initialData.referring_team_member || '',
    referring_team: initialData.referring_team || '',
    property_value: initialData.property_value || '',
    loan_amount: initialData.loan_amount || '',
    category: initialData.category || '',
    purpose: initialData.purpose || '',
    existing_lender: initialData.existing_lender || '',
    existing_rate: initialData.existing_rate || '',
    existing_product_type: initialData.existing_product_type || '',
    existing_product_end_date: initialData.existing_product_end_date || '',
    existing_monthly_payment: initialData.existing_monthly_payment || '',
    switching_reason: initialData.switching_reason || '',
    annual_income: initialData.annual_income || '',
    income_type: initialData.income_type || '',
    client_deadline: initialData.client_deadline || ''
  });

  const [errors, setErrors] = useState({});
  const [triageFeedback, setTriageFeedback] = useState(null);
  const [isCalculatingTriage, setIsCalculatingTriage] = useState(false);
  const triageTimeoutRef = useRef(null);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Calculate triage when financial data changes
  useEffect(() => {
    const propertyValue = parseFloat(formData.property_value);
    const loanAmount = parseFloat(formData.loan_amount);
    const annualIncome = parseFloat(formData.annual_income) || 0;

    if (propertyValue && loanAmount) {
      const ltv = (loanAmount / propertyValue) * 100;

      // Clear existing timeout
      if (triageTimeoutRef.current) {
        clearTimeout(triageTimeoutRef.current);
      }

      // Debounce by 500ms
      triageTimeoutRef.current = setTimeout(async () => {
        setIsCalculatingTriage(true);
        try {
          const response = await base44.functions.invoke('calculateTriage', {
            ltv: Math.round(ltv * 10) / 10,
            annual_income: annualIncome,
            category: formData.category,
            income_type: formData.income_type,
            purpose: formData.purpose
          });

          setTriageFeedback(response.data);
        } catch (error) {
          console.error('Failed to calculate triage:', error);
        } finally {
          setIsCalculatingTriage(false);
        }
      }, 500);
    } else {
      setTriageFeedback(null);
    }

    return () => {
      if (triageTimeoutRef.current) {
        clearTimeout(triageTimeoutRef.current);
      }
    };
  }, [formData.property_value, formData.loan_amount, formData.annual_income, formData.category, formData.income_type, formData.purpose]);

  const validateStep = (stepNum) => {
    const newErrors = {};
    
    if (stepNum === 1) {
      if (!formData.client_name) newErrors.client_name = 'Required';
      if (!formData.referring_team_member) newErrors.referring_team_member = 'Required';
      if (!formData.property_value) newErrors.property_value = 'Required';
      if (!formData.loan_amount) newErrors.loan_amount = 'Required';
      if (!formData.category) newErrors.category = 'Required';
      if (!formData.purpose) newErrors.purpose = 'Required';
      
      if (formData.loan_amount && formData.property_value) {
        const ltv = (parseFloat(formData.loan_amount) / parseFloat(formData.property_value)) * 100;
        if (ltv > 100) newErrors.loan_amount = 'Loan exceeds property value';
      }
    }
    
    if (stepNum === 2) {
      if (!formData.annual_income) newErrors.annual_income = 'Required';
      if (!formData.income_type) newErrors.income_type = 'Required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 2));
    }
  };

  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = () => {
    console.log('[IntakeForm] handleSubmit called');
    
    if (!validateStep(2)) {
      console.log('[IntakeForm] Validation failed');
      return;
    }
    
    const ltv = formData.property_value && formData.loan_amount 
      ? (parseFloat(formData.loan_amount) / parseFloat(formData.property_value)) * 100 
      : null;

    const submitData = {
      ...formData,
      property_value: parseFloat(formData.property_value) || null,
      loan_amount: parseFloat(formData.loan_amount) || null,
      annual_income: parseFloat(formData.annual_income) || null,
      existing_rate: parseFloat(formData.existing_rate) || null,
      existing_monthly_payment: parseFloat(formData.existing_monthly_payment) || null,
      ltv: ltv ? Math.round(ltv * 10) / 10 : null
    };

    console.log('[IntakeForm] Submitting data:', submitData);
    
    onSubmit(submitData);
  };

  const calculateLTV = () => {
    if (formData.property_value && formData.loan_amount) {
      const ltv = (parseFloat(formData.loan_amount) / parseFloat(formData.property_value)) * 100;
      return Math.round(ltv * 10) / 10;
    }
    return null;
  };

  const ltv = calculateLTV();

  const stepConfig = [
    { num: 1, label: 'Case Details', icon: Building },
    { num: 2, label: 'Income & Timeline', icon: Banknote }
  ];

  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardDescription className="text-slate-500">
          {step === 1 ? 'Capture client details from Asana handover' : 'Financial assessment for triage scoring'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <AnimatePresence mode="wait">
          {/* Step 1: Case Details */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="client_name">Client Name (from Asana/handover)</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => updateField('client_name', e.target.value)}
                  placeholder="Full name"
                  className={errors.client_name ? 'border-red-300' : ''}
                />
                {errors.client_name && (
                  <p className="text-xs text-red-500">{errors.client_name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_email">Email Address</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => updateField('client_email', e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_phone">Phone Number</Label>
                  <Input
                    id="client_phone"
                    value={formData.client_phone}
                    onChange={(e) => updateField('client_phone', e.target.value)}
                    placeholder="+44 ..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="asana_task_gid">Asana Task ID</Label>
                <Input
                  id="asana_task_gid"
                  value={formData.asana_task_gid}
                  onChange={(e) => updateField('asana_task_gid', e.target.value)}
                  placeholder="e.g., 1234567890 (optional)"
                  className={errors.asana_task_gid ? 'border-red-300' : ''}
                />
                <p className="text-xs text-slate-500">Links case back to Asana task</p>
                {errors.asana_task_gid && (
                  <p className="text-xs text-red-500">{errors.asana_task_gid}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="referring_team_member">Referred By</Label>
                <Select value={formData.referring_team_member || ''} onValueChange={(v) => {
                  updateField('referring_team_member', v);
                  // Auto-extract team
                  const teamMap = {
                    'Mark Insley (Adviser)': 'Team Solo',
                    'Bongiwe Sithebe': formData.referring_team_member?.includes('Quest') ? 'Team Quest' : 'Team Solo',
                    'Ayanda Nyawose': 'Team Solo',
                    'James Croker': 'Team Solo',
                    'New Starter': 'Team Solo',
                    'Claire Calder (Adviser)': 'Team Royal',
                    'Algar Kaseema': 'Team Royal',
                    'Michael Morris': 'Team Royal',
                    'Greg Armstrong (Adviser)': 'Team Blue',
                    'Catriona McCarron (Adviser)': 'Team Hurricane Catriona',
                    'Israel Babatunde': 'Team Hurricane Catriona',
                    'April Chapman': 'Team Hurricane Catriona',
                    'Chenice Henry-Edwards': 'Team Hurricane Catriona',
                    'Steve Coates (Adviser)': 'Team Quest',
                    'Dextter Roberts': 'Team Quest',
                    'Mark Drake (Adviser)': 'Chambers Wealth',
                    'Mark Stokes': 'Chambers Wealth',
                    'Simo Mlanjeni': 'Chambers Wealth',
                    'Sam Hallet (Adviser)': 'Cape Berkshire Asset Management',
                    'Shingirai Makuwaza': 'Cape Berkshire Asset Management',
                    'External Referral (not internal team)': 'External / Other'
                  };
                  updateField('referring_team', teamMap[v] || '');
                }}>
                  <SelectTrigger className={errors.referring_team_member ? 'border-red-300' : ''}>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50">Team Solo</div>
                    <SelectItem value="Mark Insley (Adviser)">Mark Insley (Adviser)</SelectItem>
                    <SelectItem value="Bongiwe Sithebe">Bongiwe Sithebe</SelectItem>
                    <SelectItem value="Ayanda Nyawose">Ayanda Nyawose</SelectItem>
                    <SelectItem value="James Croker">James Croker</SelectItem>
                    <SelectItem value="New Starter">New Starter</SelectItem>

                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50 mt-1">Team Royal</div>
                    <SelectItem value="Claire Calder (Adviser)">Claire Calder (Adviser)</SelectItem>
                    <SelectItem value="Algar Kaseema">Algar Kaseema</SelectItem>
                    <SelectItem value="Michael Morris">Michael Morris</SelectItem>

                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50 mt-1">Team Blue</div>
                    <SelectItem value="Greg Armstrong (Adviser)">Greg Armstrong (Adviser)</SelectItem>

                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50 mt-1">Team Hurricane Catriona</div>
                    <SelectItem value="Catriona McCarron (Adviser)">Catriona McCarron (Adviser)</SelectItem>
                    <SelectItem value="Israel Babatunde">Israel Babatunde</SelectItem>
                    <SelectItem value="April Chapman">April Chapman</SelectItem>
                    <SelectItem value="Chenice Henry-Edwards">Chenice Henry-Edwards</SelectItem>

                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50 mt-1">Team Quest</div>
                    <SelectItem value="Steve Coates (Adviser)">Steve Coates (Adviser)</SelectItem>
                    <SelectItem value="Bongiwe Sithebe (Quest)">Bongiwe Sithebe</SelectItem>
                    <SelectItem value="Dextter Roberts">Dextter Roberts</SelectItem>

                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50 mt-1">Chambers Wealth</div>
                    <SelectItem value="Mark Drake (Adviser)">Mark Drake (Adviser)</SelectItem>
                    <SelectItem value="Mark Stokes">Mark Stokes</SelectItem>
                    <SelectItem value="Simo Mlanjeni">Simo Mlanjeni</SelectItem>

                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50 mt-1">Cape Berkshire Asset Management</div>
                    <SelectItem value="Sam Hallet (Adviser)">Sam Hallet (Adviser)</SelectItem>
                    <SelectItem value="Shingirai Makuwaza">Shingirai Makuwaza</SelectItem>

                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50 mt-1">External / Other</div>
                    <SelectItem value="External Referral (not internal team)">External Referral (not internal team)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.referring_team_member && (
                  <p className="text-xs text-red-500">{errors.referring_team_member}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="property_value">Property Value (£)</Label>
                  <Input
                    id="property_value"
                    type="number"
                    value={formData.property_value}
                    onChange={(e) => updateField('property_value', e.target.value)}
                    placeholder="e.g., 500000"
                    className={errors.property_value ? 'border-red-300' : ''}
                  />
                  {errors.property_value && (
                    <p className="text-xs text-red-500">{errors.property_value}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loan_amount">Loan Amount (£)</Label>
                  <Input
                    id="loan_amount"
                    type="number"
                    value={formData.loan_amount}
                    onChange={(e) => updateField('loan_amount', e.target.value)}
                    placeholder="e.g., 375000"
                    className={errors.loan_amount ? 'border-red-300' : ''}
                  />
                  {errors.loan_amount && (
                    <p className="text-xs text-red-500">{errors.loan_amount}</p>
                  )}
                </div>
              </div>

              {ltv && (
                <div className={`p-4 rounded-xl border ${
                  ltv <= 75 ? 'bg-emerald-50 border-emerald-200' :
                  ltv <= 85 ? 'bg-amber-50 border-amber-200' :
                  ltv <= 95 ? 'bg-orange-50 border-orange-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Loan-to-Value</span>
                    <span className={`text-lg font-bold ${
                      ltv <= 75 ? 'text-emerald-600' :
                      ltv <= 85 ? 'text-amber-600' :
                      ltv <= 95 ? 'text-orange-600' :
                      'text-red-600'
                    }`}>{ltv}%</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => updateField('category', v)}>
                    <SelectTrigger className={errors.category ? 'border-red-300' : ''}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Purpose</Label>
                  <Select value={formData.purpose} onValueChange={(v) => updateField('purpose', v)}>
                    <SelectTrigger className={errors.purpose ? 'border-red-300' : ''}>
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      {PURPOSES.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.purpose && <p className="text-xs text-red-500">{errors.purpose}</p>}
                </div>
              </div>

              {/* Conditional Remortgage Fields */}
              {(formData.purpose === 'remortgage' || formData.purpose === 'rate_expiry') && (
                <div className="border-t pt-4 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700">Current Mortgage Details</h3>
                  <RemortgageFields formData={formData} updateField={updateField} />
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Income & Timeline Assessment */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="annual_income">Annual Income (£)</Label>
                <Input
                  id="annual_income"
                  type="number"
                  value={formData.annual_income}
                  onChange={(e) => updateField('annual_income', e.target.value)}
                  placeholder="Gross annual income"
                  className={errors.annual_income ? 'border-red-300' : ''}
                />
                <p className="text-xs text-slate-500">From adviser's fact-find or estimated</p>
                {errors.annual_income && (
                  <p className="text-xs text-red-500">{errors.annual_income}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Employment Type</Label>
                <Select value={formData.income_type} onValueChange={(v) => updateField('income_type', v)}>
                  <SelectTrigger className={errors.income_type ? 'border-red-300' : ''}>
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.income_type && <p className="text-xs text-red-500">{errors.income_type}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_deadline">Client Deadline (if known)</Label>
                <Input
                  id="client_deadline"
                  type="date"
                  value={formData.client_deadline}
                  onChange={(e) => updateField('client_deadline', e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  Rate expiry or completion deadline from adviser
                </p>
              </div>

              {/* Live Triage Feedback */}
              {triageFeedback && ltv && (
                <div 
                  className="p-4 rounded-lg bg-white border-l-[5px] transition-all"
                  style={{ 
                    borderLeftColor: triageFeedback.color,
                    opacity: isCalculatingTriage ? 0.6 : 1
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: triageFeedback.color }}
                    />
                    <div className="flex-1">
                      <p className="text-slate-900 mb-0.5">
                        {triageFeedback.label || 'Good Case'}
                      </p>
                      <p className="text-xs text-slate-500 mb-2">
                        {triageFeedback.description}
                      </p>
                      {triageFeedback.factors && triageFeedback.factors.length > 0 && (
                        <ul className="space-y-1 mt-3">
                          {triageFeedback.factors.map((factor, idx) => (
                            <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="text-slate-400 mt-0.5">•</span>
                              <span>{factor}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {isCalculatingTriage && (
                      <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                    )}
                  </div>
                </div>
              )}

              <Alert className="bg-slate-50 border-slate-200">
                <AlertTriangle className="h-4 w-4 text-slate-600" />
                <AlertDescription className="text-slate-600 text-sm">
                  This will create a case for agent processing. The agent will validate data, 
                  analyse the market, and prepare indicative options before human review.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          {step > 1 ? (
            <Button variant="ghost" onClick={prevStep} disabled={isSubmitting}>
              Back
            </Button>
          ) : (
            <div />
          )}
          
          {step < 2 ? (
            <Button 
              onClick={nextStep}
              style={{
                backgroundColor: '#D1B36A',
                color: '#0E1B2A',
                fontWeight: 600,
                padding: '12px 24px',
                borderRadius: '6px'
              }}
              className="hover:bg-[#E0C77B]"
            >
              Continue to Assessment →
            </Button>
          ) : (
            <Button 
              type="button"
              onClick={() => {
                console.log('[IntakeForm] Button clicked');
                handleSubmit();
              }} 
              disabled={isSubmitting}
              style={{
                backgroundColor: '#D1B36A',
                color: '#0E1B2A',
                fontWeight: 600,
                padding: '12px 24px',
                borderRadius: '6px'
              }}
              className="hover:bg-[#E0C77B]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Case...
                </>
              ) : (
                <>
                  Create Case & Generate Email →
                </>
              )}
            </Button>
          )}
        </div>
        
        {/* Progress Text */}
        <div className="text-center mt-4">
          <p className="text-xs text-slate-500">Step {step} of 2</p>
        </div>
      </CardContent>
    </Card>
  );
}