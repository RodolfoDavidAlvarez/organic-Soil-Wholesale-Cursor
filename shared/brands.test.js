import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BRANDS,
  RLS_MARKETING_PATHS,
  defaultSourceUrl,
  isDedicatedRlsHost,
  isRlsMarketingPath,
  leadSourceForBrand,
  publicBrandPayload,
  resolveBrand,
  resolveBrandFromRequest,
  rlsHref,
} from "./brands.js";

describe("brand identity", () => {
  it("keeps Regenerative Landscape Supply distinct from OSW and MOS", () => {
    assert.equal(BRANDS.rls.name, "Regenerative Landscape Supply");
    assert.equal(BRANDS.rls.domain, "regenerativelandscapesupply.com");
    assert.notEqual(BRANDS.rls.domain, BRANDS.osw.domain);
    assert.notEqual(BRANDS.rls.domain, BRANDS.mos.domain);
    assert.notEqual(BRANDS.rls.theme.primary, BRANDS.osw.theme.primary);
    assert.match(BRANDS.rls.domain, /landscape/);
    assert.doesNotMatch(BRANDS.rls.domain, /landscap[^e]/);
  });

  it("exposes a public payload without inventing secrets", () => {
    const payload = publicBrandPayload("rls");
    assert.equal(payload.id, "rls");
    assert.equal(payload.phoneDisplay, "(623) 263-3386");
    assert.equal("hosts" in payload, false);
  });
});

describe("resolveBrand", () => {
  it("defaults to Organic Soil Wholesale", () => {
    assert.equal(resolveBrand({}).id, "osw");
    assert.equal(resolveBrand({ hostname: "organicsoilwholesale.com", pathname: "/" }).id, "osw");
    assert.equal(resolveBrand({ hostname: "organicsoilwholesale.com", pathname: "/products" }).id, "osw");
    assert.equal(resolveBrand({ hostname: "localhost", pathname: "/checkout" }).id, "osw");
  });

  it("resolves the dedicated RLS domain and www", () => {
    assert.equal(resolveBrand({ hostname: "regenerativelandscapesupply.com" }).id, "rls");
    assert.equal(resolveBrand({ hostname: "www.regenerativelandscapesupply.com:443" }).id, "rls");
    assert.equal(isDedicatedRlsHost("www.regenerativelandscapesupply.com"), true);
  });

  it("uses /rls preview paths on the OSW host without stealing /products", () => {
    assert.equal(resolveBrand({ hostname: "organicsoilwholesale.com", pathname: "/rls" }).id, "rls");
    assert.equal(resolveBrand({ hostname: "organicsoilwholesale.com", pathname: "/rls/consult" }).id, "rls");
    assert.equal(resolveBrand({ hostname: "organicsoilwholesale.com", pathname: "/products" }).id, "osw");
    assert.equal(isRlsMarketingPath("/products", "organicsoilwholesale.com"), false);
    assert.equal(isRlsMarketingPath("/rls/products", "organicsoilwholesale.com"), true);
    assert.equal(isRlsMarketingPath("/products", "regenerativelandscapesupply.com"), true);
    assert.equal(isRlsMarketingPath("/admin", "regenerativelandscapesupply.com"), false);
  });

  it("honors explicit brand and ?brand=rls on preview hosts", () => {
    assert.equal(resolveBrand({ hostname: "localhost", search: "?brand=rls" }).id, "rls");
    assert.equal(resolveBrand({ brand: "rls", hostname: "organicsoilwholesale.com", pathname: "/" }).id, "rls");
  });

  it("resolves brand from request headers and body", () => {
    const fromHost = resolveBrandFromRequest({
      headers: { "x-forwarded-host": "regenerativelandscapesupply.com" },
      body: {},
    });
    assert.equal(fromHost.id, "rls");

    const fromBody = resolveBrandFromRequest({
      headers: { host: "organicsoilwholesale.com" },
      body: { brand: "rls" },
    });
    assert.equal(fromBody.id, "rls");
  });
});

describe("RLS href helpers", () => {
  it("prefixes /rls on OSW and stays root-relative on the dedicated host", () => {
    assert.equal(rlsHref("/consult", "organicsoilwholesale.com"), "/rls/consult");
    assert.equal(rlsHref("/", "organicsoilwholesale.com"), "/rls");
    assert.equal(rlsHref("/consult", "regenerativelandscapesupply.com"), "/consult");
    assert.equal(rlsHref("/rls/products", "regenerativelandscapesupply.com"), "/products");
  });

  it("lists the marketing routes the storefront must serve", () => {
    assert.deepEqual(RLS_MARKETING_PATHS, [
      "/",
      "/soil-dashboard",
      "/products",
      "/programs",
      "/professionals",
      "/consult",
      "/contact",
    ]);
  });
});

describe("lead source mapping", () => {
  it("preserves existing OSW MOS source strings", () => {
    assert.equal(leadSourceForBrand("osw", "contact"), "osw_contact_form");
    assert.equal(leadSourceForBrand("osw", "lead"), "osw_lead_form");
    assert.equal(leadSourceForBrand("osw", "quote"), "osw_quote_request");
    assert.equal(leadSourceForBrand("osw", "special"), "osw_special_request");
    assert.equal(leadSourceForBrand("osw", "callback"), "osw_order_callback");
    assert.equal(leadSourceForBrand(undefined, "contact"), "osw_contact_form");
  });

  it("tags Regenerative Landscape Supply leads distinctly", () => {
    assert.equal(leadSourceForBrand("rls", "contact"), "rls_contact_form");
    assert.equal(leadSourceForBrand("rls", "lead"), "rls_lead_form");
    assert.equal(leadSourceForBrand("rls", "quote"), "rls_quote_request");
    assert.equal(leadSourceForBrand("rls", "consult"), "rls_consult_request");
    assert.equal(defaultSourceUrl("rls", "/consult"), "https://regenerativelandscapesupply.com/consult");
  });
});
