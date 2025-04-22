import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from '@/lib/logging';
import { initializeServer } from '@/lib/server-init';

// Initialize server on first request
let initializationPromise: Promise<void> | null = null;

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

  // Create a Supabase client with the Request and Response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Get session directly without caching
  let session = null;
  try {
    const { data } = await supabase.auth.getSession();
    session = data.session;
  } catch (error) {
    logger.error('Error getting session in middleware:', { error: error instanceof Error ? error.message : String(error) });
  }

  // If user is not signed in and the current path is not /auth/*, /home, or /, redirect to /
  if (!session && 
      !req.nextUrl.pathname.startsWith('/auth') && 
      req.nextUrl.pathname !== '/home' && 
      req.nextUrl.pathname !== '/') {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl);
  }

  // If user is signed in and the current path is /auth/*, redirect to /dashboard
  if (session && req.nextUrl.pathname.startsWith('/auth')) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  // If user is signed in and the current path is / or /home, redirect to /dashboard
  if (session && (req.nextUrl.pathname === '/' || req.nextUrl.pathname === '/home')) {
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