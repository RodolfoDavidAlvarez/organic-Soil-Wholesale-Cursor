Organic Soil Wholesale Purchase Flow

Overview

The flow enables buyers to select multiple soil products with constraints based on packaging, logistics, and fulfillment options (bulk vs. pallet). It emphasizes:

Smooth transitions between selection steps

Enforcement of product-mix constraints

Support for both mixed pallet and bulk full-truck logic

Purchase Flow Steps

Step 1: Product & Size Selection

Start on Product Gallery Page

User sees list of all products.

Each product includes "View Details" → opens full product page.

Note: Ensure browser history or state memory allows returning to gallery without losing previous selections.

Category & Size Selection (Pop-up or Transition)

After clicking a product: choose from available Size Categories:

Pallet of Boxes

Pallet of Bags

2.2 CY Tote

Bulk Delivery

Bulk Pickup

Truckload of Totes

Then enter Quantity.

Mixed Pallet Functionality

If pallet type → user can add multiple products of the same category to form a mixed pallet.

Visual tracker shows:

Total units

Progress toward 22-unit truckload threshold

Truckload discount eligibility

Action Buttons:

Add Another Product (Same Category)

Complete This Pallet

Add New Pallet (Different Category)

Step 2: Contact Info

Business Name

Email Address

Phone Number

Step 3: Pickup vs. Delivery

User selects fulfillment option:

Delivery:

Required if bulk delivery selected

Prompt for delivery address

Pickup:

Only available for pallet products or cubic yard pickup (Vicksburg)

Locations:

Phoenix (all products/sizes)

Parker (all products/sizes)

Vicksburg (bulk only: dairy compost, worm castings)

Step 4: Order Review

Summary grouped by:

Product Category

Pallet Group

Subtotals and Applied Discounts

Delivery or Pickup Info

Estimated Lead Times

Submit Order

Step 5: Order Confirmation

On-screen "Thank You"

Email confirmation sent to:

Customer

Admin

Product & Trucking Constraints

Pallet of Boxes:

144 units per pallet

Eligible for truckload discount at 22+ pallets

Can be mixed within same category

Pallet of Bags:

50 bags per pallet

Eligible for truckload discount at 22+ pallets

Can be mixed within same category

2.2 CY Tote:

1 tote per pallet

Eligible for truckload discount at 22+ pallets

Can be mixed within same category

Bulk Delivery:

22–24 tons per truckload

Discount only applies to full truckloads

No mixing allowed

Bulk Pickup (Cubic Yards):

No minimum required

Not eligible for truckload discount

Only available in Vicksburg (Dairy Compost and Worm Castings)

Truckload of Totes:

22 totes per truckload

Eligible for truckload discount

Can be mixed within same category

Logic Rules & Validation

Product Constraints

Only specific products (Dairy Compost, Worm Castings) allowed for Bulk Pickup.

Bulk Delivery orders must:

Contain one product

Be a full truckload

Require a delivery address

Location Rules

Phoenix:

All product categories available

Parker:

All product categories available

Vicksburg:

Only Dairy Compost and Worm Castings (Bulk or Cubic Yards)

Truckload Discount Rules

20% discount applies when a single full truckload (22 pallets or equivalent) is completed.

If more than 22 pallets are selected (e.g., 23), only the first 22 receive the discount.

Remaining pallets start a new truckload and are not discounted until it reaches 22 units.

This structure encourages users to complete full truckloads.

Technical Requirements (For AI or Dev)

Category-First Flow:

Enforce selection of category, then product

Palette Groups Logic:

Group products by category

Assign shared group ID

Apply truckload discounts per group

Validation Checks:

Prevent mixing incompatible product types (e.g., bulk and pallet)

Automatically enforce delivery for bulk orders

Enforce location-based availability

UX Enhancements:

Clear tooltips explaining constraints

Visual tracker for truckload progress

Ensure persistent state when navigating between pages

Logical flow for product addition, completion, and review
