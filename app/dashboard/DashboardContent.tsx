'use client';

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
  PieChart,
  ChevronDown,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientList, Client } from '@/components/ClientList';
import { NewClientForm } from '@/components/NewClientForm';

interface DashboardContentProps {
  user: User | null;
}

export default function DashboardContent({ user }: DashboardContentProps) {
  // State to track current selections
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState('No policy selected');
  const [selectedDataset, setSelectedDataset] = useState('No dataset selected');
  
  // Fetch clients
  const refreshClients = async () => {
    setLoadingClients(true);
    setClientsError(null);
    try {
      const res = await fetch('/api/clients');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch clients');
      }
      const data = await res.json();
      setClients(data.clients);
    } catch (err) {
      setClientsError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    refreshClients();
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page title */}
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
          <TabsContent value="prepare" className="p-6 space-y-6">
            <div className="space-y-6">
              {/* Client Management Section */}
              <Accordion type="single" collapsible className="w-full border rounded-lg">
                <AccordionItem value="client-management" className="border-none">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline bg-gray-50 hover:bg-gray-100 rounded-t-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <div className="flex-1 text-left">
                        <h2 className="text-lg font-medium text-gray-900">Client Management</h2>
                        <p className="text-sm text-gray-500">
                          Current: {selectedClient ? selectedClient.name : 'No client selected'}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-4 pb-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Your Clients</h3>
                        <ClientList
                          clients={clients}
                          loading={loadingClients}
                          error={clientsError}
                          currentClientId={selectedClient?.id}
                          onSelect={client => setSelectedClient(client)}
                          onDelete={client => {
                            refreshClients();
                            if (selectedClient && selectedClient.id === client.id) {
                              setSelectedClient(null);
                            }
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Add New Client</h3>
                        <NewClientForm
                          onCreated={client => {
                            setSelectedClient(client);
                            refreshClients();
                          }}
                          disabled={loadingClients}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              {/* Policy Management Section */}
              <Accordion type="single" collapsible className="w-full border rounded-lg">
                <AccordionItem value="policy-management" className="border-none">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline bg-gray-50 hover:bg-gray-100 rounded-t-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div className="flex-1 text-left">
                        <h2 className="text-lg font-medium text-gray-900">Policy Management</h2>
                        <p className="text-sm text-gray-500">Current: {selectedPolicy}</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-4 pb-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <button 
                        onClick={() => setSelectedPolicy('Upload Policy')}
                        className="block w-full text-left"
                      >
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
                      </button>
                      
                      <button 
                        onClick={() => setSelectedPolicy('Process Documents')}
                        className="block w-full text-left"
                      >
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
                      </button>
                      
                      <button 
                        onClick={() => setSelectedPolicy('Review Datasets')}
                        className="block w-full text-left"
                      >
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
                      </button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              {/* Overview Stats Section */}
              <Accordion type="single" collapsible className="w-full border rounded-lg">
                <AccordionItem value="overview" className="border-none">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline bg-gray-50 hover:bg-gray-100 rounded-t-lg">
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="h-5 w-5 text-blue-600" />
                      <div className="flex-1 text-left">
                        <h2 className="text-lg font-medium text-gray-900">Overview</h2>
                        <p className="text-sm text-gray-500">Summary statistics and metrics</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-4 pb-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              {/* Recent Activity Section */}
              <Accordion type="single" collapsible className="w-full border rounded-lg">
                <AccordionItem value="activity" className="border-none">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline bg-gray-50 hover:bg-gray-100 rounded-t-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <div className="flex-1 text-left">
                        <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
                        <p className="text-sm text-gray-500">Latest actions and updates</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-4 pb-2">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-medium text-gray-900">Last 24 hours</h3>
                      <Link href="/activity" className="text-sm text-blue-600 hover:text-blue-800">
                        View All
                      </Link>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-4">
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
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>
          
          {/* Review Tab Content */}
          <TabsContent value="review" className="p-6 space-y-6">
            {/* Visualizations Section */}
            <Accordion type="single" collapsible defaultValue="visualizations" className="w-full border rounded-lg">
              <AccordionItem value="visualizations" className="border-none">
                <AccordionTrigger className="px-4 py-3 hover:no-underline bg-gray-50 hover:bg-gray-100 rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-blue-600" />
                    <div className="flex-1 text-left">
                      <h2 className="text-lg font-medium text-gray-900">Visualizations</h2>
                      <p className="text-sm text-gray-500">Current: {selectedDataset}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-4 pb-2">
                  {/* Dataset selector */}
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Select a Dataset</h3>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-md"
                      onChange={(e) => setSelectedDataset(e.target.value)}
                    >
                      <option value="">Select a dataset...</option>
                      <option value="Lincoln Financial LTC Policy - Approved on 08/15/2023">Lincoln Financial LTC Policy - Approved on 08/15/2023</option>
                      <option value="MetLife Whole Life Policy - Approved on 07/22/2023">MetLife Whole Life Policy - Approved on 07/22/2023</option>
                      <option value="Prudential Term Life Policy - Approved on 06/30/2023">Prudential Term Life Policy - Approved on 06/30/2023</option>
                    </select>
                  </div>
                  
                  {/* Visualizations grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
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
                  </div>
                  
                  <div className="flex justify-center mt-4 mb-4">
                    <button 
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      onClick={() => alert('Report generation would be implemented here')}
                    >
                      Generate Detailed Report
                    </button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            {/* Additional Review Sections */}
            <Accordion type="single" collapsible className="w-full border rounded-lg">
              <AccordionItem value="policy-details" className="border-none">
                <AccordionTrigger className="px-4 py-3 hover:no-underline bg-gray-50 hover:bg-gray-100 rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    <div className="flex-1 text-left">
                      <h2 className="text-lg font-medium text-gray-900">Policy Details</h2>
                      <p className="text-sm text-gray-500">Detailed policy information</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-4 pb-2">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Policy Information</h3>
                    <div className="space-y-4">
                      <p className="text-gray-500">Policy details will be displayed here based on the selected approved dataset.</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 