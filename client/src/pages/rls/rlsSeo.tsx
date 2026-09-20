import SEO from "@/components/layout/SEO";
import { rlsCanonical } from "@/lib/brand";
import { BRANDS } from "@shared/brands.js";

type Props = {
  title: string;
  description: string;
  path: string;
  keywords?: string;
};

export function RlsSeo({ title, description, path, keywords }: Props) {
  const canonical = rlsCanonical(path);
  return (
    <SEO
      title={title}
      description={description}
      keywords={keywords}
      canonical={canonical}
      siteName={BRANDS.rls.name}
      ogImage="https://organicsoilwholesale.com/images/optimized/dark-mulk-applied-in-outside-of-office-showcase.jpg"
      structuredData={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: BRANDS.rls.name,
        url: BRANDS.rls.publicUrl,
        parentOrganization: {
          "@type": "Organization",
          name: "Soil Seed & Water",
        },
        telephone: BRANDS.rls.phoneDisplay,
        address: {
          "@type": "PostalAddress",
          streetAddress: "1634 N 19th Ave",
          addressLocality: "Phoenix",
          addressRegion: "AZ",
          postalCode: "85009",
          addressCountry: "US",
        },
        description,
      }}
    />
  );
}
