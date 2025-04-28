import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface PolicyDocument {
  id: string;
  original_name: string;
  // Add more fields as needed
}

interface ExtractedField {
  field: string;
  value: string;
}

interface ReviewDatasetTableProps {
  policy: PolicyDocument;
}

export const ReviewDatasetTable: React.FC<ReviewDatasetTableProps> = ({ policy }) => {
  const [data, setData] = useState<ExtractedField[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch extracted data for the policy (mock for now)
  useEffect(() => {
    setLoading(true);
    setError(null);
    // Simulate API call
    setTimeout(() => {
      setData([
        { field: 'Policy Number', value: '123456789' },
        { field: 'Insured Name', value: 'John Doe' },
        { field: 'Effective Date', value: '2024-01-01' },
        { field: 'Benefit Amount', value: '$100,000' },
        { field: 'Premium', value: '$1,200/year' },
      ]);
      setLoading(false);
    }, 1000);
  }, [policy]);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
      <h3 className="text-lg font-semibold mb-4">Extracted Data for: {policy.original_name}</h3>
      {loading && <div className="text-blue-600">Loading dataset...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <table className="min-w-full text-sm border">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">Field</th>
              <th className="px-4 py-2 text-left">Value</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="border-t">
                <td className="px-4 py-2 font-medium text-gray-700">{row.field}</td>
                <td className="px-4 py-2 text-gray-900">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="mt-6 flex justify-end">
        <Button variant="default" className="bg-green-600 hover:bg-green-700 text-white" disabled={loading}>Approve Dataset</Button>
      </div>
    </div>
  );
};

export default ReviewDatasetTable; 