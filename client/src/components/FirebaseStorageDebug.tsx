import { useEffect, useState } from 'react';
import { storage } from '@/lib/firebase';
import { ref, listAll, getDownloadURL } from 'firebase/storage';

export default function FirebaseStorageDebug() {
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<{name: string, url: string}[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkFirebaseStorage() {
      try {
        setLoading(true);
        setError(null);
        
        // Reference to the storage bucket
        const storageRef = ref(storage, 'organicsoilwholesale.com');
        
        // List all items in the bucket
        const result = await listAll(storageRef);
        console.log('Firebase Storage items:', result.items.map(item => item.name));
        
        // Get download URLs
        const imagePromises = result.items.map(async (item) => {
          try {
            const url = await getDownloadURL(item);
            return { name: item.name, url };
          } catch (e) {
            console.error(`Error getting URL for ${item.name}:`, e);
            return null;
          }
        });
        
        const imageResults = await Promise.all(imagePromises);
        const validImages = imageResults.filter(Boolean) as {name: string, url: string}[];
        setImages(validImages);
      } catch (e) {
        console.error('Firebase Storage Debug Error:', e);
        setError(e instanceof Error ? e.message : 'Unknown error accessing Firebase Storage');
      } finally {
        setLoading(false);
      }
    }
    
    checkFirebaseStorage();
  }, []);

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 my-4">
      <h2 className="text-xl font-semibold mb-4">Firebase Storage Debug</h2>
      
      {loading && <p>Loading images from Firebase Storage...</p>}
      
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md mb-4">
          <p className="font-medium">Error accessing Firebase Storage:</p>
          <p>{error}</p>
        </div>
      )}
      
      {!loading && !error && (
        <>
          <p className="mb-2">Found {images.length} images in Firebase Storage</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div key={index} className="border rounded-md p-2">
                <p className="text-sm mb-2 truncate">{image.name}</p>
                <img 
                  src={image.url} 
                  alt={image.name} 
                  className="w-full h-40 object-cover rounded"
                  onError={(e) => {
                    console.error(`Failed to load image: ${image.name}`);
                    e.currentTarget.src = "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80";
                  }}
                />
              </div>
            ))}
          </div>
          
          {images.length === 0 && (
            <p className="text-amber-600">No images found in Firebase Storage.</p>
          )}
        </>
      )}
    </div>
  );
}