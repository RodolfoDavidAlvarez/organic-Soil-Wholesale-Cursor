export type SizeCatalogKey = "pallet-9lb" | "pallet-1cf" | "2-cy" | "2.2-cy-tote" | "bulk-delivery" | "truckload" | "bulk-pickup";

export interface SizeCatalogEntry {
  key: SizeCatalogKey;
  label: string;
  description: string;
  image: string;
}

export const SIZE_CATALOG: SizeCatalogEntry[] = [
  {
    key: "pallet-9lb",
    label: "Pallet of 9 lb Bags",
    description: "144 units (36 cases × 4 bags) • ~1,296 lbs",
    image: "/images/categories/sizes/Size Categories- Pallet of Box.png",
  },
  {
    key: "pallet-1cf",
    label: "Pallet of 1CF Bags",
    description: "50 bags per pallet • ~2,000 lbs",
    image: "/images/categories/sizes/Size Category - pallet of 50 1 CF bags.png",
  },
  {
    key: "2-cy",
    label: "2 Cubic Yard",
    description: "2 cubic yards loose material",
    image: "/images/categories/sizes/CY of Bulk for pick only.png",
  },
  {
    key: "2.2-cy-tote",
    label: "2.2 CY Tote (Supersack)",
    description: "1 tote per pallet • ~2,000 lbs",
    image: "/images/categories/sizes/2.2 CY Tote (supersack).png",
  },
  {
    key: "bulk-delivery",
    label: "Bulk Delivery",
    description: "Delivered loose by the ton or cubic yard",
    image: "/images/categories/sizes/Bulk delivery.png",
  },
  {
    key: "truckload",
    label: "Truckload",
    description: "22-24 tons or 90-110 cubic yards per load",
    image: "/images/categories/sizes/Bulk delivery.png",
  },
  {
    key: "bulk-pickup",
    label: "Bulk Pickup",
    description: "Pick up loose material at our yard",
    image: "/images/categories/sizes/CY of Bulk for pick only.png",
  },
];

export const SIZE_CATALOG_BY_KEY: Record<SizeCatalogKey, SizeCatalogEntry> = SIZE_CATALOG.reduce(
  (accumulator, entry) => {
    accumulator[entry.key] = entry;
    return accumulator;
  },
  {} as Record<SizeCatalogKey, SizeCatalogEntry>
);

export const DEFAULT_SIZE_ORDER: SizeCatalogKey[] = SIZE_CATALOG.map((entry) => entry.key);
