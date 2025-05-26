import React, { useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import { tableToCSV, downloadCSV } from '@/lib/csv-utils';

interface ScrapedTableProps {
  table: {
    id: string;
    headers: string[];
    rows: any[][];
    caption?: string;
    metadata?: {
      rows_count: number;
      columns_count: number;
      data_types?: Record<string, string>;
      extraction_method?: string;
    };
  };
}

const ScrapedTable: React.FC<ScrapedTableProps> = ({ table }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleDownloadCSV = () => {
    const csvData = tableToCSV(table.headers, table.rows);
    const filename = `${table.caption || 'scraped-data'}-${table.id}.csv`;
    downloadCSV(csvData, filename);
  };
  
  // Determine if the table is large enough to need expansion
  const isLargeTable = table.rows.length > 5 || (table.headers.length > 5);
  
  // Get the rows to display based on expanded state
  const displayRows = isExpanded || !isLargeTable 
    ? table.rows 
    : table.rows.slice(0, 5);
  
  // Get headers to display
  const displayHeaders = isExpanded || !isLargeTable
    ? table.headers
    : table.headers.length > 5 
      ? [...table.headers.slice(0, 5), '...'] 
      : table.headers;
  
  return (
    <div className="my-4 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700">
      {table.caption && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-sm">
          {table.caption}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {displayHeaders.map((header, index) => (
                <th
                  key={`${table.id}-header-${index}`}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {displayRows.map((row, rowIndex) => (
              <tr key={`${table.id}-row-${rowIndex}`}>
                {(isExpanded || !isLargeTable 
                  ? row 
                  : row.slice(0, 5).concat(row.length > 5 ? ['...'] : [])
                ).map((cell, cellIndex) => (
                  <td
                    key={`${table.id}-cell-${rowIndex}-${cellIndex}`}
                    className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap"
                  >
                    {cell !== null && cell !== undefined ? String(cell) : ''}
                  </td>
                ))}
              </tr>
            ))}
            {!isExpanded && table.rows.length > 5 && (
              <tr>
                <td 
                  colSpan={displayHeaders.length} 
                  className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 italic text-center"
                >
                  ... {table.rows.length - 5} more rows
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {table.metadata?.rows_count || table.rows.length} rows × {table.metadata?.columns_count || table.headers.length} columns
        </div>
        <div className="flex space-x-2">
          {isLargeTable && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
          <button
            onClick={handleDownloadCSV}
            className="flex items-center text-xs text-blue-600 dark:text-blue-400 hover:underline"
            title="Download as CSV"
          >
            <FiDownload className="mr-1" size={12} />
            CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScrapedTable;
