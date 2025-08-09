import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { getProductsData } from '../data/productData';
import { Product } from '../shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  X
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
  size: string;
}

const QRLanding: React.FC = () => {
  const [step, setStep] = useState<'welcome' | 'pickup-options' | 'menu' | 'cart' | 'checkout' | 'notify-arrival'>('welcome');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showProductDetail, setShowProductDetail] = useState<Product | null>(null);
  const products = getProductsData();

  // Track QR landing page visit
  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'qr_code_scan', {
        event_category: 'engagement',
        event_label: 'drive_thru_landing'
      });
    }
  }, []);

  const categories = [
    { id: 'popular', label: 'Popular Items', icon: '⭐', color: 'from-yellow-500 to-orange-500' },
    { id: 'potting', label: 'Potting Soils', icon: '🪴', color: 'from-green-500 to-emerald-500' },
    { id: 'amendment', label: 'Amendments', icon: '♻️', color: 'from-blue-500 to-cyan-500' },
    { id: 'mulch', label: 'Mulch', icon: '🛡️', color: 'from-purple-500 to-pink-500' },
  ];

  const getProductsByCategory = (categoryId: string) => {
    if (categoryId === 'popular') {
      return products.slice(0, 6);
    }
    if (categoryId === 'potting') {
      return products.filter(p => p.type === 'Potting Soil');
    }
    if (categoryId === 'amendment') {
      return products.filter(p => p.type === 'Amendment' || p.type === 'Concentrated Amendment');
    }
    if (categoryId === 'mulch') {
      return products.filter(p => p.type === 'Mulch');
    }
    return [];
  };

  const addToCart = (product: Product, size: string) => {
    const existingItem = cart.find(item => 
      item.product.id === product.id && item.size === size
    );

    if (existingItem) {
      setCart(cart.map(item => 
        item.product.id === product.id && item.size === size
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1, size }]);
    }

    // Show confirmation
    setShowProductDetail(null);
  };

  const updateQuantity = (productId: string, size: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId && item.size === size) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const getTotalItems = () => cart.reduce((sum, item) => sum + item.quantity, 0);

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  };

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
                    } else if (step === 'checkout') {
                      setStep('cart');
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
                <Link to="/">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                  >
                    <Home className="w-4 h-4 mr-1" />
                    <span className="text-xs">Main Site</span>
                  </Button>
                </Link>
              )}
              {step !== 'welcome' && step !== 'pickup-options' && step !== 'notify-arrival' && (
                <div className="flex items-center gap-3">
                {cart.length > 0 && (
                  <Badge className="bg-[hsl(43,85%,55%)] text-black px-3 py-1">
                    {getTotalItems()} items
                  </Badge>
                )}
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-white"
                  onClick={() => step === 'cart' ? setStep('menu') : setStep('cart')}
                >
                  <ShoppingCart className="w-5 h-5" />
                </Button>
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

              {/* Product Categories */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {/* Soil Category */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="relative overflow-hidden rounded-lg shadow-md"
                >
                  <img
                    src={products.find(p => p.type === 'Potting Soil')?.texturePhotoUrl || '/placeholder.png'}
                    alt="Soil"
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                    <p className="p-2 text-white font-semibold text-sm">Soil</p>
                  </div>
                </motion.div>

                {/* Amendments Category */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative overflow-hidden rounded-lg shadow-md"
                >
                  <img
                    src={products.find(p => p.type === 'Amendment')?.texturePhotoUrl || '/placeholder.png'}
                    alt="Amendments"
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                    <p className="p-2 text-white font-semibold text-sm">Amendments</p>
                  </div>
                </motion.div>

                {/* Mulch Category */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="relative overflow-hidden rounded-lg shadow-md"
                >
                  <img
                    src={products.find(p => p.type === 'Mulch')?.texturePhotoUrl || '/placeholder.png'}
                    alt="Mulch"
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                    <p className="p-2 text-white font-semibold text-sm">Mulch</p>
                  </div>
                </motion.div>
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
            className="pb-20"
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
              <h2 className="text-xl font-bold text-gray-800 mb-4">Categories</h2>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((category) => (
                  <motion.button
                    key={category.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`relative overflow-hidden rounded-2xl p-4 text-left transition-all ${
                      selectedCategory === category.id ? 'ring-2 ring-green-500' : ''
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-90`} />
                    <div className="relative z-10 text-white">
                      <span className="text-2xl mb-2 block">{category.icon}</span>
                      <span className="font-semibold text-sm">{category.label}</span>
                    </div>
                  </motion.button>
                ))}
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
                  {getProductsByCategory(selectedCategory).map((product) => (
                    <motion.div
                      key={product.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowProductDetail(product)}
                      className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100"
                    >
                      <div className="flex">
                        <div className="w-28 h-28 relative">
                          <img
                            src={product.texturePhotoUrl || product.imageUrl || '/placeholder.png'}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                          {cart.some(item => item.product.id === product.id) && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 p-4">
                          <h4 className="font-semibold text-gray-800">
                            {product.displayTitle || product.name}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {product.briefOverview || product.description}
                          </p>
                          {product.sizeOptions && product.sizeOptions.length > 0 && (
                            <p className="text-xs text-green-600 mt-2 font-medium">
                              {product.sizeOptions.join(' • ')}
                            </p>
                          )}
                        </div>
                        <div className="p-4 flex items-center">
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Continue Button */}
            {cart.length > 0 && (
              <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg"
              >
                <Button
                  size="lg"
                  className="w-full bg-[hsl(142,38%,32%)] hover:bg-[hsl(142,38%,28%)] text-white"
                  onClick={() => setStep('cart')}
                >
                  View Cart ({getTotalItems()} items)
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </motion.div>
            )}
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
                      key={`${item.product.id}-${item.size}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={item.product.texturePhotoUrl || item.product.imageUrl || '/placeholder.png'}
                          alt={item.product.name}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">
                            {item.product.displayTitle || item.product.name}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">{item.size}</p>
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
                  onClick={() => setStep('checkout')}
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
                <span className="font-mono font-semibold">OSW-{Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
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
      </AnimatePresence>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {showProductDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
            onClick={() => setShowProductDetail(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-white w-full rounded-t-3xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white p-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-bold">Add to Cart</h3>
                <button
                  onClick={() => setShowProductDetail(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6">
                <img
                  src={showProductDetail.texturePhotoUrl || showProductDetail.imageUrl || '/placeholder.png'}
                  alt={showProductDetail.name}
                  className="w-full h-48 object-cover rounded-xl mb-4"
                />
                
                <h4 className="text-xl font-bold text-gray-800 mb-2">
                  {showProductDetail.displayTitle || showProductDetail.name}
                </h4>
                
                <p className="text-gray-600 mb-6">
                  {showProductDetail.briefOverview || showProductDetail.description}
                </p>

                {showProductDetail.sizeOptions && showProductDetail.sizeOptions.length > 0 && (
                  <div className="mb-6">
                    <h5 className="font-semibold text-gray-800 mb-3">Select Size</h5>
                    <div className="space-y-2">
                      {showProductDetail.sizeOptions.map((size) => (
                        <Button
                          key={size}
                          variant="outline"
                          className="w-full justify-between"
                          onClick={() => {
                            addToCart(showProductDetail, size);
                          }}
                        >
                          <span>{size}</span>
                          <Plus className="w-4 h-4" />
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <Link to={`/products/${showProductDetail.slug || showProductDetail.name.toLowerCase().replace(/\s+/g, '-')}`}>
                  <Button variant="ghost" className="w-full">
                    View Full Details
                  </Button>
                </Link>
              </div>
            </motion.div>
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
    </div>
  );
};

export default QRLanding;