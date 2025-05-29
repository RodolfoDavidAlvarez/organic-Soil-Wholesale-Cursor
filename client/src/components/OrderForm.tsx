import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  MapPin,
  Package,
  Truck,
  Box,
  Plus,
  Trash2,
  CheckCircle2,
  Search,
  Users,
  Info,
  ChevronRight,
  ArrowRight,
  ShoppingCart,
  X,
} from "lucide-react";
import { productsData } from "@/data/productData";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface BusinessInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  deliveryType: "pickup" | "delivery";
  pickupLocation?: string;
}

interface ProductSelection {
  id: string;
  productId: number;
  sizeOption: string;
  quantity: number;
  isFullTruckload: boolean;
  category?: string; // For storing the size category (boxes, totes, bulk)
  paletteGroupId?: string; // For grouping products in the same mixed palette
}

const steps = [
  { label: "Products", icon: Package },
  { label: "Contact Info", icon: Users },
  { label: "Delivery Type", icon: Truck },
  { label: "Review", icon: CheckCircle2 },
];

// Development prefills
const DEV_PREFILLS = {
  businessInfo: {
    name: "Test Business",
    email: "test@business.com",
    phone: "555-0123",
    address: "123 Test St, Phoenix, AZ 85001",
    deliveryType: "delivery" as const,
  },
  initialProducts: [
    { id: "1", productId: 1, sizeOption: "1CF Bag", quantity: 2, isFullTruckload: false },
    { id: "2", productId: 2, sizeOption: "9 LB Bag", quantity: 5, isFullTruckload: false },
  ],
};

const LOCATIONS = [
  {
    id: "phoenix",
    name: "Phoenix Location",
    address: "1634 N 19th Ave, Phoenix AZ 85009",
    coordinates: "33°28'04.6\"N 112°06'03.4\"W",
    capacity: "All products and size categories",
    mapUrl: "https://maps.app.goo.gl/TkrzEwmyxXqPeNGeA",
  },
  {
    id: "parker",
    name: "Parker Location",
    address: "18980 Stanton Rd, Congress, AZ 85332",
    coordinates: "34°10'42.1\"N 112°47'18.2\"W",
    capacity: "All products and size categories",
    mapUrl: "https://maps.app.goo.gl/TkrzEwmyxXqPeNGeA",
  },
  {
    id: "vicksburg",
    name: "Vicksburg Arizona",
    address: "Vicksburg, AZ",
    coordinates: "33°42'13.9\"N 113°46'39.8\"W",
    capacity: "Only dairy compost bulk in truckload and cubic yards for pickup",
    mapUrl: "https://maps.app.goo.gl/TkrzEwmyxXqPeNGeA",
  },
];

const PRODUCT_CATEGORIES = [
  {
    value: "boxes",
    label: "Pallet of Boxes",
    icon: Box,
    description: "144 units / 36 boxes (4 units per box)",
    imageUrl:
      "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FSize%20Categories%2FSize%20Categories-%20Pallet%20of%20Box.png?alt=media&token=730d72a2-62b1-4c53-bd67-426f7224772e",
    isPalette: true,
  },
  {
    value: "bags",
    label: "Pallet of Bags",
    icon: Package,
    description: "50 bags (1cf Bags)",
    imageUrl:
      "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FSize%20Categories%2FSize%20Category%20-%20pallet%20of%20bags.png?alt=media&token=4ff026e5-7318-4c35-869a-a1bc0a3ff94d",
    isPalette: true,
  },
  {
    value: "totes",
    label: "2.2 CY Tote",
    icon: Package,
    description: "Single 2.2 CY Tote (supersack)",
    imageUrl:
      "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FSize%20Categories%2F2.2%20CY%20Tote%20(supersack).png?alt=media&token=dd8560dc-e9b2-4cc2-a0bf-e4f4fccc630e",
    isPalette: true,
  },
  {
    value: "bulk",
    label: "Bulk Delivery",
    icon: Truck,
    description: "Compost and blends: 22-24 tons per truckload\nPotting soil: 90-110 CYs per truckload",
    imageUrl:
      "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FSize%20Categories%2FBulk%20delivery.png?alt=media&token=5c59cabf-aa01-4745-9026-51ee7ab8f195",
    isPalette: false,
  },
  {
    value: "bulk-pickup",
    label: "Bulk Pickup",
    icon: Truck,
    description: "Bulk In Cubic Yard for pickup only",
    imageUrl:
      "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FSize%20Categories%2FCY%20of%20Bulk%20for%20pick%20only.png?alt=media&token=9d2cb829-c265-426e-9147-4d79835f6e0f",
    isPalette: false,
  },
  {
    value: "truckload-totes",
    label: "Truckload of Totes",
    icon: Truck,
    description: "Full Truckload example, 22 pallets of 2.2CY totes",
    imageUrl:
      "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FSize%20Categories%2FTruckload%20of%20totes.png?alt=media&token=436d5a5d-a7aa-4aca-8318-e8bc98eab972",
    isPalette: true,
  },
];

const WEBHOOK_URL = "https://hook.us1.make.com/bm4eqe7ie77vxt06gx2529x97ecgh28e";

const MIXED_PALETTE_IMAGE =
  "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FSize%20Categories%2Fmixed-palette-view.png?alt=media&token=YOUR_TOKEN";

