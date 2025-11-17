import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OptimizedImage } from "@/components/OptimizedImage";
import { getOptimizedImageSrc } from "@/utils/getOptimizedImageSrc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  ShoppingCart,
  Plus,
  Minus,
  Clock,
  MapPin,
  Phone,
  Check,
  Truck,
  ChevronRight,
  Home,
  X,
  User,
  Mail,
  Loader2,
  ArrowRight,
  ChevronDown,
  Trash2,
  CreditCard,
  AlertTriangle,
} from "lucide-react";

interface InventoryOption {
  sizeOption: string;
  quantityAvailable: number;
  quantityReserved?: number;
  price: number;
  displayPrice: number;
}

interface ProductSizePriceOption {
  key: string;
  label: string;
  price?: number;
  priceCents?: number;
  image?: string;
  displayOrder?: number;
}

interface PayAndPickupProduct {
  id: number;
  name: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  texturePhotoUrl?: string;
  displayTitle?: string;
  marketingTitle?: string;
  ingredients?: string;
  recommendedUses?: string;
  targetAudience?: string;
  story?: string;
  usage?: string;
  certifications?: string;
  features?: string;
  additionalImages?: string[];
  sizeOptions: string[];
  payAndPickup?: {
    badge?: string;
    description?: string;
    heroImage?: string;
  };
  sizePriceOptions?: ProductSizePriceOption[];
  inventory: InventoryOption[];
}

interface CartItem {
  product: PayAndPickupProduct;
  quantity: number;
  size: string;
  uniqueKey: string; // Add unique key to prevent mixing
}

interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
}

interface PaymentInfo {
  cardNumber: string;
  expiry: string;
  cvv: string;
}

interface OrderSummary {
  orderId: number;
  orderNumber?: string;
  subtotal: number;
  tax: number;
  total: number;
  estimatedReadyTime?: string;
  items: Array<{
    name: string;
    size: string;
    quantity: number;
    unitPrice: number;
  }>;
}

type Step = "welcome" | "pickup-options" | "menu" | "cart" | "customer-info" | "payment" | "checkout" | "notify-arrival";

const STEP_SEGMENTS: Record<Step, string | null> = {
  welcome: null,
  "pickup-options": "pickup-options",
  menu: "menu",
  cart: "cart",
  "customer-info": "customer-info",
  payment: "payment",
  checkout: "checkout",
  "notify-arrival": "notify-arrival",
};

const SEGMENT_TO_STEP: Record<string, Step> = Object.entries(STEP_SEGMENTS).reduce(
  (acc, [key, segment]) => {
    if (segment) {
      acc[segment] = key as Step;
    }
    return acc;
  },
  {} as Record<string, Step>
);

