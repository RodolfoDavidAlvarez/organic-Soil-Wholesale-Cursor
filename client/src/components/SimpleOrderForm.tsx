import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2 } from "lucide-react";

interface LeadInfo {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

export const SimpleOrderForm: React.FC = () => {
  const { toast } = useToast();

  const [leadInfo, setLeadInfo] = useState<LeadInfo>({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);


  // Validate form
  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!leadInfo.name.trim()) errors.push("Name is required");
    if (!leadInfo.email.trim()) errors.push("Email is required");
    if (!leadInfo.phone.trim()) errors.push("Phone number is required");

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (leadInfo.email && !emailRegex.test(leadInfo.email)) {
      errors.push("Please enter a valid email address");
    }

    return errors;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach((error) => {
        toast({
          title: "Validation Error",
          description: error,
          variant: "destructive",
        });
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/leads/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(leadInfo),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit form");
      }

      setShowThankYou(true);
      toast({
        title: "Form Submitted",
        description: "Thank you! We'll contact you shortly.",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setLeadInfo({
      name: "",
      email: "",
      phone: "",
      notes: "",
    });
    setShowThankYou(false);
  };

  if (showThankYou) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center space-y-6">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
        <h2 className="text-2xl font-bold text-gray-900">Thank You!</h2>
        <p className="text-gray-600">
          We've received your information and will contact you shortly to discuss your needs.
        </p>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Reference: #{Date.now().toString().slice(-6)}</p>
          <Button onClick={resetForm} className="bg-green-600 hover:bg-green-700">
            Submit Another Inquiry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Request a Quote</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={leadInfo.name}
                onChange={(e) => setLeadInfo({ ...leadInfo, name: e.target.value })}
                placeholder="Enter your name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={leadInfo.email}
                onChange={(e) => setLeadInfo({ ...leadInfo, email: e.target.value })}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                value={leadInfo.phone}
                onChange={(e) => setLeadInfo({ ...leadInfo, phone: e.target.value })}
                placeholder="Enter your phone number"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Tell us about your needs</Label>
              <Textarea
                id="notes"
                value={leadInfo.notes}
                onChange={(e) => setLeadInfo({ ...leadInfo, notes: e.target.value })}
                placeholder="What products are you interested in? Any special requirements or questions?"
                rows={5}
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-center">
          <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 px-8 py-3 text-lg">
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </form>
    </div>
  );
};
