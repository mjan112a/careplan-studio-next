import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import Layout from '@/app/components/Layout';
import ProfileForm from './ProfileForm';
import { logger } from '@/lib/logging';

export default async function ProfilePage() {
  const cookieStore = cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string) {
          logger.debug('Cookie set attempted in Server Component', { name });
        },
        remove(name: string) {
          logger.debug('Cookie removal attempted in Server Component', { name });
        },
      },
    }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    logger.error('Error fetching user', { error: userError });
    throw userError;
  }

  if (!user) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    logger.error('Error fetching profile', { error: profileError });
    throw profileError;
  }

  return (
    <Layout user={user}>
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-8">Profile Settings</h1>
        <ProfileForm user={user} initialProfile={profile} />
      </div>
    </Layout>
  );
} 