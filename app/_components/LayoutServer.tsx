import { ReactNode } from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { CookieOptions } from '@supabase/ssr';
import { logger } from '@/lib/logging';
import LayoutClient from '../components/LayoutClient';

interface LayoutServerProps {
  children: ReactNode;
}

export default async function LayoutServer({ children }: LayoutServerProps) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookie = cookieStore.get(name);
          return cookie?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Note: This is a no-op in Server Components since we can't set cookies directly
          logger.debug('Cookie set attempted in Server Component', { name });
        },
        remove(name: string, options: CookieOptions) {
          // Note: This is a no-op in Server Components since we can't remove cookies directly
          logger.debug('Cookie removal attempted in Server Component', { name });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  logger.info('Layout: Rendering with user state', {
    isAuthenticated: !!user,
    userId: user?.id,
    email: user?.email
  });

  return <LayoutClient user={user}>{children}</LayoutClient>;
} 