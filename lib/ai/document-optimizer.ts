import { logger } from '@/lib/logging';
import { optimizePDF } from './pdf-optimizer';
import { isGhostscriptAvailable, optimizePDFBufferWithGhostscript, CompressionQuality } from './pdf-optimizer-gs';
import sharp from 'sharp';

/**
 * Options for document optimization
 */
export interface DocumentOptimizeOptions {
  /**
   * Quality level for the optimization (0-1)
   * Lower values = smaller files but potential quality loss
   * Default: 0.7
   */
  quality?: number;
  
  /**
   * Maximum width in pixels (for images only)
   * Images larger than this will be resized
   * Default: 2000
   */
  maxWidth?: number;
  
  /**
   * Maximum height in pixels (for images only)
   * Images larger than this will be resized
   * Default: 2000
   */
  maxHeight?: number;
  
  /**
   * Force output format (for images only)
   * 'jpg', 'png', etc.
   */
  format?: string;
  
  /**
   * Whether to use Ghostscript for PDFs if available
   * Provides better compression than pdf-lib but requires
   * Ghostscript to be installed on the system
   * Default: true
   */
  useGhostscriptIfAvailable?: boolean;
}

/**
 * Optimizes a document (PDF or image) to reduce file size
 * For PDFs: Uses pdf-lib or Ghostscript depending on availability
 * For images: Uses sharp for resizing and compression
 * 
 * @param buffer Input document as Buffer
 * @param mimeType MIME type of the document
 * @param options Optimization options
 * @returns Optimized document as Buffer
 */
export async function optimizeDocument(
  buffer: Buffer,
  mimeType: string,
  options: DocumentOptimizeOptions = {}
): Promise<Buffer> {
  const {
    quality = 0.7,
    maxWidth = 2000,
    maxHeight = 2000,
    format,
    useGhostscriptIfAvailable = true
  } = options;
  
  logger.info('Starting document optimization', {
    mimeType,
    inputSize: buffer.length,
    quality
  });

  try {
    // Handle PDF documents
    if (mimeType === 'application/pdf') {
      let optimizedBuffer: Buffer;
      
      // Try to use Ghostscript if available and enabled
      if (useGhostscriptIfAvailable && await isGhostscriptAvailable()) {
        // Map quality (0-1) to Ghostscript quality presets
        let gsQuality: CompressionQuality;
        if (quality >= 0.8) {
          gsQuality = CompressionQuality.HIGH;
        } else if (quality >= 0.6) {
          gsQuality = CompressionQuality.MEDIUM;
        } else if (quality >= 0.4) {
          gsQuality = CompressionQuality.LOW;
        } else {
          gsQuality = CompressionQuality.MINIMUM;
        }
        
        // Optimize with Ghostscript
        logger.info('Using Ghostscript for PDF optimization', { quality, gsQuality });
        optimizedBuffer = await optimizePDFBufferWithGhostscript(buffer, {
          quality: gsQuality
        });
      } else {
        // Fall back to pdf-lib
        logger.info('Using pdf-lib for PDF optimization', { quality });
        optimizedBuffer = await optimizePDF(buffer, {
          quality,
          compress: true
        });
      }
      
      return optimizedBuffer;
    }
    
    // Handle image documents
    if (mimeType.startsWith('image/')) {
      let imageProcessor = sharp(buffer);
      const metadata = await imageProcessor.metadata();
      
      // Resize if needed (maintaining aspect ratio)
      if (metadata.width && metadata.height) {
        if (metadata.width > maxWidth || metadata.height > maxHeight) {
          logger.info('Resizing image', {
            originalWidth: metadata.width,
            originalHeight: metadata.height,
            maxWidth,
            maxHeight
          });
          
          imageProcessor = imageProcessor.resize({
            width: maxWidth,
            height: maxHeight,
            fit: 'inside',
            withoutEnlargement: true
          });
        }
      }
      
      // Convert format if specified
      if (format) {
        imageProcessor = imageProcessor.toFormat(format as any, { quality: Math.floor(quality * 100) });
      } 
      // Otherwise keep original format but optimize
      else if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
        imageProcessor = imageProcessor.jpeg({ quality: Math.floor(quality * 100) });
      } else if (metadata.format === 'png') {
        imageProcessor = imageProcessor.png({ quality: Math.floor(quality * 100) });
      } else if (metadata.format === 'webp') {
        imageProcessor = imageProcessor.webp({ quality: Math.floor(quality * 100) });
      }
      
      // Process the image
      const optimizedBuffer = await imageProcessor.toBuffer();
      
      // Log results
      const compressionRatio = ((optimizedBuffer.length / buffer.length) * 100).toFixed(1);
      logger.info('Image optimization complete', {
        format: format || metadata.format,
        originalSize: buffer.length,
        optimizedSize: optimizedBuffer.length,
        compressionRatio: `${compressionRatio}%`,
        reduction: `${(100 - parseFloat(compressionRatio)).toFixed(1)}%`
      });
      
      return optimizedBuffer;
    }
    
    // If not a PDF or image, return the original buffer
    logger.info('Unsupported document type, skipping optimization', { mimeType });
    return buffer;
  } catch (error) {
    logger.error('Document optimization failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      mimeType
    });
    
    // Return the original buffer if optimization fails
    return buffer;
  }
} 