import { Package, Box, Truck, ShoppingBag, Warehouse } from "lucide-react";

export interface ProductCategory {
  value: string;
  label: string;
  icon: any;
  description: string;
  imageUrl?: string;
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    value: "boxes",
    label: "Pallet of 9 lb bags",
    icon: Box,
    description: "144 units (36 cases of 4 units)",
  },
  {
    value: "bags",
    label: "Pallet of 1CF bags",
    icon: ShoppingBag,
    description: "50 bags (1CF each)",
  },
  {
    value: "totes",
    label: "2.2 CY Tote",
    icon: Package,
    description: "Single supersack",
  },
  {
    value: "bulk",
    label: "Bulk Delivery",
    icon: Truck,
    description: "22-24 tons (soil amendments and concentrates) / 90-110 CYs (potting soil and mulch)",
  },
  {
    value: "bulk-pickup",
    label: "Bulk Pickup",
    icon: Warehouse,
    description: "Cubic yards (Dairy Compost only)",
  },
];
