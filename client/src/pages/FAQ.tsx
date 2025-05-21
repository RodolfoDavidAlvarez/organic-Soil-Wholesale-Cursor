import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const FAQ = () => {
  const faqs = [
    {
      question: "What are the minimum order quantities for wholesale?",
      answer: "Minimum order quantities vary by product. Generally, we require a minimum purchase of 10 units for bagged products and 1 unit for totes. Customized bulk options are available for larger operations. Full details are available after wholesale account approval."
    },
    {
      question: "Do you offer delivery services?",
      answer: "Yes, we offer delivery services within a 100-mile radius of our facility for orders exceeding certain volume thresholds. Delivery fees are calculated based on distance and order size. For locations outside our delivery zone, we can arrange third-party shipping at competitive rates."
    },
    {
      question: "How long does the wholesale approval process take?",
      answer: "The wholesale approval process typically takes 1-2 business days. Once approved, you'll receive login credentials to access our wholesale portal where you can view pricing and place orders. For expedited approval, please contact our wholesale department directly."
    },
    {
      question: "Are your products certified organic?",
      answer: "Many of our products are certified by the Organic Materials Review Institute (OMRI) and the US Compost Council. Specific certifications for each product are listed on their detail pages. We maintain strict quality control processes to ensure all our products meet or exceed industry standards."
    },
    {
      question: "Can I get custom blends for my specific growing needs?",
      answer: "Yes, we offer custom blending services for wholesale customers with specific requirements. Our agronomists can work with you to develop specialized formulations for your unique growing conditions. Custom blends require minimum order quantities and may have longer lead times. Contact us for more information."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, ACH transfers, and business checks. For established wholesale partners, we offer Net 30 payment terms after a credit application and approval process."
    },
    {
      question: "Do you offer seasonal discounts or promotions?",
      answer: "Yes, we offer seasonal promotions and volume-based discounts for our wholesale partners. These promotions are communicated through our newsletter and directly to our wholesale customers. Sign up for our newsletter to stay informed about upcoming special offers."
    },
    {
      question: "How should I store your products?",
      answer: "For optimal quality, our products should be stored in a cool, dry place away from direct sunlight. Bagged products should be kept off the ground and unopened until ready for use. Once opened, reseal the bag tightly or transfer to a sealed container to prevent moisture absorption."
    },
    {
      question: "What is your return policy?",
      answer: "We stand by the quality of our products. If you receive damaged or defective products, please contact us within 7 days of delivery with photos and details. For wholesale orders, returns of undamaged products may be subject to a restocking fee. Custom blended products cannot be returned unless defective."
    },
    {
      question: "Do you ship internationally?",
      answer: "Currently, we only ship within the continental United States. We're actively working on expanding our shipping capabilities to include international destinations. Please contact us directly if you have specific international shipping requirements, and we'll do our best to accommodate your needs."
    }
  ];

  return (
    <section id="faq" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-heading font-bold text-primary mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-neutral-800 max-w-3xl mx-auto">
            Find answers to common questions about our products and wholesale program.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border border-neutral-200 rounded-lg px-6">
                <AccordionTrigger className="text-lg font-heading font-semibold">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-neutral-700 pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="text-center mt-12 space-y-4">
            <p className="text-neutral-800">
              Didn't find an answer to your question?
            </p>
            <Link href="/contact">
              <Button className="bg-primary hover:bg-primary-light text-white">
                Contact Our Support Team
              </Button>
            </Link>
          </div>
        </div>

        {/* Additional Resources Section */}
        <div className="mt-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-heading font-bold text-primary mb-4">
              Additional Resources
            </h2>
            <p className="text-neutral-800 max-w-3xl mx-auto">
              Explore these resources to learn more about our products and how to get the best results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-neutral-50 p-6 rounded-lg">
              <h3 className="font-heading font-semibold text-lg mb-3">Product Guides</h3>
              <p className="text-neutral-700 mb-4">
                Detailed guides on how to use our products effectively for different applications.
              </p>
              <a href="#" className="text-primary hover:underline font-medium">
                Download Guides →
              </a>
            </div>

            <div className="bg-neutral-50 p-6 rounded-lg">
              <h3 className="font-heading font-semibold text-lg mb-3">Growing Tips</h3>
              <p className="text-neutral-700 mb-4">
                Expert advice on maximizing your growing potential with our organic soil products.
              </p>
              <a href="#" className="text-primary hover:underline font-medium">
                Read Our Blog →
              </a>
            </div>

            <div className="bg-neutral-50 p-6 rounded-lg">
              <h3 className="font-heading font-semibold text-lg mb-3">Wholesale Information</h3>
              <p className="text-neutral-700 mb-4">
                Learn more about our wholesale program, benefits, and how to qualify.
              </p>
              <Link href="/onboarding">
                <a className="text-primary hover:underline font-medium">
                  Wholesale Program →
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
