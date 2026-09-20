/**
 * Multi-brand identity for the SSW storefront family.
 *
 * This repo hosts Organic Soil Wholesale (primary) and Regenerative Landscape
 * Supply (landscape-pro front door). My Organic Soil is a sibling system
 * (sales portal) — listed here for identity only, not as a storefront.
 *
 * Resolution order: explicit brand id → dedicated hostname → /rls path
 * prefix → ?brand=rls → Organic Soil Wholesale default.
 */

export const CUSTOMER_SUPPORT_PHONE_DISPLAY = "(623) 263-3386";
export const CUSTOMER_SUPPORT_PHONE_TEL = "tel:+16232633386";
export const PHOENIX_YARD_ADDRESS = "1634 N 19th Ave, Phoenix, AZ 85009";

/** @typedef {'osw' | 'mos' | 'rls'} BrandId */

/** @typedef {'contact' | 'lead' | 'quote' | 'consult' | 'special' | 'callback'} LeadKind */

/**
 * @typedef {object} BrandIdentity
 * @property {BrandId} id
 * @property {string} name
 * @property {string} shortName
 * @property {string} parent
 * @property {string} domain
 * @property {string[]} hosts
 * @property {string} publicUrl
 * @property {string} phoneDisplay
 * @property {string} phoneTel
 * @property {string} email
 * @property {string} yardAddress
 * @property {string} tagline
 * @property {{ primary: string, accent: string, paper?: string }} theme
 * @property {boolean} storefrontInThisRepo
 */

/** @type {Record<BrandId, BrandIdentity>} */
export const BRANDS = {
  osw: {
    id: "osw",
    name: "Organic Soil Wholesale",
    shortName: "OSW",
    parent: "Soil Seed & Water",
    domain: "organicsoilwholesale.com",
    hosts: ["organicsoilwholesale.com", "www.organicsoilwholesale.com"],
    publicUrl: "https://organicsoilwholesale.com",
    phoneDisplay: CUSTOMER_SUPPORT_PHONE_DISPLAY,
    phoneTel: CUSTOMER_SUPPORT_PHONE_TEL,
    email: "info@soilseedandwater.com",
    yardAddress: PHOENIX_YARD_ADDRESS,
    tagline: "Arizona compost, soils, and mulch for pickup and wholesale.",
    theme: { primary: "#264027", accent: "#7BA05B" },
    storefrontInThisRepo: true,
  },
  mos: {
    id: "mos",
    name: "My Organic Soil",
    shortName: "MOS",
    parent: "Soil Seed & Water",
    domain: "myorganicsoil.com",
    hosts: ["myorganicsoil.com", "www.myorganicsoil.com"],
    publicUrl: "https://myorganicsoil.com",
    phoneDisplay: CUSTOMER_SUPPORT_PHONE_DISPLAY,
    phoneTel: CUSTOMER_SUPPORT_PHONE_TEL,
    email: "info@soilseedandwater.com",
    yardAddress: PHOENIX_YARD_ADDRESS,
    tagline: "Sales portal and yard operations for Soil Seed & Water.",
    theme: { primary: "#1F3D2B", accent: "#6BA368" },
    storefrontInThisRepo: false,
  },
  rls: {
    id: "rls",
    name: "Regenerative Landscape Supply",
    shortName: "RLS",
    parent: "Soil Seed & Water / Organic Soil Wholesale",
    domain: "regenerativelandscapesupply.com",
    hosts: ["regenerativelandscapesupply.com", "www.regenerativelandscapesupply.com"],
    publicUrl: "https://regenerativelandscapesupply.com",
    phoneDisplay: CUSTOMER_SUPPORT_PHONE_DISPLAY,
    phoneTel: CUSTOMER_SUPPORT_PHONE_TEL,
    email: "info@soilseedandwater.com",
    yardAddress: PHOENIX_YARD_ADDRESS,
    tagline: "Soil-first supply for landscape professionals and the properties they manage.",
    theme: { primary: "#1B2E1F", accent: "#C4A574", paper: "#F4EFE6" },
    storefrontInThisRepo: true,
  },
};

export const DEFAULT_BRAND_ID = "osw";

/** Marketing routes served by the RLS surface (no /rls prefix). */
export const RLS_MARKETING_PATHS = [
  "/",
  "/soil-dashboard",
  "/products",
  "/programs",
  "/professionals",
  "/consult",
  "/contact",
];

const KIND_SUFFIX = {
  contact: "contact_form",
  lead: "lead_form",
  quote: "quote_request",
  consult: "consult_request",
  special: "special_request",
  callback: "order_callback",
};

export function normalizeHost(host) {
  return String(host || "")
    .split(",")[0]
    .split(":")[0]
    .trim()
    .toLowerCase();
}

export function normalizePathname(pathname) {
  const raw = String(pathname || "/").split("?")[0] || "/";
  if (raw.length > 1 && raw.endsWith("/")) return raw.slice(0, -1);
  return raw || "/";
}

