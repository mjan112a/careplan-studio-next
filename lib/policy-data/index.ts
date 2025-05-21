import { logger } from '@/lib/logging';
import { PolicyData } from '@/types/simulator-interfaces';
import { useEffect, useState } from 'react';
import { getSamplePolicyData } from '@/types/policy-data';

/**
 * Fetches policy data for the provided document IDs
 */
export async function fetchPolicyData(docIds: string[]): Promise<PolicyData[] | null> {
  try {
    logger.info('Fetching policy data', { docIds });
    
    if (!docIds || docIds.length === 0) {
      return null;
    }
    
    // Use the bulk fetch endpoint (POST) to get all documents at once
    const response = await fetch('/api/policy-documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ documentIds: docIds }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch policy documents: ${response.status}`);
    }
    
    const { documents } = await response.json();
    
    if (!documents || documents.length === 0) {
      logger.warn('No policy documents found', { docIds });
      return null;
    }
    
    // Process the results
    const policyData = documents
      .filter((doc: any) => doc && doc.processed_data)
      .map((doc: any) => {
        // Add a reference to the original document ID
        return {
          ...doc.processed_data,
          _original_doc_id: doc.id
        };
      });
    
    logger.debug('Successfully fetched policy data', { 
      count: policyData.length,
      hasData: policyData.length > 0
    });
    
    if (policyData.length === 0) {
      return null;
    }
    
    // Update the window global to make data available to other components
    if (typeof window !== 'undefined') {
      window._customPolicyData = policyData;
    }
    
    return policyData;
  } catch (error) {
    logger.error('Error fetching policy data', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      docIds
    });
    return null;
  }
}

/**
 * Parses document IDs from URL query parameters
 */
export function getDocumentIdsFromUrl(): string[] | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const url = new URL(window.location.href);
    
    // Check for doc_ids parameter (comma-separated list)
    const docIdsParam = url.searchParams.get('doc_ids');
    if (docIdsParam) {
      const ids = docIdsParam.split(',').filter(Boolean);
      if (ids.length > 0) {
        return ids;
      }
    }
    
    // No document IDs found
    logger.debug('No document IDs found in URL parameters');
  } catch (error) {
    logger.error('Failed to parse URL for document IDs', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
  
  return null;
}

/**
 * A hook to manage policy data state and initialization
 */
interface UsePolicyDataResult {
  policyData: PolicyData[] | null;
  loading: boolean;
  error: Error | null;
}

export function usePolicyData(): UsePolicyDataResult {
  const [policyData, setPolicyData] = useState<PolicyData[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function initPolicyData() {
      try {
        setLoading(true);
        
        // Check if there's any global policy data already loaded
        if (typeof window !== 'undefined' && window._customPolicyData) {
          setPolicyData(window._customPolicyData);
          setLoading(false);
          return;
        }
        
        // Otherwise, try to get document IDs from URL
        const docIds = getDocumentIdsFromUrl();
        
        if (docIds && docIds.length > 0) {
          const data = await fetchPolicyData(docIds);
          setPolicyData(data);
        } else {
          // No document IDs found, use sample data
          const data = getSamplePolicyData();
          setPolicyData(data);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error('Error initializing policy data', {
          error: error.message,
          stack: error.stack
        });
        setError(error);
      } finally {
        setLoading(false);
      }
    }
    
    initPolicyData();
  }, []);
  
  return { policyData, loading, error };
} 