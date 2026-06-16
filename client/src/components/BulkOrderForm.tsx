import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

const WEBHOOK_URL = "https://hook.us1.make.com/bm4eqe7ie77vxt06gx2529x97ecgh28e";

interface BulkOrderFormProps {
  onClose: () => void;
}

const generateAdminEmail = (formData: any) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2C3E50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .customer-info { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 6px; }
        .product-info { background: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Bulk Order Request</h1>
        </div>
        <div class="content">
            <div class="customer-info">
                <h2>Customer Information</h2>
                <p><strong>Company Name:</strong> ${formData.companyName}</p>
                <p><strong>Contact Name:</strong> ${formData.contactName}</p>
                <p><strong>Email:</strong> ${formData.email}</p>
                <p><strong>Phone:</strong> ${formData.phone}</p>
            </div>
            
            <div class="product-info">
                <h2>Order Details</h2>
                <p><strong>Product:</strong> ${formData.productName}</p>
                <p><strong>Quantity:</strong> ${formData.quantity} units</p>
                <p><strong>Preferred Delivery Date:</strong> ${formData.deliveryDate}</p>
                ${formData.notes ? `<p><strong>Additional Notes:</strong> ${formData.notes}</p>` : ""}
            </div>
            
            <p>This bulk order request was submitted on ${new Date().toLocaleDateString()}.</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} Organic Soil Wholesale</p>
        </div>
    </div>
</body>
</html>
`;

const generateCustomerEmail = (formData: any) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Thank You for Your Bulk Order Request</h1>
        </div>
        <div class="content">
            <p>Dear ${formData.contactName},</p>
            <p>Thank you for your interest in Organic Soil Wholesale bulk products. We have received your request and will get back to you shortly with a custom quote.</p>
            
            <div style="background: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 6px;">
                <h3>Your Request Details</h3>
                <p><strong>Product:</strong> ${formData.productName}</p>
                <p><strong>Quantity:</strong> ${formData.quantity} units</p>
                <p><strong>Preferred Delivery Date:</strong> ${formData.deliveryDate}</p>
            </div>
            
            <p>If you have any additional questions or information to provide, please don't hesitate to contact us at (602) 637-0032.</p>
            <p>Best regards,<br>The Organic Soil Wholesale Team</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} Organic Soil Wholesale</p>
        </div>
    </div>
</body>
</html>
`;

const BulkOrderForm = ({ onClose }: BulkOrderFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedProduct, setSelectedProduct] = useState("");

  const products = [
    { id: 1, name: "Dairy Compost" },
    { id: 7, name: "Turf Blend" },
    { id: 2, name: "Worm Castings" },
    { id: 6, name: "Zeolite" },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formRef.current) return;

      const formData = new FormData(formRef.current);
      const formValues: Record<string, string> = {};

      formData.forEach((value, key) => {
        formValues[key] = value.toString();
      });

      // Add the product name based on selected ID
      const productName = products.find((p) => p.id.toString() === formValues.product)?.name || "Unknown Product";
      formValues.productName = productName;

      // Simplified payload for webhook
      const payload = {
        formType: "Bulk Order Request",
        formIdentifier: "bulk-order-form",
        submittedAt: new Date().toISOString(),
        name: formValues.companyName,
        contactName: formValues.contactName,
        email: formValues.email,
        phone: formValues.phone,
        product: formValues.productName,
        quantity: formValues.quantity,
        deliveryDate: formValues.deliveryDate,
        notes: formValues.notes || "",
        orderDetails: JSON.stringify(formValues),
        emails: {
          admin: {
            subject: `New Bulk Order Request from ${formValues.companyName}`,
            html: generateAdminEmail({
              companyName: formValues.companyName,
              contactName: formValues.contactName,
              email: formValues.email,
              phone: formValues.phone,
              productName: formValues.productName,
              quantity: formValues.quantity,
              deliveryDate: formValues.deliveryDate,
              notes: formValues.notes || "",
              submittedAt: new Date().toISOString(),
            }),
          },
          customer: {
            subject: "Your Bulk Order Request with Organic Soil Wholesale",
            html: generateCustomerEmail({
              companyName: formValues.companyName,
              contactName: formValues.contactName,
              email: formValues.email,
              phone: formValues.phone,
              productName: formValues.productName,
              quantity: formValues.quantity,
              deliveryDate: formValues.deliveryDate,
              notes: formValues.notes || "",
              submittedAt: new Date().toISOString(),
            }),
          },
        },
      };

      console.log("Submitting bulk order data to webhook:", JSON.stringify(payload));

      try {
        // Send the bulk order to the webhook
        const requestStartTime = new Date().getTime();
        console.log(`Making request to webhook at ${WEBHOOK_URL} at ${new Date().toISOString()}`);

        const response = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const requestEndTime = new Date().getTime();
        const requestDuration = requestEndTime - requestStartTime;
        console.log(`Webhook request took ${requestDuration}ms`);

        let responseText = "";
        try {
          responseText = await response.text();
          console.log(`Webhook response text: ${responseText}`);
        } catch (e) {
          console.error("Error reading response text:", e);
        }

        if (!response.ok) {
          console.error("Webhook error response:", {
            status: response.status,
            statusText: response.statusText,
            responseText,
            url: WEBHOOK_URL,
          });
          throw new Error(`Failed to submit form: ${response.status} ${response.statusText}`);
        }

        console.log("Webhook request successful!", {
          status: response.status,
          responseText,
        });

        toast({
          title: "Request Submitted",
          description: "We'll contact you shortly with a custom quote.",
        });

        onClose();
      } catch (fetchError) {
        const errorDetails = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
        console.error("Fetch error details:", {
          message: errorDetails.message,
          stack: errorDetails.stack,
          url: WEBHOOK_URL,
        });
        throw fetchError; // Re-throw to be caught by the outer try-catch
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Error",
        description: "There was an error submitting your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Request Bulk Order Quote</CardTitle>
        <CardDescription>Fill out the form below and we'll get back to you with a custom quote for your bulk order needs.</CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" name="companyName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name</Label>
              <Input id="contactName" name="contactName" required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product">Product</Label>
            <Select name="product" value={selectedProduct} onValueChange={setSelectedProduct} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Estimated Quantity (units)</Label>
              <Input id="quantity" name="quantity" type="number" min="1" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryDate">Preferred Delivery Date</Label>
              <Input id="deliveryDate" name="deliveryDate" type="date" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea id="notes" name="notes" placeholder="Please provide any additional information about your order requirements..." rows={4} />
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default BulkOrderForm;
