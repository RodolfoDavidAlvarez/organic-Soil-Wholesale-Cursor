import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { ArrowLeft, ArrowRight, ClipboardList, Package, Ruler, Hash, Truck, Check, Calculator, Search, ChevronDown } from 'lucide-react';
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

interface WorkOrderFormData {
  productType: 'standard' | 'custom';
  productName: string;
  productId: string;
  airtableProductId: string;
  ingredientRatios: string;
  ingredientsList: string;
  sizeCategory: string;
  sizeCategoryName: string;
  unitsPerPallet: number | null;
  estimatedPalletWeight: string;
  quantity: number;
  quantityType: 'pallet' | 'unit';
  customNotes: string;
  needsTransportation: boolean;
  destinationAddress: string;
  destinationCity: string;
  destinationState: string;
  destinationZip: string;
  preferredDeliveryDate: string;
  preferredDeliveryTime: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  orderType: 'amazon' | 'local' | 'wholesale' | 'bulk';
  createdByName: string;
  createdByEmail: string;
}

// Order type options
const ORDER_TYPES = [
  { value: 'amazon', label: 'Amazon Fulfillment', description: 'FBA prep & ship' },
  { value: 'local', label: 'Local Sales', description: 'Retail & direct customers' },
  { value: 'wholesale', label: 'Wholesale', description: 'B2B & distributor orders' },
  { value: 'bulk', label: 'Bulk Blend (Loose)', description: 'Unbagged material' },
];

// Predefined destination locations
const PREDEFINED_LOCATIONS = [
  {
    id: 'phoenix-dc',
    name: 'SSW Phoenix Distribution Center',
    address: '1634 North 19th Avenue',
    city: 'Phoenix',
    state: 'AZ',
    zip: '85009'
  },
  {
    id: 'congress-hq',
    name: 'SSW Congress HQ (Origin)',
    address: '18980 Stanton Rd',
    city: 'Congress',
    state: 'AZ',
    zip: '85332'
  },
  {
    id: 'custom',
    name: 'Custom Address',
    address: '',
    city: '',
    state: 'AZ',
    zip: ''
  },
];

// Main size categories for work orders (consolidated, no duplicates)
const MAIN_SIZE_CATEGORIES = [
  { code: '9lb', name: '9 lb Bag (Pallet)', unitsPerPallet: 144, estimatedPalletWeight: '1,296 lbs', image: '/size-categories/9lb-pallet.jpg' },
  { code: '7.5qt', name: '7.5 Quart Bag (Pallet)', unitsPerPallet: 144, estimatedPalletWeight: '1,000 lbs', image: '/size-categories/7.5qt-pallet.jpg' },
  { code: '1cf', name: '1 CF Bag (Pallet)', unitsPerPallet: 50, estimatedPalletWeight: '1,250 lbs', image: '/size-categories/1cf-pallet.jpg' },
  { code: '1.5cf', name: '1.5 CF Bag (Pallet)', unitsPerPallet: 40, estimatedPalletWeight: '1,200 lbs', image: '/size-categories/1cf-pallet.jpg' },
  { code: '2cf', name: '2 CF Bag (Pallet)', unitsPerPallet: 40, estimatedPalletWeight: '1,200 lbs', image: '/size-categories/2cf-pallet.jpg' },
  { code: 'tote', name: 'Tote / Super Sack (2.2 CY)', unitsPerPallet: 1, estimatedPalletWeight: '2,000 lbs', image: '/size-categories/tote.jpg' },
  { code: 'bulk', name: 'Bulk (Cubic Yards)', unitsPerPallet: null, estimatedPalletWeight: null, image: '/size-categories/bulk.jpg' },
  { code: 'other', name: 'Other / Custom', unitsPerPallet: null, estimatedPalletWeight: null, image: null },
];

const STEPS = [
  { id: 1, title: 'Product', icon: Package },
  { id: 2, title: 'Size', icon: Ruler },
  { id: 3, title: 'Quantity', icon: Hash },
  { id: 4, title: 'Transport', icon: Truck },
  { id: 5, title: 'Review', icon: Check },
];

