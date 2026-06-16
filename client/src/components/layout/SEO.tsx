import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  robots?: string;
  structuredData?: any | any[];
  children?: React.ReactNode;
}

/**
 * SEO component for managing page-specific metadata
 * Requires react-helmet-async to be set up in the app
 */
const SEO = ({
  title,
  description,
  keywords,
  canonical,
  ogImage = 'https://organicsoilwholesale.com/images/og-image.jpg',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  robots,
  structuredData,
  children,
}: SEOProps) => {
  // Base title for the website
  const baseTitle = 'Organic Soil Wholesale';
  
  // Format the page title
  const pageTitle = title 
    ? `${title} | ${baseTitle}`
    : 'Organic Soil Wholesale | Bulk Soil Amendments for Commercial Growers & Landscapers';

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      {title && <title>{pageTitle}</title>}
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      {robots && <meta name="robots" content={robots} />}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      {canonical && <meta property="og:url" content={canonical} />}
      {title && <meta property="og:title" content={pageTitle} />}
      {description && <meta property="og:description" content={description} />}
      {ogImage && <meta property="og:image" content={ogImage} />}

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      {canonical && <meta name="twitter:url" content={canonical} />}
      {title && <meta name="twitter:title" content={pageTitle} />}
      {description && <meta name="twitter:description" content={description} />}
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* Structured Data */}
      {structuredData && (Array.isArray(structuredData) ? structuredData : [structuredData]).map((data, index) => (
        <script key={`structured-data-${index}`} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}

      {/* Additional head elements */}
      {children}
    </Helmet>
  );
};

export default SEO;
