import { useLocation } from "wouter";
import {
  type BrandIdentity,
  resolveBrand,
  rlsHref as sharedRlsHref,
  isDedicatedRlsHost,
  isRlsMarketingPath,
  getBrand,
} from "@shared/brands.js";

export type { BrandIdentity };

function currentHostname() {
  return typeof window !== "undefined" ? window.location.hostname : "";
}

function currentSearch() {
  return typeof window !== "undefined" ? window.location.search : "";
}

export function resolveClientBrand(pathname?: string, hostname?: string, search?: string): BrandIdentity {
  return resolveBrand({
    hostname: hostname ?? currentHostname(),
    pathname: pathname ?? (typeof window !== "undefined" ? window.location.pathname : "/"),
    search: search ?? currentSearch(),
  });
}

export function useBrand(): BrandIdentity {
  const [location] = useLocation();
  return resolveClientBrand(location, currentHostname(), currentSearch());
}

export function useRlsHref() {
  const hostname = currentHostname();
  return (path: string) => sharedRlsHref(path, hostname);
}

export function useIsRlsSurface() {
  const [location] = useLocation();
  const hostname = currentHostname();
  if (isRlsMarketingPath(location, hostname)) return true;
  const brand = resolveClientBrand(location, hostname, currentSearch());
  return brand.id === "rls" && (location === "/" || location === "");
}

export function oswUrl(path = "/") {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `https://organicsoilwholesale.com${suffix === "/" ? "" : suffix}`;
}

export function rlsCanonical(path = "/", hostname?: string) {
  const host = hostname ?? currentHostname();
  if (isDedicatedRlsHost(host)) {
    const clean = path.startsWith("/") ? path : `/${path}`;
    return `https://regenerativelandscapesupply.com${clean === "/" ? "" : clean}`;
  }
  return `https://organicsoilwholesale.com${sharedRlsHref(path, "organicsoilwholesale.com")}`;
}

export { getBrand, isDedicatedRlsHost, isRlsMarketingPath, rlsHref } from "@shared/brands.js";
