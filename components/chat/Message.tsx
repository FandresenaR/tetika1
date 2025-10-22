import React, { useState, createContext, ReactNode, useEffect } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import { Message as MessageType } from '@/types';
import { speakText, stopSpeech, detectLanguage } from '@/lib/speech-utils';
import { SmartRAGSuggestions } from '@/components/ui/SmartRAGSuggestions';
import { getModelById } from '@/lib/models';

// Define the code sidebar context type
interface CodeSidebarContextType {
  showCodeSidebar: boolean;
  setShowCodeSidebar: (value: boolean) => void;
  sidebarCode: { code: string; language: string; fileName: string } | null;
  setSidebarCode: (value: { code: string; language: string; fileName: string } | null) => void;
}

// Create the context with default values
export const CodeSidebarContext = createContext<CodeSidebarContextType>({
  showCodeSidebar: false,
  setShowCodeSidebar: () => {},
  sidebarCode: null,
  setSidebarCode: () => {},
});

// Define the source type to match what's used in the component
type SourceType = {
  title: string;
  link?: string;
  url?: string;
  snippet: string;
  position?: number;
};

interface MessageProps {
  message: MessageType & { 
    mode?: 'rag' | string; 
    sources?: SourceType[];
    autoActivatedRAG?: boolean;
    conversationContext?: Array<{ role: string; content: string }>;
  };
  theme?: 'dark' | 'light';
  onRegenerate?: (messageId: string) => void;
  onRegenerateResponse?: () => void; // Added new prop
  onSuggestionClick?: (suggestion: string) => void; // Pour gérer les clics sur les suggestions RAG
  showBottomSuggestions?: boolean; // Pour contrôler l'affichage des suggestions en bas
}

interface CodeBlockProps {
  language: string;
  value: string;
  index: string;
  theme?: 'dark' | 'light';
}

// Safe clipboard copy function with fallbacks
const safeClipboardCopy = async (text: string): Promise<boolean> => {
  try {
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const textArea = document.createElement('textarea');
    textArea.value = text;

    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    return successful;
  } catch (err) {
    console.error('Copy failed:', err);
    return false;
  }
};

