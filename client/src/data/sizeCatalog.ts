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
    label: "Pallet of 9 lb bags",
    description: "144 units (36 cases of 4 units)",
    image: "/images/categories/sizes/Size Categories- Pallet of Box.png",
  },
  {
    key: "pallet-1cf",
    label: "Pallet of 1CF bags",
    description: "50 bags (1CF each)",
    image: "/images/categories/sizes/Size Category - pallet of 50 1 CF bags.png",
  },
  {
    key: "2-cy",
    label: "2 Cubic Yard",
    description: "2 cubic yards",
    image: "/images/categories/sizes/Size Categories- Pallet of Box.png",
  },
  {
    key: "2.2-cy-tote",
    label: "2.2 Cubic Yard Tote",
    description: "2.2 cubic yard tote",
    image: "/images/categories/sizes/2.2 CY Tote (supersack).png",
  },
  {
    key: "bulk-delivery",
    label: "Bulk Delivery",
    description: "Delivery involved",
    image: "/images/categories/sizes/Bulk delivery.png",
  },
  {
    key: "truckload",
    label: "Truckload",
    description: "22-24 tons (soil amendments and concentrates) / 90-110 CYs (potting soil and mulch)",
    image: "/images/categories/sizes/Bulk delivery.png",
  },
  {
    key: "bulk-pickup",
    label: "Bulk Pickup",
    description: "Cubic yards (Dairy compost only)",
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
