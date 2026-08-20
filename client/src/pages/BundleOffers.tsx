import { useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { GARDEN_PROMO_ALIASES, findGardenPromo } from "@shared/gardenPromos.js";

export default function BundleOffers() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/offers/:slug");
  const requested = (params as { slug?: string } | null)?.slug;
  const slug = requested ? GARDEN_PROMO_ALIASES[requested] || requested : undefined;
  const promo = slug ? findGardenPromo(slug) : null;
  const dest = promo ? `/${promo.slug}` : "/promos";

  useEffect(() => {
    navigate(dest);
  }, [dest, navigate]);

  return null;
}
