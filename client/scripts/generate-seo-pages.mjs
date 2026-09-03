import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(__dirname, "..");
const distRoot = path.join(clientRoot, "dist");
const templatePath = path.join(distRoot, "index.html");

const SITE_URL = "https://organicsoilwholesale.com";
const BUSINESS_NAME = "Organic Soil Wholesale by Soil Seed & Water";
const PHONE = "(623) 263-3386";
const ADDRESS = {
  streetAddress: "1634 N 19th Ave",
  addressLocality: "Phoenix",
  addressRegion: "AZ",
  postalCode: "85009",
  addressCountry: "US",
};

const absoluteUrl = (pathname = "") => {
  if (!pathname) return SITE_URL;
  if (pathname.startsWith("http://") || pathname.startsWith("https://")) return pathname;
  return `${SITE_URL}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
};

const openingHours = [
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

const products = [
  {
    name: "Simon's Gold",
    category: "Dairy Compost",
    slug: "simons-gold",
    title: "Simon's Gold Dairy Compost",
    description: "Slow-release dairy compost for feeding, rebuilding, and conserving soil in beds, trees, planted areas, and Arizona landscape projects.",
    image: "/images/optimized/dansgold9lbs-1.jpg",
    keywords: "dairy compost, organic compost Phoenix, Arizona compost, soil amendment, bulk compost, compost for gardens, compost for trees",
    offers: [
      ["9 lb Bag", 12.46],
      ["40 lb Bag (1 cu ft)", 24.9],
      ["Super Sack (~2,000 lb)", 150],
      ["Truckload (~24 tons)", 720],
    ],
  },
  {
    name: "Mikey's Worm Poop",
    category: "Worm Castings",
    slug: "mikeys-worm-poop",
    title: "Mikey's Worm Poop Worm Castings",
    description: "Nutrient-rich worm castings for root zones, top dressing, seed starts, garden beds, and soil biology support.",
    image: "/images/optimized/mikeys-worm-poop9lbs.jpg",
    keywords: "worm castings, vermicompost, worm poop fertilizer, root zone amendment, soil biology, worm castings Phoenix",
    offers: [
      ["9 lb Bag", 18.1],
      ["40 lb Bag (1 cu ft)", 34.9],
      ["Super Sack (~2,000 lb)", 399],
    ],
  },
  {
    name: "PlantPal",
    category: "All-Stage Nursery Mix",
    slug: "plantpal",
    title: "PlantPal All-Stage Nursery Mix",
    description: "All-stage nursery potting mix for seed starts, propagation, containers, nurseries, and patio planters.",
    image: "/images/optimized/plantpal10lbs.jpg",
    keywords: "nursery potting mix, all stage potting soil, PlantPal, container soil, seed starter mix, propagation soil, Phoenix potting soil",
    offers: [
      ["1 cu ft Bag", 10.99],
      ["Super Sack (2.2 cu yd)", 247.28],
      ["Truckload (22 pallets)", 4896.05],
    ],
  },
  {
    name: "Nature's Blanket Premium",
    category: "Premium Dark Mulch",
    slug: "natures-blanket-premium",
    title: "Nature's Blanket Premium Dark Mulch",
    description: "Dark premium mulch for landscape finish, moisture retention, weed suppression, gardens, farms, and commercial properties.",
    image: "/images/optimized/natures-blanket-bag-studio.jpg",
    keywords: "premium mulch, dark mulch, organic mulch Phoenix, landscape mulch, mulch delivery, Nature's Blanket Premium",
    offers: [
      ["2 cu ft Bag", 10.99],
      ["Super Sack (2.2 cu yd)", 137.5],
      ["Truckload (~90 cu yd)", 2700],
    ],
  },
];

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "Store"],
  name: BUSINESS_NAME,
  alternateName: "Organic Soil Wholesale",
  description: "Phoenix organic soil, compost, worm castings, potting soil, and mulch supplier for pickup, pallets, super sacks, and qualifying delivery.",
  url: SITE_URL,
  telephone: PHONE,
  address: {
    "@type": "PostalAddress",
    ...ADDRESS,
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 33.4668,
    longitude: -112.0997,
  },
  openingHoursSpecification: openingHours,
  priceRange: "$$",
  paymentAccepted: "Credit Card, Cash, Purchase Order",
  areaServed: [
    { "@type": "State", name: "Arizona" },
    { "@type": "City", name: "Phoenix" },
    { "@type": "Place", name: "Delivery available within 300 miles of Phoenix or Congress, Arizona" },
  ],
};

const productSchema = (product) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  alternateName: product.title,
  description: product.description,
  image: absoluteUrl(product.image),
  brand: { "@type": "Brand", name: "Soil Seed & Water" },
  category: product.category,
  url: absoluteUrl(`/products/${product.slug}`),
  offers: product.offers.map(([name, price]) => ({
    "@type": "Offer",
    name: `${product.name} - ${name}`,
    price,
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    url: absoluteUrl(`/products/${product.slug}`),
    seller: {
      "@type": "LocalBusiness",
      name: BUSINESS_NAME,
    },
  })),
});

const itemListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Organic Soil Wholesale pickup products",
  itemListElement: products.map((product, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: absoluteUrl(`/products/${product.slug}`),
    name: product.name,
    description: product.description,
  })),
};

const routes = [
  {
    path: "/",
    title: "Organic Soil Wholesale | Phoenix Compost, Soil & Mulch Pickup",
    description: "Organic Soil Wholesale by Soil Seed & Water sells Arizona compost, worm castings, potting soil, and mulch for pickup, pallets, super sacks, and qualifying delivery within 300 miles.",
    keywords: "organic soil Phoenix, compost Phoenix, mulch Phoenix, worm castings Phoenix, potting soil Phoenix",
    canonical: SITE_URL,
    schemas: [localBusinessSchema, itemListSchema],
  },
  {
    path: "/products",
    title: "Wholesale Organic Soil Products | Organic Soil Wholesale",
    description: "Buy the four fastest pickup products online: dairy compost, worm castings, PlantPal nursery mix, and Nature's Blanket Premium mulch.",
    keywords: "wholesale compost, organic soil catalog, worm castings wholesale, premium potting soil, organic mulch Phoenix",
    canonical: absoluteUrl("/products"),
    schemas: [localBusinessSchema, itemListSchema],
  },
  {
    path: "/pickup",
    title: "Organic Soil Pickup in Phoenix | Organic Soil Wholesale",
    description: "Buy organic soil, compost, worm castings, potting soil, and mulch online. Pick up at the Organic Soil Wholesale Phoenix yard at 1634 N 19th Ave.",
    keywords: "organic soil pickup Phoenix, compost near me, worm castings Phoenix, mulch pickup Phoenix, potting soil pickup",
    canonical: absoluteUrl("/pickup"),
    schemas: [localBusinessSchema, itemListSchema],
  },
  ...products.map((product) => ({
    path: `/products/${product.slug}`,
    title: `${product.title} | Organic Soil Wholesale`,
    description: product.description,
    keywords: product.keywords,
    canonical: absoluteUrl(`/products/${product.slug}`),
    image: absoluteUrl(product.image),
    schemas: [
      localBusinessSchema,
      productSchema(product),
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Products", item: absoluteUrl("/products") },
          { "@type": "ListItem", position: 2, name: product.name, item: absoluteUrl(`/products/${product.slug}`) },
        ],
      },
    ],
  })),
  {
    path: "/yard-map",
    title: "Phoenix Yard Pickup Map | Organic Soil Wholesale",
    description: "Pickup directions for Organic Soil Wholesale at 1634 N 19th Ave, Phoenix. Enter through the Grand Ave south entrance.",
    keywords: "Organic Soil Wholesale pickup map, 1634 N 19th Ave, Phoenix yard pickup, Grand Ave entrance",
    canonical: absoluteUrl("/yard-map"),
    schemas: [
      localBusinessSchema,
      {
        "@context": "https://schema.org",
        "@type": "Place",
        name: "Organic Soil Wholesale Phoenix Yard Pickup Entrance",
        description: "Customers should enter from the Grand Ave south entrance and follow the yard lane to check-in/loading.",
        url: absoluteUrl("/yard-map"),
        telephone: PHONE,
        address: { "@type": "PostalAddress", ...ADDRESS },
      },
    ],
  },
  {
    path: "/about",
    title: "About Organic Soil Wholesale | Soil Seed & Water",
    description: "Organic Soil Wholesale by Soil Seed & Water supplies Arizona compost, worm castings, potting soil, and mulch for landscape, garden, farm, and nursery projects.",
    keywords: "about Organic Soil Wholesale, Soil Seed & Water, Arizona compost supplier",
    canonical: absoluteUrl("/about"),
    schemas: [localBusinessSchema],
  },
  {
    path: "/contact",
    title: "Contact Organic Soil Wholesale | Soil Seed & Water",
    description: "Call Organic Soil Wholesale at (623) 263-3386 or visit the Phoenix pickup yard at 1634 N 19th Ave.",
    keywords: "Organic Soil Wholesale phone, Soil Seed & Water contact, Phoenix compost supplier contact",
    canonical: absoluteUrl("/contact"),
    schemas: [localBusinessSchema],
  },
  {
    path: "/survey",
    title: "How did we do? | Organic Soil Wholesale",
    description: "Tell Organic Soil Wholesale how your Phoenix yard visit or order felt. Short, honest feedback. Under a minute.",
    keywords: "Organic Soil Wholesale survey, Phoenix yard feedback, Soil Seed and Water customer survey",
    canonical: absoluteUrl("/survey"),
    schemas: [localBusinessSchema],
  },
  {
    path: "/survey/garden-class",
    title: "How did Saturday feel? | The Garden Reset",
    description: "Honest notes on The Garden Reset at Organic Soil Wholesale. For people who registered or came on Saturday, August 22.",
    keywords: "Garden Reset survey, Phoenix garden class feedback, Organic Soil Wholesale class",
    canonical: absoluteUrl("/survey/garden-class"),
    schemas: [localBusinessSchema],
  },
  {
    path: "/faq",
    title: "Organic Soil Wholesale FAQ | Pickup, Delivery & Bulk Soil",
    description: "Answers about Organic Soil Wholesale pickup, delivery, product formats, truckloads, pallets, super sacks, and organic soil products.",
    keywords: "Organic Soil Wholesale FAQ, compost pickup questions, soil delivery questions, bulk soil FAQ",
    canonical: absoluteUrl("/faq"),
    schemas: [localBusinessSchema],
  },
  {
    path: "/win",
    title: "September Big Garden Giveaway | Organic Soil Wholesale",
    description: "Enter free in about 30 seconds for a chance to win a $5,000 garden — everything needed to set up two beds in the Phoenix Valley.",
    keywords: "Phoenix garden giveaway, free garden giveaway, raised garden beds Phoenix, September garden giveaway",
    canonical: absoluteUrl("/win"),
    image: absoluteUrl("/images/giveaway/complete-fall-garden-hero-v9.png"),
    imageType: "image/png",
    imageWidth: "1536",
    imageHeight: "1024",
    schemas: [localBusinessSchema],
  },
  {
    path: "/careers",
    title: "Careers at Soil Seed & Water | Phoenix, Arizona",
    description: "Explore current career opportunities with Soil Seed & Water in Phoenix, Arizona. View open positions and apply online.",
    keywords: "Soil Seed and Water careers, Phoenix jobs, gardening careers Phoenix, soil jobs Arizona",
    canonical: "https://www.organicsoilwholesale.com/careers",
    image: "https://www.organicsoilwholesale.com/images/recruitment/sales-representative-hiring-square-2026.png",
    imageType: "image/png",
    imageWidth: "1254",
    imageHeight: "1254",
    schemas: [localBusinessSchema],
  },
  {
    path: "/careers/sales",
    title: "Sales Representative Career | Soil Seed & Water",
    description: "Apply for the Sales Representative position with Soil Seed & Water in Phoenix, Arizona. Gardening, organic growing, soil biology, and computer skills are preferred.",
    keywords: "Phoenix sales job, gardening job Phoenix, soil sales representative, organic growing careers",
    canonical: "https://www.organicsoilwholesale.com/careers/sales",
    image: "https://www.organicsoilwholesale.com/images/recruitment/sales-representative-hiring-square-2026.png",
    imageType: "image/png",
    imageWidth: "1254",
    imageHeight: "1254",
    schemas: [
      {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        title: "Sales Representative",
        description: "Help gardeners and growers choose products that build healthier soil. Gardening, organic growing, soil biology, customer service, and computer skills are preferred.",
        datePosted: "2026-09-02",
        employmentType: ["FULL_TIME", "PART_TIME"],
        directApply: true,
        hiringOrganization: {
          "@type": "Organization",
          name: "Soil Seed & Water",
          sameAs: "https://www.organicsoilwholesale.com",
        },
        jobLocation: {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Phoenix",
            addressRegion: "AZ",
            addressCountry: "US",
          },
        },
      },
    ],
  },
  {
    path: "/free-worm-castings",
    title: "This offer is no longer available | Organic Soil Wholesale",
    description: "The August free worm castings community gift has ended. Browse current Phoenix pickup deals or products.",
    canonical: absoluteUrl("/free-worm-castings"),
    robots: "noindex, nofollow",
    schemas: [],
  },
  ...["/checkout", "/qr", "/check-in", "/order-confirmation", "/pay-and-pickup"].map((route) => ({
    path: route,
    title: "Organic Soil Wholesale",
    description: "Operational page for Organic Soil Wholesale customers.",
    canonical: absoluteUrl(route),
    robots: "noindex, nofollow",
    schemas: [],
  })),
];

const escapeAttr = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const cleanHead = (html) =>
  html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/\s*<meta\s+name=["']description["'][^>]*>\s*/gi, "\n")
    .replace(/\s*<meta\s+name=["']keywords["'][^>]*>\s*/gi, "\n")
    .replace(/\s*<meta\s+name=["']robots["'][^>]*>\s*/gi, "\n")
    .replace(/\s*<link\s+rel=["']canonical["'][^>]*>\s*/gi, "\n")
    .replace(/\s*<meta\s+property=["']og:[^"']+["'][^>]*>\s*/gi, "\n")
    .replace(/\s*<meta\s+property=["']twitter:[^"']+["'][^>]*>\s*/gi, "\n")
    .replace(/\s*<meta\s+name=["']twitter:[^"']+["'][^>]*>\s*/gi, "\n")
    .replace(/\s*<script\s+type=["']application\/ld\+json["'][\s\S]*?<\/script>\s*/gi, "\n");

const headForRoute = (route) => {
  const image = route.image || absoluteUrl("/images/og-image.jpg");
  const robots = route.robots || "index, follow";
  return `
    <title>${escapeAttr(route.title)}</title>
    <meta name="description" content="${escapeAttr(route.description)}" />
    ${route.keywords ? `<meta name="keywords" content="${escapeAttr(route.keywords)}" />` : ""}
    <meta name="robots" content="${escapeAttr(robots)}" />
    <link rel="canonical" href="${escapeAttr(route.canonical)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${escapeAttr(route.canonical)}" />
    <meta property="og:title" content="${escapeAttr(route.title)}" />
    <meta property="og:description" content="${escapeAttr(route.description)}" />
    <meta property="og:image" content="${escapeAttr(image)}" />
    ${route.imageType ? `<meta property="og:image:secure_url" content="${escapeAttr(image)}" />` : ""}
    ${route.imageType ? `<meta property="og:image:type" content="${escapeAttr(route.imageType)}" />` : ""}
    ${route.imageWidth ? `<meta property="og:image:width" content="${escapeAttr(route.imageWidth)}" />` : ""}
    ${route.imageHeight ? `<meta property="og:image:height" content="${escapeAttr(route.imageHeight)}" />` : ""}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${escapeAttr(route.canonical)}" />
    <meta name="twitter:title" content="${escapeAttr(route.title)}" />
    <meta name="twitter:description" content="${escapeAttr(route.description)}" />
    <meta name="twitter:image" content="${escapeAttr(image)}" />
    ${route.schemas.map((schema) => `<script type="application/ld+json">${JSON.stringify(schema)}</script>`).join("\n    ")}
  `;
};

const writeRoute = async (template, route) => {
  const html = cleanHead(template).replace("</head>", () => `${headForRoute(route)}\n  </head>`);
  const target =
    route.path === "/"
      ? path.join(distRoot, "index.html")
      : path.join(distRoot, route.path.replace(/^\//, ""), "index.html");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, html);
};

const template = await readFile(templatePath, "utf8");
await Promise.all(routes.map((route) => writeRoute(template, route)));
console.log(`Generated SEO HTML for ${routes.length} routes.`);
