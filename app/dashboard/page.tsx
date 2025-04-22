'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/utils/supabase';
import { User } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { getSession, recoverFromAuthError } from '@/utils/auth-state';
import { AuthError, AuthErrorCodes } from '@/types/auth-errors';
import { Button } from '@/components/ui/button';
import { 
  BarChart2, 
  FileText, 
  Settings, 
  Upload, 
  Users, 
  LogOut,
  Plus,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { logger } from '@/lib/logging';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Add a small delay to ensure auth state has propagated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get session first to ensure we have valid auth state
        logger.info('Dashboard: Loading session');
        const session = await getSession();
        logger.info('Dashboard: Session state', { 
          hasSession: !!session,
          userId: session?.user?.id
        });
        
        if (!session?.user) {
          logger.warn('Dashboard: No session found, redirecting to root');
          router.push('/');
          return;
        }
        setUser(session.user);

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          throw new AuthError(
            'Failed to fetch profile',
            AuthErrorCodes.SESSION_ERROR,
            profileError
          );
        }
        setProfile(profile);
      } catch (error) {
        logger.error('Dashboard load failed', { error, context: 'Dashboard-loadDashboard' });
        
        if (error instanceof AuthError) {
          if (error.code === AuthErrorCodes.REFRESH_TOKEN_ERROR) {
            // Try to recover the session
            try {
              await recoverFromAuthError();
              // If recovery successful, reload the dashboard
              loadDashboard();
              return;
            } catch (recoveryError) {
              // If recovery fails, redirect to root
              router.push('/');
              return;
            }
          }
        }
        
        // For other errors, redirect to root
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
              {profile && (
                <p className="text-gray-600 mt-1">Welcome, {profile.full_name || user?.email}</p>
              )}
            </div>
            <Button variant="outline" onClick={handleSignOut} className="flex items-center">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 px-4 sm:px-0">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/simulator" className="block">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-blue-500 transition-colors">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-full mr-4">
                    <Upload className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">New Simulation</h3>
                    <p className="text-sm text-gray-500">Upload a policy illustration</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
                </div>
              </div>
            </Link>
            
            <Link href="/simulator/recent" className="block">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-blue-500 transition-colors">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-full mr-4">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Recent Simulations</h3>
                    <p className="text-sm text-gray-500">View your recent work</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
                </div>
              </div>
            </Link>
            
            <Link href="/clients" className="block">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-blue-500 transition-colors">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-full mr-4">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Client Management</h3>
                    <p className="text-sm text-gray-500">Manage your clients</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 px-4 sm:px-0">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Your Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-full mr-4">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Simulations</p>
                  <p className="text-2xl font-semibold text-gray-900">24</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-full mr-4">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Clients</p>
                  <p className="text-2xl font-semibold text-gray-900">8</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="bg-purple-100 p-2 rounded-full mr-4">
                  <BarChart2 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Conversion Rate</p>
                  <p className="text-2xl font-semibold text-gray-900">68%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 px-4 sm:px-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
            <Link href="/activity" className="text-sm text-blue-600 hover:text-blue-800">
              View All
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {[1, 2, 3].map((item) => (
                <div key={item} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-full mr-4">
                      <Upload className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">New simulation created</p>
                      <p className="text-xs text-gray-500">Lincoln Financial LTC Policy</p>
                    </div>
                    <div className="text-xs text-gray-500">2 hours ago</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="mt-8 px-4 sm:px-0">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Account Settings</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 hover:bg-gray-50 flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-gray-100 p-2 rounded-full mr-4">
                  <Settings className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Profile Settings</p>
                  <p className="text-xs text-gray-500">Update your personal information</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
            <div className="p-4 hover:bg-gray-50 flex items-center justify-between border-t border-gray-200">
              <div className="flex items-center">
                <div className="bg-gray-100 p-2 rounded-full mr-4">
                  <Users className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Team Management</p>
                  <p className="text-xs text-gray-500">Manage team members and permissions</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 