export default function CreateWorkOrder() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [mixingGuidelines, setMixingGuidelines] = useState('');
  const [totalWeightLbs, setTotalWeightLbs] = useState(0);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const [formData, setFormData] = useState<WorkOrderFormData>({
    productType: 'standard',
    productName: '',
    productId: '',
    airtableProductId: '',
    ingredientRatios: '',
    ingredientsList: '',
    sizeCategory: '',
    sizeCategoryName: '',
    unitsPerPallet: null,
    estimatedPalletWeight: '',
    quantity: 1,
    quantityType: 'pallet',
    customNotes: '',
    needsTransportation: false,
    destinationAddress: '',
    destinationCity: '',
    destinationState: 'AZ',
    destinationZip: '',
    preferredDeliveryDate: '',
    preferredDeliveryTime: '',
    priority: 'normal',
    orderType: 'wholesale',
    createdByName: '',
    createdByEmail: '',
  });

  // Fetch products from API
  const { data: products = [] } = useQuery({
    queryKey: ['products-cache'],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/operations/work-orders/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const search = productSearch.toLowerCase();
    return products.filter((p: any) =>
      (p.product_name || '').toLowerCase().includes(search) ||
      (p.product_id || '').toLowerCase().includes(search)
    );
  }, [products, productSearch]);

  // Calculate mixing guidelines
  useEffect(() => {
    if (formData.sizeCategory && formData.quantity > 0) {
      calculateMix();
    }
  }, [formData.sizeCategory, formData.quantity, formData.quantityType, formData.ingredientRatios]);

  const calculateMix = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch('/api/admin/operations/work-orders/calculate-mix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productName: formData.productName,
          ingredientRatios: formData.ingredientRatios,
          sizeCategory: formData.sizeCategory,
          sizeCategoryName: formData.sizeCategoryName,
          unitsPerPallet: formData.unitsPerPallet,
          estimatedPalletWeight: formData.estimatedPalletWeight,
          quantity: formData.quantity,
          quantityType: formData.quantityType,
        })
      });
      if (response.ok) {
        const data = await response.json();
        setMixingGuidelines(data.mixingGuidelines);
        setTotalWeightLbs(data.totalWeightLbs);
      }
    } catch (error) {
      console.error('Error calculating mix:', error);
    }
  };

  const createWorkOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/operations/work-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create work order');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Work Order Created',
        description: `Work Order ${data.wo_number} created successfully!`
      });
      navigate('/admin/operations/work-orders');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleProductSelect = (product: any) => {
    setFormData(prev => ({
      ...prev,
      productType: 'standard',
      productName: product.product_name || product.productName,
      productId: product.product_id || product.productId || '',
      airtableProductId: product.airtable_id || '',
      ingredientRatios: product.ingredient_ratios || product.ingredientRatios || '',
      ingredientsList: product.ingredients_list || product.ingredientsList || '',
    }));
    setProductSearch(product.product_name || product.productName);
    setShowProductDropdown(false);
  };

  const handleSizeCategorySelect = (category: any) => {
    setFormData(prev => ({
      ...prev,
      sizeCategory: category.code,
      sizeCategoryName: category.name,
      unitsPerPallet: category.unitsPerPallet,
      estimatedPalletWeight: category.estimatedPalletWeight || '',
    }));
  };

  const handleSubmit = () => {
    if (!formData.sizeCategory) {
      toast({ title: 'Missing Size Category', description: 'Please select a size category.', variant: 'destructive' });
      return;
    }
    if (formData.productType === 'standard' && !formData.productName) {
      toast({ title: 'Missing Product', description: 'Please select a product.', variant: 'destructive' });
      return;
    }
    if (!formData.createdByName.trim()) {
      toast({ title: 'Missing Name', description: 'Please enter your name.', variant: 'destructive' });
      return;
    }
    if (!formData.createdByEmail.trim()) {
      toast({ title: 'Missing Email', description: 'Please enter your email.', variant: 'destructive' });
      return;
    }
    createWorkOrderMutation.mutate({ ...formData, mixingGuidelines, totalWeightLbs });
  };

  const nextStep = () => { if (currentStep < 5) setCurrentStep(prev => prev + 1); };
  const prevStep = () => { if (currentStep > 1) setCurrentStep(prev => prev - 1); };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.productType === 'custom' || formData.productName;
      case 2: return !!formData.sizeCategory;
      case 3: return formData.quantity >= 1;
      case 4: return !formData.needsTransportation || formData.destinationAddress;
      default: return true;
    }
  };

  return (
    <ProtectedAdminRoute>
      <OperationsLayout>
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" onClick={() => navigate('/admin/operations/work-orders')} size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            </div>
            <div className="mb-6">
              <h1 className="text-xl font-bold text-gray-900">Create Work Order</h1>
              <p className="text-sm text-gray-500">Generate a production work order with mixing guidelines</p>
            </div>

            {/* Progress Steps */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                {STEPS.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <button
                      onClick={() => step.id <= currentStep && setCurrentStep(step.id)}
                      className={`flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all ${
                        step.id === currentStep ? 'border-[#264027] bg-[#264027] text-white'
                        : step.id < currentStep ? 'border-[#264027] bg-[#264027]/10 text-[#264027]'
                        : 'border-gray-300 bg-white text-gray-400'
                      }`}
                    >
                      <step.icon className="w-4 h-4" />
                    </button>
                    <span className={`ml-1.5 text-xs font-medium hidden sm:inline ${step.id === currentStep ? 'text-[#264027]' : 'text-gray-500'}`}>
                      {step.title}
                    </span>
                    {index < STEPS.length - 1 && (
                      <div className={`w-6 md:w-12 h-0.5 mx-1.5 ${step.id < currentStep ? 'bg-[#264027]' : 'bg-gray-200'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="bg-white rounded-lg border border-gray-200 p-5 mb-5">
              {/* Step 1: Product Selection */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Select Product</h2>
                    <p className="text-sm text-gray-500">Choose a standard product or create a custom work order</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, productType: 'standard' }))}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        formData.productType === 'standard' ? 'border-[#264027] bg-[#264027]/5' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Package className={`w-5 h-5 mx-auto mb-1 ${formData.productType === 'standard' ? 'text-[#264027]' : 'text-gray-400'}`} />
                      <div className="font-medium text-sm">Standard Product</div>
                    </button>
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, productType: 'custom', productName: '', productId: '' }))}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        formData.productType === 'custom' ? 'border-[#264027] bg-[#264027]/5' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <ClipboardList className={`w-5 h-5 mx-auto mb-1 ${formData.productType === 'custom' ? 'text-[#264027]' : 'text-gray-400'}`} />
                      <div className="font-medium text-sm">Custom Order</div>
                    </button>
                  </div>

                  {formData.productType === 'standard' && (
                    <div className="relative">
                      <Label>Search Products</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          value={productSearch}
                          onChange={(e) => {
                            setProductSearch(e.target.value);
                            setShowProductDropdown(true);
                          }}
                          onFocus={() => setShowProductDropdown(true)}
                          placeholder="Type to search products..."
                          className="pl-9 pr-8"
                        />
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>

                      {showProductDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                          {filteredProducts.length === 0 ? (
                            <div className="p-3 text-sm text-gray-500 text-center">No products found</div>
                          ) : (
                            filteredProducts.map((product: any, idx: number) => (
                              <button
                                key={idx}
                                onClick={() => handleProductSelect(product)}
                                className={`w-full p-3 text-left hover:bg-gray-50 border-b last:border-0 ${
                                  formData.productName === product.product_name ? 'bg-[#264027]/5' : ''
                                }`}
                              >
                                <div className="font-medium text-sm">{product.product_name}</div>
                                <div className="text-xs text-gray-500 flex gap-2">
                                  {product.product_id && <span>{product.product_id}</span>}
                                  {product.ingredient_ratios && (
                                    <span className="truncate max-w-[200px]">{product.ingredient_ratios}</span>
                                  )}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}

                      {formData.productName && (
                        <div className="mt-3 p-3 bg-[#264027]/5 rounded-lg border border-[#264027]/20">
                          <div className="font-medium text-sm text-[#264027]">{formData.productName}</div>
                          {formData.productId && <div className="text-xs text-gray-600">{formData.productId}</div>}
                          {formData.ingredientRatios && (
                            <div className="text-xs text-gray-500 mt-1">{formData.ingredientRatios}</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {formData.productType === 'custom' && (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="customNotes">Custom Work Order Description *</Label>
                        <Textarea
                          id="customNotes"
                          value={formData.customNotes}
                          onChange={(e) => setFormData(prev => ({ ...prev, customNotes: e.target.value }))}
                          placeholder="Describe the custom product or blend..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="ingredientRatios">Ingredient Ratios (optional)</Label>
                        <Input
                          id="ingredientRatios"
                          value={formData.ingredientRatios}
                          onChange={(e) => setFormData(prev => ({ ...prev, ingredientRatios: e.target.value }))}
                          placeholder="e.g., 60% Dan's Gold, 30% Worm Castings, 10% Perlite"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Size Category */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Select Size Category</h2>
                    <p className="text-sm text-gray-500">Choose the packaging size</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {MAIN_SIZE_CATEGORIES.map((category) => (
                      <button
                        key={category.code}
                        onClick={() => handleSizeCategorySelect(category)}
                        className={`p-3 rounded-lg border-2 text-left transition-all flex items-center gap-3 ${
                          formData.sizeCategory === category.code
                            ? 'border-[#264027] bg-[#264027]/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="w-14 h-14 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {category.image ? (
                            <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                          ) : (
                            <Ruler className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{category.name}</div>
                          {category.unitsPerPallet && (
                            <div className="text-xs text-gray-500">{category.unitsPerPallet} units/pallet</div>
                          )}
                          {category.estimatedPalletWeight && (
                            <div className="text-xs text-gray-400">~{category.estimatedPalletWeight}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Quantity */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Specify Quantity</h2>
                    <p className="text-sm text-gray-500">How many pallets or units do you need?</p>
                  </div>

                  <div className="max-w-xs space-y-3">
                    <div>
                      <Label>Quantity Type</Label>
                      <Select
                        value={formData.quantityType}
                        onValueChange={(v: 'pallet' | 'unit') => setFormData(prev => ({ ...prev, quantityType: v }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pallet">Pallets</SelectItem>
                          <SelectItem value="unit">Single Units</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="quantity">Number of {formData.quantityType === 'pallet' ? 'Pallets' : 'Units'}</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                        className="text-lg font-medium"
                      />
                    </div>
                    <div>
                      <Label>Priority</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(v: 'low' | 'normal' | 'high' | 'urgent') => setFormData(prev => ({ ...prev, priority: v }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Order Type Selection */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Order Type</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {ORDER_TYPES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, orderType: type.value as any }))}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            formData.orderType === type.value
                              ? 'border-[#264027] bg-[#264027]/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium text-sm">{type.label}</div>
                          <div className="text-xs text-gray-500">{type.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {mixingGuidelines && (
                    <Card className="bg-green-50 border-green-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Calculator className="w-4 h-4" /> Production Requirements
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">{mixingGuidelines}</pre>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Step 4: Transportation */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Transportation</h2>
                    <p className="text-sm text-gray-500">Does this order need delivery?</p>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Switch
                      checked={formData.needsTransportation}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, needsTransportation: checked }))}
                    />
                    <div>
                      <div className="font-medium text-sm">Needs Transportation</div>
                      <div className="text-xs text-gray-500">Enable to add delivery details</div>
                    </div>
                  </div>

                  {formData.needsTransportation && (
                    <div className="space-y-3">
                      {/* Predefined Location Dropdown */}
                      <div>
                        <Label>Destination</Label>
                        <Select
                          onValueChange={(locationId) => {
                            const location = PREDEFINED_LOCATIONS.find(l => l.id === locationId);
                            if (location && location.id !== 'custom') {
                              setFormData(prev => ({
                                ...prev,
                                destinationAddress: location.address,
                                destinationCity: location.city,
                                destinationState: location.state,
                                destinationZip: location.zip,
                              }));
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a location or enter custom..." />
                          </SelectTrigger>
                          <SelectContent>
                            {PREDEFINED_LOCATIONS.map((location) => (
                              <SelectItem key={location.id} value={location.id}>
                                <div className="flex flex-col">
                                  <span>{location.name}</span>
                                  {location.address && (
                                    <span className="text-xs text-gray-500">{location.address}, {location.city}</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="destinationAddress">Street Address *</Label>
                        <Input
                          id="destinationAddress"
                          value={formData.destinationAddress}
                          onChange={(e) => setFormData(prev => ({ ...prev, destinationAddress: e.target.value }))}
                          placeholder="Street address"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="destinationCity">City</Label>
                          <Input
                            id="destinationCity"
                            value={formData.destinationCity}
                            onChange={(e) => setFormData(prev => ({ ...prev, destinationCity: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="destinationState">State</Label>
                          <Select value={formData.destinationState} onValueChange={(v) => setFormData(prev => ({ ...prev, destinationState: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AZ">Arizona</SelectItem>
                              <SelectItem value="CA">California</SelectItem>
                              <SelectItem value="NM">New Mexico</SelectItem>
                              <SelectItem value="NV">Nevada</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="preferredDeliveryDate">Preferred Date</Label>
                          <Input
                            id="preferredDeliveryDate"
                            type="date"
                            value={formData.preferredDeliveryDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, preferredDeliveryDate: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="destinationZip">ZIP Code</Label>
                          <Input
                            id="destinationZip"
                            value={formData.destinationZip}
                            onChange={(e) => setFormData(prev => ({ ...prev, destinationZip: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {!formData.needsTransportation && (
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <Truck className="w-10 h-10 text-gray-300 mx-auto mb-1" />
                      <p className="text-sm text-gray-500">No transportation needed - customer pickup</p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: Review */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Review Work Order</h2>
                    <p className="text-sm text-gray-500">Confirm the details before creating</p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Product</CardTitle></CardHeader>
                      <CardContent className="text-sm space-y-1">
                        <div><strong>{formData.productName || 'Custom Order'}</strong></div>
                        {formData.productId && <div className="text-gray-500">{formData.productId}</div>}
                        {formData.ingredientRatios && <div className="text-gray-500 text-xs">{formData.ingredientRatios}</div>}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Size & Quantity</CardTitle></CardHeader>
                      <CardContent className="text-sm space-y-1">
                        <div><strong>{formData.sizeCategoryName}</strong></div>
                        <div className="text-gray-500">{formData.quantity} {formData.quantityType}{formData.quantity > 1 ? 's' : ''}</div>
                        {totalWeightLbs > 0 && <div className="text-[#264027] font-medium">~{totalWeightLbs.toLocaleString()} lbs</div>}
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <span className="text-xs text-gray-500">Order Type: </span>
                          <span className="text-xs font-medium">{ORDER_TYPES.find(t => t.value === formData.orderType)?.label}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {mixingGuidelines && (
                    <Card className="bg-green-50 border-green-200">
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Mixing Guidelines</CardTitle></CardHeader>
                      <CardContent>
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">{mixingGuidelines}</pre>
                      </CardContent>
                    </Card>
                  )}

                  {formData.needsTransportation && (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Delivery</CardTitle></CardHeader>
                      <CardContent className="text-sm">
                        <div>{formData.destinationAddress}</div>
                        <div className="text-gray-500">{formData.destinationCity}, {formData.destinationState} {formData.destinationZip}</div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Created By Section */}
                  <Card className="border-[#264027]/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Created By</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="createdByName" className="text-xs">Your Name *</Label>
                          <Input
                            id="createdByName"
                            value={formData.createdByName}
                            onChange={(e) => setFormData(prev => ({ ...prev, createdByName: e.target.value }))}
                            placeholder="e.g. John Smith"
                            className="h-9 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="createdByEmail" className="text-xs">Your Email *</Label>
                          <Input
                            id="createdByEmail"
                            type="email"
                            value={formData.createdByEmail}
                            onChange={(e) => setFormData(prev => ({ ...prev, createdByEmail: e.target.value }))}
                            placeholder="e.g. john@soilseedandwater.com"
                            className="h-9 text-sm"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">This information will appear on the work order and be used for notifications.</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Previous
              </Button>
              {currentStep < 5 ? (
                <Button onClick={nextStep} disabled={!canProceed()} className="bg-[#264027] hover:bg-[#3c5233]">
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={createWorkOrderMutation.isPending} className="bg-[#264027] hover:bg-[#3c5233]">
                  {createWorkOrderMutation.isPending ? 'Creating...' : (
                    <><ClipboardList className="w-4 h-4 mr-2" /> Create Work Order</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </OperationsLayout>
    </ProtectedAdminRoute>
  );
}
