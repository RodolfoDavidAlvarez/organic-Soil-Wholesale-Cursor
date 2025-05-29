import { Package, Box, Truck, ShoppingBag, Warehouse } from "lucide-react";

export interface ProductCategory {
  value: string;
  label: string;
  icon: any;
  description: string;
  imageUrl: string;
  isPalette: boolean;
  unitsPerPallet?: number;
  unitsForTruckload?: number;
  allowMixing?: boolean;
  locationRestrictions?: {
    phoenix: boolean;
    parker: boolean;
    vicksburg: boolean;
  };
  productRestrictions?: string[];
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    value: "boxes",
    label: "Pallet of Boxes",
    icon: Box,
    description: "144 units per pallet, eligible for 20% truckload discount at 22+ pallets",
    imageUrl: "/images/boxes.jpg",
    isPalette: true,
    unitsPerPallet: 144,
    unitsForTruckload: 22,
    allowMixing: true,
    locationRestrictions: {
      phoenix: true,
      parker: true,
      vicksburg: false,
    },
  },
  {
    value: "bags",
    label: "Pallet of Bags",
    icon: ShoppingBag,
    description: "50 bags per pallet, eligible for 20% truckload discount at 22+ pallets",
    imageUrl: "/images/bags.jpg",
    isPalette: true,
    unitsPerPallet: 50,
    unitsForTruckload: 22,
    allowMixing: true,
    locationRestrictions: {
      phoenix: true,
      parker: true,
      vicksburg: false,
    },
  },
  {
    value: "totes",
    label: "2.2 CY Tote",
    icon: Package,
    description: "1 tote per pallet, eligible for 20% truckload discount at 22+ pallets",
    imageUrl: "/images/totes.jpg",
    isPalette: true,
    unitsPerPallet: 1,
    unitsForTruckload: 22,
    allowMixing: true,
    locationRestrictions: {
      phoenix: true,
      parker: true,
      vicksburg: false,
    },
  },
  {
    value: "bulk",
    label: "Bulk Delivery",
    icon: Truck,
    description: "22-24 tons per truckload, discount only applies to full truckloads, no mixing allowed",
    imageUrl: "/images/bulk-delivery.jpg",
    isPalette: false,
    unitsPerPallet: null,
    unitsForTruckload: 1,
    allowMixing: false,
    locationRestrictions: {
      phoenix: true,
      parker: true,
      vicksburg: false,
    },
  },
  {
    value: "bulk-pickup",
    label: "Bulk Pickup",
    icon: Warehouse,
    description: "No minimum required, not eligible for truckload discount",
    imageUrl: "/images/bulk-pickup.jpg",
    isPalette: false,
    unitsPerPallet: null,
    unitsForTruckload: null,
    allowMixing: false,
    locationRestrictions: {
      phoenix: false,
      parker: false,
      vicksburg: true,
    },
    productRestrictions: ["ORGANIC DAIRY COMPOST", "ORGANIC WORM CASTINGS"],
  },
  {
    value: "truckload-totes",
    label: "Truckload of Totes",
    icon: Package,
    description: "22 totes per truckload, eligible for truckload discount, can be mixed within same category",
    imageUrl: "/images/truckload-totes.jpg",
    isPalette: true,
    unitsPerPallet: 1,
    unitsForTruckload: 22,
    allowMixing: true,
    locationRestrictions: {
      phoenix: true,
      parker: true,
      vicksburg: false,
    },
  },
];
