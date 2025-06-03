# Webhook Data Structure Documentation

This document outlines the data structure sent to make.com webhooks for both the Contact Form and Order Form. Any changes to these structures must be coordinated with the make.com workflows to ensure proper email delivery and database operations.

## Webhook URL

```
https://hook.us1.make.com/bm4eqe7ie77vxt06gx2529x97ecgh28e
```

## 1. Contact Form Webhook Structure

### Data Structure

```typescript
{
  formType: "Contact us form",
  submittedAt: string, // ISO timestamp
  name: string,
  email: string,
  subject: string,
  message: string,
  emails: {
    admin: {
      subject: string, // "New Contact Form Submission from {name}"
      html: string    // HTML email template
    },
    customer: {
      subject: string, // "Thank You for Contacting Organic Soil Wholesale"
      html: string    // HTML email template
    }
  }
}
```

### Example

```json
{
  "formType": "Contact us form",
  "submittedAt": "2024-03-20T15:30:00Z",
  "name": "John Smith",
  "email": "john@example.com",
  "subject": "Product Inquiry",
  "message": "I would like to know more about your bulk delivery options.",
  "emails": {
    "admin": {
      "subject": "New Contact Form Submission from John Smith",
      "html": "<!DOCTYPE html>..."
    },
    "customer": {
      "subject": "Thank You for Contacting Organic Soil Wholesale",
      "html": "<!DOCTYPE html>..."
    }
  }
}
```

## 2. Order Form Webhook Structure

### Data Structure

```typescript
{
  formType: "Order form",
  submittedAt: string, // ISO timestamp
  businessInfo: {
    name: string,
    email: string,
    phone: string,
    deliveryType: "delivery" | "pickup",
    address?: string,
    pickupLocation?: string
  },
  products: Array<{
    id: string,
    productId: number,
    sizeOption: string,
    quantity: number,
    category?: string,
    productName?: string,
    productDescription?: string,
    productImageUrl?: string,
    categoryName?: string,
    categoryDescription?: string
  }>,
  emails: {
    customer: {
      subject: string,
      html: string    // HTML email template
    },
    admin: {
      subject: string,
      html: string    // HTML email template
    }
  },
  markdown: string    // Markdown formatted order details
}
```

### Example

```json
{
  "formType": "Order form",
  "submittedAt": "2024-03-20T15:30:00Z",
  "businessInfo": {
    "name": "Green Landscaping Co",
    "email": "orders@greenlandscaping.com",
    "phone": "555-0123",
    "deliveryType": "delivery",
    "address": "123 Business Ave, Phoenix, AZ 85001"
  },
  "products": [
    {
      "id": "1234567890",
      "productId": 1,
      "sizeOption": "pallet",
      "quantity": 2,
      "category": "Amendment",
      "productName": "ORGANIC DAIRY COMPOST",
      "productDescription": "Premium organic dairy compost...",
      "productImageUrl": "https://...",
      "categoryName": "Pallets",
      "categoryDescription": "Standard pallet delivery"
    }
  ],
  "emails": {
    "customer": {
      "subject": "Thank You for Your Order",
      "html": "<!DOCTYPE html>..."
    },
    "admin": {
      "subject": "New Order Received",
      "html": "<!DOCTYPE html>..."
    }
  },
  "markdown": "# Order Details\n\n## Business Information..."
}
```

## Important Notes

1. **Data Consistency**

   - The `formType` field is crucial for make.com to route the data correctly
   - All timestamps must be in ISO format
   - Email templates must be properly formatted HTML

2. **Required Fields**

   - Contact Form: name, email, subject, message
   - Order Form: businessInfo (name, email, phone), products array

3. **Email Templates**

   - Both forms include pre-formatted HTML email templates
   - Templates are generated using the `generateCustomerEmail` and `generateAdminEmail` functions
   - Order form also includes a markdown version for additional formatting options

4. **Product Categories**

   - Products must include all required fields for proper categorization
   - Size options must match the predefined categories in the application

5. **Delivery Information**
   - For delivery: address is required
   - For pickup: pickupLocation is required
   - Special restrictions apply for Vicksburg location

## Make.com Workflow Dependencies

1. **Email Sending**

   - Uses the `emails` object to send notifications
   - Customer emails use the customer template
   - Admin emails use the admin template

2. **Database Operations**

   - Order data is stored with all product details
   - Contact form submissions are logged with full message content

3. **Business Rules**
   - Vicksburg location restrictions are enforced
   - Bulk delivery requirements are validated
   - Product compatibility is checked

## Modifications

Any changes to this structure must be coordinated with:

1. The make.com workflow configuration
2. Email template generation functions
3. Database schema
4. Frontend form validation

Please update this document if any changes are made to the webhook structure.
