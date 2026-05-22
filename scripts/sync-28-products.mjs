import 'dotenv/config';
import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

await client.connect();
console.log('Connected to database.\n');

// ── Step 1: Add sort_order column if it doesn't exist ──
const colCheck = await client.query(`
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'products' AND column_name = 'sort_order'
`);
if (colCheck.rows.length === 0) {
  await client.query(`ALTER TABLE products ADD COLUMN sort_order INTEGER DEFAULT 0`);
  console.log('Added sort_order column.');
} else {
  console.log('sort_order column already exists.');
}

// ── Step 2: Add is_hidden column if it doesn't exist ──
const hiddenCheck = await client.query(`
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'products' AND column_name = 'is_hidden'
`);
if (hiddenCheck.rows.length === 0) {
  await client.query(`ALTER TABLE products ADD COLUMN is_hidden BOOLEAN DEFAULT false`);
  console.log('Added is_hidden column.');
} else {
  console.log('is_hidden column already exists.');
}

// ── Step 3: Add npk column if it doesn't exist ──
const npkCheck = await client.query(`
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'products' AND column_name = 'npk'
`);
if (npkCheck.rows.length === 0) {
  await client.query(`ALTER TABLE products ADD COLUMN npk TEXT`);
  console.log('Added npk column.');
} else {
  console.log('npk column already exists.');
}

// Verify slug & is_catalog_enabled exist (they do from our check)
console.log('slug and is_catalog_enabled columns already exist.\n');