const stripQueryAndHash = (path: string) => path.split(/[?#]/)[0];

const normalizePath = (path: string) => {
  if (!path) return "/";
  const stripped = stripQueryAndHash(path);
  const ensuredLeadingSlash = stripped.startsWith("/") ? stripped : `/${stripped}`;
  if (ensuredLeadingSlash.length > 1 && ensuredLeadingSlash.endsWith("/")) {
    return ensuredLeadingSlash.replace(/\/+$/, "");
  }
  return ensuredLeadingSlash;
};

const getBasePath = (path: string): "/pay-and-pickup" | "/drive-through" => {
  const normalized = normalizePath(path);
  if (normalized.startsWith("/drive-through")) {
    return "/drive-through";
  }
  return "/pay-and-pickup";
};

const getStepFromLocation = (path: string): Step => {
  const normalized = normalizePath(path);
  if (normalized === "/pay-and-pickup" || normalized === "/drive-through") {
    return "welcome";
  }

  const parts = normalized.split("/").filter(Boolean);
  if (parts.length >= 2 && (parts[0] === "pay-and-pickup" || parts[0] === "drive-through")) {
    const candidate = parts[1];
    return SEGMENT_TO_STEP[candidate] ?? "welcome";
  }

  return "welcome";
};

const buildPathForStep = (basePath: string, step: Step) => {
  const segment = STEP_SEGMENTS[step];
  if (!segment) {
    return basePath;
  }
  return `${basePath}/${segment}`;
};

const TAX_RATE = 0.08;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeInventoryEntry = (entry: any): InventoryOption | null => {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const sizeOption = entry.size_option ?? entry.sizeOption;
  if (typeof sizeOption !== "string" || !sizeOption.trim()) {
    return null;
  }

  const priceValue =
    typeof entry.price === "number"
      ? entry.price
      : typeof entry.price === "string"
        ? Number(entry.price)
        : 0;

  const displayPrice =
    typeof entry.pricing?.final_price === "number"
      ? entry.pricing.final_price
      : priceValue;

  return {
    sizeOption,
    quantityAvailable:
      Number(entry.quantity_available ?? entry.quantityAvailable ?? 0) || 0,
    quantityReserved:
      Number(entry.quantity_reserved ?? entry.quantityReserved ?? 0) || 0,
    price: priceValue || 0,
    displayPrice: displayPrice || priceValue || 0,
  };
};

const normalizeSizePriceOption = (option: any): ProductSizePriceOption | null => {
  if (!option || typeof option !== "object") {
    return null;
  }

  const rawLabel = (option.label ?? option.name ?? "").toString().trim();
  if (!rawLabel) {
    return null;
  }

  const keyCandidate = (option.key ?? slugify(rawLabel)).toString();
  if (!keyCandidate) {
    return null;
  }

  const activeValue =
    option.is_active ?? option.isActive ?? option.active ?? option.enabled ?? option.visible;
  const isActive = activeValue === undefined ? true : Boolean(activeValue);
  if (!isActive) {
    return null;
  }

  let priceCents: number | undefined;
  if (typeof option.price_cents === "number" && Number.isFinite(option.price_cents)) {
    priceCents = option.price_cents;
  } else if (typeof option.priceCents === "number" && Number.isFinite(option.priceCents)) {
    priceCents = option.priceCents;
  } else if (typeof option.price === "number" && Number.isFinite(option.price)) {
    priceCents = Math.round(option.price * 100);
  }

  const displayOrder =
    typeof option.display_order === "number"
      ? option.display_order
      : typeof option.displayOrder === "number"
        ? option.displayOrder
        : undefined;

  return {
    key: keyCandidate,
    label: rawLabel,
    priceCents,
    price: priceCents !== undefined ? priceCents / 100 : undefined,
    image: typeof option.image === "string" ? option.image : undefined,
    displayOrder,
  };
};

const buildPayAndPickupProduct = (product: any): PayAndPickupProduct => {
  const inventory = Array.isArray(product?.inventory)
    ? (product.inventory as any[])
        .map(normalizeInventoryEntry)
        .filter((entry): entry is InventoryOption => Boolean(entry))
    : [];

  const sizePriceOptionsRaw = Array.isArray(product?.size_price_options)
    ? product.size_price_options
    : Array.isArray(product?.sizePriceOptions)
      ? product.sizePriceOptions
      : [];

  const sizePriceOptions = (sizePriceOptionsRaw as any[])
    .map(normalizeSizePriceOption)
    .filter((option): option is ProductSizePriceOption => Boolean(option))
    .sort(
      (a, b) =>
        (a.displayOrder ?? Number.MAX_SAFE_INTEGER) -
        (b.displayOrder ?? Number.MAX_SAFE_INTEGER),
    );

  const configuredSizeOptions =
    sizePriceOptions.length > 0
      ? sizePriceOptions.map((option) => option.label)
      : Array.isArray(product?.available_size_options)
        ? product.available_size_options
        : Array.isArray(product?.availableSizeOptions)
          ? product.availableSizeOptions
          : [];

  const uniqueConfiguredSizes = Array.from(
    new Set((configuredSizeOptions ?? []).filter(Boolean)),
  );

  const fallbackSizes =
    uniqueConfiguredSizes.length > 0
      ? uniqueConfiguredSizes
      : inventory.map((inv) => inv.sizeOption);

  const imageUrl = product?.image_url ?? product?.imageUrl ?? undefined;
  const texturePhotoUrl =
    product?.texture_photo_url ?? product?.texturePhotoUrl ?? undefined;

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    imageUrl,
    texturePhotoUrl,
    displayTitle: product.display_title ?? product.displayTitle,
    marketingTitle: product.marketing_title ?? product.marketingTitle,
    ingredients: product.ingredients,
    recommendedUses: product.recommended_uses ?? product.recommendedUses,
    targetAudience: product.target_audience ?? product.targetAudience,
    story: product.story,
    usage: product.usage,
    certifications: product.certifications,
    features: product.features,
    additionalImages: Array.isArray(product.additional_images)
      ? product.additional_images
      : Array.isArray(product.additionalImages)
        ? product.additionalImages
        : [],
    sizeOptions:
      (fallbackSizes.length > 0 ? fallbackSizes : ["9lb Bag", "25lb Bag", "Bulk (50lb)"]) as string[],
    payAndPickup: {
      badge: product.pay_and_pickup_badge ?? product.payAndPickupBadge,
      description: product.pay_and_pickup_description ?? product.payAndPickupDescription,
      heroImage:
        product.pay_and_pickup_hero_image ??
        product.payAndPickupHeroImage ??
        texturePhotoUrl ??
        imageUrl,
    },
    sizePriceOptions,
    inventory,
  };
};

// Fetch Pay & Pickup products (restored for new system)
const fetchPayAndPickupProducts = async (): Promise<PayAndPickupProduct[]> => {
  const response = await fetch("/api/inventory/products/1?payAndPickup=true");
  if (!response.ok) {
    throw new Error("Failed to load Pay & Pickup products");
  }
  const data = await response.json();
  const items = Array.isArray(data?.products) ? data.products : [];
  return items.map(buildPayAndPickupProduct);
};

const PayAndPickup: React.FC = () => {
  const [location, setLocation] = useLocation();
  const normalizedLocation = normalizePath(location);
  const basePath = getBasePath(normalizedLocation);
  const step = useMemo(() => getStepFromLocation(normalizedLocation), [normalizedLocation]);
  const goToStep = useCallback(
    (nextStep: Step) => {
      const nextPath = buildPathForStep(basePath, nextStep);
      if (nextPath !== normalizedLocation) {
        setLocation(nextPath);
      }
    },
    [basePath, normalizedLocation, setLocation]
  );
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({ name: "", phone: "", email: "" });
  const [errors, setErrors] = useState<Partial<CustomerInfo>>({});
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({ cardNumber: "", expiry: "", cvv: "" });
  const [paymentErrors, setPaymentErrors] = useState<Partial<PaymentInfo>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);

  const {
    data: fetchedProducts = [],
    isLoading: loadingProducts,
    isError: productsError,
    refetch: refetchProducts,
  } = useQuery<PayAndPickupProduct[]>({
    queryKey: ["payAndPickupProducts"],
    queryFn: fetchPayAndPickupProducts,
    staleTime: 60 * 1000,
  });

  const products = fetchedProducts;

  const findProductById = (productId: number) => products.find((product) => product.id === productId);

  const getProductInventory = (productId: number): InventoryOption[] => {
    const product = findProductById(productId);
    return product?.inventory ?? [];
  };

  const getProductPrice = (productId: number, sizeOption: string): number => {
    const inventoryOption = getProductInventory(productId).find((option) => option.sizeOption === sizeOption);
    if (inventoryOption?.displayPrice != null) {
      return inventoryOption.displayPrice;
    }
    if (inventoryOption?.price != null) {
      return inventoryOption.price;
    }

    const product = findProductById(productId);
    const normalizedSize = sizeOption.toLowerCase();
    const sizePriceOption = product?.sizePriceOptions?.find((option) => {
      const labelMatch = option.label?.toLowerCase() === normalizedSize;
      const keyMatch = option.key ? option.key === slugify(sizeOption) : false;
      return labelMatch || keyMatch;
    });

    if (sizePriceOption?.price != null) {
      return sizePriceOption.price;
    }
    if (sizePriceOption?.priceCents != null) {
      return sizePriceOption.priceCents / 100;
    }

    return 0;
  };

  const isInStock = (productId: number, sizeOption: string, quantity = 1): boolean => {
    const inventoryOption = getProductInventory(productId).find((option) => option.sizeOption === sizeOption);
    return (inventoryOption?.quantityAvailable ?? 0) >= quantity;
  };

  // Track Pay & Pickup landing page visit
  useEffect(() => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "pay_pickup_visit", {
        event_category: "engagement",
        event_label: "pay_pickup_landing",
      });
    }
  }, []);

  // Fetch products from database handled by useQuery

  // Ensure each product carries inventory and size info so the list can render without category filtering
  const productsWithInventory = useMemo(() => {
    return products.map((product) => {
      const inventory = getProductInventory(product.id);
      const inventorySizes = inventory.map((inv) => inv.sizeOption).filter(Boolean);
      const configuredSizes =
        Array.isArray(product.sizeOptions) && product.sizeOptions.length > 0
          ? product.sizeOptions
          : (product.sizePriceOptions?.map((option) => option.label).filter(Boolean) ?? []);

      const mergedSizes = configuredSizes.length > 0 ? configuredSizes : inventorySizes;

      return {
        ...product,
        sizeOptions: mergedSizes.length > 0 ? mergedSizes : ["9lb Bag", "25lb Bag", "Bulk (50lb)"],
        inventory,
      };
    });
  }, [products]);

  const getCartSubtotal = () => cart.reduce((sum, item) => sum + getProductPrice(item.product.id, item.size) * item.quantity, 0);

  const cartSubtotal = useMemo(() => Number(getCartSubtotal().toFixed(2)), [cart]);
  const estimatedTax = useMemo(() => Number((cartSubtotal * TAX_RATE).toFixed(2)), [cartSubtotal]);
  const cartTotal = useMemo(() => Number((cartSubtotal + estimatedTax).toFixed(2)), [cartSubtotal, estimatedTax]);

  const addToCart = (product: PayAndPickupProduct, size: string) => {
    const uniqueKey = `${product.id}-${size}`;
    const existingItem = cart.find((item) => item.uniqueKey === uniqueKey);

    if (existingItem) {
      setCart(cart.map((item) => (item.uniqueKey === uniqueKey ? { ...item, quantity: item.quantity + 1 } : item)));
    } else {
      setCart([...cart, { product, quantity: 1, size, uniqueKey }]);
    }
  };

  const updateQuantity = (productId: number, size: string, delta: number) => {
    const uniqueKey = `${productId}-${size}`;
    setCart(
      cart
        .map((item) => {
          if (item.uniqueKey === uniqueKey) {
            const newQuantity = item.quantity + delta;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeItem = (productId: number, size: string) => {
    const uniqueKey = `${productId}-${size}`;
    setCart(cart.filter((item) => item.uniqueKey !== uniqueKey));
  };

  const getTotalItems = () => cart.reduce((sum, item) => sum + item.quantity, 0);

  const toggleProductExpansion = (productId: number) => {
    setExpandedProducts((prev) => {
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
    const cleaned = phone.replace(/\D/g, "");
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  };

  const formatPhoneInput = (value: string) => {
    const phone = value.replace(/\D/g, "");
    if (phone.length <= 3) return phone;
    if (phone.length <= 6) return `(${phone.slice(0, 3)}) ${phone.slice(3)}`;
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6, 10)}`;
  };

  const formatCardNumberInput = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  };

  const formatExpiryInput = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const handleGoHome = () => {
    if (cart.length > 0) {
      const shouldLeave = window.confirm(
        `You have ${getTotalItems()} items in your cart. Are you sure you want to leave? Your cart will be saved for your next visit.`
      );
      if (!shouldLeave) {
        return;
      }
    }
    window.location.href = "/";
  };

  const validatePaymentInfo = (): boolean => {
    const newErrors: Partial<PaymentInfo> = {};

    const cardDigits = paymentInfo.cardNumber.replace(/\D/g, "");
    if (cardDigits.length !== 16) {
      newErrors.cardNumber = "Enter a 16-digit card number";
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(paymentInfo.expiry)) {
      newErrors.expiry = "Use MM/YY format";
    }

    const cvvDigits = paymentInfo.cvv.replace(/\D/g, "");
    if (cvvDigits.length < 3 || cvvDigits.length > 4) {
      newErrors.cvv = "Enter a 3 or 4 digit CVV";
    }

    setPaymentErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatReadyTime = (timestamp?: string) => {
    if (!timestamp) return "Ready in ~15 min";
    try {
      const date = new Date(timestamp);
      if (Number.isNaN(date.getTime())) {
        return "Ready in ~15 min";
      }
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch {
      return "Ready in ~15 min";
    }
  };

  const getLatestOrderNumber = () => {
    if (orderSummary?.orderNumber) return orderSummary.orderNumber;
    if (typeof window !== "undefined") {
      const storedNumber = localStorage.getItem("lastOrderNumber");
      if (storedNumber) return storedNumber;
    }
    if (orderSummary?.orderId) return `#${orderSummary.orderId}`;
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("lastOrderId");
      if (storedId) return `#${storedId}`;
    }
    return `OSW-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  };

  const getLatestItemCount = () => {
    if (orderSummary?.items?.length) {
      return orderSummary.items.reduce((sum, item) => sum + item.quantity, 0);
    }
    return getTotalItems();
  };

  const validateCustomerInfo = (): boolean => {
    const newErrors: Partial<CustomerInfo> = {};

    if (!customerInfo.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!customerInfo.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(customerInfo.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    if (customerInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinueToPayment = () => {
    if (cart.length === 0) {
      alert("Your cart is empty. Please add items before continuing.");
      return;
    }
    if (!validateCustomerInfo()) return;
    setPaymentErrors({});
    goToStep("payment");
  };

  const handleCompletePayment = async () => {
    if (cart.length === 0) {
      alert("Your cart is empty. Please add items before checking out.");
      return;
    }

    if (!validateCustomerInfo()) return;

    setIsProcessing(true);
    try {
      const itemsSnapshot = cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        size: item.size,
        quantity: item.quantity,
        unitPrice: getProductPrice(item.product.id, item.size),
        locationId: 1,
      }));

      // Create Stripe checkout session
      const response = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: itemsSnapshot.map((item) => ({
            productId: item.productId,
            name: item.productName,
            price: item.unitPrice,
            quantity: item.quantity,
            sizeOption: item.size,
            imageUrl: findProductById(item.productId)?.imageUrl,
          })),
          customerInfo: {
            businessName: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone,
          },
          pickupTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
          locationId: 1,
          isQuickOrder: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create checkout session");
      }

      const { sessionId, orderId, confirmationCode, url } = await response.json();

      // Store order info for confirmation page
      localStorage.setItem("qrOrderCustomer", JSON.stringify(customerInfo));
      if (orderId) {
        localStorage.setItem("lastOrderId", orderId);
      }
      if (confirmationCode) {
        localStorage.setItem("lastOrderNumber", confirmationCode);
      }

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Load saved customer info and cart
  useEffect(() => {
    // Load customer info
    const savedCustomer = localStorage.getItem("qrOrderCustomer");
    if (savedCustomer) {
      setCustomerInfo(JSON.parse(savedCustomer));
    }

    // Load cart from localStorage
    const savedCart = localStorage.getItem("qrOrderCart");
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
      } catch (e) {
        console.error("Error loading cart:", e);
      }
    }

    const savedSummary = localStorage.getItem("lastOrderSummary");
    if (savedSummary) {
      try {
        const parsedSummary = JSON.parse(savedSummary);
        setOrderSummary(parsedSummary);
      } catch (e) {
        console.error("Error loading order summary:", e);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem("qrOrderCart", JSON.stringify(cart));
    } else {
      localStorage.removeItem("qrOrderCart");
    }
  }, [cart]);

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Header */}
      <div className="bg-[hsl(142,38%,32%)] text-white sticky top-0 z-50 shadow-lg">
        <div className="px-4 py-3 max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {step !== "welcome" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20 -ml-2"
                  onClick={() => {
                    if (step === "pickup-options" || step === "menu") {
                      goToStep("welcome");
                    } else if (step === "cart") {
                      goToStep("menu");
                    } else if (step === "customer-info") {
                      goToStep("cart");
                    } else if (step === "payment") {
                      goToStep("customer-info");
                    } else if (step === "checkout") {
                      goToStep("customer-info");
                    } else if (step === "notify-arrival") {
                      goToStep("pickup-options");
                    }
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
              )}
              <button
                type="button"
                onClick={handleGoHome}
                className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 rounded"
              >
                <h1 className="text-xl font-black tracking-tight text-white">
                  <span>Organic </span>
                  <span className="text-[hsl(43,85%,55%)]">Soil </span>
                  <span className="text-accent">Wholesale</span>
                </h1>
              </button>
            </div>
            <div className="flex items-center gap-2">
              {step !== "welcome" && (
                <div className="flex items-center gap-3">
                  {cart.length > 0 && (
                    <>
                      <Badge className="bg-[hsl(43,85%,55%)] text-black px-3 py-1">{getTotalItems()} items</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white relative"
                        onClick={() => (step === "cart" ? goToStep("menu") : goToStep("cart"))}
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

      <div className="bg-amber-100 border-b border-amber-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-start gap-3 text-amber-900">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <p className="text-sm lg:text-base font-medium">Under construction, coming soon.</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Welcome Screen */}
        {step === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4"
          >
            <div className="max-w-6xl mx-auto w-full">
              <motion.div initial={{ y: 20 }} animate={{ y: 0 }} transition={{ delay: 0.2 }} className="text-center max-w-md mx-auto lg:max-w-4xl">
                <h1 className="text-2xl lg:text-3xl text-gray-600 mb-3">Welcome to</h1>
                <h2 className="text-5xl lg:text-7xl font-black tracking-tight mb-8">
                  <span>Organic </span>
                  <span className="text-primary">Soil </span>
                  <span className="text-accent italic">Wholesale</span>
                </h2>
                <p className="text-xl lg:text-2xl text-gray-700 mb-8">How can I help you today?</p>

                {/* Action Buttons */}
                <div className="grid lg:grid-cols-2 gap-4 lg:gap-6 mb-8 lg:max-w-4xl mx-auto">
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-xl" />
                    <button
                      className="relative w-full bg-white border border-gray-200 rounded-2xl p-6 lg:p-8 flex items-center gap-4 lg:gap-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
                      onClick={() => goToStep("pickup-options")}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg className="w-8 h-8 lg:w-10 lg:h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="text-xl lg:text-2xl font-bold text-gray-800 mb-1">Order & Pick Up</h3>
                        <p className="text-sm lg:text-base text-gray-600">Pre-order or notify arrival</p>
                      </div>
                      <ChevronRight className="w-6 h-6 lg:w-8 lg:h-8 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="relative">
                    <button
                      className="relative w-full bg-white border border-gray-200 rounded-2xl p-6 lg:p-8 flex items-center gap-4 lg:gap-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
                      onClick={() => goToStep("menu")}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-accent/10 to-accent/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg className="w-8 h-8 lg:w-10 lg:h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="text-xl lg:text-2xl font-bold text-gray-800 mb-1">Walking In</h3>
                        <p className="text-sm lg:text-base text-gray-600">Browse and pick up now</p>
                      </div>
                      <ChevronRight className="w-6 h-6 lg:w-8 lg:h-8 text-gray-400 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                    </button>
                  </motion.div>
                </div>

                {/* Product Categories - Now Clickable */}
                <div className="grid grid-cols-3 lg:grid-cols-3 gap-3 lg:gap-6 mb-6 lg:max-w-2xl mx-auto">
                  {/* Soil Category */}
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedCategory("potting");
                      goToStep("menu");
                    }}
                    className="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow"
                  >
                    <OptimizedImage src="category-potting-soil.jpeg" alt="Potting Soils" className="w-full h-32 lg:h-40 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                      <p className="p-2 lg:p-3 text-white font-semibold text-sm lg:text-base">Potting Soils</p>
                    </div>
                  </motion.button>

                  {/* Amendments Category */}
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedCategory("amendment");
                      goToStep("menu");
                    }}
                    className="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow"
                  >
                    <OptimizedImage src="category-amendments.jpg" alt="Amendments" className="w-full h-32 lg:h-40 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                      <p className="p-2 lg:p-3 text-white font-semibold text-sm lg:text-base">Amendments</p>
                    </div>
                  </motion.button>

                  {/* Mulch Category */}
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedCategory("mulch");
                      goToStep("menu");
                    }}
                    className="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow"
                  >
                    <OptimizedImage src="category-mulch.jpeg" alt="Mulch" className="w-full h-32 lg:h-40 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                      <p className="p-2 lg:p-3 text-white font-semibold text-sm lg:text-base">Mulch</p>
                    </div>
                  </motion.button>
                </div>

                <div className="mt-8 flex flex-col items-center gap-4 lg:gap-6">
                  <div className="flex items-center gap-6 text-sm lg:text-base text-gray-600">
                    <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 lg:px-4 lg:py-2 rounded-full">
                      <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-green-600" />
                      <span className="font-medium">Ready in ~15 min</span>
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.open("https://maps.google.com/?q=Organic+Soil+Wholesale+Phoenix+AZ", "_blank")}
                    className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 lg:px-6 lg:py-3 rounded-full shadow-sm hover:shadow-md transition-all duration-200 group"
                  >
                    <MapPin className="w-4 h-4 lg:w-5 lg:h-5 text-red-500 group-hover:animate-bounce" />
                    <span className="text-sm lg:text-base font-medium text-gray-700">Phoenix, Arizona</span>
                    <ChevronRight className="w-3 h-3 lg:w-4 lg:h-4 text-gray-400" />
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Pickup Options Screen */}
        {step === "pickup-options" && (
          <motion.div
            key="pickup-options"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4"
          >
            <div className="max-w-6xl mx-auto w-full">
              <motion.div
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center max-w-md mx-auto lg:max-w-3xl w-full"
              >
                {/* Pickup Image */}
                <div className="mb-6 lg:mb-8 relative">
                  <OptimizedImage
                    src="organic-wholesale-pickup.png"
                    alt="Wholesale Pickup"
                    className="w-full h-48 lg:h-64 object-cover rounded-2xl shadow-xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl" />
                  <div className="absolute bottom-4 lg:bottom-6 left-4 lg:left-6 text-white">
                    <h2 className="text-2xl lg:text-4xl font-bold">Order & Pick Up</h2>
                    <p className="text-sm lg:text-base opacity-90">Choose your option</p>
                  </div>
                </div>

                <p className="text-xl lg:text-2xl text-gray-700 mb-8 lg:mb-12">How would you like to proceed?</p>

                <div className="grid lg:grid-cols-2 gap-4 lg:gap-6 lg:max-w-4xl mx-auto">
                  {/* Pre-order Option */}
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <button
                      className="w-full bg-white border border-gray-200 rounded-2xl p-6 lg:p-8 flex items-center gap-4 lg:gap-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
                      onClick={() => goToStep("menu")}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <ShoppingCart className="w-8 h-8 lg:w-10 lg:h-10 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="text-xl lg:text-2xl font-bold text-gray-800 mb-1">Pre-Order</h3>
                        <p className="text-sm lg:text-base text-gray-600">Browse products & order for later</p>
                      </div>
                      <ChevronRight className="w-6 h-6 lg:w-8 lg:h-8 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </button>
                  </motion.div>

                  {/* I'm Here Option */}
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <button
                      className="w-full bg-gradient-to-r from-accent to-accent/90 text-white rounded-2xl p-6 lg:p-8 flex items-center gap-4 lg:gap-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
                      onClick={() => goToStep("notify-arrival")}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <MapPin className="w-8 h-8 lg:w-10 lg:h-10 text-white animate-bounce" />
                        </div>
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="text-xl lg:text-2xl font-bold mb-1">I'm Here Now</h3>
                        <p className="text-sm lg:text-base opacity-90">Notify staff of your arrival</p>
                      </div>
                      <ChevronRight className="w-6 h-6 lg:w-8 lg:h-8 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Menu Screen */}
        {step === "menu" && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className={cart.length > 0 ? "pb-32" : "pb-6"}
          >
            {/* Store Info Bar */}
            <div className="bg-white border-b px-4 py-3">
              <div className="max-w-6xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500" />
                  <span className="text-sm lg:text-base font-medium">Pickup at Phoenix Warehouse</span>
                </div>
                <span className="text-sm lg:text-base text-gray-500">Open until 4PM</span>
              </div>
            </div>

            {/* Product List */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-4 py-4 max-w-6xl mx-auto">
              <h2 className="text-lg lg:text-xl font-semibold text-gray-800 mb-4 lg:mb-6">Available Products</h2>

              {productsError ? (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
                  <h3 className="text-lg font-semibold text-destructive">Unable to load Pay &amp; Pickup products</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Check your connection or verify products are enabled in the admin console, then try again.
                  </p>
                  <Button className="mt-4" variant="destructive" onClick={() => refetchProducts()}>
                    Retry
                  </Button>
                </div>
              ) : loadingProducts ? (
                <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
                  {[...Array(4)].map((_, idx) => (
                    <div key={idx} className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6 animate-pulse">
                      <div className="flex gap-4">
                        <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gray-200 rounded-lg" />
                        <div className="flex-1 space-y-3">
                          <div className="h-4 lg:h-5 bg-gray-200 rounded w-1/2" />
                          <div className="h-3 lg:h-4 bg-gray-200 rounded w-3/4" />
                          <div className="h-3 lg:h-4 bg-gray-200 rounded w-1/3" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : productsWithInventory.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No products are currently enabled for Pay &amp; Pickup. Toggle the feature on within the admin product editor to populate this list.
                </div>
              ) : (
                <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
                  {productsWithInventory.map((product) => {
                    const isExpanded = expandedProducts.has(product.id);
                    const cartItems = cart.filter((item) => item.product.id === product.id);
                    const totalInCart = cartItems.reduce((sum, item) => sum + item.quantity, 0);

                    return (
                      <motion.div
                        key={product.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                      >
                        {/* Product Header - Always Visible */}
                        <div className="p-4 lg:p-6 cursor-pointer" onClick={() => toggleProductExpansion(product.id)}>
                          <div className="flex gap-4 lg:gap-6">
                            <OptimizedImage
                              src={product.texturePhotoUrl || product.imageUrl || "placeholder.png"}
                              alt={product.name}
                              className="w-20 h-20 lg:w-24 lg:h-24 rounded-lg object-cover flex-shrink-0"
                            />
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-bold text-gray-900 text-lg lg:text-xl">{product.displayTitle || product.name}</h4>
                                  <p className="text-sm lg:text-base text-gray-600 mt-1 line-clamp-2">{product.story || product.description}</p>
                                </div>
                                <ChevronDown
                                  className={`w-5 h-5 lg:w-6 lg:h-6 text-gray-400 ml-2 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                />
                              </div>

                              {/* Quick Add Button - Show when collapsed */}
                              {!isExpanded && (
                                <div className="mt-3 flex items-center justify-between">
                                  <div className="text-sm">
                                    {product.sizeOptions && product.sizeOptions.length > 0 && (
                                      <span className="text-gray-600">
                                        From{" "}
                                        <span className="font-bold text-green-700">
                                          ${getProductPrice(product.id, product.sizeOptions[0]).toFixed(2)}
                                        </span>
                                      </span>
                                    )}
                                  </div>
                                  {totalInCart > 0 ? (
                                    <Badge className="bg-green-100 text-green-700">{totalInCart} in cart</Badge>
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
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="p-6 bg-gray-50 border-t border-gray-100">
                                {/* Product Description */}
                                {product.description && (
                                  <div className="mb-6">
                                    <h4 className="font-semibold text-gray-900 text-lg mb-2">Product Details</h4>
                                    <p className="text-gray-600 text-base leading-relaxed">{product.description}</p>
                                  </div>
                                )}

                                {/* Size Options */}
                                <div className="space-y-1 mb-4">
                                  <h4 className="font-semibold text-gray-900 text-lg">Select Size & Quantity</h4>
                                  <p className="text-sm text-gray-500">Choose from available options below</p>
                                </div>

                                <div className="space-y-4">
                                  {product.sizeOptions &&
                                    product.sizeOptions.map((size) => {
                                      const uniqueKey = `${product.id}-${size}`;
                                      const cartItem = cart.find((item) => item.uniqueKey === uniqueKey);
                                      const price = getProductPrice(product.id, size);
                                      const inStock = isInStock(product.id, size);
                                      const inventoryData = getProductInventory(product.id);
                                      const inventory = inventoryData.find((inv) => inv.sizeOption === size);

                                      return (
                                        <div
                                          key={uniqueKey}
                                          className={`bg-white rounded-lg p-4 border ${inStock ? "border-gray-200" : "border-red-200 bg-red-50"}`}
                                        >
                                          <div className="flex items-center justify-between gap-4">
                                            <div className="flex-1">
                                              <div className="flex flex-wrap items-baseline gap-2">
                                                <span className="font-medium text-gray-900 text-lg">{size}</span>
                                                {price > 0 && <span className="text-xl font-bold text-green-700">${price.toFixed(2)}</span>}
                                                {inventory && (
                                                  <span className="text-sm text-gray-500">({inventory.quantityAvailable} available)</span>
                                                )}
                                              </div>
                                            </div>

                                            {inStock ? (
                                              cartItem ? (
                                                <div className="flex items-center gap-2">
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      updateQuantity(product.id, size, -1);
                                                    }}
                                                    className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-300 flex items-center justify-center hover:bg-gray-200 transition-colors"
                                                  >
                                                    <Minus className="w-4 h-4" />
                                                  </button>
                                                  <span className="w-16 text-center font-bold text-lg">{cartItem.quantity}</span>
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      updateQuantity(product.id, size, 1);
                                                    }}
                                                    className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-300 flex items-center justify-center hover:bg-gray-200 transition-colors"
                                                    disabled={inventory && cartItem.quantity >= inventory.quantityAvailable}
                                                  >
                                                    <Plus className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              ) : (
                                                <Button
                                                  size="default"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    addToCart(product, size);
                                                  }}
                                                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                                                >
                                                  <Plus className="w-4 h-4 mr-1" />
                                                  Add to Cart
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
                                  <div className="mt-6 pt-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-600 text-base">Total in cart:</span>
                                      <span className="font-bold text-green-700 text-lg">{totalInCart} units</span>
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
              )}
            </motion.div>

            {/* Continue Button - Remove this since we have floating cart button */}
          </motion.div>
        )}

        {/* Cart Screen */}
        {step === "cart" && (
          <motion.div
            key="cart"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="px-4 py-6 max-w-4xl mx-auto"
          >
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-6 lg:mb-8">Your Order</h2>

            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Your cart is empty</p>
                <Button className="mt-4" variant="outline" onClick={() => goToStep("menu")}>
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
                        <OptimizedImage
                          src={item.product.texturePhotoUrl || item.product.imageUrl || "placeholder.png"}
                          alt={item.product.name}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-800">{item.product.displayTitle || item.product.name}</h4>
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
                  onClick={() => goToStep("customer-info")}
                >
                  Continue to Checkout
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>

                <Button variant="ghost" className="w-full mt-3" onClick={() => goToStep("menu")}>
                  Add More Items
                </Button>
              </>
            )}
          </motion.div>
        )}

        {/* Customer Info Screen */}
        {step === "customer-info" && (
          <motion.div
            key="customer-info"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="px-4 py-6 max-w-2xl mx-auto"
          >
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-6 lg:mb-8">Your Information</h2>

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
                    onChange={(e) => setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="John Doe"
                    className={errors.name ? "border-red-500" : ""}
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
                    onChange={(e) => setCustomerInfo((prev) => ({ ...prev, phone: formatPhoneInput(e.target.value) }))}
                    placeholder="(555) 123-4567"
                    className={errors.phone ? "border-red-500" : ""}
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
                    onChange={(e) => setCustomerInfo((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                    className={errors.email ? "border-red-500" : ""}
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
              onClick={handleContinueToPayment}
              disabled={isProcessing}
            >
              Continue to Payment
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        )}

        {/* Payment Screen */}
        {step === "payment" && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="px-4 py-6 max-w-2xl mx-auto"
          >
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-6 lg:mb-8">Secure Payment</h2>

            <Card className="p-6 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Stripe Payment</h3>
                  <p className="text-sm text-gray-600">Secure payment processing powered by Stripe.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Secure Checkout</h4>
                  <p className="text-sm text-gray-600 mb-6">You'll be redirected to Stripe's secure payment page to complete your order.</p>
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <span>Powered by</span>
                    <span className="font-semibold text-blue-600">Stripe</span>
                  </div>
                </div>
              </div>
            </Card>

            <div className="bg-gray-100 rounded-xl p-4 mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">${cartSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tax (8%)</span>
                <span className="font-semibold">${estimatedTax.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-lg">
                <span className="text-gray-800 font-semibold">Total Due</span>
                <span className="font-bold">${cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-green-900">
                Your payment is processed securely by Stripe. You'll receive a confirmation email once your order is ready for pickup.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                className="w-full bg-[hsl(142,38%,32%)] hover:bg-[hsl(142,38%,28%)] text-white"
                onClick={handleCompletePayment}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Proceed to Stripe Checkout
                    <CreditCard className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>

              <Button size="lg" variant="outline" className="w-full" onClick={() => goToStep("customer-info")} disabled={isProcessing}>
                Back to Details
              </Button>
            </div>
          </motion.div>
        )}

        {/* Checkout Screen */}
        {step === "checkout" && (
          <motion.div
            key="checkout"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-4 py-6 max-w-2xl mx-auto"
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
                <span className="font-mono font-semibold">{getLatestOrderNumber()}</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">Pickup Time</span>
                <span className="font-semibold text-green-600">{formatReadyTime(orderSummary?.estimatedReadyTime)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Items</span>
                <span className="font-semibold">{getLatestItemCount()} items</span>
              </div>
              {orderSummary && (
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium">${orderSummary.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Tax</span>
                    <span className="font-medium">${orderSummary.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-base">
                    <span className="text-gray-700 font-semibold">Total Paid</span>
                    <span className="font-semibold">${orderSummary.total.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {orderSummary?.items?.length ? (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
                <h3 className="font-semibold text-gray-800 mb-4">Items in Your Order</h3>
                <div className="space-y-3">
                  {orderSummary.items.map((item, index) => (
                    <div key={`${item.name}-${item.size}-${index}`} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-gray-800">{item.name}</p>
                        <p className="text-gray-500">{item.size}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-500">Qty {item.quantity}</p>
                        <p className="font-semibold">${(item.unitPrice * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="bg-green-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-green-900">
                Our yard crew has been alerted and the admin dashboard shows your order. We'll stage everything so it's ready when you arrive.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Pickup Instructions</h3>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Drive to our warehouse at 123 Industrial Way</li>
                <li>2. Park in the "Online Orders" spot</li>
                <li>3. Call us when you arrive: {formatPhone("8057030091")}</li>
                <li>4. We'll load your order directly into your vehicle</li>
              </ol>
            </div>

            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full bg-[hsl(142,38%,32%)] hover:bg-[hsl(142,38%,28%)] text-white"
                onClick={() => (window.location.href = "tel:+18057030091")}
              >
                <Phone className="w-5 h-5 mr-2" />
                Call When You Arrive
              </Button>

              <Link to="/">
                <Button size="lg" variant="outline" className="w-full">
                  <Home className="w-5 h-5 mr-2" />
                  Back to Website
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Notify Arrival Screen */}
        {step === "notify-arrival" && (
          <motion.div
            key="notify-arrival"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="px-4 py-6 max-w-2xl mx-auto"
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
                onClick={() => (window.location.href = "tel:+18057030091")}
              >
                <Phone className="w-5 h-5 mr-2" />
                Call Now: (805) 703-0091
              </Button>

              <Button size="lg" variant="outline" className="w-full" onClick={() => goToStep("menu")}>
                <ShoppingCart className="w-5 h-5 mr-2" />
                Browse Products Instead
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Cart Button - Fixed position to avoid overlap */}
      {cart.length > 0 && step === "menu" && (
        <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg z-50">
          <div className="container mx-auto max-w-6xl">
            <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white py-6 lg:text-lg" onClick={() => goToStep("cart")}>
              <ShoppingCart className="w-5 h-5 lg:w-6 lg:h-6 mr-2" />
              View Cart ({getTotalItems()} {getTotalItems() === 1 ? "item" : "items"})
              <span className="ml-2 font-bold">
                ${cart.reduce((sum, item) => sum + getProductPrice(item.product.id, item.size) * item.quantity, 0).toFixed(2)}
              </span>
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PayAndPickup;
