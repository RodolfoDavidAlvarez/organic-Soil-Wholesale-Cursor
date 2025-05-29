import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Package, MapPin, CheckCircle2, ChevronRight, Plus, Trash2, Users, Info, TruckIcon, Warehouse, AlertCircle } from "lucide-react";
import { productsData } from "../data/productData";
import { PRODUCT_CATEGORIES, ProductCategory } from "../data/categories";
import { generateCustomerEmail, generateAdminEmail, generateOrderMarkdown } from "../lib/emailTemplates";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProductSelection {
  id: string;
  productId: number;
  sizeOption: string; // Category value
  quantity: number;
  category: string;
  palletGroupId?: string; // For grouping products within the same pallet
}

interface BusinessInfo {
  name: string;
  email: string;
  phone: string;
  deliveryType: "delivery" | "pickup";
  address?: string;
  pickupLocation?: string;
}

interface PalletGroup {
  id: string;
  category: string;
  productIds: string[]; // IDs of ProductSelection objects in this group
  totalUnits: number;
  maxUnits: number;
}

export const OrderForm: React.FC = () => {
  // State management
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    name: "",
    email: "",
    phone: "",
    deliveryType: "delivery",
  });
  const [products, setProducts] = useState<ProductSelection[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [textureLoaded, setTextureLoaded] = useState<{ [key: number]: boolean }>({});
  const [palletGroups, setPalletGroups] = useState<PalletGroup[]>([]);
  const [currentPalletGroupId, setCurrentPalletGroupId] = useState<string | null>(null);

  // Calculate pallet groups whenever products change
  useEffect(() => {
    const palletCategories = PRODUCT_CATEGORIES.filter((cat) => cat.isPalette);
    const groupedProducts: { [key: string]: ProductSelection[] } = {};

    // Group products by pallet group ID
    products.forEach((product) => {
      if (product.palletGroupId) {
        if (!groupedProducts[product.palletGroupId]) {
          groupedProducts[product.palletGroupId] = [];
        }
        groupedProducts[product.palletGroupId].push(product);
      }
    });

    // Create pallet groups
    const newPalletGroups: PalletGroup[] = Object.entries(groupedProducts).map(([id, groupProducts]) => {
      const firstProduct = groupProducts[0];
      const category = firstProduct.category;
      const categoryInfo = PRODUCT_CATEGORIES.find((cat) => cat.value === category);

      let maxUnits = 22; // Default for truckload
      if (category === "boxes") {
        maxUnits = 144; // 144 units per pallet
      } else if (category === "bags") {
        maxUnits = 50; // 50 bags per pallet
      } else if (category === "totes") {
        maxUnits = 22; // 22 totes per truckload
      }

      const totalUnits = groupProducts.reduce((sum, p) => sum + p.quantity, 0);

      return {
        id,
        category,
        productIds: groupProducts.map((p) => p.id),
        totalUnits,
        maxUnits,
      };
    });

    setPalletGroups(newPalletGroups);
  }, [products]);

  // Helper functions
  const addProduct = () => {
    setSelectedProductId(null);
    setSelectedCategory(null);
  };

  const removeProduct = (id: string) => {
    const productToRemove = products.find((p) => p.id === id);

    // Remove the product
    setProducts(products.filter((p) => p.id !== id));

    // Check if this was the last product in a pallet group
    if (productToRemove?.palletGroupId) {
      const remainingInGroup = products.filter((p) => p.palletGroupId === productToRemove.palletGroupId && p.id !== id);

      if (remainingInGroup.length === 0) {
        // This was the last product in this group, remove the group
        setPalletGroups(palletGroups.filter((g) => g.id !== productToRemove.palletGroupId));

        // If this was also the current group, clear it
        if (currentPalletGroupId === productToRemove.palletGroupId) {
          setCurrentPalletGroupId(null);
        }
      }
    }
  };

  const updateProduct = (id: string, updates: Partial<ProductSelection>) => {
    setProducts(products.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  // Check if a product is available for a pickup location
  const isProductAvailableForLocation = (productId: number, location: string) => {
    const product = productsData.find((p) => p.id === productId);

    if (!product) return false;

    // Vicksburg only has Dairy Compost and Worm Castings
    if (location === "vicksburg") {
      return ["ORGANIC DAIRY COMPOST", "ORGANIC WORM CASTINGS"].includes(product.productType);
    }

    // Phoenix and Parker have all products
    return true;
  };

  // Calculate if truckload discount applies
  const getTruckloadDiscountStatus = (groupId: string) => {
    const group = palletGroups.find((g) => g.id === groupId);
    if (!group) return { eligible: false, progress: 0 };

    // Calculate progress as percentage
    const progress = Math.min(100, (group.totalUnits / 22) * 100);
    const eligible = group.totalUnits >= 22;

    return { eligible, progress };
  };

  // Create a new pallet group
  const createNewPalletGroup = (category: string) => {
    const groupId = `pallet-group-${Date.now()}`;
    setCurrentPalletGroupId(groupId);
    return groupId;
  };

  // Product selection handlers
  const handleProductSelect = (productId: number) => {
    setSelectedProductId(productId);
  };

  const handleCategorySelect = (category: string) => {
    if (!selectedProductId) {
      toast.error("Please select a product first");
      return;
    }

    // Validate that the product is compatible with the selected category
    const product = productsData.find((p) => p.id === selectedProductId);
    if (!product) {
      toast.error("Product not found");
      return;
    }

    // Check for bulk pickup - only Dairy Compost and Worm Castings
    if (category === "bulk-pickup" && !["ORGANIC DAIRY COMPOST", "ORGANIC WORM CASTINGS"].includes(product.productType)) {
      toast.error("Only Dairy Compost and Worm Castings are available for bulk pickup");
      return;
    }

    setSelectedCategory(category);

    // Determine if this should be part of a pallet group
    const categoryInfo = PRODUCT_CATEGORIES.find((cat) => cat.value === category);
    let palletGroupId = null;

    if (categoryInfo?.isPalette) {
      if (currentPalletGroupId && palletGroups.find((g) => g.id === currentPalletGroupId)?.category === category) {
        // Continue with the current pallet group if it matches the category
        palletGroupId = currentPalletGroupId;
      } else {
        // Create a new pallet group
        palletGroupId = createNewPalletGroup(category);
      }
    }

    const newProduct: ProductSelection = {
      id: Date.now().toString(),
      productId: selectedProductId,
      sizeOption: category,
      quantity: 1,
      category: category,
      palletGroupId: palletGroupId,
    };

    setProducts([...products, newProduct]);
    setSelectedProductId(null);
    setSelectedCategory(null);
  };

  // Handle adding another product to the same pallet
  const handleAddAnotherProduct = () => {
    setSelectedProductId(null);
    setSelectedCategory(null);
    // Keep the current pallet group active
  };

  // Complete the current pallet and start a new one
  const handleCompletePallet = () => {
    setCurrentPalletGroupId(null);
    setSelectedProductId(null);
    setSelectedCategory(null);
  };

  // Start a new pallet with a different category
  const handleNewPallet = () => {
    setCurrentPalletGroupId(null);
    setSelectedProductId(null);
    setSelectedCategory(null);
  };

  // Form submission handlers
  const handleBusinessInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const handleDeliveryOptionsSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that if bulk delivery was selected, delivery type must be delivery
    const hasBulkDelivery = products.some((p) => p.category === "bulk");
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

      // Group products by pallet group for the order summary
      const groupedProducts = products.reduce((groups: { [key: string]: any[] }, product) => {
        const groupKey = product.palletGroupId || "ungrouped";
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(product);
        return groups;
      }, {});

      const enhancedProducts = products.map((product) => {
        const productData = productsData.find((p) => p.id === product.productId);
        const categoryInfo = PRODUCT_CATEGORIES.find((cat) => cat.value === product.category);

        // Calculate if this product gets a discount
        let hasDiscount = false;
        if (product.palletGroupId) {
          const { eligible } = getTruckloadDiscountStatus(product.palletGroupId);
          hasDiscount = eligible;
        }

        return {
          ...product,
          productName: productData?.productType || "Unknown Product",
          productDescription: productData?.description || "",
          productImageUrl: productData?.imageUrl || "",
          categoryName: categoryInfo?.label || "Standard",
          categoryDescription: categoryInfo?.description || "",
          hasDiscount,
        };
      });

      const orderData = {
        businessInfo,
        products: enhancedProducts,
        palletGroups: palletGroups,
        submittedAt: new Date().toISOString(),
        emails: {
          customer: generateCustomerEmail({
            businessInfo,
            products: enhancedProducts,
            submittedAt: new Date().toISOString(),
          }),
          admin: generateAdminEmail({
            businessInfo,
            products: enhancedProducts,
            submittedAt: new Date().toISOString(),
          }),
        },
        markdown: generateOrderMarkdown({
          businessInfo,
          products: enhancedProducts,
          submittedAt: new Date().toISOString(),
        }),
      };

      // Here you would typically send the order to your backend
      console.log("Order submitted:", orderData);

      setShowThankYou(true);
    } catch (error) {
      console.error("Error submitting order:", error);
      toast.error("There was an error submitting your order. Please try again.");
    } finally {
      setIsSubmitting(false);
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

    // Bulk delivery validation
    const hasBulkDelivery = products.some((p) => p.category === "bulk");
    if (hasBulkDelivery) {
      // Ensure delivery is selected for bulk orders
      if (businessInfo.deliveryType !== "delivery") {
        errors.push("Bulk products require delivery");
      }

      // Ensure only one bulk product is ordered
      const bulkProducts = products.filter((p) => p.category === "bulk");
      if (bulkProducts.length > 1) {
        const uniqueProductIds = new Set(bulkProducts.map((p) => p.productId));
        if (uniqueProductIds.size > 1) {
          errors.push("Bulk delivery orders must contain only one product type");
        }
      }
    }

    return errors;
  };

  // Category selection component
  const renderCategorySelection = () => {
    if (!selectedProductId) return null;

    const selectedProduct = productsData.find((p) => p.id === selectedProductId);
    if (!selectedProduct) return null;

    // Filter categories based on product compatibility
    // For example, only specific products can be sold as bulk pickup
    const compatibleCategories = PRODUCT_CATEGORIES.filter((category) => {
      if (category.value === "bulk-pickup") {
        return ["ORGANIC DAIRY COMPOST", "ORGANIC WORM CASTINGS"].includes(selectedProduct.productType);
      }
      return true;
    });

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md mx-auto p-6 bg-white rounded-xl shadow-xl">
          <h3 className="text-xl font-bold mb-4">Select Size Category for {selectedProduct.productType}</h3>
          <p className="text-sm text-gray-500 mb-4">Choose how you want to purchase this product</p>

          <div className="grid grid-cols-1 gap-3 mb-6">
            {compatibleCategories.map((category) => (
              <Button
                key={category.value}
                onClick={() => handleCategorySelect(category.value)}
                variant="outline"
                className="flex items-center justify-between p-4 h-auto"
              >
                <div className="flex items-center gap-3">
                  <category.icon className="h-5 w-5" />
                  <div className="text-left">
                    <p className="font-medium">{category.label}</p>
                    <p className="text-xs text-gray-500">{category.description}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Button>
            ))}
          </div>

          <Button variant="outline" className="w-full" onClick={() => setSelectedProductId(null)}>
            Cancel
          </Button>
        </Card>
      </div>
    );
  };

  const renderProductSelection = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Step 1: Product & Size Selection</h2>
        <p className="text-gray-500">Choose the products and packaging options for your order.</p>
      </div>

      {/* Pallet Groups Progress */}
      {palletGroups.length > 0 && (
        <div className="mb-6 space-y-4">
          <h3 className="font-semibold text-lg">Your Pallet Groups</h3>
          {palletGroups.map((group) => {
            const categoryInfo = PRODUCT_CATEGORIES.find((cat) => cat.value === group.category);
            const discountStatus = getTruckloadDiscountStatus(group.id);

            return (
              <Card key={group.id} className={`p-4 ${currentPalletGroupId === group.id ? "border-green-500 border-2" : ""}`}>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {categoryInfo?.icon && <categoryInfo.icon className="h-5 w-5" />}
                      <h4 className="font-medium">{categoryInfo?.label || "Pallet Group"}</h4>
                      {currentPalletGroupId === group.id && <Badge className="bg-green-600">Active</Badge>}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setCurrentPalletGroupId(group.id)} className="text-xs">
                      {currentPalletGroupId === group.id ? "Current" : "Continue This Pallet"}
                    </Button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Progress toward truckload (22 units)</span>
                      <span className={discountStatus.eligible ? "text-green-600 font-medium" : ""}>{group.totalUnits} / 22 units</span>
                    </div>
                    <Progress value={discountStatus.progress} className="h-2" />
                    {discountStatus.eligible && (
                      <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Truckload discount eligible! (20% off)
                      </p>
                    )}
                  </div>

                  <div className="text-sm text-gray-500">
                    {group.productIds.length} {group.productIds.length === 1 ? "product" : "products"} in this group
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {productsData.map((product) => (
          <Card
            key={product.id}
            className={`overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg group ${
              selectedProductId === product.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => handleProductSelect(product.id)}
          >
            <div className="h-48 bg-neutral-200 rounded-b-xl relative">
              {product.additionalImages?.[0] && (
                <div className="absolute inset-0">
                  {!textureLoaded[product.id] && (
                    <div className="absolute inset-0 bg-neutral-200 animate-pulse flex items-center justify-center">
                      <div className="h-8 w-8 text-neutral-400 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                    </div>
                  )}
                  <img
                    src={product.additionalImages[0]}
                    alt={`${product.name} texture`}
                    className={`w-full h-full object-cover transition-all duration-700 ${
                      textureLoaded[product.id] ? "opacity-100 blur-0" : "opacity-0 blur-sm"
                    }`}
                    loading="lazy"
                    onLoad={() => setTextureLoaded((prev) => ({ ...prev, [product.id]: true }))}
                  />
                </div>
              )}
              {product.imageUrl && (
                <div className="absolute bottom-3 right-3 flex flex-col items-end z-20">
                  <span className="mb-1 text-xs bg-white px-2 py-0.5 rounded-full shadow-md text-primary font-semibold">9lb Bag</span>
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border-2 border-white shadow-lg bg-neutral-200 relative transform transition-transform duration-300 group-hover:scale-110 hover:scale-125">
                    <img src={product.imageUrl} alt={`${product.name} 9lb bag preview`} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-medium text-lg mb-1">{product.productType}</h3>
              <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline" className="text-primary border-primary">
                  {product.category}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Selected Products */}
      {products.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Selected Products</h3>

            {/* Pallet Actions */}
            {currentPalletGroupId && (
              <div className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" onClick={handleAddAnotherProduct} className="flex items-center gap-1">
                        <Plus className="h-4 w-4" /> Add Another Product
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add another product to this pallet group</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" onClick={handleCompletePallet} className="flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Complete Pallet
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Finish this pallet and continue ordering</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" onClick={handleNewPallet} className="flex items-center gap-1">
                        <Package className="h-4 w-4" /> New Pallet
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Start a new pallet with a different category</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {products.map((product) => {
              const productData = productsData.find((p) => p.id === product.productId);
              const categoryInfo = PRODUCT_CATEGORIES.find((c) => c.value === product.category);

              // Determine if this product is in the current active pallet group
              const isInActivePalletGroup = currentPalletGroupId && product.palletGroupId === currentPalletGroupId;

              return (
                <Card key={product.id} className={`p-4 ${isInActivePalletGroup ? "border-l-4 border-l-green-500" : ""}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {productData && (
                        <div className="relative w-12 h-12">
                          <img src={productData.imageUrl} alt={productData.productType} className="w-full h-full object-cover rounded" />
                          {productData.additionalImages?.[0] && (
                            <img
                              src={productData.additionalImages[0]}
                              alt={`${productData.name} texture`}
                              className="absolute inset-0 w-full h-full object-cover rounded opacity-0 hover:opacity-100 transition-opacity duration-300"
                            />
                          )}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{productData?.productType}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          {categoryInfo && (
                            <>
                              <categoryInfo.icon className="h-4 w-4" />
                              <span>{categoryInfo.label}</span>
                            </>
                          )}
                          {product.palletGroupId && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Group {palletGroups.findIndex((g) => g.id === product.palletGroupId) + 1}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min="1"
                        value={product.quantity}
                        onChange={(e) => updateProduct(product.id, { quantity: parseInt(e.target.value) || 1 })}
                        className="w-20"
                      />
                      <Button variant="ghost" size="sm" onClick={() => removeProduct(product.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-end mt-6">
        <Button onClick={() => setStep(2)} disabled={products.length === 0} className="bg-green-600 hover:bg-green-700">
          Continue to Contact Info
        </Button>
      </div>

      {/* Category Selection Modal */}
      {selectedProductId && renderCategorySelection()}
    </div>
  );

  const renderContactInfo = () => (
    <form onSubmit={handleBusinessInfoSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Step 2: Contact Information</h2>
        <p className="text-gray-500">Let us know how to reach you for your order.</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
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

      <div className="flex justify-between gap-4 mt-8">
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
    const hasBulkDelivery = products.some((p) => p.category === "bulk");

    return (
      <form onSubmit={handleDeliveryOptionsSubmit} className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Step 3: Pickup vs. Delivery</h2>
          <p className="text-gray-500">Choose how you'd like to receive your order.</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Delivery Type</Label>
                <div className="grid grid-cols-2 gap-4">
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
                    <AlertCircle className="h-4 w-4" />
                    Bulk orders require delivery. Pickup is not available.
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
                      <Info className="h-4 w-4" />
                      Vicksburg location only offers Dairy Compost and Worm Castings in bulk format
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between gap-4 mt-8">
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
    // Group products by pallet group
    const groupedByPallet: { [key: string]: ProductSelection[] } = {};
    products.forEach((product) => {
      const key = product.palletGroupId || "ungrouped";
      if (!groupedByPallet[key]) {
        groupedByPallet[key] = [];
      }
      groupedByPallet[key].push(product);
    });

    return (
      <form onSubmit={handleSubmitOrder} className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Step 4: Review Your Order</h2>
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
              <p>
                <strong>Business Name:</strong> {businessInfo.name}
              </p>
              <p>
                <strong>Email:</strong> {businessInfo.email}
              </p>
              <p>
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

          {/* Product Details - Grouped by Pallet */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              Product Details
            </h3>

            {Object.entries(groupedByPallet).map(([groupId, groupProducts]) => {
              // Get the category for this group
              const firstProduct = groupProducts[0];
              const categoryInfo = PRODUCT_CATEGORIES.find((cat) => cat.value === firstProduct.category);
              const isPalletGroup = groupId !== "ungrouped";

              // Calculate discount eligibility for this group
              let discountInfo = { eligible: false, progress: 0 };
              if (isPalletGroup) {
                discountInfo = getTruckloadDiscountStatus(groupId);
              }

              // Calculate subtotals (placeholder prices for demo)
              const totalUnits = groupProducts.reduce((sum, p) => sum + p.quantity, 0);

              return (
                <Card key={groupId} className="p-4">
                  <div className="mb-3 pb-2 border-b">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {categoryInfo?.icon && <categoryInfo.icon className="h-5 w-5" />}
                        <h4 className="font-medium">{isPalletGroup ? `${categoryInfo?.label} Group` : "Individual Products"}</h4>
                      </div>
                      {isPalletGroup && (
                        <Badge className={discountInfo.eligible ? "bg-green-600" : "bg-gray-200 text-gray-700"}>
                          {discountInfo.eligible ? "20% Truckload Discount" : "Standard Rate"}
                        </Badge>
                      )}
                    </div>

                    {isPalletGroup && (
                      <div className="text-sm text-gray-600 mt-1">
                        <span>Total: {totalUnits} units</span>
                        {totalUnits >= 22 && <span className="ml-2 text-green-600">(Full truckload)</span>}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {groupProducts.map((product) => {
                      const productData = productsData.find((p) => p.id === product.productId);

                      return (
                        <div key={product.id} className="flex items-start gap-4">
                          {productData && (
                            <img src={productData.imageUrl} alt={productData.productType} className="w-12 h-12 object-cover rounded-md" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-green-800">{productData?.productType}</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mt-1">
                              <p>
                                <strong>Size:</strong> {categoryInfo?.label}
                              </p>
                              <p>
                                <strong>Quantity:</strong> {product.quantity}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
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

        <div className="flex justify-between gap-4 mt-8">
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
            setSelectedCategory(null);
            setPalletGroups([]);
            setCurrentPalletGroupId(null);
          }}
          className="bg-green-600 hover:bg-green-700"
        >
          Place Another Order
        </Button>
      </div>
    </div>
  );

  if (showThankYou) {
    return renderThankYou();
  }

  return (
    <div className="container mx-auto px-4 py-8">
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
