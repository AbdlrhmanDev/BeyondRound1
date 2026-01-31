/**
 * Compresses an image file to reduce upload time
 * @param file - The image file to compress
 * @param maxWidth - Maximum width (default: 1024 for faster compression)
 * @param maxHeight - Maximum height (default: 1024 for faster compression)
 * @param quality - JPEG quality 0-1 (default: 0.75 for faster compression)
 * @returns Compressed Blob
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1024,
  maxHeight: number = 1024,
  quality: number = 0.75
): Promise<File> {
  // Skip compression for small images (< 1MB) to save time
  if (file.size < 1024 * 1024) {
    return file;
  }
  
  // Skip compression for very large images to avoid blocking
  if (file.size > 10 * 1024 * 1024) {
    return file;
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Compression failed'));
              return;
            }
            
            // Create a new File with the same name and type
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            
            resolve(compressedFile);
          },
          file.type,
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses multiple images in parallel
 */
export async function compressImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map(file => compressImage(file)));
}
