import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
// Using custom portal card styles instead of Card component
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import PortalLayout from './PortalLayout';

const businessTypes = [
  { value: 'nursery', label: 'Nursery / Garden Center' },
  { value: 'landscaping', label: 'Landscaping Company' },
  { value: 'farm', label: 'Farm / Agriculture' },
  { value: 'cannabis', label: 'Cannabis Cultivation' },
  { value: 'vineyard', label: 'Vineyard / Winery' },
  { value: 'golf', label: 'Golf Course' },
  { value: 'municipal', label: 'Municipal / Government' },
  { value: 'other', label: 'Other' },
];

const paymentMethods = [
  { value: 'check', label: 'Check' },
  { value: 'ach', label: 'ACH / Wire Transfer' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'cash', label: 'Cash' },
];

const paymentTerms = [
  { value: 'cod', label: 'COD (Cash on Delivery)' },
  { value: 'net15', label: 'Net 15' },
  { value: 'net30', label: 'Net 30' },
  { value: 'prepay', label: 'Prepay' },
];

interface CreditRef {
  company_name: string;
  contact_name: string;
  phone: string;
  email: string;
}

const emptyCreditRef = (): CreditRef => ({ company_name: '', contact_name: '', phone: '', email: '' });

const CreditApplication = () => {
  const { user, token } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingApp, setExistingApp] = useState<any>(null);

  const [form, setForm] = useState({
    legal_entity_name: '',
    dba_name: '',
    ein_tax_id: '',
    business_type: '',
    years_in_business: '',
    ops_contact_name: '',
    ops_contact_title: '',
    ops_contact_email: '',
    ops_contact_phone: '',
    ap_contact_name: '',
    ap_contact_title: '',
    ap_contact_email: '',
    ap_contact_phone: '',
    preferred_payment_method: '',
    preferred_payment_terms: '',
    has_forklift: 'no',
    delivery_instructions: '',
  });
  const [creditRefs, setCreditRefs] = useState<CreditRef[]>([emptyCreditRef()]);

  useEffect(() => {
    const fetchApp = async () => {
      try {
        const res = await fetch('/api/portal/application', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.application && data.application.status !== 'none') {
            setExistingApp(data.application);
            if (data.application.status === 'submitted' || data.application.status === 'approved') {
              navigate('/portal');
              return;
            }
            // Pre-fill from existing draft
            const a = data.application;
            setForm({
              legal_entity_name: a.legal_entity_name || '',
              dba_name: a.dba_name || '',
              ein_tax_id: a.ein_tax_id || '',
              business_type: a.business_type || '',
              years_in_business: a.years_in_business?.toString() || '',
              ops_contact_name: a.ops_contact_name || '',
              ops_contact_title: a.ops_contact_title || '',
              ops_contact_email: a.ops_contact_email || '',
              ops_contact_phone: a.ops_contact_phone || '',
              ap_contact_name: a.ap_contact_name || '',
              ap_contact_title: a.ap_contact_title || '',
              ap_contact_email: a.ap_contact_email || '',
              ap_contact_phone: a.ap_contact_phone || '',
              preferred_payment_method: a.preferred_payment_method || '',
              preferred_payment_terms: a.preferred_payment_terms || '',
              has_forklift: a.has_forklift ? 'yes' : 'no',
              delivery_instructions: a.delivery_instructions || '',
            });
            if (a.credit_references?.length) setCreditRefs(a.credit_references);
          }
        }
      } catch (err) {
        console.error('Failed to fetch application:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchApp();
  }, [token]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateCreditRef = (index: number, field: keyof CreditRef, value: string) => {
    setCreditRefs((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addCreditRef = () => {
    if (creditRefs.length < 3) setCreditRefs((prev) => [...prev, emptyCreditRef()]);
  };

  const removeCreditRef = (index: number) => {
    if (creditRefs.length > 1) setCreditRefs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.legal_entity_name || !form.business_type || !form.ops_contact_name || !form.ops_contact_email || !form.ops_contact_phone) {
      toast({ variant: 'destructive', title: 'Missing required fields', description: 'Please fill out all required fields.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/portal/application', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          years_in_business: form.years_in_business ? parseInt(form.years_in_business) : null,
          has_forklift: form.has_forklift === 'yes',
          credit_references: creditRefs.filter((r) => r.company_name),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit application');
      }

      toast({ title: 'Application Submitted', description: 'We will review your application and get back to you soon.' });
      navigate('/portal');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err instanceof Error ? err.message : 'Something went wrong' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="space-y-5 pb-20">
        <div>
          <h1 className="text-2xl font-heading font-bold">Wholesale Application</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete this form so we can set up your wholesale account. Takes about 3 minutes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Business Info */}
          <div className="rounded-xl bg-white/70 border border-primary/10 shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <h2 className="font-heading font-bold text-sm">Business Information</h2>
            </div>
            <div className="px-5 pb-5 space-y-4">
              <div>
                <Label htmlFor="legal_entity_name" className="text-xs">Legal Business Name *</Label>
                <Input id="legal_entity_name" value={form.legal_entity_name} onChange={(e) => updateField('legal_entity_name', e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="dba_name" className="text-xs">DBA / Trade Name</Label>
                <Input id="dba_name" value={form.dba_name} onChange={(e) => updateField('dba_name', e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ein_tax_id" className="text-xs">EIN / Tax ID</Label>
                  <Input id="ein_tax_id" value={form.ein_tax_id} onChange={(e) => updateField('ein_tax_id', e.target.value)} placeholder="XX-XXXXXXX" />
                </div>
                <div>
                  <Label htmlFor="years_in_business" className="text-xs">Years in Business</Label>
                  <Input id="years_in_business" type="number" min="0" value={form.years_in_business} onChange={(e) => updateField('years_in_business', e.target.value)} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Business Type *</Label>
                <Select value={form.business_type} onValueChange={(v) => updateField('business_type', v)}>
                  <SelectTrigger><SelectValue placeholder="Select business type" /></SelectTrigger>
                  <SelectContent>
                    {businessTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Operations Contact */}
          <div className="rounded-xl bg-white/70 border border-primary/10 shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-1">
              <h2 className="font-heading font-bold text-sm">Operations Contact *</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Who should we contact about orders and deliveries?</p>
            </div>
            <div className="px-5 pb-5 pt-3 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Name *</Label>
                  <Input value={form.ops_contact_name} onChange={(e) => updateField('ops_contact_name', e.target.value)} required />
                </div>
                <div>
                  <Label className="text-xs">Title</Label>
                  <Input value={form.ops_contact_title} onChange={(e) => updateField('ops_contact_title', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Email *</Label>
                  <Input type="email" value={form.ops_contact_email} onChange={(e) => updateField('ops_contact_email', e.target.value)} required />
                </div>
                <div>
                  <Label className="text-xs">Phone *</Label>
                  <Input type="tel" value={form.ops_contact_phone} onChange={(e) => updateField('ops_contact_phone', e.target.value)} required />
                </div>
              </div>
            </div>
          </div>

          {/* AP Contact */}
          <div className="rounded-xl bg-white/70 border border-primary/10 shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-1">
              <h2 className="font-heading font-bold text-sm">Accounts Payable Contact</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Who handles invoices and payments? (Leave blank if same as above)</p>
            </div>
            <div className="px-5 pb-5 pt-3 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Name</Label>
                  <Input value={form.ap_contact_name} onChange={(e) => updateField('ap_contact_name', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Title</Label>
                  <Input value={form.ap_contact_title} onChange={(e) => updateField('ap_contact_title', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input type="email" value={form.ap_contact_email} onChange={(e) => updateField('ap_contact_email', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input type="tel" value={form.ap_contact_phone} onChange={(e) => updateField('ap_contact_phone', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Preferences */}
          <div className="rounded-xl bg-white/70 border border-primary/10 shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <h2 className="font-heading font-bold text-sm">Payment Preferences</h2>
            </div>
            <div className="px-5 pb-5 space-y-4">
              <div>
                <Label className="text-xs">Preferred Payment Method</Label>
                <Select value={form.preferred_payment_method} onValueChange={(v) => updateField('preferred_payment_method', v)}>
                  <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Preferred Payment Terms</Label>
                <Select value={form.preferred_payment_terms} onValueChange={(v) => updateField('preferred_payment_terms', v)}>
                  <SelectTrigger><SelectValue placeholder="Select terms" /></SelectTrigger>
                  <SelectContent>
                    {paymentTerms.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Shipping & Delivery */}
          <div className="rounded-xl bg-white/70 border border-primary/10 shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <h2 className="font-heading font-bold text-sm">Shipping & Delivery</h2>
            </div>
            <div className="px-5 pb-5 space-y-4">
              <div>
                <Label className="text-xs">Do you have a forklift on site?</Label>
                <RadioGroup value={form.has_forklift} onValueChange={(v) => updateField('has_forklift', v)} className="flex gap-4 mt-2">
                  <div className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${form.has_forklift === 'yes' ? 'border-primary/30 bg-primary/5' : 'border-primary/8'}`}>
                    <RadioGroupItem value="yes" id="forklift-yes" />
                    <Label htmlFor="forklift-yes" className="cursor-pointer text-sm">Yes</Label>
                  </div>
                  <div className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${form.has_forklift === 'no' ? 'border-primary/30 bg-primary/5' : 'border-primary/8'}`}>
                    <RadioGroupItem value="no" id="forklift-no" />
                    <Label htmlFor="forklift-no" className="cursor-pointer text-sm">No</Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label className="text-xs">Delivery Instructions</Label>
                <Textarea
                  value={form.delivery_instructions}
                  onChange={(e) => updateField('delivery_instructions', e.target.value)}
                  placeholder="Gate codes, dock hours, special requirements..."
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Credit References */}
          <div className="rounded-xl bg-white/70 border border-primary/10 shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-1">
              <h2 className="font-heading font-bold text-sm">Credit References</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Provide up to 3 trade references (optional, speeds up approval)</p>
            </div>
            <div className="px-5 pb-5 pt-3 space-y-4">
              {creditRefs.map((ref, i) => (
                <div key={i} className="border border-primary/8 rounded-lg p-4 space-y-3 bg-white/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-heading font-semibold text-muted-foreground">Reference {i + 1}</span>
                    {creditRefs.length > 1 && (
                      <button type="button" onClick={() => removeCreditRef(i)} className="text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Company Name</Label>
                      <Input value={ref.company_name} onChange={(e) => updateCreditRef(i, 'company_name', e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Contact Name</Label>
                      <Input value={ref.contact_name} onChange={(e) => updateCreditRef(i, 'contact_name', e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Phone</Label>
                      <Input type="tel" value={ref.phone} onChange={(e) => updateCreditRef(i, 'phone', e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Email</Label>
                      <Input type="email" value={ref.email} onChange={(e) => updateCreditRef(i, 'email', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
              {creditRefs.length < 3 && (
                <Button type="button" variant="outline" size="sm" onClick={addCreditRef} className="text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Reference
                </Button>
              )}
            </div>
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full shadow-md hover:shadow-lg transition-shadow" size="lg" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...
              </>
            ) : (
              'Submit Application'
            )}
          </Button>
        </form>
      </div>
    </PortalLayout>
  );
};

export default CreditApplication;
