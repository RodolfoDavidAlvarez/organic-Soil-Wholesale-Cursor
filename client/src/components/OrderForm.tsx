import React, { useState } from "react";
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
  InfoIcon
} from "lucide-react";
import { productsData } from "../data/productData";
import { PRODUCT_CATEGORIES } from "../data/categories";
import { generateCustomerEmail, generateAdminEmail, generateOrderMarkdown } from "../lib/emailTemplates";

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
    name: "",
    email: "",
    phone: "",
    deliveryType: "delivery",
  });
  const [products, setProducts] = useState<ProductSelection[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [textureLoaded, setTextureLoaded] = useState<{ [key: number]: boolean }>({});

  // Helper functions
  const removeProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  const updateProduct = (id: string, updates: Partial<ProductSelection>) => {
    setProducts(products.map((p) => (p.id === id ? { ...p, ...updates } : p)));
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
    
    // Check for bulk pickup - only Dairy Compost and Worm Castings
    const product = productsData.find(p => p.id === selectedProductId);
    if (!product) {
      toast.error("Product not found");
      return;
    }
    
    if (category === "bulk-pickup" && 
        !["ORGANIC DAIRY COMPOST", "ORGANIC WORM CASTINGS"].includes(product.productType)) {
      toast.error("Only Dairy Compost and Worm Castings are available for bulk pickup");
      return;
    }
    
    const newProduct: ProductSelection = {
      id: Date.now().toString(),
      productId: selectedProductId,
      sizeOption: category,
      quantity: 1
    };
    
    setProducts([...products, newProduct]);
    setSelectedProductId(null);
  };

  // Form submission handlers
  const handleBusinessInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const handleDeliveryOptionsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that if bulk delivery was selected, delivery type must be delivery
    const hasBulkDelivery = products.some(p => p.sizeOption === "bulk");
    if (hasBulkDelivery && businessInfo.deliveryType !== "delivery") {
      toast.error("Bulk orders require delivery. Please select delivery option.");
      return;
    }
    
    // Validate pickup location restrictions
    if (businessInfo.deliveryType === "pickup" && businessInfo.pickupLocation === "vicksburg") {
      const invalidProducts = products.filter(p => {
        const product = productsData.find(pd => pd.id === p.productId);
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
          categoryDescription: categoryInfo?.description || ""
        };
      });

      const orderData = {
        businessInfo,
        products: enhancedProducts,
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

    return errors;
  };

  // No separate category selection modal needed anymore

  const renderProductSelection = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Step 1: Product & Size Selection</h2>
        <p className="text-gray-500">Choose the products and packaging options for your order.</p>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left column - Products */}
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

          <h3 className="font-medium text-lg mb-4">Select a Product</h3>
          
          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {productsData.map((product) => (
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
                    ) : product.imageUrl && (
                      <img 
                        src={product.imageUrl} 
                        alt={product.productType} 
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm mb-1 truncate">{product.productType}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">{product.description}</p>
                    <Badge variant="outline" className="text-xs text-primary border-primary">
                      {product.category}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right column - Order Summary */}
        <div className="lg:w-1/3">
          <Card className="border border-gray-200 shadow-sm">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-medium">Your Order</h3>
              <p className="text-xs text-gray-500 mt-1">Select products and packaging options</p>
            </div>
            
            <div className="p-4">
              {products.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No products selected yet</p>
                  <p className="text-xs mt-1">Select a product to begin your order</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {products.map((product) => {
                    const productData = productsData.find((p) => p.id === product.productId);
                    const categoryInfo = PRODUCT_CATEGORIES.find((c) => c.value === product.sizeOption);

                    return (
                      <div key={product.id} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                        <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0 relative">
                          {/* Show the appropriate size category image with product texture */}
                          {product.sizeOption === "boxes" && (
                            <div className="relative w-full h-full">
                              <img 
                                src="https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FSize%20Categories%2FSize%20Categories-%20Pallet%20of%20Box.png?alt=media&token=730d72a2-62b1-4a53-bd67-426f7224772e" 
                                alt="Pallet of boxes" 
                                className="w-full h-full object-cover brightness-90"
                              />
                              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20"></div>
                              <div className="absolute bottom-0 right-0 w-4 h-4 bg-white rounded-tl overflow-hidden">
                                {productData?.additionalImages?.[0] && (
                                  <img 
                                    src={productData.additionalImages[0]} 
                                    alt="Product texture" 
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                            </div>
                          )}
                          {product.sizeOption === "bags" && (
                            <div className="relative w-full h-full">
                              <img 
                                src="https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FSize%20Categories%2FSize%20Category%20-%20pallet%20of%20bags.png?alt=media&token=4ff026e5-7318-4c35-869a-a1bc0a3ff94d" 
                                alt="Pallet of bags" 
                                className="w-full h-full object-cover brightness-90"
                              />
                              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20"></div>
                              <div className="absolute bottom-0 right-0 w-4 h-4 bg-white rounded-tl overflow-hidden">
                                {productData?.additionalImages?.[0] && (
                                  <img 
                                    src={productData.additionalImages[0]} 
                                    alt="Product texture" 
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                            </div>
                          )}
                          {product.sizeOption === "totes" && (
                            <div className="relative w-full h-full">
                              <img 
                                src="https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FSize%20Categories%2F2.2%20CY%20Tote%20(supersack).png?alt=media&token=dd8560dc-e9b2-4cc2-a0bf-e6f4fccc630e" 
                                alt="2.2 CY Tote" 
                                className="w-full h-full object-cover brightness-90"
                              />
                              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20"></div>
                              <div className="absolute bottom-0 right-0 w-4 h-4 bg-white rounded-tl overflow-hidden">
                                {productData?.additionalImages?.[0] && (
                                  <img 
                                    src={productData.additionalImages[0]} 
                                    alt="Product texture" 
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                            </div>
                          )}
                          {product.sizeOption === "bulk" && (
                            <div className="relative w-full h-full">
                              <img 
                                src="https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FSize%20Categories%2FBulk%20delivery.png?alt=media&token=5c59cabf-aa01-4745-9026-51ee7ab8f195"
                                alt="Bulk delivery"
                                className="w-full h-full object-cover brightness-90"
                              />
                              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20"></div>
                              <div className="absolute bottom-0 right-0 w-4 h-4 bg-white rounded-tl overflow-hidden">
                                {productData?.additionalImages?.[0] && (
                                  <img 
                                    src={productData.additionalImages[0]} 
                                    alt="Product texture" 
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                            </div>
                          )}
                          {product.sizeOption === "bulk-pickup" && (
                            <div className="relative w-full h-full">
                              <img 
                                src="https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FSize%20Categories%2FCY%20of%20Bulk%20for%20pick%20only.png?alt=media&token=9d2cb829-c265-426e-9147-4d79835f6e0f"
                                alt="Bulk pickup"
                                className="w-full h-full object-cover brightness-90"
                              />
                              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20"></div>
                              <div className="absolute bottom-0 right-0 w-4 h-4 bg-white rounded-tl overflow-hidden">
                                {productData?.additionalImages?.[0] && (
                                  <img 
                                    src={productData.additionalImages[0]} 
                                    alt="Product texture" 
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Fallback if we don't have a specific image */}
                          {!["boxes", "bags", "totes", "bulk", "bulk-pickup"].includes(product.sizeOption) && (
                            productData?.additionalImages?.[0] ? (
                              <img
                                src={productData.additionalImages[0]}
                                alt={`${productData.productType} texture`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : productData?.imageUrl && (
                              <img
                                src={productData.imageUrl}
                                alt={productData.productType}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            )
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-medium text-sm truncate max-w-[180px]">{productData?.productType}</p>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeProduct(product.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </div>
                          <div className="flex items-center text-xs text-gray-500 gap-1 mb-2">
                            {categoryInfo?.icon && <categoryInfo.icon className="h-3 w-3 flex-shrink-0" />}
                            <span className="truncate">{categoryInfo?.label}</span>
                          </div>
                          <div className="flex items-center">
                            <Label htmlFor={`quantity-${product.id}`} className="text-xs mr-2">Qty:</Label>
                            <Input
                              id={`quantity-${product.id}`}
                              type="number"
                              min="1"
                              value={product.quantity}
                              onChange={(e) => updateProduct(product.id, { quantity: parseInt(e.target.value) || 1 })}
                              className="h-7 text-xs w-16"
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
              <Button 
                onClick={() => setStep(2)} 
                disabled={products.length === 0} 
                className="bg-green-600 hover:bg-green-700 w-full"
              >
                Continue to Contact Info
              </Button>
            </div>
          </Card>
          
          {selectedProductId && (
            <div className="mt-4">
              <Card className="border border-green-200 bg-green-50">
                <div className="p-4">
                  <h3 className="font-medium text-green-800 mb-2 line-clamp-1">
                    Select Packaging Option for {productsData.find(p => p.id === selectedProductId)?.productType}
                  </h3>
                  <div className="space-y-2">
                    {PRODUCT_CATEGORIES.map(category => {
                      // Check if this category is compatible with the selected product
                      const product = productsData.find(p => p.id === selectedProductId);
                      let isCompatible = true;
                      
                      if (category.value === "bulk-pickup" && product) {
                        isCompatible = ["ORGANIC DAIRY COMPOST", "ORGANIC WORM CASTINGS"].includes(product.productType);
                      }
                      
                      if (!isCompatible) return null;
                      
                      return (
                        <Button 
                          key={category.value}
                          onClick={() => handleCategorySelect(category.value)}
                          variant="outline"
                          className="flex items-center justify-between w-full p-3 h-auto text-left bg-white hover:bg-gray-50 overflow-hidden"
                        >
                          <div className="flex items-start gap-3 w-full max-w-full">
                            <div className="w-12 h-12 bg-white rounded border border-gray-100 overflow-hidden flex-shrink-0 relative">
                              {/* Show appropriate category image */}
                              {category.value === "boxes" && (
                                <div className="relative w-full h-full">
                                  <img 
                                    src="https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FSize%20Categories%2FSize%20Categories-%20Pallet%20of%20Box.png?alt=media&token=730d72a2-62b1-4a53-bd67-426f7224772e" 
                                    alt="Pallet of boxes" 
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-white rounded-tl overflow-hidden border border-gray-200">
                                    <img 
                                      src={productsData.find(p => p.id === selectedProductId)?.imageUrl} 
                                      alt="9lb bag" 
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                </div>
                              )}
                              {category.value === "bags" && (
                                <div className="relative w-full h-full">
                                  <img 
                                    src="https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FSize%20Categories%2FSize%20Category%20-%20pallet%20of%20bags.png?alt=media&token=4ff026e5-7318-4c35-869a-a1bc0a3ff94d" 
                                    alt="Pallet of bags" 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              {category.value === "totes" && (
                                <img 
                                  src="https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FSize%20Categories%2F2.2%20CY%20Tote%20(supersack).png?alt=media&token=dd8560dc-e9b2-4cc2-a0bf-e6f4fccc630e" 
                                  alt="2.2 CY Tote" 
                                  className="w-full h-full object-cover"
                                />
                              )}
                              {category.value === "bulk" && (
                                <img 
                                  src="https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FSize%20Categories%2FBulk%20delivery.png?alt=media&token=5c59cabf-aa01-4745-9026-51ee7ab8f195" 
                                  alt="Bulk delivery" 
                                  className="w-full h-full object-cover"
                                />
                              )}
                              {category.value === "bulk-pickup" && (
                                <img 
                                  src="https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FSize%20Categories%2FCY%20of%20Bulk%20for%20pick%20only.png?alt=media&token=9d2cb829-c265-426e-9147-4d79835f6e0f" 
                                  alt="Bulk pickup" 
                                  className="w-full h-full object-cover"
                                />
                              )}
                              {/* If no image available, show the icon */}
                              {!["boxes", "bags", "totes", "bulk", "bulk-pickup"].includes(category.value) && (
                                <div className="w-full h-full flex items-center justify-center">
                                  <category.icon className="h-6 w-6 text-green-600" />
                                </div>
                              )}
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
            </div>
          )}
        </div>
      </div>
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
    const hasBulkDelivery = products.some(p => p.sizeOption === "bulk");
    
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
                  <p className="text-xs text-gray-500 mt-1">
                    Please provide a complete address including street, city, state, and zip code
                  </p>
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
                  <strong>Pickup Location:</strong> {businessInfo.pickupLocation === "phoenix" ? "Phoenix" : 
                    businessInfo.pickupLocation === "parker" ? "Parker" : 
                    businessInfo.pickupLocation === "vicksburg" ? "Vicksburg" : 
                    businessInfo.pickupLocation}
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
              <div className="bg-green-50 border border-green-100 p-3 rounded-md text-sm text-green-800">
                <div className="flex items-center gap-2 mb-1">
                  <InfoIcon className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Truckload Discount</span>
                </div>
                <p>Orders of 22 or more pallets of the same category qualify for a 20% discount.</p>
              </div>
              
              {products.map((product) => {
                const productData = productsData.find((p) => p.id === product.productId);
                const categoryInfo = PRODUCT_CATEGORIES.find((c) => c.value === product.sizeOption);

                return (
                  <div key={product.id} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
                    {productData && (
                      <img src={productData.imageUrl} alt={productData.productType} className="w-16 h-16 object-cover rounded-md" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-green-800">{productData?.productType}</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mt-2">
                        <p>
                          <strong>Size Category:</strong> {categoryInfo?.label}
                        </p>
                        <p>
                          <strong>Quantity:</strong> {product.quantity}
                        </p>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {categoryInfo?.description}
                      </div>
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
              <p className="text-sm text-gray-500 mt-3">
                A team member will contact you within one business day to confirm exact timing.
              </p>
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
              className={`flex flex-col items-center ${
                s.step === step ? "text-green-600" : 
                s.step < step ? "text-gray-600" : "text-gray-400"
              }`}
            >
              <div 
                className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  s.step === step ? "bg-green-600 text-white" : 
                  s.step < step ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                }`}
              >
                {s.step < step ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  s.step
                )}
              </div>
              <span className="text-xs mt-1">{s.title}</span>
            </div>
          ))}
        </div>
        <div className="relative max-w-3xl mx-auto">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-200 mt-4 mx-4">
            <div 
              className="h-full bg-green-600 transition-all duration-300" 
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />
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