import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const OUTPUT_DIR = path.join(process.cwd(), 'client/public/images/generated-review');

// Best model for image generation
const MODEL = 'gemini-3-pro-image-preview';

// Each product gets a 4-panel collage with bold titles showing "Best for" use cases
const products = [
  {
    slug: 'simons-gold',
    name: "Simon's Gold",
    panels: ['Soil Enrichment', 'Topdressing', 'Backfill Amendment', 'Raised Beds'],
    prompt: 'Create a professional 2x2 photo grid collage with 4 equal panels separated by thin white borders. Each panel has a bold white title bar at the bottom with thick readable text. Panel 1 labeled "SOIL ENRICHMENT" shows hands mixing dark rich compost into garden soil. Panel 2 labeled "TOPDRESSING" shows compost being spread on top of an existing flower bed. Panel 3 labeled "BACKFILL AMENDMENT" shows dark soil being packed around a newly planted shrub. Panel 4 labeled "RAISED BEDS" shows a beautiful raised garden bed filled with dark rich soil and vegetables growing. All photos are photorealistic, warm natural lighting, Arizona setting, editorial quality. No watermarks, no logos, no deformities, no AI artifacts.',
  },
  {
    slug: 'mikeys-worm-poop',
    name: "Mikey's Worm Poop",
    panels: ['Topdressing', 'Seed Starting', 'Transplanting', 'Compost Tea'],
    prompt: 'Create a professional 2x2 photo grid collage with 4 equal panels separated by thin white borders. Each panel has a bold white title bar at the bottom with thick readable text. Panel 1 labeled "TOPDRESSING" shows dark worm castings being sprinkled on top of potted plants. Panel 2 labeled "SEED STARTING" shows seed starting trays with healthy sprouts growing in dark medium. Panel 3 labeled "TRANSPLANTING" shows a vegetable seedling being transplanted into rich dark soil. Panel 4 labeled "COMPOST TEA" shows worm castings being brewed in a bucket of water for compost tea. All photos are photorealistic, warm natural lighting, organic garden setting, editorial quality. No watermarks, no logos, no deformities, no AI artifacts.',
  },
  {
    slug: 'artemis-root-boost-blend',
    name: 'Artemis Root Boost Blend',
    panels: ['Tree Planting', 'Shrub Beds', 'Root Zone Care', 'Healthy Trees'],
    prompt: 'Create a professional 2x2 photo grid collage with 4 equal panels separated by thin white borders. Each panel has a bold white title bar at the bottom with thick readable text. Panel 1 labeled "TREE PLANTING" shows a tree being planted with dark rich backfill soil in the hole. Panel 2 labeled "SHRUB BEDS" shows a freshly prepared shrub bed with dark organic soil amendment. Panel 3 labeled "ROOT ZONE CARE" shows topdressing around the base of an established tree. Panel 4 labeled "HEALTHY TREES" shows a large healthy tree with lush green canopy in well-maintained soil. All photos are photorealistic, warm golden hour lighting, Arizona landscape, editorial quality. No watermarks, no logos, no deformities, no AI artifacts.',
  },
  {
    slug: 'tee-top-divot-repair-blend',
    name: 'Tee Top Divot Repair Blend',
    panels: ['Divot Repair', 'Tee Box Renovation', 'Fairway Topdressing', 'Perfect Turf'],
    prompt: 'Create a professional 2x2 photo grid collage with 4 equal panels separated by thin white borders. Each panel has a bold white title bar at the bottom with thick readable text. Panel 1 labeled "DIVOT REPAIR" shows close-up of a golf divot being filled with dark soil blend on a tee. Panel 2 labeled "TEE BOX RENOVATION" shows a tee box being renovated with fresh amendment application. Panel 3 labeled "FAIRWAY TOPDRESSING" shows fine organic material being spread across a golf fairway. Panel 4 labeled "PERFECT TURF" shows a pristine manicured golf tee box with perfect green grass. All photos are photorealistic, morning light, golf course setting, editorial quality sports turf photography. No watermarks, no logos, no deformities, no AI artifacts.',
  },
  {
    slug: 'turf-daddy-blend',
    name: 'Turf Daddy Blend',
    panels: ['Overseeding', 'Post-Aeration', 'Lawn Renovation', 'Lush Lawn'],
    prompt: 'Create a professional 2x2 photo grid collage with 4 equal panels separated by thin white borders. Each panel has a bold white title bar at the bottom with thick readable text. Panel 1 labeled "OVERSEEDING" shows soil amendment being spread over a lawn for overseeding. Panel 2 labeled "POST-AERATION" shows amendment being applied to a lawn with visible aeration holes. Panel 3 labeled "LAWN RENOVATION" shows a full lawn being renovated with fresh dark soil being raked. Panel 4 labeled "LUSH LAWN" shows a thick lush green residential lawn result. All photos are photorealistic, warm natural lighting, residential setting, editorial quality. No watermarks, no logos, no deformities, no AI artifacts.',
  },
  {
    slug: 'oasis-blend',
    name: 'Oasis Blend',
    panels: ['Palm Planting', 'Date Palm Care', 'Tropical Trees', 'Desert Oasis'],
    prompt: 'Create a professional 2x2 photo grid collage with 4 equal panels separated by thin white borders. Each panel has a bold white title bar at the bottom with thick readable text. Panel 1 labeled "PALM PLANTING" shows a palm tree being planted with dark amended soil in the planting hole. Panel 2 labeled "DATE PALM CARE" shows organic amendment being applied around the base of a date palm tree. Panel 3 labeled "TROPICAL TREES" shows a tropical tree being maintained with topdressing. Panel 4 labeled "DESERT OASIS" shows tall healthy palm trees thriving in a beautiful Arizona desert oasis landscape. All photos are photorealistic, warm golden hour, desert setting, editorial quality. No watermarks, no logos, no deformities, no AI artifacts.',
  },
  {
    slug: 'bacchus-blend',
    name: 'Bacchus Blend',
    panels: ['Vineyard Rows', 'New Vine Planting', 'Vine Topdressing', 'Harvest Ready'],
    prompt: 'Create a professional 2x2 photo grid collage with 4 equal panels separated by thin white borders. Each panel has a bold white title bar at the bottom with thick readable text. Panel 1 labeled "VINEYARD ROWS" shows rich dark compost being applied between vineyard rows. Panel 2 labeled "NEW VINE PLANTING" shows a new grapevine being planted with organic amendment. Panel 3 labeled "VINE TOPDRESSING" shows topdressing around established vine root zones. Panel 4 labeled "HARVEST READY" shows a lush vineyard row heavy with ripe purple grapes. All photos are photorealistic, warm golden hour, Southwest wine country, editorial quality agricultural photography. No watermarks, no logos, no deformities, no AI artifacts.',
  },
  {
    slug: 'seriokais-secret-blend',
    name: "Seriokai's Secret Blend",
    panels: ['Citrus Planting', 'Avocado Groves', 'Fruit Tree Care', 'Ripe Harvest'],
    prompt: 'Create a professional 2x2 photo grid collage with 4 equal panels separated by thin white borders. Each panel has a bold white title bar at the bottom with thick readable text. Panel 1 labeled "CITRUS PLANTING" shows a young citrus tree being planted with rich dark amended soil. Panel 2 labeled "AVOCADO GROVES" shows organic soil amendment being applied in an avocado grove. Panel 3 labeled "FRUIT TREE CARE" shows a mature fruit tree being maintained with root zone topdressing. Panel 4 labeled "RIPE HARVEST" shows a healthy citrus tree heavy with ripe oranges in an Arizona yard. All photos are photorealistic, warm golden hour, editorial quality. No watermarks, no logos, no deformities, no AI artifacts.',
  },
  {
    slug: 'pomona-blend',
    name: 'Pomona Blend',
    panels: ['Fruit Tree Planting', 'Orchard Rows', 'Tree Topdressing', 'Bountiful Orchard'],
    prompt: 'Create a professional 2x2 photo grid collage with 4 equal panels separated by thin white borders. Each panel has a bold white title bar at the bottom with thick readable text. Panel 1 labeled "FRUIT TREE PLANTING" shows a young fruit tree being planted with organic amendment. Panel 2 labeled "ORCHARD ROWS" shows rich dark compost being applied along orchard rows. Panel 3 labeled "TREE TOPDRESSING" shows topdressing around an established pomegranate tree. Panel 4 labeled "BOUNTIFUL ORCHARD" shows a healthy orchard with trees full of ripe red pomegranates. All photos are photorealistic, warm golden hour, Arizona agricultural setting, editorial quality. No watermarks, no logos, no deformities, no AI artifacts.',
  },
  {
    slug: 'stoned-apes-blend',
    name: "Stoned Ape's Blend",
    panels: ['Transplanting', 'New Plantings', 'Root Inoculation', 'Container Gardens'],
    prompt: 'Create a professional 2x2 photo grid collage with 4 equal panels separated by thin white borders. Each panel has a bold white title bar at the bottom with thick readable text. Panel 1 labeled "TRANSPLANTING" shows a plant being transplanted into mycorrhizal-amended soil. Panel 2 labeled "NEW PLANTINGS" shows a garden bed being prepared with rich inoculated dark soil. Panel 3 labeled "ROOT INOCULATION" shows healthy white mycorrhizal fungi on plant roots in rich soil. Panel 4 labeled "CONTAINER GARDENS" shows thriving container plants with lush green growth. All photos are photorealistic, warm natural lighting, organic garden setting, editorial quality. No watermarks, no logos, no deformities, no AI artifacts.',
  },
  {
    slug: 'desert-defender',
    name: 'Desert Defender',
    panels: ['Drought Landscapes', 'Water-Wise Beds', 'Xeriscaping', 'Desert Beauty'],
    prompt: 'Create a professional 2x2 photo grid collage with 4 equal panels separated by thin white borders. Each panel has a bold white title bar at the bottom with thick readable text. Panel 1 labeled "DROUGHT LANDSCAPES" shows a drought-resistant landscape with native plants in amended soil. Panel 2 labeled "WATER-WISE BEDS" shows a water-wise garden bed with desert-adapted plants. Panel 3 labeled "XERISCAPING" shows beautiful xeriscape design with gravel, rocks, and drought-tolerant shrubs. Panel 4 labeled "DESERT BEAUTY" shows a thriving desert landscape oasis with green plants in arid surroundings. All photos are photorealistic, Arizona desert setting, harsh sun, editorial quality. No watermarks, no logos, no deformities, no AI artifacts.',
  },
  {
    slug: 'amazonian-dark-earth',
    name: 'Amazonian Dark Earth',
    panels: ['Soil Blending', 'Compost Charging', 'Soil Building', 'Carbon Storage'],
    prompt: 'Create a professional 2x2 photo grid collage with 4 equal panels separated by thin white borders. Each panel has a bold white title bar at the bottom with thick readable text. Panel 1 labeled "SOIL BLENDING" shows dark biochar being blended into a custom soil mix. Panel 2 labeled "COMPOST CHARGING" shows biochar being added to a compost pile to supercharge it. Panel 3 labeled "SOIL BUILDING" shows deep rich dark garden soil showing long-term soil improvement. Panel 4 labeled "CARBON STORAGE" shows healthy vegetable plants thriving in dark biochar-enriched earth. All photos are photorealistic, warm natural lighting, organic farm setting, editorial quality. No watermarks, no logos, no deformities, no AI artifacts.',
  },
  {
    slug: 'soil-craft',
    name: 'Soil Craft',
    panels: ['Container Gardening', 'Raised Beds', 'Nursery Production', 'Hanging Baskets'],
    prompt: 'Create a professional 2x2 photo grid collage with 4 equal panels separated by thin white borders. Each panel has a bold white title bar at the bottom with thick readable text. Panel 1 labeled "CONTAINER GARDENING" shows hands potting a plant into a container with dark premium potting soil. Panel 2 labeled "RAISED BEDS" shows a beautiful raised bed garden filled with rich dark soil and growing vegetables. Panel 3 labeled "NURSERY PRODUCTION" shows rows of healthy plants in a greenhouse nursery. Panel 4 labeled "HANGING BASKETS" shows gorgeous hanging baskets overflowing with colorful flowers. All photos are photorealistic, warm natural lighting, home garden and nursery, editorial quality. No watermarks, no logos, no deformities, no AI artifacts.',
  },
  {
    slug: 'plugboost',
    name: 'PlugBoost',
    panels: ['Seed Starting', 'Plug Production', 'Cutting Propagation', 'Healthy Starts'],
    prompt: 'Create a professional 2x2 photo grid collage with 4 equal panels separated by thin white borders. Each panel has a bold white title bar at the bottom with thick readable text. Panel 1 labeled "SEED STARTING" shows seed starting trays being filled with fine dark growing medium. Panel 2 labeled "PLUG PRODUCTION" shows rows of healthy seedling plugs in a nursery tray system. Panel 3 labeled "CUTTING PROPAGATION" shows plant cuttings rooting in propagation medium. Panel 4 labeled "HEALTHY STARTS" shows strong healthy seedling starts ready for transplanting. All photos are photorealistic, soft natural lighting, greenhouse nursery setting, editorial quality. No watermarks, no logos, no deformities, no AI artifacts.',
  },
  {
    slug: 'plantpal',
    name: 'PlantPal',
    panels: ['Indoor Plants', 'Container Gardens', 'Nursery Production', 'Patio Planters'],
    prompt: 'Create a professional 2x2 photo grid collage with 4 equal panels separated by thin white borders. Each panel has a bold white title bar at the bottom with thick readable text. Panel 1 labeled "INDOOR PLANTS" shows a houseplant being repotted with premium dark potting soil. Panel 2 labeled "CONTAINER GARDENS" shows a beautiful container garden arrangement on a patio. Panel 3 labeled "NURSERY PRODUCTION" shows rows of healthy potted plants in a production nursery. Panel 4 labeled "PATIO PLANTERS" shows stylish large planters with thriving plants on a home patio. All photos are photorealistic, warm natural lighting, home and nursery setting, editorial quality lifestyle photography. No watermarks, no logos, no deformities, no AI artifacts.',
  },
  {
    slug: 'natures-blanket',
    name: "Nature's Blanket",
    panels: ['Landscape Mulching', 'Tree Rings', 'Garden Beds', 'Pathways'],
    prompt: 'Create a professional 2x2 photo grid collage with 4 equal panels separated by thin white borders. Each panel has a bold white title bar at the bottom with thick readable text. Panel 1 labeled "LANDSCAPE MULCHING" shows golden organic mulch being spread around landscape plants. Panel 2 labeled "TREE RINGS" shows neat circular mulch rings around tree trunks in a landscape. Panel 3 labeled "GARDEN BEDS" shows garden beds topped with fresh organic mulch. Panel 4 labeled "PATHWAYS" shows a garden pathway covered with natural mulch between plant beds. All photos are photorealistic, warm golden lighting, residential landscape, editorial quality. No watermarks, no logos, no deformities, no AI artifacts.',
  },
  {
    slug: 'superbooster',
    name: 'SuperBooster',
    panels: ['Fruit Trees', 'Vegetable Beds', 'Specialty Crops', 'Soil Boosting'],
    prompt: 'Create a professional 2x2 photo grid collage with 4 equal panels separated by thin white borders. Each panel has a bold white title bar at the bottom with thick readable text. Panel 1 labeled "FRUIT TREES" shows concentrated amendment being applied around a fruit tree. Panel 2 labeled "VEGETABLE BEDS" shows vegetable garden beds being enriched with concentrated amendment. Panel 3 labeled "SPECIALTY CROPS" shows specialty crop rows with dark enriched soil. Panel 4 labeled "SOIL BOOSTING" shows hands mixing concentrated organic amendment into garden soil. All photos are photorealistic, warm natural lighting, farm and garden setting, editorial quality. No watermarks, no logos, no deformities, no AI artifacts.',
  },
  {
    slug: 'cultivators-rose-blend',
    name: "Cultivator's Rose Blend",
    panels: ['Rose Bed Prep', 'Rose Planting', 'Monthly Feeding', 'Blooming Roses'],
    prompt: 'Create a professional 2x2 photo grid collage with 4 equal panels separated by thin white borders. Each panel has a bold white title bar at the bottom with thick readable text. Panel 1 labeled "ROSE BED PREP" shows a rose bed being prepared with dark organic soil amendment. Panel 2 labeled "ROSE PLANTING" shows a new rose bush being planted in rich amended soil. Panel 3 labeled "MONTHLY FEEDING" shows topdressing being applied around established rose bushes. Panel 4 labeled "BLOOMING ROSES" shows a stunning rose garden with vibrant red and pink roses in full bloom. All photos are photorealistic, warm golden hour, Arizona residential garden, editorial quality. No watermarks, no logos, no deformities, no AI artifacts.',
  },
  {
    slug: 'zeolite',
    name: 'Zeolite',
    panels: ['Water Retention', 'Sandy Soil Fix', 'Turf Management', 'Container Media'],
    prompt: 'Create a professional 2x2 photo grid collage with 4 equal panels separated by thin white borders. Each panel has a bold white title bar at the bottom with thick readable text. Panel 1 labeled "WATER RETENTION" shows white granular zeolite being mixed into dry soil to improve moisture. Panel 2 labeled "SANDY SOIL FIX" shows zeolite mineral being incorporated into sandy desert soil. Panel 3 labeled "TURF MANAGEMENT" shows zeolite being applied to lawn turf for water management. Panel 4 labeled "CONTAINER MEDIA" shows zeolite granules being added to a potting mix in a container. All photos are photorealistic, warm natural lighting, garden and turf setting, editorial quality. No watermarks, no logos, no deformities, no AI artifacts.',
  },
];

