import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Package,
  CheckCircle2,
  ChevronRight,
  Trash2,
  Users,
  Info,
  TruckIcon,
  Warehouse,
  AlertCircle,
  InfoIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { productsData } from "../data/productData";
import { PRODUCT_CATEGORIES, ProductCategory } from "../data/categories";
import { generateCustomerEmail, generateAdminEmail, generateOrderMarkdown } from "../lib/emailTemplates";

const WEBHOOK_URL = "https://hook.us1.make.com/bm4eqe7ie77vxt06gx2529x97ecgh28e";

// Group products by "Type" field (Amendment, Potting, Specialty) from product information
const productsByCategory: Record<string, typeof productsData> = {};
productsData.forEach((product) => {
  const productType = product.type || "Other";
  if (!productsByCategory[productType]) {
    productsByCategory[productType] = [];
  }
  productsByCategory[productType].push(product);
});

// Create category map for display with proper naming and ordering
const DISPLAY_CATEGORIES = Object.keys(productsByCategory)
  .filter((category) => category !== "Discarded product")
  .sort((a, b) => {
    // Custom sorting to ensure important categories come first
    const order = { Amendment: 1, Potting: 2, Specialty: 3, Other: 4 };
    return (order[a] || 999) - (order[b] || 999);
  })
  .map((category) => ({
    id: category.toLowerCase().replace(/\s/g, "-"),
    name: category,
    products: productsByCategory[category],
  }));

interface ProductSelection {
  id: string;
  productId: number;
  sizeOption: string;
  quantity: number;
}

interface BusinessInfo {
  name: string;
  email: string;
  phone: string;
  deliveryType: "delivery" | "pickup";
  address?: string;
  pickupLocation?: string;
}

