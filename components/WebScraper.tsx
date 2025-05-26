'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiExternalLink, FiCopy, FiCode, FiDownload } from 'react-icons/fi';
import { toast } from 'sonner';

interface TableData {
  id: string;
  headers: string[];
  rows: any[][];
}

interface TableData {
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
}

interface ListData {
  id: string;
  type: 'ordered' | 'unordered';
  items: string[];
  item_count: number;
  heading?: string;
  rich_items?: Array<{
    text: string;
    has_link: boolean;
    links?: Array<{ text: string; href: string }>;
    has_nested_list?: boolean;
    nested_list_type?: 'ordered' | 'unordered';
  }>;
}

interface ImageData {
  id: string;
  src: string;
  alt: string;
  width: string | number;
  height: string | number;
  caption?: string;
}

interface LinkData {
  url: string;
  text: string;
  title?: string;
  is_external?: boolean;
}

interface DataPatternInfo {
  has_pricing: boolean;
  has_currency?: boolean;
  has_date_patterns: boolean;
  has_time_patterns?: boolean;
  has_email_patterns: boolean;
  has_phone_patterns?: boolean;
  has_product_listing: boolean;
  has_pagination: boolean;
  has_product_reviews?: boolean;
  has_login_form?: boolean;
  has_signup_form?: boolean;
  has_social_sharing?: boolean;
  likely_site_type?: string;
  site_type_confidence?: number;
  has_multi_language?: boolean;
  detected_languages?: string[];
  [key: string]: any;
}

interface SiteAnalysis {
  url: string;
  domain: string;
  page_title: string;
  meta: {
    description: string | null;
    keywords: string | null;
    author: string | null;
    viewport: string | null;
  };
  favicon: string;
  main_language: string | null;
  content_stats: {
    word_count: number;
    paragraph_count: number;
    heading_count: number;
    link_count: number;
    image_count: number;
    script_count: number;
    estimated_reading_time: string;
  };
  tech_detection: {
    framework: {
      react: boolean;
      vue: boolean;
      angular: boolean;
      bootstrap: boolean;
      jquery: boolean;
      wordpress: boolean;
      tailwind: boolean;
    };
  };
  likely_purpose: string;
  usability: {
    has_search: boolean;
    has_navigation: boolean;
    has_footer_links: boolean;
    has_social_links: boolean;
    has_language_selector: boolean;
    has_mobile_optimization: boolean;
  };
}

interface InsightsData {
  main_topic: string;
  primary_headings: string[];
  content_type: string;
  has_data_structures: boolean;
  data_types: string[];
  key_sections: string[];
}

interface StructureData {
  title: string;
  meta_description: string | null;
  headings: Record<string, string[]>;
  document_outline: Array<{
    text: string;
    id: string;
    children: Array<any>;
  }>;
  forms: Array<{
    id: string;
    action: string;
    method: string;
    inputs: Array<{
      name: string;
      type: string;
      id: string;
      placeholder: string;
      required: boolean;
    }>;
  }>;
  components: {
    has_header: boolean;
    has_footer: boolean;
    has_sidebar: boolean;
    has_search: boolean;
    has_pagination: boolean;
  };
  content_blocks: Array<{
    heading: string | null;
    content_type: string;
    text_length: number;
    images_count: number;
    lists_count: number;
    has_table: boolean;
    id: string;
    classes: string[];
  }>;
  navigation?: {
    primary_nav: Array<{
      text: string;
      url: string;
      is_active: boolean;
    }>;
    has_dropdown: boolean;
  };
  schema_data?: Array<{
    type: string;
    data?: any;
  }>;
}

interface ScrapedData {
  success: boolean;
  url: string;
  title: string;
  data?: {
    tables: TableData[];
    lists: ListData[];
    images: ImageData[];
  };
  structure?: StructureData;
  patterns?: DataPatternInfo;
  analysis?: SiteAnalysis; 
  insights?: InsightsData;
  pageStructure?: any; // For backward compatibility
  tables?: TableData[];
  lists?: any[];
  links?: LinkData[];
  dataPatterns?: any;
  textSnippet?: string;
  fallbackMode?: boolean;
  executionInfo?: {
    executionId: string;
    timestamp: string;
  };
}

