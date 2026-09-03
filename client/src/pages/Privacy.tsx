import SEO from "@/components/layout/SEO";
import { CUSTOMER_SUPPORT_PHONE_DISPLAY } from "@/config/contact";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Privacy Policy"
        description="Privacy policy for Organic Soil Wholesale - how we collect, use, and protect your information."
        canonical="https://organicsoilwholesale.com/privacy"
      />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-primary mb-8">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground mb-8">
              Last updated: {new Date().getFullYear()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">1. Information We Collect</h2>
              <p className="text-foreground/80 mb-4">
                We collect information you provide directly to us, such as when you:
              </p>
              <ul className="list-disc list-inside text-foreground/80 space-y-2">
                <li>Submit order forms or requests for quotes</li>
                <li>Contact us via phone, email, or contact forms</li>
                <li>Subscribe to our communications</li>
                <li>Apply for a position with Soil Seed &amp; Water</li>
                <li>Visit our website (automatic collection)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">2. Types of Information</h2>
              <p className="text-foreground/80 mb-4">
                The information we may collect includes:
              </p>
              <ul className="list-disc list-inside text-foreground/80 space-y-2">
                <li>Contact information (name, email, phone, address)</li>
                <li>Business information (company name, type of operation)</li>
                <li>Order details and product preferences</li>
                <li>Recruitment information, including resumes, supporting documents, work history, availability, and application answers</li>
                <li>Website usage data (IP address, browser type, pages visited)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">3. How We Use Your Information</h2>
              <p className="text-foreground/80 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-foreground/80 space-y-2">
                <li>Process and fulfill your orders</li>
                <li>Provide customer service and support</li>
                <li>Send you order confirmations and updates</li>
                <li>Improve our products and services</li>
                <li>Evaluate job applications and communicate with candidates</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">4. Information Sharing</h2>
              <p className="text-foreground/80 mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only:
              </p>
              <ul className="list-disc list-inside text-foreground/80 space-y-2">
                <li>With service providers who help us operate our business</li>
                <li>When required by law or to protect our rights</li>
                <li>With your explicit consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">5. Data Security</h2>
              <p className="text-foreground/80 mb-4">
                We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">6. Cookies and Tracking</h2>
              <p className="text-foreground/80 mb-4">
                Our website may use cookies and similar technologies to enhance your browsing experience and analyze website traffic.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">7. Your Rights</h2>
              <p className="text-foreground/80 mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-foreground/80 space-y-2">
                <li>Access and update your personal information</li>
                <li>Request deletion of your data</li>
                <li>Opt out of marketing communications</li>
                <li>Contact us with privacy concerns</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">8. Contact Us</h2>
              <p className="text-foreground/80 mb-4">
                If you have questions about this Privacy Policy or how we handle your information, please contact us:
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-foreground/80">
                  <strong>Email:</strong> info@soilseedandwater.com<br />
                  <strong>Phone:</strong> {CUSTOMER_SUPPORT_PHONE_DISPLAY}<br />
                  <strong>Address:</strong> 1634 N 19th Ave, Phoenix, AZ 85009
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">9. Policy Updates</h2>
              <p className="text-foreground/80 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
