import SEO from "@/components/layout/SEO";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Terms of Service"
        description="Terms of service for Organic Soil Wholesale - wholesale organic soil products and amendments."
        canonical="https://organicsoilwholesale.com/terms"
      />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-primary mb-8">Terms of Service</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground mb-8">
              Last updated: {new Date().getFullYear()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">1. Acceptance of Terms</h2>
              <p className="text-foreground/80 mb-4">
                By accessing and using Organic Soil Wholesale services, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">2. Services</h2>
              <p className="text-foreground/80 mb-4">
                Organic Soil Wholesale provides wholesale organic soil products, amendments, and related services to commercial customers, landscapers, and agricultural professionals.
              </p>
              <ul className="list-disc list-inside text-foreground/80 space-y-2">
                <li>Bulk organic soil amendments and compost</li>
                <li>Delivery and pickup services within our service area</li>
                <li>Custom blending and product consultation</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">3. Orders and Pricing</h2>
              <p className="text-foreground/80 mb-4">
                All orders are subject to availability and confirmation. Pricing is provided upon request and may vary based on quantity, location, and market conditions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">4. Delivery and Service Area</h2>
              <p className="text-foreground/80 mb-4">
                Delivery services are available within a 300-mile radius of our Phoenix, Arizona distribution center. Pickup is available by appointment at our facility.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">5. Product Quality</h2>
              <p className="text-foreground/80 mb-4">
                We strive to provide high-quality organic products. However, natural variations in organic materials may occur. Products are sold "as is" unless otherwise specified.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">6. Limitation of Liability</h2>
              <p className="text-foreground/80 mb-4">
                Organic Soil Wholesale's liability shall not exceed the purchase price of the products sold. We are not responsible for indirect, incidental, or consequential damages.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">7. Contact Information</h2>
              <p className="text-foreground/80 mb-4">
                For questions about these terms, please contact us at:
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-foreground/80">
                  <strong>Email:</strong> ralvarez@soilseedandwater.com<br />
                  <strong>Phone:</strong> (928) 550-1649<br />
                  <strong>Address:</strong> 1634 N 19th Ave, Phoenix, AZ 85009
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;