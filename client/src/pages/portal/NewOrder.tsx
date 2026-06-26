import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useQuoteCart } from '@/contexts/QuoteCartContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ShoppingCart, Trash2, Plus, Minus, AlertCircle, Zap, Clock } from 'lucide-react';
import PortalLayout from './PortalLayout';
import { HOURS_LABEL, PICKUP_SLOTS } from '@shared/pickupSchedule.js';

const DEFAULT_SLOT_LABELS = PICKUP_SLOTS.map((s) => s.label);

interface SchedulingData {
  earliest_date: string;
  available_dates: string[];
  max_lead_days: number;
  all_yard_available: boolean;
  has_yard_items: boolean;
  products: { slug: string; name: string; is_yard_available: boolean; pickup_lead_days: number }[];
}

const NewOrder = () => {
  const { token } = useAuth();
  const { items, totalPrice, removeItem, updateQuantity, clearCart } = useQuoteCart();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [applicationOk, setApplicationOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const [fulfillment, setFulfillment] = useState<'pickup' | 'delivery'>('pickup');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTimeStart, setPreferredTimeStart] = useState('');
  const [preferredTimeEnd, setPreferredTimeEnd] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState({ street: '', city: '', state: 'AZ', zip: '' });
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [smsOptIn, setSmsOptIn] = useState(false);

  // Smart scheduling state
  const [scheduling, setScheduling] = useState<SchedulingData | null>(null);
  const [schedulingLoading, setSchedulingLoading] = useState(false);
  const [timeSlots, setTimeSlots] = useState<{ time: string; available: boolean }[]>([]);

  // Check application status
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/portal/application', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const status = data.application?.status;
          setApplicationOk(status && status !== 'none' && status !== 'rejected');
        }
      } catch {
        setApplicationOk(false);
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [token]);

  // Fetch scheduling when cart items change
  useEffect(() => {
    if (items.length === 0) {
      setScheduling(null);
      return;
    }

    const fetchScheduling = async () => {
      setSchedulingLoading(true);
      try {
        const res = await fetch('/api/portal/scheduling/available-dates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_slugs: items.map(i => i.productSlug) }),
        });
        if (res.ok) {
          const data = await res.json();
          setScheduling(data);
          // Auto-select earliest date if none selected
          if (!preferredDate && data.earliest_date) {
            setPreferredDate(data.earliest_date);
          }
        }
      } catch (err) {
        console.error('Scheduling fetch error:', err);
      } finally {
        setSchedulingLoading(false);
      }
    };

    fetchScheduling();
  }, [items.map(i => i.productSlug).join(',')]);

  // Fetch time slots when date changes
  useEffect(() => {
    if (!preferredDate) {
      setTimeSlots([]);
      return;
    }
    const fetchSlots = async () => {
      try {
        const res = await fetch('/api/portal/scheduling/time-slots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: preferredDate }),
        });
        if (res.ok) {
          const data = await res.json();
          setTimeSlots(data.slots || []);
        }
      } catch (err) {
        console.error('Time slots fetch error:', err);
      }
    };
    fetchSlots();
  }, [preferredDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast({ variant: 'destructive', title: 'Cart is empty', description: 'Add products before placing an order.' });
      return;
    }

    if (!preferredDate) {
      toast({ variant: 'destructive', title: 'Date required', description: 'Please select a preferred date.' });
      return;
    }

    if (fulfillment === 'delivery' && (!deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.zip)) {
      toast({ variant: 'destructive', title: 'Address required', description: 'Please enter a delivery address.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/portal/orders', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            product_name: item.productName,
            product_slug: item.productSlug,
            format: item.format,
            quantity: item.quantity,
            unit_price: item.unitPrice,
          })),
          fulfillment_type: fulfillment,
          preferred_date: preferredDate,
          preferred_time_start: preferredTimeStart || null,
          preferred_time_end: preferredTimeEnd || null,
          delivery_address: fulfillment === 'delivery' ? deliveryAddress : null,
          special_instructions: specialInstructions || null,
          sms_opt_in: smsOptIn,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit order');
      }

      const data = await res.json();
      clearCart();
      toast({ title: 'Order Submitted', description: `Order #${data.order.order_number} placed successfully.` });
      navigate(`/portal/orders/${data.order.id}`);
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

  if (!applicationOk) {
    return (
      <PortalLayout>
        <div className="space-y-6 py-8 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
          <h2 className="text-xl font-semibold">Application Required</h2>
          <p className="text-gray-600">You need to complete your wholesale application before placing orders.</p>
          <Link href="/portal/application">
            <Button>Complete Application</Button>
          </Link>
        </div>
      </PortalLayout>
    );
  }

  const availableTimeSlots = timeSlots.filter(s => s.available).map(s => s.time);

  return (
    <PortalLayout>
      <form onSubmit={handleSubmit} className="space-y-5 pb-20">
        <h1 className="text-2xl font-heading font-bold">New Order</h1>

        {/* Cart Items */}
        <div className="rounded-xl bg-white/70 border border-primary/10 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <h2 className="font-heading font-bold text-sm flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" /> Cart ({items.length} item{items.length !== 1 ? 's' : ''})
            </h2>
            <Link href="/products">
              <Button variant="outline" size="sm" className="text-xs h-8">Browse Products</Button>
            </Link>
          </div>
          <div className="px-5 pb-5">
            {items.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Your cart is empty.</p>
                <Link href="/products">
                  <Button variant="link" size="sm" className="mt-1">Add products</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {items.map((item) => {
                  const prodInfo = scheduling?.products?.find(p => p.slug === item.productSlug);
                  return (
                    <div key={`${item.productId}-${item.format}`} className="flex items-center gap-3 p-3 border border-primary/8 rounded-lg bg-white/50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-sm truncate">{item.productName}</p>
                          {prodInfo?.is_yard_available && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-green-300 text-green-700 bg-green-50 shrink-0">
                              <Zap className="h-2.5 w-2.5 mr-0.5" />Quick Pickup
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{item.format}</p>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button type="button" onClick={() => updateQuantity(item.productId, item.format, item.quantity - 1)} className="p-1.5 rounded-md hover:bg-primary/5 transition-colors touch-manipulation">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-heading font-bold">{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.productId, item.format, item.quantity + 1)} className="p-1.5 rounded-md hover:bg-primary/5 transition-colors touch-manipulation">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-sm font-heading font-bold w-20 text-right">
                        ${(item.unitPrice * item.quantity).toLocaleString()}
                      </p>
                      <button type="button" onClick={() => removeItem(item.productId, item.format)} className="text-red-400 hover:text-red-600 p-1 transition-colors touch-manipulation">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
                <div className="flex justify-between items-center pt-3 border-t border-primary/10">
                  <span className="font-heading font-bold text-sm">Estimated Total</span>
                  <span className="font-heading font-bold text-lg text-primary">${totalPrice.toLocaleString()}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Final pricing confirmed upon order approval. Tax and delivery fees may apply.</p>
              </div>
            )}
          </div>
        </div>

        {/* Fulfillment */}
        <div className="rounded-xl bg-white/70 border border-primary/10 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <h2 className="font-heading font-bold text-sm">Fulfillment</h2>
          </div>
          <div className="px-5 pb-5 space-y-4">
            <RadioGroup value={fulfillment} onValueChange={(v) => setFulfillment(v as 'pickup' | 'delivery')} className="grid grid-cols-2 gap-3">
              <div className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${fulfillment === 'pickup' ? 'border-primary/30 bg-primary/5' : 'border-primary/8 hover:border-primary/15'}`}>
                <RadioGroupItem value="pickup" id="pickup" />
                <Label htmlFor="pickup" className="cursor-pointer font-medium text-sm">Pickup</Label>
              </div>
              <div className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${fulfillment === 'delivery' ? 'border-primary/30 bg-primary/5' : 'border-primary/8 hover:border-primary/15'}`}>
                <RadioGroupItem value="delivery" id="delivery" />
                <Label htmlFor="delivery" className="cursor-pointer font-medium text-sm">Delivery</Label>
              </div>
            </RadioGroup>

            {fulfillment === 'pickup' && (
              <div className="rounded-lg bg-primary/5 border border-primary/10 p-3.5">
                <p className="text-sm text-foreground/80">
                  <strong>1634 N 19th Ave, Phoenix, AZ 85009</strong><br />
                  <span className="text-muted-foreground text-xs">{HOURS_LABEL}</span>
                </p>
              </div>
            )}

            {fulfillment === 'delivery' && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Street Address *</Label>
                  <Input value={deliveryAddress.street} onChange={(e) => setDeliveryAddress({ ...deliveryAddress, street: e.target.value })} required className="min-h-[44px]" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">City *</Label>
                    <Input value={deliveryAddress.city} onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })} required className="min-h-[44px]" />
                  </div>
                  <div>
                    <Label className="text-xs">State</Label>
                    <Input value={deliveryAddress.state} onChange={(e) => setDeliveryAddress({ ...deliveryAddress, state: e.target.value })} className="min-h-[44px]" />
                  </div>
                  <div>
                    <Label className="text-xs">ZIP *</Label>
                    <Input value={deliveryAddress.zip} onChange={(e) => setDeliveryAddress({ ...deliveryAddress, zip: e.target.value })} required className="min-h-[44px]" />
                  </div>
                </div>
              </div>
            )}

            {/* Smart Scheduling */}
            <div>
              <Label className="text-xs">Preferred Date *</Label>
              {schedulingLoading ? (
                <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Checking availability...
                </div>
              ) : scheduling ? (
                <>
                  <Input
                    type="date"
                    min={scheduling.earliest_date}
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    required
                    className="min-h-[44px]"
                  />
                  <div className="mt-1.5 flex items-center gap-1.5">
                    {scheduling.all_yard_available ? (
                      <span className="text-[11px] text-green-700 flex items-center gap-1">
                        <Zap className="h-3 w-3" /> All items in stock, earliest pickup: {new Date(scheduling.earliest_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Made to order, earliest: {new Date(scheduling.earliest_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} ({scheduling.max_lead_days} business day{scheduling.max_lead_days !== 1 ? 's' : ''})
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Input
                    type="date"
                    min={new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]}
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    required
                    className="min-h-[44px]"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Pickup available Tue-Sat only.</p>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Earliest Time</Label>
                <Select value={preferredTimeStart} onValueChange={setPreferredTimeStart}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    {(availableTimeSlots.length > 0 ? availableTimeSlots : DEFAULT_SLOT_LABELS).map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Latest Time</Label>
                <Select value={preferredTimeEnd} onValueChange={setPreferredTimeEnd}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    {(availableTimeSlots.length > 0 ? availableTimeSlots : DEFAULT_SLOT_LABELS).map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Special Instructions */}
        <div className="rounded-xl bg-white/70 border border-primary/10 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <h2 className="font-heading font-bold text-sm">Special Instructions</h2>
          </div>
          <div className="px-5 pb-5 space-y-4">
            <Textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any special requests, gate codes, loading dock requirements..."
              className="resize-none"
              rows={3}
            />
            <div className="flex items-start gap-2">
              <Checkbox
                id="sms-opt-in"
                checked={smsOptIn}
                onCheckedChange={(checked) => setSmsOptIn(checked === true)}
              />
              <Label htmlFor="sms-opt-in" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                Send me text message updates about my order status (pickup ready, delivery updates)
              </Label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <Button type="submit" className="w-full shadow-md hover:shadow-lg transition-shadow min-h-[48px] touch-manipulation" size="lg" disabled={submitting || items.length === 0}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Placing Order...
            </>
          ) : (
            `Place Order${totalPrice > 0 ? ` \u2014 $${totalPrice.toLocaleString()}` : ''}`
          )}
        </Button>
      </form>
    </PortalLayout>
  );
};

export default NewOrder;
