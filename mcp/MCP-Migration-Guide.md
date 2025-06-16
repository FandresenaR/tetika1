# Comprehensive MCP Web Search Integration Guide for Tetika

This guide provides a complete migration path from SerpAPI to MCP-based web search solutions, with hybrid approaches and fallback strategies.

## Executive Summary

### Current State
- **Tetika** currently uses SerpAPI via a local proxy for web search
- Search results are integrated with RAG pipeline for enhanced responses
- Cost concerns and API limitations drive the need for alternative solutions

### Recommended Approach
- **Hybrid MCP Solution**: Combine multiple MCP web search providers
- **Intelligent Routing**: Smart provider selection based on query type
- **Gradual Migration**: Phased approach with SerpAPI as fallback
- **Cost Optimization**: Prioritize free/low-cost providers

## MCP Web Search Providers Analysis

### 1. SearXNG MCP Server ⭐⭐⭐⭐⭐
**Best Overall Choice**
- **Provider**: `erhwenkuo/mcp-searxng`
- **Type**: Meta-search engine (aggregates Google, DuckDuckGo, Bing, etc.)
- **Cost**: Free (self-hosted)
- **Quality**: Excellent (combines multiple sources)
- **Privacy**: Excellent (no tracking)
- **Setup Complexity**: Medium (requires Docker)

**Features**:
- Aggregates results from multiple search engines
- Built-in content extraction with markdownify
- SSE transport for remote deployment
- Highly configurable engine selection

**Tools**:
- `web_search(query, count)` - Search across multiple engines
- `web_url_read(url)` - Extract content from specific URLs

### 2. Google Custom Search MCP ⭐⭐⭐⭐
**Best for Quality & Precision**
- **Provider**: `adenot/mcp-google-search`
- **Type**: Google Custom Search API
- **Cost**: Free tier (100 queries/day), then $5/1000 queries
- **Quality**: Excellent (Google results)
- **Setup Complexity**: Low

**Features**:
- Direct Google search results
- Built-in webpage content extraction
- Configurable result count (1-10)
- Clean, structured responses

**Tools**:
- `search(query, num)` - Google search
- `read_webpage(url)` - Extract webpage content

### 3. Fetch MCP Server ⭐⭐⭐⭐
**Best for Content Extraction**
- **Provider**: Official MCP `mcp-server-fetch`
- **Type**: Web content fetcher
- **Cost**: Free
- **Quality**: Excellent for single URLs
- **Setup Complexity**: Low

**Features**:
- Robust HTML to Markdown conversion
- Handles JavaScript-heavy sites
- Respects robots.txt
- Chunked content retrieval for large pages

**Tools**:
- `fetch(url, max_length, start_index, raw)` - Fetch and convert content

### 4. Apify RAG Web Browser ⭐⭐⭐
**Best for Complex Scraping**
- **Provider**: `@apify/mcp-server-rag-web-browser`
- **Type**: Advanced web scraper with search
- **Cost**: Usage-based (requires Apify token)
- **Quality**: Excellent (designed for RAG)
- **Setup Complexity**: Medium

**Features**:
- Combines search and scraping
- Playwright browser automation
- Multiple output formats (text, markdown, HTML)
- Optimized for RAG pipelines

**Tools**:
- `search(query, maxResults, scrapingTool, outputFormats)` - Search and scrape

### 5. Alternative Providers

**Serper.dev** (API-based):
- Cost: $1/1000 queries
- Quality: High (Google results)
- Speed: Very fast
- Real-time results

**Brave Search** (Archived):
- Was available as MCP server
- Privacy-focused
- Independent index

## Implementation Strategy

### Phase 1: Setup Individual MCP Servers

#### 1.1 SearXNG Setup (Recommended Primary)

```bash
# Clone and setup SearXNG MCP
git clone https://github.com/erhwenkuo/mcp-searxng.git
cd mcp-searxng

# Install dependencies
uv sync

# Start SearXNG instance
cd searxng-docker
docker compose up -d

# Start MCP server
uv run server.py --searxng_url="http://localhost:8888"
```

#### 1.2 Google Custom Search Setup

