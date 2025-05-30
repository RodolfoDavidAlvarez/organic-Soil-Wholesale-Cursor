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
    label: "Pallet of Boxes",
    icon: Box,
    description: "144 units per pallet (36 boxes with 4 units per box)",
  },
  {
    value: "bags",
    label: "Pallet of Bags",
    icon: ShoppingBag,
    description: "50 bags per pallet (1CF bags)",
  },
  {
    value: "totes",
    label: "2.2 CY Tote",
    icon: Package,
    description: "Single 2.2 CY tote (supersack)",
  },
  {
    value: "bulk",
    label: "Bulk Delivery",
    icon: Truck,
    description: "Compost: 22-24 tons | Potting soil: 90-110 CYs per truckload",
  },
  {
    value: "bulk-pickup",
    label: "Bulk Pickup",
    icon: Warehouse,
    description: "Cubic yard pickup (available only at Vicksburg for Dairy Compost & Worm Castings)",
  },
  {
    value: "truckload-totes",
    label: "Truckload of Totes",
    icon: Package,
    description: "22 totes per truckload, eligible for truckload discount",
  },
];