export default function WebScraper() {
  const [url, setUrl] = useState('');
  const [customScript, setCustomScript] = useState('');
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [activeTab, setActiveTab] = useState('tables');
  const [pythonTemplate] = useState(`# Example Python scraping script
# The URL is available as variables["url"]

url = variables["url"]
html = fetch_url(url)
soup = parse_html(html)

# Extract data you're interested in
# For example, product information
products = []
for product in soup.select('.product-item'):  # Adjust selector to match the site
    name = product.select_one('.product-name')
    price = product.select_one('.product-price')
    if name and price:
        products.append({
            'name': name.get_text(strip=True),
            'price': price.get_text(strip=True)
        })

# Return your result
result = {
    'data': products,
    'structure': detect_data_structure(soup)
}
`);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsLoading(true);
    try {
      const response = await axios.post('/api/scrape', { 
        url,
        customScript: isAdvancedMode ? customScript : null
      });
      
      const data = response.data;
      setScrapedData(data);
      
      // Set active tab based on available data
      if (data.insights) {
        setActiveTab('insights');
      } else if (data.tables && data.tables.length > 0) {
        setActiveTab('tables');
      } else if (data.lists && data.lists.length > 0) {
        setActiveTab('lists');
      } else {
        setActiveTab('structure');
      }
      
      toast.success(`Successfully analyzed ${data.title || url}`, {
        description: data.insights ? 'AI-powered analysis complete!' : 'Web scraping complete!'
      });
    } catch (error) {
      console.error('Error scraping URL:', error);
      toast.error('Failed to scrape the URL. Please check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const exportToJson = () => {
    if (!scrapedData) return;
    
    const dataStr = JSON.stringify(scrapedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'scraped-data.json';
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Copied to clipboard!'))
      .catch(() => toast.error('Failed to copy to clipboard'));
  };
  const renderTables = () => {
    // Handle both new and old data structure
    let tables: TableData[] = [];
    
    if (scrapedData?.data?.tables) {
      // New structure
      tables = scrapedData.data.tables;
    } else if (scrapedData?.tables) {
      // Old structure
      tables = scrapedData.tables;
    }
    
    if (!tables || tables.length === 0) {
      return <p className="text-gray-400">No tables found on this page.</p>;
    }
    
    return tables.map((table, index) => (
      <div key={table.id} className="mb-6 overflow-x-auto">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">
            {table.caption || `Table ${index + 1}`}
          </h3>
          {table.metadata && (
            <span className="text-sm text-gray-500">
              {table.metadata.rows_count} rows × {table.metadata.columns_count} columns
            </span>
          )}
        </div>
        
        <div className="border rounded">
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                {table.headers.map((header, i) => (
                  <th key={i} className="px-4 py-2 text-left">{String(header)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-2 border-t">
                      {String(cell || '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ));
  };
  const renderLists = () => {
    // Handle both new and old data structure
    let lists: ListData[] | any[] = [];
    
    if (scrapedData?.data?.lists) {
      // New structure
      lists = scrapedData.data.lists;
    } else if (scrapedData?.lists) {
      // Old structure
      lists = scrapedData.lists;
    }
    
    if (!lists || lists.length === 0) {
      return <p className="text-gray-400">No lists found on this page.</p>;
    }
    
    return lists.map((list, index) => (
      <div key={list.id} className="mb-6">
        <h3 className="text-lg font-semibold mb-2">
          {list.heading || `${list.type === 'ordered' ? 'Ordered List' : 'Unordered List'} ${index + 1}`}
        </h3>
        
        {list.item_count && (
          <p className="text-sm text-gray-500 mb-2">{list.item_count} items</p>
        )}
        
        {list.type === 'ordered' ? (
          <ol className="list-decimal pl-5 border-l-2 border-gray-200 py-2">
            {list.items.map((item: string, i: number) => (
              <li key={i} className="mb-2">{item}</li>
            ))}
          </ol>
        ) : (
          <ul className="list-disc pl-5 border-l-2 border-gray-200 py-2">
            {list.items.map((item: string, i: number) => (
              <li key={i} className="mb-2">{item}</li>
            ))}
          </ul>
        )}
      </div>
    ));
  };
  
  const renderImages = () => {
    if (!scrapedData?.data?.images || scrapedData.data.images.length === 0) {
      return <p className="text-gray-400">No images available or detected on this page.</p>;
    }
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {scrapedData.data.images.map((image) => (
          <div key={image.id} className="border rounded overflow-hidden">
            <div className="h-48 overflow-hidden bg-gray-100 flex items-center justify-center">
              {/* Show placeholder for broken images */}
              <img 
                src={image.src} 
                alt={image.alt || 'Image'} 
                className="object-contain w-full h-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0yNCAyNGgtMjR2LTI0aDI0djI0em0tMS0yM2gtMjJ2MjJoMjJ2LTIyem0tMSAxOGgtMjB2LTE4aDIwdjE4em0tMi0xNmgtMTZ2MTRoMTZ2LTE0em0tNC40IDguOTJsLTIuNi0yLjYtNC42IDQuNi0yLjYtMi42LTIuOCAyLjhoMS40bDEuNC0xLjQgMi42IDIuNiA0LjYtNC42IDIuNiAyLjYgMS40LTEuNHoiLz48L3N2Zz4=';
                }}
              />
            </div>
            <div className="p-3">
              {image.alt && <p className="font-medium truncate">{image.alt}</p>}
              {image.caption && <p className="text-sm text-gray-600 mt-1">{image.caption}</p>}
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                {image.width && image.height ? (
                  <span>{image.width} × {image.height}</span>
                ) : (
                  <span>Dimensions unknown</span>
                )}
                <a 
                  href={image.src} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline flex items-center"
                >
                  View <FiExternalLink className="ml-1" size={12} />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderLinks = () => {
    if (!scrapedData || !scrapedData.links || scrapedData.links.length === 0) {
      return <p className="text-gray-400">No links found on this page.</p>;
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scrapedData.links.map((link, index) => (
          <div key={index} className="border rounded p-3 flex items-center">
            <div className="flex-grow truncate">
              <p className="truncate text-blue-500 hover:underline">
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                  {link.text}
                  <FiExternalLink className="ml-1 inline" size={14} />
                </a>
              </p>
              <p className="text-xs text-gray-500 truncate">{link.url}</p>
            </div>
            <button 
              onClick={() => copyToClipboard(link.url)}
              className="ml-2 text-gray-500 hover:text-blue-500"
              title="Copy URL"
            >
              <FiCopy size={16} />
            </button>
          </div>
        ))}
      </div>
    );
  };
  const renderPageStructure = () => {
    // Handle both new and old data structure
    if (scrapedData?.structure) {
      // New enhanced structure
      const structure = scrapedData.structure;
      
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded p-4">
              <h3 className="font-semibold mb-2">Page Components</h3>
              {structure.components && (
                <ul className="space-y-1">
                  {Object.entries(structure.components).map(([key, value]) => (
                    <li key={key} className="flex items-center">
                      <span className={value ? "text-green-500" : "text-red-500"}>
                        {value ? "✓" : "✗"} {key.replace(/has_/g, '').replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="border rounded p-4">
              <h3 className="font-semibold mb-2">Document Structure</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-gray-500">Page Title</span>
                  <p className="font-medium">{structure.title}</p>
                </div>
                
                {structure.meta_description && (
                  <div>
                    <span className="text-xs text-gray-500">Meta Description</span>
                    <p className="text-sm">{structure.meta_description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Headings structure */}
          {structure.headings && Object.keys(structure.headings).length > 0 && (
            <div className="border rounded p-4">
              <h3 className="font-semibold mb-3">Page Heading Structure</h3>
              <div className="space-y-3">
                {Object.entries(structure.headings).map(([level, headings]) => (
                  <div key={level}>
                    <h4 className="text-sm font-medium text-gray-600">{level.toUpperCase()}</h4>
                    <ul className="mt-1 space-y-1">
                      {headings.map((heading, i) => (
                        <li key={i} className="text-sm pl-2 border-l-2 border-blue-200">
                          {heading}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Content blocks */}
          {structure.content_blocks && structure.content_blocks.length > 0 && (
            <div className="border rounded p-4">
              <h3 className="font-semibold mb-2">Content Blocks</h3>
              <div className="space-y-3">
                {structure.content_blocks.map((block, index) => (
                  <div key={index} className="border-l-2 border-blue-200 pl-3 py-1">
                    <p className="font-medium">{block.heading || `Block ${index + 1}`}</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-1">
                      <p><span className="text-gray-500">Type:</span> {block.content_type}</p>
                      <p><span className="text-gray-500">Text:</span> {block.text_length} chars</p>
                      <p><span className="text-gray-500">Images:</span> {block.images_count}</p>
                      <p><span className="text-gray-500">Lists:</span> {block.lists_count}</p>
                      {block.has_table && <p className="text-blue-500">Contains table</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Forms */}
          {structure.forms && structure.forms.length > 0 && (
            <div className="border rounded p-4">
              <h3 className="font-semibold mb-2">Forms Detected</h3>
              <div className="space-y-4">
                {structure.forms.map((form, index) => (
                  <div key={index} className="border-b pb-3 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Form {index + 1}</h4>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        Method: {form.method.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">Action: {form.action || 'Current page'}</p>
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 mb-1">{form.inputs.length} input fields:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {form.inputs.map((input, idx) => (
                          <div key={idx} className="text-xs border rounded p-1 bg-gray-50">
                            <span className="font-medium">{input.name || input.id || `Field ${idx+1}`}</span>
                            <span className="ml-1 text-gray-500">({input.type})</span>
                            {input.required && <span className="ml-1 text-red-500">*</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    else if (scrapedData?.pageStructure) {
      // Old structure
      const { pageStructure } = scrapedData;
      
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded p-4">
              <h3 className="font-semibold mb-2">Page Components</h3>
              <ul className="space-y-1">
                <li className="flex items-center">
                  <span className={pageStructure.hasHeader ? "text-green-500" : "text-red-500"}>
                    {pageStructure.hasHeader ? "✓" : "✗"} Header
                  </span>
                </li>
                <li className="flex items-center">
                  <span className={pageStructure.hasMainContent ? "text-green-500" : "text-red-500"}>
                    {pageStructure.hasMainContent ? "✓" : "✗"} Main Content
                  </span>
                </li>
                <li className="flex items-center">
                  <span className={pageStructure.hasSidebar ? "text-green-500" : "text-red-500"}>
                    {pageStructure.hasSidebar ? "✓" : "✗"} Sidebar
                  </span>
                </li>
                <li className="flex items-center">
                  <span className={pageStructure.hasFooter ? "text-green-500" : "text-red-500"}>
                    {pageStructure.hasFooter ? "✓" : "✗"} Footer
                  </span>
                </li>
              </ul>
            </div>
            
            <div className="border rounded p-4">
              <h3 className="font-semibold mb-2">Data Patterns</h3>
              {scrapedData.dataPatterns && (
                <ul className="space-y-1">
                  {Object.entries(scrapedData.dataPatterns).map(([key, value]) => (
                    <li key={key} className="flex items-center">
                      <span className={(value as boolean) ? "text-green-500" : "text-gray-400"}>
                        {(value as boolean) ? "✓" : "✗"} {key.replace(/has|Patterns/g, '').replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          {pageStructure.sections && pageStructure.sections.length > 0 && (
            <div className="border rounded p-4">
              <h3 className="font-semibold mb-2">Page Sections</h3>
              <ul className="space-y-2">
                {pageStructure.sections.map((section: any, index: number) => (
                  <li key={index} className="border-b pb-2 last:border-b-0 last:pb-0">
                    <p className="font-medium">{section.heading}</p>
                    {section.id && <p className="text-xs text-gray-500">ID: {section.id}</p>}
                    {section.class && <p className="text-xs text-gray-500">Class: {section.class}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }
    
    return <p className="text-gray-400">No structure information available.</p>;
  };
  
  const renderInsights = () => {
    if (!scrapedData?.insights) {
      return <p className="text-gray-400">No AI insights available for this page.</p>;
    }
    
    const insights = scrapedData.insights;
    
    return (
      <div className="space-y-6">
        <div className="border rounded p-4 bg-gradient-to-r from-indigo-50 to-blue-50">
          <h3 className="font-semibold text-lg mb-4 text-indigo-700">AI Website Analysis</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-indigo-800">Main Topic</h4>
              <p className="text-lg mt-1">{insights.main_topic}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-indigo-800">Content Type</h4>
              <div className="flex mt-1 items-center">
                <span className="text-white bg-indigo-600 px-3 py-1 rounded-full text-sm">
                  {insights.content_type.toUpperCase()}
                </span>
                {insights.has_data_structures && (
                  <span className="text-white bg-blue-500 px-3 py-1 rounded-full text-sm ml-2">
                    Data-Rich
                  </span>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-indigo-800">Key Headings</h4>
              <ul className="mt-1 ml-4 list-disc space-y-1">
                {insights.primary_headings.slice(0, 5).map((heading, index) => (
                  <li key={index}>{heading}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-indigo-800">Data Types Detected</h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {insights.data_types.map((type, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {type.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
            
            {insights.key_sections && insights.key_sections.length > 0 && (
              <div>
                <h4 className="font-medium text-indigo-800">Key Content Sections</h4>
                <ul className="mt-1 ml-4 list-disc">
                  {insights.key_sections.map((section, index) => (
                    <li key={index}>{section}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  const renderSiteAnalysis = () => {
    if (!scrapedData?.analysis) {
      return <p className="text-gray-400">No site analysis available.</p>;
    }
    
    const analysis = scrapedData.analysis;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded p-4">
            <h3 className="font-semibold mb-3">Site Information</h3>
            <div className="space-y-2">
              <div>
                <span className="text-xs text-gray-500">Domain</span>
                <p>{analysis.domain}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Title</span>
                <p>{analysis.page_title}</p>
              </div>
              {analysis.meta.description && (
                <div>
                  <span className="text-xs text-gray-500">Description</span>
                  <p className="text-sm">{analysis.meta.description}</p>
                </div>
              )}
              {analysis.main_language && (
                <div>
                  <span className="text-xs text-gray-500">Language</span>
                  <p>{analysis.main_language}</p>
                </div>
              )}
              <div className="pt-2">
                <span className="text-xs text-gray-500 block mb-1">Favicon</span>
                <div className="flex items-center">
                  <img 
                    src={analysis.favicon} 
                    alt="Favicon" 
                    className="h-8 w-8 border rounded mr-2"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <a 
                    href={analysis.favicon} 
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="text-xs text-blue-500 hover:underline"
                  >
                    View
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border rounded p-4">
            <h3 className="font-semibold mb-3">Content Statistics</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-gray-500">Word Count</span>
                <p className="text-lg font-medium">{analysis.content_stats.word_count.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Reading Time</span>
                <p className="text-lg font-medium">{analysis.content_stats.estimated_reading_time}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Paragraphs</span>
                <p>{analysis.content_stats.paragraph_count.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Headings</span>
                <p>{analysis.content_stats.heading_count.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Links</span>
                <p>{analysis.content_stats.link_count.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Images</span>
                <p>{analysis.content_stats.image_count.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-3">Technology Detection</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(analysis.tech_detection.framework).map(([tech, isDetected]) => {
              if (isDetected) {
                return (
                  <span 
                    key={tech} 
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {tech.charAt(0).toUpperCase() + tech.slice(1)}
                  </span>
                );
              }
              return null;
            })}
          </div>
        </div>
        
        <div className="border rounded p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Site Purpose & Usability</h3>
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
              {analysis.likely_purpose.toUpperCase()}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Usability Features</h4>
              <ul className="space-y-1">
                {Object.entries(analysis.usability).map(([feature, isPresent]) => (
                  <li key={feature} className="flex items-center">
                    <span className={isPresent ? "text-green-500" : "text-red-500"}>
                      {isPresent ? "✓" : "✗"}
                    </span>
                    <span className="ml-2">
                      {feature.replace('has_', '').replace(/_/g, ' ')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRawData = () => {
    if (!scrapedData) {
      return <p className="text-gray-400">No data available.</p>;
    }
    
    return (
      <div className="relative">
        <button 
          onClick={() => copyToClipboard(JSON.stringify(scrapedData, null, 2))}
          className="absolute top-2 right-2 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full"
          title="Copy JSON"
        >
          <FiCopy size={16} />
        </button>
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto max-h-[500px] text-xs">
          {JSON.stringify(scrapedData, null, 2)}
        </pre>
      </div>
    );
  };
  const renderTabs = () => {
    if (!scrapedData) return null;
    
    return (
      <div className="mb-6">
        <div className="border-b flex space-x-1 overflow-x-auto">
          {/* AI-driven insights tab (new) */}
          {scrapedData.insights && (
            <button
              className={`py-2 px-4 font-medium ${activeTab === 'insights' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab('insights')}
            >
              📊 AI Insights
            </button>
          )}
          
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'tables' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('tables')}
          >
            Tables
          </button>
          
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'lists' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('lists')}
          >
            Lists
          </button>
          
          {scrapedData.data?.images && scrapedData.data.images.length > 0 && (
            <button
              className={`py-2 px-4 font-medium ${activeTab === 'images' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab('images')}
            >
              Images
            </button>
          )}
          
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'links' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('links')}
          >
            Links
          </button>
          
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'structure' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('structure')}
          >
            Page Structure
          </button>
          
          {/* Site analysis tab (new) */}
          {scrapedData.analysis && (
            <button
              className={`py-2 px-4 font-medium ${activeTab === 'analysis' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab('analysis')}
            >
              Site Analysis
            </button>
          )}
          
          {/* Data patterns tab (new) */}
          {scrapedData.patterns && (
            <button
              className={`py-2 px-4 font-medium ${activeTab === 'patterns' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab('patterns')}
            >
              Data Patterns
            </button>
          )}
          
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'raw' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('raw')}
          >
            Raw Data
          </button>
        </div>
        
        <div className="mt-4">
          {activeTab === 'insights' && renderInsights()}
          {activeTab === 'tables' && renderTables()}
          {activeTab === 'lists' && renderLists()}
          {activeTab === 'images' && renderImages()}
          {activeTab === 'links' && renderLinks()}
          {activeTab === 'structure' && renderPageStructure()}
          {activeTab === 'analysis' && renderSiteAnalysis()}
          {activeTab === 'patterns' && renderPatterns()}
          {activeTab === 'raw' && renderRawData()}
        </div>
      </div>
    );
  };
  
  const renderPatterns = () => {
    // Handle both new and old data structure
    let patterns: DataPatternInfo | any = null;
    
    if (scrapedData?.patterns) {
      // New structure
      patterns = scrapedData.patterns;
    } else if (scrapedData?.dataPatterns) {
      // Old structure
      patterns = scrapedData.dataPatterns;
    }
    
    if (!patterns) {
      return <p className="text-gray-400">No data pattern information available.</p>;
    }
    
    // Group patterns by category
    const categories: Record<string, {label: string, patterns: Array<{key: string, value: boolean}>}> = {
      commerce: {
        label: 'E-commerce & Pricing',
        patterns: []
      },
      date: {
        label: 'Date & Time',
        patterns: []
      },
      contact: {
        label: 'Contact Information',
        patterns: []
      },
      navigation: {
        label: 'Navigation & Layout',
        patterns: []
      },
      media: {
        label: 'Media & Content',
        patterns: []
      },
      user: {
        label: 'User Interaction',
        patterns: []
      },
      content: {
        label: 'Content Types',
        patterns: []
      },
      social: {
        label: 'Social Elements',
        patterns: []
      },
      technical: {
        label: 'Technical Elements',
        patterns: []
      },
      misc: {
        label: 'Other Features',
        patterns: []
      }
    };
    
    // Sort patterns into categories
    Object.entries(patterns).forEach(([key, value]) => {
      if (key === 'likely_site_type' || key === 'site_type_confidence' || key === 'detected_languages') {
        return; // Skip non-boolean fields
      }
      
      const pattern = {key, value: value as boolean};
      
      if (key.match(/pricing|product|cart|shop|checkout|currency/i)) {
        categories.commerce.patterns.push(pattern);
      } else if (key.match(/date|time/i)) {
        categories.date.patterns.push(pattern);
      } else if (key.match(/email|phone|address/i)) {
        categories.contact.patterns.push(pattern);
      } else if (key.match(/pagination|breadcrumb|navigation/i)) {
        categories.navigation.patterns.push(pattern);
      } else if (key.match(/video|audio|image/i)) {
        categories.media.patterns.push(pattern);
      } else if (key.match(/login|signup|contact_form|search/i)) {
        categories.user.patterns.push(pattern);
      } else if (key.match(/blog|news|faq/i)) {
        categories.content.patterns.push(pattern);
      } else if (key.match(/social/i)) {
        categories.social.patterns.push(pattern);
      } else if (key.match(/cookie|privacy|terms/i)) {
        categories.technical.patterns.push(pattern);
      } else {
        categories.misc.patterns.push(pattern);
      }
    });
    
    return (
      <div>
        {/* Site type indicator */}
        {patterns.likely_site_type && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-blue-800">
                Detected Site Type: {patterns.likely_site_type.toUpperCase()}
              </h3>
              
              {patterns.site_type_confidence !== undefined && (
                <div className="bg-white px-3 py-1 rounded-full text-sm">
                  Confidence: {Math.round(patterns.site_type_confidence * 100)}%
                </div>
              )}
            </div>
            
            {patterns.has_multi_language && patterns.detected_languages && (
              <div className="mt-2 flex space-x-2 items-center">
                <p className="text-sm text-blue-700">Multiple languages detected:</p>
                <div className="flex flex-wrap gap-1">
                  {patterns.detected_languages.map((lang: string, idx: number) => (
                    <span key={idx} className="bg-blue-200 text-blue-800 text-xs px-2 py-0.5 rounded">
                      {lang.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.values(categories).map((category) => {
            if (category.patterns.length === 0) return null;
            
            return (
              <div key={category.label} className="border rounded p-4">
                <h3 className="font-semibold mb-2">{category.label}</h3>
                <ul className="space-y-1">
                  {category.patterns.map((pattern) => (
                    <li key={pattern.key} className="flex items-center">
                      <span className={pattern.value ? "text-green-500" : "text-gray-400"}>
                        {pattern.value ? "✓" : "✗"}
                      </span>
                      <span className="ml-2">
                        {pattern.key
                          .replace(/has_/g, '')
                          .replace(/_/g, ' ')
                          .replace(/([A-Z])/g, ' $1')
                          .trim()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-8">
        <h1 className="text-2xl font-bold mb-2 text-cyan-500">Web Scraper</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Enter a URL to scrape website data and analyze its structure.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter website URL (https://example.com)"
                className="w-full p-3 border rounded focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-medium py-3 px-6 rounded"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  <span>Scraping...</span>
                </div>
              ) : (
                'Scrape Data'
              )}
            </button>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="advancedMode"
              checked={isAdvancedMode}
              onChange={() => setIsAdvancedMode(!isAdvancedMode)}
              className="h-4 w-4 text-cyan-500 focus:ring-cyan-500 border-gray-300 rounded"
            />
            <label htmlFor="advancedMode" className="ml-2 text-gray-700 dark:text-gray-200">
              Advanced Mode (Python Scripting)
            </label>
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="ml-2 text-xs text-cyan-500 hover:underline"
            >
              Help
            </button>
          </div>
          
          {isAdvancedMode && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom Python Scraping Script:
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCustomScript(pythonTemplate)}
                  className="absolute top-2 right-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 py-1 px-2 rounded text-xs"
                >
                  Load Template
                </button>
                <textarea
                  value={customScript}
                  onChange={(e) => setCustomScript(e.target.value)}
                  rows={12}
                  className="w-full p-3 border rounded font-mono text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-gray-50 dark:bg-gray-900"
                  placeholder="# Enter your custom Python web scraping code here"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Python code will be executed on the server with access to BeautifulSoup, requests, pandas, and helper functions.
              </p>
            </div>
          )}
        </form>
      </div>
      
      {scrapedData && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold">{scrapedData.title || 'Scraped Data'}</h2>
              <p className="text-blue-500 hover:underline">
                <a href={scrapedData.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                  {scrapedData.url}
                  <FiExternalLink className="ml-1 inline" size={14} />
                </a>
              </p>
            </div>
            <button
              onClick={exportToJson}
              className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded px-3 py-2 flex items-center"
            >
              <FiDownload className="mr-2" /> Export JSON
            </button>
          </div>
          
          {renderTabs()}
        </div>
      )}
      
      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">Python Scraping Help</h2>
            <div className="prose dark:prose-invert max-w-none text-sm">
              <h3>Available Functions</h3>
              <ul>
                <li><code>fetch_url(url, headers=None)</code> - Fetches a URL and returns the HTML text</li>
                <li><code>parse_html(html)</code> - Creates a BeautifulSoup object from HTML</li>
                <li><code>extract_tables(soup)</code> - Extracts tables from BeautifulSoup object</li>
                <li><code>detect_data_structure(soup)</code> - Analyzes page structure</li>
              </ul>
              
              <h3>Available Libraries</h3>
              <ul>
                <li><code>requests</code> - For HTTP requests</li>
                <li><code>BeautifulSoup</code> - For HTML parsing</li>
                <li><code>pandas</code> - For data manipulation</li>
                <li><code>re</code> - For regular expressions</li>
              </ul>
              
              <h3>Input Variable</h3>
              <p>The URL you entered is available as <code>variables["url"]</code></p>
              
              <h3>Expected Output</h3>
              <p>Your script should define a <code>result</code> variable that contains an object with at least a <code>data</code> property.</p>
              <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
{`result = {
    'data': extracted_data,  # Your structured data
    'structure': page_structure  # Optional additional info
}`}
              </pre>
              
              <h3>Example Script</h3>              <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs">
{pythonTemplate}
              </pre>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-medium py-2 px-4 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
