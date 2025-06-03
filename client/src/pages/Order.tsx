import React from "react";
import { OrderForm } from "@/components/OrderForm";
import SEO from "@/components/layout/SEO";

const Order: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <SEO 
        title="Wholesale Soil Orders - Commercial Quantities"
        description="Order premium organic soil products in bulk quantities for commercial use. Place your wholesale order for pallets, supersacks, or truckload delivery. Minimum order requirements apply."
        keywords="wholesale soil order, bulk soil purchasing, commercial soil order, pallet soil orders, supersack soil, truckload soil delivery, bulk compost order, wholesale potting soil, landscaper soil supplier"
        canonical="https://organicsoilwholesale.com/order"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Wholesale Soil Ordering",
          "provider": {
            "@type": "Organization",
            "name": "Organic Soil Wholesale"
          },
          "serviceType": "Wholesale Supply",
          "areaServed": "Arizona",
          "description": "Order organic soil products in commercial quantities with convenient delivery options",
          "potentialAction": {
            "@type": "OrderAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://organicsoilwholesale.com/order",
              "inLanguage": "en-US",
              "actionPlatform": [
                "http://schema.org/DesktopWebPlatform"
              ]
            },
            "result": {
              "@type": "Order",
              "seller": {
                "@type": "Organization",
                "name": "Organic Soil Wholesale"
              }
            }
          }
        }}
      />
      <h1 className="text-3xl font-bold text-center mb-8">Place Your Wholesale Order</h1>
      <OrderForm />
    </div>
  );
};

export default Order;
