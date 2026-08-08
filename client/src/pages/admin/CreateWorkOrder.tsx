import { useState, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { ArrowLeft, ArrowRight, ClipboardList, Package, Truck, Check, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import OperationsLayout from '@/components/admin/OperationsLayout';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';

export interface WorkOrderLineItem {
  id: string;
  productType: 'standard' | 'custom';
  productName: string;
  productId: string;
  airtableProductId: string;
  ingredientRatios: string;
  ingredientsList: string;
  customNotes: string;
  sizeCategory: string;
  sizeCategoryName: string;
  unitsPerPallet: number | null;
  estimatedPalletWeight: string;
  quantity: number;
  quantityType: 'pallet' | 'unit';
  mixingGuidelines: string;
  totalWeightLbs: number;
}

const ORDER_TYPES = [
  { value: 'amazon', label: 'Amazon Fulfillment', description: 'FBA prep & ship' },
  { value: 'local', label: 'Local Sales', description: 'Retail & direct customers' },
  { value: 'wholesale', label: 'Wholesale', description: 'B2B & distributor orders' },
  { value: 'bulk', label: 'Bulk Blend (Loose)', description: 'Unbagged material' },
];

const PREDEFINED_LOCATIONS = [
  { id: 'phoenix-dc', name: 'SSW Phoenix Distribution Center', address: '1634 North 19th Avenue', city: 'Phoenix', state: 'AZ', zip: '85009' },
  { id: 'congress-hq', name: 'SSW Congress HQ (Origin)', address: '18980 Stanton Rd', city: 'Congress', state: 'AZ', zip: '85332' },
  { id: 'custom', name: 'Custom Address', address: '', city: '', state: 'AZ', zip: '' },
];

const MAIN_SIZE_CATEGORIES = [
  { code: '9lb', name: '9 lb Bag (Pallet)', unitsPerPallet: 144, estimatedPalletWeight: '1,296 lbs', image: '/size-categories/9lb-pallet.jpg' },
  { code: '7.5qt', name: '7.5 Quart Bag (Pallet)', unitsPerPallet: 144, estimatedPalletWeight: '1,000 lbs', image: '/size-categories/7.5qt-pallet.jpg' },
  { code: '1cf', name: '1 CF Bag (Pallet)', unitsPerPallet: 50, estimatedPalletWeight: '1,250 lbs', image: '/size-categories/1cf-pallet.jpg' },
  { code: '1.5cf', name: '1.5 CF Bag (Pallet)', unitsPerPallet: 30, estimatedPalletWeight: '1,500 lbs', image: '/size-categories/1cf-pallet.jpg' },
  { code: '2cf', name: '2 CF Bag (Pallet)', unitsPerPallet: 25, estimatedPalletWeight: '1,500 lbs', image: '/size-categories/2cf-pallet.jpg' },
  { code: 'tote', name: 'Tote / Super Sack (2.2 CY)', unitsPerPallet: 1, estimatedPalletWeight: '2,000 lbs', image: '/size-categories/tote.jpg' },
  { code: 'bulk', name: 'Bulk (Cubic Yards)', unitsPerPallet: null, estimatedPalletWeight: null, image: '/size-categories/bulk.jpg' },
  { code: 'other', name: 'Other / Custom', unitsPerPallet: null, estimatedPalletWeight: null, image: null },
];

const VISIBLE_SIZE_CATEGORIES = MAIN_SIZE_CATEGORIES.filter((c) => c.code !== 'other');
const SIZE_IMAGE_FALLBACKS: Record<string, string[]> = {
  '9lb': ['/size-categories/9lb-pallet.jpg', '/size-categories/9lb-pallet.png'],
  '7.5qt': ['/size-categories/7.5qt-pallet.jpg', '/size-categories/7.5qt-pallet.png'],
  '1cf': ['/size-categories/1cf-pallet.jpg', '/size-categories/1cf-pallet.png'],
  '1.5cf': ['/size-categories/1cf-pallet.jpg', '/size-categories/1cf-pallet.png'],
  '2cf': ['/size-categories/2cf-pallet.jpg', '/size-categories/2cf-pallet.png'],
  'tote': ['/size-categories/tote.jpg', '/size-categories/tote.png'],
  'bulk': ['/size-categories/bulk.jpg', '/size-categories/bulk.png'],
};

const STEPS = [
  { id: 1, title: 'Products', icon: Package },
  { id: 2, title: 'Transport', icon: Truck },
  { id: 3, title: 'Review', icon: Check },
];

function createEmptyLine(): WorkOrderLineItem {
  return {
    id: crypto.randomUUID?.() ?? `line-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    productType: 'standard',
    productName: '',
    productId: '',
    airtableProductId: '',
    ingredientRatios: '',
    ingredientsList: '',
    customNotes: '',
    sizeCategory: '',
    sizeCategoryName: '',
    unitsPerPallet: null,
    estimatedPalletWeight: '',
    quantity: 1,
    quantityType: 'pallet',
    mixingGuidelines: '',
    totalWeightLbs: 0,
  };
}

export default function CreateWorkOrder() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [lineItems, setLineItems] = useState<WorkOrderLineItem[]>(() => [createEmptyLine()]);
  const [productSearchPerLine, setProductSearchPerLine] = useState<Record<string, string>>({});
  const [showDropdownFor, setShowDropdownFor] = useState<string | null>(null);

  const [transport, setTransport] = useState({
    needsTransportation: false,
    destinationAddress: '',
    destinationCity: '',
    destinationState: 'AZ',
    destinationZip: '',
    preferredDeliveryDate: '',
    preferredDeliveryTime: '',
  });
  const [orderType, setOrderType] = useState<'amazon' | 'local' | 'wholesale' | 'bulk'>('wholesale');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [workOrderNotes, setWorkOrderNotes] = useState('');
  const [createdByName, setCreatedByName] = useState('');
  const [createdByEmail, setCreatedByEmail] = useState('');

  const { data: products = [] } = useQuery({
    queryKey: ['products-cache'],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/operations/work-orders/products', { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const filteredProducts = useMemo(() => {
    const q = (productSearchPerLine[showDropdownFor ?? ''] ?? '').toLowerCase().trim();
    if (!q) return products;
    return products.filter((p: any) =>
      (p.product_name || '').toLowerCase().includes(q) || (p.product_id || '').toLowerCase().includes(q)
    );
  }, [products, productSearchPerLine, showDropdownFor]);

  const updateLine = (lineId: string, updates: Partial<WorkOrderLineItem>) => {
    setLineItems((prev) => prev.map((l) => (l.id === lineId ? { ...l, ...updates } : l)));
  };

  const addLine = () => setLineItems((prev) => [...prev, createEmptyLine()]);
  const removeLine = (lineId: string) => {
    setLineItems((prev) => {
      const next = prev.filter((l) => l.id !== lineId);
      return next.length ? next : [createEmptyLine()];
    });
  };

  const fetchMixForLine = async (line: WorkOrderLineItem) => {
    if (!line.sizeCategory || line.quantity < 1) return;
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch('/api/admin/operations/work-orders/calculate-mix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          productName: line.productName,
          ingredientRatios: line.ingredientRatios,
          sizeCategory: line.sizeCategory,
          sizeCategoryName: line.sizeCategoryName,
          unitsPerPallet: line.unitsPerPallet,
          estimatedPalletWeight: line.estimatedPalletWeight,
          quantity: line.quantity,
          quantityType: line.quantityType,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        updateLine(line.id, { mixingGuidelines: data.mixingGuidelines, totalWeightLbs: data.totalWeightLbs ?? 0 });
      }
    } catch (e) {
      console.error('Calculate mix error:', e);
    }
  };

  const handleProductSelect = (lineId: string, product: any) => {
    const name = product.product_name || product.productName;
    updateLine(lineId, {
      productType: 'standard',
      productName: name,
      productId: product.product_id || product.productId || '',
      airtableProductId: product.airtable_id || '',
      ingredientRatios: product.ingredient_ratios || product.ingredientRatios || '',
      ingredientsList: product.ingredients_list || product.ingredientsList || '',
    });
    setProductSearchPerLine((prev) => ({ ...prev, [lineId]: name }));
    setShowDropdownFor(null);
  };

  const handleSizeSelect = (lineId: string, category: (typeof MAIN_SIZE_CATEGORIES)[0]) => {
    const line = lineItems.find((l) => l.id === lineId);
    if (!line) return;
    updateLine(lineId, {
      sizeCategory: category.code,
      sizeCategoryName: category.name,
      unitsPerPallet: category.unitsPerPallet ?? null,
      estimatedPalletWeight: category.estimatedPalletWeight || '',
    });
    const next = { ...line, sizeCategory: category.code, sizeCategoryName: category.name, unitsPerPallet: category.unitsPerPallet ?? null, estimatedPalletWeight: category.estimatedPalletWeight || '' };
    fetchMixForLine(next);
  };

  const getSizeCategory = (code: string) => MAIN_SIZE_CATEGORIES.find((c) => c.code === code);
  const getSizeImageCandidates = (code: string) => SIZE_IMAGE_FALLBACKS[code] || [];

  const createWorkOrderMutation = useMutation({
    mutationFn: async (payload: {
      lineItems: WorkOrderLineItem[];
      transport: typeof transport;
      orderType: string;
      priority: string;
      workOrderNotes: string;
      createdByName: string;
      createdByEmail: string;
    }) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/operations/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          lines: payload.lineItems.map((l) => ({
            productType: l.productType,
            productName: l.productName,
            productId: l.productId,
            airtableProductId: l.airtableProductId,
            ingredientRatios: l.ingredientRatios,
            ingredientsList: l.ingredientsList,
            customNotes: l.customNotes,
            sizeCategory: l.sizeCategory,
            sizeCategoryName: l.sizeCategoryName,
            unitsPerPallet: l.unitsPerPallet,
            estimatedPalletWeight: l.estimatedPalletWeight,
            quantity: l.quantity,
            quantityType: l.quantityType,
            mixingGuidelines: l.mixingGuidelines,
            totalWeightLbs: l.totalWeightLbs,
          })),
          needsTransportation: payload.transport.needsTransportation,
          destinationAddress: payload.transport.destinationAddress,
          destinationCity: payload.transport.destinationCity,
          destinationState: payload.transport.destinationState,
          destinationZip: payload.transport.destinationZip,
          preferredDeliveryDate: payload.transport.preferredDeliveryDate || null,
          preferredDeliveryTime: payload.transport.preferredDeliveryTime,
          orderType: payload.orderType,
          priority: payload.priority,
          workOrderNotes: payload.workOrderNotes?.trim() || null,
          createdByName: payload.createdByName,
          createdByEmail: payload.createdByEmail,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to create work order');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Work Order Created', description: `${data.wo_number} created successfully!` });
      navigate('/admin/operations/work-orders');
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const totalWeightAll = lineItems.reduce((s, l) => s + (l.totalWeightLbs || 0), 0);
  const canProceedProducts = lineItems.length >= 1 && lineItems.every((l) => (l.productType === 'custom' ? !!l.customNotes?.trim() : !!l.productName) && !!l.sizeCategory && l.quantity >= 1);
  const canProceedTransport = !transport.needsTransportation || !!transport.destinationAddress?.trim();
  const canSubmit = canProceedProducts && canProceedTransport && !!createdByName?.trim() && !!createdByEmail?.trim();
  const progressPercent = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  const handleSubmit = () => {
    if (!canSubmit) {
      if (!canProceedProducts) toast({ title: 'Products', description: 'Each line needs a product, size, and quantity.', variant: 'destructive' });
      else if (!createdByName?.trim() || !createdByEmail?.trim()) toast({ title: 'Created by', description: 'Please enter your name and email.', variant: 'destructive' });
      return;
    }
    createWorkOrderMutation.mutate({
      lineItems,
      transport,
      orderType,
      priority,
      workOrderNotes,
      createdByName,
      createdByEmail,
    });
  };

  return (
    <ProtectedAdminRoute>
      <OperationsLayout>
        <div className="min-h-screen bg-[#fafaf9] p-4 md:p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" onClick={() => navigate('/admin/operations/work-orders')} size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            </div>
            <div className="mb-6">
              <h1 className="text-lg font-bold text-gray-900">Create Work Order</h1>
              <p className="text-sm text-gray-500">Add one or more product lines, then set transport and review.</p>
            </div>

            <div className="mb-6">
              <div className="relative px-5 sm:px-7">
                <div className="absolute top-[18px] left-0 right-0 h-0.5 bg-gray-200" />
                <div
                  className="absolute top-[18px] left-0 h-0.5 bg-[#264027] transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />

                <div className="relative grid grid-cols-3 items-start gap-2">
                  {STEPS.map((step) => {
                    const isActive = currentStep === step.id;
                    const isComplete = step.id < currentStep;
                    const isClickable = step.id <= currentStep;

                    return (
                      <div key={step.id} className="flex flex-col items-center text-center">
                        <button
                          type="button"
                          onClick={() => isClickable && setCurrentStep(step.id)}
                          className={`flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all ${
                            isActive
                              ? 'border-[#264027] bg-[#264027] text-white shadow-[0_0_0_3px_rgba(38,64,39,0.12)]'
                              : isComplete
                                ? 'border-[#264027] bg-[#264027]/10 text-[#264027]'
                                : 'border-gray-300 bg-white text-gray-400'
                          } ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                          aria-current={isActive ? 'step' : undefined}
                          aria-label={step.title}
                        >
                          <step.icon className="w-4 h-4" />
                        </button>
                        <span className={`mt-2 text-xs font-medium ${isActive || isComplete ? 'text-[#264027]' : 'text-gray-500'}`}>
                          {step.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5">
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Products</h2>
                    <p className="text-sm text-gray-500">Add line items: product, size, and quantity per line. Use + to add another.</p>
                  </div>

                  <div className="space-y-4">
                    {lineItems.map((line, index) => (
                      <div key={line.id} className="p-4 rounded-lg border border-gray-200/80 bg-gray-50/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500">Line {index + 1}</span>
                          {lineItems.length > 1 && (
                            <Button type="button" variant="ghost" size="sm" className="h-7 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => removeLine(line.id)}>
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                            </Button>
                          )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="sm:col-span-2 space-y-1.5">
                            <Label className="text-xs">Product</Label>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => updateLine(line.id, { productType: 'standard' })}
                                className={`flex-1 py-2 px-3 rounded border text-xs font-medium ${line.productType === 'standard' ? 'border-[#264027] bg-[#264027]/5 text-[#264027]' : 'border-gray-200 text-gray-500'}`}
                              >
                                Standard
                              </button>
                              <button
                                type="button"
                                onClick={() => updateLine(line.id, { productType: 'custom', productName: '', productId: '' })}
                                className={`flex-1 py-2 px-3 rounded border text-xs font-medium ${line.productType === 'custom' ? 'border-[#264027] bg-[#264027]/5 text-[#264027]' : 'border-gray-200 text-gray-500'}`}
                              >
                                Custom
                              </button>
                            </div>
                            {line.productType === 'standard' && (
                              <div className="relative">
                                <Input
                                  placeholder="Search products..."
                                  value={productSearchPerLine[line.id] ?? line.productName}
                                  onChange={(e) => {
                                    setProductSearchPerLine((prev) => ({ ...prev, [line.id]: e.target.value }));
                                    setShowDropdownFor(line.id);
                                  }}
                                  onFocus={() => setShowDropdownFor(line.id)}
                                  className="h-9 text-sm"
                                />
                                {showDropdownFor === line.id && (
                                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {filteredProducts.length === 0 ? (
                                      <div className="p-2 text-xs text-gray-500 text-center">No products found</div>
                                    ) : (
                                      filteredProducts.map((p: any, idx: number) => (
                                        <button
                                          key={idx}
                                          type="button"
                                          onClick={() => handleProductSelect(line.id, p)}
                                          className={`w-full p-2 text-left text-sm hover:bg-gray-50 ${line.productName === p.product_name ? 'bg-[#264027]/5' : ''}`}
                                        >
                                          {p.product_name} {p.product_id && `(${p.product_id})`}
                                        </button>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                            {line.productType === 'custom' && (
                              <Textarea
                                placeholder="Custom product description..."
                                value={line.customNotes}
                                onChange={(e) => updateLine(line.id, { customNotes: e.target.value })}
                                rows={2}
                                className="text-sm"
                              />
                            )}
                            {line.productName && line.productType === 'standard' && (
                              <p className="text-xs text-[#264027] font-medium">{line.productName} {line.productId && `(${line.productId})`}</p>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs">Size</Label>
                            <Select value={line.sizeCategory || ''} onValueChange={(v) => handleSizeSelect(line.id, MAIN_SIZE_CATEGORIES.find((c) => c.code === v)!)}>
                              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Size" /></SelectTrigger>
                              <SelectContent>
                                {VISIBLE_SIZE_CATEGORIES.map((c) => (
                                  <SelectItem key={c.code} value={c.code} className="text-xs">{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {line.sizeCategory && (
                              <div className="rounded-md border border-gray-200 bg-white p-2">
                                {getSizeCategory(line.sizeCategory)?.image ? (
                                  <img
                                    src={getSizeCategory(line.sizeCategory)?.image || getSizeImageCandidates(line.sizeCategory)[0] || ''}
                                    alt={line.sizeCategoryName || 'Selected size'}
                                    className="w-full h-20 object-contain rounded bg-gray-50"
                                    onError={(e) => {
                                      const img = e.currentTarget;
                                      const current = img.getAttribute('src') || '';
                                      const next = getSizeImageCandidates(line.sizeCategory).find((src) => src && src !== current);
                                      if (next) img.src = next;
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-20 rounded bg-gray-50 flex items-center justify-center text-xs text-gray-400">
                                    No image
                                  </div>
                                )}
                                <p className="mt-1 text-[11px] text-gray-600 truncate">{line.sizeCategoryName}</p>
                              </div>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs">Quantity</Label>
                            <div className="flex gap-2">
                              <Select value={line.quantityType} onValueChange={(v: 'pallet' | 'unit') => {
                                updateLine(line.id, { quantityType: v });
                                const next = { ...line, quantityType: v };
                                if (next.sizeCategory && next.quantity >= 1) fetchMixForLine(next);
                              }}>
                                <SelectTrigger className="h-9 w-20 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pallet" className="text-xs">Pallets</SelectItem>
                                  <SelectItem value="unit" className="text-xs">Units</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input
                                type="number"
                                min={1}
                                value={line.quantity}
                                onChange={(e) => {
                                  const q = parseInt(e.target.value, 10) || 1;
                                  updateLine(line.id, { quantity: q });
                                  const next = { ...line, quantity: q };
                                  if (next.sizeCategory && next.quantity >= 1) fetchMixForLine(next);
                                }}
                                className="h-9 text-sm"
                              />
                            </div>
                            {line.totalWeightLbs > 0 && <p className="text-xs text-gray-500">~{line.totalWeightLbs.toLocaleString()} lbs</p>}
                          </div>
                        </div>

                      </div>
                    ))}

                    <Button type="button" variant="outline" size="sm" className="border-[#264027] text-[#264027] hover:bg-[#264027] hover:text-white" onClick={addLine}>
                      <Plus className="w-4 h-4 mr-2" /> Add line item
                    </Button>
                  </div>

                  {totalWeightAll > 0 && (
                    <p className="text-sm text-gray-600">Total estimated weight: <strong>{totalWeightAll.toLocaleString()} lbs</strong></p>
                  )}
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Transportation</h2>
                    <p className="text-sm text-gray-500">Same destination for this whole work order.</p>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Switch
                      checked={transport.needsTransportation}
                      onCheckedChange={(c) => setTransport((t) => ({ ...t, needsTransportation: c }))}
                    />
                    <div>
                      <div className="font-medium text-sm">Needs Transportation</div>
                      <div className="text-xs text-gray-500">Enable to add delivery details</div>
                    </div>
                  </div>
                  {transport.needsTransportation && (
                    <div className="space-y-3">
                      <div>
                        <Label>Destination</Label>
                        <Select
                          onValueChange={(id) => {
                            const loc = PREDEFINED_LOCATIONS.find((l) => l.id === id);
                            if (loc && loc.id !== 'custom') setTransport((t) => ({ ...t, destinationAddress: loc.address, destinationCity: loc.city, destinationState: loc.state, destinationZip: loc.zip }));
                          }}
                        >
                          <SelectTrigger><SelectValue placeholder="Select or enter custom..." /></SelectTrigger>
                          <SelectContent>
                            {PREDEFINED_LOCATIONS.map((loc) => (
                              <SelectItem key={loc.id} value={loc.id}>{loc.name} {loc.address && `— ${loc.address}`}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Street Address *</Label>
                        <Input value={transport.destinationAddress} onChange={(e) => setTransport((t) => ({ ...t, destinationAddress: e.target.value }))} placeholder="Street address" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>City</Label><Input value={transport.destinationCity} onChange={(e) => setTransport((t) => ({ ...t, destinationCity: e.target.value }))} /></div>
                        <div>
                          <Label>State</Label>
                          <Select value={transport.destinationState} onValueChange={(v) => setTransport((t) => ({ ...t, destinationState: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AZ">AZ</SelectItem>
                              <SelectItem value="CA">CA</SelectItem>
                              <SelectItem value="NM">NM</SelectItem>
                              <SelectItem value="NV">NV</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>ZIP</Label><Input value={transport.destinationZip} onChange={(e) => setTransport((t) => ({ ...t, destinationZip: e.target.value }))} /></div>
                        <div><Label>Preferred Date</Label><Input type="date" value={transport.preferredDeliveryDate} onChange={(e) => setTransport((t) => ({ ...t, preferredDeliveryDate: e.target.value }))} /></div>
                      </div>
                    </div>
                  )}
                  {!transport.needsTransportation && (
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <Truck className="w-10 h-10 text-gray-300 mx-auto mb-1" />
                      <p className="text-sm text-gray-500">Customer pickup — no transportation</p>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Review</h2>
                    <p className="text-sm text-gray-500">Confirm and create</p>
                  </div>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Line items</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {lineItems.map((l) => (
                        <div key={l.id} className="flex justify-between items-center gap-3 text-sm py-2 border-b border-gray-100 last:border-0">
                          <div className="min-w-0">
                            <p className="truncate">{l.productName || l.customNotes || 'Custom'}</p>
                            <p className="text-xs text-gray-500">{l.sizeCategoryName}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getSizeCategory(l.sizeCategory)?.image && (
                              <img
                                src={getSizeCategory(l.sizeCategory)?.image || getSizeImageCandidates(l.sizeCategory)[0] || ''}
                                alt={l.sizeCategoryName}
                                className="w-12 h-10 object-contain rounded border border-gray-200 bg-gray-50"
                                onError={(e) => {
                                  const img = e.currentTarget;
                                  const current = img.getAttribute('src') || '';
                                  const next = getSizeImageCandidates(l.sizeCategory).find((src) => src && src !== current);
                                  if (next) img.src = next;
                                }}
                              />
                            )}
                            <span className="text-gray-600 whitespace-nowrap">{l.quantity} {l.quantityType}{l.quantity > 1 ? 's' : ''} {l.totalWeightLbs ? `· ${l.totalWeightLbs.toLocaleString()} lbs` : ''}</span>
                          </div>
                        </div>
                      ))}
                      {totalWeightAll > 0 && <p className="text-sm font-medium text-[#264027] pt-2">Total: {totalWeightAll.toLocaleString()} lbs</p>}
                    </CardContent>
                  </Card>
                  <div className="flex gap-2 flex-wrap">
                    <div className="space-y-1">
                      <Label className="text-xs">Order type</Label>
                      <Select value={orderType} onValueChange={(v: any) => setOrderType(v)}>
                        <SelectTrigger className="w-40 h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ORDER_TYPES.map((t) => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Priority</Label>
                      <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                        <SelectTrigger className="w-32 h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low" className="text-xs">Low</SelectItem>
                          <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                          <SelectItem value="high" className="text-xs">High</SelectItem>
                          <SelectItem value="urgent" className="text-xs">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Work Order Notes</CardTitle></CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="Add notes for operations, production, or delivery context..."
                        value={workOrderNotes}
                        onChange={(e) => setWorkOrderNotes(e.target.value)}
                        rows={3}
                      />
                    </CardContent>
                  </Card>
                  {transport.needsTransportation && transport.destinationAddress && (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Delivery</CardTitle></CardHeader>
                      <CardContent className="text-sm">
                        <div>{transport.destinationAddress}</div>
                        <div className="text-gray-500">{transport.destinationCity}, {transport.destinationState} {transport.destinationZip}</div>
                      </CardContent>
                    </Card>
                  )}
                  <Card className="border-[#264027]/30">
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Created by</CardTitle></CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label className="text-xs">Name *</Label>
                        <Input value={createdByName} onChange={(e) => setCreatedByName(e.target.value)} placeholder="Your name" className="h-9" />
                      </div>
                      <div>
                        <Label className="text-xs">Email *</Label>
                        <Input type="email" value={createdByEmail} onChange={(e) => setCreatedByEmail(e.target.value)} placeholder="your@email.com" className="h-9" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center py-4">
              <Button variant="outline" onClick={() => setCurrentStep((s) => Math.max(1, s - 1))} disabled={currentStep === 1}>Previous</Button>
              {currentStep < 3 ? (
                <Button
                  onClick={() => setCurrentStep((s) => s + 1)}
                  disabled={currentStep === 1 ? !canProceedProducts : !canProceedTransport}
                  className="bg-[#264027] hover:bg-[#3c5233] shadow-sm"
                >
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={!canSubmit || createWorkOrderMutation.isPending} className="bg-[#264027] hover:bg-[#3c5233] shadow-sm">
                  {createWorkOrderMutation.isPending ? 'Creating...' : <><ClipboardList className="w-4 h-4 mr-2" /> Create Work Order</>}
                </Button>
              )}
            </div>
          </div>
        </div>
      </OperationsLayout>
    </ProtectedAdminRoute>
  );
}
