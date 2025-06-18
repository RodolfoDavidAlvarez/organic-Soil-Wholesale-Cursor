import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const WEBHOOK_URL = "https://hook.us1.make.com/bm4eqe7ie77vxt06gx2529x97ecgh28e";

const generateAdminEmail = (data: any) => `
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
        .message-box { background: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Special Request Submission</h1>
        </div>
        <div class="content">
            <div class="customer-info">
                <h2>Customer Information</h2>
                <p><strong>Name:</strong> ${data.name}</p>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Phone:</strong> ${data.phone}</p>
                <p><strong>ZIP Code:</strong> ${data.zipCode}</p>
            </div>
            
            <div class="message-box">
                <h3>Request Details</h3>
                <p>${data.message.replace(/\n/g, "<br>")}</p>
            </div>
            
            <p>This special request was submitted on ${new Date().toLocaleDateString()}.</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} Organic Soil Wholesale</p>
        </div>
    </div>
</body>
</html>
`;

const generateCustomerEmail = (data: any) => `
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
            <h1>Thank You for Your Special Request</h1>
        </div>
        <div class="content">
            <p>Dear ${data.name},</p>
            <p>Thank you for submitting your special request to Organic Soil Wholesale. We have received your request and will review it shortly.</p>
            
            <div style="background: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 6px;">
                <h3>Your Request Details</h3>
                <p>${data.message.replace(/\n/g, "<br>")}</p>
            </div>
            
            <p>A member of our team will contact you within 1-2 business days to discuss your request in detail. If you have any urgent questions, please don't hesitate to contact us at (928) 550-1649.</p>
            <p>Best regards,<br>The Organic Soil Wholesale Team</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} Organic Soil Wholesale</p>
        </div>
    </div>
</body>
</html>
`;

const SpecialRequest: React.FC = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    zipCode: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simplified payload for webhook
      const payload = {
        formType: "Special Request",
        formIdentifier: "special-request-form",
        submittedAt: new Date().toISOString(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        zipCode: formData.zipCode,
        message: formData.message,
        requestDetails: JSON.stringify(formData),
        emails: {
          admin: {
            subject: `New Special Request from ${formData.name}`,
            html: generateAdminEmail({
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              zipCode: formData.zipCode,
              message: formData.message,
              submittedAt: new Date().toISOString(),
            }),
          },
          customer: {
            subject: "Your Special Request with Organic Soil Wholesale",
            html: generateCustomerEmail({
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              zipCode: formData.zipCode,
              message: formData.message,
              submittedAt: new Date().toISOString(),
            }),
          },
        },
      };

      console.log("Submitting special request data to webhook:", JSON.stringify(payload));

      // Send the request to the webhook
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
        description: "Thank you for your request. We'll contact you shortly.",
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        zipCode: "",
        message: "",
      });
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
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Special Request</h1>
      <Card className="p-6 max-w-2xl mx-auto">
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" value={formData.phone} onChange={handleChange} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zipCode">ZIP Code</Label>
            <Input id="zipCode" value={formData.zipCode} onChange={handleChange} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Tell us about your needs</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Please describe your requirements, including product type, quantity, and any specific needs..."
              className="min-h-[150px]"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Request"
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default SpecialRequest;
