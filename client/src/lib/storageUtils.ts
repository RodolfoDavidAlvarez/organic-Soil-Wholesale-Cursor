import { getDownloadURL, listAll, ref } from "firebase/storage";
import { storage } from "@/lib/firebase";

export type ProductImage = {
  name: string;
  url: string;
};

export async function fetchImagesFromFolder(folderPath: string): Promise<ProductImage[]> {
  const folderRef = ref(storage, folderPath);
  const result = await listAll(folderRef);

  return Promise.all(
    result.items.map(async (item) => ({
      name: item.name,
      url: await getDownloadURL(item),
    }))
  );
}

export function findImageForProduct(images: ProductImage[], productName: string): string | undefined {
  const normalizedProduct = productName.toLowerCase().replace(/[^a-z0-9]/g, "");
  return images.find((image) => image.name.toLowerCase().replace(/[^a-z0-9]/g, "").includes(normalizedProduct))?.url;
}
