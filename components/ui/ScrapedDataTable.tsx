import React, { useState } from 'react';

interface ScrapedDataItem {
  url: string;
  title: string;
  content: string;
  links?: Array<{
    text: string;
    url: string;
    href: string;
  }>;
  images?: Array<{
    src: string;
    alt: string;
  }>;
  metadata?: {
    description?: string;
    keywords?: string;
    author?: string;
  };
  scrapedAt?: string;
}

interface ScrapedDataTableProps {
  data: ScrapedDataItem;
  theme: 'dark' | 'light';
  onExportCSV: (data: ScrapedDataItem, type: 'content' | 'links' | 'images' | 'metadata') => void;
}

const ScrapedDataTable: React.FC<ScrapedDataTableProps> = ({ data, theme, onExportCSV }) => {
  const [activeTab, setActiveTab] = useState<'content' | 'links' | 'images' | 'metadata'>('content');

  const tabs = [
    { id: 'content', label: 'Content', icon: '📄' },
    { id: 'links', label: 'Links', icon: '🔗', count: data.links?.length || 0 },
    { id: 'images', label: 'Images', icon: '🖼️', count: data.images?.length || 0 },
    { id: 'metadata', label: 'Metadata', icon: '📋' }
  ] as const;

  return (
    <div className={`rounded-lg border shadow-lg ${
      theme === 'dark' 
        ? 'bg-gray-800/95 border-gray-700 text-gray-200' 
        : 'bg-white/95 border-gray-200 text-gray-800'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Scraped Data</h3>
          <button
            onClick={() => onExportCSV(data, activeTab)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-2 ${
              theme === 'dark'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>
        <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          <p className="truncate">Source: {data.url}</p>
          <p>{data.title}</p>
          {data.scrapedAt && (
            <p>Scraped: {new Date(data.scrapedAt).toLocaleString()}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex border-b ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? theme === 'dark'
                  ? 'bg-gray-700 text-blue-400 border-b-2 border-blue-400'
                  : 'bg-gray-100 text-blue-600 border-b-2 border-blue-600'
                : theme === 'dark'
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-750'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {'count' in tab && tab.count > 0 && (
              <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {activeTab === 'content' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Page Content</h4>
              <div className={`p-3 rounded border text-sm leading-relaxed ${
                theme === 'dark' ? 'bg-gray-750 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                {data.content || 'No content extracted'}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'links' && (
          <div className="space-y-2">
            <h4 className="font-medium mb-2">Extracted Links ({data.links?.length || 0})</h4>
            {data.links && data.links.length > 0 ? (
              <div className="space-y-2">
                {data.links.map((link, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded border ${
                      theme === 'dark' ? 'bg-gray-750 border-gray-600' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="font-medium text-sm mb-1">{link.text}</div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-xs break-all hover:underline ${
                        theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                      }`}
                    >
                      {link.url}
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                No links found
              </p>
            )}
          </div>
        )}

        {activeTab === 'images' && (
          <div className="space-y-2">
            <h4 className="font-medium mb-2">Extracted Images ({data.images?.length || 0})</h4>
            {data.images && data.images.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.images.map((image, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded border ${
                      theme === 'dark' ? 'bg-gray-750 border-gray-600' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-32 object-cover rounded mb-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="text-sm">
                      <div className="font-medium mb-1">{image.alt || 'No alt text'}</div>
                      <a
                        href={image.src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-xs break-all hover:underline ${
                          theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                        }`}
                      >
                        {image.src}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                No images found
              </p>
            )}
          </div>
        )}

        {activeTab === 'metadata' && (
          <div className="space-y-3">
            <h4 className="font-medium mb-2">Page Metadata</h4>
            {data.metadata && Object.keys(data.metadata).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(data.metadata).map(([key, value]) => 
                  value ? (
                    <div
                      key={key}
                      className={`p-3 rounded border ${
                        theme === 'dark' ? 'bg-gray-750 border-gray-600' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="font-medium text-sm mb-1 capitalize">{key}</div>
                      <div className="text-sm">{value}</div>
                    </div>
                  ) : null
                )}
              </div>
            ) : (
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                No metadata found
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScrapedDataTable;
