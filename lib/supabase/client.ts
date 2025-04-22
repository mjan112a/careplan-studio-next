import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { logger } from '@/lib/logging';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * Creates a Supabase client for use in client components
 */
export const createComponentClient = () => {
  try {
    return createBrowserClient<Database>(
      supabaseUrl,
      supabaseAnonKey
    );
  } catch (error) {
    logger.error('Failed to create component client', { error });
    throw error;
  }
};

/**
 * Creates a Supabase client for use in server components and API routes
 */
export const createServerClient = () => {
  try {
    return createClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: false
        }
      }
    );
  } catch (error) {
    logger.error('Failed to create server client', { error });
    throw error;
  }
};

/**
 * Creates a Supabase admin client with full access
 * Should only be used in trusted server contexts
 */
export const createAdminClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
  }

  try {
    return createClient<Database>(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  } catch (error) {
    logger.error('Failed to create admin client', { error });
    throw error;
  }
}; 