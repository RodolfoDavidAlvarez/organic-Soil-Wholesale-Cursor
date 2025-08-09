// Static inventory data - will be replaced with API calls to admin dashboard in future
// Structure matches future database schema for seamless transition

export interface InventoryItem {
  productId: number;
  locationId: number;
  sizeOption: string;
  quantityAvailable: number;
  price: number;
  unit: string; // '9lb Bag', '25lb Bag', etc.
  lastUpdated: string;
}

export interface ProductInventory {
  productId: number;
  inventory: InventoryItem[];
}

// Phoenix Location (ID: 1) Static Inventory
// In future, this will come from: GET /api/inventory/location/1
export const phoenixInventory: InventoryItem[] = [
  // Organic Dairy Compost
  { productId: 1, locationId: 1, sizeOption: '9lb Bag', quantityAvailable: 150, price: 24.99, unit: 'bag', lastUpdated: '2025-08-09' },
  { productId: 1, locationId: 1, sizeOption: '25lb Bag', quantityAvailable: 85, price: 49.99, unit: 'bag', lastUpdated: '2025-08-09' },
  { productId: 1, locationId: 1, sizeOption: 'Bulk (50lb)', quantityAvailable: 40, price: 89.99, unit: 'bag', lastUpdated: '2025-08-09' },
  
  // Mikey's Worm Poop
  { productId: 2, locationId: 1, sizeOption: '9lb Bag', quantityAvailable: 120, price: 29.99, unit: 'bag', lastUpdated: '2025-08-09' },
  { productId: 2, locationId: 1, sizeOption: '25lb Bag', quantityAvailable: 60, price: 59.99, unit: 'bag', lastUpdated: '2025-08-09' },
  
  // Amazonian Dark Earth
  { productId: 3, locationId: 1, sizeOption: '9lb Bag', quantityAvailable: 90, price: 34.99, unit: 'bag', lastUpdated: '2025-08-09' },
  { productId: 3, locationId: 1, sizeOption: '25lb Bag', quantityAvailable: 45, price: 69.99, unit: 'bag', lastUpdated: '2025-08-09' },
  { productId: 3, locationId: 1, sizeOption: 'Bulk (50lb)', quantityAvailable: 25, price: 129.99, unit: 'bag', lastUpdated: '2025-08-09' },
  
  // Add more products as needed...
];

// Function to get inventory by product ID (mimics future API call)
export function getProductInventory(productId: number, locationId: number = 1): InventoryItem[] {
  return phoenixInventory.filter(item => 
    item.productId === productId && item.locationId === locationId
  );
}

// Function to check if item is in stock
export function isInStock(productId: number, sizeOption: string, quantity: number = 1, locationId: number = 1): boolean {
  const item = phoenixInventory.find(inv => 
    inv.productId === productId && 
    inv.sizeOption === sizeOption && 
    inv.locationId === locationId
  );
  return item ? item.quantityAvailable >= quantity : false;
}

// Function to get price for specific size
export function getProductPrice(productId: number, sizeOption: string, locationId: number = 1): number {
  const item = phoenixInventory.find(inv => 
    inv.productId === productId && 
    inv.sizeOption === sizeOption && 
    inv.locationId === locationId
  );
  return item?.price || 0;
}

// Mock function for future order submission
// In future will POST to /api/orders/create
export async function submitOrder(orderData: any): Promise<{ success: boolean; orderId?: string; error?: string }> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Generate mock order ID
  const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  
  // In production, this would:
  // 1. Validate inventory availability
  // 2. Reserve inventory
  // 3. Create order in database
  // 4. Send confirmation email/SMS
  // 5. Notify staff
  
  return {
    success: true,
    orderId
  };
}

// Structure for future CMS integration
export interface CMSProduct {
  id: number;
  name: string;
  description: string;
  category: string;
  images: {
    texture: string;
    product: string;
    additional: string[];
  };
  sizeOptions: {
    size: string;
    unit: string;
    basePrice: number;
    weight: number;
  }[];
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  status: 'active' | 'inactive' | 'seasonal';
  createdAt: string;
  updatedAt: string;
}