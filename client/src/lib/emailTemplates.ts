import { productsData } from "../data/productInfo";
import { PRODUCT_CATEGORIES } from "../data/categories";

interface OrderData {
  businessInfo: {
    name: string;
    email: string;
    phone: string;
    deliveryType: "delivery" | "pickup";
    address?: string;
    pickupLocation?: string;
  };
  products: Array<{
    id: string;
    productId: number;
    sizeOption: string;
    quantity: number;
    category: string;
  }>;
  submittedAt: string;
}

export const generateCustomerEmail = (orderData: OrderData): string => `
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Thank You for Your Order!</h1>
        </div>
        <div class="content">
            <p>Dear ${orderData.businessInfo.name},</p>
            <p>Thank you for choosing Organic Soil Wholesale. We're excited to process your order!</p>
            
            <div class="order-details">
                <h2>Order Details</h2>
                <p><strong>Order Reference:</strong> ${orderData.submittedAt.slice(-6)}</p>
                <p><strong>Order Date:</strong> ${new Date(orderData.submittedAt).toLocaleDateString()}</p>
                
                <h3>Products Ordered:</h3>
                ${orderData.products
                  .map((product) => {
                    const productData = productsData.find((p) => p.id === product.productId);
                    const categoryInfo = PRODUCT_CATEGORIES.find((cat) => cat.value === product.category);
                    return `
                    <div class="product-item">
                        <h4>${productData?.productType || "Product"}</h4>
                        <p><strong>Category:</strong> ${categoryInfo?.label || "Standard"}</p>
                        <p><strong>Size Option:</strong> ${product.sizeOption}</p>
                        <p><strong>Quantity:</strong> ${product.quantity}</p>
                    </div>
                  `;
                  })
                  .join("")}
            </div>

            <p>Our team will contact you shortly to confirm the details and discuss delivery arrangements.</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} Organic Soil Wholesale</p>
        </div>
    </div>
</body>
</html>
`;

export const generateAdminEmail = (orderData: OrderData): string => `
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Order Received</h1>
        </div>
        <div class="content">
            <div class="customer-info">
                <h2>Customer Information</h2>
                <p><strong>Business Name:</strong> ${orderData.businessInfo.name}</p>
                <p><strong>Email:</strong> ${orderData.businessInfo.email}</p>
                <p><strong>Phone:</strong> ${orderData.businessInfo.phone}</p>
                <p><strong>Delivery Type:</strong> ${orderData.businessInfo.deliveryType}</p>
                ${
                  orderData.businessInfo.deliveryType === "delivery"
                    ? `<p><strong>Delivery Address:</strong> ${orderData.businessInfo.address}</p>`
                    : `<p><strong>Pickup Location:</strong> ${orderData.businessInfo.pickupLocation}</p>`
                }
            </div>
            
            <div class="order-details">
                <h2>Order Details</h2>
                <p><strong>Order Reference:</strong> ${orderData.submittedAt.slice(-6)}</p>
                <p><strong>Order Date:</strong> ${new Date(orderData.submittedAt).toLocaleDateString()}</p>
                
                <h3>Products Ordered:</h3>
                ${orderData.products
                  .map((product) => {
                    const productData = productsData.find((p) => p.id === product.productId);
                    const categoryInfo = PRODUCT_CATEGORIES.find((cat) => cat.value === product.category);
                    return `
                    <div class="product-item">
                        <h4>${productData?.productType || "Product"}</h4>
                        <p><strong>Category:</strong> ${categoryInfo?.label || "Standard"}</p>
                        <p><strong>Size Option:</strong> ${product.sizeOption}</p>
                        <p><strong>Quantity:</strong> ${product.quantity}</p>
                    </div>
                  `;
                  })
                  .join("")}
            </div>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} Organic Soil Wholesale</p>
        </div>
    </div>
</body>
</html>
`;

export const generateOrderMarkdown = (orderData: OrderData): string => `
# Order Details - ${new Date(orderData.submittedAt).toLocaleDateString()}

## Customer Information
- **Business Name:** ${orderData.businessInfo.name}
- **Email:** ${orderData.businessInfo.email}
- **Phone:** ${orderData.businessInfo.phone}
- **Delivery Type:** ${orderData.businessInfo.deliveryType}
${
  orderData.businessInfo.deliveryType === "delivery"
    ? `- **Delivery Address:** ${orderData.businessInfo.address}`
    : `- **Pickup Location:** ${orderData.businessInfo.pickupLocation}`
}

## Order Summary
- **Order Reference:** ${orderData.submittedAt.slice(-6)}
- **Order Date:** ${new Date(orderData.submittedAt).toLocaleDateString()}
- **Total Products:** ${orderData.products.length}

## Products Ordered
${orderData.products
  .map((product, index) => {
    const productData = productsData.find((p) => p.id === product.productId);
    const categoryInfo = PRODUCT_CATEGORIES.find((cat) => cat.value === product.category);
    return `
### Product ${index + 1}: ${productData?.productType || "Product"}
- **Category:** ${categoryInfo?.label || "Standard"}
- **Size Option:** ${product.sizeOption}
- **Quantity:** ${product.quantity}
`;
  })
  .join("\n")}

## Action Items
- Order received through online portal
- Customer to be contacted within 24 hours
- Confirm product availability and delivery timeline
- Send final quote with applicable discounts

---
*Generated on ${new Date().toLocaleString()}*
`;
