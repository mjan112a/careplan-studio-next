import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

interface PolicyReviewAIResultProps {
  loading: boolean;
  error?: string | null;
  result?: unknown;
}

// Simple recursive JSON viewer
function JsonViewer({ value }: { value: any }) {
  if (typeof value === 'string') {
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(value);
      return <JsonViewer value={parsed} />;
    } catch {
      return <span className="whitespace-pre-wrap break-all">{value}</span>;
    }
  }
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
    return <span>{String(value)}</span>;
  }
  if (Array.isArray(value)) {
    return (
      <ul className="pl-4 border-l border-gray-200">
        {value.map((item, i) => (
          <li key={i}><JsonViewer value={item} /></li>
        ))}
      </ul>
    );
  }
  if (typeof value === 'object' && value !== null) {
    return (
      <ul className="pl-4 border-l border-gray-200">
        {Object.entries(value).map(([k, v]) => (
          <li key={k} className="mb-1">
            <span className="font-mono text-blue-700">{k}</span>: <JsonViewer value={v} />
          </li>
        ))}
      </ul>
    );
  }
  return <span>{String(value)}</span>;
}

export const PolicyReviewAIResult: React.FC<PolicyReviewAIResultProps> = ({ loading, error, result }) => {
  // Memoize parsed result for performance
  const parsedResult = useMemo(() => {
    if (typeof result === 'string') {
      try {
        return JSON.parse(result);
      } catch {
        return result;
      }
    }
    return result;
  }, [result]);

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
      {!loading && !error && typeof result !== 'undefined' && result !== null && (
        <div className="overflow-x-auto text-sm bg-gray-50 rounded p-3 border border-gray-200">
          <JsonViewer value={parsedResult} />
        </div>
      )}
      {!loading && !error && !result && (
        <div className="text-gray-500">No AI result yet. Click "Process Document" to start extraction.</div>
      )}
    </Card>
  );
}; 