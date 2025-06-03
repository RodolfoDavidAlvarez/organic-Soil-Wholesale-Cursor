# Development Rules and Constraints

## Product Data Structure

### Data Sources

All product data for the website will be sourced from the following JSON files:

1. `amendment-products.json` - Contains amendment product data
2. `concentrated-amendment-products.json` - Contains concentrated amendment product data
3. `mulch-products.json` - Contains mulch product data
4. `punished-soil-products.json` - Contains punished soil product data

These JSON files serve as the single source of truth for all product information displayed on the website.

### Data Maintenance

**Important**: After any product-related changes (prices, descriptions, availability, etc.), the corresponding JSON file must be updated immediately. This ensures that the website always displays the most current and accurate product information. Failure to update these files will result in outdated information being displayed to customers.
