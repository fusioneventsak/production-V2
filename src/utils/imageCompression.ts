// Client-side image compression utility for PhotoSphere

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  maintainAspectRatio?: boolean;
  outputFormat?: 'image/jpeg' | 'image/webp' | 'image/png';
  preserveTransparency?: boolean; // Automatically detect and preserve transparency
}

export interface CompressionResult {
  blob: Blob;
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
}

/**
 * Compresses an image file using Canvas API
 * Automatically preserves transparency when detected
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1920,          // Max width for high-res displays
    maxHeight = 1080,         // Max height for most use cases
    quality = 0.8,            // 80% quality - good balance
    maintainAspectRatio = true,
    preserveTransparency = true, // Auto-preserve transparency
    outputFormat // Will be auto-detected if not specified
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      try {
        // Calculate new dimensions
        let { width, height } = calculateDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight,
          maintainAspectRatio
        );

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Detect if image has transparency
        const hasTransparency = detectTransparency(file.type) || preserveTransparency;
        
        // Choose optimal format based on transparency
        const finalFormat = outputFormat || (hasTransparency ? 'image/png' : 'image/jpeg');
        
        // For PNG with transparency, don't fill background
        if (finalFormat === 'image/png') {
          // Clear canvas to transparent
          ctx.clearRect(0, 0, width, height);
        }

        // Draw the image
        ctx.drawImage(img, 0, 0, width, height);

        // Adjust quality for PNG (PNG doesn't use quality parameter the same way)
        const finalQuality = finalFormat === 'image/png' ? undefined : quality;

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Create compressed file
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, '') + getFileExtension(finalFormat),
              { type: finalFormat }
            );

            // Calculate compression stats
            const originalSize = file.size;
            const compressedSize = blob.size;
            const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

            console.log(`🖼️ Compressed ${file.name}:`);
            console.log(`   Format: ${finalFormat} (transparency: ${hasTransparency})`);
            console.log(`   Size: ${formatFileSize(originalSize)} → ${formatFileSize(compressedSize)}`);
            console.log(`   Saved: ${compressionRatio.toFixed(1)}%`);

            resolve({
              blob,
              file: compressedFile,
              originalSize,
              compressedSize,
              compressionRatio,
              width,
              height
            });
          },
          finalFormat,
          finalQuality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load the image
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Batch compress multiple images
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];
  
  for (const file of files) {
    try {
      const result = await compressImage(file, options);
      results.push(result);
    } catch (error) {
      console.error(`Failed to compress ${file.name}:`, error);
      // Skip failed files and continue with others
    }
  }
  
  return results;
}

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number,
  maintainAspectRatio: boolean
): { width: number; height: number } {
  if (!maintainAspectRatio) {
    return { width: maxWidth, height: maxHeight };
  }

  const aspectRatio = originalWidth / originalHeight;

  let width = originalWidth;
  let height = originalHeight;

  // Only resize if image is larger than max dimensions
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return {
    width: Math.round(width),
    height: Math.round(height)
  };
}

/**
 * Detect if image format typically supports transparency
 */
function detectTransparency(mimeType: string): boolean {
  return mimeType === 'image/png' || 
         mimeType === 'image/gif' || 
         mimeType === 'image/webp' ||
         mimeType.includes('png') ||
         mimeType.includes('gif');
}

/**
 * Get file extension for output format
 */
function getFileExtension(format: string): string {
  switch (format) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/webp':
      return '.webp';
    case 'image/png':
      return '.png';
    default:
      return '.jpg';
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Predefined compression presets for different use cases
 */
export const COMPRESSION_PRESETS = {
  // High quality, moderate compression - preserves transparency
  high: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.9,
    preserveTransparency: true
    // outputFormat will be auto-detected
  },
  
  // Balanced quality and file size (recommended) - preserves transparency
  balanced: {
    maxWidth: 1280,
    maxHeight: 720,
    quality: 0.8,
    preserveTransparency: true
    // outputFormat will be auto-detected
  },
  
  // Maximum compression - still preserves transparency when needed
  compact: {
    maxWidth: 800,
    maxHeight: 600,
    quality: 0.7,
    preserveTransparency: true
    // outputFormat will be auto-detected
  },
  
  // For mobile/photobooth uploads - preserves transparency
  mobile: {
    maxWidth: 1080,
    maxHeight: 1920,
    quality: 0.8,
    preserveTransparency: true
    // outputFormat will be auto-detected
  },

  // Force JPEG for maximum compression (transparency will be lost)
  forceJpeg: {
    maxWidth: 1280,
    maxHeight: 720,
    quality: 0.8,
    outputFormat: 'image/jpeg' as const,
    preserveTransparency: false
  },

  // Force PNG to always preserve transparency (larger files)
  forcePng: {
    maxWidth: 1920,
    maxHeight: 1080,
    outputFormat: 'image/png' as const,
    preserveTransparency: true
  }
} as const;

/**
 * Auto-select compression preset based on file size
 */
export function getRecommendedPreset(fileSize: number): CompressionOptions {
  const sizeMB = fileSize / (1024 * 1024);
  
  if (sizeMB > 5) {
    return COMPRESSION_PRESETS.compact;
  } else if (sizeMB > 2) {
    return COMPRESSION_PRESETS.balanced;
  } else {
    return COMPRESSION_PRESETS.high;
  }
}