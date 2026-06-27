import { track } from "@vercel/analytics/react";

type AnalyticsValue = string | number | boolean | null | undefined;
type AnalyticsProperties = Record<string, unknown>;

export type EcommerceItem = {
  item_id: string | number;
  item_name: string;
  item_variant?: string;
  item_category?: string;
  price?: number;
  quantity?: number;
};

type EcommerceEvent = "view_item" | "add_to_cart" | "begin_checkout" | "purchase" | "generate_lead" | "phone_click";
const COMMERCE_EVENTS = new Set<EcommerceEvent>(["view_item", "add_to_cart", "begin_checkout", "purchase"]);

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

const cleanProperties = (properties?: AnalyticsProperties) => {
  if (!properties) return undefined;

  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => {
      const type = typeof value;
      return value === null || type === "string" || type === "number" || type === "boolean";
    }),
  ) as Record<string, string | number | boolean | null>;
};

export const trackEvent = (name: string, properties?: AnalyticsProperties) => {
  try {
    track(name, cleanProperties(properties));
  } catch {
    // Analytics must never block checkout, check-in, or cart actions.
  }

  pushDataLayerEvent(name, properties);
};

const normalizeEventName = (name: string) =>
  name
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();

const pushDataLayerEvent = (name: string, properties?: AnalyticsProperties) => {
  if (typeof window === "undefined") return;

  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: normalizeEventName(name),
      page_path: window.location.pathname,
      page_location: window.location.href,
      ...(properties || {}),
    });
  } catch {
    // Tracking must never break the customer path.
  }
};

export const trackEcommerceEvent = (
  event: EcommerceEvent,
  properties?: AnalyticsProperties & {
    currency?: string;
    value?: number;
    transaction_id?: string | number;
    items?: EcommerceItem[];
  },
) => {
  const payload = {
    currency: "USD",
    ...(properties || {}),
  };

  try {
    track(event, cleanProperties(payload));
  } catch {
    // Ignore.
  }

  if (typeof window === "undefined") return;

  try {
    window.dataLayer = window.dataLayer || [];
    if (COMMERCE_EVENTS.has(event)) {
      window.dataLayer.push({ ecommerce: null });
      window.dataLayer.push({
        event,
        page_path: window.location.pathname,
        page_location: window.location.href,
        ecommerce: payload,
      });
      return;
    }

    window.dataLayer.push({
      event,
      page_path: window.location.pathname,
      page_location: window.location.href,
      ...payload,
    });
  } catch {
    // Ignore.
  }
};

export const trackPhoneClick = (properties?: AnalyticsProperties) => {
  trackEvent("Phone Clicked", properties);
  trackEcommerceEvent("phone_click", {
    ...(properties || {}),
    pickup_sales_channel: "osw_yard",
  });
};

export const cartItemToEcommerceItem = (item: {
  productId?: number | string;
  productName?: string;
  productSlug?: string;
  format?: string;
  quantity?: number;
  unitPrice?: number;
  mode?: string;
}) => ({
  item_id: item.productId || item.productSlug || item.productName || "unknown",
  item_name: item.productName || "Organic Soil Wholesale product",
  item_variant: item.format,
  item_category: item.mode || "pickup",
  price: Number(item.unitPrice || 0),
  quantity: Number(item.quantity || 1),
});

export const currentPath = () => {
  if (typeof window === "undefined") return "";
  return window.location.pathname;
};
