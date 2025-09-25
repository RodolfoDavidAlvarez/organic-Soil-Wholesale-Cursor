const fs = require('fs');
const path = require('path');

function loadProductData() {
  const dataDir = path.join(__dirname, '../client/src/data/json');
  const amendmentProducts = JSON.parse(fs.readFileSync(path.join(dataDir, 'Amendment Products.json'), 'utf8'));
  const pottingSoilProducts = JSON.parse(fs.readFileSync(path.join(dataDir, 'Potting Soil Products.json'), 'utf8'));
  const mulchProducts = JSON.parse(fs.readFileSync(path.join(dataDir, 'Mulch Products.json'), 'utf8'));
  const concentratedAmendmentProducts = JSON.parse(fs.readFileSync(path.join(dataDir, 'Concentrated Amendment Products.json'), 'utf8'));
  const productStories = JSON.parse(fs.readFileSync(path.join(dataDir, 'product_stories_and_overview.json'), 'utf8'));
  
  // Merge all products with IDs
  const mergeProductData = (products, baseId) => {
    return products.map((product, index) => {
      const storyData = productStories.find((story) => 
        story["Product name"].toLowerCase() === product["Product name"].toLowerCase() ||
        story["Product name"].toLowerCase() === product["Brand name"]?.toLowerCase()
      );
      
      return {
        id: baseId + index,
        name: product["Product name"],
        productType: product["Brand name"],
        category: product["Product Category"],
        price: 0,
        stockQuantity: 0,
        imageUrl: product["9lb Bag Photo URL"] || "",
        texturePhotoUrl: product["Product Texture Photo URL"] || "",
        isWholesaleOnly: false,
        allowBulkPickup: true,
        certifications: product["Certifications"],
        description: storyData?.["Brief Overview"] || product["Brief Overview"],
        displayTitle: product["Display Title"],
        marketingTitle: product["Marketing Title"],
        ingredients: product["Ingredients"],
        targetAudience: product["Target audience"],
        recommendedUses: product["Recommended Uses"],
        story: storyData?.["Story"] || product["Story"],
        usage: product["Gardener Usage Instructions"],
        features: product["Key Features/benefits"],
        sizeOptions: product["Size Categories"],
        additionalImages: product["additionalImages"] || [],
        productVideoUrl: product["Product Video URL"],
        productVideoTitle: product["Product Video Title"],
        safetyPrecautions: product["Safety Precautions"],
        warranty: product["Limited Warranty"],
        minOrderQuantity: 1,
        maxOrderQuantity: 1000,
        isPriceNegotiable: false,
        requiresQuote: false,
        seoKeywords: product["SEO Keywords"],
        marketingNote: product["Marketing Note"]
      };
    });
  };
  
  return [
    ...mergeProductData(amendmentProducts, 1000),
    ...mergeProductData(pottingSoilProducts, 2000),
    ...mergeProductData(mulchProducts, 3000),
    ...mergeProductData(concentratedAmendmentProducts, 4000),
  ];
}

module.exports = { loadProductData };