import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { Trash2, FileText, CheckCircle2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

interface PolicyDocument {
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
}

interface PolicyUploadProps {
  currentClient: { id: string; name: string } | null;
  user: { id: string };
  onDocumentsChanged?: () => void;
}

export const PolicyUpload: React.FC<PolicyUploadProps> = ({ currentClient, user, onDocumentsChanged }) => {
  const [documents, setDocuments] = useState<PolicyDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [refreshFlag, setRefreshFlag] = useState(0);

  // Fetch policy documents for the current client (or unassigned)
  useEffect(() => {
    if (!user) return;
    const fetchDocs = async () => {
      try {
        setError(null);
        const res = await fetch(`/api/policy-documents?clientId=${currentClient ? currentClient.id : 'null'}`);
        if (!res.ok) throw new Error('Failed to fetch policy documents');
        const data = await res.json();
        setDocuments(data.documents);
        // Set the first as active by default if any
        if (data.documents.length > 0) setActiveId(data.documents[0].id);
        else setActiveId(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    };
    fetchDocs();
  }, [currentClient, user, refreshFlag]);

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setError(null);
    for (const file of Array.from(files)) {
      // Validate
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast.error(`File type ${file.type} is not supported. Please upload PDF, JPG, PNG, or WEBP files.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds the 50MB limit.`);
        continue;
      }
      try {
        const formData = new FormData();
        formData.append('file', file);
        if (currentClient) formData.append('clientId', currentClient.id);
        // Use session token for SSR auth
        const res = await fetch('/api/process-upload', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error('Failed to upload file');
        toast.success(`Uploaded ${file.name}`);
        setRefreshFlag(f => f + 1);
        if (onDocumentsChanged) onDocumentsChanged();
      } catch (err) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    setIsUploading(false);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/policy-documents?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete document');
      toast.success('Deleted document');
      setRefreshFlag(f => f + 1);
      if (onDocumentsChanged) onDocumentsChanged();
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  // UI for file preview
  const renderPreview = (doc: PolicyDocument) => {
    if (doc.file_type.startsWith('image/')) {
      // Use processed_path for public URL
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/policy-documents-processed/${doc.processed_path}`;
      return (
        <Image src={url} alt={doc.original_name} width={80} height={80} className="rounded object-cover" />
      );
    }
    // PDF icon
    return (
      <div className="flex items-center justify-center w-20 h-20 bg-gray-100 rounded">
        <FileText className="w-8 h-8 text-blue-500" />
      </div>
    );
  };

  return (
    <Card className="mb-0">
      <CardContent>
        {!currentClient && (
          <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 rounded">
            Please select a client to upload and view policy documents. Unassigned uploads will be shown if no client is selected.
          </div>
        )}
        <div className="mb-4">
          <input
            type="file"
            accept={ALLOWED_FILE_TYPES.join(',')}
            onChange={handleFileChange}
            className="hidden"
            id="policy-upload-input"
            multiple
            disabled={isUploading}
          />
          <label htmlFor="policy-upload-input">
            <Button
              asChild
              type="button"
              disabled={isUploading}
              variant="outline"
              className="border-blue-500 text-black bg-white hover:shadow-md transition-shadow gap-1"
            >
              <span>
                {isUploading ? 'Uploading...' : 'Upload Policy'}
              </span>
            </Button>
          </label>
          <span className="ml-3 text-xs text-gray-500">Images preferred. PDFs will take longer to process.</span>
        </div>
        {error && <div className="mb-2 p-2 bg-red-50 text-red-700 rounded">{error}</div>}
      </CardContent>
    </Card>
  );
};

export default PolicyUpload; 