function slugify(str) {
  return str.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── The 28 canonical products ──
const products = [
  {
    name: "Simon's Gold",
    displayTitle: "Simon's Gold",
    description: "Dairy Compost",
    category: "Soil amendment",
    sortOrder: 1,
    isHidden: false,
    isCatalogEnabled: true,
  },
  {
    name: "Mikey's Worm Poop",
    displayTitle: "Mikey's Worm Poop",
    description: "Worm Castings",
    category: "Soil amendment",
    sortOrder: 2,
    isHidden: false,
    isCatalogEnabled: true,
  },
  {
    name: "Artemis Root Boost Blend",
    displayTitle: "Artemis Root Boost Blend",
    description: "Tree & Shrub Planting Amendment",
    category: "Soil amendment",
    sortOrder: 3,
    isHidden: false,
    isCatalogEnabled: true,
  },
  {
    name: "Tee Top Divot Repair Blend",
    displayTitle: "Tee Top Divot Repair Blend",
    description: "Golf Course Divot Repair Mix",
    category: "Soil amendment",
    sortOrder: 4,
    isHidden: false,
    isCatalogEnabled: true,
  },
  {
    name: "Turf Daddy Blend",
    displayTitle: "Turf Daddy Blend",
    description: "Overseed & Aeration Blend",
    category: "Soil amendment",
    sortOrder: 5,
    isHidden: false,
    isCatalogEnabled: true,
  },
  {
    name: "Carbo Charge",
    displayTitle: "Carbo Charge",
    description: "Biochar Carbon Amendment",
    category: "Soil amendment",
    sortOrder: 6,
    isHidden: true,
    isCatalogEnabled: false,
  },
  {
    name: "Oasis Blend",
    displayTitle: "Oasis Blend",
    description: "Palm & Date Tree Plant Food",
    category: "Soil amendment",
    sortOrder: 7,
    isHidden: false,
    isCatalogEnabled: true,
  },
  {
    name: "Bacchus Blend",
    displayTitle: "Bacchus Blend",
    description: "Vineyard Blend",
    category: "Soil amendment",
    sortOrder: 8,
    isHidden: false,
    isCatalogEnabled: true,
  },
  {
    name: "Seriokai's Secret Blend",
    displayTitle: "Seriokai's Secret Blend",
    description: "Avocado & Citrus Plant Food",
    category: "Soil amendment",
    sortOrder: 9,
    isHidden: false,
    isCatalogEnabled: true,
  },
  {
    name: "Pomona Blend",
    displayTitle: "Pomona Blend",
    description: "Pome & Stone Fruit Plant Food",
    category: "Soil amendment",
    sortOrder: 10,
    isHidden: false,
    isCatalogEnabled: true,
  },
  {
    name: "Stoned Ape's Blend",
    displayTitle: "Stoned Ape's Blend",
    description: "Mycorrhizal Root Enhancer",
    category: "Soil amendment",
    sortOrder: 11,
    isHidden: false,
    isCatalogEnabled: true,
  },
  {
    name: "Desert Defender",
    displayTitle: "Desert Defender",
    description: "Drought Resilience Amendment",
    category: "Soil amendment",
    sortOrder: 12,
    isHidden: false,
    isCatalogEnabled: true,
  },
  {
    name: "Silky Silt Saver",
    displayTitle: "Silky Silt Saver",
    description: "Silt Soil Drought Blend",
    category: "Soil amendment",
    sortOrder: 13,
    isHidden: true,
    isCatalogEnabled: false,
  },
  {
    name: "Clay Cure",
    displayTitle: "Clay Cure",
    description: "Clay Soil Drought Blend",
    category: "Soil amendment",
    sortOrder: 14,
    isHidden: true,
    isCatalogEnabled: false,
  },
  {
    name: "Amazonian Dark Earth",
    displayTitle: "Amazonian Dark Earth",
    description: "Biochar Mineral",
    category: "Soil amendment",
    sortOrder: 15,
    isHidden: false,
    isCatalogEnabled: true,
  },
  {
    name: "Zeolite",
    displayTitle: "Zeolite",
    description: "Natural Mineral Soil Conditioner",
    category: "Soil amendment",
    sortOrder: 16,
    isHidden: false,
    isCatalogEnabled: true,
  },
  {
    name: "SKMicrosource",
    displayTitle: "SKMicrosource",
    description: "Sulfur-Potassium Nutrition Boost",
    category: "Soil amendment",
    sortOrder: 17,
    isHidden: false,
    isCatalogEnabled: true,
  },
  {
    name: "SuperBooster",
    displayTitle: "SuperBooster",
    description: "Concentrated Amendment",
    category: "Concentrate",
    sortOrder: 18,
    isHidden: false,
    isCatalogEnabled: true,
  },
  {
    name: "Cultivator's Rose Blend",
    displayTitle: "Cultivator's Rose Blend",
    description: "Organic Rose Plant Food",
    category: "Concentrate",
    sortOrder: 19,
    isHidden: false,
    isCatalogEnabled: true,
  },
  {
    name: "Soil Craft",
    displayTitle: "Soil Craft",
    description: "Premium Potting Soil",
    category: "Potting soil",
    sortOrder: 20,
    isHidden: false,
    isCatalogEnabled: true,
  },
  {
    name: "PlugBoost",
    displayTitle: "PlugBoost",
    description: "Seedling & Plug Starter Mix",
    category: "Potting soil",
    sortOrder: 21,
    isHidden: false,
    isCatalogEnabled: true,
  },
  {
    name: "PropaGrow",
    displayTitle: "PropaGrow",
    description: "Propagation & Rooting Mix",
    category: "Potting soil",
    sortOrder: 22,
    isHidden: false,
    isCatalogEnabled: true,
  },
  {
    name: "PlantPal",
    displayTitle: "PlantPal",
    description: "All-Purpose Indoor Potting Mix",
    category: "Potting soil",
    sortOrder: 23,
    isHidden: false,
    isCatalogEnabled: true,
  },
  {
    name: "Succulent Success",
    displayTitle: "Succulent Success",
    description: "Succulent Interior Potting Mix",
    category: "Potting soil",
    sortOrder: 24,
    isHidden: true,
    isCatalogEnabled: false,
  },
  {
    name: "Tropic Treasure",
    displayTitle: "Tropic Treasure",
    description: "Tropical Plant Interior Potting Mix",
    category: "Potting soil",
    sortOrder: 25,
    isHidden: true,
    isCatalogEnabled: false,
  },
  {
    name: "Flower Flourish",
    displayTitle: "Flower Flourish",
    description: "Flowering Plant Interior Potting Mix",
    category: "Potting soil",
    sortOrder: 26,
    isHidden: true,
    isCatalogEnabled: false,
  },
  {
    name: "Nature's Blanket",
    displayTitle: "Nature's Blanket",
    description: "Organic Mulch",
    category: "Mulch",
    sortOrder: 27,
    isHidden: false,
    isCatalogEnabled: true,
  },
  {
    name: "Nature's Blanket Premium",
    displayTitle: "Nature's Blanket Premium",
    description: "Premium Organic Mulch",
    category: "Mulch",
    sortOrder: 28,
    isHidden: false,
    isCatalogEnabled: true,
  },
];

// Map of old names to canonical names for matching
const nameMatchMap = {
  "Simons Gold": "Simon's Gold",
  "Simon's Gold": "Simon's Gold",
  "Mikey's Worm Poop": "Mikey's Worm Poop",
  "Artemis Root Boost Blend": "Artemis Root Boost Blend",
  "Artemis Root Boost": "Artemis Root Boost Blend",
  "Tee Top Divot Repair Blend": "Tee Top Divot Repair Blend",
  "Turf Daddy Blend": "Turf Daddy Blend",
  "Turf Daddy Concentrated Organic Soil Amendment Fertilizer": "Turf Daddy Blend",
  "Oasis Blend": "Oasis Blend",
  "Oasis Blend Concentrated Organic Soil Amendment Fertilizer for Palm & Date trees": "Oasis Blend",
  "Bacchus Blend": "Bacchus Blend",
  "Bacchus Concentrated Organic Soil Amendment Fertilizer for Grape vines": "Bacchus Blend",
  "Seriokai's Secret Blend": "Seriokai's Secret Blend",
  "Seriokai's Secret Blend Concentrated Organic Soil Amendment Fertilizer for Avocado and Citrus Trees": "Seriokai's Secret Blend",
  "Pomona Blend": "Pomona Blend",
  "Stoned Ape's Blend": "Stoned Ape's Blend",
  "Stoned Ape's Blend Concentrated Organic Soil Amendment Fertilizer and Mycorrhizal Root Enhancer": "Stoned Ape's Blend",
  "Desert Defender": "Desert Defender",
  "Dessert Defender": "Desert Defender",
  "Dan's Drought Mix Concentrated Organic Soil Amendment Fertilizer for drought resilience": "Desert Defender",
  "Silky Silt Saver": "Silky Silt Saver",
  "Silky Silt Saver Silt Soil Drought Blend": "Silky Silt Saver",
  "Clay Cure": "Clay Cure",
  "Clay Cure Silt Soil Drought Blend": "Clay Cure",
  "Amazonian Dark Earth": "Amazonian Dark Earth",
  "Zeolite": "Zeolite",
  "SKMicrosource": "SKMicrosource",
  "SuperBooster": "SuperBooster",
  "Cultivator's Rose Blend": "Cultivator's Rose Blend",
  "Cultivator's Rose Blend Concentrated Organic Soil Amendment Fertilizer": "Cultivator's Rose Blend",
  "Garden Craft Blend": "Soil Craft",
  "Soil Craft": "Soil Craft",
  "PlugBoost": "PlugBoost",
  "PlugBoost - Organic Seed Starter Mix - OMRI Listed": "PlugBoost",
  "PropaGrow": "PropaGrow",
  "PlantPal": "PlantPal",
  "Succulent Success": "Succulent Success",
  "Succulent Success Succulent Potting Mix": "Succulent Success",
  "Tropic Treasure": "Tropic Treasure",
  "Tropic Treasure Tropical Plant Potting Mix": "Tropic Treasure",
  "Flower Flourish": "Flower Flourish",
  "Flower Flourish Flowering Plant Potting Mix": "Flower Flourish",
  "Nature's Blanket": "Nature's Blanket",
  "Natures Blanket": "Nature's Blanket",
  "Nature's Blanket Premium": "Nature's Blanket Premium",
  "Nature's Blanket Premium Mulch": "Nature's Blanket Premium",
};

// Names that should be archived (not in the 28)
const archiveNames = [
  "CannaBag",
  "Ready Go Garden",
  "Ready Go Garden Organic Potting Soil",
  "Mid Summer Ass-Kick Blend",
  "Premium Organic Potting Soil",
];

// Canonical product names set
const canonicalNames = new Set(products.map(p => p.name));

// ── Step 4: Get all existing products ──
const existing = await client.query('SELECT id, name, display_title FROM products ORDER BY id');
console.log(`Found ${existing.rows.length} existing products.\n`);

// ── Step 5: For each of the 28 products, find the best matching row ──
// Prefer the 1000+ series IDs, fallback to old IDs
const allRows = existing.rows;
const canonicalToRow = {};

for (const product of products) {
  // Find all rows that map to this canonical name
  const matchingRows = allRows.filter(r => nameMatchMap[r.name] === product.name);

  if (matchingRows.length > 0) {
    // Prefer 1000+ series
    const preferred = matchingRows.find(r => r.id >= 1000) || matchingRows[0];
    canonicalToRow[product.name] = preferred;
  }
}

console.log('Matched products:');
for (const [name, row] of Object.entries(canonicalToRow)) {
  console.log(`  ${name} → id=${row.id} (was "${row.name}")`);
}

const unmatchedProducts = products.filter(p => !canonicalToRow[p.name]);
if (unmatchedProducts.length > 0) {
  console.log('\nProducts that need to be INSERTED (no match found):');
  unmatchedProducts.forEach(p => console.log(`  ${p.name}`));
}

// ── Step 6: Determine which old rows to archive ──
const matchedIds = new Set(Object.values(canonicalToRow).map(r => r.id));
const toArchive = allRows.filter(r => {
  // Archive if: explicitly in archive list, OR not matched to any canonical product
  if (archiveNames.includes(r.name)) return true;
  if (matchedIds.has(r.id)) return false;
  // If this row's name maps to a canonical product but a different row was chosen, archive this duplicate
  if (nameMatchMap[r.name] && !matchedIds.has(r.id)) return true;
  // If name doesn't map to any canonical product, archive
  if (!canonicalNames.has(r.name) && !nameMatchMap[r.name]) return true;
  return false;
});

console.log(`\nWill archive ${toArchive.length} old/duplicate products:`);
toArchive.forEach(r => console.log(`  id=${r.id} "${r.name}"`));

// ── Step 7: Execute updates in a transaction ──
await client.query('BEGIN');

try {
  // 7a: Update existing matched products
  for (const product of products) {
    const row = canonicalToRow[product.name];
    const slug = slugify(product.displayTitle);

    if (row) {
      await client.query(`
        UPDATE products SET
          name = $1,
          display_title = $2,
          description = $3,
          category = $4,
          sort_order = $5,
          catalog_display_order = $5,
          is_hidden = $6,
          is_catalog_enabled = $7,
          slug = $8,
          product_status = 'active',
          updated_at = NOW()
        WHERE id = $9
      `, [
        product.name,
        product.displayTitle,
        product.description,
        product.category,
        product.sortOrder,
        product.isHidden,
        product.isCatalogEnabled,
        slug,
        row.id
      ]);
      console.log(`UPDATED id=${row.id}: "${row.name}" → "${product.name}" (sort=${product.sortOrder}, hidden=${product.isHidden})`);
    } else {
      // Insert new product (price=0 as placeholder)
      const res = await client.query(`
        INSERT INTO products (name, display_title, description, category, sort_order, catalog_display_order, is_hidden, is_catalog_enabled, slug, product_status, price, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8, 'active', 0, NOW(), NOW())
        RETURNING id
      `, [
        product.name,
        product.displayTitle,
        product.description,
        product.category,
        product.sortOrder,
        product.isHidden,
        product.isCatalogEnabled,
        slug,
      ]);
      console.log(`INSERTED id=${res.rows[0].id}: "${product.name}" (sort=${product.sortOrder}, hidden=${product.isHidden})`);
    }
  }

  // 7b: Archive old/duplicate products
  if (toArchive.length > 0) {
    const archiveIds = toArchive.map(r => r.id);
    await client.query(`
      UPDATE products SET
        product_status = 'archived',
        is_catalog_enabled = false,
        is_hidden = true,
        active = false,
        updated_at = NOW()
      WHERE id = ANY($1)
    `, [archiveIds]);
    console.log(`\nARCHIVED ${archiveIds.length} products: ${archiveIds.join(', ')}`);
  }

  await client.query('COMMIT');
  console.log('\nTransaction committed successfully.\n');

  // ── Step 8: Verify final state ──
  const final = await client.query(`
    SELECT id, name, display_title, category, sort_order, is_hidden, is_catalog_enabled, slug, product_status
    FROM products
    WHERE product_status = 'active'
    ORDER BY sort_order ASC, id ASC
  `);
  console.log(`=== FINAL STATE: ${final.rows.length} active products ===`);
  final.rows.forEach(p => {
    console.log(`  #${p.sort_order} id=${p.id} | ${p.name} | ${p.category} | hidden=${p.is_hidden} | catalog=${p.is_catalog_enabled} | slug=${p.slug}`);
  });

  // Count archived
  const archived = await client.query(`SELECT count(*) FROM products WHERE product_status = 'archived'`);
  console.log(`\nArchived products: ${archived.rows[0].count}`);

} catch (err) {
  await client.query('ROLLBACK');
  console.error('ROLLBACK - Error:', err.message);
  throw err;
}

await client.end();
console.log('\nDone.');
