import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';
import { initializeServer } from '@/lib/server-init';

// Initialize server on first request
let initializationPromise: Promise<void> | null = null;

// Cache for auth checks to prevent excessive requests
const authCheckCache = new Map<string, { session: any, timestamp: number }>();
const AUTH_CACHE_TTL = 60000; // 1 minute cache

export async function middleware(req: NextRequest) {
  // Initialize server if not already done
  if (!initializationPromise) {
    initializationPromise = initializeServer().catch(error => {
      logger.error('Failed to initialize server', { error });
      // Reset the promise so we can try again on next request
      initializationPromise = null;
      throw error;
    });
  }

  // Wait for initialization to complete
  try {
    await initializationPromise;
  } catch (error) {
    // Log error but continue with request
    logger.error('Server initialization failed', { error });
  }

  // Skip authentication for webhook endpoints and static assets
  if (req.nextUrl.pathname.startsWith('/api/webhooks/stripe') || 
      req.nextUrl.pathname.startsWith('/_next') ||
      req.nextUrl.pathname.startsWith('/static') ||
      req.nextUrl.pathname.startsWith('/favicon.ico') ||
      req.nextUrl.pathname.startsWith('/public')) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Check if we have a cached auth result for this request
  const cacheKey = req.cookies.get('sb-access-token')?.value || 'no-token';
  const cachedAuth = authCheckCache.get(cacheKey);
  const now = Date.now();
  
  let session = null;
  
  // Use cached auth if available and not expired
  if (cachedAuth && (now - cachedAuth.timestamp < AUTH_CACHE_TTL)) {
    session = cachedAuth.session;
  } else {
    // Get fresh session
    try {
      const { data } = await supabase.auth.getSession();
      session = data.session;
      
      // Update cache
      authCheckCache.set(cacheKey, { session, timestamp: now });
      
      // Clean up old cache entries
      const entriesToDelete: string[] = [];
      authCheckCache.forEach((value, key) => {
        if (now - value.timestamp > AUTH_CACHE_TTL) {
          entriesToDelete.push(key);
        }
      });
      
      entriesToDelete.forEach(key => {
        authCheckCache.delete(key);
      });
    } catch (error) {
      logger.error('Error getting session in middleware:', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  // If user is not signed in and the current path is not /auth/*, /home, or /, redirect to /auth/signin
  if (!session && 
      !req.nextUrl.pathname.startsWith('/auth') && 
      req.nextUrl.pathname !== '/home' && 
      req.nextUrl.pathname !== '/') {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/auth/signin';
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is signed in and the current path is /auth/*, redirect to /dashboard
  if (session && req.nextUrl.pathname.startsWith('/auth')) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

// Specify which routes should be processed by this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - apple-touch-icon (iOS icons)
     * - site.webmanifest (PWA manifest)
     * - robots.txt
     * - placeholder.svg (placeholder image)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|apple-touch-icon|site.webmanifest|robots.txt|placeholder.svg).*)',
  ],
}; 