```bash
# Install via NPM
npm install -g @adenot/mcp-google-search

# Set environment variables
export GOOGLE_API_KEY="your-api-key"
export GOOGLE_SEARCH_ENGINE_ID="your-search-engine-id"

# Test the server
npx @adenot/mcp-google-search
```

#### 1.3 Fetch MCP Setup

```bash
# Install via uv
uvx mcp-server-fetch

# Or via pip
pip install mcp-server-fetch
python -m mcp_server_fetch
```

### Phase 2: Hybrid Integration

#### 2.1 Deploy Advanced Hybrid Server

The `tetika-agent-advanced.js` provides:
- **Intelligent Routing**: Automatically selects best provider based on query type
- **Cascade Fallback**: Tries multiple providers in order of preference
- **Result Quality**: Deduplication, filtering, and ranking
- **Performance Monitoring**: Tracks success rates and response times
- **Cost Optimization**: Prioritizes low-cost providers

#### 2.2 Configuration

Update your MCP client configuration:

```json
{
  "mcpServers": {
    "tetika-hybrid-search": {
      "command": "node",
      "args": ["path/to/tetika-agent-advanced.js"],
      "env": {
        "GOOGLE_API_KEY": "your-google-api-key",
        "GOOGLE_SEARCH_ENGINE_ID": "your-search-engine-id",
        "APIFY_TOKEN": "your-apify-token",
        "SERPER_API_KEY": "your-serper-key"
      }
    }
  }
}
```

### Phase 3: Application Integration

#### 3.1 Update Tetika's Web Search Function

Replace the current SerpAPI integration in your search utility:

```javascript
// lib/search-utils.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

class MCPSearchClient {
  private client: Client;
  private transport: StdioClientTransport;

  async initialize() {
    this.transport = new StdioClientTransport({
      command: 'node',
      args: ['path/to/tetika-agent-advanced.js']
    });
    
    this.client = new Client(
      { name: 'tetika-web-client', version: '1.0.0' },
      { capabilities: {} }
    );
    
    await this.client.connect(this.transport);
  }

  async search(query: string, maxResults: number = 10) {
    const result = await this.client.callTool({
      name: 'hybrid_web_search',
      arguments: {
        query,
        max_results: maxResults,
        strategy: 'smart_cascade'
      }
    });
    
    return JSON.parse(result.content[0].text);
  }

  async getStatus() {
    const result = await this.client.callTool({
      name: 'search_status',
      arguments: {}
    });
    
    return JSON.parse(result.content[0].text);
  }
}
```

#### 3.2 Update API Routes

Modify your search API route to use MCP:

```javascript
// app/api/search/route.ts
import { MCPSearchClient } from '../../../lib/search-utils';

const searchClient = new MCPSearchClient();

export async function POST(request: Request) {
  try {
    const { query, maxResults = 10 } = await request.json();
    
    // Initialize MCP client if not already done
    if (!searchClient.isInitialized()) {
      await searchClient.initialize();
    }
    
    // Perform search
    const results = await searchClient.search(query, maxResults);
    
    return Response.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Search error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
```

## Testing & Validation

### 1. Individual Provider Testing

Use the MCP Inspector to test each provider:

```bash
# Test SearXNG
npx @modelcontextprotocol/inspector http://localhost:5488/sse

# Test Google Custom Search
export GOOGLE_API_KEY="your-key"
export GOOGLE_SEARCH_ENGINE_ID="your-id"
npx @modelcontextprotocol/inspector npx @adenot/mcp-google-search

# Test Fetch MCP
npx @modelcontextprotocol/inspector uvx mcp-server-fetch
```

### 2. Hybrid System Testing

```bash
# Test the advanced hybrid server
node mcp/servers/tetika-agent-advanced.js

# Use the test script
node mcp/test-search-servers.js
```

### 3. Query Categories to Test

1. **General Queries**: "artificial intelligence trends 2024"
2. **Technical Queries**: "React hooks tutorial"
3. **News Queries**: "latest technology news"
4. **URL Extraction**: "https://example.com/article"
5. **Multi-language**: "intelligence artificielle" (French)

## Performance Optimization

### 1. Caching Strategy

Implement result caching to reduce API calls:

```javascript
class SearchCache {
  constructor(ttl = 3600000) { // 1 hour default
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  set(key, data) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.ttl
    });
  }
}
```

### 2. Request Batching

Batch multiple queries for efficiency:

