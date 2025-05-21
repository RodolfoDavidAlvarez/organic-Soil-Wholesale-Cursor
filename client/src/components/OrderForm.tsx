import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { MapPin, Package, Truck, Box, Plus, Trash2, CheckCircle2, Search, Users } from "lucide-react";
import { productsData } from "@/data/productData";

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
}

const steps = [{ label: "Delivery Type" }, { label: "Contact Info" }, { label: "Products" }, { label: "Review" }];

const PRODUCTS = {
  boxes: [
    { id: "box-1", name: "Premium Potting Soil Box", description: "4 units per box, 36 boxes per pallet" },
    { id: "box-2", name: "Organic Compost Box", description: "4 units per box, 36 boxes per pallet" },
    { id: "box-3", name: "Garden Blend Box", description: "4 units per box, 36 boxes per pallet" },
  ],
  totes: [
    { id: "tote-1", name: "Premium Potting Soil Bag", description: "1 cubic foot bags, 50 bags per pallet" },
    { id: "tote-2", name: "Organic Compost Bag", description: "1 cubic foot bags, 50 bags per pallet" },
    { id: "tote-3", name: "Garden Blend Bag", description: "1 cubic foot bags, 50 bags per pallet" },
  ],
  bulk: [
    { id: "bulk-1", name: "Premium Potting Soil", description: "90-110 cubic yards per truckload" },
    { id: "bulk-2", name: "Organic Compost", description: "22-24 tons per truckload" },
    { id: "bulk-3", name: "Garden Blend", description: "22-24 tons per truckload" },
  ],
};

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
  },
  {
    value: "bags",
    label: "Pallet of Bags",
    icon: Package,
    description: "50 bags (1cf Bags)",
    imageUrl:
      "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FSize%20Categories%2FSize%20Category%20-%20pallet%20of%20bags.png?alt=media&token=4ff026e5-7318-4c35-869a-a1bc0a3ff94d",
  },
  {
    value: "bulk",
    label: "Bulk Delivery",
    icon: Truck,
    description: "Compost and blends: 22-24 tons per truckload\nPotting soil: 90-110 CYs per truckload",
    imageUrl:
      "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FSize%20Categories%2FBulk%20delivery.png?alt=media&token=5c59cabf-aa01-4745-9026-51ee7ab8f195",
  },
  {
    value: "totes",
    label: "2.2 CY Tote",
    icon: Package,
    description: "Single 2.2 CY Tote (supersack)",
    imageUrl:
      "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FSize%20Categories%2F2.2%20CY%20Tote%20(supersack).png?alt=media&token=dd8560dc-e9b2-4cc2-a0bf-e4f4fccc630e",
  },
  {
    value: "bulk-pickup",
    label: "Bulk Pickup",
    icon: Truck,
    description: "Bulk In Cubic Yard for pickup only",
    imageUrl:
      "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FSize%20Categories%2FCY%20of%20Bulk%20for%20pick%20only.png?alt=media&token=9d2cb829-c265-426e-9147-4d79835f6e0f",
  },
  {
    value: "truckload-totes",
    label: "Truckload of Totes",
    icon: Truck,
    description: "Full Truckload example, 22 pallets of 2.2CY totes",
    imageUrl:
      "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FSize%20Categories%2FTruckload%20of%20totes.png?alt=media&token=436d5a5d-a7aa-4aca-8318-e8bc98eab972",
  },
];

const WEBHOOK_URL = "https://hook.us1.make.com/bm4eqe7ie77vxt06gx2529x97ecgh28e";

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
                                <h4 style="margin-top: 0; margin-bottom: 8px;">${productData ? productData.name : "Product"}</h4>
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
                            ${productData ? `<img src="${productData.imageUrl}" alt="${productData.name}" class="product-image">` : ""}
                            <div>
                                <h4 style="margin-top: 0; margin-bottom: 8px;">${productData ? productData.name : "Product"}</h4>
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
                            <img src="${productData.additionalImages[0]}" alt="${productData.name} texture" style="max-width: 100px; border-radius: 4px;">
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
### Product ${index + 1}: ${productInfo?.name || "Product"}
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

