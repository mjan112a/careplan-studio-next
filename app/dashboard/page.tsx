import Layout from '@/app/components/Layout';
import { 
  BarChart2, 
  FileText, 
  Upload, 
  Users, 
  ChevronRight, 
  ListChecks,
  FileUp,
  ClipboardCheck,
  FileCheck,
  LayoutDashboard,
  GanttChartSquare,
  Clipboard,
  PieChart
} from 'lucide-react';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logging';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function Dashboard() {
  // Get the authenticated user
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    logger.error('Error getting user in dashboard', {
      error: error.message,
      stack: error.stack
    });
  }

  return (
    <Layout user={user}>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Page title to make it clear what this tab interface is for */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Policy Management Dashboard</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <Tabs defaultValue="prepare" className="w-full">
            <div className="border-b border-gray-200">
              <TabsList className="w-full grid grid-cols-2 p-0 bg-transparent">
                <TabsTrigger 
                  value="prepare" 
                  className="flex items-center justify-center gap-2 py-4 text-base font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:bg-gray-50 transition-all"
                >
                  <Clipboard className="h-5 w-5" />
                  <span>Prepare</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="review" 
                  className="flex items-center justify-center gap-2 py-4 text-base font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:bg-gray-50 transition-all"
                >
                  <PieChart className="h-5 w-5" />
                  <span>Review</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* Prepare Tab Content */}
            <TabsContent value="prepare" className="p-6 space-y-8">
              {/* Client Management */}
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Client Management</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Link href="/clients" className="block">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-blue-500 transition-colors">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-full mr-4">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">View Clients</h3>
                          <p className="text-sm text-gray-500">Manage your client list</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
                      </div>
                    </div>
                  </Link>
                  
                  <Link href="/clients/add" className="block">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-blue-500 transition-colors">
                      <div className="flex items-center">
                        <div className="bg-green-100 p-2 rounded-full mr-4">
                          <Users className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Add New Client</h3>
                          <p className="text-sm text-gray-500">Create a new client record</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
              
              {/* Policy Management */}
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Policy Management</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Link href="/policies/upload" className="block">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-blue-500 transition-colors">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-full mr-4">
                          <FileUp className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Upload Policy</h3>
                          <p className="text-sm text-gray-500">Upload a client policy document</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
                      </div>
                    </div>
                  </Link>
                  
                  <Link href="/policies/process" className="block">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-blue-500 transition-colors">
                      <div className="flex items-center">
                        <div className="bg-purple-100 p-2 rounded-full mr-4">
                          <ClipboardCheck className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Process Documents</h3>
                          <p className="text-sm text-gray-500">Extract data from policies</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
                      </div>
                    </div>
                  </Link>
                  
                  <Link href="/policies/review" className="block">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-blue-500 transition-colors">
                      <div className="flex items-center">
                        <div className="bg-amber-100 p-2 rounded-full mr-4">
                          <FileCheck className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Review Datasets</h3>
                          <p className="text-sm text-gray-500">Review and approve tabular data</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
              
              {/* Stats */}
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <div className="bg-green-100 p-2 rounded-full mr-4">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Policies</p>
                        <p className="text-2xl font-semibold text-gray-900">24</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center">
                      <div className="bg-purple-100 p-2 rounded-full mr-4">
                        <ListChecks className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Approved Datasets</p>
                        <p className="text-2xl font-semibold text-gray-900">12</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="mt-8">
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
                            <p className="text-sm font-medium text-gray-900">New policy uploaded</p>
                            <p className="text-xs text-gray-500">Lincoln Financial LTC Policy</p>
                          </div>
                          <div className="text-xs text-gray-500">2 hours ago</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Review Tab Content */}
            <TabsContent value="review" className="p-6 space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Policy Visualizations</h2>
                <p className="text-sm text-gray-500">Select an approved dataset to view visualizations</p>
              </div>
              
              {/* Dataset selector */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Select a Dataset</h3>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option>Lincoln Financial LTC Policy - Approved on 08/15/2023</option>
                  <option>MetLife Whole Life Policy - Approved on 07/22/2023</option>
                  <option>Prudential Term Life Policy - Approved on 06/30/2023</option>
                </select>
              </div>
              
              {/* Visualizations grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-64">
                  <div className="flex items-center mb-3">
                    <BarChart2 className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="font-medium text-gray-900">Premium Projection</h3>
                  </div>
                  <div className="h-48 flex items-center justify-center bg-gray-50 rounded">
                    <p className="text-gray-500">Visualization will appear here</p>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-64">
                  <div className="flex items-center mb-3">
                    <GanttChartSquare className="h-5 w-5 text-green-600 mr-2" />
                    <h3 className="font-medium text-gray-900">Cash Value Growth</h3>
                  </div>
                  <div className="h-48 flex items-center justify-center bg-gray-50 rounded">
                    <p className="text-gray-500">Visualization will appear here</p>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-64">
                  <div className="flex items-center mb-3">
                    <LayoutDashboard className="h-5 w-5 text-purple-600 mr-2" />
                    <h3 className="font-medium text-gray-900">Policy Summary</h3>
                  </div>
                  <div className="h-48 flex items-center justify-center bg-gray-50 rounded">
                    <p className="text-gray-500">Key metrics will appear here</p>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-64">
                  <div className="flex items-center mb-3">
                    <BarChart2 className="h-5 w-5 text-amber-600 mr-2" />
                    <h3 className="font-medium text-gray-900">Benefits Analysis</h3>
                  </div>
                  <div className="h-48 flex items-center justify-center bg-gray-50 rounded">
                    <p className="text-gray-500">Visualization will appear here</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center mt-8">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                  Generate Detailed Report
                </button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
} 