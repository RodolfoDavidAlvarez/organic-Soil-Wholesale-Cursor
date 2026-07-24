/**
 * Street-address autocomplete for checkout delivery.
 * Biased to Phoenix metro by default; when a delivery ZIP is present, bias to that ZIP.
 * Uses Nominatim (OpenStreetMap) server-side — no Google key required.
 */
import { Router } from "express";

const router = Router();

const PHOENIX = { lat: 33.4484, lng: -112.074, label: "Phoenix, AZ" };
/** Soft Arizona viewbox (west,north,east,south for Nominatim). */
const AZ_VIEWBOX = "-114.9,37.0,-109.0,31.3";
const USER_AGENT = "OrganicSoilWholesale/1.0 (checkout address assist; info@soilseedandwater.com)";

type SuggestResult = {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
};

async function zipCentroid(zip: string): Promise<{ lat: number; lng: number; city: string; state: string } | null> {
  if (!/^\d{5}$/.test(zip)) return null;
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      places?: Array<{ latitude: string; longitude: string; "place name": string; "state abbreviation": string }>;
    };
    const place = data.places?.[0];
    if (!place) return null;
    return {
      lat: Number(place.latitude),
      lng: Number(place.longitude),
      city: place["place name"] || "",
      state: place["state abbreviation"] || "AZ",
    };
  } catch {
    return null;
  }
}

function buildStreet(address: Record<string, string | undefined>): string {
  const number = address.house_number?.trim() || "";
  const road = (address.road || address.pedestrian || address.residential || address.highway || "").trim();
  if (number && road) return `${number} ${road}`;
  return road || number;
}

function buildCity(address: Record<string, string | undefined>): string {
  return (
    address.city ||
    address.town ||
    address.village ||
    address.hamlet ||
    address.municipality ||
    address.county ||
    ""
  );
}

const US_STATE_ABBR: Record<string, string> = {
  arizona: "AZ",
  california: "CA",
  nevada: "NV",
  "new mexico": "NM",
  utah: "UT",
  colorado: "CO",
  texas: "TX",
};

function buildState(address: Record<string, string | undefined>): string {
  const code = (address.state_code || "").trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(code)) return code;
  const name = (address.state || "").trim().toLowerCase();
  if (US_STATE_ABBR[name]) return US_STATE_ABBR[name];
  // Never slice full names ("Arizona" → "AR").
  return "AZ";
}

router.get("/suggest", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const zipHint = String(req.query.zip || "").trim();

    if (q.length < 3) {
      return res.json({ suggestions: [] as SuggestResult[] });
    }

    const bias = (await zipCentroid(zipHint)) || { ...PHOENIX, city: "Phoenix", state: "AZ" };

    // Nudge incomplete queries toward Arizona without forcing Phoenix when ZIP is elsewhere.
    const alreadyScoped = /\b(az|arizona|phoenix)\b/i.test(q);
    const scopedQuery = alreadyScoped
      ? q
      : zipHint && bias.city
      ? `${q}, ${bias.city}, AZ`
      : `${q}, Phoenix, AZ`;

    const params = new URLSearchParams({
      q: scopedQuery,
      format: "jsonv2",
      addressdetails: "1",
      countrycodes: "us",
      limit: "6",
      viewbox: AZ_VIEWBOX,
      bounded: "0",
    });

    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      return res.status(502).json({ error: "Address lookup unavailable", suggestions: [] });
    }

    const rows = (await response.json()) as Array<{
      place_id?: number | string;
      display_name?: string;
      lat?: string;
      lon?: string;
      address?: Record<string, string | undefined>;
    }>;

    // Prefer Arizona hits; soft-rank closer to bias point.
    const suggestions: SuggestResult[] = rows
      .map((row) => {
        const address = row.address || {};
        const street = buildStreet(address);
        const city = buildCity(address);
        const state = buildState(address);
        const zip = (address.postcode || "").replace(/\D/g, "").slice(0, 5);
        if (!street || !city) return null;

        const lat = Number(row.lat);
        const lng = Number(row.lon);
        const dist =
          Number.isFinite(lat) && Number.isFinite(lng)
            ? (lat - bias.lat) ** 2 + (lng - bias.lng) ** 2
            : 99;
        const inAz = state === "AZ" || /arizona/i.test(address.state || "");

        return {
          id: String(row.place_id ?? `${street}-${zip}`),
          label: [street, city, state, zip].filter(Boolean).join(", "),
          street,
          city,
          state: state || "AZ",
          zip,
          _dist: dist,
          _inAz: inAz,
        };
      })
      .filter((s): s is SuggestResult & { _dist: number; _inAz: boolean } => Boolean(s))
      .sort((a, b) => {
        if (a._inAz !== b._inAz) return a._inAz ? -1 : 1;
        return a._dist - b._dist;
      })
      .slice(0, 5)
      .map(({ _dist, _inAz, ...rest }) => rest);

    res.json({
      suggestions,
      bias: { lat: bias.lat, lng: bias.lng, city: bias.city, zip: zipHint || null },
    });
  } catch (error) {
    console.error("[address/suggest]", error);
    res.status(500).json({ error: "Address lookup failed", suggestions: [] });
  }
});

/** Resolve city/state for a ZIP — used when distance cache omits place names. */
router.get("/zip/:zip", async (req, res) => {
  try {
    const zip = String(req.params.zip || "").replace(/\D/g, "").slice(0, 5);
    const place = await zipCentroid(zip);
    if (!place) return res.status(404).json({ error: "ZIP not found" });
    res.json({ zip, city: place.city, state: place.state, lat: place.lat, lng: place.lng });
  } catch (error) {
    console.error("[address/zip]", error);
    res.status(500).json({ error: "ZIP lookup failed" });
  }
});

export default router;
