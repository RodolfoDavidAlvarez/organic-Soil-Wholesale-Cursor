#!/usr/bin/env node
/**
 * Generate Mixing Guidelines PDF
 * Usage: node generate-mixing-guide.js "Bacchus Blend" --tons 2
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Airtable config
const AIRTABLE_API_KEY = '<AIRTABLE_KEY_REMOVED>
const AIRTABLE_BASE_ID = 'appDCKrxtJ7oG9O19';
const PRODUCTS_TABLE_ID = 'tbltXMzV96FnmrjFw';

// Parse ingredient ratios from Airtable format
function parseIngredientRatios(ratioText) {
  if (!ratioText) return [];
  
  const ingredients = [];
  
  // Try to extract all ingredient patterns directly using global regex matching
  // Pattern for formula format: "Name: (num/num) * 100 = X%"
  const formulaPattern = /([A-Za-z][A-Za-z\s']+?)[\s:]*\([\d.]+(?:\s*lbs?)?\s*\/\s*[\d.]+(?:\s*lbs?)?\)[^=]*=\s*([\d.]+)%/g;
  let match;
  while ((match = formulaPattern.exec(ratioText)) !== null) {
    ingredients.push({
      name: match[1].trim().replace(/:$/, ''),
      percentage: parseFloat(match[2]),
      lbsPer2000: Math.round((parseFloat(match[2]) / 100) * 2000)
    });
  }
  
  // If we found formula-style ingredients, return them
  if (ingredients.length > 0) return ingredients;
  
  // Otherwise, try splitting by commas and newlines for simpler formats
  let parts = ratioText.split(/[\n,]+/).map(s => s.trim()).filter(s => s);
  
  for (const part of parts) {
    // Clean up markdown formatting
    const cleanPart = part.replace(/\*\*/g, '').replace(/^[\s•\-\t]+/, '').trim();
    if (!cleanPart) continue;
    
    // Pattern 1: "Ingredient: (320/1340) * 100 = 23.88%" or "Ingredient (320 lbs / 1340 lbs) * 100% = 23.88%"
    let match = cleanPart.match(/([^:(]+?)[\s:]*\([\d.]+(?:\s*lbs?)?\s*\/\s*[\d.]+(?:\s*lbs?)?\).*?=\s*([\d.]+)%/i);
    if (match) {
      ingredients.push({
        name: match[1].trim().replace(/:$/, ''),
        percentage: parseFloat(match[2]),
        lbsPer2000: Math.round((parseFloat(match[2]) / 100) * 2000)
      });
      continue;
    }
    
    // Pattern 2: "1750 lbs.- compost" or "1750 lbs. compost" (weight-based, assume 2000 lbs total)
    match = cleanPart.match(/([\d.]+)\s*lbs?\.?[\s\-]*(.+)/i);
    if (match) {
      const lbs = parseFloat(match[1]);
      const name = match[2].trim();
      if (name && lbs > 0) {
        ingredients.push({
          name: name,
          percentage: Math.round((lbs / 2000) * 100 * 100) / 100,
          lbsPer2000: lbs
        });
        continue;
      }
    }
    
    // Pattern 3: "percentage% Ingredient" (like "88% Dairy compost")
    match = cleanPart.match(/^([\d.]+)%\s+(.+)/i);
    if (match) {
      const pct = parseFloat(match[1]);
      let name = match[2].trim();
      if (name && pct > 0) {
        ingredients.push({
          name: name,
          percentage: pct,
          lbsPer2000: Math.round((pct / 100) * 2000)
        });
        continue;
      }
    }
    
    // Pattern 4: "Ingredient percentage%" (like "Dairy compost 88%")
    match = cleanPart.match(/(.+?)\s+([\d.]+)%\s*$/i);
    if (match) {
      const pct = parseFloat(match[2]);
      let name = match[1].trim();
      if (name && pct > 0 && !name.match(/^[\d.]+$/)) {
        ingredients.push({
          name: name,
          percentage: pct,
          lbsPer2000: Math.round((pct / 100) * 2000)
        });
        continue;
      }
    }
    
    // Pattern 5: "Ingredient: percentage%" (simple colon format)
    match = cleanPart.match(/([^:]+):\s*([\d.]+)%/i);
    if (match) {
      const name = match[1].trim();
      const pct = parseFloat(match[2]);
      if (name && pct > 0 && !name.match(/^[\d.]+$/)) {
        ingredients.push({
          name: name,
          percentage: pct,
          lbsPer2000: Math.round((pct / 100) * 2000)
        });
      }
    }
  }
  
  return ingredients;
}

// Calculate quantities for a given batch size
function calculateQuantities(ingredients, batchTons) {
  const batchLbs = batchTons * 2000;
  return ingredients.map(ing => ({
    ...ing,
    quantity: Math.round((ing.percentage / 100) * batchLbs)
  }));
}

