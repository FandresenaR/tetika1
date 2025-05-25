import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMode } from '@/types';
import ContextMenu from '@/components/ui/ContextMenu';

interface ChatInputProps {
  onSendMessage: (message: string, mode: ChatMode, file: File | null) => void;
  loading: boolean;
  theme: 'dark' | 'light';
  ragMode: boolean;
  onRagModeChange: (enabled: boolean) => void;
  onFileUploadClick: () => void;
  selectedFile: File | null;
  onCancelFileUpload: () => void;
  _previousMessages?: { role: string; content: string }[];
  onInputFocus?: () => void;
  onStopGeneration?: () => void;
  onScrapWebsite?: (url: string, prompt: string, mode?: 'content' | 'links' | 'images' | 'all') => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  loading,
  theme,
  ragMode,
  onRagModeChange,  onFileUploadClick,
  selectedFile,
  onCancelFileUpload,
  // Removed unused previousMessages parameter by prefixing with underscore
  onInputFocus,
  onStopGeneration,
  onScrapWebsite
}) => {
  const [message, setMessage] = useState('');  const textareaRef = useRef<HTMLTextAreaElement>(null);  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [cursorPosition, setCursorPosition] = useState(0);  const [scrapingUrl, setScrapingUrl] = useState<string | null>(null);
  const [previousRagMode, setPreviousRagMode] = useState<boolean>(false);
  const [showRagNotification, setShowRagNotification] = useState<boolean>(false);const handleSendMessage = useCallback(() => {
    if (message.trim()) {
      // If we have a scraping URL waiting, execute scraping with the message as prompt
      if (scrapingUrl) {
        if (onScrapWebsite) {
          onScrapWebsite(scrapingUrl, message.trim());
        }
        setScrapingUrl(null);
      } else {
        // Normal message sending
        onSendMessage(message, ragMode ? 'rag' : 'standard', selectedFile);
      }
      setMessage('');
    }
  }, [message, ragMode, selectedFile, onSendMessage, scrapingUrl, onScrapWebsite]);

  // Handle text input changes and detect "@" symbol
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setMessage(newValue);
    setCursorPosition(cursorPos);
    
    // Check if "@" was just typed
    if (newValue[cursorPos - 1] === '@') {
      const rect = e.target.getBoundingClientRect();
      setContextMenuPosition({
        x: rect.left + 20,
        y: rect.top - 150
      });
      setContextMenuVisible(true);
    } else {
      setContextMenuVisible(false);
    }
  }, []);  // Handle context menu scrap mode selection
  const handleScrapModeSelect = useCallback(async (url: string) => {
    setContextMenuVisible(false);
    
    // Set the scraping URL and update the message to prompt for instructions
    setScrapingUrl(url);
    
    // Store the current RAG mode state before changing it
    setPreviousRagMode(ragMode);
      // Automatically activate RAG mode when entering scraping mode
    onRagModeChange(true);
    
    // Show notification about RAG auto-activation
    if (!ragMode) {
      setShowRagNotification(true);
      setTimeout(() => setShowRagNotification(false), 3000); // Hide after 3 seconds
    }
    
    // Remove the "@" from the message and add a scraping indicator
    const beforeAt = message.slice(0, cursorPosition - 1);
    const afterAt = message.slice(cursorPosition);
    setMessage(`${beforeAt}${afterAt}`);    // Update the placeholder to indicate we're waiting for scraping instructions
    if (textareaRef.current) {
      textareaRef.current.placeholder = `Enter instructions for scraping: ${url}`;
    }
  }, [message, cursorPosition, onRagModeChange, ragMode]);
  const handleContextMenuClose = useCallback(() => {
    setContextMenuVisible(false);
  }, []);

  // Handle canceling scraping mode
  const handleCancelScraping = useCallback(() => {
    setScrapingUrl(null);
    // Restore previous RAG mode state when canceling scraping
    onRagModeChange(previousRagMode);
  }, [previousRagMode, onRagModeChange]);

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
    <form onSubmit={(e) => e.preventDefault()} className="relative py-0.5 pb-6 sm:pb-8 md:pb-4 mx-3 sm:mx-4">
      <div className="flex items-center justify-end mb-2 gap-2">
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
            {ragMode ? 'RAG' : 'STD'}
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
          )}        </div>
      </div>

      {/* RAG Auto-activation notification */}
      {showRagNotification && (
        <div className={`flex items-center gap-2 p-2 mb-2 rounded-lg backdrop-blur-sm border-l-4 animate-pulse
          ${theme === 'dark'
            ? 'bg-blue-900/20 border-blue-500 text-blue-300'
            : 'bg-blue-50/90 border-blue-400 text-blue-700'}`}
        >
          <div className={`p-1 rounded ${
            theme === 'dark' ? 'bg-blue-800/40' : 'bg-blue-100'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
              RAG mode automatically activated for scraping
            </p>
          </div>
        </div>
      )}

      {/* Scraping mode indicator */}
      {scrapingUrl && (
        <div className={`flex items-center gap-2 p-2 mb-2 rounded-lg backdrop-blur-sm border-l-4
          ${theme === 'dark'
            ? 'bg-orange-900/20 border-orange-500 text-orange-300'
            : 'bg-orange-50/90 border-orange-400 text-orange-700'}`}
        >
          <div className={`p-1 rounded ${
            theme === 'dark' ? 'bg-orange-800/40' : 'bg-orange-100'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9l7 7" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 9l-7 7" />
            </svg>
          </div>          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-orange-300' : 'text-orange-700'}`}>
              Scraping Mode Active 
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                theme === 'dark' ? 'bg-blue-700/40 text-blue-300' : 'bg-blue-100 text-blue-700'
              }`}>
                RAG AUTO-ON
              </span>
            </p>
            <p className={`text-xs truncate ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>
              URL: {scrapingUrl}
            </p>
          </div>          <button
            type="button"
            onClick={handleCancelScraping}
            className={`p-1 rounded-full transition-all
              ${theme === 'dark'
                ? 'text-orange-400 hover:text-orange-200 hover:bg-orange-800/70'
                : 'text-orange-600 hover:text-orange-800 hover:bg-orange-200/70'}`}
            title="Cancel scraping"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

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
        </button><div className="relative w-full">          <textarea
            ref={textareaRef}
            className={`w-full resize-none py-2 px-3 transition-colors duration-200 focus:ring-0 min-h-[40px] max-h-[80px]
              ${theme === 'dark'
                ? 'bg-transparent text-white placeholder-gray-400 focus:outline-none'
                : 'bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none'}`}
            placeholder={scrapingUrl
              ? `Enter instructions for scraping: ${scrapingUrl}`
              : selectedFile
                ? `Décrire...`
                : ragMode
                  ? `Posez votre question... (type @ for scraping)`
                  : `Écrivez un message... (type @ for scraping)`}
            value={message}
            onChange={handleInputChange}
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
        ) : (          <button
            className={`h-auto self-stretch px-3 sm:px-4 flex items-center justify-center flex-shrink-0 transition-all duration-300 disabled:opacity-50 group
              ${message.trim() && !loading
                ? scrapingUrl
                  ? `bg-gradient-to-br from-orange-600 to-red-500 hover:from-orange-500 hover:to-red-400 text-white shadow-inner`
                  : selectedFile
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
            aria-label={scrapingUrl ? "Start Scraping" : "Envoyer"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 sm:h-5 sm:w-5 transition-all duration-300 ${message.trim() && !loading ? 'transform group-hover:translate-x-1' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
            {message.trim() && !loading && ragMode && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-70"></span>
            )}
          </button>
        )}      </div>
      
      {/* Context Menu */}
      <ContextMenu
        visible={contextMenuVisible}
        position={contextMenuPosition}
        onScrapModeSelect={handleScrapModeSelect}
        onClose={handleContextMenuClose}
        theme={theme}
      />

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
          }        }
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite;
        }
          /* Les styles pour le bouton des paramètres mobile ont été déplacés directement dans le composant */
        
        .file-icon:hover {
          transform: scale(1.1);
        }
      `}</style>
    </form>
  );
};

export default ChatInput;