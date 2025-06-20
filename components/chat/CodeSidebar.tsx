import React, { useState, useEffect } from 'react';

interface ThinkingStep {
  id: string;
  title: string;
  description: string;
  sources: string[];
  timestamp: number;
  status: 'in-progress' | 'completed' | 'error';
  data?: unknown;
}

interface CodeSidebarProps {
  code: string;
  language: string;
  fileName: string;
  theme?: 'dark' | 'light';
  onClose: () => void;
  mode?: 'code' | 'thinking-process';
  thinkingSteps?: ThinkingStep[];
  reportData?: unknown;
}

// Safe clipboard copy function with fallbacks
const safeClipboardCopy = async (text: string): Promise<boolean> => {
  try {
    // Modern approach: Use Clipboard API if available
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers: execCommand copy
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Make the textarea out of viewport
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    // Execute the copy command
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    return successful;
  } catch (err) {
    console.error('Copy failed:', err);
    return false;
  }
};

const CodeSidebar: React.FC<CodeSidebarProps> = ({ 
  code, 
  language, 
  fileName, 
  theme = 'dark',
  onClose,
  mode = 'code',
  thinkingSteps = [],
  reportData
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [editableFileName, setEditableFileName] = useState(fileName);
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'thinking' | 'sources' | 'report'>('thinking');
  
  // Handle mounting animation
  useEffect(() => {
    // First set mounted to true
    setIsMounted(true);
    
    // Then trigger the fade-in animation
    const timer = setTimeout(() => {
      setIsVisible(true);
      
      // Ajouter une classe au body pour indiquer que le sidebar est ouvert
      document.body.classList.add('code-sidebar-open');
    }, 50); // Small delay for the CSS transition
    
    return () => {
      clearTimeout(timer);
    };
  }, []);
  
  const handleClose = () => {
    setIsVisible(false);
    
    // Supprimer la classe du body quand on ferme le sidebar
    document.body.classList.remove('code-sidebar-open');
    
    setTimeout(() => {
      onClose();
    }, 300); // Match this with CSS transition duration
  };
  
  // Nettoyer lors du démontage du composant
  useEffect(() => {
    return () => {
      document.body.classList.remove('code-sidebar-open');
    };
  }, []);
    const handleCopy = async () => {
    try {
      let contentToCopy = '';
      
      if (mode === 'thinking-process') {
        // Copy the complete report for thinking process mode
        contentToCopy = generateCompleteReport();
      } else {
        // Copy the formatted code for regular mode
        contentToCopy = formattedCode;
      }
      
      const success = await safeClipboardCopy(contentToCopy);
      if (success) {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (err) {
      console.error('Error copying content:', err);
    }
  };
    const handleDownload = () => {
    let contentToDownload = '';
    let fileExtension = '';
    
    if (mode === 'thinking-process' && reportData) {
      // Generate comprehensive report
      contentToDownload = generateCompleteReport();
      fileExtension = editableFileName.endsWith('.md') ? '.md' : '.md';
    } else {
      // Regular code download
      contentToDownload = code;
      const extension = editableFileName.includes('.') ? '' : `.${language}`;
      fileExtension = extension;
    }
    
    const blob = new Blob([contentToDownload], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = editableFileName + fileExtension;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const generateCompleteReport = () => {
    let report = `# Scraping System - Complete Report\n\n`;
    report += `**Generated on:** ${new Date().toLocaleString()}\n\n`;
    
    // Thinking Process Section
    report += `## 🧠 Thinking Process\n\n`;
    thinkingSteps.forEach((step, index) => {
      report += `### Step ${index + 1}: ${step.title}\n`;
      report += `**Status:** ${step.status}\n`;
      report += `**Description:** ${step.description}\n`;
      if (step.sources.length > 0) {
        report += `**Sources:**\n`;
        step.sources.forEach(source => {
          report += `- ${source}\n`;
        });
      }
      report += `\n`;
    });
    
    // Sources Section
    const allSources = [...new Set(thinkingSteps.flatMap(step => step.sources))];
    if (allSources.length > 0) {
      report += `## 📚 All Sources Used\n\n`;
      allSources.forEach((source, index) => {
        report += `${index + 1}. ${source}\n`;
      });
      report += `\n`;
    }
    
    // Data Section
    if (reportData) {
      report += `## 📊 Report Data\n\n`;
      if (typeof reportData === 'object') {
        report += `\`\`\`json\n${JSON.stringify(reportData, null, 2)}\n\`\`\`\n\n`;
      } else {
        report += reportData + '\n\n';
      }
    }
    
    // Code Section
    if (code) {
      report += `## 💻 Generated Code\n\n`;
      report += `\`\`\`${language}\n${code}\n\`\`\`\n\n`;
    }
    
    report += `---\n*Report generated by Tetika Scraping System*\n`;
    return report;
  };

  const renderDataTable = (data: unknown) => {
    if (!data || typeof data !== 'object') return null;
    
    // Handle array of objects (typical JSON data structure)
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
      const headers = Object.keys(data[0] as Record<string, unknown>);
      return (
        <div className="overflow-x-auto">
          <table className={`w-full border-collapse border ${
            theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
          }`}>
            <thead>
              <tr className={theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}>
                {headers.map(header => (
                  <th key={header} className={`border p-2 text-left ${
                    theme === 'dark' ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-700'
                  }`}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row: Record<string, unknown>, index: number) => (
                <tr key={index} className={index % 2 === 0 ? (
                  theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-50'
                ) : ''}>
                  {headers.map(header => (
                    <td key={header} className={`border p-2 ${
                      theme === 'dark' ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'
                    }`}>
                      {typeof row[header] === 'object' ? JSON.stringify(row[header]) : String(row[header] || '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    
    // Handle single object
    if (typeof data === 'object' && !Array.isArray(data)) {
      return (
        <div className="overflow-x-auto">
          <table className={`w-full border-collapse border ${
            theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
          }`}>
            <thead>
              <tr className={theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}>
                <th className={`border p-2 text-left ${
                  theme === 'dark' ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-700'
                }`}>
                  Property
                </th>
                <th className={`border p-2 text-left ${
                  theme === 'dark' ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-700'
                }`}>
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data as Record<string, unknown>).map(([key, value], index) => (
                <tr key={key} className={index % 2 === 0 ? (
                  theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-50'
                ) : ''}>
                  <td className={`border p-2 font-medium ${
                    theme === 'dark' ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-700'
                  }`}>
                    {key}
                  </td>
                  <td className={`border p-2 ${
                    theme === 'dark' ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'
                  }`}>
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value || '')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    
    return null;
  };
  
  const formatCode = (code: string, language: string): string => {
    // Add basic formatting based on language
    // This is a simple implementation - in a production app,
    // you might want to use a proper code formatter library
    if (!code) return '';
    
    // Format JSON with proper indentation
    if (language.toLowerCase() === 'json') {
      try {
        const parsedJson = JSON.parse(code);
        return JSON.stringify(parsedJson, null, 2);
      } catch {
        // If parsing fails, return the original code
        return code;
      }
    }
    
    return code;
  };
  
  // Format the code when it loads
  const formattedCode = formatCode(code, language);

  return (
    <div 
      className={`fixed inset-y-0 right-0 z-20 shadow-xl
      transition-all duration-300 transform border-l overflow-hidden
      ${theme === 'dark' 
        ? 'bg-gray-900 border-gray-700' 
        : 'bg-white border-gray-200'}
      ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      ${isMounted ? 'block' : 'hidden'}
      md:w-[55%] lg:w-[45%] xl:w-[38%] w-full`}
    >      {/* Header */}
      <div className={`flex flex-col gap-2 md:gap-3 justify-between px-2 md:px-4 py-2 md:py-3 border-b sticky top-0 z-30
        ${theme === 'dark' 
          ? 'border-gray-700 bg-gray-800/95 backdrop-blur-sm' 
          : 'border-gray-200 bg-gray-50/95 backdrop-blur-sm'}`}>
        
        {/* Title Area */}
        <div className="flex items-center gap-3 w-full">
          <h3 className={`font-medium truncate
            ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
            {mode === 'thinking-process' ? 'Thinking Process' : 'Aperçu du code'}
          </h3>
          
          <div className={`flex items-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} px-2 py-1 rounded-full text-xs`}>
            {mode === 'thinking-process' ? 'SCRAPING' : language}
          </div>
        </div>

        {/* Tabs for thinking process mode */}
        {mode === 'thinking-process' && (
          <div className="flex border-b">
            {(['thinking', 'sources', 'report'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? theme === 'dark'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-blue-500 text-blue-600'
                    : theme === 'dark'
                      ? 'border-transparent text-gray-400 hover:text-gray-300'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'thinking' ? '🧠 Process' : tab === 'sources' ? '📚 Sources' : '📊 Report'}
              </button>
            ))}
          </div>
        )}
        
        {/* Controls row - file name field next to buttons */}
        <div className="flex items-center justify-between gap-2 w-full">
          {/* Input field taking available space */}
          <input
            type="text"
            value={editableFileName}
            onChange={(e) => setEditableFileName(e.target.value)}
            className={`text-sm px-2 py-1 rounded border flex-1
              ${theme === 'dark' 
                ? 'bg-gray-800 border-gray-700 text-gray-300' 
                : 'bg-white border-gray-300 text-gray-700'}`}
            placeholder="Nom du fichier"
          />
          
          {/* Buttons group */}
          <div className="flex items-center flex-shrink-0">
            <button
              onClick={handleCopy}
              className={`p-2 rounded-l-md hover:bg-opacity-70 transition-all border-r
                ${theme === 'dark' 
                  ? 'bg-gray-700 hover:bg-gray-600 text-blue-400 border-gray-600' 
                  : 'bg-gray-200 hover:bg-gray-300 text-blue-600 border-gray-300'}`}
              title={isCopied ? "Copié !" : mode === 'thinking-process' ? "Copier le rapport" : "Copier le code"}
            >
              {isCopied ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
              )}
            </button>
            
            <button
              onClick={handleDownload}
              className={`p-2 border-r hover:bg-opacity-70 transition-all
                ${theme === 'dark' 
                  ? 'bg-gray-700 hover:bg-gray-600 text-blue-400 border-gray-600' 
                  : 'bg-gray-200 hover:bg-gray-300 text-blue-600 border-gray-300'}`}
              title={mode === 'thinking-process' ? "Télécharger le rapport complet" : "Télécharger le code"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </button>
            
            <button
              onClick={handleClose}
              className={`p-2 rounded-r-md hover:bg-opacity-70 transition-all
                ${theme === 'dark' 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-800'}`}
              title="Fermer"
              aria-label="Fermer la barre latérale de code"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>      
      {/* Content */}
      <div className="h-[calc(100%-140px)] md:h-[calc(100%-140px)] overflow-y-auto">
        {mode === 'thinking-process' ? (
          <div className="p-4">
            {activeTab === 'thinking' && (
              <div className="space-y-4">
                <h4 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                  🧠 Thinking Process Steps
                </h4>
                {thinkingSteps.length === 0 ? (
                  <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    <div className="animate-pulse">
                      <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-blue-500 opacity-75"></div>
                      <p>Initializing thinking process...</p>
                    </div>
                  </div>
                ) : (
                  thinkingSteps.map((step) => (
                    <div key={step.id} className={`border rounded-lg p-4 ${
                      theme === 'dark' 
                        ? 'border-gray-700 bg-gray-800/50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          step.status === 'completed' 
                            ? 'bg-green-500 text-white' 
                            : step.status === 'in-progress'
                              ? 'bg-blue-500 text-white animate-pulse'
                              : 'bg-red-500 text-white'
                        }`}>
                          {step.status === 'completed' ? '✓' : step.status === 'in-progress' ? '⟳' : '✗'}
                        </div>
                        <div className="flex-1">
                          <h5 className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                            {step.title}
                          </h5>
                          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            {step.description}
                          </p>
                          {step.sources.length > 0 && (
                            <div className="mt-2">
                              <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                Sources ({step.sources.length}):
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {step.sources.slice(0, 3).map((source, idx) => (
                                  <span
                                    key={idx}
                                    className={`text-xs px-2 py-1 rounded-full ${
                                      theme === 'dark' 
                                        ? 'bg-blue-900/50 text-blue-300' 
                                        : 'bg-blue-100 text-blue-700'
                                    }`}
                                    title={source}
                                  >
                                    {source.length > 30 ? `${source.substring(0, 30)}...` : source}
                                  </span>
                                ))}
                                {step.sources.length > 3 && (
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    theme === 'dark' 
                                      ? 'bg-gray-700 text-gray-300' 
                                      : 'bg-gray-200 text-gray-600'
                                  }`}>
                                    +{step.sources.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          <div className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                            {new Date(step.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'sources' && (
              <div className="space-y-4">
                <h4 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                  📚 All Sources Used
                </h4>
                {(() => {
                  const allSources = [...new Set(thinkingSteps.flatMap(step => step.sources))];
                  return allSources.length === 0 ? (
                    <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      No sources available yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {allSources.map((source, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${
                            theme === 'dark' 
                              ? 'border-gray-700 bg-gray-800/30' 
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className={`text-sm font-bold px-2 py-1 rounded ${
                              theme === 'dark' 
                                ? 'bg-blue-900/50 text-blue-300' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              <p className={`text-sm break-all ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                                {source}
                              </p>
                              {source.startsWith('http') && (
                                <a
                                  href={source}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`text-xs mt-1 inline-flex items-center gap-1 ${
                                    theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                                  }`}
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  Open
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === 'report' && (
              <div className="space-y-4">
                <h4 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                  📊 Report Data
                </h4>
                {reportData ? (
                  <div className="space-y-4">
                    {/* Data Table */}
                    {renderDataTable(reportData)}
                    
                    {/* Raw JSON for developers */}
                    <details className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      <summary className="cursor-pointer font-medium py-2">
                        🔍 Raw Data (JSON)
                      </summary>
                      <pre className={`mt-2 p-4 rounded-lg overflow-x-auto text-xs ${
                        theme === 'dark' 
                          ? 'bg-gray-900 border border-gray-700' 
                          : 'bg-gray-100 border border-gray-300'
                      }`}>
                        <code>{JSON.stringify(reportData, null, 2)}</code>
                      </pre>
                    </details>
                  </div>
                ) : (
                  <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    No report data available yet.
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // Original code display
          <pre className={`p-4 m-0 h-full overflow-x-auto ${
            theme === 'dark' 
              ? 'bg-gray-900 text-gray-100' 
              : 'bg-gray-50 text-gray-800'
            }`}>
            <code className={language ? `language-${language}` : ''}>
              {formattedCode}
            </code>
          </pre>
        )}
      </div>
    </div>
  );
};

export default CodeSidebar;