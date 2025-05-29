import React, { useEffect, useState } from 'react';
import { storage } from './lib/firebase';
import { ref, listAll, getDownloadURL } from 'firebase/storage';

interface FileItem {
  name: string;
  path: string;
  url: string;
}

const TestFirebase: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function exploreStorage() {
      try {
        setLoading(true);
        setError(null);
        
        // Get reference to root
        const rootRef = ref(storage);
        console.log('Storage bucket:', storage.app.options.storageBucket);
        
        // List all items
        const result = await listAll(rootRef);
        
        console.log('Found prefixes (folders):', result.prefixes.map(p => p.name));
        console.log('Found items (files):', result.items.map(i => i.name));
        
        // Get download URLs for all files
        const filePromises = result.items.map(async (item) => {
          try {
            const url = await getDownloadURL(item);
            return {
              name: item.name,
              path: item.fullPath,
              url
            };
          } catch (err) {
            console.error(`Error getting URL for ${item.name}:`, err);
            return {
              name: item.name,
              path: item.fullPath,
              url: ''
            };
          }
        });
        
        const fileResults = await Promise.all(filePromises);
        setFiles(fileResults);
      } catch (err) {
        console.error('Error exploring Firebase Storage:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    
    exploreStorage();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Firebase Storage Explorer</h1>
      
      {loading && <p className="text-blue-500">Loading...</p>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {files.length > 0 ? (
        <div>
          <h2 className="text-xl font-semibold mb-2">Files ({files.length})</h2>
          <ul className="space-y-4">
            {files.map((file, index) => (
              <li key={index} className="border p-4 rounded">
                <p><strong>Name:</strong> {file.name}</p>
                <p><strong>Path:</strong> {file.path}</p>
                <p><strong>URL:</strong> {file.url}</p>
                {file.url && (
                  <div className="mt-2">
                    <p><strong>Preview:</strong></p>
                    <img 
                      src={file.url} 
                      alt={file.name} 
                      className="h-40 object-contain border mt-1"
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : !loading && (
        <p>No files found in root directory.</p>
      )}
      
      <h2 className="text-xl font-semibold mt-8 mb-2">Try alternative paths</h2>
      <div className="space-y-2">
        <button 
          onClick={async () => {
            try {
              const altRef = ref(storage, 'organicsoilwholesale.com');
              const result = await listAll(altRef);
              console.log('organicsoilwholesale.com contents:', {
                prefixes: result.prefixes.map(p => p.name),
                items: result.items.map(i => i.name)
              });
            } catch (err) {
              console.error('Error checking organicsoilwholesale.com path:', err);
            }
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Check "organicsoilwholesale.com" folder
        </button>
        
        <button 
          onClick={async () => {
            try {
              const altRef = ref(storage, 'products');
              const result = await listAll(altRef);
              console.log('products contents:', {
                prefixes: result.prefixes.map(p => p.name),
                items: result.items.map(i => i.name)
              });
            } catch (err) {
              console.error('Error checking products path:', err);
            }
          }}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Check "products" folder
        </button>
      </div>
    </div>
  );
};

export default TestFirebase;