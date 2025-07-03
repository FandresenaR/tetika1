'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye, Download, Search, ChevronRight, AlertCircle, CheckCircle, Globe, FileText } from 'lucide-react';

interface ScrapingSession {
  sessionId?: string;
  step: 'init' | 'url-input' | 'analyzing' | 'analyzed' | 'instructions-input' | 'extracting' | 'completed' | 'error';
  url?: string;
  pageInfo?: PageInfo;
  instructions?: string;
  results?: ScrapingResults;
  error?: string;
}

interface PageInfo {
  title: string;
  description: string;
  url: string;
  availableElements: PageElement[];
  availableLinks: AvailableLink[];
  totalElements: number;
  bodyTextLength: number;
}

interface ScrapingResults {
  success: boolean;
  totalResults: number;
  extractedData: Array<Record<string, unknown>>;
  message?: string;
  stats?: {
    withLinks: number;
    withImages: number;
    withPrices: number;
    withEmails: number;
    withPhones: number;
  };
}

interface PageElement {
  type: string;
  count: number;
  selector: string;
  sampleText?: string;
}

interface AvailableLink {
  text: string;
  href: string;
  type: string;
}

export default function InteractiveScraper() {
  const [session, setSession] = useState<ScrapingSession>({ step: 'init' });
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState('');
  const [instructions, setInstructions] = useState('');

  const callMCPAPI = async (tool: string, args: Record<string, unknown>) => {
    const response = await fetch('/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tool, args }),
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'API call failed');
    }

    return JSON.parse(result.data.content[0].text);
  };

  const startSession = async () => {
    if (!url.trim()) {
      setSession({ ...session, error: 'Please enter a valid URL', step: 'error' });
      return;
    }

    setLoading(true);
    try {
      const result = await callMCPAPI('interactive_scraper', {
        action: 'start',
        url: url.trim()
      });

      if (result.success) {
        setSession({
          step: 'analyzing',
          sessionId: result.sessionId,
          url: result.url
        });
        
        // Automatically proceed to analyze
        setTimeout(() => analyzePage(result.sessionId), 2000);
      } else {
        setSession({ ...session, error: result.message || 'Failed to start session', step: 'error' });
      }
    } catch (error) {
      console.error('Start session error:', error);
      setSession({ ...session, error: error instanceof Error ? error.message : 'Unknown error', step: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const analyzePage = async (sessionId: string) => {
    setLoading(true);
    try {
      const result = await callMCPAPI('interactive_scraper', {
        action: 'analyze',
        sessionId
      });

      if (result.success) {
        setSession({
          step: 'analyzed',
          sessionId,
          url: session.url,
          pageInfo: result.pageInfo
        });
      } else {
        setSession({ ...session, error: result.message || 'Failed to analyze page', step: 'error' });
      }
    } catch (error) {
      console.error('Analyze page error:', error);
      setSession({ ...session, error: error instanceof Error ? error.message : 'Unknown error', step: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const extractData = async () => {
    if (!instructions.trim()) {
      setSession({ ...session, error: 'Please provide extraction instructions', step: 'error' });
      return;
    }

    setLoading(true);
    setSession({ ...session, step: 'extracting' });

    try {
      const result = await callMCPAPI('interactive_scraper', {
        action: 'extract',
        sessionId: session.sessionId,
        instructions: instructions.trim()
      });

      if (result.success) {
        setSession({
          ...session,
          step: 'completed',
          instructions: instructions.trim(),
          results: result
        });
      } else {
        setSession({ ...session, error: result.message || 'Failed to extract data', step: 'error' });
      }
    } catch (error) {
      console.error('Extract data error:', error);
      setSession({ ...session, error: error instanceof Error ? error.message : 'Unknown error', step: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const resetSession = () => {
    setSession({ step: 'init' });
    setUrl('');
    setInstructions('');
  };

  const downloadResults = () => {
    if (!session.results) return;
    
    const dataStr = JSON.stringify(session.results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scraped-data-${new Date().toISOString().slice(0, 19)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'init', label: 'Start', icon: Globe },
      { key: 'analyzing', label: 'Analyze', icon: Search },
      { key: 'analyzed', label: 'Ready', icon: Eye },
      { key: 'extracting', label: 'Extract', icon: FileText },
      { key: 'completed', label: 'Done', icon: CheckCircle }
    ];

    const currentStepIndex = steps.findIndex(s => s.key === session.step || 
      (session.step === 'url-input' && s.key === 'init') ||
      (session.step === 'instructions-input' && s.key === 'analyzed'));

    return (
      <div className="flex items-center space-x-2 mb-6">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          
          return (
            <React.Fragment key={step.key}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                isActive 
                  ? 'bg-blue-500 border-blue-500 text-white' 
                  : 'border-gray-300 text-gray-400'
              } ${isCurrent ? 'ring-2 ring-blue-200' : ''}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-sm ${isActive ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <ChevronRight className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-gray-300'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const renderPageAnalysis = () => {
    if (!session.pageInfo) return null;

    const pageInfo = session.pageInfo;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="w-5 h-5" />
            <span>Page Analysis</span>
          </CardTitle>
          <CardDescription>
            Analysis of the page content and available elements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Page Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Title:</span>
                <p className="font-medium">{pageInfo.title}</p>
              </div>
              <div>
                <span className="text-gray-500">URL:</span>
                <p className="font-medium truncate">{pageInfo.url}</p>
              </div>
              <div>
                <span className="text-gray-500">Total Elements:</span>
                <p className="font-medium">{pageInfo.totalElements}</p>
              </div>
              <div>
                <span className="text-gray-500">Text Length:</span>
                <p className="font-medium">{pageInfo.bodyTextLength} chars</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Available Elements</h4>
            <div className="flex flex-wrap gap-2">
              {pageInfo.availableElements?.map((element: PageElement, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {element.type} ({element.count})
                </Badge>
              ))}
            </div>
          </div>

          {pageInfo.availableLinks && pageInfo.availableLinks.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Sample Links ({pageInfo.availableLinks.length})</h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {pageInfo.availableLinks.slice(0, 10).map((link: AvailableLink, index: number) => (
                  <div key={index} className="text-xs p-2 bg-gray-50 rounded flex justify-between">
                    <span className="truncate flex-1">{link.text}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {link.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Interactive Web Scraper</h1>
        <p className="text-gray-600">
          Step-by-step guided web scraping with custom instructions
        </p>
      </div>

      {renderStepIndicator()}

      {session.step === 'error' && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-700 mt-2">{session.error}</p>
            <Button onClick={resetSession} className="mt-4" variant="outline">
              Start Over
            </Button>
          </CardContent>
        </Card>
      )}

      {(session.step === 'init' || session.step === 'url-input') && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Choose URL to Scrape</CardTitle>
            <CardDescription>
              Enter the website URL you want to scrape data from
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                placeholder="https://example.com"
                value={url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && !loading && startSession()}
              />
            </div>
            <div className="text-sm text-gray-500">
              <p>Examples:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Company directories (Yellow Pages, industry listings)</li>
                <li>Product catalogs (e-commerce sites)</li>
                <li>Job boards (LinkedIn, Indeed)</li>
                <li>News sites (articles, headlines)</li>
                <li>Social media profiles</li>
              </ul>
            </div>
            <Button 
              onClick={startSession} 
              disabled={loading || !url.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting Session...
                </>
              ) : (
                'Start Scraping Session'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {session.step === 'analyzing' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span>Analyzing page content...</span>
            </div>
            <p className="text-center text-gray-500 mt-2">
              Loading {session.url} and identifying available elements
            </p>
          </CardContent>
        </Card>
      )}

      {session.step === 'analyzed' && (
        <>
          {renderPageAnalysis()}
          
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Provide Extraction Instructions</CardTitle>
              <CardDescription>
                Describe what data you want to extract from this page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Extract all company names, websites, and employee counts..."
                value={instructions}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInstructions(e.target.value)}
                rows={4}
              />
              <div className="text-sm text-gray-500">
                <p>Example instructions:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>&quot;Extract all company names and their websites&quot;</li>
                  <li>&quot;Get all product names, prices, and descriptions&quot;</li>
                  <li>&quot;Find all contact information including emails and phone numbers&quot;</li>
                  <li>&quot;Scrape all job listings with titles, companies, and locations&quot;</li>
                  <li>&quot;Extract all news article titles, dates, and summaries&quot;</li>
                </ul>
              </div>
              <Button 
                onClick={extractData} 
                disabled={loading || !instructions.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Extracting Data...
                  </>
                ) : (
                  'Extract Data'
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {session.step === 'extracting' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span>Extracting data...</span>
            </div>
            <p className="text-center text-gray-500 mt-2">
              Processing: &ldquo;{instructions}&rdquo;
            </p>
          </CardContent>
        </Card>
      )}

      {session.step === 'completed' && session.results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Extraction Complete</span>
            </CardTitle>
            <CardDescription>
              Successfully extracted data from {session.url}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Results Summary</p>
                <p className="text-sm text-gray-500">
                  Found {session.results.totalResults || 0} items
                </p>
              </div>
              <div className="space-x-2">
                <Button onClick={downloadResults} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download JSON
                </Button>
                <Button onClick={resetSession} size="sm">
                  New Scraping
                </Button>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              <pre className="text-xs bg-gray-50 p-4 rounded-md">
                {JSON.stringify(session.results, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
