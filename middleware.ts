import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { logger } from '@/lib/logging';
import { getCookieOptions } from '@/lib/supabase/cookies';
import { PUBLIC_PATHS, ROUTES } from '@/lib/constants/routes';

export const runtime = 'nodejs';

// Add type for session user with aal
interface SessionUser extends User {
  aal?: string;
}

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
  const isPublicPath = PUBLIC_PATHS.some(path => 
    path.endsWith('*') 
      ? req.nextUrl.pathname.startsWith(path.slice(0, -1))
      : req.nextUrl.pathname === path
  );

  // Create a response object that we can modify
  const res = NextResponse.next();
  const cookieOptions = getCookieOptions(true);

  // Create a Supabase client with the Request and Response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = req.cookies.get(name);
          if (!!cookie) {
            logger.debug('Found cookie', { 
              name, 
              exists: !!cookie,
              value: process.env.NODE_ENV === 'development' ? cookie?.value : '[redacted]',
              isAuthCookie: name.endsWith('-auth-token')
            });
          }
          return cookie?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
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

  // Get authenticated user and session
  let user = null;
  try {
    const { data: { user: authUser }, error } = await supabase.auth.getUser();
    const { data: { session } } = await supabase.auth.getSession();
    
    logger.debug('Auth state', { 
      userId: authUser?.id, 
      email: authUser?.email,
      error,
      hasSession: !!session
    });

    // Check if this is a password reset flow
    const isPasswordReset = req.nextUrl.pathname === ROUTES.AUTH.UPDATE_PASSWORD && 
      (req.nextUrl.searchParams.has('token') || 
       req.nextUrl.searchParams.has('type') || 
       (session?.user as SessionUser)?.aal === 'aal1' || // Type cast to include aal
       req.nextUrl.searchParams.has('next'));

    if (isPasswordReset) {
      logger.debug('Password reset flow detected', {
        hasToken: req.nextUrl.searchParams.has('token'),
        type: req.nextUrl.searchParams.get('type'),
        aal: (session?.user as SessionUser)?.aal,
        next: req.nextUrl.searchParams.get('next')
      });
      return res;
    }

    // If there's an auth error or no user, and we're not on a public path, redirect to sign in
    if ((error || !authUser) && !isPublicPath) {
      logger.info('Auth check failed, redirecting to sign in', {
        error: error?.message || 'No user found',
        from: req.nextUrl.pathname,
        isPublicPath
      });
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = ROUTES.AUTH.SIGN_IN;
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
    
    user = authUser;

    // If authenticated and on auth pages (except during password reset), redirect to dashboard
    if (user && (
      req.nextUrl.pathname === ROUTES.HOME || 
      req.nextUrl.pathname === '/home' ||
      (req.nextUrl.pathname.startsWith('/auth/') && !isPasswordReset)
    )) {
      logger.info('Redirecting authenticated user to dashboard', {
        from: req.nextUrl.pathname,
        isAuthenticated: true
      });
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = ROUTES.DASHBOARD;
      return NextResponse.redirect(redirectUrl);
    }

    // Check if authenticated user has subscription
    if (user) {
      try {
        // Define paths that should bypass subscription check
        const SUBSCRIPTION_BYPASS_PATHS = [
          '/subscribe',
          '/api/subscribe',
          '/api/webhooks/stripe',
          '/auth/update-password',  // Allow password reset without subscription
          '/auth/reset-password',   // Allow password reset request without subscription
          '/api/policy-documents'  // Allow document access for subscription page
        ];

        const bypassSubscriptionCheck = SUBSCRIPTION_BYPASS_PATHS.some(path => 
          req.nextUrl.pathname.startsWith(path)
        );

        // Only check subscription if not on exempt paths
        if (!bypassSubscriptionCheck) {
          // Query the user's profile to check subscription status
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('subscription_level')
            .eq('id', user.id)
            .single();

          logger.debug('Subscription check', {
            userId: user.id,
            subscriptionLevel: profile?.subscription_level,
            path: req.nextUrl.pathname
          });

          if (profileError) {
            logger.error('Error fetching profile for subscription check', {
              error: profileError.message,
              userId: user.id
            });
          }

          // Redirect to subscribe page if subscription_level is null or empty
          if (!profile?.subscription_level) {
            logger.info('Redirecting non-subscribed user to subscription page', {
              from: req.nextUrl.pathname,
              userId: user.id
            });
            const redirectUrl = req.nextUrl.clone();
            redirectUrl.pathname = '/subscribe';
            return NextResponse.redirect(redirectUrl);
          }
        }
      } catch (error) {
        logger.error('Error during subscription check', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          userId: user.id,
          path: req.nextUrl.pathname
        });
      }
    }

    return res;
  } catch (error) {
    // Only log actual errors (network issues etc)
    logger.error('Error getting authenticated user', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      path: req.nextUrl.pathname
    });
    // On actual errors, redirect if not on public path
    if (!isPublicPath) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = ROUTES.AUTH.SIGN_IN;
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return res;
  }
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