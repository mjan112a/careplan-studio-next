/**
 * Application Routes
 */

export const ROUTES = {
  // Auth Routes
  AUTH: {
    SIGN_IN: '/auth/sign-in',
    SIGN_UP: '/auth/sign-up',
    RESET_PASSWORD: '/auth/reset-password',
    UPDATE_PASSWORD: '/auth/update-password',
  },

  // Main Routes
  HOME: '/',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SUBSCRIBE: '/subscribe',
  CONTACT: '/contact',
  DEBUG: '/debug',
  SIMULATOR: '/simulator',

  // Profile Sub-routes
  PROFILE_ROUTES: {
    INVOICES: '/profile/invoices',
  },

  // API Routes
  API: {
    SUBSCRIBE: '/api/subscribe',
    WEBHOOKS: {
      STRIPE: '/api/webhooks/stripe',
    },
  },
} as const;

// Public paths that don't require authentication
export const PUBLIC_PATHS = [
  ROUTES.HOME,
  ROUTES.AUTH.SIGN_IN,
  ROUTES.AUTH.SIGN_UP,
  ROUTES.AUTH.RESET_PASSWORD,
  ROUTES.AUTH.UPDATE_PASSWORD,
  ROUTES.API.WEBHOOKS.STRIPE,
] as const; 