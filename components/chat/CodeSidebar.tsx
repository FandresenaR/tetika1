import React, { useState, useEffect } from 'react';

interface CodeSidebarProps {
  code: string;
  language: string;
  fileName: string;
  theme?: 'dark' | 'light';
  onClose: () => void;
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
  onClose
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [editableFileName, setEditableFileName] = useState(fileName);
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
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
      const success = await safeClipboardCopy(code);
      if (success) {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (err) {
      console.error('Error copying code:', err);
    }
  };
  
  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = editableFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    >
      {/* Header */}
      <div className={`flex flex-col gap-2 md:gap-3 justify-between px-2 md:px-4 py-2 md:py-3 border-b sticky top-0 z-30
        ${theme === 'dark' 
          ? 'border-gray-700 bg-gray-800/95 backdrop-blur-sm' 
          : 'border-gray-200 bg-gray-50/95 backdrop-blur-sm'}`}>
        
        {/* Title Area */}
        <div className="flex items-center gap-3 w-full">
          <h3 className={`font-medium truncate
            ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
            Aperçu du code
          </h3>
          
          <div className={`flex items-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} px-2 py-1 rounded-full text-xs`}>
            {language}
          </div>
        </div>
        
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
              title={isCopied ? "Copié !" : "Copier le code"}
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
              title="Télécharger le code"
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
      
      {/* Code content */}
      <div className="h-[calc(100%-88px)] md:h-[calc(100%-88px)] overflow-y-auto">
        <pre className={`p-4 m-0 h-full overflow-x-auto ${
          theme === 'dark' 
            ? 'bg-gray-900 text-gray-100' 
            : 'bg-gray-50 text-gray-800'
          }`}>
          <code className={language ? `language-${language}` : ''}>
            {formattedCode}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default CodeSidebar;