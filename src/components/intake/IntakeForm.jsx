import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertTriangle, ArrowRight, User, Building, Banknote, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import RemortgageFields from '@/components/intake/RemortgageFields';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';

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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  
  // Detect edit mode from URL
  const caseId = new URLSearchParams(window.location.search).get('case_id');
  const isEditMode = !!caseId;

  // Fetch existing case data if in edit mode
  const { data: existingCase, isLoading: loadingCase } = useQuery({
    queryKey: ['mortgageCase', caseId],
    queryFn: async () => {
      const cases = await base44.entities.MortgageCase.filter({ id: caseId });
      return cases[0];
    },
    enabled: isEditMode,
    onSuccess: (data) => {
      // Check for edge cases
      if (!data) {
        toast.error('Case not found. Redirecting to dashboard...');
        setTimeout(() => navigate(createPageUrl('Dashboard')), 2000);
        return;
      }
      
      if (data.case_status === 'active') {
        toast.error('This case is already active. Redirecting to case details...');
        setTimeout(() => navigate(createPageUrl(`CaseDetail?id=${caseId}`)), 2000);
        return;
      }
    },
    onError: () => {
      toast.error('Case not found. Redirecting to dashboard...');
      setTimeout(() => navigate(createPageUrl('Dashboard')), 2000);
    }
  });

  // Track which fields came from Asana
  const [asanaFields, setAsanaFields] = useState(new Set());

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
    client_deadline: initialData.client_deadline || '',
    insightly_id: initialData.insightly_id || '',
    internal_introducer: initialData.internal_introducer || '',
    mortgage_broker_appointed: initialData.mortgage_broker_appointed || ''
  });

  const [errors, setErrors] = useState({});
  const [triageFeedback, setTriageFeedback] = useState(null);
  const [isCalculatingTriage, setIsCalculatingTriage] = useState(false);
  const triageTimeoutRef = useRef(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Pre-fill form with existing case data
  useEffect(() => {
    if (existingCase && isEditMode) {
      const fieldsFromAsana = new Set();
      
      // Map case data to form fields and track Asana fields
      const updates = {
        client_name: existingCase.client_name || '',
        client_email: existingCase.client_email || '',
        client_phone: existingCase.client_phone || '',
        referring_team_member: existingCase.referring_team_member || '',
        referring_team: existingCase.referring_team || '',
        property_value: existingCase.property_value || '',
        loan_amount: existingCase.loan_amount || '',
        category: existingCase.category || '',
        purpose: existingCase.purpose || '',
        existing_lender: existingCase.existing_lender || '',
        existing_rate: existingCase.existing_rate || '',
        existing_product_type: existingCase.existing_product_type || '',
        existing_product_end_date: existingCase.existing_product_end_date || '',
        existing_monthly_payment: existingCase.existing_monthly_payment || '',
        switching_reason: existingCase.switching_reason || '',
        annual_income: existingCase.annual_income || '',
        income_type: existingCase.income_type || '',
        client_deadline: existingCase.client_deadline || '',
        asana_task_gid: existingCase.asana_task_gid || '',
        insightly_id: existingCase.insightly_id || '',
        internal_introducer: existingCase.internal_introducer || '',
        mortgage_broker_appointed: existingCase.mortgage_broker_appointed || ''
      };

      // Track fields that came from Asana (have values from webhook)
      if (existingCase.created_from_asana) {
        if (updates.client_name) fieldsFromAsana.add('client_name');
        if (updates.client_email) fieldsFromAsana.add('client_email');
        if (updates.asana_task_gid) fieldsFromAsana.add('asana_task_gid');
        if (updates.insightly_id) fieldsFromAsana.add('insightly_id');
        if (updates.internal_introducer) fieldsFromAsana.add('internal_introducer');
        if (updates.mortgage_broker_appointed) fieldsFromAsana.add('mortgage_broker_appointed');
      }

      setFormData(updates);
      setAsanaFields(fieldsFromAsana);
    }
  }, [existingCase, isEditMode]);

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
    setHasUnsavedChanges(true);
  };

  // Validation functions
  const validateEmail = (email) => {
    if (!email) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? null : 'Please enter a valid email address';
  };

  const validatePhone = (phone) => {
    if (!phone) return null;
    // Accept UK formats: 07123456789, +447123456789, 020 1234 5678, etc.
    const phoneRegex = /^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$|^(\+44\s?[1-9]\d{1,4}|\(?0[1-9]\d{1,4}\)?)\s?\d{3,4}\s?\d{3,4}$/;
    return phoneRegex.test(phone.replace(/\s/g, '')) ? null : 'Please enter a valid UK phone number';
  };

  const validatePositiveNumber = (value, fieldName) => {
    if (!value) return null;
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return 'Must be a positive number';
    }
    return null;
  };

  const validateLoanAmount = () => {
    if (!formData.loan_amount || !formData.property_value) return null;
    const loan = parseFloat(formData.loan_amount);
    const property = parseFloat(formData.property_value);
    if (loan > property) {
      return 'Loan amount cannot exceed property value';
    }
    return null;
  };

  const validateTextField = (value, minLength = 2) => {
    if (!value) return null;
    return value.length >= minLength ? null : `Must be at least ${minLength} characters`;
  };

  const validateDropdown = (value) => {
    return value ? null : 'Please select an option';
  };

  // Field blur validation
  const handleFieldBlur = (fieldName) => {
    let error = null;
    
    switch (fieldName) {
      case 'client_email':
        error = validateEmail(formData.client_email);
        break;
      case 'client_phone':
        error = validatePhone(formData.client_phone);
        break;
      case 'client_name':
        error = validateTextField(formData.client_name);
        break;
      case 'property_value':
      case 'annual_income':
        error = validatePositiveNumber(formData[fieldName], fieldName);
        break;
      case 'loan_amount':
        error = validatePositiveNumber(formData.loan_amount, 'loan_amount') || validateLoanAmount();
        break;
      case 'category':
      case 'purpose':
      case 'income_type':
        error = validateDropdown(formData[fieldName]);
        break;
    }
    
    if (error) {
      setErrors(prev => ({ ...prev, [fieldName]: error }));
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

  const handleSubmit = async () => {
    console.log('[IntakeForm] handleSubmit called');
    
    if (!validateStep(2)) {
      console.log('[IntakeForm] Validation failed');
      return;
    }

    if (!isFormValid()) {
      toast.error('Please fill all required fields correctly');
      return;
    }

    setIsSubmittingForm(true);

    try {
      const ltv = formData.property_value && formData.loan_amount 
        ? (parseFloat(formData.loan_amount) / parseFloat(formData.property_value)) * 100 
        : null;

      const loanToIncomeRatio = formData.loan_amount && formData.annual_income
        ? parseFloat(formData.loan_amount) / parseFloat(formData.annual_income)
        : null;

      const submitData = {
        client_name: formData.client_name,
        client_email: formData.client_email,
        client_phone: formData.client_phone,
        referring_team_member: formData.referring_team_member,
        referring_team: formData.referring_team,
        property_value: parseFloat(formData.property_value) || null,
        loan_amount: parseFloat(formData.loan_amount) || null,
        category: formData.category,
        purpose: formData.purpose,
        existing_lender: formData.existing_lender || null,
        existing_rate: parseFloat(formData.existing_rate) || null,
        existing_product_type: formData.existing_product_type || null,
        existing_product_end_date: formData.existing_product_end_date || null,
        existing_monthly_payment: parseFloat(formData.existing_monthly_payment) || null,
        switching_reason: formData.switching_reason || null,
        annual_income: parseFloat(formData.annual_income) || null,
        income_type: formData.income_type,
        client_deadline: formData.client_deadline || null,
        ltv: ltv ? Math.round(ltv * 10) / 10 : null,
        loan_to_income: loanToIncomeRatio ? Math.round(loanToIncomeRatio * 10) / 10 : null,
        case_status: 'active',
        activated_at: new Date().toISOString()
      };

      if (isEditMode) {
        // Edit mode: update existing case
        console.log('[IntakeForm] Updating case:', caseId);

        await base44.entities.MortgageCase.update(caseId, {
          ...submitData,
          asana_last_synced: new Date().toISOString()
        });

        // Invalidate cache to force dashboard refresh
        queryClient.invalidateQueries({ queryKey: ['mortgageCases'] });

        toast.success(`✅ Case ${existingCase.reference} activated successfully`);
        setHasUnsavedChanges(false);

        // Redirect to dashboard with highlight
        setTimeout(() => {
          navigate(createPageUrl(`Dashboard?highlight=${caseId}`));
        }, 500);
      } else {
        // Create mode: use parent's onSubmit handler
        console.log('[IntakeForm] Creating new case');
        
        if (onSubmit) {
          onSubmit(submitData);
        }
      }
    } catch (error) {
      console.error('[IntakeForm] Failed to save case:', error);
      toast.error('Failed to save case. Please try again.');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const calculateLTV = () => {
    if (formData.property_value && formData.loan_amount) {
      const ltv = (parseFloat(formData.loan_amount) / parseFloat(formData.property_value)) * 100;
      return Math.round(ltv * 10) / 10;
    }
    return null;
  };

  const calculateLoanToIncome = () => {
    if (formData.loan_amount && formData.annual_income) {
      const ratio = parseFloat(formData.loan_amount) / parseFloat(formData.annual_income);
      return Math.round(ratio * 10) / 10;
    }
    return null;
  };

  const ltv = calculateLTV();
  const loanToIncome = calculateLoanToIncome();

  // Real-time validation for loan amount vs property value
  useEffect(() => {
    if (formData.loan_amount && formData.property_value) {
      const error = validateLoanAmount();
      if (error) {
        setErrors(prev => ({ ...prev, loan_amount: error }));
      } else if (errors.loan_amount === 'Loan amount cannot exceed property value') {
        setErrors(prev => ({ ...prev, loan_amount: null }));
      }
    }
  }, [formData.loan_amount, formData.property_value]);

  const stepConfig = [
    { num: 1, label: 'Case Details', icon: Building },
    { num: 2, label: 'Income & Timeline', icon: Banknote }
  ];

  // Show loading state while fetching case
  if (isEditMode && loadingCase) {
    return (
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Loading case details...</p>
        </CardContent>
      </Card>
    );
  }

  // Helper to check if field is from Asana
  const isAsanaField = (fieldName) => asanaFields.has(fieldName);

  // Required fields tracking
  const REQUIRED_FIELDS = [
    { key: 'client_name', label: 'Client Name' },
    { key: 'client_email', label: 'Client Email' },
    { key: 'client_phone', label: 'Client Phone' },
    { key: 'property_value', label: 'Property Value' },
    { key: 'loan_amount', label: 'Loan Amount' },
    { key: 'purpose', label: 'Mortgage Purpose' },
    { key: 'category', label: 'Category' },
    { key: 'annual_income', label: 'Annual Income' },
    { key: 'income_type', label: 'Employment Type' }
  ];

  const isFieldFilled = (fieldKey) => {
    const value = formData[fieldKey];
    return value !== null && value !== undefined && value !== '';
  };

  const getFieldStatus = () => {
    const filled = REQUIRED_FIELDS.filter(f => isFieldFilled(f.key));
    const missing = REQUIRED_FIELDS.filter(f => !isFieldFilled(f.key));
    const percentage = Math.round((filled.length / REQUIRED_FIELDS.length) * 100);
    
    return {
      filled: filled.length,
      total: REQUIRED_FIELDS.length,
      percentage,
      missingFields: missing
    };
  };

  const fieldStatus = getFieldStatus();

  // Check if form is valid for submission
  const isFormValid = () => {
    // All required fields must be filled
    if (fieldStatus.percentage < 100) return false;
    
    // No validation errors
    const hasErrors = Object.values(errors).some(error => error !== null && error !== undefined);
    if (hasErrors) return false;
    
    // Validate all required fields
    const validationErrors = [];
    if (validateEmail(formData.client_email)) validationErrors.push('email');
    if (validatePhone(formData.client_phone)) validationErrors.push('phone');
    if (validateTextField(formData.client_name)) validationErrors.push('name');
    if (validatePositiveNumber(formData.property_value)) validationErrors.push('property');
    if (validatePositiveNumber(formData.loan_amount)) validationErrors.push('loan');
    if (validateLoanAmount()) validationErrors.push('loan_vs_property');
    if (validatePositiveNumber(formData.annual_income)) validationErrors.push('income');
    if (validateDropdown(formData.category)) validationErrors.push('category');
    if (validateDropdown(formData.purpose)) validationErrors.push('purpose');
    if (validateDropdown(formData.income_type)) validationErrors.push('income_type');
    
    return validationErrors.length === 0;
  };

  // Helper to get field class names
  const getFieldClassName = (fieldKey, hasError = false) => {
    if (hasError) return 'border-red-300';
    
    const isFilled = isFieldFilled(fieldKey);
    const isRequired = REQUIRED_FIELDS.some(f => f.key === fieldKey);
    const isFromAsana = isAsanaField(fieldKey);
    
    if (isFromAsana) {
      return 'border-emerald-300 bg-emerald-50/50';
    }
    
    if (isRequired && isEditMode) {
      if (isFilled) {
        return 'border-emerald-500';
      } else {
        return 'border-amber-400 bg-amber-50/30';
      }
    }
    
    return '';
  };

  // Helper to render field label with status icon
  const FieldLabel = ({ htmlFor, children, fieldKey, className = '' }) => {
    const isFilled = isFieldFilled(fieldKey);
    const isRequired = REQUIRED_FIELDS.some(f => f.key === fieldKey);
    const isFromAsana = isAsanaField(fieldKey);

    return (
      <Label htmlFor={htmlFor} className={`flex items-center gap-2 ${className}`}>
        {isRequired && isEditMode && !isFilled && (
          <span className="text-amber-500">⚠️</span>
        )}
        {children}
        {isFromAsana && (
          <Badge className="bg-emerald-100 text-emerald-700 text-xs">✓ From Asana</Badge>
        )}
        {isRequired && isEditMode && isFilled && !isFromAsana && (
          <span className="text-emerald-600 font-semibold">✓</span>
        )}
      </Label>
    );
  };

  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">
          {isEditMode && existingCase 
            ? `Complete Intake for Case ${existingCase.reference}` 
            : 'Create New Mortgage Case'}
        </CardTitle>
        <CardDescription className="text-slate-500">
          {step === 1 ? 'Capture client details from Asana handover' : 'Financial assessment for triage scoring'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Progress Summary - Edit Mode Only */}
        {isEditMode && fieldStatus.percentage < 100 && (
          <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-300">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 mb-1">
                  Complete Required Fields to Activate Case
                </h3>
                <p className="text-sm text-amber-700">
                  Progress: {fieldStatus.filled}/{fieldStatus.total} fields complete
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-300"
                style={{ width: `${fieldStatus.percentage}%` }}
              />
            </div>

            {/* Missing Fields List */}
            {fieldStatus.missingFields.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-amber-800 mb-2">Missing:</p>
                <div className="grid grid-cols-2 gap-1">
                  {fieldStatus.missingFields.map(field => (
                    <div key={field.key} className="text-xs text-amber-700 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-amber-600" />
                      {field.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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
                <FieldLabel htmlFor="client_name" fieldKey="client_name">
                  Client Name (from Asana/handover)
                </FieldLabel>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => updateField('client_name', e.target.value)}
                  onBlur={() => handleFieldBlur('client_name')}
                  placeholder="Full name"
                  className={getFieldClassName('client_name', errors.client_name)}
                  aria-required="true"
                  aria-invalid={!!errors.client_name}
                />
                {errors.client_name && (
                  <p className="text-xs text-red-500">{errors.client_name}</p>
                )}
                {!isFieldFilled('client_name') && !errors.client_name && isEditMode && (
                  <p className="text-xs text-amber-600">Required to activate case</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FieldLabel htmlFor="client_email" fieldKey="client_email">
                    Email Address
                  </FieldLabel>
                  <Input
                    id="client_email"
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => updateField('client_email', e.target.value)}
                    onBlur={() => handleFieldBlur('client_email')}
                    placeholder="email@example.com"
                    className={getFieldClassName('client_email', errors.client_email)}
                    aria-required="true"
                    aria-invalid={!!errors.client_email}
                  />
                  {errors.client_email && (
                    <p className="text-xs text-red-500">{errors.client_email}</p>
                  )}
                  {!isFieldFilled('client_email') && isEditMode && (
                    <p className="text-xs text-amber-600">Required to activate case</p>
                  )}
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="client_phone" fieldKey="client_phone">
                    Phone Number
                  </FieldLabel>
                  <Input
                    id="client_phone"
                    value={formData.client_phone}
                    onChange={(e) => updateField('client_phone', e.target.value)}
                    onBlur={() => handleFieldBlur('client_phone')}
                    placeholder="+44 ..."
                    className={getFieldClassName('client_phone', errors.client_phone)}
                    aria-required="true"
                    aria-invalid={!!errors.client_phone}
                  />
                  {errors.client_phone && (
                    <p className="text-xs text-red-500">{errors.client_phone}</p>
                  )}
                  {!isFieldFilled('client_phone') && isEditMode && (
                    <p className="text-xs text-amber-600">Required to activate case</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="asana_task_gid" className="flex items-center gap-2">
                  Asana Task ID
                  {isAsanaField('asana_task_gid') && (
                    <Badge className="bg-emerald-100 text-emerald-700 text-xs">✓ From Asana</Badge>
                  )}
                </Label>
                <Input
                  id="asana_task_gid"
                  value={formData.asana_task_gid}
                  onChange={(e) => updateField('asana_task_gid', e.target.value)}
                  placeholder="e.g., 1234567890 (optional)"
                  disabled={isAsanaField('asana_task_gid')}
                  className={`${errors.asana_task_gid ? 'border-red-300' : ''} ${
                    isAsanaField('asana_task_gid') ? 'border-emerald-300 bg-emerald-50/50 cursor-not-allowed opacity-80' : ''
                  }`}
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
                  <FieldLabel htmlFor="property_value" fieldKey="property_value">
                    Property Value (£)
                  </FieldLabel>
                  <Input
                    id="property_value"
                    type="number"
                    value={formData.property_value}
                    onChange={(e) => updateField('property_value', e.target.value)}
                    onBlur={() => handleFieldBlur('property_value')}
                    placeholder="e.g., 500000"
                    className={getFieldClassName('property_value', errors.property_value)}
                    aria-required="true"
                    aria-invalid={!!errors.property_value}
                  />
                  {errors.property_value && (
                    <p className="text-xs text-red-500">{errors.property_value}</p>
                  )}
                  {!isFieldFilled('property_value') && !errors.property_value && isEditMode && (
                    <p className="text-xs text-amber-600">Required to activate case</p>
                  )}
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="loan_amount" fieldKey="loan_amount">
                    Loan Amount (£)
                  </FieldLabel>
                  <Input
                    id="loan_amount"
                    type="number"
                    value={formData.loan_amount}
                    onChange={(e) => updateField('loan_amount', e.target.value)}
                    onBlur={() => handleFieldBlur('loan_amount')}
                    placeholder="e.g., 375000"
                    className={getFieldClassName('loan_amount', errors.loan_amount)}
                    aria-required="true"
                    aria-invalid={!!errors.loan_amount}
                  />
                  {errors.loan_amount && (
                    <p className="text-xs text-red-500">{errors.loan_amount}</p>
                  )}
                  {!isFieldFilled('loan_amount') && !errors.loan_amount && isEditMode && (
                    <p className="text-xs text-amber-600">Required to activate case</p>
                  )}
                </div>
              </div>

              {/* Derived Fields Display */}
              {(ltv || loanToIncome) && (
                <div className="grid grid-cols-2 gap-4">
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
                  {loanToIncome && (
                    <div className={`p-4 rounded-xl border ${
                      loanToIncome <= 4.5 ? 'bg-emerald-50 border-emerald-200' :
                      loanToIncome <= 5.5 ? 'bg-amber-50 border-amber-200' :
                      'bg-orange-50 border-orange-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Loan-to-Income</span>
                        <span className={`text-lg font-bold ${
                          loanToIncome <= 4.5 ? 'text-emerald-600' :
                          loanToIncome <= 5.5 ? 'text-amber-600' :
                          'text-orange-600'
                        }`}>{loanToIncome}x</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FieldLabel fieldKey="category">
                    Category
                  </FieldLabel>
                  <Select 
                    value={formData.category} 
                    onValueChange={(v) => {
                      updateField('category', v);
                      setTimeout(() => handleFieldBlur('category'), 0);
                    }}
                  >
                    <SelectTrigger className={getFieldClassName('category', errors.category)}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
                  {!isFieldFilled('category') && !errors.category && isEditMode && (
                    <p className="text-xs text-amber-600">Required to activate case</p>
                  )}
                </div>

                <div className="space-y-2">
                  <FieldLabel fieldKey="purpose">
                    Purpose
                  </FieldLabel>
                  <Select 
                    value={formData.purpose} 
                    onValueChange={(v) => {
                      updateField('purpose', v);
                      setTimeout(() => handleFieldBlur('purpose'), 0);
                    }}
                  >
                    <SelectTrigger className={getFieldClassName('purpose', errors.purpose)}>
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      {PURPOSES.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.purpose && <p className="text-xs text-red-500">{errors.purpose}</p>}
                  {!isFieldFilled('purpose') && !errors.purpose && isEditMode && (
                    <p className="text-xs text-amber-600">Required to activate case</p>
                  )}
                </div>
              </div>

              {/* Conditional Remortgage Fields */}
              {(formData.purpose === 'remortgage' || formData.purpose === 'rate_expiry') && (
                <div className="border-t pt-4 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700">Current Mortgage Details</h3>
                  <RemortgageFields formData={formData} updateField={updateField} />
                </div>
              )}

              {/* Read-only Asana metadata (Step 5 fields) */}
              {isEditMode && (formData.insightly_id || formData.internal_introducer || formData.mortgage_broker_appointed) && (
                <div className="border-t pt-4 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700">Asana Metadata (Read-Only)</h3>
                  
                  {formData.insightly_id && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        Insightly ID
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs">✓ From Asana</Badge>
                      </Label>
                      <Input
                        value={formData.insightly_id}
                        disabled
                        className="border-emerald-300 bg-emerald-50/50 cursor-not-allowed opacity-80"
                      />
                    </div>
                  )}

                  {formData.internal_introducer && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        Internal Introducer
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs">✓ From Asana</Badge>
                      </Label>
                      <Input
                        value={formData.internal_introducer}
                        disabled
                        className="border-emerald-300 bg-emerald-50/50 cursor-not-allowed opacity-80"
                      />
                    </div>
                  )}

                  {formData.mortgage_broker_appointed && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        Mortgage Broker Appointed
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs">✓ From Asana</Badge>
                      </Label>
                      <Input
                        value={formData.mortgage_broker_appointed}
                        disabled
                        className="border-emerald-300 bg-emerald-50/50 cursor-not-allowed opacity-80"
                      />
                    </div>
                  )}
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
                <FieldLabel htmlFor="annual_income" fieldKey="annual_income">
                  Annual Income (£)
                </FieldLabel>
                <Input
                  id="annual_income"
                  type="number"
                  value={formData.annual_income}
                  onChange={(e) => updateField('annual_income', e.target.value)}
                  onBlur={() => handleFieldBlur('annual_income')}
                  placeholder="Gross annual income"
                  className={getFieldClassName('annual_income', errors.annual_income)}
                  aria-required="true"
                  aria-invalid={!!errors.annual_income}
                />
                <p className="text-xs text-slate-500">From adviser's fact-find or estimated</p>
                {errors.annual_income && (
                  <p className="text-xs text-red-500">{errors.annual_income}</p>
                )}
                {!isFieldFilled('annual_income') && !errors.annual_income && isEditMode && (
                  <p className="text-xs text-amber-600">Required to activate case</p>
                )}
              </div>

              <div className="space-y-2">
                <FieldLabel fieldKey="income_type">
                  Employment Type
                </FieldLabel>
                <Select 
                  value={formData.income_type} 
                  onValueChange={(v) => {
                    updateField('income_type', v);
                    setTimeout(() => handleFieldBlur('income_type'), 0);
                  }}
                >
                  <SelectTrigger className={getFieldClassName('income_type', errors.income_type)}>
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.income_type && <p className="text-xs text-red-500">{errors.income_type}</p>}
                {!isFieldFilled('income_type') && !errors.income_type && isEditMode && (
                  <p className="text-xs text-amber-600">Required to activate case</p>
                )}
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
            <div className="relative">
              <Button 
                type="button"
                onClick={() => {
                  console.log('[IntakeForm] Button clicked');
                  handleSubmit();
                }} 
                disabled={isSubmittingForm || !isFormValid()}
                style={{
                  backgroundColor: isEditMode ? '#F59E0B' : '#2563EB',
                  color: 'white',
                  fontWeight: 600,
                  padding: '12px 24px',
                  borderRadius: '8px',
                  opacity: (isSubmittingForm || !isFormValid()) ? 0.6 : 1,
                  cursor: (isSubmittingForm || !isFormValid()) ? 'not-allowed' : 'pointer'
                }}
                className={isEditMode ? 'hover:opacity-90' : 'hover:opacity-90'}
                title={!isFormValid() ? 'Fill all required fields to continue' : ''}
              >
                {isSubmittingForm ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEditMode ? 'Activating Case...' : 'Creating Case...'}
                  </>
                ) : (
                  <>
                    {isEditMode ? 'Activate Case' : 'Create Case'}
                  </>
                )}
              </Button>
              {!isFormValid() && !isSubmitting && (
                <p className="text-xs text-slate-500 mt-2 text-right">
                  Fill all required fields to continue
                </p>
              )}
            </div>
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