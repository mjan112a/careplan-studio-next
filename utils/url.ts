import { logger } from '@/lib/logger';
import { ReadonlyHeaders } from 'next/dist/server/web/spec-extension/adapters/headers';

/**
 * Gets the base URL for the application, handling both development and production environments.
 * In development, it uses the NEXT_PUBLIC_APP_URL if available, otherwise defaults to http://localhost:3000
 * In production, it uses the request headers to determine the base URL
 */
export function getBaseUrl(headers?: Headers | ReadonlyHeaders | Promise<ReadonlyHeaders>): string | Promise<string> {
  logger.debug('getBaseUrl called with headers:', { 
    headersPresent: headers ? 'Present' : 'Not present' 
  });
  
  // If headers is a Promise, handle it asynchronously
  if (headers instanceof Promise) {
    return headers.then(resolvedHeaders => {
      return getBaseUrlFromHeaders(resolvedHeaders);
    });
  }
  
  return getBaseUrlFromHeaders(headers);
}

/**
 * Helper function to extract the base URL from headers
 */
function getBaseUrlFromHeaders(headers?: Headers | ReadonlyHeaders): string {
  // In development, use NEXT_PUBLIC_APP_URL if available
  if (process.env.NODE_ENV !== 'production') {
    const devUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    logger.debug('Development environment, using URL:', { devUrl });
    return devUrl;
  }

  // In production, determine the base URL from the request headers
  if (headers) {
    const host = headers.get('host');
    logger.debug('Production environment, host from headers:', { host });
    
    const protocol = process.env.NODE_ENV !== 'production' ? 'http' : 'https';
    const url = `${protocol}://${host}`;
    logger.debug('Production URL constructed:', { url });
    return url;
  }

  // Fallback for server-side rendering or when headers are not available
  const fallbackUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';
  
  logger.debug('Using fallback URL:', { fallbackUrl });
  return fallbackUrl;
} 