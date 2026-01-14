import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Map, Phone, Mail, Clock } from "lucide-react";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// const WEBHOOK_URL = "https://hook.us1.make.com/bm4eqe7ie77vxt06gx2529x97ecgh28e"; // Deprecated - using internal API now

const generateAdminEmail = (data: FormValues) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2C3E50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .message-box { background: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 6px; }
        .customer-info { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Contact Form Submission</h1>
        </div>
        <div class="content">
            <div class="customer-info">
                <h2>Contact Information</h2>
                <p><strong>Name:</strong> ${data.name}</p>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Subject:</strong> ${data.subject}</p>
            </div>
            
            <div class="message-box">
                <h3>Message</h3>
                <p>${data.message.replace(/\n/g, "<br>")}</p>
            </div>
            
            <p>This message was submitted through the contact form on ${new Date().toLocaleDateString()}.</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} Organic Soil Wholesale</p>
        </div>
    </div>
</body>
</html>
`;

const generateCustomerEmail = (data: FormValues) => `
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
            <h1>Thank You for Contacting Us</h1>
        </div>
        <div class="content">
            <p>Dear ${data.name},</p>
            <p>Thank you for reaching out to Organic Soil Wholesale. We have received your message and will get back to you as soon as possible.</p>
            
            <div style="background: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 6px;">
                <h3>Your Message Details</h3>
                <p><strong>Subject:</strong> ${data.subject}</p>
                <p><strong>Message:</strong></p>
                <p>${data.message.replace(/\n/g, "<br>")}</p>
            </div>
            
            <p>If you have any additional questions or information to provide, please don't hesitate to contact us.</p>
            <p>Best regards,<br>The Organic Soil Wholesale Team</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} Organic Soil Wholesale</p>
        </div>
    </div>
</body>
</html>
`;

const formSchema = z.object({
  name: z.string().min(2, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  subject: z.string().min(2, { message: "Subject is required" }),
  message: z.string().min(10, { message: "Message must be at least 10 characters" }),
});

type FormValues = z.infer<typeof formSchema>;

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contact/submit', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit contact form");
      }

      const result = await response.json();

      toast({
        title: "Message Sent",
        description: "Thank you for your message. We'll get back to you soon!",
      });

      form.reset();
    } catch (error) {
      console.error("Contact form error:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "There was an error sending your message. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-16 bg-neutral-50">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-heading font-bold text-primary mb-4">Contact Us</h1>
            <p className="text-lg text-neutral-800 max-w-3xl mx-auto">
              Have questions about our products or wholesale program? We're here to help.
              <span className="block text-sm text-neutral-600 mt-2">
                A division of{" "}
                <a href="https://soilseedandwater.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  Soil Seed and Water
                </a>
              </span>
            </p>
          </div>

          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3 mb-8 md:mb-0">
              <Card className="h-full">
                <CardContent className="p-6">
                  <h3 className="font-heading font-semibold text-lg mb-4">Contact Information</h3>

                  <div className="space-y-6">
                    <div className="flex items-start">
                      <Map className="text-primary mt-1 mr-3 h-5 w-5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium">Address</h4>
                        <p className="text-neutral-700">
                          16.34 N 19th Ave
                          <br />
                          Phoenix, AZ 85009
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Phone className="text-primary mt-1 mr-3 h-5 w-5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium">Phone</h4>
                        <p className="text-neutral-700">
                          <a href="tel:9285501649" className="text-primary hover:underline">
                            (928) 550-1649
                          </a>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Mail className="text-primary mt-1 mr-3 h-5 w-5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium">Email</h4>
                        <p className="text-neutral-700">info@soilseedandwater.com</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Clock className="text-primary mt-1 mr-3 h-5 w-5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium">Business Hours</h4>
                        <p className="text-neutral-700">
                          Monday - Friday: 8am - 5pm
                          <br />
                          Saturday: 9am - 2pm
                          <br />
                          Sunday: Closed
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:w-2/3 md:pl-8">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-heading font-semibold text-lg mb-4">Send Us a Message</h3>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Your Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address *</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="you@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject *</FormLabel>
                            <FormControl>
                              <Input placeholder="How can we help you?" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message *</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Please provide details about your inquiry..." className="resize-none min-h-[150px]" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="bg-primary hover:bg-primary-light text-white" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Send Message"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
