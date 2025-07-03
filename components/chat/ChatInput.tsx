import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMode } from '@/types';
import { getRAGProviderById } from '@/lib/rag-providers';

interface ChatInputProps {
  onSendMessage: (message: string, mode: ChatMode, file: File | null) => void;
  loading: boolean;
  theme: 'dark' | 'light';
  ragMode: boolean;
  selectedRAGProvider?: string;
  onRagModeChange: (enabled: boolean) => void;
  onRAGProviderChange?: (provider: string) => void;
  onFileUploadClick: () => void;
  selectedFile: File | null;
  onCancelFileUpload: () => void;
  _previousMessages?: { role: string; content: string }[];
  onInputFocus?: () => void;
  onStopGeneration?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  loading,
  theme,
  ragMode,
  selectedRAGProvider,
  onRagModeChange,
  onRAGProviderChange,
  onFileUploadClick,
  selectedFile,
  onCancelFileUpload,
  // Removed unused previousMessages parameter by prefixing with underscore
  onInputFocus,
  onStopGeneration
}) => {
  const [message, setMessage] = useState('');
  const [showAtMenu, setShowAtMenu] = useState(false);
  const [atMenuPosition, setAtMenuPosition] = useState({ top: 0, left: 0 });
  const [lastAtIndex, setLastAtIndex] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const handleSendMessage = useCallback(() => {
    if (message.trim()) {
      onSendMessage(message, ragMode ? 'rag' : 'standard', selectedFile);
      setMessage('');
    }
  }, [message, ragMode, selectedFile, onSendMessage]);
  
  // Handle "@" menu functionality
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    setMessage(newValue);
    
    // Check if "@" was just typed
    const lastChar = newValue[cursorPosition - 1];
    if (lastChar === '@') {
      setLastAtIndex(cursorPosition - 1);
      setShowAtMenu(true);
        // Calculate menu position (above the textarea)
      const textarea = textareaRef.current;
      if (textarea) {
        const rect = textarea.getBoundingClientRect();
        setAtMenuPosition({
          top: rect.top - 80, // Position above the textarea
          left: rect.left + 10
        });
      }
    } else {
      // Hide menu if we move away from "@" or continue typing
      const atPosition = newValue.lastIndexOf('@', cursorPosition - 1);
      if (atPosition === -1 || cursorPosition - atPosition > 10) {
        setShowAtMenu(false);
      }
    }
  };
  
  // Handle menu item selection
  const handleScrapingSystemSelect = () => {
    // Replace "@" with "@scraper " in the message and add helpful template
    const beforeAt = message.substring(0, lastAtIndex);
    const afterAt = message.substring(lastAtIndex + 1);
    const newMessage = beforeAt + "@scraper " + afterAt;
    
    setMessage(newMessage);
    setShowAtMenu(false);
    
    // Automatically enable RAG mode and set provider to Fetch MCP
    onRagModeChange(true);
    if (onRAGProviderChange) {
      onRAGProviderChange('fetch-mcp');
      // Also save to localStorage
      localStorage.setItem('tetika-rag-provider', 'fetch-mcp');
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('rag-provider-changed', { 
        detail: { providerId: 'fetch-mcp' } 
      }));
    }
    
    // Focus back to textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Position cursor at the end
      setTimeout(() => {
        if (textareaRef.current) {
          const newPos = beforeAt.length + 9; // Length of "@scraper "
          textareaRef.current.setSelectionRange(newPos, newPos);
        }
      }, 0);
    }
  };
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAtMenu && textareaRef.current && !textareaRef.current.contains(event.target as Node)) {
        const menuElement = document.getElementById('at-menu');
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setShowAtMenu(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAtMenu]);
  
  // Get the current RAG provider info
  const currentProvider = selectedRAGProvider ? getRAGProviderById(selectedRAGProvider) : null;

  // Debug temporaire pour voir la valeur du provider
  useEffect(() => {
    console.log('[ChatInput] selectedRAGProvider:', selectedRAGProvider);
    console.log('[ChatInput] currentProvider:', currentProvider);
  }, [selectedRAGProvider, currentProvider]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !loading) {
        e.preventDefault();
        if (message.trim()) {
          handleSendMessage();
        }
      }
    };

    const currentTextarea = textareaRef.current;

    if (currentTextarea) {
      currentTextarea.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (currentTextarea) {
        currentTextarea.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [message, loading, handleSendMessage]);

  useEffect(() => {
    const handleFocus = () => {
      if (onInputFocus) {
        onInputFocus();
      }
    };

    const currentTextarea = textareaRef.current;
    if (currentTextarea) {
      currentTextarea.addEventListener('focus', handleFocus);
    }

    return () => {
      if (currentTextarea) {
        currentTextarea.removeEventListener('focus', handleFocus);
      }
    };  }, [onInputFocus]);

  // Remove the handleSendMessage function since we've moved it above as a useCallback

  return (
    <form onSubmit={(e) => e.preventDefault()} className="relative py-0.5 pb-6 sm:pb-8 md:pb-4 mx-3 sm:mx-4">      <div className="flex items-center justify-end mb-2 gap-2">
        {/* Info tooltip for @ menu */}
        <div className="group relative">
          <div className={`p-1.5 rounded-full cursor-help transition-all duration-200
            ${theme === 'dark' 
              ? 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/70 hover:text-blue-300' 
              : 'bg-gray-100/70 text-gray-500 hover:bg-gray-200/80 hover:text-blue-600'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          {/* Tooltip */}
          <div className={`absolute bottom-full right-0 mb-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50
            ${theme === 'dark'
              ? 'bg-gray-800 text-gray-200 border border-gray-700'
              : 'bg-white text-gray-700 border border-gray-200 shadow-lg'}`}>
            Tapez <span className="font-mono bg-blue-100 text-blue-700 px-1 rounded">@</span> pour accéder au menu rapide
            <div className={`absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent
              ${theme === 'dark' ? 'border-t-gray-800' : 'border-t-white'}`}></div>
          </div>
        </div>

        <div
          onClick={() => onRagModeChange(!ragMode)}
          className={`relative flex items-center cursor-pointer gap-1.5 rounded-full px-2.5 py-1 transition-all duration-300 backdrop-blur-sm
            ${ragMode
              ? theme === 'dark'
                ? 'bg-gradient-to-r from-blue-600/40 to-cyan-500/40 border border-blue-500/60 shadow-md shadow-blue-500/30'
                : 'bg-gradient-to-r from-blue-200/90 to-cyan-200/90 border border-blue-300/70 shadow-md shadow-blue-300/30'
              : theme === 'dark'
                ? 'bg-gray-800/70 border border-gray-700/80 hover:bg-gray-700/50'
                : 'bg-gray-100/90 border border-gray-200/70 hover:bg-gray-200/70'
            }`}
        >
          <span className={`text-xs font-medium tracking-wider transition-all duration-300
            ${ragMode
              ? theme === 'dark' ? 'text-blue-200' : 'text-blue-700'
              : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {ragMode ? (currentProvider?.name || 'RAG') : 'STD'}
          </span>

          <div className={`relative w-8 h-4 flex items-center transition-all duration-300 rounded-full
            ${ragMode
              ? theme === 'dark' ? 'bg-gradient-to-r from-blue-700 to-cyan-600' : 'bg-gradient-to-r from-blue-400 to-cyan-400'
              : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}>
            <span className={`absolute w-3 h-3 rounded-full transition-all duration-300 transform shadow-md
              ${ragMode
                ? 'translate-x-5 bg-white'
                : 'translate-x-0.5 bg-gray-100'}`}
            />
          </div>

          {ragMode && (
            <>
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping opacity-60"></span>
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            </>
          )}
        </div>
      </div>

      {selectedFile && (
        <div className={`flex items-center gap-1.5 p-1.5 mb-1.5 rounded-lg backdrop-blur-sm
          ${theme === 'dark'
            ? 'bg-blue-900/20 border border-blue-700/50 shadow-sm shadow-blue-500/10'
            : 'bg-blue-50/90 border border-blue-200 shadow-sm shadow-blue-300/10'}`}
        >
          <div className={`p-1 rounded
            ${theme === 'dark' ? 'bg-blue-800/40 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-medium truncate ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
              {selectedFile.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancelFileUpload}
            className={`p-1 rounded-full transition-all
              ${theme === 'dark'
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/70'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/70'}`}
            title="Annuler"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}      <div className={`flex items-center gap-0 relative transition-all duration-200 rounded-2xl overflow-hidden backdrop-blur-sm shadow-lg
        ${ragMode
          ? theme === 'dark'
            ? 'shadow-[0_0_15px_rgba(6,182,212,0.15)] border border-blue-700/50 bg-gradient-to-r from-gray-900/90 via-gray-800/80 to-gray-900/90'
            : 'shadow-[0_0_15px_rgba(6,182,212,0.08)] border border-blue-200/80 bg-gradient-to-r from-white/95 via-blue-50/60 to-white/95'
          : theme === 'dark'
            ? 'shadow-[0_0_10px_rgba(30,41,59,0.3)] border border-gray-700/80 bg-gray-900/80'
            : 'shadow-[0_0_10px_rgba(241,245,249,0.5)] border border-gray-200/80 bg-white/95'}`}>          {/* Le bouton des paramètres a été déplacé directement dans le corps de l'application */}
        
        <button
          type="button"
          onClick={onFileUploadClick}
          className={`h-auto self-stretch px-2 sm:px-3 flex items-center justify-center transition-all duration-300
            ${theme === 'dark'
              ? 'bg-gray-800/80 hover:bg-gray-700/80 text-gray-400 hover:text-cyan-300 border-r border-gray-700/80'
              : 'bg-gray-100/80 hover:bg-gray-200/80 text-gray-500 hover:text-cyan-600 border-r border-gray-200/80'}`}          title="Ajouter un fichier"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-4.5 sm:w-4.5 transform transition-all file-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>        <div className="relative w-full">
          <textarea
            ref={textareaRef}
            className={`w-full resize-none py-2 px-3 transition-colors duration-200 focus:ring-0 min-h-[40px] max-h-[80px]
              ${theme === 'dark'
                ? 'bg-transparent text-white placeholder-gray-400 focus:outline-none'
                : 'bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none'}`}            placeholder={selectedFile
              ? `Décrire...`
              : ragMode
                ? `Posez votre question...`
                : `Écrivez un message...`}
            value={message}
            onChange={handleMessageChange}
            disabled={loading}
            rows={1}
          />
          {ragMode && (
            <div className={`absolute bottom-0.5 left-3 right-3 h-0.5 opacity-30 rounded-full overflow-hidden
              ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div className={`h-full w-1/4 ${theme === 'dark' ? 'bg-cyan-500' : 'bg-cyan-400'} animate-pulse-slow`}></div>
            </div>
          )}
        </div>
        {loading ? (
          <button
            type="button"
            onClick={onStopGeneration}
            className={`h-auto self-stretch px-3 sm:px-4 flex items-center justify-center flex-shrink-0 transition-colors
              ${theme === 'dark'
                ? 'bg-red-600/80 hover:bg-red-700 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'}`}
            title="Arrêter la génération"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <button
            className={`h-auto self-stretch px-3 sm:px-4 flex items-center justify-center flex-shrink-0 transition-all duration-300 disabled:opacity-50 group
              ${message.trim() && !loading
                ? selectedFile
                  ? `bg-gradient-to-br from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white shadow-inner`
                  : ragMode
                    ? `bg-gradient-to-br from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-inner`
                    : `bg-gradient-to-br from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-inner`
                : theme === 'dark'
                  ? 'bg-gray-800/90 text-gray-400 hover:bg-gray-700/90 hover:text-gray-300'
                  : 'bg-gray-100/90 text-gray-400 hover:bg-gray-200/90 hover:text-gray-500'}`}
            onClick={handleSendMessage}
            disabled={!message.trim()}
            type="button"
            aria-label="Envoyer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 sm:h-5 sm:w-5 transition-all duration-300 ${message.trim() && !loading ? 'transform group-hover:translate-x-1' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
            {message.trim() && !loading && ragMode && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-70"></span>
            )}
          </button>        )}
      </div>
        {/* "@" Menu Popup */}
      {showAtMenu && (
        <div
          id="at-menu"
          className={`fixed z-50 min-w-48 rounded-lg shadow-lg backdrop-blur-sm border transition-all duration-200
            ${theme === 'dark'
              ? 'bg-gray-900/95 border-gray-700/80 shadow-2xl shadow-black/30'
              : 'bg-white/95 border-gray-200/80 shadow-2xl shadow-gray-300/30'}`}          style={{ top: atMenuPosition.top, left: atMenuPosition.left }}
        >
          <div className="p-1">
            <button
              onClick={handleScrapingSystemSelect}
              className={`w-full text-left px-3 py-2 rounded-md transition-all duration-200 flex items-center gap-2 hover:scale-[1.02]
                ${theme === 'dark'
                  ? 'hover:bg-blue-900/40 text-gray-200 hover:text-blue-300'
                  : 'hover:bg-blue-100 text-gray-700 hover:text-blue-700'}`}
            >
              <div className={`p-1.5 rounded-full
                ${theme === 'dark' ? 'bg-blue-800/60' : 'bg-blue-100'}`}>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-4 w-4 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-medium">🤖 @scraper</div>
                <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  AI-powered intelligent web scraping
                </div>
              </div>
              <div className={`text-xs px-2 py-0.5 rounded-full
                ${theme === 'dark' ? 'bg-green-800/60 text-green-300' : 'bg-green-100 text-green-700'}`}>
                RAG
              </div>
            </button>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% {
            transform: scaleX(0.1);
            transform-origin: left;
            opacity: 0.4;
          }
          50% {
            transform: scaleX(1);
            transform-origin: left;
            opacity: 0.8;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite;
        }
        
        .file-icon:hover {
          transform: scale(1.1);
        }
      `}</style>
    </form>
  );
};

export default ChatInput;