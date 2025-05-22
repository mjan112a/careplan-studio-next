import { logger } from '@/lib/logging';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import Layout from '@/app/components/Layout';
import { DashboardContent } from '.';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function Dashboard() {
  try {
    // Get the authenticated user
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      logger.error('Error getting user in dashboard', {
        error: error.message,
        stack: error.stack
      });
      return <div>Error loading dashboard</div>;
    }

    return (
      <Layout user={user}>
        <DashboardContent user={user} />
      </Layout>
    );
  } catch (error) {
    logger.error('Error in dashboard page:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return (
      <Layout user={null}>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error loading dashboard
        </div>
      </Layout>
    );
  }
} 