'use client';

import { useEffect, useRef, useState } from 'react';
import { logDebug, logInfo, logWarn, logError } from '@/lib/logging';

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
      
      logDebug('Created blob URL for PDF', { mimeType: mimeString });
      setBlobUrl(objectUrl);
    } catch (error) {
      logError('Error creating blob URL', error, { component: 'OptimizedPDFViewer' });
      // Fallback to data URL if blob creation fails
      logWarn('Falling back to data URL for PDF display', { mimeType });
      setBlobUrl(pdfDataUrl);
    }
    
    // Clean up the object URL on unmount
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [pdfDataUrl, mimeType]);
  
  // Handle iframe load events
  const handleIframeLoad = () => {
    if (iframeRef.current) {
      // Iframe loaded successfully
      logInfo('PDF displayed successfully in iframe');
    }
  };
  
  const handleIframeError = () => {
    logError('Failed to load PDF in iframe', new Error('Iframe loading error'));
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