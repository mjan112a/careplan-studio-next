import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, CheckCircle2, Trash2, MousePointer } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

export interface PolicyDocument {
  id: string;
  client_id: string | null;
  user_id: string;
  file_id: string;
  original_path: string;
  processed_path: string;
  file_type: string;
  original_name: string;
  created_at: string;
  updated_at: string;
  processed_data: any | null;
  approved: boolean;
}

interface PolicyListProps {
  currentClient: { id: string; name: string } | null;
  onProcess: (policy: PolicyDocument) => Promise<void>;
  onReview: (policy: PolicyDocument) => void;
  currentPolicy: PolicyDocument | null;
  refreshFlag: number;
}

export const PolicyList: React.FC<PolicyListProps> = ({ currentClient, onProcess, onReview, currentPolicy, refreshFlag }) => {
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Fetch policies for the current client
  useEffect(() => {
    if (!currentClient) return;
    setLoading(true);
    setError(null);
    fetch(`/api/policy-documents?clientId=${currentClient.id}`)
      .then(res => res.json())
      .then(data => setPolicies(data.documents))
      .catch(err => setError('Failed to fetch policies'))
      .finally(() => setLoading(false));
  }, [currentClient, refreshFlag]);

  // Delete policy handler
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/policy-documents?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete document');
      toast.success('Deleted document');
      setPolicies(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      toast.error('Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  // Render thumbnail (processed image or PDF icon)
  const renderThumbnail = (policy: PolicyDocument) => {
    if (policy.file_type.startsWith('image/')) {
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/policy-documents-processed/${policy.processed_path}`;
      return (
        <div className="flex items-center justify-center min-w-[80px] min-h-[80px] max-w-[120px] max-h-[120px]">
          <Image
            src={url}
            alt={policy.original_name}
            width={80}
            height={80}
            className="object-cover rounded w-full h-full min-w-[80px] min-h-[80px]"
          />
        </div>
      );
    }
    // PDF icon
    return (
      <div className="flex items-center justify-center min-w-[80px] min-h-[80px] max-w-[120px] max-h-[120px] bg-gray-100 rounded">
        <FileText className="w-8 h-8 text-blue-500" />
      </div>
    );
  };

  const approvedDocs = policies.filter(p => p.approved && p.processed_data);
  const handleDiscuss = () => {
    if (!formRef.current) return;
    // Set the hidden input value to the JSON string of processed_data array
    (formRef.current.elements.namedItem('data') as HTMLInputElement).value = JSON.stringify(approvedDocs.map(p => p.processed_data));
    formRef.current.submit();
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Policy List</h3>
        <form
          ref={formRef}
          method="POST"
          action="/simulationTarget"
          className="m-0"
        >
          <input type="hidden" name="data" />
          <Button
            type="button"
            onClick={handleDiscuss}
            disabled={approvedDocs.length === 0}
            className="ml-2 bg-gradient-to-r from-green-400 to-green-600 text-white font-bold shadow-lg hover:from-green-500 hover:to-green-700 transition-all px-6 py-2 rounded-full border-2 border-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> Discuss
            </span>
          </Button>
        </form>
      </div>
      {loading && <div className="text-blue-600 flex items-center gap-2"><Loader2 className="animate-spin" /> Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {policies.length === 0 && !loading && (
        <div className="text-gray-500 text-center py-8">
          No policies found for this client.<br />
          <span className="text-sm">Upload a policy to get started.</span>
        </div>
      )}
      <ul className="space-y-3">
        {policies.map(policy => (
          <li
            key={policy.id}
            className={`flex flex-col sm:flex-row items-center justify-between p-3 rounded border ${currentPolicy && currentPolicy.id === policy.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
          >
            {/* Thumbnail */}
            <div className="flex-shrink-0 mb-2 sm:mb-0 sm:mr-4">{renderThumbnail(policy)}</div>
            {/* Name, status, actions */}
            <div className="flex-1 flex flex-col sm:flex-row items-center justify-between w-full">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full">
                <span className="font-medium text-center sm:text-left">{policy.original_name}</span>
                {/* Status badge dynamic */}
                {processingId === policy.id ? (
                  <span className="ml-2 text-xs text-blue-700 bg-blue-100 rounded px-2 py-0.5">Processing...</span>
                ) : policy.processed_data === null || policy.processed_data === undefined ? (
                  <span className="ml-2 text-xs text-green-700 bg-green-100 rounded px-2 py-0.5">Ready</span>
                ) : policy.approved ? (
                  <span className="ml-2 text-xs text-yellow-800 bg-yellow-200 rounded px-2 py-0.5">Approved</span>
                ) : (
                  <span className="ml-2 text-xs text-green-700 bg-green-100 rounded px-2 py-0.5">Processed</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-500 cursor-pointer hover:shadow-md transition-shadow flex items-center gap-1"
                  onClick={async () => {
                    setProcessingId(policy.id);
                    try {
                      await onProcess(policy);
                    } finally {
                      setProcessingId(null);
                    }
                  }}
                  disabled={!!processingId}
                >
                  {processingId === policy.id ? (
                    <span className="flex items-center gap-1"><Loader2 className="animate-spin w-4 h-4" /> Processing...</span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <MousePointer className="w-4 h-4" /> Process
                    </span>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-500 text-black bg-white hover:shadow-md transition-shadow flex items-center gap-1"
                  onClick={() => onReview(policy)}
                >
                  <CheckCircle2 className="w-4 h-4" /> Review
                </Button>
              </div>
            </div>
            {/* Delete button at far right */}
            <div className="flex-shrink-0 ml-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500 hover:bg-red-100"
                onClick={e => { e.stopPropagation(); handleDelete(policy.id); }}
                aria-label="Delete document"
                disabled={deletingId === policy.id}
              >
                {deletingId === policy.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PolicyList; 