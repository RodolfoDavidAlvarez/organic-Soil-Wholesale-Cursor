# Organic Soil Wholesale Purchase Flow Documentation

## Overview

This document outlines the complete purchase flow for the Organic Soil Wholesale e-commerce application, with a focus on ensuring a professional, clean, and optimized user experience. It details how customers can create orders, including mixed palette options, and schedule pickups or deliveries with specific parameters and constraints.

## Current Purchase Flow

### Step 1: Product Selection
- User selects products from a gallery of available options
- For each product, user selects a size category (Pallet of Boxes, Pallet of Bags, 2.2 CY Tote, Bulk Delivery, Bulk Pickup, Truckload of Totes)
- User specifies quantity for each selection
- Products are added to the order

### Step 2: Contact Information
- User provides business name
- User provides email address
- User provides phone number

### Step 3: Delivery Options
- User selects either delivery or pickup
- If delivery: User provides delivery address
- If pickup: User selects from available pickup locations (Phoenix, Parker, Vicksburg)

### Step 4: Review Order
- User reviews product selections, quantities, and pricing information
- User confirms contact and delivery information
- User submits order

### Step 5: Confirmation
- Thank you screen confirms order was received
- User receives confirmation email with order details
- Admin receives notification email with order details

## Parameters and Constraints

### Product Categories
1. **Pallet of Boxes**
   - 144 units / 36 boxes (4 units per box)
   - Qualifies for truckload discount at 22+ pallets
   - Can be mixed within same product category

2. **Pallet of Bags**
   - 50 bags (1cf Bags)
   - Qualifies for truckload discount at 22+ pallets
   - Can be mixed within same product category

3. **2.2 CY Tote (supersack)**
   - Single unit per tote
   - Qualifies for truckload discount at 22+ totes
   - Can be mixed within same product category

4. **Bulk Delivery**
   - Compost and blends: 22-24 tons per truckload
   - Potting soil: 90-110 CYs per truckload
   - Full truckload receives discount
   - Cannot be mixed with other categories

5. **Bulk Pickup**
   - Bulk in Cubic Yard for pickup only
   - Only certain products available (Dairy Compost, Worm Castings)
   - No minimum quantity
   - Cannot be mixed with other categories

6. **Truckload of Totes**
   - Full truckload (22 pallets of 2.2CY totes)
   - Receives truckload discount
   - Can be mixed within same product category

### Discount Structure
- **Truckload Discount**: 20% discount applies when:
  - For palette products (boxes, bags, totes): 22+ units ordered
  - For bulk products: Full truckload ordered
- Discounts are automatically calculated and displayed
- Mixed palettes count as a single unit toward the truckload threshold

### Pickup Location Constraints
- **Phoenix Location**: All products and size categories available
- **Parker Location**: All products and size categories available
- **Vicksburg Location**: Only dairy compost bulk in truckload and cubic yards for pickup

### Product-Specific Constraints
- **Dairy Compost and Worm Castings**: Only products available for pickup in cubic yards at Vicksburg
- Other products have various size options (1CF Bag, 9 LB Bag, Totes, etc.)
- Some products are only available in specific size categories

## Improved Purchase Flow (Recommendations)

### Step 1: Product Selection (Enhanced)
1. User first selects a size category (Palette of Boxes, Palette of Bags, etc.)
2. User then selects which products and quantities within that category
3. For mixed palettes:
   - Allow user to add multiple products within the same category
   - Track total units toward truckload discount (22+ units)
   - Clearly indicate that products must be in the same size category
4. Add a "Complete Palette" button when user is done adding products to a mixed palette
5. Allow user to add additional categories/palettes to their order

### Step 2-5: Remain the same as current flow

## Technical Implementation Requirements

### Mixed Palette Support
- Introduce concept of "palette groups" in data structure
- Group products of the same category together with a shared ID
- Calculate truckload discounts based on total quantity within a palette group
- Update UI to visually group products that belong to the same palette

### Product Constraints
- Add validation to ensure only eligible products are available for bulk pickup
- Enforce location-specific constraints (e.g., Vicksburg limitations)
- Validate palette groupings to ensure products are only mixed within compatible categories

### User Experience Improvements
- Add clear instructions for creating mixed palettes
- Provide visual indicators when a palette is eligible for truckload discount
- Improve product filtering to help users find products by category
- Add tooltips or help text explaining the constraints and requirements

## User Interface Elements

### Mixed Palette Creation
- Category selection first, then product selection
- Running total of units in palette
- Visual progress toward 22-unit truckload discount threshold
- Clear "Add Another Product" and "Complete Palette" buttons
- Visual grouping of products within the same palette

### Product Selection
- Filter by product type (Amendment, Potting, Specialty)
- Clear indication of which products are available in which size categories
- Constraints clearly communicated (e.g., "Pickup only", "Vicksburg location only")

### Order Review
- Group products by palette/category
- Show subtotal per palette
- Clearly indicate which palettes qualify for truckload discount
- Show estimated delivery timeframes

## Next Steps for Implementation

1. Update data models to support palette grouping
2. Modify product selection flow to category-first approach
3. Implement mixed palette UI and grouping logic
4. Add validation for product and location constraints
5. Update discount calculation logic
6. Enhance order review to show groupings
7. Test with various order scenarios to ensure all constraints are properly enforced

This document serves as a guide for both understanding the current system and implementing the enhanced version that better supports mixed palettes and enforces the business constraints.