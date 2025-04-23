import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from '@/lib/logging';
import { getCookieOptions } from '@/lib/supabase/cookies';

export async function middleware(req: NextRequest) {
  logger.info('Middleware request', {
    path: req.nextUrl.pathname,
    host: req.headers.get('host'),
    origin: req.headers.get('origin')
  });

  // Extract project ref from SUPABASE_URL to log the expected cookie name
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/(?:db|api)\.([^.]+)/)?.[1];
  logger.debug('Supabase cookie details', {
    projectRef,
    expectedCookieName: projectRef ? `sb-${projectRef}-auth-token` : undefined
  });

  // Define paths that should bypass authentication
  const PUBLIC_PATHS = [
    '/',         // Root page
    '/home',     // Public home page
    '/api/webhooks/stripe',  // Stripe webhooks (protected by Stripe signature)
    '/api/webhooks/test',    // Test webhooks
    '/auth/signin',  // Sign in page
    '/auth/signup',  // Sign up page
    '/auth/reset-password',  // Password reset page
  ];

  const isPublicPath = PUBLIC_PATHS.some(path => 
    path.endsWith('*') 
      ? req.nextUrl.pathname.startsWith(path.slice(0, -1))  // For paths ending with * do prefix match
      : req.nextUrl.pathname === path                       // For other paths do exact match
  );

  // Create a response object that we can modify
  const res = NextResponse.next();
  const cookieOptions = getCookieOptions(true); // true for server-side

  // Track all cookie operations to see what Supabase is doing
  const cookieOperations: { operation: string; name: string; }[] = [];

  // Create a Supabase client with the Request and Response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = req.cookies.get(name);
          cookieOperations.push({ operation: 'get', name });
          logger.debug('Getting cookie', { 
            name, 
            exists: !!cookie,
            value: process.env.NODE_ENV === 'development' ? cookie?.value : '[redacted]',
            isAuthCookie: name.endsWith('-auth-token')
          });
          return cookie?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieOperations.push({ operation: 'set', name });
          logger.debug('Setting cookie', { 
            name,
            isAuthCookie: name.endsWith('-auth-token'),
            options: { ...options, value: '[redacted]' }
          });
          res.cookies.set({
            name,
            value,
            ...cookieOptions,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          cookieOperations.push({ operation: 'remove', name });
          logger.debug('Removing cookie', { 
            name,
            isAuthCookie: name.endsWith('-auth-token')
          });
          res.cookies.set({
            name,
            value: '',
            ...cookieOptions,
            ...options,
            maxAge: 0
          });
        },
      },
    }
  );

  // Log all cookie operations that occurred during client creation
  logger.debug('Supabase cookie operations during client creation', {
    operations: cookieOperations,
    allCookieNames: Array.from(new Set(cookieOperations.map(op => op.name))),
    authCookieNames: Array.from(new Set(cookieOperations.map(op => op.name).filter(name => name.endsWith('-auth-token'))))
  });

  // Get authenticated user directly from Supabase Auth server
  let user = null;
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    user = authUser;
    logger.debug('Auth state', {
      path: req.nextUrl.pathname,
      isAuthenticated: !!user,
      userId: user?.id,
      isPublicPath
    });
  } catch (error) {
    // Only log actual errors (network issues, malformed tokens etc)
    logger.error('Error getting authenticated user', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      path: req.nextUrl.pathname
    });
    // On actual errors, redirect if not on public path
    if (!isPublicPath) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/auth/signin';
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return res;
  }

  // Log all cookie operations that occurred during the entire middleware execution
  logger.debug('Final Supabase cookie operations', {
    operations: cookieOperations,
    allCookieNames: Array.from(new Set(cookieOperations.map(op => op.name))),
    authCookieNames: Array.from(new Set(cookieOperations.map(op => op.name).filter(name => name.endsWith('-auth-token'))))
  });

  // If not authenticated and not on a public path, redirect to sign in
  if (!user && !isPublicPath) {
    logger.info('Redirecting unauthenticated user to sign in', {
      from: req.nextUrl.pathname,
      isAuthenticated: false
    });
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/auth/signin';
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If authenticated and on auth pages, redirect to dashboard
  if (user && (
    req.nextUrl.pathname === '/' || 
    req.nextUrl.pathname === '/home' ||
    req.nextUrl.pathname.startsWith('/auth/')
  )) {
    logger.info('Redirecting authenticated user to dashboard', {
      from: req.nextUrl.pathname,
      isAuthenticated: true
    });
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