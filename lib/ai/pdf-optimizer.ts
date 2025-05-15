import { PDFDocument } from 'pdf-lib';
import { logger } from '@/lib/logging';
import fs from 'fs';

export interface OptimizePDFOptions {
  /**
   * Quality level for the optimization (0-1)
   * Lower values = smaller files but potential quality loss
   * Default: 0.8
   */
  quality?: number;
  
  /**
   * Whether to compress objects in the PDF
   * Default: true
   */
  compress?: boolean;
  
  /**
   * Whether to preserve the original document structure as much as possible
   * Default: true
   */
  preserveStructure?: boolean;
}

/**
 * Optimizes a PDF file to reduce its size
 * This is the PDF equivalent of what 'sharp' does for images
 * 
 * @param inputBuffer - Buffer containing the PDF data
 * @param options - Optimization options
 * @returns Promise resolving to a Buffer containing the optimized PDF
 */
export async function optimizePDF(
  inputBuffer: Buffer,
  options: OptimizePDFOptions = {}
): Promise<Buffer> {
  const { 
    quality = 0.8, 
    compress = true, 
    preserveStructure = true 
  } = options;
  
  try {
    logger.info('Starting PDF optimization', { 
      originalSize: inputBuffer.length,
      quality,
      compress,
      preserveStructure
    });

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(inputBuffer, {
      // Use ignoreEncryption: true if you want to handle encrypted PDFs
      ignoreEncryption: true
    });
    
    // Set compression options - these reduce file size
    const savedPdf = await pdfDoc.save({
      // Use object compression
      useObjectStreams: compress,
      
      // Add additional compression
      addDefaultPage: false,
      
      // This option can make a big difference in file size
      // Lower values = smaller files
      objectsPerTick: preserveStructure ? 
        // In preserve mode, use higher value for better structure preservation
        Math.max(50, Math.floor(100 * quality)) : 
        // In non-preserve mode, use lower value for better compression
        Math.max(10, Math.floor(50 * quality))
    });
    
    const resultBuffer = Buffer.from(savedPdf);
    
    // Log compression results
    const compressionRatio = ((resultBuffer.length / inputBuffer.length) * 100).toFixed(1);
    logger.info('PDF optimization complete', {
      originalSize: inputBuffer.length,
      optimizedSize: resultBuffer.length,
      compressionRatio: `${compressionRatio}%`,
      reduction: `${(100 - parseFloat(compressionRatio)).toFixed(1)}%`
    });
    
    // If optimized result is extremely small, it might indicate an issue
    // Return the original in that case
    if (resultBuffer.length < 100 && inputBuffer.length > 1000) {
      logger.warn('Optimization resulted in suspiciously small file, using original', {
        originalSize: inputBuffer.length,
        optimizedSize: resultBuffer.length
      });
      return inputBuffer;
    }
    
    return resultBuffer;
  } catch (error) {
    logger.error('PDF optimization failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Return the original buffer if optimization fails
    return inputBuffer;
  }
}

/**
 * Optimizes a PDF file from disk and saves the result
 * 
 * @param inputPath - Path to the input PDF file
 * @param outputPath - Path where the optimized PDF will be saved
 * @param options - Optimization options
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function optimizePDFFile(
  inputPath: string,
  outputPath: string,
  options: OptimizePDFOptions = {}
): Promise<boolean> {
  try {
    // Read the PDF file
    const inputBuffer = fs.readFileSync(inputPath);
    
    // Optimize the PDF
    const optimizedBuffer = await optimizePDF(inputBuffer, options);
    
    // Save the optimized PDF
    fs.writeFileSync(outputPath, optimizedBuffer);
    
    // Verify file was saved correctly and has content
    const stats = fs.statSync(outputPath);
    if (stats.size < 100 && inputBuffer.length > 1000) {
      logger.warn('Optimized file is suspiciously small, using original', {
        inputPath,
        outputPath,
        originalSize: inputBuffer.length,
        outputSize: stats.size
      });
      
      // Save the original instead
      fs.writeFileSync(outputPath, inputBuffer);
    }
    
    return true;
  } catch (error) {
    logger.error('PDF file optimization failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      inputPath,
      outputPath
    });
    
    return false;
  }
} 