export const OrderForm: React.FC = () => {
  // State management
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    name: "Development Test Business",
    email: "rodolfodavid110@gmail.com",
    phone: "928-550-1649",
    deliveryType: "delivery",
    address: "123 Test Street, Phoenix, AZ 85001",
  });
  const [products, setProducts] = useState<ProductSelection[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedSizeCategory, setSelectedSizeCategory] = useState<string | null>(null);

  // Refs for scrolling
  const orderSummaryRef = useRef<HTMLDivElement>(null);

  // Helper functions
  const removeProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  const updateProduct = (id: string, updates: Partial<ProductSelection>) => {
    setProducts(products.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  // Category and product selection handlers
  const handleCategorySelect = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
    setSelectedProductId(null);
    setSelectedSizeCategory(null);
  };

  const handleProductSelect = (productId: number) => {
    setSelectedProductId(productId);
  };

  const handleSizeCategorySelect = (category: string) => {
    if (!selectedProductId) {
      toast.error("Please select a product first");
      return;
    }

    // Check for bulk pickup - only Dairy Compost and Worm Castings
    const product = productsData.find((p) => p.id === selectedProductId);
    if (!product) {
      toast.error("Product not found");
      return;
    }

    if (category === "bulk-pickup" && !["ORGANIC DAIRY COMPOST", "ORGANIC WORM CASTINGS"].includes(product.productType)) {
      toast.error("Only Dairy Compost and Worm Castings are available for bulk pickup");
      return;
    }

    const newProduct: ProductSelection = {
      id: Date.now().toString(),
      productId: selectedProductId,
      sizeOption: category,
      quantity: 1,
    };

    setProducts([...products, newProduct]);
    setSelectedProductId(null);
    setSelectedSizeCategory(null);

    // Highlight the order summary
    if (orderSummaryRef.current) {
      orderSummaryRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
      orderSummaryRef.current.classList.add("highlight-order");
      setTimeout(() => {
        orderSummaryRef.current?.classList.remove("highlight-order");
      }, 1500);
    }
  };

  // Form submission handlers
  const handleBusinessInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const handleDeliveryOptionsSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that if bulk delivery was selected, delivery type must be delivery
    const hasBulkDelivery = products.some((p) => p.sizeOption === "bulk");
    if (hasBulkDelivery && businessInfo.deliveryType !== "delivery") {
      toast.error("Bulk orders require delivery. Please select delivery option.");
      return;
    }

    // Validate pickup location restrictions
    if (businessInfo.deliveryType === "pickup" && businessInfo.pickupLocation === "vicksburg") {
      const invalidProducts = products.filter((p) => {
        const product = productsData.find((pd) => pd.id === p.productId);
        return !["ORGANIC DAIRY COMPOST", "ORGANIC WORM CASTINGS"].includes(product?.productType || "");
      });

      if (invalidProducts.length > 0) {
        toast.error("Only Dairy Compost and Worm Castings are available for pickup at Vicksburg");
        return;
      }
    }

    setStep(4);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    if (e) e.preventDefault();

    const validationErrors = validateOrder();
    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error));
      return;
    }

    try {
      setIsSubmitting(true);

      const enhancedProducts = products.map((product) => {
        const productData = productsData.find((p) => p.id === product.productId);
        const categoryInfo = PRODUCT_CATEGORIES.find((cat) => cat.value === product.sizeOption);

        return {
          ...product,
          productName: productData?.productType || "Unknown Product",
          productDescription: productData?.description || "",
          productImageUrl: productData?.imageUrl || "",
          categoryName: categoryInfo?.label || "Standard",
          categoryDescription: categoryInfo?.description || "",
          category: product.sizeOption,
        };
      });

      // Format product list for email
      const productsString = enhancedProducts.map((p) => `${p.productName} - ${p.categoryName} - Quantity: ${p.quantity}`).join("; ");

      // Create simple format of products
      const productSummary = enhancedProducts
        .map((product) => {
          return `Product: ${product.productName}, Size: ${product.categoryName}, Quantity: ${product.quantity}`;
        })
        .join("\n");

      // Prepare the full order data
      const fullOrderData = {
        businessInfo,
        products: enhancedProducts,
        submittedAt: new Date().toISOString(),
      };

      // Order data for webhook - simplified format
      const orderData = {
        formType: "Product Order",
        formIdentifier: "main-order-form",
        name: businessInfo.name,
        email: businessInfo.email,
        phone: businessInfo.phone,
        address: businessInfo.deliveryType === "delivery" ? businessInfo.address : "",
        pickupLocation: businessInfo.deliveryType === "pickup" ? businessInfo.pickupLocation : "",
        deliveryType: businessInfo.deliveryType,
        products: productSummary,
        orderDetails: JSON.stringify(fullOrderData),
        emails: {
          admin: {
            subject: `New Order from ${businessInfo.name}`,
            html: generateAdminEmail(fullOrderData),
          },
          customer: {
            subject: "Your Order with Organic Soil Wholesale",
            html: generateCustomerEmail(fullOrderData),
          },
        },
      };

      console.log("Submitting order data to webhook:", JSON.stringify(orderData));

      try {
        const response = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(orderData),
        });

        if (!response.ok) {
          throw new Error(`Failed to submit order: ${response.status} ${response.statusText}`);
        }

        const responseText = await response.text();
        console.log("Webhook response:", responseText);

        setShowThankYou(true);
        toast.success("Order submitted successfully!");
      } catch (error) {
        console.error("Error submitting order:", error);
        toast.error("There was an error submitting your order. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      toast.error("There was an error submitting your order. Please try again.");
    }
  };

  // Validation
  const validateOrder = (): string[] => {
    const errors: string[] = [];

    if (products.length === 0) {
      errors.push("Please add at least one product to your order");
    }

    // Check for basic info
    if (!businessInfo.name) errors.push("Business name is required");
    if (!businessInfo.email) errors.push("Email address is required");
    if (!businessInfo.phone) errors.push("Phone number is required");

    // Check for delivery and pickup
    if (businessInfo.deliveryType === "delivery" && !businessInfo.address) {
      errors.push("Delivery address is required");
    }

    if (businessInfo.deliveryType === "pickup" && !businessInfo.pickupLocation) {
      errors.push("Pickup location is required");
    }

    // Vicksburg location validation
    if (businessInfo.deliveryType === "pickup" && businessInfo.pickupLocation === "vicksburg") {
      const invalidProducts = products.filter((p) => {
        const product = productsData.find((pd) => pd.id === p.productId);
        return !["ORGANIC DAIRY COMPOST", "ORGANIC WORM CASTINGS"].includes(product?.productType || "");
      });

      if (invalidProducts.length > 0) {
        errors.push("Only Dairy Compost and Worm Castings are available for pickup at Vicksburg");
      }
    }

    return errors;
  };

  // Category Card Component
  const CategoryCard = ({ category }: { category: { id: string; name: string; products: typeof productsData } }) => {
    const featuredProduct = category.products[0];
    const isExpanded = expandedCategory === category.id;

    // Create a friendly display name for the category
    const getCategoryDisplayName = (categoryName: string): string => {
      switch (categoryName) {
        case "Amendment":
          return "Soil Amendments";
        case "Potting":
          return "Potting Soils";
        case "Specialty":
          return "Specialty Blends";
        default:
          return categoryName;
      }
    };

    const categoryDisplayName = getCategoryDisplayName(category.name);

    return (
      <div className={`mb-6 rounded-lg ${isExpanded ? "ring-2 ring-green-500" : ""}`}>
        <Card
          className={`overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md ${
            isExpanded ? "border-green-500" : "border-gray-200"
          }`}
          onClick={() => handleCategorySelect(category.id)}
        >
          <div className="flex p-4 items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-neutral-100 rounded-md relative overflow-hidden flex-shrink-0">
              {featuredProduct.additionalImages?.[0] ? (
                <img
                  src={featuredProduct.additionalImages[0]}
                  alt={`${featuredProduct.productType} texture`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                featuredProduct.imageUrl && (
                  <img src={featuredProduct.imageUrl} alt={featuredProduct.productType} className="w-full h-full object-cover" loading="lazy" />
                )
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-base sm:text-lg mb-1">{categoryDisplayName}</h4>
                {isExpanded ? <ChevronUp className="h-5 w-5 text-green-600" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mb-2">{category.products.length} products available</p>
              <Badge variant="outline" className="text-xs text-primary border-primary">
                {categoryDisplayName}
              </Badge>
            </div>
          </div>
        </Card>

        {isExpanded && (
          <div className="mt-4 space-y-4">
            <div className="p-3 bg-green-50 border border-green-100 rounded-md">
              <h5 className="font-medium text-green-800 mb-1">Select a {categoryDisplayName} Product</h5>
              <p className="text-xs text-green-700">Choose from our premium {categoryDisplayName.toLowerCase()} below</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category.products.map((product) => (
                <Card
                  key={product.id}
                  className={`overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedProductId === product.id ? "ring-2 ring-green-500 shadow-md" : "border border-gray-200"
                  }`}
                  onClick={() => handleProductSelect(product.id)}
                >
                  <div className="flex p-3 items-center gap-3">
                    <div className="w-16 h-16 bg-neutral-100 rounded-md relative overflow-hidden flex-shrink-0">
                      {product.additionalImages?.[0] ? (
                        <img
                          src={product.additionalImages[0]}
                          alt={`${product.productType} texture`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        product.imageUrl && (
                          <img src={product.imageUrl} alt={product.productType} className="w-full h-full object-cover" loading="lazy" />
                        )
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm mb-1 truncate">{product.productType}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2">{product.description}</p>
                      <Badge variant="outline" className="text-xs text-primary border-primary">
                        {product.name}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderProductSelection = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Select Your Products</h2>
        <p className="text-gray-500">Choose your products, packaging options, and quantities.</p>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left column - Categories and Products */}
        <div className="lg:w-2/3">
          {/* Info Banner */}
          <Card className="bg-green-50 border-green-200 mb-6 p-4">
            <div className="flex gap-3">
              <InfoIcon className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800 mb-1">Truckload Discount Available</p>
                <p className="text-sm text-green-700">
                  Get 20% off on a full truckload of pallets (22 pallets). Mix and match products within the same category for volume discounts!
                </p>
              </div>
            </div>
          </Card>

          {/* Category Section */}
          <div className="mb-8">
            <div className="p-3 bg-green-50 border border-green-100 rounded-md mb-4">
              <h3 className="font-medium text-green-800">Step 1: Select a Product Category</h3>
              <p className="text-xs text-green-700 mt-1">Click on a category to see available products</p>
            </div>
            <div className="space-y-4">
              {DISPLAY_CATEGORIES.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </div>

        {/* Right column - Order Summary */}
        <div className="lg:w-1/3">
          <div className="lg:sticky lg:top-4 space-y-4">
            <Card ref={orderSummaryRef} className="border border-gray-200 shadow-sm transition-all duration-500">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-medium">Your Order</h3>
                <p className="text-xs text-gray-500 mt-1">Select products and packaging options</p>
              </div>

              <div className="p-4">
                {products.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No products selected yet</p>
                    <p className="text-xs mt-1">Select a category, then a product to begin your order</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {products.map((product) => {
                      const productData = productsData.find((p) => p.id === product.productId);
                      const categoryInfo = PRODUCT_CATEGORIES.find((c) => c.value === product.sizeOption);

                      return (
                        <div key={product.id} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                          <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0 relative">
                            {productData?.imageUrl && (
                              <img src={productData.imageUrl} alt={productData.productType} className="w-full h-full object-cover" loading="lazy" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <p className="font-medium text-sm truncate max-w-[150px] md:max-w-[180px]">{productData?.productType}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeProduct(product.id);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                              </Button>
                            </div>
                            <div className="flex items-center text-xs text-gray-500 gap-1 mb-2">
                              {categoryInfo?.icon && <categoryInfo.icon className="h-3 w-3 flex-shrink-0" />}
                              <span className="truncate">{categoryInfo?.label}</span>
                            </div>
                            <div className="flex items-center">
                              <Label htmlFor={`quantity-${product.id}`} className="text-xs mr-2">
                                Qty:
                              </Label>
                              <Input
                                id={`quantity-${product.id}`}
                                type="number"
                                min="1"
                                value={product.quantity}
                                onChange={(e) => updateProduct(product.id, { quantity: parseInt(e.target.value) || 1 })}
                                className="h-7 text-xs w-16"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="p-4 border-t">
                <Button onClick={() => setStep(2)} disabled={products.length === 0} className="bg-green-600 hover:bg-green-700 w-full">
                  Continue to Contact Info
                </Button>
              </div>
            </Card>

            {selectedProductId && (
              <Card className="border border-green-200 bg-green-50">
                <div className="p-4">
                  <h3 className="font-medium text-green-800 mb-2 line-clamp-1">
                    Select Packaging Option for {productsData.find((p) => p.id === selectedProductId)?.productType}
                  </h3>
                  <div className="space-y-2">
                    {PRODUCT_CATEGORIES.map((category) => {
                      // Check if this category is compatible with the selected product
                      const product = productsData.find((p) => p.id === selectedProductId);
                      let isCompatible = true;

                      if (category.value === "bulk-pickup" && product) {
                        isCompatible = ["ORGANIC DAIRY COMPOST", "ORGANIC WORM CASTINGS"].includes(product.productType);
                      }

                      if (!isCompatible) return null;

                      return (
                        <Button
                          key={category.value}
                          onClick={() => handleSizeCategorySelect(category.value)}
                          variant="outline"
                          className="flex items-center justify-between w-full p-3 h-auto text-left bg-white hover:bg-gray-50 overflow-hidden"
                        >
                          <div className="flex items-start gap-3 w-full max-w-full">
                            <div className="w-8 h-8 bg-white rounded border border-gray-100 overflow-hidden flex-shrink-0 relative">
                              <div className="w-full h-full flex items-center justify-center">
                                <category.icon className="h-4 w-4 text-green-600" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 overflow-hidden mr-2">
                              <p className="font-medium text-sm truncate">{category.label}</p>
                              <p className="text-xs text-gray-500 line-clamp-1">{category.description}</p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderContactInfo = () => (
    <form onSubmit={handleBusinessInfoSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Contact Information</h2>
        <p className="text-gray-500">Let us know how to reach you for your order.</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={businessInfo.name}
                onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
                required
                placeholder="Enter your business name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={businessInfo.email}
                onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                required
                placeholder="Enter your email address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={businessInfo.phone}
                onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                required
                placeholder="Enter your phone number"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
        <Button type="button" variant="outline" onClick={() => setStep(1)}>
          Back to Products
        </Button>
        <Button type="submit" className="bg-green-600 hover:bg-green-700">
          Continue to Delivery
        </Button>
      </div>
    </form>
  );

  const renderDeliveryOptions = () => {
    // Check if user has bulk products which require delivery
    const hasBulkDelivery = products.some((p) => p.sizeOption === "bulk");

    return (
      <form onSubmit={handleDeliveryOptionsSubmit} className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Delivery Options</h2>
          <p className="text-gray-500">Choose how you'd like to receive your order.</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Delivery Type</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant={businessInfo.deliveryType === "delivery" ? "default" : "outline"}
                    className={businessInfo.deliveryType === "delivery" ? "bg-green-600 hover:bg-green-700" : ""}
                    onClick={() => setBusinessInfo({ ...businessInfo, deliveryType: "delivery" })}
                  >
                    <TruckIcon className="mr-2 h-4 w-4" />
                    Delivery
                  </Button>
                  <Button
                    type="button"
                    variant={businessInfo.deliveryType === "pickup" ? "default" : "outline"}
                    className={businessInfo.deliveryType === "pickup" ? "bg-green-600 hover:bg-green-700" : ""}
                    onClick={() => setBusinessInfo({ ...businessInfo, deliveryType: "pickup", pickupLocation: "" })}
                    disabled={hasBulkDelivery}
                  >
                    <Warehouse className="mr-2 h-4 w-4" />
                    Pickup
                  </Button>
                </div>

                {hasBulkDelivery && businessInfo.deliveryType !== "delivery" && (
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>Bulk orders require delivery. Pickup is not available.</span>
                  </div>
                )}
              </div>

              {businessInfo.deliveryType === "delivery" ? (
                <div className="space-y-2">
                  <Label htmlFor="address">Delivery Address</Label>
                  <Input
                    id="address"
                    value={businessInfo.address || ""}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                    required
                    placeholder="Enter your delivery address"
                  />
                  <p className="text-xs text-gray-500 mt-1">Please provide a complete address including street, city, state, and zip code</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="pickupLocation">Pickup Location</Label>
                  <select
                    id="pickupLocation"
                    value={businessInfo.pickupLocation || ""}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, pickupLocation: e.target.value })}
                    required
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Select a location</option>
                    <option value="phoenix">Phoenix</option>
                    <option value="parker">Parker</option>
                    <option value="vicksburg">Vicksburg (Bulk Only: Dairy Compost, Worm Castings)</option>
                  </select>

                  {businessInfo.pickupLocation === "vicksburg" && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700 flex items-center gap-2">
                      <Info className="h-4 w-4 flex-shrink-0" />
                      <span>Vicksburg location only offers Dairy Compost and Worm Castings in bulk format</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
          <Button type="button" variant="outline" onClick={() => setStep(2)}>
            Back to Contact Info
          </Button>
          <Button type="submit" className="bg-green-600 hover:bg-green-700">
            Review Order
          </Button>
        </div>
      </form>
    );
  };

  const renderOrderReview = () => {
    return (
      <form onSubmit={handleSubmitOrder} className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Review Your Order</h2>
          <p className="text-gray-500">Please review your order details before submitting.</p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Contact Information */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Contact Information
            </h3>
            <Card className="p-4">
              <p className="mb-2">
                <strong>Business Name:</strong> {businessInfo.name}
              </p>
              <p className="mb-2">
                <strong>Email:</strong> {businessInfo.email}
              </p>
              <p className="mb-2">
                <strong>Phone:</strong> {businessInfo.phone}
              </p>
              {businessInfo.deliveryType === "delivery" && (
                <p>
                  <strong>Delivery Address:</strong> {businessInfo.address}
                </p>
              )}
              {businessInfo.deliveryType === "pickup" && (
                <p>
                  <strong>Pickup Location:</strong>{" "}
                  {businessInfo.pickupLocation === "phoenix"
                    ? "Phoenix"
                    : businessInfo.pickupLocation === "parker"
                      ? "Parker"
                      : businessInfo.pickupLocation === "vicksburg"
                        ? "Vicksburg"
                        : businessInfo.pickupLocation}
                </p>
              )}
            </Card>
          </div>

          {/* Product Details */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              Product Details
            </h3>

            <Card className="p-4 space-y-4">
              {products.map((product) => {
                const productData = productsData.find((p) => p.id === product.productId);
                const categoryInfo = PRODUCT_CATEGORIES.find((c) => c.value === product.sizeOption);

                return (
                  <div key={product.id} className="flex flex-col sm:flex-row items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
                    {productData && <img src={productData.imageUrl} alt={productData.productType} className="w-16 h-16 object-cover rounded-md" />}
                    <div className="flex-1">
                      <p className="font-medium text-green-800 mb-2">{productData?.productType}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <p className="mb-1">
                          <strong>Size Category:</strong> {categoryInfo?.label}
                        </p>
                        <p className="mb-1">
                          <strong>Quantity:</strong> {product.quantity}
                        </p>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">{categoryInfo?.description}</div>
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>

          {/* Estimated Lead Times */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Info className="h-5 w-5 text-green-600" />
              Estimated Lead Times
            </h3>
            <Card className="p-4">
              <ul className="list-disc pl-5 space-y-1">
                <li>Standard pallet orders: 1-3 business days</li>
                <li>Full truckload orders: 2-5 business days</li>
                <li>Bulk delivery orders: 3-7 business days</li>
              </ul>
              <p className="text-sm text-gray-500 mt-3">A team member will contact you within one business day to confirm exact timing.</p>
            </Card>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
          <Button type="button" variant="outline" onClick={() => setStep(3)}>
            Back to Delivery
          </Button>
          <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Place Order"}
          </Button>
        </div>
      </form>
    );
  };

  const renderThankYou = () => (
    <div className="text-center space-y-6">
      <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
      <h2 className="text-2xl font-bold text-gray-900">Thank You for Your Order!</h2>
      <p className="text-gray-600 max-w-md mx-auto">
        We've received your order and will process it shortly. Our team will contact you to confirm the details and discuss delivery arrangements.
      </p>
      <div className="space-y-4">
        <p className="text-sm text-gray-500">Order Reference: {Date.now().toString().slice(-6)}</p>
        <Button
          onClick={() => {
            setShowThankYou(false);
            setStep(1);
            setBusinessInfo({
              name: "",
              email: "",
              phone: "",
              deliveryType: "delivery",
            });
            setProducts([]);
            setSelectedProductId(null);
            setExpandedCategory(null);
            setSelectedSizeCategory(null);
          }}
          className="bg-green-600 hover:bg-green-700"
        >
          Place Another Order
        </Button>
      </div>
    </div>
  );

  // Add CSS styles for the highlight effect
  useEffect(() => {
    const styleEl = document.createElement("style");
    const css = `
      @keyframes highlight-pulse {
        0% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.2); }
        70% { box-shadow: 0 0 0 10px rgba(22, 163, 74, 0); }
        100% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
      }
      .highlight-order {
        animation: highlight-pulse 1.5s ease-out;
        border-color: #16a34a !important;
      }
    `;
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  if (showThankYou) {
    return renderThankYou();
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      {/* Progress Steps */}
      <div className="mb-8 hidden sm:block">
        <div className="flex justify-between max-w-3xl mx-auto mb-2">
          {[
            { step: 1, title: "Product Selection" },
            { step: 2, title: "Contact Info" },
            { step: 3, title: "Delivery Options" },
            { step: 4, title: "Review Order" },
          ].map((s) => (
            <div
              key={s.step}
              className={`flex flex-col items-center ${s.step === step ? "text-green-600" : s.step < step ? "text-gray-600" : "text-gray-400"}`}
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  s.step === step ? "bg-green-600 text-white" : s.step < step ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                }`}
              >
                {s.step < step ? <CheckCircle2 className="h-5 w-5" /> : s.step}
              </div>
              <span className="text-xs mt-1">{s.title}</span>
            </div>
          ))}
        </div>
        <div className="relative max-w-3xl mx-auto">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-200 mt-4 mx-4">
            <div className="h-full bg-green-600 transition-all duration-300" style={{ width: `${((step - 1) / 3) * 100}%` }} />
          </div>
        </div>
      </div>

      {step === 1 && renderProductSelection()}
      {step === 2 && renderContactInfo()}
      {step === 3 && renderDeliveryOptions()}
      {step === 4 && renderOrderReview()}
    </div>
  );
};
