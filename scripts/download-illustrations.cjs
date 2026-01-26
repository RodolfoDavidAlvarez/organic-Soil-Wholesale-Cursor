const fs = require('fs');
const path = require('path');

// Requires AIRTABLE_API_KEY env var - run with: AIRTABLE_API_KEY=xxx node scripts/download-illustrations.cjs
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
if (!AIRTABLE_API_KEY) {
  console.error('AIRTABLE_API_KEY environment variable is required');
  process.exit(1);
}
const SSW1_BASE_ID = 'appDCKrxtJ7oG9O19';
const PRODUCTS_TABLE_ID = 'tbltXMzV96FnmrjFw';
const OUTPUT_DIR = './client/public/product-illustrations';

async function downloadImage(url, filename) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Download failed');
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(path.join(OUTPUT_DIR, filename), Buffer.from(buffer));
    return true;
  } catch (err) {
    console.error('  Failed to download:', filename, err.message);
    return false;
  }
}

async function fetchAllProducts() {
  let allRecords = [];
  let offset = null;

  do {
    const url = new URL('https://api.airtable.com/v0/' + SSW1_BASE_ID + '/' + PRODUCTS_TABLE_ID);
    url.searchParams.set('pageSize', '100');
    if (offset) url.searchParams.set('offset', offset);

    const response = await fetch(url.toString(), {
      headers: { 'Authorization': 'Bearer ' + AIRTABLE_API_KEY }
    });
    const data = await response.json();
    allRecords = allRecords.concat(data.records || []);
    offset = data.offset;
  } while (offset);

  return allRecords;
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('Fetching all products from Airtable...');
  const records = await fetchAllProducts();
  console.log('Found', records.length, 'products');

  let downloaded = 0;
  const productMap = {};

  for (const rec of records) {
    const fields = rec.fields;
    const productName = fields['Product Name '] || fields['Product Name'] || fields['Name'];
    const productId = fields['Product ID'];
    const illustrations = fields['Illustrative Files'];

    if (illustrations && illustrations.length > 0) {
      // Use first illustration
      const ill = illustrations[0];
      const ext = path.extname(ill.filename) || '.png';
      const safeName = (productId || productName || rec.id).replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
      const filename = safeName + ext;

      console.log('Downloading:', productName, '->', filename);
      const success = await downloadImage(ill.url, filename);
      if (success) {
        downloaded++;
        productMap[rec.id] = { productName, productId, filename };
      }
    }
  }

  // Save mapping file
  fs.writeFileSync(path.join(OUTPUT_DIR, 'product-map.json'), JSON.stringify(productMap, null, 2));

  console.log('\nDownloaded', downloaded, 'illustrations');
  console.log('Mapping saved to product-map.json');
}

main().catch(console.error);
