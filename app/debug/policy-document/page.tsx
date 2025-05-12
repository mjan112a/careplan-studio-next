import { notFound } from 'next/navigation';
import { logger } from '@/lib/logging';
import Link from 'next/link';
import { getAppURL } from '@/utils/url';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import Layout from '@/app/components/Layout';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Props {
  searchParams: { id?: string };
}

// Add a helper function to format file size
const formatFileSize = (bytes: number | null): string => {
  if (bytes === null) return 'Unknown size';
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default async function PolicyDocumentDebugPage({ searchParams }: Props) {
  // We need to await searchParams before accessing its properties
  const params = await searchParams;
  const id = params?.id || null;
  
  // Authenticate the user
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      logger.error('No user found in authenticated session');
      return (
        <Layout user={null}>
          <div className="container mx-auto px-4 py-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              Error: Not authenticated
            </div>
            <Link href="/auth/signin" className="text-blue-600 hover:underline">Sign in</Link>
          </div>
        </Layout>
      );
    }

    if (!id) {
      return (
        <Layout user={user}>
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Policy Document Debug</h1>
            <div className="text-red-600 mb-4">No policy document id provided.</div>
            <Link href="/dashboard" className="text-blue-600 hover:underline">← Back to Dashboard</Link>
          </div>
        </Layout>
      );
    }

    let policy: any = null;
    let originalUrl: string | null = null;
    let processedUrl: string | null = null;
    let originalMetadata: any = null;
    let processedMetadata: any = null;
    let error: string | null = null;

    try {
      logger.info('Fetching policy document details from API', { id, userId: user.id });
      
      // Use the Supabase client directly instead of making a separate API call
      // This is how the Profile and Prompts pages handle data fetching
      const { data, error: fetchError } = await supabase
        .from('policy_documents')
        .select('*')
        .eq('id', id)
        .single();
        
      if (fetchError) {
        throw new Error(fetchError.message);
      }
      
      policy = data;
      
      // Get original document URL and metadata
      if (policy.original_path) {
        // Get a signed URL for the original document
        const { data: originalData, error: originalError } = await supabase
          .storage
          .from('policy-documents-original')
          .createSignedUrl(policy.original_path, 60 * 60); // 1 hour expiry
        
        if (!originalError) {
          originalUrl = originalData?.signedUrl || null;
        }
        
        // Get metadata for original document
        const { data: originalMeta, error: originalMetadataError } = await supabase
          .rpc('get_storage_object_metadata_by_bucket', { 
            file_path: policy.original_path,
            bucket_name: 'policy-documents-original'
          });
          
        if (!originalMetadataError && originalMeta) {
          originalMetadata = originalMeta;
        }
      }
      
      // Get processed document URL and metadata
      if (policy.processed_path) {
        // Get a public URL for the processed document
        processedUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/policy-documents-processed/${policy.processed_path}`;
        
        // Get metadata for processed document
        const { data: processedMeta, error: processedMetadataError } = await supabase
          .rpc('get_storage_object_metadata_by_bucket', { 
            file_path: policy.processed_path,
            bucket_name: 'policy-documents-processed'
          });
          
        if (!processedMetadataError && processedMeta) {
          processedMetadata = processedMeta;
        }
      }
      
      logger.info('Successfully fetched policy document details', { 
        id,
        userId: user.id,
        hasOriginalMeta: !!originalMetadata,
        hasProcessedMeta: !!processedMetadata
      });
      
    } catch (fetchError) {
      logger.error('Error fetching policy document', {
        error: fetchError instanceof Error ? fetchError.message : String(fetchError),
        stack: fetchError instanceof Error ? fetchError.stack : undefined,
        id,
        userId: user.id
      });
      error = fetchError instanceof Error ? fetchError.message : String(fetchError);
    }

    // Helper function to format metadata for display
    const formatMetadata = (metadata: any) => {
      if (!metadata) return null;
      
      return Object.entries(metadata).map(([key, value]) => {
        // Format the value based on type
        let formattedValue = value;
        if (typeof value === 'object') {
          formattedValue = JSON.stringify(value, null, 2);
        }
        
        return (
          <div key={key} className="py-1 border-b border-gray-100 last:border-0">
            <span className="font-mono text-xs text-gray-600">{key}: </span>
            <span className="font-mono text-xs break-all">{formattedValue as string}</span>
          </div>
        );
      });
    };

    // Calculate file sizes from metadata
    const originalSize = originalMetadata?.size ? Number(originalMetadata.size) : null;
    const processedSize = processedMetadata?.size ? Number(processedMetadata.size) : null;

    // Calculate compression ratio if both sizes are available
    const compressionRatio = originalSize && processedSize 
      ? ((processedSize / originalSize) * 100).toFixed(1) 
      : null;

    return (
      <Layout user={user}>
        <div className="max-w-7xl mx-auto p-8 space-y-8">
          <div>
            <Link href="/dashboard" className="text-blue-600 hover:underline">&larr; Back</Link>
          </div>
          <h1 className="text-2xl font-bold mb-4">Policy Document Debug</h1>
          
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-800 p-4 rounded-lg mb-6">
              <h2 className="font-semibold mb-2">Error Loading Document</h2>
              <p className="mb-2">{error}</p>
              <p>This could be due to:</p>
              <ul className="list-disc ml-5">
                <li>Document doesn't exist or has been deleted</li>
                <li>You don't have permission to access this document</li>
                <li>Database connection issues</li>
                <li>Server configuration problems</li>
              </ul>
            </div>
          )}
          
          {policy && (
            <>
              {/* Document Summary */}
              <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-6">
                <h2 className="font-semibold mb-3">Document Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Original Name</h3>
                    <p className="text-base">{policy.original_name}</p>
                    <p className="text-xs text-gray-500 mt-1">File Type: {policy.file_type}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">File Sizes</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">Original: {formatFileSize(originalSize)}</span>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Processed: {formatFileSize(processedSize)}</span>
                    </div>
                    {compressionRatio && (
                      <p className="text-xs text-gray-500 mt-2">
                        Compression Ratio: <span className={`font-medium ${Number(compressionRatio) < 50 ? 'text-green-600' : 'text-amber-600'}`}>
                          {compressionRatio}%
                        </span> of original
                      </p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Processing Status</h3>
                    <div className="mt-1">
                      {policy.processed_data ? (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Processed</span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">Not Processed</span>
                      )}
                      {policy.approved && (
                        <span className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">Approved</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Original Document */}
                <div>
                  <h2 className="font-semibold mb-2">Original <span className="text-xs text-gray-500">({originalMetadata?.bucket_name || 'policy-documents-original'})</span></h2>
                  <p className="text-[8px] text-gray-500 mb-1 font-mono overflow-hidden text-ellipsis whitespace-nowrap" title={policy.original_path}>
                    Path: {policy.original_path}
                  </p>
                  <p className="text-[8px] text-gray-500 mb-2 font-mono">
                    Size: {formatFileSize(originalSize)}
                  </p>
                  {policy.file_type.startsWith('image/') && originalUrl ? (
                    <img src={originalUrl} alt="Original" className="rounded border max-w-full max-h-96" />
                  ) : policy.file_type === 'application/pdf' && originalUrl ? (
                    <object
                      data={originalUrl}
                      type="application/pdf"
                      className="w-full h-96 border rounded"
                    >
                      <embed src={originalUrl} type="application/pdf" className="w-full h-96" />
                      <p className="mt-2">
                        Unable to display PDF. <a href={originalUrl} download className="text-blue-600 underline">Download</a>
                      </p>
                    </object>
                  ) : (
                    <span className="text-gray-500">No original file available or access denied</span>
                  )}
                </div>

                {/* Processed Document */}
                <div>
                  <h2 className="font-semibold mb-2">Processed <span className="text-xs text-gray-500">({processedMetadata?.bucket_name || 'policy-documents-processed'})</span></h2>
                  <p className="text-[8px] text-gray-500 mb-1 font-mono overflow-hidden text-ellipsis whitespace-nowrap" title={policy.processed_path}>
                    Path: {policy.processed_path}
                  </p>
                  <p className="text-[8px] text-gray-500 mb-2 font-mono">
                    Size: {formatFileSize(processedSize)}
                    {originalSize && processedSize ? ` (${((processedSize / originalSize) * 100).toFixed(1)}% of original)` : ''}
                  </p>
                  {policy.file_type.startsWith('image/') && processedUrl ? (
                    <img src={processedUrl} alt="Processed" className="rounded border max-w-full max-h-96" />
                  ) : policy.file_type === 'application/pdf' && processedUrl ? (
                    <object
                      data={processedUrl}
                      type="application/pdf"
                      className="w-full h-96 border rounded"
                    >
                      <embed src={processedUrl} type="application/pdf" className="w-full h-96" />
                      <p className="mt-2">
                        Unable to display PDF. <a href={processedUrl} download className="text-blue-600 underline">Download</a>
                      </p>
                    </object>
                  ) : (
                    <span className="text-gray-500">No processed file available</span>
                  )}
                </div>
              </div>

              {/* Metadata Display Side by Side */}
              <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <h2 className="font-semibold mb-4">File Metadata Comparison</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Original Metadata */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Original Metadata</h3>
                    <div className="bg-gray-50 p-2 rounded border text-xs overflow-auto max-h-96 h-full">
                      {originalMetadata ? formatMetadata(originalMetadata) : (
                        <p className="text-gray-500">No metadata available</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Processed Metadata */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Processed Metadata</h3>
                    <div className="bg-gray-50 p-2 rounded border text-xs overflow-auto max-h-96 h-full">
                      {processedMetadata ? formatMetadata(processedMetadata) : (
                        <p className="text-gray-500">No metadata available</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Policy document data */}
              <div>
                <h2 className="font-semibold mb-2">Policy Document Data</h2>
                <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto border max-h-96 overflow-y-auto">
                  {JSON.stringify(policy, null, 2)}
                </pre>
              </div>

              {/* Processed data */}
              {policy.processed_data && (
                <div>
                  <h2 className="font-semibold mb-2">Processed Data (Extracted)</h2>
                  <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto border max-h-96 overflow-y-auto">
                    {JSON.stringify(policy.processed_data, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      </Layout>
    );
  } catch (error) {
    logger.error('Error in policy document debug page:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      id
    });
    
    return (
      <Layout user={null}>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Error loading policy document debug page
          </div>
          <Link href="/dashboard" className="text-blue-600 hover:underline">← Back to Dashboard</Link>
        </div>
      </Layout>
    );
  }
} 