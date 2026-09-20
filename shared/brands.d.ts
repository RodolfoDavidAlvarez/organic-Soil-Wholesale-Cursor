export type BrandId = "osw" | "mos" | "rls";
export type LeadKind = "contact" | "lead" | "quote" | "consult" | "special" | "callback";

export interface BrandIdentity {
  id: BrandId;
  name: string;
  shortName: string;
  parent: string;
  domain: string;
  hosts: string[];
  publicUrl: string;
  phoneDisplay: string;
  phoneTel: string;
  email: string;
  yardAddress: string;
  tagline: string;
  theme: { primary: string; accent: string; paper?: string };
  storefrontInThisRepo: boolean;
}

export const BRANDS: Record<BrandId, BrandIdentity>;
export const DEFAULT_BRAND_ID: BrandId;
export const RLS_MARKETING_PATHS: string[];
export const CUSTOMER_SUPPORT_PHONE_DISPLAY: string;
export const CUSTOMER_SUPPORT_PHONE_TEL: string;
export const PHOENIX_YARD_ADDRESS: string;

export function normalizeHost(host?: string): string;
export function normalizePathname(pathname?: string): string;
export function isBrandId(value: unknown): value is BrandId;
export function getBrand(id?: string): BrandIdentity;
export function isDedicatedRlsHost(hostname?: string): boolean;
export function resolveBrand(input?: {
  hostname?: string;
  pathname?: string;
  search?: string;
  brand?: string;
}): BrandIdentity;
export function resolveBrandFromHost(hostname?: string): BrandIdentity;
export function rlsBasePath(hostname?: string): string;
export function rlsHref(path: string, hostname?: string): string;
export function isRlsMarketingPath(pathname?: string, hostname?: string): boolean;
export function leadSourceForBrand(brandId: string | undefined, kind: LeadKind): string;
export function defaultSourceUrl(brandId?: string, path?: string): string;
export function publicBrandPayload(brand: BrandIdentity | string): Omit<BrandIdentity, "hosts">;
export function resolveBrandFromRequest(req?: {
  headers?: Record<string, string | string[] | undefined>;
  body?: Record<string, unknown>;
}): BrandIdentity;
