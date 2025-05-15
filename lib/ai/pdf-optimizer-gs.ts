import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '@/lib/logging';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execPromise = promisify(exec);

/**
 * Compression quality presets for Ghostscript
 * These correspond to the Ghostscript PDFSETTINGS parameter
 */
export enum CompressionQuality {
  /**
   * Maximum image quality, larger file size (300 DPI)
   */
  HIGH = 'prepress',
  
  /**
   * Good quality for most purposes, medium file size (150 DPI)
   */
  MEDIUM = 'ebook',
  
  /**
   * Lower quality images, smaller file size (72 DPI)
   */
  LOW = 'screen',
  
  /**
   * Minimal size, may affect quality significantly
   */
  MINIMUM = 'printer'
}

export interface GhostscriptOptimizeOptions {
  /**
   * Compression quality preset
   * @default CompressionQuality.MEDIUM
   */
  quality?: CompressionQuality;
  
  /**
   * Whether to preserve the original metadata
   * @default false
   */
  preserveMetadata?: boolean;
  
  /**
   * Temporary directory to use for processing
   * If not provided, uses the system temp directory
   */
  tempDir?: string;
}

/**
 * Checks if Ghostscript is installed on the system
 * @returns Promise resolving to true if Ghostscript is available
 */
export async function isGhostscriptAvailable(): Promise<boolean> {
  try {
    await execPromise('gs --version');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Optimizes a PDF file using Ghostscript
 * Note: Requires Ghostscript to be installed on the system
 * 
 * @param inputPath Path to the input PDF file
 * @param outputPath Path to save the optimized PDF
 * @param options Optimization options
 * @returns Promise resolving to true if successful
 */
export async function optimizePDFWithGhostscript(
  inputPath: string,
  outputPath: string,
  options: GhostscriptOptimizeOptions = {}
): Promise<boolean> {
  const { 
    quality = CompressionQuality.MEDIUM,
    preserveMetadata = false,
    tempDir = os.tmpdir()
  } = options;

  try {
    // Check if Ghostscript is available
    if (!await isGhostscriptAvailable()) {
      logger.error('Ghostscript is not installed or not available in PATH');
      return false;
    }
    
    // Get file stats for logging
    const inputStats = fs.statSync(inputPath);
    const inputSize = inputStats.size;
    
    logger.info('Starting PDF optimization with Ghostscript', {
      inputPath,
      outputPath,
      inputSize,
      quality
    });

    // Use default parameters for most cases
    let command = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/${quality} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`;
    
    // If preserving metadata, we need a more complex approach
    if (preserveMetadata) {
      const metadataFile = path.join(tempDir, `${path.basename(inputPath, '.pdf')}-metadata.txt`);
      
      // Extract metadata
      await execPromise(`gs -dNOPAUSE -dQUIET -dBATCH -sDEVICE=txtwrite -sOutputFile="${metadataFile}" -dFILTERTEXT "${inputPath}"`);
      
      // Add the metadata preservation parameters
      command = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/${quality} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" -c "[ /Title (${path.basename(inputPath, '.pdf')}) /DOCINFO pdfmark" "${inputPath}"`;
      
      // Clean up metadata file
      fs.unlinkSync(metadataFile);
    }
    
    // Execute Ghostscript command
    await execPromise(command);
    
    // Check results and log
    const outputStats = fs.statSync(outputPath);
    const outputSize = outputStats.size;
    const compressionRatio = ((outputSize / inputSize) * 100).toFixed(1);
    
    logger.info('PDF optimization complete', {
      inputSize,
      outputSize,
      compressionRatio: `${compressionRatio}%`,
      reduction: `${(100 - parseFloat(compressionRatio)).toFixed(1)}%`
    });
    
    return true;
  } catch (error) {
    logger.error('PDF optimization with Ghostscript failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      inputPath,
      outputPath
    });
    
    return false;
  }
}

/**
 * Optimizes a PDF buffer using Ghostscript
 * Note: Requires Ghostscript to be installed on the system
 * 
 * @param pdfBuffer Buffer containing the PDF data
 * @param options Optimization options
 * @returns Promise resolving to the optimized PDF buffer
 */
export async function optimizePDFBufferWithGhostscript(
  pdfBuffer: Buffer,
  options: GhostscriptOptimizeOptions = {}
): Promise<Buffer> {
  const tempDir = options.tempDir || os.tmpdir();
  const tempInputPath = path.join(tempDir, `input-${Date.now()}.pdf`);
  const tempOutputPath = path.join(tempDir, `output-${Date.now()}.pdf`);
  
  try {
    // Write buffer to temporary file
    fs.writeFileSync(tempInputPath, pdfBuffer);
    
    // Optimize the PDF
    const success = await optimizePDFWithGhostscript(tempInputPath, tempOutputPath, options);
    
    if (!success) {
      // Return the original buffer if optimization failed
      return pdfBuffer;
    }
    
    // Read the optimized PDF
    const optimizedBuffer = fs.readFileSync(tempOutputPath);
    
    return optimizedBuffer;
  } catch (error) {
    logger.error('PDF buffer optimization with Ghostscript failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Return the original buffer if optimization fails
    return pdfBuffer;
  } finally {
    // Clean up temporary files
    if (fs.existsSync(tempInputPath)) {
      fs.unlinkSync(tempInputPath);
    }
    if (fs.existsSync(tempOutputPath)) {
      fs.unlinkSync(tempOutputPath);
    }
  }
} 