export function isBrandId(value) {
  return value === "osw" || value === "mos" || value === "rls";
}

export function getBrand(id) {
  return BRANDS[id] || BRANDS[DEFAULT_BRAND_ID];
}

export function isDedicatedRlsHost(hostname) {
  const host = normalizeHost(hostname);
  if (BRANDS.rls.hosts.includes(host)) return true;
  // Dedicated RLS Vercel project / preview hosts (not organicsoilwholesale.com).
  return (
    host.includes("regenerative-landscape-supply") ||
    host.includes("regenerativelandscapesupply")
  );
}

/**
 * @param {{ hostname?: string, pathname?: string, search?: string, brand?: string }} input
 * @returns {BrandIdentity}
 */
export function resolveBrand(input = {}) {
  const explicit = String(input.brand || "").trim().toLowerCase();
  if (isBrandId(explicit)) return getBrand(explicit);

  const host = normalizeHost(input.hostname);
  if (isDedicatedRlsHost(host)) return BRANDS.rls;
  if (BRANDS.mos.hosts.includes(host)) return BRANDS.mos;
  if (BRANDS.osw.hosts.includes(host)) {
    const path = normalizePathname(input.pathname);
    if (path === "/rls" || path.startsWith("/rls/")) return BRANDS.rls;
    return BRANDS.osw;
  }

  const path = normalizePathname(input.pathname);
  if (path === "/rls" || path.startsWith("/rls/")) return BRANDS.rls;

  const search = String(input.search || "");
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const queryBrand = String(params.get("brand") || "").trim().toLowerCase();
  if (isBrandId(queryBrand)) return getBrand(queryBrand);

  return BRANDS.osw;
}

export function resolveBrandFromHost(hostname) {
  return resolveBrand({ hostname });
}

export function rlsBasePath(hostname) {
  return isDedicatedRlsHost(hostname) ? "" : "/rls";
}

/** Build an in-app RLS href that works on both the dedicated domain and /rls preview. */
export function rlsHref(path, hostname) {
  const incoming = String(path || "/");
  const clean = incoming.startsWith("/") ? incoming : `/${incoming}`;
  const stripped = clean === "/rls" ? "/" : clean.replace(/^\/rls(?=\/|$)/, "") || "/";
  const normalized = normalizePathname(stripped);
  if (isDedicatedRlsHost(hostname)) return normalized;
  return normalized === "/" ? "/rls" : `/rls${normalized}`;
}

export function isRlsMarketingPath(pathname, hostname) {
  const path = normalizePathname(pathname);
  if (isDedicatedRlsHost(hostname)) {
    return RLS_MARKETING_PATHS.includes(path);
  }
  if (path === "/rls") return true;
  if (path.startsWith("/rls/")) return true;
  return false;
}

/**
 * MOS / analytics source string. Existing OSW sources stay byte-identical
 * when brand is osw so production lead routing does not change.
 *
 * @param {string | undefined} brandId
 * @param {LeadKind} kind
 */
export function leadSourceForBrand(brandId, kind) {
  const brand = isBrandId(brandId) ? brandId : DEFAULT_BRAND_ID;
  const suffix = KIND_SUFFIX[kind] || KIND_SUFFIX.lead;
  if (brand === "osw" && kind === "callback") return "osw_order_callback";
  if (brand === "osw" && kind === "lead") return "osw_lead_form";
  if (brand === "osw" && kind === "contact") return "osw_contact_form";
  if (brand === "osw" && kind === "quote") return "osw_quote_request";
  if (brand === "osw" && kind === "special") return "osw_special_request";
  return `${brand}_${suffix}`;
}

export function defaultSourceUrl(brandId, path = "/") {
  const brand = getBrand(brandId);
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${brand.publicUrl}${suffix === "/" ? "/" : suffix}`;
}

export function publicBrandPayload(brand) {
  const identity = typeof brand === "string" ? getBrand(brand) : brand;
  return {
    id: identity.id,
    name: identity.name,
    shortName: identity.shortName,
    parent: identity.parent,
    domain: identity.domain,
    publicUrl: identity.publicUrl,
    phoneDisplay: identity.phoneDisplay,
    phoneTel: identity.phoneTel,
    email: identity.email,
    yardAddress: identity.yardAddress,
    tagline: identity.tagline,
    theme: identity.theme,
    storefrontInThisRepo: identity.storefrontInThisRepo,
  };
}

/**
 * Shared request helper for Express and the Vercel api/index.js handler.
 * @param {{ headers?: Record<string, string | string[] | undefined>, body?: Record<string, unknown> }} req
 */
export function resolveBrandFromRequest(req = {}) {
  const headers = req.headers || {};
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const forwarded = headers["x-forwarded-host"] || headers.host || "";
  return resolveBrand({
    hostname: Array.isArray(forwarded) ? forwarded[0] : forwarded,
    pathname: typeof body.source_path === "string" ? body.source_path : undefined,
    brand: typeof body.brand === "string" ? body.brand : undefined,
  });
}
