import { storage } from '../lib/firebase';
import { ref, listAll, getDownloadURL } from 'firebase/storage';

// Lists all top-level items in Firebase Storage
export async function listTopLevelItems() {
  try {
    // Get reference to the root
    const rootRef = ref(storage);
    const result = await listAll(rootRef);
    
    console.log("Firebase Storage - Top-level prefixes (folders):");
    result.prefixes.forEach((folderRef) => {
      console.log(`- ${folderRef.name}`);
    });
    
    console.log("Firebase Storage - Top-level items (files):");
    result.items.forEach((itemRef) => {
      console.log(`- ${itemRef.name}`);
    });
    
    return {
      prefixes: result.prefixes.map(p => p.name),
      items: result.items.map(i => i.name)
    };
  } catch (error) {
    console.error("Error listing Firebase Storage contents:", error);
    return { error: error.message };
  }
}

// Lists all items in a specific folder and logs detailed information
export async function exploreFolder(folderPath = '') {
  try {
    const folderRef = ref(storage, folderPath);
    const result = await listAll(folderRef);
    
    console.log(`Exploring folder: ${folderPath || 'root'}`);
    
    // Log all prefixes (subfolders)
    if (result.prefixes.length > 0) {
      console.log(`Subfolders in ${folderPath || 'root'}:`);
      result.prefixes.forEach(subfolder => {
        console.log(`- ${subfolder.name} (full path: ${subfolder.fullPath})`);
      });
    } else {
      console.log(`No subfolders found in ${folderPath || 'root'}`);
    }
    
    // Log all items (files)
    if (result.items.length > 0) {
      console.log(`Files in ${folderPath || 'root'}:`);
      
      // Get details for each file
      const fileDetails = await Promise.all(
        result.items.map(async item => {
          try {
            const url = await getDownloadURL(item);
            return {
              name: item.name,
              fullPath: item.fullPath,
              url
            };
          } catch (err) {
            return {
              name: item.name,
              fullPath: item.fullPath,
              error: err.message
            };
          }
        })
      );
      
      // Log each file's details
      fileDetails.forEach(file => {
        console.log(`- ${file.name}`);
        console.log(`  Path: ${file.fullPath}`);
        if (file.url) {
          console.log(`  URL: ${file.url}`);
        } else if (file.error) {
          console.log(`  Error: ${file.error}`);
        }
      });
      
      return {
        folderPath,
        subfolders: result.prefixes.map(p => ({ name: p.name, fullPath: p.fullPath })),
        files: fileDetails
      };
    } else {
      console.log(`No files found in ${folderPath || 'root'}`);
      return {
        folderPath,
        subfolders: result.prefixes.map(p => ({ name: p.name, fullPath: p.fullPath })),
        files: []
      };
    }
  } catch (error) {
    console.error(`Error exploring folder ${folderPath}:`, error);
    return { error: error.message };
  }
}