import { Link } from "wouter";
import { RlsSeo } from "./rlsSeo";
import { oswUrl, useRlsHref } from "@/lib/brand";

const PRODUCTS = [
  {
    name: "Simon's Gold",
    category: "Dairy compost",
    image: "/images/optimized/simons-gold-bag-context.jpg",
    body: "Slow-release dairy compost for rebuilding and conserving soil in beds, trees, and Arizona landscape projects. Sold by the bag, tote, or walking-floor truckload.",
    osw: "/products/simons-gold",
    consult: "Simon's Gold",
  },
  {
    name: "Mikey's Worm Poop",
    category: "Worm castings",
    image: "/images/optimized/mikeys-worm-poop-bag-context.jpg",
    body: "Biologically active vermicompost for root zones, top-dress, and blends. Use when the Dashboard points to biology — not as a default sprinkle.",
    osw: "/products/mikeys-worm-poop",
    consult: "Mikey's Worm Poop",
  },
  {
    name: "Soil Craft",
    category: "Premium potting soil",
    image: "/images/testimonials/optimized/client-testimonial-soil-craft-card.jpg",
    body: "Ready-to-use potting soil for containers, raised beds, and nursery production. Quote-only on the shared catalog; not one of the four card-pay mains.",
    osw: "/products",
    consult: "Soil Craft",
  },
  {
    name: "Nature's Blanket Premium",
    category: "Premium dark mulch",
    image: "/images/optimized/natures-blanket-bag-studio.jpg",
    body: "Wood fiber with dairy compost and worm castings for soil armor, moisture, and a clean finish. Texture photo first on product pages; bag is the closer.",
    osw: "/products/natures-blanket-premium",
    consult: "Nature's Blanket Premium",
  },
  {
    name: "PlantPal",
    category: "All-stage potting mix",
    image: "/images/optimized/plantpal-with-veggies.jpg",
    body: "All-stage mix for seed starts, propagation, containers, and patio planters. One of the four mains available for card payment at the Phoenix yard.",
    osw: "/products/plantpal",
    consult: "PlantPal",
  },
  {
    name: "Turf Daddy",
    category: "Turf blend",
    image: "/images/optimized/turf-daddy1cf.jpg",
    body: "Dairy compost, worm castings, and zeolite for overseeding, aeration, and turf that is worth keeping. Prescribed after compaction, salinity, and irrigation are understood.",
    osw: "/products/turf-daddy-blend",
    consult: "Turf Daddy",
  },
];

export default function RlsProducts() {
  const href = useRlsHref();

  return (
    <>
      <RlsSeo
        title="Landscape soil toolbox"
        description="Simon's Gold, Mikey's Worm Poop, Soil Craft, Nature's Blanket Premium, PlantPal, and Turf Daddy — SSW products presented as a toolbox for regenerative landscape work."
        path="/products"
      />
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8A6B3D]">Shared SSW inventory</p>
        <h1 className="mt-3 font-heading text-3xl font-bold text-[#1B2E1F] sm:text-5xl">Product toolbox</h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#1B2E1F]/75">
          The strongest commercial message is not “biology replaces chemistry.” Healthier soil may let a landscape rely less
          on repeated corrective inputs. Card-pay pickup for the four mains stays on Organic Soil Wholesale so checkout is not duplicated.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {PRODUCTS.map((product) => (
            <article key={product.name} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <img src={product.image} alt={`${product.name} ${product.category}`} className="h-48 w-full object-cover" />
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8A6B3D]">{product.category}</p>
                <h2 className="mt-1 font-heading text-2xl font-semibold text-[#1B2E1F]">{product.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#1B2E1F]/70">{product.body}</p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Link
                    href={`${href("/consult")}?product=${encodeURIComponent(product.consult)}`}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#1B2E1F] px-4 text-sm font-semibold text-[#F4EFE6]"
                  >
                    Quote this product
                  </Link>
                  <a
                    href={oswUrl(product.osw)}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[#1B2E1F]/20 px-4 text-sm font-semibold text-[#1B2E1F]"
                  >
                    View on OSW
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
