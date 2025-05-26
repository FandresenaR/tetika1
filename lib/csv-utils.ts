/**
 * Utilities for handling CSV data conversion and export
 */

/**
 * Convert a JavaScript array of objects to CSV format
 * @param data Array of objects to convert to CSV
 * @returns CSV string
 */
export function objectsToCSV(data: Record<string, any>[]): string {
  if (!data || data.length === 0) return '';
  
  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV rows
  const csvRows = [];
  
  // Add header row
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Handle null, undefined, and escape commas and quotes
      const escaped = value === null || value === undefined 
        ? '' 
        : String(value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

/**
 * Convert table data (headers and rows) to CSV format
 * @param headers Array of header strings
 * @param rows Array of data rows
 * @returns CSV string
 */
export function tableToCSV(headers: string[], rows: any[][]): string {
  if (!headers || !rows) return '';
  
  const csvRows = [];
  
  // Add header row
  csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));
  
  // Add data rows
  for (const row of rows) {
    const values = row.map(value => {
      // Handle null, undefined, and escape commas and quotes
      const escaped = value === null || value === undefined 
        ? '' 
        : String(value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

/**
 * Generate a download for a CSV file in the browser
 * @param csvData CSV string to download
 * @param filename Name of the file to download
 */
export function downloadCSV(csvData: string, filename: string = 'data.csv'): void {
  if (!csvData) return;
  
  // Create a blob and generate a URL for it
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link element and trigger the download
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
