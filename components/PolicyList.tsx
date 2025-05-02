import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, CheckCircle2, Trash2 } from 'lucide-react';
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
  // Add more fields as needed (e.g., processed status)
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

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
      <h3 className="text-lg font-semibold mb-4">Policy List</h3>
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
                {/* Status badge placeholder */}
                <span className="ml-2 text-xs text-green-700 bg-green-100 rounded px-2 py-0.5">Ready</span>
              </div>
              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                <Button
                  variant="outline"
                  size="sm"
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
                    'Process Document'
                  )}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onReview(policy)}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Review Dataset
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