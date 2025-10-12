import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ShoppingCart, Plus, Minus, Loader2, MapPin, Package, User, Phone, Mail, ArrowRight, Check } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useLocation } from 'wouter';

interface InventoryProduct {
  id: number;
  quantity_available: number;
  quantity_reserved: number;
  products: {
    id: number;
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl?: string;
    texturePhotoUrl?: string;
    sizeOptions?: string[];
  };
}

interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
}

const QuickOrder: React.FC = () => {
  const [, navigate] = useLocation();
  const { items, addItem, updateQuantity, getTotalItems, getTotalPrice, clearCart } = useCart();
  const locationId = 1; // Phoenix location
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSizes, setSelectedSizes] = useState<Record<number, string>>({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({ name: '', phone: '', email: '' });
  const [errors, setErrors] = useState<Partial<CustomerInfo>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch products with inventory
  const { data: inventory, isLoading, error } = useQuery({
    queryKey: ['inventory', locationId],
    queryFn: async () => {
      const response = await fetch(`/api/inventory/location/${locationId}`);
      if (!response.ok) throw new Error('Failed to fetch inventory');
      return response.json() as Promise<InventoryProduct[]>;
    },
  });

  // Get unique categories
  const categories = useMemo(() => {
    if (!inventory) return [];
    const uniqueCategories = [...new Set(inventory.map(item => item.products.category))];
    return ['all', ...uniqueCategories];
  }, [inventory]);

  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (!inventory) return [];
    if (selectedCategory === 'all') return inventory;
    return inventory.filter(item => item.products.category === selectedCategory);
  }, [inventory, selectedCategory]);

  const handleAddToCart = (product: InventoryProduct['products']) => {
    const selectedSize = selectedSizes[product.id] || product.sizeOptions?.[0] || 'Standard';
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      sizeOption: selectedSize,
      imageUrl: product.texturePhotoUrl || product.imageUrl,
    });
  };

  const getItemQuantity = (productId: number) => {
    const selectedSize = selectedSizes[productId] || 'Standard';
    const item = items.find(i => i.productId === productId && i.sizeOption === selectedSize);
    return item?.quantity || 0;
  };

  const handleSizeChange = (productId: number, size: string) => {
    setSelectedSizes(prev => ({ ...prev, [productId]: size }));
  };

  const validateCustomerInfo = (): boolean => {
    const newErrors: Partial<CustomerInfo> = {};
    
    if (!customerInfo.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!customerInfo.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(customerInfo.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    
    if (customerInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCheckout = async () => {
    if (!validateCustomerInfo()) return;
    
    setIsProcessing(true);
    try {
      // Create checkout session
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            sizeOption: item.sizeOption,
            name: item.name,
            price: item.price,
            imageUrl: item.imageUrl
          })),
          locationId,
          customerInfo,
          isQuickOrder: true,
        }),
      });

      if (!response.ok) throw new Error('Checkout failed');
      
      const { url } = await response.json();
      
      // Save customer info to localStorage for future orders
      localStorage.setItem('quickOrderCustomer', JSON.stringify(customerInfo));
      
      // Redirect to payment
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('There was an error processing your order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPhone = (value: string) => {
    const phone = value.replace(/\D/g, '');
    if (phone.length <= 3) return phone;
    if (phone.length <= 6) return `(${phone.slice(0, 3)}) ${phone.slice(3)}`;
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6, 10)}`;
  };

  // Load saved customer info
  React.useEffect(() => {
    const saved = localStorage.getItem('quickOrderCustomer');
    if (saved) {
      setCustomerInfo(JSON.parse(saved));
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">Error loading products</p>
          <Button 
            className="mt-4" 
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Checkout View
  if (showCheckout) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-green-700 text-white p-4 sticky top-0 z-10 shadow-lg">
          <h1 className="text-2xl font-bold text-center">Checkout</h1>
        </div>
        
        <div className="container mx-auto px-4 py-6 max-w-lg">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Customer Information</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Name *
                </Label>
                <Input
                  id="name"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
              
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone *
                </Label>
                <Input
                  id="phone"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                  placeholder="(555) 123-4567"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
              
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email (optional)
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t">
              <h3 className="font-bold mb-4">Order Summary</h3>
              <div className="space-y-2 mb-4">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.sizeOption}`} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name} ({item.sizeOption})</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-lg pt-4 border-t">
                <span>Total</span>
                <span>${getTotalPrice().toFixed(2)}</span>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCheckout(false)}
                className="flex-1"
              >
                Back to Cart
              </Button>
              <Button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Place Order
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Product List View
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-green-700 text-white sticky top-0 z-10 shadow-lg">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-center">Quick Order</h1>
          <div className="flex items-center justify-center mt-2 text-sm">
            <MapPin className="h-4 w-4 mr-1" />
            <span>Phoenix Warehouse • Drive-Through Pickup</span>
          </div>
        </div>
        
        {/* Category Pills */}
        <div className="px-4 pb-3 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-white text-green-700'
                    : 'bg-green-600 text-white hover:bg-green-500'
                }`}
              >
                {category === 'all' ? 'All Products' : category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {filteredProducts.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No products available in this category</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((item) => {
              const product = item.products;
              const selectedSize = selectedSizes[product.id] || product.sizeOptions?.[0] || 'Standard';
              const quantity = getItemQuantity(product.id);
              const available = item.quantity_available;
              
              return (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="flex">
                    {/* Product Image */}
                    <div className="w-36 h-36 bg-gray-200 flex-shrink-0">
                      {product.texturePhotoUrl || product.imageUrl ? (
                        <OptimizedImage
                          src={product.texturePhotoUrl || product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="h-12 w-12" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 p-4">
                      <h3 className="font-bold text-lg text-gray-900">{product.name}</h3>
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                        {product.description}
                      </p>
                      
                      {/* Size Selector */}
                      {product.sizeOptions && product.sizeOptions.length > 1 && (
                        <div className="mt-3">
                          <label className="text-xs text-gray-500 uppercase tracking-wider">Size:</label>
                          <div className="flex gap-2 mt-1">
                            {product.sizeOptions.map((size) => (
                              <button
                                key={size}
                                onClick={() => handleSizeChange(product.id, size)}
                                className={`px-3 py-1 text-sm rounded-md transition-all ${
                                  selectedSize === size
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-4">
                        <div>
                          <span className="text-2xl font-bold text-green-700">
                            ${product.price?.toFixed(2) || '0.00'}
                          </span>
                          <p className="text-xs text-gray-500">
                            {available} in stock
                          </p>
                        </div>
                        
                        {available > 0 ? (
                          quantity > 0 ? (
                            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateQuantity(
                                  product.id, 
                                  selectedSize, 
                                  quantity - 1
                                )}
                                className="h-10 w-10 p-0 hover:bg-white"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-12 text-center font-bold text-lg">
                                {quantity}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateQuantity(
                                  product.id, 
                                  selectedSize, 
                                  quantity + 1
                                )}
                                className="h-10 w-10 p-0 hover:bg-white"
                                disabled={quantity >= available}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => handleAddToCart(product)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              size="lg"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          )
                        ) : (
                          <span className="text-red-600 font-medium bg-red-50 px-3 py-2 rounded-md">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart Summary Bar */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-xl">
          <div className="container mx-auto max-w-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Cart Total</p>
                <p className="text-3xl font-bold text-gray-900">${getTotalPrice().toFixed(2)}</p>
              </div>
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg"
                onClick={() => setShowCheckout(true)}
              >
                Continue
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickOrder;
