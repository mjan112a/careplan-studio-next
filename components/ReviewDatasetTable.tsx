import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logging';

interface PolicyDocument {
  id: string;
  original_name: string;
  // Add more fields as needed
}

interface ReviewDatasetTableProps {
  policy: PolicyDocument;
  aiResult?: unknown;
  onApprove?: () => void;
}

// Try to extract a table from the AI result
function extractTableData(result: unknown): { columns: string[]; rows: any[] } | null {
  try {
    logger.debug('extractTableData: received result', { result });

    if (
      result &&
      typeof result === 'object' &&
      'candidates' in result &&
      Array.isArray((result as any).candidates) &&
      (result as any).candidates[0]?.content?.parts[0]?.text
    ) {
      let text = (result as any).candidates[0].content.parts[0].text as string;
      logger.debug('extractTableData: raw text', { text });

      // Extract JSON block from markdown code block
      const match = text.match(/```json\s*([\s\S]*?)\s*```/i);
      let jsonString = match ? match[1] : text;
      logger.debug('extractTableData: extracted jsonString', { jsonString });

      // Try parsing
      const parsed = JSON.parse(jsonString);
      logger.debug('extractTableData: parsed JSON', { parsed });

      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
        const columns = Array.from(
          new Set(parsed.flatMap((row: any) => Object.keys(row)))
        );
        logger.info('extractTableData: successfully extracted table data', { columns, rowCount: parsed.length });
        return { columns, rows: parsed };
      } else {
        logger.error('extractTableData: parsed data is not an array of objects', { parsed });
      }
    } else {
      logger.error('extractTableData: result does not have expected structure', { result });
    }
  } catch (error) {
    logger.error('extractTableData: failed to extract table data', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      result,
    });
  }
  return null;
}

export const ReviewDatasetTable: React.FC<ReviewDatasetTableProps> = ({ policy, aiResult, onApprove }) => {
  const tableData = useMemo(() => extractTableData(aiResult), [aiResult]);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
      {tableData ? (
        <table className="min-w-full text-sm border">
          <thead>
            <tr className="bg-gray-100">
              {tableData.columns.map(col => (
                <th key={col} className="px-4 py-2 text-left">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.rows.map((row, idx) => (
              <tr key={idx} className="border-t">
                {tableData.columns.map(col => (
                  <td key={col} className="px-4 py-2 text-gray-900">{row[col] ?? ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="text-gray-500">No extracted data available from AI.</div>
      )}
      <div className="mt-6 flex justify-end">
        <Button variant="default" className="bg-green-600 hover:bg-green-700 text-white" onClick={onApprove}>Approve Dataset</Button>
      </div>
    </div>
  );
};

export default ReviewDatasetTable; 