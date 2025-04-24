import { createServerSupabaseClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logging';
import Layout from '@/app/components/Layout';
import PromptsContent from './PromptsContent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function PromptsPage() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      logger.error('No user found in authenticated session');
      return <div>Error: Not authenticated</div>
    }

    return (
      <Layout user={user}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-4">Prompts</h1>
          <PromptsContent userId={user.id} userEmail={user.email} />
        </div>
      </Layout>
    );
  } catch (error) {
    logger.error('Error in prompts page:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error loading prompts
        </div>
      </div>
    );
  }
} 