```javascript
async function batchSearch(queries) {
  const promises = queries.map(query => 
    searchClient.search(query).catch(error => ({
      query,
      error: error.message
    }))
  );
  
  return Promise.all(promises);
}
```

### 3. Provider Health Monitoring

Monitor provider performance and auto-disable failing services:

```javascript
class ProviderHealthMonitor {
  constructor() {
    this.healthScores = new Map();
    this.checkInterval = setInterval(() => {
      this.checkProviderHealth();
    }, 300000); // 5 minutes
  }
  
  async checkProviderHealth() {
    // Test each provider with a simple query
    // Update health scores based on response time and success rate
  }
}
```

## Cost Analysis & Optimization

### Current vs New Approach

| Provider | Cost Model | Monthly Cost* | Quality | Speed |
|----------|------------|---------------|---------|-------|
| SerpAPI (current) | $50/1000 queries | $50-200 | High | Fast |
| SearXNG | Self-hosted | $5-10 | High | Medium |
| Google CSE | $5/1000 queries | $5-25 | Highest | Fast |
| Fetch MCP | Free | $0 | Medium | Fast |
| Hybrid Approach | Mixed | $10-50 | Highest | Fast |

*Based on ~1000-4000 queries/month

### Recommended Cost Strategy

1. **Primary**: SearXNG (free, high quality)
2. **Secondary**: Google CSE (paid, best quality)
3. **Fallback**: SerpAPI (existing, reliable)
4. **Content**: Fetch MCP (free, specialized)

Expected cost reduction: **60-80%**

## Migration Timeline

### Week 1-2: Setup & Testing
- [ ] Deploy SearXNG instance
- [ ] Setup Google Custom Search
- [ ] Test individual providers
- [ ] Deploy hybrid MCP server

### Week 3-4: Integration
- [ ] Update Tetika search functions
- [ ] Implement caching layer
- [ ] Add performance monitoring
- [ ] Parallel testing with SerpAPI

### Week 5-6: Optimization
- [ ] Fine-tune routing algorithms
- [ ] Optimize result processing
- [ ] Load testing and monitoring
- [ ] Documentation updates

### Week 7-8: Production
- [ ] Gradual rollout (10% -> 50% -> 100%)
- [ ] Monitor performance metrics
- [ ] Cost analysis validation
- [ ] SerpAPI deprecation planning

## Monitoring & Maintenance

### Key Metrics to Track

1. **Query Success Rate**: Target >95%
2. **Average Response Time**: Target <2 seconds
3. **Cost per Query**: Target <$0.01
4. **Result Quality Score**: User feedback based
5. **Provider Availability**: Uptime monitoring

### Alerting Setup

```javascript
// Simple alerting for critical issues
class AlertManager {
  constructor() {
    this.thresholds = {
      success_rate: 0.90,
      avg_response_time: 5000,
      error_rate: 0.10
    };
  }
  
  checkAlerts(metrics) {
    if (metrics.success_rate < this.thresholds.success_rate) {
      this.sendAlert('Low success rate', metrics);
    }
    // Additional checks...
  }
}
```

## Security Considerations

### 1. API Key Management
- Store API keys in environment variables
- Rotate keys regularly
- Monitor usage for anomalies

### 2. Rate Limiting
- Implement client-side rate limiting
- Respect provider rate limits
- Add backoff strategies

### 3. Content Filtering
- Validate and sanitize search results
- Filter malicious URLs
- Implement content quality checks

## Conclusion

The hybrid MCP approach provides:

✅ **Cost Reduction**: 60-80% savings vs SerpAPI alone  
✅ **Quality Improvement**: Multiple sources, deduplication  
✅ **Reliability**: Automatic failover and redundancy  
✅ **Privacy**: Self-hosted options available  
✅ **Flexibility**: Easy to add/remove providers  
✅ **Scalability**: Designed for high-volume usage  

**Next Steps**:
1. Set up the SearXNG instance as your primary provider
2. Deploy the hybrid MCP server with configuration
3. Integrate with your existing Tetika application
4. Monitor performance and optimize as needed
5. Gradually phase out SerpAPI dependency

This solution provides a robust, cost-effective alternative to your current SerpAPI implementation while maintaining or improving search quality and reliability.
