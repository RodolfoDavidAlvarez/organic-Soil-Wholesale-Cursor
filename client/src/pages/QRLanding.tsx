import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { getProductsData } from '../data/productData';
import { Product } from '../shared/schema';
import { getProductInventory, getProductPrice, isInStock, submitOrder } from '../data/staticInventory';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Clock, 
  MapPin,
  Phone,
  Check,
  Truck,
  Package,
  ChevronRight,
  Home,
  X,
  User,
  Mail,
  Loader2,
  ArrowRight,
  ChevronDown,
  Trash2
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
  size: string;
  uniqueKey: string; // Add unique key to prevent mixing
}

interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
}

const QRLanding: React.FC = () => {
  const [step, setStep] = useState<'welcome' | 'pickup-options' | 'menu' | 'cart' | 'customer-info' | 'checkout' | 'notify-arrival'>('welcome');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({ name: '', phone: '', email: '' });
  const [errors, setErrors] = useState<Partial<CustomerInfo>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Track QR landing page visit
  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'qr_code_scan', {
        event_category: 'engagement',
        event_label: 'drive_thru_landing'
      });
    }
  }, []);

  // Fetch products from database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        const data = await response.json();
        
        if (data.products) {
          setProducts(data.products);
        } else {
          // Fallback to static data if API fails
          setProducts(getProductsData());
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        // Fallback to static data
        setProducts(getProductsData());
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  const categories = [
    { 
      id: 'popular', 
      label: 'Popular Items', 
      icon: Package, 
      bgColor: 'bg-green-50', 
      textColor: 'text-green-700', 
      borderColor: 'border-green-200',
      image: 'category-popular.jpg',
      description: 'Best sellers & customer favorites'
    },
    { 
      id: 'potting', 
      label: 'Potting Soils', 
      icon: Package, 
      bgColor: 'bg-emerald-50', 
      textColor: 'text-emerald-700', 
      borderColor: 'border-emerald-200',
      image: 'category-potting-soil.jpeg',
      description: 'Premium organic potting mixes'
    },
    { 
      id: 'amendment', 
      label: 'Amendments', 
      icon: Package, 
      bgColor: 'bg-teal-50', 
      textColor: 'text-teal-700', 
      borderColor: 'border-teal-200',
      image: 'category-amendments.jpg',
      description: 'Soil enhancers & nutrients'
    },
    { 
      id: 'mulch', 
      label: 'Mulch', 
      icon: Package, 
      bgColor: 'bg-amber-50', 
      textColor: 'text-amber-700', 
      borderColor: 'border-amber-200',
      image: 'category-mulch.jpeg',
      description: 'Natural ground cover solutions'
    },
  ];

  const getProductsByCategory = (categoryId: string) => {
    // Enhanced products with inventory data from static source
    // In future, this will merge with real-time inventory from API
    const productsWithInventory = products.map(p => {
      const inventory = getProductInventory(p.id);
      const availableSizes = inventory.map(inv => inv.sizeOption);
      
      return {
        ...p,
        sizeOptions: availableSizes.length > 0 ? availableSizes : ['9lb Bag', '25lb Bag', 'Bulk (50lb)'],
        inventory: inventory
      };
    });
    
    if (categoryId === 'popular') {
      return productsWithInventory.slice(0, 6);
    }
    if (categoryId === 'potting') {
      return productsWithInventory.filter(p => p.type === 'Potting Soil');
    }
    if (categoryId === 'amendment') {
      return productsWithInventory.filter(p => p.type === 'Amendment' || p.type === 'Concentrated Amendment');
    }
    if (categoryId === 'mulch') {
      return productsWithInventory.filter(p => p.type === 'Mulch');
    }
    return [];
  };

  const addToCart = (product: Product, size: string) => {
    const uniqueKey = `${product.id}-${size}`;
    console.log('Adding to cart:', product.name, product.id, size, uniqueKey);
    
    const existingItem = cart.find(item => item.uniqueKey === uniqueKey);

    if (existingItem) {
      setCart(cart.map(item => 
        item.uniqueKey === uniqueKey
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1, size, uniqueKey }]);
    }
  };

  const updateQuantity = (productId: number, size: string, delta: number) => {
    const uniqueKey = `${productId}-${size}`;
    setCart(cart.map(item => {
      if (item.uniqueKey === uniqueKey) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const removeItem = (productId: number, size: string) => {
    const uniqueKey = `${productId}-${size}`;
    setCart(cart.filter(item => item.uniqueKey !== uniqueKey));
  };

  const getTotalItems = () => cart.reduce((sum, item) => sum + item.quantity, 0);

  const toggleProductExpansion = (productId: number) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  };

  const formatPhoneInput = (value: string) => {
    const phone = value.replace(/\D/g, '');
    if (phone.length <= 3) return phone;
    if (phone.length <= 6) return `(${phone.slice(0, 3)}) ${phone.slice(3)}`;
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6, 10)}`;
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

  const handlePlaceOrder = async () => {
    if (!validateCustomerInfo()) return;
    
    setIsProcessing(true);
    try {
      // Prepare order data matching future API structure
      const orderData = {
        customer: customerInfo,
        items: cart.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          size: item.size,
          quantity: item.quantity,
          unitPrice: getProductPrice(item.product.id, item.size),
          totalPrice: getProductPrice(item.product.id, item.size) * item.quantity
        })),
        locationId: 1, // Phoenix
        orderType: 'drive_through',
        totalAmount: cart.reduce((sum, item) => 
          sum + (getProductPrice(item.product.id, item.size) * item.quantity), 0
        ),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // Submit order using static system (will be API call in future)
      const result = await submitOrder(orderData);
      
      if (result.success) {
        // Save customer info for future orders
        localStorage.setItem('qrOrderCustomer', JSON.stringify(customerInfo));
        
        // Store order ID for confirmation screen
        localStorage.setItem('lastOrderId', result.orderId || '');
        
        // Clear cart and move to confirmation
        setCart([]);
        setStep('checkout');
      } else {
        throw new Error(result.error || 'Order submission failed');
      }
    } catch (error) {
      console.error('Order error:', error);
      alert('There was an error placing your order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Load saved customer info and cart
  useEffect(() => {
    // Load customer info
    const savedCustomer = localStorage.getItem('qrOrderCustomer');
    if (savedCustomer) {
      setCustomerInfo(JSON.parse(savedCustomer));
    }
    
    // Load cart from localStorage
    const savedCart = localStorage.getItem('qrOrderCart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
      } catch (e) {
        console.error('Error loading cart:', e);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('qrOrderCart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('qrOrderCart');
    }
  }, [cart]);

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Header */}
      <div className="bg-[hsl(142,38%,32%)] text-white sticky top-0 z-50 shadow-lg">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {step !== 'welcome' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20 -ml-2"
                  onClick={() => {
                    if (step === 'pickup-options' || step === 'menu') {
                      setStep('welcome');
                    } else if (step === 'cart') {
                      setStep('menu');
                    } else if (step === 'customer-info') {
                      setStep('cart');
                    } else if (step === 'checkout') {
                      setStep('customer-info');
                    } else if (step === 'notify-arrival') {
                      setStep('pickup-options');
                    }
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
              )}
              <Package className="w-8 h-8" />
              <div>
                <h1 className="text-xl font-bold">
                  <span>Organic </span>
                  <span className="text-[hsl(43,85%,55%)]">Soil</span>
                  <span> Wholesale</span>
                </h1>
                <p className="text-xs opacity-90">Drive-Thru Order System</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {step === 'welcome' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={() => {
                    if (cart.length > 0) {
                      if (confirm(`You have ${getTotalItems()} items in your cart. Are you sure you want to leave? Your cart will be saved for your next visit.`)) {
                        window.location.href = '/';
                      }
                    } else {
                      window.location.href = '/';
                    }
                  }}
                >
                  <Home className="w-4 h-4 mr-1" />
                  <span className="text-xs">Main Site</span>
                </Button>
              )}
              {step !== 'welcome' && (
                <div className="flex items-center gap-3">
                {cart.length > 0 && (
                  <>
                    <Badge className="bg-[hsl(43,85%,55%)] text-black px-3 py-1">
                      {getTotalItems()} items
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-white relative"
                      onClick={() => step === 'cart' ? setStep('menu') : setStep('cart')}
                    >
                      <ShoppingCart className="w-5 h-5" />
                      {cart.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {getTotalItems()}
                        </span>
                      )}
                    </Button>
                  </>
                )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Welcome Screen */}
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4"
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center max-w-md"
            >
              <h1 className="text-2xl text-gray-600 mb-3">
                Welcome to
              </h1>
              <h2 className="text-5xl font-bold mb-8">
                <span>Organic </span>
                <span className="text-primary">Soil</span>
                <span className="text-accent italic"> Wholesale</span>
              </h2>
              <p className="text-xl text-gray-700 mb-8">
                How can I help you today?
              </p>

              {/* Action Buttons */}
              <div className="space-y-4 mb-8">
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-xl" />
                  <button
                    className="relative w-full bg-white border border-gray-200 rounded-2xl p-6 flex items-center gap-4 shadow-lg hover:shadow-xl transition-all duration-300 group"
                    onClick={() => setStep('pickup-options')}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-xl font-bold text-gray-800 mb-1">Order & Pick Up</h3>
                      <p className="text-sm text-gray-600">Pre-order or notify arrival</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="relative"
                >
                  <button
                    className="relative w-full bg-white border border-gray-200 rounded-2xl p-6 flex items-center gap-4 shadow-lg hover:shadow-xl transition-all duration-300 group"
                    onClick={() => setStep('menu')}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-accent/10 to-accent/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-xl font-bold text-gray-800 mb-1">Walking In</h3>
                      <p className="text-sm text-gray-600">Browse and pick up now</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                  </button>
                </motion.div>
              </div>

              {/* Product Categories - Now Clickable */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {/* Soil Category */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedCategory('potting');
                    setStep('menu');
                  }}
                  className="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow"
                >
                  <img
                    src="category-potting-soil.jpeg"
                    alt="Potting Soils"
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                    <p className="p-2 text-white font-semibold text-sm">Potting Soils</p>
                  </div>
                </motion.button>

                {/* Amendments Category */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedCategory('amendment');
                    setStep('menu');
                  }}
                  className="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow"
                >
                  <img
                    src="category-amendments.jpg"
                    alt="Amendments"
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                    <p className="p-2 text-white font-semibold text-sm">Amendments</p>
                  </div>
                </motion.button>

                {/* Mulch Category */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedCategory('mulch');
                    setStep('menu');
                  }}
                  className="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow"
                >
                  <img
                    src="category-mulch.jpeg"
                    alt="Mulch"
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                    <p className="p-2 text-white font-semibold text-sm">Mulch</p>
                  </div>
                </motion.button>
              </div>

              <div className="mt-8 flex flex-col items-center gap-4">
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full">
                    <Clock className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Ready in ~15 min</span>
                  </div>
                </div>
                
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.open('https://maps.google.com/?q=Organic+Soil+Wholesale+Phoenix+AZ', '_blank')}
                  className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all duration-200 group"
                >
                  <MapPin className="w-4 h-4 text-red-500 group-hover:animate-bounce" />
                  <span className="text-sm font-medium text-gray-700">Phoenix, Arizona</span>
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Pickup Options Screen */}
        {step === 'pickup-options' && (
          <motion.div
            key="pickup-options"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4"
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center max-w-md w-full"
            >
              {/* Pickup Image */}
              <div className="mb-6 relative">
                <img
                  src="organic-wholesale-pickup.png"
                  alt="Wholesale Pickup"
                  className="w-full h-48 object-cover rounded-2xl shadow-xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl" />
                <div className="absolute bottom-4 left-4 text-white">
                  <h2 className="text-2xl font-bold">Order & Pick Up</h2>
                  <p className="text-sm opacity-90">Choose your option</p>
                </div>
              </div>

              <p className="text-xl text-gray-700 mb-8">
                How would you like to proceed?
              </p>

              <div className="space-y-4">
                {/* Pre-order Option */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <button
                    className="w-full bg-white border border-gray-200 rounded-2xl p-6 flex items-center gap-4 shadow-lg hover:shadow-xl transition-all duration-300 group"
                    onClick={() => setStep('menu')}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ShoppingCart className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-xl font-bold text-gray-800 mb-1">Pre-Order</h3>
                      <p className="text-sm text-gray-600">Browse products & order for later</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </button>
                </motion.div>

                {/* I'm Here Option */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <button
                    className="w-full bg-gradient-to-r from-accent to-accent/90 text-white rounded-2xl p-6 flex items-center gap-4 shadow-lg hover:shadow-xl transition-all duration-300 group"
                    onClick={() => setStep('notify-arrival')}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MapPin className="w-8 h-8 text-white animate-bounce" />
                      </div>
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-xl font-bold mb-1">I'm Here Now</h3>
                      <p className="text-sm opacity-90">Notify staff of your arrival</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </button>
                </motion.div>
              </div>

            </motion.div>
          </motion.div>
        )}

        {/* Menu Screen */}
        {step === 'menu' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className={cart.length > 0 ? "pb-32" : "pb-6"}
          >
            {/* Store Info Bar */}
            <div className="bg-white border-b px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Pickup at Phoenix Warehouse</span>
                </div>
                <span className="text-sm text-gray-500">Open until 4PM</span>
              </div>
            </div>

            {/* Categories */}
            <div className="px-4 py-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Shop by Category</h2>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <motion.button
                      key={category.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`relative overflow-hidden rounded-xl border-2 transition-all ${
                        selectedCategory === category.id 
                          ? `${category.borderColor} shadow-lg` 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* Background Image */}
                      <div className="relative h-32">
                        <img
                          src={category.image}
                          alt={category.label}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                        
                        {/* Content */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="w-5 h-5" />
                            <span className="font-semibold text-sm">{category.label}</span>
                          </div>
                          <p className="text-xs opacity-90">{category.description}</p>
                        </div>
                        
                        {/* Selected Indicator */}
                        {selectedCategory === category.id && (
                          <div className="absolute top-2 right-2">
                            <div className="bg-green-500 text-white rounded-full p-1">
                              <Check className="w-4 h-4" />
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Products */}
            {selectedCategory && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 mt-6"
              >
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  {categories.find(c => c.id === selectedCategory)?.label}
                </h3>
                <div className="space-y-4">
                  {getProductsByCategory(selectedCategory).map((product) => {
                    const isExpanded = expandedProducts.has(product.id);
                    const cartItems = cart.filter(item => item.product.id === product.id);
                    const totalInCart = cartItems.reduce((sum, item) => sum + item.quantity, 0);
                    
                    return (
                      <motion.div
                        key={product.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                      >
                        {/* Product Header - Always Visible */}
                        <div 
                          className="p-4 cursor-pointer"
                          onClick={() => toggleProductExpansion(product.id)}
                        >
                          <div className="flex gap-4">
                            <img
                              src={`/${product.texturePhotoUrl || product.imageUrl || 'placeholder.png'}`}
                              alt={product.name}
                              className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                            />
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-bold text-gray-900 text-lg">
                                    {product.displayTitle || product.name}
                                  </h4>
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {product.briefOverview || product.description}
                                  </p>
                                </div>
                                <ChevronDown 
                                  className={`w-5 h-5 text-gray-400 ml-2 transition-transform ${
                                    isExpanded ? 'rotate-180' : ''
                                  }`}
                                />
                              </div>
                              
                              {/* Quick Add Button - Show when collapsed */}
                              {!isExpanded && (
                                <div className="mt-3 flex items-center justify-between">
                                  <div className="text-sm">
                                    {product.sizeOptions && product.sizeOptions.length > 0 && (
                                      <span className="text-gray-600">
                                        From <span className="font-bold text-green-700">
                                          ${getProductPrice(product.id, product.sizeOptions[0]).toFixed(2)}
                                        </span>
                                      </span>
                                    )}
                                  </div>
                                  {totalInCart > 0 ? (
                                    <Badge className="bg-green-100 text-green-700">
                                      {totalInCart} in cart
                                    </Badge>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleProductExpansion(product.id);
                                      }}
                                      className="text-white bg-green-600 border-green-600 hover:bg-green-700"
                                    >
                                      Select Size
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Size and Quantity Selection - Collapsible */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 bg-gray-50 border-t border-gray-100">
                                <div className="space-y-3">
                                  {product.sizeOptions && product.sizeOptions.map((size) => {
                                    const uniqueKey = `${product.id}-${size}`;
                                    const cartItem = cart.find(item => item.uniqueKey === uniqueKey);
                                    const price = getProductPrice(product.id, size);
                                    const inStock = isInStock(product.id, size);
                                    const inventoryData = getProductInventory(product.id);
                                    const inventory = inventoryData.find(inv => inv.sizeOption === size);
                                    
                                    return (
                                      <div key={uniqueKey} className={`bg-white rounded-lg p-3 border ${inStock ? 'border-gray-200' : 'border-red-200 bg-red-50'}`}>
                                        <div className="flex items-center justify-between">
                                          <div className="flex-1">
                                            <span className="font-medium text-gray-900">{size}</span>
                                            {price > 0 && (
                                              <span className="ml-3 text-lg font-bold text-green-700">
                                                ${price.toFixed(2)}
                                              </span>
                                            )}
                                            {inventory && (
                                              <span className="ml-2 text-xs text-gray-500">
                                                ({inventory.quantityAvailable} available)
                                              </span>
                                            )}
                                          </div>
                                          
                                          {inStock ? (
                                            cartItem ? (
                                              <div className="flex items-center gap-2">
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateQuantity(product.id, size, -1);
                                                  }}
                                                  className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-300 flex items-center justify-center hover:bg-gray-200 transition-colors"
                                                >
                                                  <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="w-12 text-center font-bold text-lg">{cartItem.quantity}</span>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateQuantity(product.id, size, 1);
                                                  }}
                                                  className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-300 flex items-center justify-center hover:bg-gray-200 transition-colors"
                                                  disabled={inventory && cartItem.quantity >= inventory.quantityAvailable}
                                                >
                                                  <Plus className="w-3 h-3" />
                                                </button>
                                              </div>
                                            ) : (
                                              <Button
                                                size="sm"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  addToCart(product, size);
                                                }}
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                              >
                                                <Plus className="w-4 h-4 mr-1" />
                                                Add
                                              </Button>
                                            )
                                          ) : (
                                            <span className="text-red-600 text-sm font-medium">Out of Stock</span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                
                                {/* Total in Cart for this Product */}
                                {totalInCart > 0 && (
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-gray-600">Total in cart:</span>
                                      <span className="font-bold text-green-700">
                                        {totalInCart} units
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Continue Button - Remove this since we have floating cart button */}
          </motion.div>
        )}

        {/* Cart Screen */}
        {step === 'cart' && (
          <motion.div
            key="cart"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="px-4 py-6"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Order</h2>
            
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Your cart is empty</p>
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => setStep('menu')}
                >
                  Back to Menu
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-8">
                  {cart.map((item, index) => (
                    <motion.div
                      key={item.uniqueKey}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={`/${item.product.texturePhotoUrl || item.product.imageUrl || 'placeholder.png'}`}
                          alt={item.product.name}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-800">
                                {item.product.displayTitle || item.product.name}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">{item.size}</p>
                            </div>
                            <button
                              onClick={() => removeItem(item.product.id, item.size)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-3 mt-3">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.size, -1)}
                              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="font-semibold w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.size, 1)}
                              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="bg-gray-100 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Pickup Time</span>
                    <span className="font-semibold">~15 minutes</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Location</span>
                    <span className="font-semibold">Phoenix Warehouse</span>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full bg-[hsl(142,38%,32%)] hover:bg-[hsl(142,38%,28%)] text-white"
                  onClick={() => setStep('customer-info')}
                >
                  Continue to Checkout
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>

                <Button
                  variant="ghost"
                  className="w-full mt-3"
                  onClick={() => setStep('menu')}
                >
                  Add More Items
                </Button>
              </>
            )}
          </motion.div>
        )}

        {/* Customer Info Screen */}
        {step === 'customer-info' && (
          <motion.div
            key="customer-info"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="px-4 py-6"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Information</h2>
            
            <Card className="p-6 mb-6">
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
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: formatPhoneInput(e.target.value) }))}
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
            </Card>
            
            <div className="bg-gray-100 rounded-xl p-4 mb-6">
              <h3 className="font-semibold mb-3">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Items</span>
                  <span className="font-semibold">{getTotalItems()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Pickup Location</span>
                  <span className="font-semibold">Phoenix Warehouse</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Ready Time</span>
                  <span className="font-semibold">~15 minutes</span>
                </div>
              </div>
            </div>
            
            <Button
              size="lg"
              className="w-full bg-[hsl(142,38%,32%)] hover:bg-[hsl(142,38%,28%)] text-white"
              onClick={handlePlaceOrder}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Place Order
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* Checkout Screen */}
        {step === 'checkout' && (
          <motion.div
            key="checkout"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-4 py-6"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Check className="w-12 h-12 text-green-600" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-800">Order Received!</h2>
              <p className="text-gray-600 mt-2">We're preparing your order</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">Order #</span>
                <span className="font-mono font-semibold">{localStorage.getItem('lastOrderId') || `OSW-${Math.random().toString(36).substr(2, 6).toUpperCase()}`}</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">Pickup Time</span>
                <span className="font-semibold text-green-600">Ready in ~15 min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Items</span>
                <span className="font-semibold">{getTotalItems()} items</span>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Pickup Instructions</h3>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Drive to our warehouse at 123 Industrial Way</li>
                <li>2. Park in the "Online Orders" spot</li>
                <li>3. Call us when you arrive: {formatPhone('8057030091')}</li>
                <li>4. We'll load your order directly into your vehicle</li>
              </ol>
            </div>

            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full bg-[hsl(142,38%,32%)] hover:bg-[hsl(142,38%,28%)] text-white"
                onClick={() => window.location.href = 'tel:+18057030091'}
              >
                <Phone className="w-5 h-5 mr-2" />
                Call When You Arrive
              </Button>
              
              <Link to="/">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Back to Website
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Notify Arrival Screen */}
        {step === 'notify-arrival' && (
          <motion.div
            key="notify-arrival"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="px-4 py-6"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Phone className="w-12 h-12 text-accent animate-pulse" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-800">You've Arrived!</h2>
              <p className="text-gray-600 mt-2">Let us know you're here</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-6">
              <h3 className="font-semibold text-gray-800 mb-4">Quick Check-In</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Location</span>
                  <span className="font-semibold">Phoenix Warehouse</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Parking</span>
                  <span className="font-semibold text-green-600">Customer Loading Zone</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
              <ol className="text-sm text-blue-800 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="font-bold">1.</span>
                  <span>Call us to notify your arrival</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">2.</span>
                  <span>Tell us your name or order details</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">3.</span>
                  <span>We'll come out to assist you</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">4.</span>
                  <span>Stay in your vehicle - we'll load for you!</span>
                </li>
              </ol>
            </div>

            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full bg-accent hover:bg-accent/90 text-white"
                onClick={() => window.location.href = 'tel:+18057030091'}
              >
                <Phone className="w-5 h-5 mr-2" />
                Call Now: (805) 703-0091
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="w-full"
                onClick={() => setStep('menu')}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Browse Products Instead
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Cart Button - Fixed position to avoid overlap */}
      {cart.length > 0 && step === 'menu' && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg z-50"
        >
          <div className="container mx-auto max-w-2xl">
            <Button
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-6"
              onClick={() => setStep('cart')}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              View Cart ({getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'})
              <span className="ml-2 font-bold">
                ${cart.reduce((sum, item) => 
                  sum + (getProductPrice(item.product.id, item.size) * item.quantity), 0
                ).toFixed(2)}
              </span>
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default QRLanding;