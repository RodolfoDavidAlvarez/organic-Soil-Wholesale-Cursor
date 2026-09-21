import { CUSTOMER_SUPPORT_PHONE_DISPLAY, PHOENIX_YARD_ADDRESS } from "@/config/contact";

export const SITE_URL = "https://organicsoilwholesale.com";
export const SEO_BUSINESS_NAME = "Organic Soil Wholesale by Soil Seed & Water";
export const SEO_ADDRESS = {
  streetAddress: "1634 N 19th Ave",
  addressLocality: "Phoenix",
  addressRegion: "AZ",
  postalCode: "85009",
  addressCountry: "US",
};

export const SEO_OPENING_HOURS = [
  {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    opens: "08:00",
    closes: "13:00",
  },
  {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    opens: "14:00",
    closes: "16:00",
  },
];

export const PAY_PICKUP_PRODUCT_SEO = [
  {
    id: 1000,
    name: "Simon's Gold",
    category: "Dairy Compost",
    slug: "simons-gold",
    description: "Slow-release dairy compost for feeding, rebuilding, and conserving soil in beds, trees, planted areas, and Arizona landscape projects.",
    image: "/images/optimized/simons-gold-bag-context.jpg",
    offers: [
      { name: "9 lb Bag", price: 12.46 },
      { name: "40 lb Bag (1 cu ft)", price: 24.9 },
      { name: "Super Sack (~2,000 lb)", price: 150 },
      { name: "Bulk Pickup (per ton)", price: 45 },
      { name: "Truckload (24 tons)", price: 720 },
    ],
  },
  {
    id: 134,
    name: "Nature's Blanket",
    category: "Organic Mulch",
    slug: "natures-blanket",
    description: "Wood fiber mulch with dairy compost for weed suppression, moisture retention, and a clean landscape finish.",
    image: "/images/optimized/natures-blanket-bag-context.jpg",
    offers: [
      { name: "2 cu ft Bag", price: 8.99 },
      { name: "Super Sack (2.2 cu yd)", price: 112.38 },
      { name: "Flatbed (22 pallets)", price: 2224.72 },
    ],
  },
  {
    id: 3000,
    name: "Nature's Blanket Premium",
    category: "Premium Dark Mulch",
    slug: "natures-blanket-premium",
    description: "Premium healthy soil mulch made with wood fiber, worm castings, and dairy compost for clean landscape finish, moisture retention, weed suppression, gardens, farms, and commercial properties.",
    image: "/images/optimized/natures-blanket-bag-studio.jpg",
    offers: [
      { name: "2 cu ft Bag (~60 lb)", price: 10.99 },
      { name: "Super Sack (2.2 cu yd)", price: 137.5 },
      { name: "Bulk Pickup (per cu yd)", price: 44 },
      { name: "Truckload (24 tons · ~60 cu yd)", price: 1440 },
      { name: "Flatbed (22 pallets)", price: 2700 },
    ],
  },
  {
    id: 1034,
    name: "Sabrina Kills Bugs",
    category: "All-Organic Insecticide",
    slug: "sabrina-kills-bugs",
    description: "32 oz plant-based insecticide spray. 3-in-1 fungicide, insecticide, and miticide. No neem oil or soap.",
    image: "/images/products/sabrina-kills-bugs.png",
    offers: [
      { name: "32 oz bottle", price: 18.99 },
      { name: "1 gallon", price: 89.99 },
    ],
  },
] as const;

export const absoluteUrl = (path = "") => {
  if (!path) return SITE_URL;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

export const buildLocalBusinessSchema = () => ({
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "Store"],
  name: SEO_BUSINESS_NAME,
  alternateName: "Organic Soil Wholesale",
  description: "Phoenix organic soil, compost, worm castings, potting soil, and mulch supplier for pickup, pallets, super sacks, and qualifying delivery.",
  url: SITE_URL,
  telephone: CUSTOMER_SUPPORT_PHONE_DISPLAY,
  address: {
    "@type": "PostalAddress",
    ...SEO_ADDRESS,
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 33.4668,
    longitude: -112.0997,
  },
  openingHoursSpecification: SEO_OPENING_HOURS,
  priceRange: "$$",
  paymentAccepted: "Credit Card, Cash, Purchase Order",
  areaServed: [
    { "@type": "State", name: "Arizona" },
    { "@type": "City", name: "Phoenix" },
    { "@type": "Place", name: "Delivery available within 300 miles of Phoenix or Congress, Arizona" },
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Organic soil pickup and delivery formats",
    itemListElement: PAY_PICKUP_PRODUCT_SEO.map((product) => ({
      "@type": "OfferCatalog",
      name: product.name,
      itemListElement: product.offers.map((offer) => ({
        "@type": "Offer",
        name: `${product.name} - ${offer.name}`,
        price: offer.price,
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: absoluteUrl(`/products/${product.slug}`),
      })),
    })),
  },
});

export const buildProductsItemListSchema = () => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Organic Soil Wholesale pickup products",
  itemListElement: PAY_PICKUP_PRODUCT_SEO.map((product, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: absoluteUrl(`/products/${product.slug}`),
    name: product.name,
    description: product.description,
  })),
});

export const buildYardMapSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Place",
  name: "Organic Soil Wholesale Phoenix Yard Pickup Entrance",
  description: "Pickup entrance map for Organic Soil Wholesale. Customers should enter from the Grand Ave south entrance and follow the yard lane to check-in/loading.",
  url: absoluteUrl("/yard-map"),
  telephone: CUSTOMER_SUPPORT_PHONE_DISPLAY,
  address: {
    "@type": "PostalAddress",
    ...SEO_ADDRESS,
  },
  containedInPlace: {
    "@type": "LocalBusiness",
    name: SEO_BUSINESS_NAME,
    address: PHOENIX_YARD_ADDRESS,
  },
});