const generateCustomerEmail = (orderData: any) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .order-details { margin: 20px 0; }
        .product-item { margin: 10px 0; padding: 15px; background: #f9f9f9; border-radius: 6px; }
        .product-image { width: 100%; max-width: 120px; height: auto; border-radius: 4px; margin-bottom: 10px; }
        .product-grid { display: grid; grid-template-columns: 120px 1fr; gap: 15px; align-items: center; }
        .discount-badge { display: inline-block; background-color: #e8f5e9; color: #2e7d32; padding: 3px 8px; border-radius: 12px; font-size: 12px; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Thank You for Your Order!</h1>
        </div>
        <div class="content">
            <p>Dear ${orderData.businessInfo.name},</p>
            <p>Thank you for choosing Organic Soil Wholesale. We're excited to process your order for your Arizona landscaping needs!</p>
            
            <div class="order-details">
                <h2>Order Details</h2>
                <p><strong>Order Reference:</strong> ${orderData.submittedAt.slice(-6)}</p>
                <p><strong>Order Date:</strong> ${new Date(orderData.submittedAt).toLocaleDateString()}</p>
                
                <h3>Products Ordered:</h3>
                ${orderData.products
                  .map((product: any) => {
                    const productData = productsData.find((p) => p.id === product.productId);
                    const categoryInfo = PRODUCT_CATEGORIES.find((cat) => cat.value === product.category);
                    return `
                    <div class="product-item">
                        <div class="product-grid">
                            ${productData ? `<img src="${productData.imageUrl}" alt="${productData.name}" class="product-image">` : ""}
                            <div>
                                <h4 style="margin-top: 0; margin-bottom: 8px;">${productData ? productData.productType : "Product"}</h4>
                                <p><strong>Category:</strong> ${categoryInfo?.label || "Standard"}</p>
                                <p><strong>Size Option:</strong> ${product.sizeOption}</p>
                                <p><strong>Quantity:</strong> ${product.quantity}</p>
                                ${product.isFullTruckload ? "<p><span class='discount-badge'>Full Truckload: 20% discount applied</span></p>" : ""}
                            </div>
                        </div>
                        ${categoryInfo ? `<p style="margin-top: 10px; font-size: 12px; color: #666;"><strong>Package Type:</strong> ${categoryInfo.description}</p>` : ""}
                    </div>
                `;
                  })
                  .join("")}
            </div>

            <p>Our team will contact you shortly to confirm the details and discuss delivery arrangements for your Arizona landscaping project.</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} Organic Soil Wholesale. Your premier Arizona soil supplier.</p>
        </div>
    </div>
</body>
</html>
`;

const generateAdminEmail = (orderData: any) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2C3E50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .order-details { margin: 20px 0; }
        .product-item { margin: 10px 0; padding: 15px; background: #f9f9f9; border-radius: 6px; }
        .customer-info { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 6px; }
        .product-image { width: 100%; max-width: 120px; height: auto; border-radius: 4px; margin-right: 15px; }
        .product-grid { display: grid; grid-template-columns: 120px 1fr; gap: 15px; align-items: center; }
        .discount-badge { display: inline-block; background-color: #e8f5e9; color: #2e7d32; padding: 3px 8px; border-radius: 12px; font-size: 12px; margin-top: 5px; }
        .category-image { max-width: 100px; margin-top: 10px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Landscaper Order Received</h1>
        </div>
        <div class="content">
            <div class="customer-info">
                <h2>Customer Information</h2>
                <p><strong>Business Name:</strong> ${orderData.businessInfo.name}</p>
                <p><strong>Email:</strong> ${orderData.businessInfo.email}</p>
                <p><strong>Phone:</strong> ${orderData.businessInfo.phone}</p>
                <p><strong>Delivery Address:</strong> ${orderData.businessInfo.address}</p>
            </div>
            
            <div class="order-details">
                <h2>Order Details</h2>
                <p><strong>Order Reference:</strong> ${orderData.submittedAt.slice(-6)}</p>
                <p><strong>Order Date:</strong> ${new Date(orderData.submittedAt).toLocaleDateString()}</p>
                <p><strong>Total Products:</strong> ${orderData.products.length}</p>
                
                <h3>Products Ordered:</h3>
                ${orderData.products
                  .map((product: any) => {
                    const productData = productsData.find((p) => p.id === product.productId);
                    const categoryInfo = PRODUCT_CATEGORIES.find((cat) => cat.value === product.category);
                    const discountApplied = product.isFullTruckload ? "20% discount" : "No discount";

                    return `
                    <div class="product-item">
                        <div class="product-grid">
                            ${productData ? `<img src="${productData.imageUrl}" alt="${productData.productType}" class="product-image">` : ""}
                            <div>
                                <h4 style="margin-top: 0; margin-bottom: 8px;">${productData ? productData.productType : "Product"}</h4>
                                <p><strong>Product ID:</strong> ${product.productId}</p>
                                <p><strong>Size Category:</strong> ${categoryInfo?.label || "Standard"}</p>
                                <p><strong>Size Option:</strong> ${product.sizeOption}</p>
                                <p><strong>Quantity:</strong> ${product.quantity}</p>
                                <p><strong>Discount:</strong> ${discountApplied}</p>
                            </div>
                        </div>
                        
                        ${
                          categoryInfo
                            ? `
                        <div style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 10px;">
                            <p><strong>Package Info:</strong> ${categoryInfo.description}</p>
                            <img src="${categoryInfo.imageUrl}" alt="${categoryInfo.label}" class="category-image">
                        </div>
                        `
                            : ""
                        }
                        
                        ${
                          productData && productData.additionalImages && productData.additionalImages.length > 0
                            ? `
                        <div style="margin-top: 10px;">
                            <p><strong>Additional Product Image:</strong></p>
                            <img src="${productData.additionalImages[0]}" alt="${productData.productType} texture" style="max-width: 100px; border-radius: 4px;">
                        </div>
                        `
                            : ""
                        }
                    </div>
                `;
                  })
                  .join("")}
            </div>

            <p><strong>Action Required:</strong> Please contact the customer to confirm the order and arrange delivery to their Arizona location.</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} Organic Soil Wholesale. Your premier Arizona soil supplier.</p>
        </div>
    </div>
</body>
</html>
`;

const generateOrderMarkdown = (orderData: any) => `
# Landscaper Order Details - ${new Date(orderData.submittedAt).toLocaleDateString()}

## Customer Information
- **Business Name:** ${orderData.businessInfo.name}
- **Email:** ${orderData.businessInfo.email}
- **Phone:** ${orderData.businessInfo.phone}
- **Delivery Address:** ${orderData.businessInfo.address}

## Order Summary
- **Order Reference:** ${orderData.submittedAt.slice(-6)}
- **Order Date:** ${new Date(orderData.submittedAt).toLocaleDateString()}
- **Total Products:** ${orderData.products.length}
- **Location:** Arizona

## Products Ordered
${orderData.products
  .map((product: any, index: number) => {
    const productInfo = productsData.find((p) => p.id === product.productId);
    const categoryInfo = PRODUCT_CATEGORIES.find((cat) => cat.value === product.category);

    return `
### Product ${index + 1}: ${productInfo?.productType || "Product"}
- **Product ID:** ${product.productId}
- **Description:** ${productInfo?.description || ""}
- **Size Category:** ${categoryInfo?.label || "Standard"}
- **Size Option:** ${product.sizeOption}
- **Quantity:** ${product.quantity}
- **Discount:** ${product.isFullTruckload ? "20% (Full Truckload)" : "None"}
- **Package Details:** ${categoryInfo?.description || ""}
- **Product Link:** ${productInfo?.imageUrl || ""}
`;
  })
  .join("\n")}

## Pricing Notes
- Base pricing according to current wholesale catalog
- ${orderData.products.some((p: any) => p.isFullTruckload) ? "Includes full truckload discount(s) of 20%" : "No full truckload discounts applied"}
- Final pricing to be confirmed by sales team

## Action Items
- Order received through Arizona landscaper portal
- Customer to be contacted within 24 hours for delivery arrangements
- Confirm product availability and delivery timeline
- Send final quote with applicable discounts

---
*Generated on ${new Date().toLocaleString()} | Arizona Territory*
`;

interface OrderFormProps {}

export const OrderForm: React.FC<OrderFormProps> = () => {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(DEV_PREFILLS.businessInfo);
  const [products, setProducts] = useState<ProductSelection[]>([]);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [showSizeCategorySelection, setShowSizeCategorySelection] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [orderPhase, setOrderPhase] = useState<"category" | "product" | "size" | "quantity" | "mixed-palette">("category");
  const [currentPaletteGroupId, setCurrentPaletteGroupId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isBuildingMixedPalette, setIsBuildingMixedPalette] = useState(false);

  // Get the total quantity for a palette group
  const getPaletteGroupTotal = (paletteGroupId: string) => {
    return products.filter((p) => p.paletteGroupId === paletteGroupId).reduce((total, product) => total + product.quantity, 0);
  };

  // Check if a product qualifies for a truckload discount
  const qualifiesForTruckloadDiscount = (product: ProductSelection) => {
    const category = PRODUCT_CATEGORIES.find((cat) => cat.value === product.category);

    // For products without a palette group (individual products)
    if (!product.paletteGroupId) {
      return category?.isPalette && product.quantity >= 22;
    }

    // For products in a palette group (mixed palette)
    if (category?.isPalette && product.paletteGroupId) {
      const totalQuantity = getPaletteGroupTotal(product.paletteGroupId);
      return totalQuantity >= 22;
    }

    return false;
  };

  // Apply truckload discounts automatically
  useEffect(() => {
    // Group products by palette group ID
    const paletteGroups = products.reduce((groups: Record<string, ProductSelection[]>, product) => {
      if (product.paletteGroupId) {
        if (!groups[product.paletteGroupId]) {
          groups[product.paletteGroupId] = [];
        }
        groups[product.paletteGroupId].push(product);
      }
      return groups;
    }, {});

    // Update products with correct truckload discount status
    setProducts((prevProducts) =>
      prevProducts.map((product) => {
        // For products in a palette group
        if (product.paletteGroupId) {
          const totalQuantity = getPaletteGroupTotal(product.paletteGroupId);
          const category = PRODUCT_CATEGORIES.find((cat) => cat.value === product.category);
          return {
            ...product,
            isFullTruckload: category?.isPalette && totalQuantity >= 22,
          };
        }

        // For individual products
        return {
          ...product,
          isFullTruckload: qualifiesForTruckloadDiscount(product),
        };
      })
    );
  }, [products.map((p) => `${p.id}-${p.quantity}`).join(",")]);

  const handleBusinessInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(step + 1);
  };

  const handleProductsSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setStep(step + 1);
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    updateProduct(productId, { quantity: newQuantity });
  };

  const handleSubmitOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    try {
      setIsSubmitting(true);

      // Format the products with additional information from productData
      const enhancedProducts = products.map((product) => {
        const productData = productsData.find((p) => p.id === product.productId);
        const categoryInfo = PRODUCT_CATEGORIES.find((cat) => cat.value === product.category);

        return {
          ...product,
          productName: productData?.productType || "Unknown Product",
          productDescription: productData?.description || "",
          productImageUrl: productData?.imageUrl || "",
          productTextureImageUrl: productData?.additionalImages?.[0] || "",
          categoryName: categoryInfo?.label || "Standard",
          categoryDescription: categoryInfo?.description || "",
          categoryImageUrl: categoryInfo?.imageUrl || "",
          discount: product.isFullTruckload ? 20 : 0,
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

      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit order");
      }

      setShowThankYou(true);
      toast.success("Thank you for your order! We'll contact you shortly.");
    } catch (error) {
      console.error("Error submitting order:", error);
      toast.error("There was an error submitting your order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start by selecting a category first
  const selectCategory = (categoryValue: string) => {
    setSelectedCategory(categoryValue);

    // If this is a palette category, ask if they want to create a mixed palette
    const category = PRODUCT_CATEGORIES.find((cat) => cat.value === categoryValue);
    if (category?.isPalette) {
      setIsBuildingMixedPalette(false);
      // Create a new palette group ID if we're starting a mixed palette
      setCurrentPaletteGroupId(Date.now().toString());
    } else {
      setCurrentPaletteGroupId(null);
    }

    setOrderPhase("product");
  };

  // After category selection, select a product
  const selectProduct = (productId: number) => {
    setSelectedProductId(productId);

    if (isBuildingMixedPalette && currentPaletteGroupId) {
      // Skip size selection for mixed palettes - using the same category
      addProductToMixedPalette(productId);
    } else {
      setOrderPhase("quantity");
    }
  };

  // Add product to a mixed palette
  const addProductToMixedPalette = (productId: number) => {
    if (selectedCategory && currentPaletteGroupId) {
      const newProductId = Date.now().toString();
      const selectedProduct = productsData.find((p) => p.id === productId);

      setProducts([
        ...products,
        {
          id: newProductId,
          productId: productId,
          sizeOption: selectedProduct?.sizeOptions?.split(", ")[0] || "",
          quantity: 1,
          isFullTruckload: false,
          category: selectedCategory,
          paletteGroupId: currentPaletteGroupId,
        },
      ]);

      setOrderPhase("mixed-palette");
    }
  };

  // Add a regular product (not in a mixed palette)
  const addRegularProduct = () => {
    if (selectedProductId && selectedCategory) {
      const newProductId = Date.now().toString();
      const selectedProduct = productsData.find((p) => p.id === selectedProductId);

      setProducts([
        ...products,
        {
          id: newProductId,
          productId: selectedProductId,
          sizeOption: selectedProduct?.sizeOptions?.split(", ")[0] || "",
          quantity: 1,
          isFullTruckload: false,
          category: selectedCategory,
        },
      ]);

      setOrderPhase("quantity");
    }
  };

  // Complete adding products to a mixed palette
  const completeMixedPalette = () => {
    setSelectedProductId(null);
    setCurrentPaletteGroupId(null);
    setSelectedCategory(null);
    setIsBuildingMixedPalette(false);
    setOrderPhase("category");
    setIsAddingProduct(false);
  };

  // Complete adding a regular product
  const completeProductAddition = (productId: string) => {
    setSelectedProductId(null);
    setSelectedCategory(null);
    setOrderPhase("category");
    setIsAddingProduct(false);
  };

  // Start adding a new product
  const addProduct = () => {
    setSelectedProductId(null);
    setSelectedCategory(null);
    setOrderPhase("category");
    setIsAddingProduct(true);
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  const updateProduct = (id: string, updates: Partial<ProductSelection>) => {
    setProducts(products.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const editProduct = (id: string) => {
    const product = products.find((p) => p.id === id);
    if (product) {
      setSelectedProductId(product.productId);
      setOrderPhase("quantity");
    }
  };

  const renderThankYou = () => (
    <div className="text-center space-y-6 animate-fade-in">
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
            setBusinessInfo(DEV_PREFILLS.businessInfo);
            setProducts([]);
            setSelectedProductId(null);
            setOrderPhase("product");
            setIsAddingProduct(true);
          }}
          className="bg-green-600 hover:bg-green-700"
        >
          Place Another Order
        </Button>
      </div>
    </div>
  );

  // Arizona branding message
  const renderArizonaBranding = () => (
    <div className="flex items-center gap-2 mb-4 justify-center">
      <MapPin className="text-green-700 h-6 w-6" />
      <span className="font-bold text-green-800 text-lg">Now Serving All of Arizona</span>
    </div>
  );

  // Progress bar
  const renderProgressBar = () => {
    const percent = ((step - 1) / (steps.length - 1)) * 100;
    return (
      <div className="mb-8">
        <div className="flex justify-between mb-4">
          {steps.map((s, i) => (
            <div key={i} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                  step > i + 1
                    ? "bg-green-600 text-white"
                    : step === i + 1
                      ? "bg-green-600 text-white ring-4 ring-green-100"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                <s.icon className="h-5 w-5" />
              </div>
              <span className={`text-sm font-medium ${step === i + 1 ? "text-green-700" : "text-gray-400"}`}>{s.label}</span>
            </div>
          ))}
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-2 bg-green-600 transition-all duration-500 ease-in-out" style={{ width: `${percent}%` }} />
        </div>
      </div>
    );
  };

  // Mini cart display
  const renderMiniCart = () => (
    <div className="fixed bottom-5 right-5 z-30">
      <Button
        className={`bg-green-600 hover:bg-green-700 shadow-md flex items-center gap-2 px-4 ${showCart ? "rounded-b-none" : "rounded-lg"}`}
        onClick={() => setShowCart(!showCart)}
      >
        <ShoppingCart className="h-5 w-5" />
        <span>
          {products.length} {products.length === 1 ? "item" : "items"}
        </span>
        <Badge className="ml-1 bg-white text-green-600">{products.reduce((total, p) => total + p.quantity, 0)}</Badge>
      </Button>

      {showCart && (
        <div className="bg-white border border-green-200 rounded-t-lg rounded-bl-lg shadow-lg p-3 w-80 max-h-96 overflow-y-auto animate-fade-in">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">Your Order</h4>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowCart(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {products.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">No products added yet</p>
          ) : (
            <div className="space-y-2">
              {products.map((product) => {
                const productData = productsData.find((p) => p.id === product.productId);
                const categoryData = PRODUCT_CATEGORIES.find((c) => c.value === product.category);

                return (
                  <div key={product.id} className="flex items-center gap-2 border-b pb-2">
                    <img src={productData?.imageUrl || ""} alt={productData?.productType || ""} className="w-10 h-10 object-cover rounded" />
                    <div className="flex-grow text-sm">
                      <p className="font-medium">{productData?.productType || "Product"}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span>{categoryData?.label || ""}</span>
                        <span>•</span>
                        <span>Qty: {product.quantity}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                      onClick={() => removeProduct(product.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {products.length > 0 && (
            <div className="mt-3 pt-2 border-t">
              <Button
                size="sm"
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => {
                  if (step === 1) handleProductsSubmit();
                }}
              >
                {step === 1 ? "Proceed to Checkout" : "View Order"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Category Selection
  const renderCategorySelection = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Select a Size Category</h3>
      <p className="text-gray-600">First, choose how you want to purchase your products:</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {PRODUCT_CATEGORIES.map((category) => {
          const Icon = category.icon;

          return (
            <div
              key={category.value}
              className="cursor-pointer border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md hover:border-green-200"
              onClick={() => selectCategory(category.value)}
            >
              <div className="h-40 relative bg-gray-50">
                <img src={category.imageUrl} alt={category.label} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="h-4 w-4" />
                    <h4 className="font-medium">{category.label}</h4>
                  </div>
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm text-gray-600">{category.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Product Gallery
  const renderProductGallery = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Select a Product</h3>
        <Button variant="outline" size="sm" onClick={() => setOrderPhase("category")} className="text-gray-500">
          <ChevronRight className="h-4 w-4 rotate-180 mr-1" /> Back to Categories
        </Button>
      </div>

      {selectedCategory && (
        <div className="bg-green-50 p-3 rounded-lg mb-4">
          <div className="flex items-center gap-2">
            {React.createElement(PRODUCT_CATEGORIES.find((c) => c.value === selectedCategory)?.icon || Package, {
              className: "h-5 w-5 text-green-600",
            })}
            <span className="font-medium">Selected: {PRODUCT_CATEGORIES.find((c) => c.value === selectedCategory)?.label}</span>
          </div>

          {PRODUCT_CATEGORIES.find((c) => c.value === selectedCategory)?.isPalette && (
            <div className="mt-2 flex items-center gap-2">
              <Button
                size="sm"
                variant={isBuildingMixedPalette ? "default" : "outline"}
                className={isBuildingMixedPalette ? "bg-green-600 hover:bg-green-700" : ""}
                onClick={() => setIsBuildingMixedPalette(!isBuildingMixedPalette)}
              >
                {isBuildingMixedPalette ? "Creating Mixed Palette" : "Create Mixed Palette"}
              </Button>
              <p className="text-xs text-gray-600">
                {isBuildingMixedPalette
                  ? "You can add multiple products to this palette."
                  : "Mix different products in one palette of the same type."}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {productsData.map((product) => (
          <div
            key={product.id}
            className={`cursor-pointer border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md ${
              selectedProductId === product.id ? "ring-2 ring-green-500 shadow-md" : ""
            }`}
            onClick={() => selectProduct(product.id)}
          >
            <div className="h-40 bg-gray-50">
              <img src={product.imageUrl} alt={product.productType} className="w-full h-full object-cover hover:scale-105 transition-transform" />
            </div>
            <div className="p-3">
              <h4 className="font-medium text-lg">{product.productType}</h4>
              <p className="text-sm text-gray-600 line-clamp-2 mt-1">{product.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Size Category Selection
  const renderSizeCategorySelection = () => {
    const selectedProduct = selectedProductId ? productsData.find((p) => p.id === selectedProductId) : null;

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowSizeCategorySelection(false);
              setSelectedProductId(null);
              setOrderPhase("product");
            }}
            className="text-gray-500"
          >
            <ChevronRight className="h-4 w-4 rotate-180 mr-1" /> Back
          </Button>

          {selectedProduct && (
            <div className="flex items-center gap-3">
              <img src={selectedProduct.imageUrl} alt={selectedProduct.productType} className="w-12 h-12 object-cover rounded" />
              <div>
                <h3 className="font-medium">{selectedProduct.productType}</h3>
                <p className="text-sm text-gray-500">Select a size option</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {PRODUCT_CATEGORIES.map((category) => {
            const Icon = category.icon;

            return (
              <div
                key={category.value}
                className="cursor-pointer border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md hover:border-green-200"
                onClick={() => selectSizeCategory(category.value)}
              >
                <div className="h-40 relative bg-gray-50">
                  <img src={category.imageUrl} alt={category.label} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="h-4 w-4" />
                      <h4 className="font-medium">{category.label}</h4>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm text-gray-600">{category.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Quantity Selection
  const renderQuantitySelection = () => {
    const latestProduct = products[products.length - 1];
    const productData = latestProduct?.productId ? productsData.find((p) => p.id === latestProduct.productId) : null;
    const categoryData = latestProduct?.category ? PRODUCT_CATEGORIES.find((c) => c.value === latestProduct.category) : null;

    return latestProduct ? (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              removeProduct(latestProduct.id);
              setOrderPhase("product");
            }}
            className="text-gray-500"
          >
            <ChevronRight className="h-4 w-4 rotate-180 mr-1" /> Back
          </Button>

          <div className="flex items-center gap-3">
            {productData && <img src={productData.imageUrl} alt={productData.productType} className="w-12 h-12 object-cover rounded" />}
            <div>
              <h3 className="font-medium">{productData?.productType}</h3>
              <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                {categoryData && (
                  <>
                    <Icon component={categoryData.icon} size={12} />
                    <span>{categoryData.label}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <Card className="p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-base font-medium">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={latestProduct.quantity}
                onChange={(e) => handleQuantityChange(latestProduct.id, parseInt(e.target.value) || 1)}
                className="h-12 text-lg"
                required
              />

              {categoryData?.isPalette && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Truckload Progress</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 transition-all duration-300"
                      style={{ width: `${Math.min(((latestProduct.quantity || 0) / 22) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{latestProduct.quantity}/22 units toward full truckload</p>
                  {qualifiesForTruckloadDiscount(latestProduct) && (
                    <div className="flex items-center gap-2 text-green-600 text-sm mt-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Full truckload discount (20%) will be applied!</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-between gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  removeProduct(latestProduct.id);
                  setOrderPhase("product");
                }}
              >
                Cancel
              </Button>

              <Button onClick={() => completeProductAddition(latestProduct.id)} className="bg-green-600 hover:bg-green-700">
                Add to Order
              </Button>
            </div>
          </div>
        </Card>
      </div>
    ) : null;
  };

  // Mixed Palette Interface
  const renderMixedPaletteInterface = () => {
    if (!currentPaletteGroupId || !selectedCategory) return null;

    const paletteProducts = products.filter((p) => p.paletteGroupId === currentPaletteGroupId);
    const categoryData = PRODUCT_CATEGORIES.find((c) => c.value === selectedCategory);
    const totalQuantity = getPaletteGroupTotal(currentPaletteGroupId);
    const qualifiesForDiscount = categoryData?.isPalette && totalQuantity >= 22;

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Icon component={categoryData?.icon || Package} size={20} />
            Building Mixed Palette: {categoryData?.label}
          </h3>

          <Button variant="ghost" size="sm" onClick={() => setOrderPhase("product")} className="text-gray-500">
            <Plus className="h-4 w-4 mr-1" /> Add More Products
          </Button>
        </div>

        <Card className="p-4 border-green-100">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Products in this palette</h4>
              <Badge className="bg-green-100 text-green-800">
                {paletteProducts.length} {paletteProducts.length === 1 ? "product" : "products"}
              </Badge>
            </div>

            <div className="space-y-3 mt-2">
              {paletteProducts.map((product) => {
                const productData = productsData.find((p) => p.id === product.productId);

                return (
                  <div key={product.id} className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-3">
                      {productData && <img src={productData.imageUrl} alt={productData.productType} className="w-10 h-10 object-cover rounded" />}
                      <div>
                        <p className="font-medium">{productData?.productType}</p>
                        <div className="flex items-center mt-1">
                          <div className="flex items-center">
                            <Label htmlFor={`quantity-${product.id}`} className="text-xs text-gray-500 mr-2">
                              Qty:
                            </Label>
                            <Input
                              id={`quantity-${product.id}`}
                              type="number"
                              min="1"
                              value={product.quantity}
                              onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 1)}
                              className="h-7 w-16 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => removeProduct(product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>

            {categoryData?.isPalette && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Total Palette Quantity: {totalQuantity}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600 transition-all duration-300"
                    style={{ width: `${Math.min(((totalQuantity || 0) / 22) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{totalQuantity}/22 units toward full truckload</p>
                {qualifiesForDiscount && (
                  <div className="flex items-center gap-2 text-green-600 text-sm mt-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Full truckload discount (20%) will be applied!</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  // Remove all products in this group
                  setProducts(products.filter((p) => p.paletteGroupId !== currentPaletteGroupId));
                  setOrderPhase("category");
                }}
              >
                Cancel
              </Button>

              <Button onClick={completeMixedPalette} className="bg-green-600 hover:bg-green-700" disabled={paletteProducts.length === 0}>
                Complete Mixed Palette
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  // Render the unified product and size category selection form
  const renderProductSelectionForm = () => {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Build Your Order</h2>
          <p className="text-gray-500">Select products and size options for your Arizona landscaping project.</p>
        </div>

        {/* Product Selection Flow */}
        {isAddingProduct ? (
          <div className="space-y-6">
            {orderPhase === "product" && renderProductGallery()}
            {orderPhase === "size" && selectedProductId && renderSizeCategorySelection()}
            {orderPhase === "quantity" && renderQuantitySelection()}
          </div>
        ) : (
          /* Order Summary */
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                Your Selected Products
              </h3>

              <Button onClick={addProduct} className="bg-white hover:bg-gray-50 text-green-700 border border-green-300">
                <Plus className="h-4 w-4 mr-2" /> Add Product
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {products.map((product) => {
                const productData = productsData.find((p) => p.id === product.productId);
                const categoryData = PRODUCT_CATEGORIES.find((c) => c.value === product.category);

                return (
                  <Card
                    key={product.id}
                    className={`p-4 border hover:shadow-md transition-all duration-200 ${
                      product.isFullTruckload ? "border-green-200 bg-green-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {productData && (
                          <img
                            src={productData.imageUrl}
                            alt={productData.productType}
                            className="w-16 h-16 object-cover rounded-md"
                            onClick={() => setExpandedImage(productData.imageUrl)}
                          />
                        )}
                      </div>

                      <div className="flex-grow">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-green-800">{productData?.productType || "Product"}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {categoryData && (
                                <div className="flex items-center gap-1 text-xs bg-gray-100 py-1 px-2 rounded-full">
                                  {React.createElement(categoryData.icon, { className: "h-3 w-3 text-gray-500" })}
                                  <span>{categoryData.label}</span>
                                </div>
                              )}
                              <span className="text-sm text-gray-600">Qty: {product.quantity}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {product.isFullTruckload && <Badge className="bg-green-100 text-green-800 border border-green-300">20% discount</Badge>}
                            <Button variant="ghost" size="sm" onClick={() => editProduct(product.id)}>
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => removeProduct(product.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-end mt-6">
              <Button onClick={() => handleProductsSubmit()} className="bg-green-600 hover:bg-green-700" disabled={products.length === 0}>
                Continue to Contact Info
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContactInfo = () => (
    <form onSubmit={handleBusinessInfoSubmit} className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Contact Information</h2>
        <p className="text-gray-500">Let us know how to reach you for your order.</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName" className="text-base font-medium">
                Business Name
              </Label>
              <Input
                id="businessName"
                value={businessInfo.name}
                onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
                required
                className="h-12 text-base"
                placeholder="Enter your business name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={businessInfo.email}
                onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                required
                className="h-12 text-base"
                placeholder="Enter your email address"
              />
              <p className="text-sm text-gray-500">We'll send order confirmation and updates to this email.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-base font-medium">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={businessInfo.phone}
                onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                required
                className="h-12 text-base"
                placeholder="Enter your phone number"
              />
              <p className="text-sm text-gray-500">We'll use this number to contact you about your order.</p>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm text-green-800 font-medium mb-1">Your Information is Secure</p>
                <p className="text-sm text-green-700">
                  We take your privacy seriously. Your contact information will only be used to process your order and provide you with updates about
                  your delivery.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between gap-4 mt-8">
        <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
          Back to Products
        </Button>
        <Button type="submit" className="px-8 h-12 text-base">
          Continue to Delivery
        </Button>
      </div>
    </form>
  );

  const handleDeliveryOptionsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(step + 1);
  };

  const renderDeliveryOptions = () => (
    <form onSubmit={handleDeliveryOptionsSubmit} className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Delivery or Pickup?</h2>
        <p className="text-gray-500">Choose how you'd like to receive your order.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div
          className={`group p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
            businessInfo.deliveryType === "delivery"
              ? "border-green-600 bg-green-50 scale-[1.02]"
              : "border-gray-200 hover:border-green-200 hover:shadow-md"
          }`}
          onClick={() => setBusinessInfo({ ...businessInfo, deliveryType: "delivery" })}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${businessInfo.deliveryType === "delivery" ? "bg-green-100" : "bg-gray-100"}`}>
              <Truck className={`h-6 w-6 ${businessInfo.deliveryType === "delivery" ? "text-green-600" : "text-gray-600"}`} />
            </div>
            <h3 className="text-lg font-semibold">Delivery</h3>
          </div>
          <p className="text-gray-600 mb-4">We'll deliver your order directly to your location.</p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Free delivery for full truckloads</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Professional delivery service</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Flexible scheduling</span>
            </li>
          </ul>
        </div>

        <div
          className={`group p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
            businessInfo.deliveryType === "pickup"
              ? "border-green-600 bg-green-50 scale-[1.02]"
              : "border-gray-200 hover:border-green-200 hover:shadow-md"
          }`}
          onClick={() => setBusinessInfo({ ...businessInfo, deliveryType: "pickup" })}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${businessInfo.deliveryType === "pickup" ? "bg-green-100" : "bg-gray-100"}`}>
              <MapPin className={`h-6 w-6 ${businessInfo.deliveryType === "pickup" ? "text-green-600" : "text-gray-600"}`} />
            </div>
            <h3 className="text-lg font-semibold">Pickup</h3>
          </div>
          <p className="text-gray-600 mb-4">Pick up your order from one of our locations.</p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Multiple pickup locations</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Convenient business hours</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Loading assistance available</span>
            </li>
          </ul>
        </div>
      </div>

      {businessInfo.deliveryType === "pickup" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-600" />
            Select Pickup Location
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {LOCATIONS.map((location) => (
              <div
                key={location.id}
                className={`group p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                  businessInfo.pickupLocation === location.id
                    ? "border-green-600 bg-green-50 scale-[1.02]"
                    : "border-gray-200 hover:border-green-200 hover:shadow-md"
                }`}
                onClick={() => setBusinessInfo({ ...businessInfo, pickupLocation: location.id })}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{location.name}</h4>
                    <p className="text-gray-600 mb-3">{location.address}</p>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Capacity:</span> {location.capacity}
                      </p>
                      <a
                        href={location.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1 group-hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MapPin className="h-4 w-4" />
                        View on Map
                      </a>
                    </div>
                  </div>
                  {businessInfo.pickupLocation === location.id && (
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {businessInfo.deliveryType === "delivery" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Truck className="h-5 w-5 text-green-600" />
            Delivery Address
          </h3>
          <div className="p-6 bg-white rounded-xl border border-gray-200">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address" className="text-base font-medium">
                  Delivery Address
                </Label>
                <Input
                  id="address"
                  value={businessInfo.address}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                  required
                  className="h-12 text-base"
                  placeholder="Enter your delivery address"
                />
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-800 font-medium mb-1">Delivery Information</p>
                    <p className="text-sm text-green-700">
                      Please provide a complete delivery address including any specific instructions for our delivery team. We'll contact you to
                      confirm delivery details and schedule.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between gap-4 mt-8">
        <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
          Back
        </Button>
        <Button type="submit" disabled={businessInfo.deliveryType === "pickup" && !businessInfo.pickupLocation} className="px-8 h-12 text-base">
          Review Order
        </Button>
      </div>
    </form>
  );

  const renderOrderReview = () => (
    <form
      className="space-y-4 animate-fade-in"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmitOrder();
      }}
    >
      <h2 className="text-xl font-bold mb-1">Review & Submit</h2>
      <p className="text-gray-500 mb-2 text-sm">Almost done! Please review your order for your Arizona landscaping project.</p>

      <div className="bg-green-50 p-4 rounded-lg mb-6 flex items-center gap-3">
        <MapPin className="h-5 w-5 text-green-600 flex-shrink-0" />
        <div>
          <p className="text-green-800 font-medium">{businessInfo.deliveryType === "delivery" ? "Arizona Delivery" : "Pickup Order"}</p>
          <p className="text-sm text-green-700">
            {businessInfo.deliveryType === "delivery"
              ? "All orders include delivery to your Arizona job site"
              : `Pickup from ${LOCATIONS.find((loc) => loc.id === businessInfo.pickupLocation)?.name}`}
          </p>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-green-600" />
          Contact Information
        </h3>
        <Card className="p-4 border-green-100">
          <p>
            <strong>Name:</strong> {businessInfo.name}
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
        </Card>
      </div>

      {/* Product Details */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Package className="h-5 w-5 text-green-600" />
          Product Details ({products.length} {products.length === 1 ? "product" : "products"})
        </h3>
        {products.map((product, index) => {
          const selectedProduct = productsData.find((p) => p.id === product.productId);
          const categoryInfo = PRODUCT_CATEGORIES.find((cat) => cat.value === product.category);

          return (
            <Card key={product.id} className={`p-4 ${product.isFullTruckload ? "border-green-100 bg-green-50" : "border-gray-200"}`}>
              <div className="flex items-start gap-4">
                {selectedProduct && (
                  <img src={selectedProduct.imageUrl} alt={selectedProduct.productType} className="w-16 h-16 object-cover rounded-md" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-medium text-green-800">{selectedProduct?.productType || `Product ${index + 1}`}</p>
                    {product.isFullTruckload && <Badge className="bg-green-100 text-green-800 border border-green-300">20% discount</Badge>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <p>
                      <strong>Size Category:</strong> {categoryInfo?.label || "Standard"}
                    </p>
                    <p>
                      <strong>Quantity:</strong> {product.quantity}
                    </p>
                    <p>
                      <strong>Package Info:</strong> {categoryInfo?.description ? categoryInfo.description.split("\n")[0] : "Standard packaging"}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 p-4 rounded-lg mt-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-2">
          <p className="font-medium">Order Summary</p>
          <p className="text-sm text-gray-500">Reference: {Date.now().toString().slice(-6)}</p>
        </div>
        <div className="flex justify-between items-center mb-2">
          <p>Total Products</p>
          <p>{products.length}</p>
        </div>
        <div className="flex justify-between items-center mb-4">
          <p>Full Truckload Discount</p>
          <p>{products.some((p) => p.isFullTruckload) ? "Yes (20%)" : "No"}</p>
        </div>
        <p className="text-sm text-gray-500 italic">Final pricing will be confirmed by our sales team.</p>
      </div>

      <div className="flex justify-between gap-4 mt-6">
        <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
          Back
        </Button>
        <Button type="submit" className="bg-green-600 hover:bg-green-700 h-12 text-lg font-medium" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Order"}
        </Button>
      </div>
      <p className="text-center text-sm text-gray-500 mt-3">By submitting, you'll receive a confirmation email with your order details.</p>
    </form>
  );

  // Utility function to render icons dynamically
  const Icon = ({ component: Component, size = 16 }: { component: any; size?: number }) => {
    return <Component className={`h-${size / 4} w-${size / 4}`} />;
  };

  // DEBUG: Log productsData and key state variables
  console.log("productsData", productsData);

  // DEBUG: Log key state variables
  React.useEffect(() => {
    console.log({ orderPhase, isAddingProduct, selectedCategory, selectedProductId, productsLength: productsData.length });
  }, [orderPhase, isAddingProduct, selectedCategory, selectedProductId]);

  // Add a visible error message if productsData is empty
  if (!productsData || productsData.length === 0) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-8 text-center">
        <strong className="font-bold">Error:</strong> No products loaded.
        <br />
        Please check your product data files (productInfo.json, productPhotos.json) and ensure they are present and correctly formatted.
        <br />
        If this used to work, try restarting your dev server.
        <br />
        <span className="block mt-2 text-xs">(productsData is empty)</span>
      </div>
    );
  }

  // Add a visible warning if the UI is stuck in an unexpected order phase
  if (orderPhase !== "category" && orderPhase !== "product" && orderPhase !== "size" && orderPhase !== "quantity" && orderPhase !== "mixed-palette") {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mt-8 text-center">
        <strong className="font-bold">Warning:</strong> The order flow is in an unexpected state: <code>{orderPhase}</code>.<br />
        Please check your code for recent changes to orderPhase logic.
      </div>
    );
  }

  // Add this function to fix the linter error and handle size category selection
  const selectSizeCategory = (categoryValue: string) => {
    setSelectedCategory(categoryValue);
    setOrderPhase("product");
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {showThankYou ? (
        renderThankYou()
      ) : (
        <>
          {renderArizonaBranding()}
          {renderProgressBar()}

          <div className="relative">
            {step === 1 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                {renderProductSelectionForm()}
              </motion.div>
            )}
            {step === 2 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                {renderContactInfo()}
              </motion.div>
            )}
            {step === 3 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                {renderDeliveryOptions()}
              </motion.div>
            )}
            {step === 4 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                {renderOrderReview()}
              </motion.div>
            )}
          </div>

          {expandedImage && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
              <button className="absolute top-4 right-4 text-white hover:text-gray-300" onClick={() => setExpandedImage(null)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <img src={expandedImage} alt="Expanded product view" className="max-w-full max-h-full object-contain" />
            </div>
          )}

          {/* Show mini cart when products exist and not on review page */}
          {products.length > 0 && step < 4 && renderMiniCart()}
        </>
      )}
    </div>
  );
};

// Add these styles to your global CSS or component styles
const styles = `
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
`;
