import React, { useState } from 'react';
import { FiCopy, FiCheck, FiDownload } from 'react-icons/fi';

interface TableRendererProps {
  content: string;
  theme?: 'dark' | 'light';
}

/**
 * Parse un tableau Markdown et le convertit en structure de données
 */
function parseMarkdownTable(markdown: string): { headers: string[]; rows: string[][]; alignment: string[] } | null {
  const lines = markdown.trim().split('\n').filter(line => line.trim());
  
  if (lines.length < 3) return null; // Au moins header + separator + 1 row
  
  // Parse header
  const headerLine = lines[0];
  const headers = headerLine.split('|')
    .map(h => h.trim())
    .filter(h => h.length > 0);
  
  // Parse alignment (deuxième ligne avec ---, :---, ---:, :---:)
  const alignmentLine = lines[1];
  const alignment = alignmentLine.split('|')
    .map(a => a.trim())
    .filter(a => a.length > 0)
    .map(a => {
      if (a.startsWith(':') && a.endsWith(':')) return 'center';
      if (a.endsWith(':')) return 'right';
      return 'left';
    });
  
  // Parse rows
  const rows = lines.slice(2).map(line => 
    line.split('|')
      .map(cell => cell.trim())
      .filter(cell => cell.length > 0 || cell === '')
  );
  
  return { headers, rows, alignment };
}

/**
 * Convertit un tableau en format TSV (Tab-Separated Values) pour Excel/Sheets
 */
function tableToTSV(headers: string[], rows: string[][]): string {
  const tsvHeaders = headers.join('\t');
  const tsvRows = rows.map(row => row.join('\t')).join('\n');
  return `${tsvHeaders}\n${tsvRows}`;
}

/**
 * Convertit un tableau en format CSV
 */
function tableToCSV(headers: string[], rows: string[][]): string {
  const escape = (str: string) => {
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  const csvHeaders = headers.map(escape).join(',');
  const csvRows = rows.map(row => row.map(escape).join(',')).join('\n');
  return `${csvHeaders}\n${csvRows}`;
}

/**
 * Composant pour afficher un tableau Markdown avec style et bouton copier
 */
export const TableRenderer: React.FC<TableRendererProps> = ({ content, theme = 'dark' }) => {
  const [copied, setCopied] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'tsv' | 'csv'>('tsv');
  
  const tableData = parseMarkdownTable(content);
  
  if (!tableData) return null;
  
  const { headers, rows, alignment } = tableData;
  
  // Copier vers le presse-papier (format TSV pour Excel/Sheets)
  const handleCopy = async () => {
    const tsv = tableToTSV(headers, rows);
    
    try {
      await navigator.clipboard.writeText(tsv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erreur de copie:', error);
      
      // Fallback: créer un élément temporaire
      const textarea = document.createElement('textarea');
      textarea.value = tsv;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  // Télécharger le tableau
  const handleDownload = () => {
    const data = downloadFormat === 'tsv' 
      ? tableToTSV(headers, rows) 
      : tableToCSV(headers, rows);
    
    const blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `table.${downloadFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const isDark = theme === 'dark';
  
  return (
    <div className={`my-4 rounded-lg overflow-hidden ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      {/* Header avec boutons */}
      <div className={`flex items-center justify-between px-4 py-2 ${isDark ? 'bg-gray-800 border-b border-gray-700' : 'bg-gray-100 border-b border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            📊 Tableau ({headers.length} colonnes × {rows.length} lignes)
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Bouton Copier */}
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              copied
                ? isDark
                  ? 'bg-green-900/50 text-green-300 border border-green-700/50'
                  : 'bg-green-100 text-green-700 border border-green-300'
                : isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
            title="Copier pour Excel/Sheets"
          >
            {copied ? (
              <>
                <FiCheck size={14} />
                <span>Copié!</span>
              </>
            ) : (
              <>
                <FiCopy size={14} />
                <span>Copier</span>
              </>
            )}
          </button>
          
          {/* Bouton Télécharger */}
          <button
            onClick={handleDownload}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              isDark
                ? 'bg-cyan-900/50 text-cyan-300 hover:bg-cyan-800/50 border border-cyan-700/50'
                : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200 border border-cyan-300'
            }`}
            title={`Télécharger (${downloadFormat.toUpperCase()})`}
          >
            <FiDownload size={14} />
            <span>{downloadFormat.toUpperCase()}</span>
          </button>
        </div>
      </div>
      
      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={isDark ? 'bg-gray-700/50' : 'bg-gray-100'}>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className={`px-4 py-3 text-sm font-semibold ${
                    isDark ? 'text-cyan-300' : 'text-cyan-700'
                  } border-b-2 ${
                    isDark ? 'border-cyan-700/50' : 'border-cyan-300'
                  }`}
                  style={{ textAlign: (alignment[index] || 'left') as 'left' | 'center' | 'right' }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`transition-colors ${
                  isDark
                    ? 'hover:bg-gray-700/30 border-b border-gray-700/30'
                    : 'hover:bg-gray-50 border-b border-gray-200'
                } ${rowIndex % 2 === 0 ? (isDark ? 'bg-gray-800/20' : 'bg-white') : ''}`}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={`px-4 py-3 text-sm ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                    style={{ textAlign: (alignment[cellIndex] || 'left') as 'left' | 'center' | 'right' }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Footer avec info */}
      <div className={`px-4 py-2 text-xs ${isDark ? 'text-gray-500 bg-gray-800/30' : 'text-gray-500 bg-gray-50'}`}>
        💡 Cliquez sur "Copier" puis collez dans Excel ou Google Sheets
      </div>
    </div>
  );
};

/**
 * Détecte et extrait les tableaux Markdown d'un texte
 */
export function extractMarkdownTables(text: string): { 
  tables: string[]; 
  positions: { start: number; end: number }[] 
} {
  const tables: string[] = [];
  const positions: { start: number; end: number }[] = [];
  
  const lines = text.split('\n');
  let currentTable: string[] = [];
  let tableStart = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Détecter le début d'un tableau (ligne avec |)
    if (line.trim().includes('|')) {
      if (currentTable.length === 0) {
        tableStart = text.indexOf(line, tableStart + 1);
      }
      currentTable.push(line);
    } else if (currentTable.length > 0) {
      // Fin du tableau
      const tableText = currentTable.join('\n');
      tables.push(tableText);
      
      const tableEnd = tableStart + tableText.length;
      positions.push({ start: tableStart, end: tableEnd });
      
      currentTable = [];
      tableStart = -1;
    }
  }
  
  // Dernier tableau si le texte se termine par un tableau
  if (currentTable.length > 0) {
    const tableText = currentTable.join('\n');
    tables.push(tableText);
    const tableEnd = tableStart + tableText.length;
    positions.push({ start: tableStart, end: tableEnd });
  }
  
  return { tables, positions };
}
