'use client';

import { useEffect, useRef, useState } from 'react';
import { logger } from '@/lib/logging';

interface OptimizedPDFViewerProps {
  pdfDataUrl: string;
  mimeType: string;
}

/**
 * Client-side component that handles PDF display by converting data URLs to blob URLs
 * This approach works better with PDFs in iframes than using data URLs directly
 */
export default function OptimizedPDFViewer({ pdfDataUrl, mimeType }: OptimizedPDFViewerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    let objectUrl: string | null = null;
    
    try {
      // Convert data URL to Blob
      const dataUrlParts = pdfDataUrl.split(',');
      const byteString = atob(dataUrlParts[1]);
      const mimeString = dataUrlParts[0].split(':')[1].split(';')[0];
      
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      
      const blob = new Blob([ab], { type: mimeString });
      objectUrl = URL.createObjectURL(blob);
      
      setBlobUrl(objectUrl);
    } catch (error) {
      console.error('Error creating blob URL:', error);
      // Fallback to data URL if blob creation fails
      setBlobUrl(pdfDataUrl);
    }
    
    // Clean up the object URL on unmount
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [pdfDataUrl]);
  
  // Handle iframe load events
  const handleIframeLoad = () => {
    if (iframeRef.current) {
      // Iframe loaded successfully
      logger.info('PDF displayed successfully in iframe');
    }
  };
  
  const handleIframeError = () => {
    logger.error('Failed to load PDF in iframe');
  };
  
  if (!blobUrl) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-gray-500">Loading optimized PDF...</div>
      </div>
    );
  }
  
  return (
    <iframe
      ref={iframeRef}
      src={blobUrl}
      className="w-full h-full"
      title="Optimized PDF"
      onLoad={handleIframeLoad}
      onError={handleIframeError}
    />
  );
} 