async function generateImage(product) {
  console.log(`Generating collage: ${product.name}...`);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;

  const body = {
    contents: [{ parts: [{ text: product.prompt }] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (data.error) { console.log(`  ERROR: ${data.error.message}`); return false; }

    const candidates = data.candidates || [];
    for (const candidate of candidates) {
      for (const part of (candidate.content?.parts || [])) {
        if (part.inlineData) {
          const ext = (part.inlineData.mimeType || '').includes('jpeg') ? 'jpg' : 'png';
          const filename = `${product.slug}-bestfor.${ext}`;
          const filepath = path.join(OUTPUT_DIR, filename);
          fs.writeFileSync(filepath, Buffer.from(part.inlineData.data, 'base64'));
          const sizeKB = Math.round(fs.statSync(filepath).size / 1024);
          console.log(`  Saved: ${filename} (${sizeKB}KB)`);
          return true;
        }
      }
    }
    console.log(`  No image returned`);
    return false;
  } catch (err) {
    console.log(`  ERROR: ${err.message}`);
    return false;
  }
}

// Allow running specific products: node script.mjs simons-gold bacchus-blend
const args = process.argv.slice(2);
const toGenerate = args.length > 0
  ? products.filter(p => args.includes(p.slug))
  : products;

console.log(`=== Generating "Best For" Collage Images (${MODEL}) ===`);
console.log(`Products: ${toGenerate.length}`);
console.log(`Output: ${OUTPUT_DIR}\n`);

let success = 0;
for (const p of toGenerate) {
  const ok = await generateImage(p);
  if (ok) success++;
  await new Promise(r => setTimeout(r, 3000));
}
console.log(`\nDone: ${success}/${toGenerate.length} collages generated`);
