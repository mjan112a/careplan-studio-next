import { logger } from '@/lib/logging';
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

  // For client-side usage in production
  if (typeof window !== 'undefined') {
    // Use the current window location
    const clientUrl = window.location.origin;
    logger.debug('Client-side in production, using window.location.origin:', { clientUrl });
    return clientUrl;
  }

  // Log all VERCEL_* environment variables that have values
  const vercelEnvVars: Record<string, string> = {};
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('VERCEL_') && process.env[key]) {
      vercelEnvVars[key] = process.env[key] || '';
    }
  });
  
  logger.debug('VERCEL_* environment variables:', vercelEnvVars);

  // Fallback for server-side rendering or when headers are not available
  const fallbackUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';
  
  logger.debug('Using fallback URL:', { fallbackUrl });
  return fallbackUrl;
}

/**
 * Gets the application URL in a simplified way that works for both client and server side
 * On client side: Uses window.location.origin
 * On server side: Uses Vercel URL environment variables or falls back to APP_URL or localhost
 */
export function getAppURL(): string {
  // For client-side, use the current URL
  if (typeof window !== 'undefined') {
    const url = window.location.origin;
    logger.debug('Client-side, using window.location.origin:', { url });
    return url;
  }
  
  // For server-side rendering, handle different environments
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    const url = `https://${vercelUrl}`;
    logger.debug('Server-side with Vercel URL:', { url });
    return url;
  }
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  logger.debug('Server-side with fallback URL:', { appUrl });
  return appUrl;
} 