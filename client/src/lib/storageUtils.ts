import { storage } from './firebase';
import { ref, listAll, getDownloadURL } from 'firebase/storage';

export interface ProductImage {
  name: string;
  url: string;
  path: string;
}

/**
 * Fetches all image URLs from a specific folder in Firebase Storage
 * @param folderPath The path to the folder in Firebase Storage
 * @returns A promise that resolves to an array of product images
 */
export async function fetchImagesFromFolder(folderPath: string = 'organicsoilwholesale.com'): Promise<ProductImage[]> {
  try {
    const folderRef = ref(storage, folderPath);
    const result = await listAll(folderRef);
    
    console.log(`Found ${result.items.length} items in folder: ${folderPath}`);
    
    // Get download URLs for all items
    const imagePromises = result.items.map(async (itemRef) => {
      try {
        const url = await getDownloadURL(itemRef);
        return {
          name: itemRef.name,
          url,
          path: itemRef.fullPath
        };
      } catch (error) {
        console.error(`Error getting download URL for ${itemRef.name}:`, error);
        return null;
      }
    });
    
    // Wait for all promises to resolve and filter out any null results
    const images = (await Promise.all(imagePromises)).filter(Boolean) as ProductImage[];
    
    // Check for subfolders and recursively fetch images from them
    if (result.prefixes.length > 0) {
      for (const prefix of result.prefixes) {
        const subfolderImages = await fetchImagesFromFolder(prefix.fullPath);
        images.push(...subfolderImages);
      }
    }
    
    return images;
  } catch (error) {
    console.error(`Error fetching images from folder ${folderPath}:`, error);
    return [];
  }
}

/**
 * Finds an image URL by matching part of the filename
 * @param images Array of ProductImage objects
 * @param productName Product name to match against image filenames
 * @returns The URL of the matching image or undefined if no match is found
 */
export function findImageForProduct(images: ProductImage[], productName: string): string | undefined {
  const normalizedProductName = productName.toLowerCase().replace(/[^\w]/g, '');
  
  const matchingImage = images.find(image => {
    const imageName = image.name.toLowerCase();
    return imageName.includes(normalizedProductName);
  });
  
  return matchingImage?.url;
}