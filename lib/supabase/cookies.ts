import { CookieOptions } from '@supabase/ssr'

/**
 * Centralized cookie configuration for Supabase authentication
 * Used by both client-side and server-side Supabase instances
 */
export const SUPABASE_COOKIE_OPTIONS: CookieOptions = {
  maxAge: 60 * 60 * 24 * 7, // 7 days
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  httpOnly: true  // Will be overridden by client-side instance
}

/**
 * Get cookie options with httpOnly set based on environment
 * Client-side usage should set httpOnly: false to allow JS access
 */
export function getCookieOptions(isServerSide: boolean = true): CookieOptions {
  return {
    ...SUPABASE_COOKIE_OPTIONS,
    httpOnly: isServerSide
  }
} 