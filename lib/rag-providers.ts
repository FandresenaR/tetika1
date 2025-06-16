import { RAGProvider } from '@/types';

export const RAG_PROVIDERS: RAGProvider[] = [
  {
    id: 'searxng',
    name: 'SearXNG',
    description: 'Open source metasearch engine - no API key required',
    requiresApiKey: false,
    priority: 1,
    isDefault: true
  },
  {
    id: 'fetch-mcp',
    name: 'Fetch MCP',
    description: 'Direct web fetching with content extraction',
    requiresApiKey: false,
    priority: 2
  },
  {
    id: 'serpapi',
    name: 'SerpAPI',
    description: 'Reliable fallback search provider',
    requiresApiKey: true,
    apiKeyLabel: 'SerpAPI Key',
    priority: 3
  }
];

export const DEFAULT_RAG_PROVIDER = 'searxng';

export const getRAGProviderById = (id: string): RAGProvider | undefined => {
  return RAG_PROVIDERS.find(provider => provider.id === id);
};

export const getAvailableRAGProviders = (): RAGProvider[] => {
  return RAG_PROVIDERS.sort((a, b) => a.priority - b.priority);
};
