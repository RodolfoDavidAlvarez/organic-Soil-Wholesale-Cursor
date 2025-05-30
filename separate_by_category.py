import json
import os
import shutil

# Create or clean directory for categories
categories_dir = "src/data/categories"
if os.path.exists(categories_dir):
    shutil.rmtree(categories_dir)
os.makedirs(categories_dir, exist_ok=True)

# Read the original product information file
with open("Product Information.json", "r") as f:
    products = json.load(f)

# Group products by category
categories = {}
for product in products:
    category = product.get("Product Category", "").strip()
    if not category:  # Handle empty categories
        category = "Uncategorized"
    
    if category not in categories:
        categories[category] = []
    categories[category].append(product)

# Save each category to a separate file
for category, category_products in categories.items():
    file_name = f"{categories_dir}/{category.lower().replace(' ', '_')}.json"
    with open(file_name, "w") as f:
        json.dump(category_products, f, indent=2)
    
    print(f"Created {file_name} with {len(category_products)} products")