// Composant pour les blocs de code
const CodeBlock: React.FC<CodeBlockProps> = ({ language, value, index, theme = 'dark' }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { setShowCodeSidebar, setSidebarCode } = React.useContext(CodeSidebarContext);

  const handleCopy = async () => {
    try {
      const success = await safeClipboardCopy(value);
      if (success) {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (err) {
      console.error('Copy error:', err);
    }
  };

  const handleDownload = () => {
    const fileExtension = getFileExtension(language);
    const fileName = `code-snippet-${index}.${fileExtension}`;

    const blob = new Blob([value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenInSidebar = () => {
    const fileExtension = getFileExtension(language);
    const fileName = `code-snippet-${index}.${fileExtension}`;

    setSidebarCode({ code: value, language: language || 'text', fileName });
    setShowCodeSidebar(true);
  };

  const getFileExtension = (lang: string): string => {
    const extensionMap: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      jsx: 'jsx',
      tsx: 'tsx',
      html: 'html',
      css: 'css',
      python: 'py',
      java: 'java',
      c: 'c',
      cpp: 'cpp',
      'c++': 'cpp',
      csharp: 'cs',
      'c#': 'cs',
      php: 'php',
      ruby: 'rb',
      go: 'go',
      rust: 'rs',
      swift: 'swift',
      kotlin: 'kt',
      shell: 'sh',
      bash: 'sh',
      json: 'json',
      yaml: 'yaml',
      markdown: 'md',
      sql: 'sql',
    };

    return extensionMap[lang?.toLowerCase()] || 'txt';
  };

  return (
    <div className="my-4 first:mt-0 last:mb-0 w-full">
      <div className={`rounded-xl border overflow-hidden backdrop-blur-sm transition-all duration-300
        ${theme === 'dark' 
          ? 'border-gray-700 shadow-lg shadow-cyan-900/10' 
          : 'border-gray-300 shadow-md shadow-blue-100/20'}`}>
        <div className={`flex items-center justify-between p-2 backdrop-blur-sm
          ${theme === 'dark' 
            ? 'bg-gradient-to-r from-gray-800/90 to-gray-800/70 border-b border-gray-700' 
            : 'bg-gradient-to-r from-gray-100 to-white border-b border-gray-200'}`}>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full
            ${theme === 'dark' 
              ? 'bg-cyan-900/40 text-cyan-300 border border-cyan-800/40' 
              : 'bg-cyan-100 text-cyan-700 border border-cyan-200'}`}>
            {language || 'text'}
          </span>
          <div className="flex space-x-1">
            <button 
              onClick={handleCopy}
              className={`p-1.5 rounded-md transition-all duration-300 hover:scale-105
                ${theme === 'dark' 
                  ? 'bg-gray-700/80 hover:bg-gray-600/80 text-cyan-400 hover:text-cyan-300'
                  : 'bg-gray-200/80 hover:bg-gray-300/80 text-cyan-600 hover:text-cyan-700'}`}
              title={isCopied ? "Copié !" : "Copier"}
            >
              {isCopied ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
              )}
            </button>
            
            <button 
              onClick={handleDownload}
              className={`p-1.5 rounded-md transition-all duration-300 hover:scale-105
                ${theme === 'dark' 
                  ? 'bg-gray-700/80 hover:bg-gray-600/80 text-blue-400 hover:text-blue-300'
                  : 'bg-gray-200/80 hover:bg-gray-300/80 text-blue-600 hover:text-blue-700'}`}
              title="Télécharger le code"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            
            <button 
              onClick={handleOpenInSidebar}
              className={`p-1.5 rounded-md transition-all duration-300 hover:scale-105
                ${theme === 'dark' 
                  ? 'bg-gray-700/80 hover:bg-gray-600/80 text-purple-400 hover:text-purple-300'
                  : 'bg-gray-200/80 hover:bg-gray-300/80 text-purple-600 hover:text-purple-700'}`}
              title="Ouvrir dans la barre latérale"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
            
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`p-1.5 rounded-md transition-all duration-300 hover:scale-105
                ${theme === 'dark' 
                  ? 'bg-gray-700/80 hover:bg-gray-600/80 text-cyan-400 hover:text-cyan-300'
                  : 'bg-gray-200/80 hover:bg-gray-300/80 text-cyan-600 hover:text-cyan-700'}`}
              title={isCollapsed ? "Développer le code" : "Réduire le code"}
            >
              {isCollapsed ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {isCollapsed ? (
          <div 
            className={`p-3 rounded-md cursor-pointer flex items-center transition-all duration-300
              ${theme === 'dark' 
                ? 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
            onClick={() => setIsCollapsed(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span>Code {language ? `${language} ` : ''}replié (cliquez pour développer)</span>
          </div>
        ) : (
          <pre className={`p-4 rounded-md overflow-x-auto mt-0
            ${theme === 'dark' 
              ? 'bg-gradient-to-b from-gray-900 to-black text-gray-100'
              : 'bg-gradient-to-b from-gray-50 to-white text-gray-800'}`}>
            <code className={language ? `language-${language}` : ''}>
              {value}
            </code>
          </pre>
        )}
      </div>
    </div>
  );
};

// Define P and Code component prop types that match react-markdown expectations
interface PProps {
  children?: ReactNode;
  className?: string;
  [key: string]: unknown;
}

interface CodeProps {
  inline?: boolean;
  className?: string;
  children?: ReactNode;
  [key: string]: unknown;
}

// Define helper function to get URL from source
const getSourceUrl = (source: SourceType): string => {
  return source?.url || source?.link || '#';
};

export const Message: React.FC<MessageProps> = ({ message, theme = 'dark', onRegenerate, onRegenerateResponse, onSuggestionClick }) => {  
  const [showSources, setShowSources] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);  
  const [isCopiedMessage, setIsCopiedMessage] = useState(false);
  // New state for RAG suggestions
  const [showRagSuggestions, setShowRagSuggestions] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState<'fr-FR' | 'en-US' | null>(null);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [forcedLanguage, setForcedLanguage] = useState<'fr-FR' | 'en-US' | null>(null);
  const isAI = message.role === 'assistant';
  const hasSources = message.sources && message.sources.length > 0;
  const isRagMode = message.mode === 'rag';
  const isAutoRAG = isRagMode && message.autoActivatedRAG;

  const isShortMessage = !isAI && message.content && message.content.length < 50;

  const timestamp = new Date(message.timestamp);
  const formattedDate = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleCopyMessage = async () => {
    if (message.content) {
      try {
        const success = await safeClipboardCopy(message.content);
        if (success) {
          setIsCopiedMessage(true);
          setTimeout(() => setIsCopiedMessage(false), 2000);
        }
      } catch (err) {
        console.error('Error copying message:', err);
      }
    }
  };
  const handleRegenerate = () => {
    if (onRegenerate && message.id) {
      onRegenerate(message.id);
    } else if (onRegenerateResponse) {
      onRegenerateResponse();
    }
  };
  // Handle text-to-speech functionality
  const handleSpeakMessage = () => {
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
      setSpeechLanguage(null);
    } else {
      if (message.content) {
        // Use forced language or detect language before speaking
        const langToUse = forcedLanguage || detectLanguage(message.content);
        setSpeechLanguage(langToUse as 'fr-FR' | 'en-US');
        
        // Speak the text
        speakText(message.content, langToUse);
        setIsSpeaking(true);
      }
    }
  };
    // Function to change the forced language
  const handleSetLanguage = (lang: 'fr-FR' | 'en-US' | null) => {
    setForcedLanguage(lang);
    setShowLanguageSelector(false);
      // If currently speaking, restart with the new language
    if (isSpeaking && message.content) {
      stopSpeech();
      setTimeout(() => {
        const langToUse = lang || detectLanguage(message.content);
        setSpeechLanguage(langToUse as 'fr-FR' | 'en-US' | null);
        speakText(message.content, langToUse);
      }, 100);
    }
  };  // Update the speaking state if speech ends
  useEffect(() => {
    const checkSpeechStatus = () => {
      if (!window.speechSynthesis.speaking && isSpeaking) {
        setIsSpeaking(false);
        setSpeechLanguage(null);
      }
    };
    
    const interval = setInterval(checkSpeechStatus, 100);
    return () => {
      clearInterval(interval);
      // Stop speech if component unmounts while speaking
      if (isSpeaking) {
        stopSpeech();
        setSpeechLanguage(null);
      }
    };
  }, [isSpeaking]);
    // Handle click outside the language selector to close it
  useEffect(() => {
    if (!showLanguageSelector) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click is outside the dropdown
      const target = event.target as Node;
      const dropdownContainer = document.querySelector('.language-selector-dropdown');
      
      if (dropdownContainer && !dropdownContainer.contains(target)) {
        setShowLanguageSelector(false);
      }
    };
    
    // Add the event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up the event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageSelector]);

  const renderFileIndicator = () => {
    if (!message.attachedFile) return null;

    return (
      <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full
        ${theme === 'dark' ? 'text-green-300 bg-green-900/20 border border-green-800/30' : 'text-green-700 bg-green-100 border border-green-200/50'}`}
        title={`Fichier: ${message.attachedFile.name} (${(message.attachedFile.size / 1024).toFixed(2)} KB)`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-xs truncate max-w-[100px]">{message.attachedFile.name}</span>
      </span>
    );
  };  const processMessageContent = () => {
    // Gestion robuste des messages vides ou invalides
    if (!message.content || message.content.trim() === '') {
      // Si le message est vide, afficher un indicateur de chargement ou message par défaut
      if (isAI) {
        return (
          <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} italic`}>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Génération en cours...
          </div>
        );
      }
      return <p className="text-sm opacity-70">(Message vide)</p>;
    }

    // If no sources, use normal ReactMarkdown which will handle code blocks properly
    if (!message.sources || message.sources.length === 0) {
      return <ReactMarkdown remarkPlugins={[]} components={MarkdownComponents as Components}>{message.content}</ReactMarkdown>;
    }    // For RAG mode with sources, we need to carefully process the content while preserving code blocks
    // First, let's check if there are code blocks and handle them specially
    const hasCodeBlocks = message.content.includes('```');
    
    if (hasCodeBlocks) {
      // Split content into segments, preserving code blocks as complete units
      const segments: Array<{ type: 'text' | 'code'; content: string }> = [];
      const lines = message.content.split('\n');
      let currentSegment: string[] = [];
      let inCodeBlock = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.trim().startsWith('```')) {
          if (!inCodeBlock) {
            // Starting a code block
            if (currentSegment.length > 0) {
              segments.push({ type: 'text', content: currentSegment.join('\n') });
              currentSegment = [];
            }
            inCodeBlock = true;
            currentSegment.push(line);
          } else {
            // Ending a code block
            currentSegment.push(line);
            segments.push({ type: 'code', content: currentSegment.join('\n') });
            currentSegment = [];
            inCodeBlock = false;
          }
        } else {
          currentSegment.push(line);
        }
      }
      
      // Add any remaining content
      if (currentSegment.length > 0) {
        segments.push({ 
          type: inCodeBlock ? 'code' : 'text', 
          content: currentSegment.join('\n') 
        });
      }
      
      // Process each segment
      const processedSegments = segments.map((segment, index) => {
        if (segment.type === 'code') {
          // Render code blocks directly with ReactMarkdown to use our CodeBlock component
          return (
            <div key={`code-${index}`}>
              <ReactMarkdown components={MarkdownComponents as Components}>
                {segment.content}
              </ReactMarkdown>
            </div>
          );
        } else {
          // Process text segments for source references
          return (
            <div key={`text-${index}`}>
              {processTextSegmentWithSources(segment.content)}
            </div>
          );
        }
      });
      
      return <div className="prose-content">{processedSegments}</div>;
    }

    // No code blocks, process normally for source references
    return processTextSegmentWithSources(message.content);
  };

  // Helper function to process text content with source references
  const processTextSegmentWithSources = (content: string) => {
    // Function to determine if a line is only a source reference
    const isSourceReferenceLine = (line: string) => {
      // Check if the line contains only a reference like [1], [2], etc.
      const onlyRefRegex = /^\s*\[(\d+)\]\s*$|^\s*\((\d+)\)\s*$|^\s*(\d+)⃣\s*$|^\s*(\d+)️⃣\s*$/;
      // Check if the line starts with "Source:", "Sources:", etc.
      const sourceHeaderRegex = /^\s*sources?\s*:/i;
      
      return onlyRefRegex.test(line) || sourceHeaderRegex.test(line);
    };    const createReferenceElement = (refNumber: string, index: number) => {
      const numRef = parseInt(refNumber, 10);
      if (numRef > 0 && numRef <= (message.sources?.length || 0)) {
        const source = message.sources?.[numRef - 1];
        if (!source) return <span key={`plain-${index}`}>{`[${refNumber}]`}</span>;
        
        const url = getSourceUrl(source);

        return (
          <span 
            key={`ref-${index}`}
            className={`inline-flex items-center justify-center rounded-full min-w-[1.5rem] h-6 px-1 
              font-medium cursor-pointer transition-all duration-300 mx-0.5
              ${theme === 'dark' 
                ? 'bg-blue-600/80 text-white hover:bg-blue-500/90' 
                : 'bg-blue-400 text-black hover:bg-blue-300'}`}
            onClick={() => {
              if (url && url !== '#') {
                window.open(url, '_blank', 'noopener,noreferrer');
              }
            }}
            title={`Ouvrir la source ${numRef}`}
          >
            {`[${numRef}]`}
          </span>
        );
      }

      return <span key={`plain-${index}`}>{`[${refNumber}]`}</span>;
    };

    // For text content, we still need to handle source references
    // but we need to be more careful about line-by-line processing
    const lines = content.split('\n');
    const processedLines = lines.map((line, lineIndex) => {
      // Skip source-only reference lines
      if (isSourceReferenceLine(line)) {
        return null;
      }

      if (!line.trim()) {
        return <br key={`br-${lineIndex}`} />;
      }

      const cleanedLine = line.replace(/source\s*:/gi, '');

      // Check for source references in this line
      const refRegex = /\[(\d+)\]|\((\d+)\)|(\d+)⃣|(\d+)️⃣/g;
      const refMatches: Array<{fullMatch: string; refNumber: string; index: number}> = [];
      let match;

      while ((match = refRegex.exec(cleanedLine)) !== null) {
        refMatches.push({
          fullMatch: match[0],
          refNumber: match[1] || match[2] || match[3] || match[4],
          index: match.index
        });
      }

      if (refMatches.length === 0) {
        // No references, just render the line as markdown
        return (
          <div key={`line-${lineIndex}`}>
            <ReactMarkdown components={MarkdownComponents as Components}>
              {cleanedLine}
            </ReactMarkdown>
          </div>
        );
      }

      // Process the line with references
      const elements: React.ReactElement[] = [];
      let lastIndex = 0;

      refMatches.forEach((match, matchIndex) => {
        if (match.index > lastIndex) {
          const textBefore = cleanedLine.substring(lastIndex, match.index);
          if (textBefore.trim()) {
            elements.push(
              <ReactMarkdown key={`text-${lineIndex}-${matchIndex}`} components={MarkdownComponents as Components}>
                {textBefore}
              </ReactMarkdown>
            );
          }
        }

        elements.push(createReferenceElement(match.refNumber, lineIndex * 100 + matchIndex));

        lastIndex = match.index + match.fullMatch.length;
      });

      if (lastIndex < cleanedLine.length) {
        const remainingText = cleanedLine.substring(lastIndex);
        if (remainingText.trim()) {
          elements.push(
            <ReactMarkdown key={`text-${lineIndex}-end`} components={MarkdownComponents as Components}>
              {remainingText}
            </ReactMarkdown>
          );
        }
      }

      return (
        <div key={`line-wrapped-${lineIndex}`} className="markdown-line">
          {elements}
        </div>
      );
    })
    .filter(line => line !== null);

    return <div className="prose-content">{processedLines}</div>;
  };

  const MarkdownComponents = {
    p: ({ children, ...props }: PProps) => {
      // Vérifier si le paragraphe contient des éléments non autorisés comme div ou pre
      // Si oui, utiliser un div à la place d'un p pour éviter les erreurs d'hydratation      // Enhanced check for block elements to prevent hydration errors
      const hasBlockElements = React.Children.toArray(children || []).some(
        (child) => {
          // Check if child is a React element
          if (React.isValidElement(child)) {
            // Check for direct block elements
            if (
              child.type === 'code' || 
              child.type === CodeBlock || 
              child.type === 'div' || 
              child.type === 'pre'
            ) {
              return true;
            }
            
            // Check for nested components that might contain divs
            if (typeof child.type === 'function') {
              // For custom components, assume they might contain block elements
              // to be on the safe side
              return true;
            }            // Check for props.children that might contain nested divs
            if (child.props) {
              // Type assertion to treat props as a Record with potential children
              const props = child.props as Record<string, unknown>;
              if ('children' in props) {
                // If there are nested children, recursively check them
                const nestedChildren = React.Children.toArray(props.children as ReactNode);
                if (nestedChildren.length > 0) {
                  return nestedChildren.some(nestedChild => 
                    React.isValidElement(nestedChild) && 
                    (nestedChild.type === 'div' || nestedChild.type === 'pre')
                  );
                }
              }
            }
          }
          
          // Check for markdown code blocks in string content
          if (typeof child === 'string') {
            return child.includes('```') || child.includes('<div');
          }
          
          return false;
        }
      );      // Safely render either div or p based on content
      return hasBlockElements ? (
        // If block elements detected, use div to avoid HTML nesting errors
        <div className="markdown-paragraph-wrapper" {...props}>{children}</div>
      ) : (
        // Otherwise use p tag as expected for normal paragraphs
        <p {...props}>{children}</p>
      );
    },

    code: ({ inline, className, children, ...props }: CodeProps) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const codeIndex = inline ? '-1' : `${Math.random().toString(36).substring(2, 11)}`;

      // Ne pas utiliser l'élément div pour les blocs de code
      // à la place, retourner directement le CodeBlock pour les non-inline
      if (!inline) {
        return (
          <CodeBlock 
            language={language}
            value={String(children || '').replace(/\n$/, '')}
            index={codeIndex}
            theme={theme}
          />
        );
      }
      
      return (
        <code className={`px-1.5 py-0.5 rounded font-mono text-sm
          ${theme === 'dark' 
            ? 'bg-gray-800/80 text-cyan-400 border border-gray-700/50' 
            : 'bg-gray-100 text-cyan-700 border border-gray-200/50'}`} 
          {...props}
        >
          {children}
        </code>
      );
    }
  };

  const getBgClasses = () => {
    if (isAI) {
      if (isRagMode) {
        return theme === 'dark'
          ? 'bg-gradient-to-br from-blue-900/10 to-cyan-900/10 border-blue-800/30'
          : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200/80';
      }
      return theme === 'dark'
        ? 'bg-gradient-to-br from-gray-900/70 to-gray-800/70 border-gray-700/80'
        : 'bg-white border-gray-200/80';
    } else {
      if (isRagMode) {
        return theme === 'dark'
          ? 'bg-gradient-to-br from-blue-800/20 to-blue-900/20 border-blue-700/30'
          : 'bg-gradient-to-br from-blue-100/90 to-blue-50/90 border-blue-200';
      }
      return theme === 'dark'
        ? 'bg-gradient-to-br from-gray-800/70 to-gray-800/50 border-gray-700'
        : 'bg-gradient-to-br from-gray-100 to-white border-gray-200';
    }
  };

  const getUserIcon = () => {
    const baseClasses = 'flex items-center justify-center rounded-full w-8 h-8 flex-shrink-0';

    if (isRagMode) {
      return (
        <div className={`${baseClasses} ${theme === 'dark' ? 'bg-blue-800/30 text-blue-300' : 'bg-blue-200/80 text-blue-700'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      );
    }

    return (
      <div className={`${baseClasses} ${theme === 'dark' ? 'bg-cyan-800/30 text-cyan-300' : 'bg-cyan-100 text-cyan-700'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
    );
  };

  const getAiIcon = () => {
    const baseClasses = 'flex items-center justify-center rounded-full w-8 h-8 flex-shrink-0';

    if (isRagMode) {
      return (
        <div className={`${baseClasses} ${theme === 'dark' ? 'bg-gradient-to-br from-blue-700/30 to-cyan-700/30 text-blue-300' : 'bg-gradient-to-br from-blue-200 to-cyan-200 text-blue-700'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    }

    return (
      <div className={`${baseClasses} ${theme === 'dark' ? 'bg-gradient-to-br from-blue-800/30 to-indigo-800/30 text-blue-300' : 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
        </svg>
      </div>
    );
  };

  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-6`}>
      <div className={`relative rounded-xl border shadow-sm transition-all duration-300 ${getBgClasses()} ${
        isAI 
          ? 'w-full max-w-full' 
          : isShortMessage
            ? 'w-auto max-w-[85%]' 
            : 'max-w-[85%]'        
      }`}>
        <div className={`p-4 rounded-xl backdrop-blur-sm relative`}>
          <div className="flex items-center mb-3 flex-wrap">
            {isAI ? getAiIcon() : getUserIcon()}            <span className={`ml-2 font-medium text-sm flex items-center gap-1.5
              ${theme === 'dark' ? (isRagMode ? 'text-blue-300' : 'text-gray-200') : (isRagMode ? 'text-blue-700' : 'text-gray-800')}`}>
              {isAI ? (
                <>
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1.5">
                      TETIKA AI
                      {isRagMode && (
                        <span className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {isAutoRAG && (
                            <span className={`ml-1 text-xs rounded-full px-1.5 py-0.5 flex items-center
                              ${theme === 'dark' 
                                ? 'bg-indigo-800/50 text-indigo-300 border border-indigo-700/30' 
                                : 'bg-indigo-100 text-indigo-700 border border-indigo-200/50'}`}>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              Auto
                            </span>
                          )}
                        </span>
                      )}
                    </span>
                    {/* Display model name if available */}
                    {message.modelId && (() => {
                      const model = getModelById(message.modelId);
                      return model ? (
                        <span className={`text-xs opacity-75 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {model.name}
                        </span>
                      ) : null;
                    })()}
                  </div>
                </>
              ) : (
                <>
                  Vous
                  {renderFileIndicator()}
                </>
              )}
            </span>

            <span className={`ml-auto flex items-center text-xs gap-1.5
              ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              {isRagMode && !isAI && (
                <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded
                  ${theme === 'dark' ? 'text-blue-300 bg-blue-900/20' : 'text-blue-700 bg-blue-100'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-4.5-8.5M3 15l4.5-4.5M3 15l4.5 4.5" />
                  </svg>
                  RAG
                </span>
              )}
              {formattedDate}
            </span>
          </div>

          <div className={`prose break-words prose-headings:mt-4 prose-headings:mb-2 
            ${theme === 'dark' 
              ? 'prose-invert prose-code:text-cyan-300 prose-a:text-blue-400 prose-strong:text-blue-300'
              : 'prose-code:text-cyan-700 prose-a:text-blue-600 prose-strong:text-blue-700'} 
            prose-sm prose-pre:p-0 prose-pre:bg-transparent prose-pre:m-0`}
          >
            {processMessageContent()}
          </div>          {isAI && (
            <div className="mt-3 flex items-center gap-2">              {/* Audio controls - separated into two distinct buttons */}
              <div className="relative flex items-center">
                {/* Main audio button */}
                <button 
                  onClick={handleSpeakMessage}
                  className={`text-xs ${theme === 'dark' 
                    ? `${isSpeaking ? 'bg-green-700/60 hover:bg-green-700/80 text-green-200 border border-green-700/40' 
                      : 'bg-green-800/40 hover:bg-green-700/60 text-green-200 border border-green-700/40'}`
                    : `${isSpeaking ? 'bg-green-200 hover:bg-green-300 text-green-800 border border-green-300' 
                      : 'bg-green-100 hover:bg-green-200 text-green-800 border border-green-200'}`} 
                      px-2 py-1 rounded-l flex items-center gap-1 transition-colors`}
                  title={isSpeaking ? "Arrêter la lecture" : "Écouter la réponse"}
                >
                  {isSpeaking ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414-3.536 5 5 0 00-1.414-3.536M2.757 17.657a9 9 0 012.829-14.142" />
                    </svg>
                  )}
                  {isSpeaking ? "Arrêter" : "Écouter"}
                </button>
                
                {/* Language selector button - separate from main button */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLanguageSelector(!showLanguageSelector);
                  }}
                  className={`flex items-center gap-0.5 text-xs rounded-r border-l-0 px-1.5 py-1 text-center ${
                    theme === 'dark' 
                      ? `${isSpeaking ? 'bg-green-700/60 hover:bg-green-700/80 text-green-200 border border-green-700/40' 
                        : 'bg-green-800/40 hover:bg-green-700/60 text-green-200 border border-green-700/40'}`
                      : `${isSpeaking ? 'bg-green-200 hover:bg-green-300 text-green-800 border border-green-300' 
                        : 'bg-green-100 hover:bg-green-200 text-green-800 border border-green-200'}`
                  }`}
                  title="Changer la langue de lecture vocale"
                >
                  {forcedLanguage ? (
                    // If language is forced by user
                    <span className="flex items-center gap-0.5">
                      {forcedLanguage === 'fr-FR' ? (
                        <>
                          <span className="hidden xs:inline">FR</span>
                          <span className="xs:hidden">🇫🇷</span>
                        </>
                      ) : (
                        <>
                          <span className="hidden xs:inline">EN</span>
                          <span className="xs:hidden">🇬🇧</span>
                        </>
                      )}
                    </span>
                  ) : (
                    // Auto-detected language
                    <span className="flex items-center gap-0.5">
                      {speechLanguage ? (
                        speechLanguage === 'fr-FR' ? (
                          <>
                            <span className="hidden xs:inline">FR</span>
                            <span className="xs:hidden">🇫🇷</span>
                          </>
                        ) : (
                          <>
                            <span className="hidden xs:inline">EN</span>
                            <span className="xs:hidden">🇬🇧</span>
                          </>
                        )
                      ) : (
                        <span>Auto</span>
                      )}
                    </span>
                  )}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showLanguageSelector ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                  </svg>
                </button>
              </div>

              {/* Language selector dropdown */}
              {showLanguageSelector && (
                <div className={`absolute z-10 top-full left-0 mt-1 w-44 rounded-md shadow-lg language-selector-dropdown ${
                  theme === 'dark' 
                    ? 'bg-gray-800 border border-gray-700' 
                    : 'bg-white border border-gray-200'
                }`}>
                  <div className="py-1">
                    <div className={`px-3 py-1.5 text-xs font-medium ${
                      theme === 'dark' ? 'text-gray-400 border-b border-gray-700' : 'text-gray-500 border-b border-gray-200'
                    }`}>
                      Langue de lecture vocale
                    </div>
                    
                    <button
                      onClick={() => handleSetLanguage(null)}
                      className={`flex items-center gap-2 px-4 py-2 text-xs w-full text-left transition-colors ${
                        forcedLanguage === null
                          ? (theme === 'dark' ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800')
                          : (theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100')
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l2.879-2.879M8 16l3.636 3.636M8 16h12M4 8l3.636-3.636M4 8l2.879 2.879M4 8h12" />
                      </svg>
                      <span>Auto-détection</span>
                    </button>
                    
                    <button
                      onClick={() => handleSetLanguage('fr-FR')}
                      className={`flex items-center gap-2 px-4 py-2 text-xs w-full text-left transition-colors ${
                        forcedLanguage === 'fr-FR'
                          ? (theme === 'dark' ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800')
                          : (theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100')
                      }`}
                    >
                      <span className="w-5 flex justify-center">🇫🇷</span>
                      <span>Français (FR)</span>
                    </button>
                    
                    <button
                      onClick={() => handleSetLanguage('en-US')}
                      className={`flex items-center gap-2 px-4 py-2 text-xs w-full text-left transition-colors ${
                        forcedLanguage === 'en-US'
                          ? (theme === 'dark' ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800')
                          : (theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100')
                      }`}
                    >
                      <span className="w-5 flex justify-center">🇬🇧</span>
                      <span>English (EN)</span>
                    </button>
                  </div>
                </div>
              )}
              
              <button 
                onClick={handleCopyMessage}
                className={`text-xs ${theme === 'dark'
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'} 
                  px-2 py-1 rounded flex items-center gap-1 transition-colors`}
                title="Copier le message"
              >
                {isCopiedMessage ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copié
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 012 2h2a2 2 0 002-2M8 5a 2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Copier
                  </>
                )}
              </button>

              {(onRegenerate || onRegenerateResponse) && (
                <button 
                  onClick={handleRegenerate}
                  className={`text-xs ${theme === 'dark' 
                    ? 'bg-blue-800/40 hover:bg-blue-700/40 text-blue-300 border border-blue-700/40' 
                    : 'bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200'} 
                    px-2 py-1 rounded flex items-center gap-1 transition-colors`}
                  title="Régénérer la réponse"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>                  Régénérer
                </button>
              )}              {/* "Questions RAG" button removed */}
            </div>
          )}          {isAI && hasSources && (
            <div className={`${onRegenerate ? 'mt-2' : 'mt-3'} max-w-3xl`}>              <button 
                onClick={() => setShowSources(!showSources)}
                className={`text-xs ${theme === 'dark' 
                  ? 'bg-blue-900/50 hover:bg-blue-800/50 text-blue-300' 
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-700'} px-2 py-1 rounded flex items-center gap-1 transition-colors`}
              >                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m-1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {showSources ? "Masquer les sources" : "Afficher les sources"}
                {isAutoRAG && (
                  <span className="ml-1 opacity-80">(auto)</span>
                )}
              </button>              {showSources && (
                <div className={`mt-2 text-xs ${theme === 'dark' ? 'border-t border-blue-800/50' : 'border-t border-blue-200'} pt-2`}>
                  <p className={`mb-1 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'} font-medium`}>
                    Sources utilisées:
                  </p>
                  {isAutoRAG && (
                    <p className={`mb-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} italic bg-opacity-20 p-1 rounded ${
                      theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'
                    }`}>                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      La recherche web a été activée automatiquement car l&apos;IA a détecté qu&apos;elle pourrait ne pas avoir les informations les plus à jour sur ce sujet.
                    </p>
                  )}
                  <ul className="space-y-1 ml-4">
                    {message.sources && message.sources.map((source, index) => (
                      <li key={index} className="flex items-center gap-1">
                        <a 
                          href={getSourceUrl(source)} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={`${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} underline`}
                        >
                          {source.title || getSourceUrl(source)}
                        </a>
                        <button 
                          onClick={async () => {
                            try {
                              const sourceUrl = getSourceUrl(source);
                              const success = await safeClipboardCopy(sourceUrl);
                              if (success) {
                                setCopiedIndex(index);
                                setTimeout(() => setCopiedIndex(null), 2000);
                              }
                            } catch (err) {
                              console.error('Error copying source link:', err);
                            }
                          }}
                          className={`ml-1 p-0.5 rounded ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} transition-colors`}
                          title={copiedIndex === index ? "Copié !" : "Copier le lien"}
                        >
                          {copiedIndex === index ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 012 2h2a2 2 0 002-2M8 5a 2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}            </div>
          )}
          
          {/* Bottom RAG suggestions - Added back with collapsible functionality */}
          {isAI && message.role === 'assistant' && message.mode !== 'rag' && onSuggestionClick && (
            <div className="mt-3">
              <button 
                onClick={() => setShowRagSuggestions(!showRagSuggestions)}
                className={`text-xs ${theme === 'dark' 
                  ? 'bg-indigo-900/30 hover:bg-indigo-800/40 text-indigo-300' 
                  : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'} px-2 py-1 rounded flex items-center gap-1 transition-colors`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {showRagSuggestions ? "Masquer les suggestions RAG" : "Afficher les suggestions RAG"}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showRagSuggestions ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                </svg>
              </button>
                <SmartRAGSuggestions 
                isVisible={showRagSuggestions}
                onSuggestionClick={onSuggestionClick}
                theme={theme}
                previousMessages={message.conversationContext}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};