import { useState, useEffect } from 'react';
import { fetchImagesFromFolder, ProductImage, findImageForProduct } from '@/lib/storageUtils';

/**
 * Custom hook to fetch product images from Firebase Storage
 * @param folderPath The path to the folder in Firebase Storage
 * @returns An object containing the images, loading state, and error state
 */
export function useProductImages(folderPath: string = 'organicsoilwholesale.com') {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadImages() {
      try {
        setLoading(true);
        const fetchedImages = await fetchImagesFromFolder(folderPath);
        setImages(fetchedImages);
        console.log('Fetched images:', fetchedImages);
      } catch (err) {
        console.error('Error in useProductImages:', err);
        setError(err instanceof Error ? err : new Error('Unknown error fetching product images'));
      } finally {
        setLoading(false);
      }
    }

    loadImages();
  }, [folderPath]);

  return { images, loading, error };
}

/**
 * Takes a product and tries to find a matching image from Firebase Storage
 * @param productName Name of the product
 * @param images Array of ProductImage objects
 * @param fallbackUrl Fallback URL to use if no matching image is found
 * @returns The URL of the matching image or the fallback URL
 */
export function getProductImageUrl(
  productName: string, 
  images: ProductImage[], 
  fallbackUrl: string
): string {
  if (!images || images.length === 0) {
    return fallbackUrl;
  }
  
  const imageUrl = findImageForProduct(images, productName);
  return imageUrl || fallbackUrl;
}