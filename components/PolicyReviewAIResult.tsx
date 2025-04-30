import React from 'react';
import { Card } from '@/components/ui/card';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

interface PolicyReviewAIResultProps {
  loading: boolean;
  error?: string | null;
  result?: unknown;
}

export const PolicyReviewAIResult: React.FC<PolicyReviewAIResultProps> = ({ loading, error, result }) => {
  return (
    <Card className="p-4 space-y-4 mt-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-blue-600" /> AI Extraction Result
      </h3>
      {loading && (
        <div className="flex items-center gap-2 text-blue-600 animate-pulse">
          <Loader2 className="h-5 w-5 animate-spin" /> Processing document with AI...
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" /> {error}
        </div>
      )}
      {!loading && !error && typeof result !== 'undefined' && result !== null && (() => {
        let display: string;
        if (typeof result === 'string') {
          display = result;
        } else {
          display = JSON.stringify(result as object, null, 2);
        }
        return (
          <pre className="bg-gray-50 rounded p-3 text-sm overflow-x-auto border border-gray-200">{display}</pre>
        );
      })()}
      {!loading && !error && !result && (
        <div className="text-gray-500">No AI result yet. Click "Process Document" to start extraction.</div>
      )}
    </Card>
  );
}; 