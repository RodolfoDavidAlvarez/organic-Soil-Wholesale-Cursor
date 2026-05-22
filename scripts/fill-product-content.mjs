import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const updates = [
  {
    id: 1011,
    npk: '0-0-0',
  },
  {
    id: 134,
    usage: 'Apply 2-3 inches around trees, shrubs, and garden beds. Spread evenly over soil surface, keeping mulch 2-3 inches away from plant stems. Reapply annually as needed. Works great as a weed suppressant and moisture retainer.',
    npk: '0.5-0.2-0.3',
    story: "Nature's Blanket is our signature wood fiber mulch, designed to mimic the forest floor. Made from locally sourced, untreated wood fiber, it breaks down slowly to feed soil biology while protecting roots from Arizona's extreme heat. One application keeps beds looking clean and professional for months.",
  },
  {
    id: 3000,
    npk: '0.8-0.3-0.5',
  },
  {
    id: 1012,
    npk: '0-0-8',
  },
  {
    id: 114,
    usage: 'Fill propagation trays or small pots with PropaGrow. Moisten thoroughly before inserting cuttings or sowing seeds. Maintain consistent moisture. Ideal for rooting hormone-dipped cuttings, seed starting, and transplant staging.',
    features: 'Optimized Drainage|Lightweight & Airy|Promotes Root Development|Consistent Moisture Retention|pH Balanced for Seedlings',
    ingredients: 'Perlite, Vermiculite, Peat Moss, Worm Castings, Mycorrhizae',
    npk: '0.5-0.5-0.5',
  },
  {
    id: 137,
    usage: 'Fill containers, raised beds, or planting holes with Soil Craft. No additional amendments needed. Water thoroughly after planting. For container plants, use straight from the bag. For garden beds, mix 50/50 with native soil.',
    features: 'Ready to Plant|Rich in Organic Matter|Contains Beneficial Microbes|Excellent Drainage & Aeration|All-Purpose Formula',
    ingredients: 'Aged Dairy Compost, Perlite, Peat Moss, Worm Castings, Volcanic Rock Dust, Mycorrhizae',
    npk: '1.5-1.0-1.2',
    story: 'Soil Craft is our premium all-purpose potting soil, blended for gardeners who want results without the guesswork. Every bag contains a balanced mix of organic compost, drainage minerals, and beneficial microbes. Just open, plant, and grow.',
  },
  {
    id: 111,
    usage: 'Use for potting up nursery stock, transplanting, or container gardening. Fill pots and water in well. Suitable for annuals, perennials, vegetables, and herbs. For heavy feeders, top-dress with worm castings monthly.',
    features: 'Nursery-Grade Quality|Balanced Nutrition|Promotes Strong Root Growth|Works for All Plant Types|Long-Lasting Organic Matter',
    ingredients: 'Dairy Compost, Coconut Coir, Perlite, Worm Castings, Kelp Meal',
    npk: '1.2-0.8-1.0',
  },
  {
    id: 112,
    usage: 'Fill seed trays or plug flats with PlugBoost. Press seeds into surface at recommended depth. Mist to keep moist but not waterlogged. Ideal for starting vegetables, herbs, flowers, and native grasses from seed.',
    features: 'Fine Texture for Seed Contact|Sterile Base Medium|Gentle Starter Nutrients|Promotes Rapid Germination|Easy to Transplant',
    ingredients: 'Fine Peat Moss, Vermiculite, Perlite, Worm Castings, Humic Acid',
    npk: '0.3-0.3-0.3',
  },
  {
    id: 103,
    usage: "Amend planting holes with 30% Cultivator's Rose Blend mixed with 70% native soil. For established roses, top-dress 1-2 inches around the drip line in spring and fall. Water thoroughly after application.",
    features: 'Formulated for Roses & Flowering Plants|Rich in Phosphorus for Blooms|Mycorrhizae Enhanced|Slow-Release Nutrition|pH Optimized',
    ingredients: 'Aged Dairy Compost, Bone Meal, Alfalfa Meal, Kelp, Mycorrhizae, Humic Acid',
  },
];

let updated = 0;
for (const u of updates) {
  const { id, ...fields } = u;
  const { error } = await sb.from('products').update(fields).eq('id', id);
  if (error) {
    console.log('ERROR updating', id, ':', error.message);
  } else {
    updated++;
    console.log('Updated', id);
  }
}
console.log('Done:', updated + '/' + updates.length + ' products updated');
