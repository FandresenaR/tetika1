import React, { useState, useEffect, useRef } from 'react';

interface ContextMenuProps {
  visible: boolean;
  position: { x: number; y: number };
  onScrapModeSelect: (url: string, mode?: 'content' | 'links' | 'images' | 'all') => void;
  onClose: () => void;
  theme: 'dark' | 'light';
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  visible,
  position,
  onScrapModeSelect,
  onClose,
  theme
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
        setShowUrlInput(false);
        setUrlInput('');
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [visible, onClose]);

  useEffect(() => {
    if (showUrlInput && urlInputRef.current) {
      urlInputRef.current.focus();
    }
  }, [showUrlInput]);

  const handleScrapModeClick = () => {
    setShowUrlInput(true);
  };
  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onScrapModeSelect(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (showUrlInput) {
        setShowUrlInput(false);
        setUrlInput('');
      } else {
        onClose();
      }
    } else if (e.key === 'Enter' && urlInput.trim()) {
      handleUrlSubmit();
    }
  };

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      className={`fixed z-50 min-w-[200px] rounded-lg shadow-lg border backdrop-blur-sm transition-all duration-200 ${
        theme === 'dark'
          ? 'bg-gray-800/95 border-gray-700 text-gray-200'
          : 'bg-white/95 border-gray-200 text-gray-800'
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onKeyDown={handleKeyDown}
    >
      {!showUrlInput ? (
        <div className="p-2">
          <button
            onClick={handleScrapModeClick}
            className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-3 ${
              theme === 'dark'
                ? 'hover:bg-gray-700/80 text-gray-200'
                : 'hover:bg-gray-100 text-gray-800'
            }`}
          >
            <div className={`p-1.5 rounded ${
              theme === 'dark' 
                ? 'bg-gradient-to-r from-purple-600/40 to-blue-600/40 text-purple-300' 
                : 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700'
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9l7 7" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 9l-7 7" />
              </svg>
            </div>
            <div>
              <div className="font-medium">Scrap Mode</div>
              <div className={`text-xs opacity-70 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Extract data from websites
              </div>
            </div>
          </button>
        </div>
      ) : (
        <div className="p-4">
          <div className="mb-3">
            <h3 className={`font-medium text-sm ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
            }`}>
              Web Scraping Mode
            </h3>
            <p className={`text-xs mt-1 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Enter website URL to scrape data from
            </p>
          </div>
            <div className="space-y-3">
            <input
              ref={urlInputRef}
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://example.com"
              className={`w-full px-3 py-2 text-sm rounded-md border transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-700/50 border-gray-600 text-gray-200 placeholder-gray-400 focus:border-purple-500'
                  : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500 focus:border-purple-500'
              } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
            />
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleUrlSubmit}
                disabled={!urlInput.trim()}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  urlInput.trim()
                    ? theme === 'dark'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white'
                      : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white'
                    : theme === 'dark'
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Start Scraping
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowUrlInput(false);
                  setUrlInput('');
                }}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContextMenu;