// Fetch product from Airtable
async function fetchProduct(productName) {
  let allRecords = [];
  let offset;
  
  while (true) {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${PRODUCTS_TABLE_ID}`);
    if (offset) url.searchParams.set('offset', offset);
    
    const resp = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });
    const data = await resp.json();
    if (data.error) throw new Error(data.error.message);
    
    allRecords.push(...(data.records || []));
    if (!data.offset) break;
    offset = data.offset;
  }
  
  // Find matching product
  const product = allRecords.find(r => {
    const name = r.fields['Product Name '] || '';
    return name.toLowerCase().includes(productName.toLowerCase());
  });
  
  if (!product) throw new Error(`Product "${productName}" not found`);
  
  return {
    id: product.id,
    name: product.fields['Product Name '] || '',
    productId: product.fields['Product ID'] || '',
    ingredientRatios: product.fields['Ingredient Ratios'] || '',
    story: product.fields['Story'] || '',
    recommendedUses: (product.fields['Recommended Uses'] || '').split(/Composition:|Ingredients:|Contains:/i)[0].trim(),
    illustrationUrl: product.fields['Illustrative Files']?.[0]?.url || null,
    illustrationFilename: product.fields['Illustrative Files']?.[0]?.filename || null
  };
}

// Generate HTML for the mixing guide
function generateHTML(product, batchTons, ingredients) {
  const batchLbs = batchTons * 2000;
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  
  const ingredientRows = ingredients.map(ing => `
    <tr>
      <td class="ingredient-name">${ing.name}</td>
      <td class="ingredient-pct">${ing.percentage}%</td>
      <td class="ingredient-qty">${ing.quantity.toLocaleString()} lbs</td>
    </tr>
  `).join('');
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Mixing Guide - ${product.name}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    @page {
      size: letter;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Inter', sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1a1a1a;
    }
    .page {
      width: 8.5in;
      height: 11in;
      padding: 0.4in 0.5in;
      position: relative;
      overflow: hidden;
    }
    
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 3px solid #264027;
    }
    .company-name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 22pt;
      font-weight: 600;
      color: #264027;
      margin-bottom: 2px;
    }
    .tagline {
      font-family: 'Montserrat', sans-serif;
      font-size: 10pt;
      font-weight: 500;
      color: #6f732f;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .doc-type {
      text-align: right;
    }
    .doc-title {
      font-family: 'Montserrat', sans-serif;
      font-size: 14pt;
      font-weight: 700;
      color: #264027;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .doc-date {
      font-size: 10pt;
      color: #666;
      margin-top: 4px;
    }
    
    /* Product Header */
    .product-header {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }
    .product-image {
      width: 120px;
      height: 120px;
      background: linear-gradient(135deg, #f5f7f5 0%, #e8ebe8 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #264027;
      overflow: hidden;
      flex-shrink: 0;
    }
    .product-image img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .product-info {
      flex: 1;
    }
    .product-name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 22pt;
      font-weight: 600;
      color: #264027;
      margin-bottom: 4px;
    }
    .product-id {
      font-family: 'Montserrat', sans-serif;
      font-size: 10pt;
      color: #666;
      margin-bottom: 6px;
    }
    .product-uses {
      font-size: 9pt;
      color: #444;
      line-height: 1.4;
    }
    
    /* Batch Info */
    .batch-box {
      background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
      border: 2px solid #264027;
      border-radius: 10px;
      padding: 14px 20px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-around;
      align-items: center;
    }
    .batch-item {
      text-align: center;
    }
    .batch-label {
      font-family: 'Montserrat', sans-serif;
      font-size: 9pt;
      font-weight: 600;
      color: #264027;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .batch-value {
      font-family: 'Montserrat', sans-serif;
      font-size: 20pt;
      font-weight: 700;
      color: #264027;
    }
    .batch-unit {
      font-size: 10pt;
      font-weight: 500;
    }
    
    /* Section */
    .section {
      margin-bottom: 14px;
    }
    .section-title {
      font-family: 'Montserrat', sans-serif;
      font-size: 10pt;
      font-weight: 600;
      color: #264027;
      background: linear-gradient(135deg, #f8faf8 0%, #f0f4f0 100%);
      padding: 8px 12px;
      border-left: 4px solid #264027;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    /* Ingredients Table */
    .ingredients-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10pt;
    }
    .ingredients-table th {
      background: #264027;
      color: white;
      font-family: 'Montserrat', sans-serif;
      font-weight: 600;
      padding: 8px 12px;
      text-align: left;
      text-transform: uppercase;
      font-size: 9pt;
      letter-spacing: 0.5px;
    }
    .ingredients-table th:last-child {
      text-align: right;
    }
    .ingredients-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #ddd;
    }
    .ingredients-table tr:nth-child(even) {
      background: #f9faf9;
    }
    .ingredient-name {
      font-weight: 600;
      color: #333;
    }
    .ingredient-pct {
      color: #666;
      text-align: center;
    }
    .ingredient-qty {
      font-family: 'Montserrat', sans-serif;
      font-weight: 700;
      color: #264027;
      font-size: 12pt;
      text-align: right;
    }
    .total-row td {
      background: linear-gradient(135deg, #264027 0%, #3d5c3f 100%);
      color: white;
      font-weight: 700;
      border-bottom: none;
    }
    .total-row .ingredient-qty {
      color: white;
    }
    
    /* Instructions */
    .instructions {
      background: #fafafa;
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 12px 16px;
    }
    .instructions ol {
      margin-left: 18px;
      font-size: 9pt;
    }
    .instructions li {
      margin-bottom: 4px;
      line-height: 1.4;
    }
    
    /* Footer */
    .footer {
      position: absolute;
      bottom: 0.35in;
      left: 0.5in;
      right: 0.5in;
      text-align: center;
      font-size: 8pt;
      color: #888;
      border-top: 1px solid #ddd;
      padding-top: 8px;
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="logo-section">
        <div class="company-name">Soil Seed & Water</div>
        <div class="tagline">Organic Soil Products</div>
      </div>
      <div class="doc-type">
        <div class="doc-title">Mixing Guidelines</div>
        <div class="doc-date">${today}</div>
      </div>
    </div>
    
    <!-- Product Header -->
    <div class="product-header">
      <div class="product-image">
        ${product.illustrationUrl 
          ? `<img src="${product.illustrationUrl}" alt="${product.name}" />`
          : `<span style="color:#999;font-size:10pt;">No Image</span>`
        }
      </div>
      <div class="product-info">
        <div class="product-name">${product.name}</div>
        <div class="product-id">Product ID: ${product.productId}</div>
        <div class="product-uses">${product.recommendedUses}</div>
      </div>
    </div>
    
    <!-- Batch Info -->
    <div class="batch-box">
      <div class="batch-item">
        <div class="batch-label">Batch Size</div>
        <div class="batch-value">${batchTons} <span class="batch-unit">tons</span></div>
      </div>
      <div class="batch-item">
        <div class="batch-label">Total Weight</div>
        <div class="batch-value">${batchLbs.toLocaleString()} <span class="batch-unit">lbs</span></div>
      </div>
      <div class="batch-item">
        <div class="batch-label">Total Ingredients</div>
        <div class="batch-value">${ingredients.length}</div>
      </div>
    </div>
    
    <!-- Ingredients -->
    <div class="section">
      <div class="section-title">Ingredient Ratios</div>
      <table class="ingredients-table">
        <thead>
          <tr>
            <th>Ingredient</th>
            <th style="text-align:center;">Ratio</th>
            <th style="text-align:right;">Quantity</th>
          </tr>
        </thead>
        <tbody>
          ${ingredientRows}
          <tr class="total-row">
            <td class="ingredient-name">TOTAL</td>
            <td class="ingredient-pct">100%</td>
            <td class="ingredient-qty">${batchLbs.toLocaleString()} lbs</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Instructions -->
    <div class="section">
      <div class="section-title">Mixing Instructions</div>
      <div class="instructions">
        <ol>
          <li>Verify all ingredient quantities before starting.</li>
          <li>Load base ingredient (${ingredients[0]?.name || 'Dairy Compost'}) into mixer first.</li>
          <li>Add remaining ingredients in order of largest to smallest quantity.</li>
          <li>Mix for minimum 3-5 minutes until uniform color and consistency.</li>
          <li>Check for clumps and break apart if necessary.</li>
          <li>Transfer to bagging station or storage area.</li>
        </ol>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      Soil Seed & Water, LLC • 18980 Stanton Rd, Congress, AZ 85332 • (623) 399-6664 • organicsoilwholesale.com
    </div>
  </div>
</body>
</html>
  `;
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const productName = args[0] || 'Bacchus Blend';
  const tonsIdx = args.indexOf('--tons');
  const batchTons = tonsIdx >= 0 ? parseInt(args[tonsIdx + 1]) || 2 : 2;
  
  console.log(`Generating mixing guide for "${productName}" (${batchTons} tons batch)...`);
  
  // Fetch product
  const product = await fetchProduct(productName);
  console.log('Found product:', product.name, '(' + product.productId + ')');
  
  // Parse ingredients
  const ingredients = parseIngredientRatios(product.ingredientRatios);
  console.log('Parsed ingredients:', ingredients.length);
  
  // Calculate quantities
  const calculatedIngredients = calculateQuantities(ingredients, batchTons);
  
  // Generate HTML
  const html = generateHTML(product, batchTons, calculatedIngredients);
  
  // Generate PDF
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  const outputPath = path.join(__dirname, `../mixing-guides/${product.productId}-mixing-guide-${batchTons}ton.pdf`);
  
  // Ensure directory exists
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  
  await page.pdf({
    path: outputPath,
    format: 'Letter',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });
  
  await browser.close();
  
  console.log(`✅ PDF generated: ${outputPath}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