export const OrderForm: React.FC = () => {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(DEV_PREFILLS.businessInfo);
  const [products, setProducts] = useState<ProductSelection[]>(DEV_PREFILLS.initialProducts);

  const handleBusinessInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(step + 1);
  };

  const handleProductsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(step + 1);
  };

  const handleSubmitOrder = async () => {
    try {
      setIsSubmitting(true);

      // Format the products with additional information from productData
      const enhancedProducts = products.map((product) => {
        const productData = productsData.find((p) => p.id === product.productId);
        const categoryInfo = PRODUCT_CATEGORIES.find((cat) => cat.value === product.category);

        return {
          ...product,
          productName: productData?.name || "Unknown Product",
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

  const addProduct = () => {
    setProducts([
      ...products,
      {
        id: Date.now().toString(),
        productId: 1,
        sizeOption: "1CF Bag",
        quantity: 1,
        isFullTruckload: false,
      } as ProductSelection,
    ]);
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  const updateProduct = (id: string, updates: Partial<ProductSelection>) => {
    setProducts(products.map((p) => (p.id === id ? { ...p, ...updates } : p)));
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
            setProducts(DEV_PREFILLS.initialProducts);
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
      <div className="mb-6">
        <div className="flex justify-between mb-1 px-1">
          {steps.map((s, i) => (
            <span key={i} className={`text-xs font-medium ${step === i + 1 ? "text-green-700" : "text-gray-400"}`}>
              {s.label}
            </span>
          ))}
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-2 bg-green-600 transition-all duration-300" style={{ width: `${percent}%` }} />
        </div>
      </div>
    );
  };

  const renderStep1 = () => (
    <form onSubmit={handleBusinessInfoSubmit} className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-bold mb-1">Delivery or Pickup?</h2>
      <p className="text-gray-500 mb-4 text-sm">Choose how you'd like to receive your order.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div
          className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
            businessInfo.deliveryType === "delivery" ? "border-green-600 bg-green-50" : "border-gray-200 hover:border-green-200"
          }`}
          onClick={() => setBusinessInfo({ ...businessInfo, deliveryType: "delivery" })}
        >
          <div className="flex items-center gap-3 mb-3">
            <Truck className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold">Delivery</h3>
          </div>
          <p className="text-gray-600">We'll deliver your order directly to your location.</p>
        </div>

        <div
          className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
            businessInfo.deliveryType === "pickup" ? "border-green-600 bg-green-50" : "border-gray-200 hover:border-green-200"
          }`}
          onClick={() => setBusinessInfo({ ...businessInfo, deliveryType: "pickup" })}
        >
          <div className="flex items-center gap-3 mb-3">
            <MapPin className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold">Pickup</h3>
          </div>
          <p className="text-gray-600">Pick up your order from one of our locations.</p>
        </div>
      </div>

      {businessInfo.deliveryType === "pickup" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Select Pickup Location</h3>
          <div className="grid grid-cols-1 gap-4">
            {LOCATIONS.map((location) => (
              <div
                key={location.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  businessInfo.pickupLocation === location.id ? "border-green-600 bg-green-50" : "border-gray-200 hover:border-green-200"
                }`}
                onClick={() => setBusinessInfo({ ...businessInfo, pickupLocation: location.id })}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-lg mb-1">{location.name}</h4>
                    <p className="text-gray-600 mb-2">{location.address}</p>
                    <p className="text-sm text-gray-500 mb-2">Capacity: {location.capacity}</p>
                    <a
                      href={location.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MapPin className="h-4 w-4" />
                      View on Map
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between gap-4 mt-4">
        <div />
        <Button type="submit" className="w-full" disabled={businessInfo.deliveryType === "pickup" && !businessInfo.pickupLocation}>
          Continue
        </Button>
      </div>
    </form>
  );

  const renderStep2 = () => (
    <form onSubmit={handleBusinessInfoSubmit} className="space-y-4 animate-fade-in">
      <h2 className="text-xl font-bold mb-1">Contact Information</h2>
      <p className="text-gray-500 mb-2 text-sm">Let us know how to reach you.</p>
      <div className="space-y-2">
        <Label htmlFor="businessName">Business Name</Label>
        <Input id="businessName" value={businessInfo.name} onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={businessInfo.email}
          onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          value={businessInfo.phone}
          onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
          required
        />
      </div>
      {businessInfo.deliveryType === "delivery" && (
        <div className="space-y-2">
          <Label htmlFor="address">Delivery Address</Label>
          <Input id="address" value={businessInfo.address} onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })} required />
        </div>
      )}
      <div className="flex justify-between gap-4 mt-4">
        <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
          Back
        </Button>
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );

  const renderStep3 = () => (
    <form onSubmit={handleProductsSubmit} className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Product Selection</h2>
          <p className="text-gray-500 text-sm mt-1">Select your products and quantities.</p>
        </div>
        <Button type="button" onClick={addProduct} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* Size Category Selection Cards */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Choose Your Size Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRODUCT_CATEGORIES.map((category) => (
            <div
              key={category.value}
              className="cursor-pointer rounded-lg border-2 transition-all hover:border-green-600 hover:shadow-md bg-white"
              onClick={() => {
                // Add product with this category pre-selected
                setProducts([
                  ...products,
                  {
                    id: Date.now().toString(),
                    productId: 1,
                    sizeOption: "1CF Bag",
                    quantity: 1,
                    isFullTruckload: false,
                    category: category.value,
                  } as ProductSelection,
                ]);
              }}
            >
              <div className="h-48 overflow-hidden rounded-t-lg">
                <img src={category.imageUrl} alt={category.label} className="w-full h-full object-cover" />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <category.icon className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold text-lg">{category.label}</h4>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-line">{category.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {products.map((product, index) => (
        <Card key={product.id} className="p-6 space-y-4 relative">
          {products.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 hover:bg-red-50"
              onClick={() => removeProduct(product.id)}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Size Category Selection */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Size Category</Label>
                <Select value={product.category || ""} onValueChange={(value) => updateProduct(product.id, { category: value })}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select size category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <cat.icon className="h-4 w-4 text-green-600" />
                          <span>{cat.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-medium">Product</Label>
                <Select
                  value={product.productId.toString()}
                  onValueChange={(value) => {
                    const selectedProduct = productsData.find((p) => p.id === parseInt(value));
                    updateProduct(product.id, {
                      productId: parseInt(value),
                      sizeOption: selectedProduct?.sizeOptions?.split(", ")[0] || "",
                    });
                  }}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {productsData.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        <div className="flex items-center gap-2">
                          <img src={p.imageUrl} alt={p.name} className="w-8 h-8 object-cover rounded" />
                          <div>
                            <p className="font-medium">{p.name}</p>
                            <p className="text-sm text-gray-500">{p.description}</p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {product.productId && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor={`quantity-${product.id}`} className="text-base font-medium">
                      Quantity
                    </Label>
                    <Input
                      id={`quantity-${product.id}`}
                      type="number"
                      min="1"
                      value={product.quantity}
                      onChange={(e) => updateProduct(product.id, { quantity: parseInt(e.target.value) })}
                      className="h-12 text-lg"
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <input
                      type="checkbox"
                      id={`fullTruckload-${product.id}`}
                      checked={product.isFullTruckload}
                      onChange={(e) => updateProduct(product.id, { isFullTruckload: e.target.checked })}
                      className="h-5 w-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
                    />
                    <Label htmlFor={`fullTruckload-${product.id}`} className="text-base">
                      Full Truckload <span className="text-green-600 font-medium">(20% discount)</span>
                    </Label>
                  </div>
                </>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              {(() => {
                const selectedProduct = productsData.find((p) => p.id === product.productId);
                const categoryInfo = PRODUCT_CATEGORIES.find((cat) => cat.value === product.category);

                return (
                  <div className="h-full flex flex-col">
                    {selectedProduct ? (
                      <>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          <div className="relative w-full h-32 rounded-lg overflow-hidden bg-white">
                            <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-contain p-2" />
                          </div>
                          {selectedProduct.additionalImages && selectedProduct.additionalImages.length > 0 && (
                            <div className="relative w-full h-32 rounded-lg overflow-hidden bg-white">
                              <img
                                src={selectedProduct.additionalImages[0]}
                                alt={`${selectedProduct.name} texture`}
                                className="w-full h-full object-contain p-2"
                              />
                            </div>
                          )}
                        </div>

                        {/* Selected size category photo */}
                        {categoryInfo && (
                          <div className="mb-4">
                            <p className="text-xs text-gray-500 font-medium mb-2">Selected Size Category:</p>
                            <div className="bg-white p-2 rounded-lg border border-gray-200 flex flex-col items-center">
                              <img
                                src={categoryInfo.imageUrl}
                                alt={categoryInfo.label}
                                className="w-full max-w-md h-56 object-contain rounded-lg mb-2"
                                style={{ background: "#f8f8f8" }}
                              />
                              <div className="flex items-center gap-2 mt-2">
                                <categoryInfo.icon className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-semibold">{categoryInfo.label}</span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1 text-center">{categoryInfo.description}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 mb-2">
                          <Package className="h-5 w-5 text-green-600" />
                          <p className="font-medium text-base">{selectedProduct.name}</p>
                        </div>
                        <p className="text-sm text-gray-600">{selectedProduct.description}</p>
                        {selectedProduct.ingredients && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-700">Ingredients:</p>
                            <p className="text-sm text-gray-600">{selectedProduct.ingredients}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-48 text-gray-400">
                        <Search className="h-12 w-12 mb-2" />
                        <p className="text-center">Select a product to see details</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </Card>
      ))}

      <div className="flex justify-between gap-4 mt-8">
        <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
          Back
        </Button>
        <Button type="submit" className="px-8 h-12 text-base">
          Continue to Review
        </Button>
      </div>
    </form>
  );

  const renderStep4 = () => (
    <div className="space-y-4 animate-fade-in">
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
          Product Details
        </h3>
        {products.map((product, index) => {
          const selectedProduct = productsData.find((p) => p.id === product.productId);
          const categoryInfo = PRODUCT_CATEGORIES.find((cat) => cat.value === product.category);

          return (
            <Card key={product.id} className="p-4 border-green-100">
              <div className="flex items-start gap-4">
                {selectedProduct && <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-16 h-16 object-cover rounded-md" />}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-medium text-green-800">{selectedProduct?.name || `Product ${index + 1}`}</p>
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
        <Button onClick={handleSubmitOrder} className="bg-green-600 hover:bg-green-700 h-12 text-lg font-medium" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Order"}
        </Button>
      </div>
      <p className="text-center text-sm text-gray-500 mt-3">By submitting, you'll receive a confirmation email with your order details.</p>
    </div>
  );

  return (
    <Card className="p-8 max-w-4xl mx-auto rounded-2xl shadow-xl border border-green-100 bg-white animate-fade-in">
      {renderArizonaBranding()}
      {!showThankYou && renderProgressBar()}
      <div className="min-h-[400px] flex flex-col justify-center">
        {showThankYou ? (
          renderThankYou()
        ) : (
          <>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </>
        )}
      </div>
    </Card>
  );
};

// Add a simple fade-in animation
// In your global CSS (e.g., index.css or App.css), add:
// .animate-fade-in { animation: fadeIn 0.4s; }
// @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
