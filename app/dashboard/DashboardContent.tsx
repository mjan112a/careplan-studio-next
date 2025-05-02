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
  Clock,
  Brain
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientList, Client } from '@/components/ClientList';
import { NewClientForm } from '@/components/NewClientForm';
import { PolicyUpload } from '@/components/PolicyUpload';
import { PolicyList } from '@/components/PolicyList';
import { ReviewDatasetTable } from '@/components/ReviewDatasetTable';
import type { PolicyDocument } from '@/components/PolicyList';
import { PolicyReviewAIResult } from '@/components/PolicyReviewAIResult';
import { renderPrompt } from '@/app/api/prompts/lib/render';
import { logger } from '@/lib/logging';
import type { Database } from '@/types/supabase';

interface DashboardContentProps {
  user: User | null;
}

export default function DashboardContent({ user }: DashboardContentProps) {
  // State to track current selections
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [policyWorkflowStage, setPolicyWorkflowStage] = useState<'upload' | 'process' | 'review'>('upload');
  const [currentPolicy, setCurrentPolicy] = useState<any>(null); // Will type this more strictly later
  const [selectedDataset, setSelectedDataset] = useState('No dataset selected');
  const [policyListRefreshFlag, setPolicyListRefreshFlag] = useState(0);
  const [aiResult, setAIResult] = useState<unknown>(null);
  const [aiLoading, setAILoading] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);
  const [aiInteraction, setAIInteraction] = useState<Database['public']['Tables']['ai_interactions']['Row'] | null>(null);
  const [aiInteractionLoading, setAIInteractionLoading] = useState(false);
  const [aiInteractionError, setAIInteractionError] = useState<string | null>(null);
  
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
      // Auto-select the first client if none is selected
      if ((!selectedClient || !data.clients.some((c: Client) => c.id === selectedClient.id)) && data.clients.length > 0) {
        setSelectedClient(data.clients[0]);
      }
    } catch (err) {
      setClientsError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingClients(false);
    }
  };

  // Handler to select a client and update its updated_at
  const handleSelectClient = async (client: Client) => {
    try {
      await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updated_at: new Date().toISOString() })
      });
    } catch (err) {
      // Ignore error, still select client
    }
    setSelectedClient(client);
    // Optionally, refresh clients to update order
    refreshClients();
  };

  // Handler to process a policy document with AI
  const handleProcessPolicy = async (policy: PolicyDocument) => {
    setAILoading(true);
    setAIError(null);
    setAIResult(null);
    try {
      // 1. Fetch all prompts
      const promptRes = await fetch('/api/prompts');
      if (!promptRes.ok) throw new Error('Failed to fetch prompts');
      const prompts = await promptRes.json();
      // 2. Filter and sort
      const filtered = prompts
        .filter((p: any) => p.category?.primary === 'Policy' && p.category?.secondary === 'Extraction')
        .sort((a: any, b: any) => new Date(b.metadata?.updatedAt).getTime() - new Date(a.metadata?.updatedAt).getTime());
      const prompt = filtered[0];
      if (!prompt) throw new Error('No suitable prompt found');
      // 3. Render prompt with replacements (ask user or use defaults)

      // For demo, use policy fields as replacements
      const replacements = { ...policy };
      const renderedPrompt = renderPrompt({ template: prompt.template, replacements, warnOnMissing: true });
      // 4. Fetch the processed document as Blob
      const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/policy-documents-processed/${policy.processed_path}`;
      const fileRes = await fetch(fileUrl);
      if (!fileRes.ok) throw new Error('Failed to fetch policy document');
      const fileBlob = await fileRes.blob();
      // Use the file_type from the policy document as the MIME type
      const fileWithType = new File([fileBlob], policy.original_name, { type: policy.file_type });
      logger.info('Policy document retrieved - details', {
        fileType: policy.file_type,
        fileBlob,
        fileWithType,
        policy
      });
      // 5. Send to Gemini API
      const formData = new FormData();
      formData.append('prompt', renderedPrompt);
      formData.append('file', fileWithType, policy.original_name);
      const aiRes = await fetch('/api/ai/gemini', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!aiRes.ok) {
        const err = await aiRes.json();
        throw new Error(err.error || 'AI processing failed');
      }
      const aiData = await aiRes.json();
      setAIResult(aiData);
      setPolicyWorkflowStage('review');
    } catch (err) {
      setAIError(err instanceof Error ? err.message : String(err));
    } finally {
      setAILoading(false);
    }
  };

  // Fetch most recent AI interaction for the current user
  useEffect(() => {
    if (!user) return;
    setAIInteractionLoading(true);
    setAIInteractionError(null);
    fetch(`/api/ai_interactions?limit=1`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to fetch AI interactions');
        }
        return res.json();
      })
      .then((data) => {
        if (data.data && data.data.length > 0) {
          setAIInteraction(data.data[0]);
        } else {
          setAIInteraction(null);
        }
      })
      .catch((err) => {
        setAIInteractionError(err instanceof Error ? err.message : String(err));
        logger.error('Failed to fetch AI interactions', {
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        });
      })
      .finally(() => setAIInteractionLoading(false));
  }, [user]);

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
                          onSelect={handleSelectClient}
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
                        <p className="text-sm text-gray-500">Guide: Upload → Process → Review</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-4 pb-2">
                    <div className="flex flex-col gap-6">
                      {/* Upload Form */}
                      <PolicyUpload
                        currentClient={selectedClient}
                        user={user ? { id: user.id } : { id: '' }}
                        onDocumentsChanged={() => setPolicyListRefreshFlag(f => f + 1)}
                      />
                      {/* Policy List always visible below upload */}
                      <PolicyList
                        currentClient={selectedClient}
                        onProcess={handleProcessPolicy}
                        onReview={(policy: PolicyDocument) => {
                          setCurrentPolicy(policy);
                          setPolicyWorkflowStage('review');
                        }}
                        currentPolicy={currentPolicy}
                        refreshFlag={policyListRefreshFlag}
                      />
                    </div>
                    {/* Review Dataset Table (only visible in review stage) */}
                    {policyWorkflowStage === 'review' && currentPolicy && (
                      <div className="mt-6">
                        <div className="mb-4 flex items-center gap-4">
                          <button
                            className="text-blue-600 hover:underline"
                            onClick={() => setPolicyWorkflowStage('upload')}
                          >
                            ← Back to Policy List
                          </button>
                          <div className="font-semibold text-lg">Reviewing: {currentPolicy.original_name}</div>
                        </div>
                        <ReviewDatasetTable policy={currentPolicy} aiResult={aiResult} />
                        <PolicyReviewAIResult loading={aiLoading} error={aiError} result={aiResult} />
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* AI Interactions Section */}
              <Accordion type="single" collapsible className="w-full border rounded-lg">
                <AccordionItem value="ai-interactions" className="border-none">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline bg-gray-50 hover:bg-gray-100 rounded-t-lg">
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-pink-600" />
                      <div className="flex-1 text-left">
                        <h2 className="text-lg font-medium text-gray-900">AI Interactions</h2>
                        <p className="text-sm text-gray-500">Most recent AI extraction result</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-4 pb-2">
                    {aiInteractionLoading && (
                      <div className="text-gray-500">Loading latest AI interaction...</div>
                    )}
                    {aiInteractionError && (
                      <div className="text-red-600">Error: {aiInteractionError}</div>
                    )}
                    {!aiInteractionLoading && !aiInteractionError && aiInteraction && (
                      <div>
                        <CopyAIInteractionButton aiInteraction={aiInteraction} />
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-x-auto text-xs font-mono whitespace-pre-wrap mt-2">
                          <div className="mb-2 text-sm text-gray-700">
                            <span className="font-semibold">Timestamp:</span> {new Date(aiInteraction.timestamp).toLocaleString()}<br />
                            <span className="font-semibold">Status:</span> {aiInteraction.status}<br />
                            <span className="font-semibold">Model:</span> {aiInteraction.model_name}<br />
                            <span className="font-semibold">Latency:</span> {aiInteraction.latency_ms ?? 'N/A'} ms<br />
                            <span className="font-semibold">Error:</span> {aiInteraction.error_code ? `${aiInteraction.error_code} - ${aiInteraction.error_message}` : 'None'}
                          </div>
                          <div>
                            <span className="font-semibold">Request:</span>
                            <pre className="bg-white border rounded p-2 mt-1 mb-2 overflow-x-auto">{JSON.stringify(aiInteraction.request, null, 2)}</pre>
                          </div>
                          <div>
                            <span className="font-semibold">Response:</span>
                            <pre className="bg-white border rounded p-2 mt-1 overflow-x-auto">{JSON.stringify(aiInteraction.response, null, 2)}</pre>
                          </div>
                        </div>
                      </div>
                    )}
                    {!aiInteractionLoading && !aiInteractionError && !aiInteraction && (
                      <div className="text-gray-500">No AI interactions found for your account.</div>
                    )}
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
            <div className="mb-4">
              {selectedClient ? (
                <div className="text-lg font-semibold text-blue-700">Current Client: {selectedClient.name}</div>
              ) : (
                <div className="text-lg text-gray-500">Select a Current Client in Prepare</div>
              )}
            </div>
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

function CopyAIInteractionButton({ aiInteraction }: { aiInteraction: any }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(aiInteraction, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      setCopied(false);
    }
  };
  return (
    <div className="flex items-center mb-2">
      <button
        type="button"
        className="flex items-center gap-2 px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 border border-gray-300 text-xs font-medium text-gray-700 transition-colors"
        onClick={handleCopy}
        aria-label="Copy AI interaction to clipboard"
      >
        <Clipboard className="h-4 w-4" />
        COPY to Clipboard
      </button>
      {copied && <span className="ml-2 text-green-600 text-xs">Copied!</span>}
    </div>
  );
} 