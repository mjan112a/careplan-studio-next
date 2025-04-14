import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';

export async function middleware(req: NextRequest) {
  // Skip authentication for webhook endpoints
  if (req.nextUrl.pathname.startsWith('/api/webhooks/stripe')) {
    logger.debug('Middleware: Webhook request received', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
    });
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession();

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
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 