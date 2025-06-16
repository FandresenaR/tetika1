# SearXNG Configuration for RAG Research - Complete Setup Guide

## 🎯 Overview

This configuration optimizes SearXNG for comprehensive RAG (Retrieval-Augmented Generation) research across any subject. It provides intelligent search engine selection, category detection, and enhanced result extraction.

## 🔧 Features

### Intelligent Category Detection
Automatically detects the type of query and selects optimal search engines:

- **Academic/Research**: Google Scholar, ArXiv, PubMed, Semantic Scholar
- **Programming/IT**: StackOverflow, GitHub, SearchCode
- **Medical**: PubMed, Medical journals
- **Physics**: ArXiv, Physics journals  
- **Biology**: PubMed, Biology databases
- **News**: News sources, Reddit, HackerNews
- **General**: Wikipedia, Google, Bing, DuckDuckGo

### Optimized Search Engines

#### Primary Engines (High Weight)
- **Google** (2.0): Best overall coverage
- **Bing** (1.8): Alternative perspective
- **DuckDuckGo** (1.5): Privacy-focused

#### Academic Sources (Critical for Research)
- **Google Scholar** (2.5): Academic papers, citations
- **Semantic Scholar** (2.3): AI-powered research search
- **ArXiv** (2.2): Pre-prints, physics, CS, math
- **PubMed** (2.1): Medical literature
- **CrossRef** (2.0): DOI-based scholarly content

#### Technical Documentation
- **StackOverflow** (2.0): Programming Q&A
- **GitHub** (1.9): Code repositories
- **SearchCode** (1.7): Code search

#### Knowledge Sources
- **Wikipedia** (2.2): Encyclopedic knowledge
- **Wikidata** (1.8): Structured data

## 📋 Setup Instructions

### Method 1: Quick Setup (Recommended)

```bash
# Run the enhanced setup script
node mcp/setup-enhanced-searxng.mjs
```

### Method 2: Manual Setup

1. **Create Docker Compose**:
```bash
mkdir -p mcp/searxng-config
cd mcp/searxng-config
```

2. **Copy Configuration**:
```bash
cp ../searxng-rag-config.yml ./settings.yml
```

3. **Start SearXNG**:
```bash
# Linux/Mac
./start-searxng.sh

# Windows PowerShell
.\\start-searxng.ps1
```

### Method 3: Local SearXNG Instance

If you prefer to run your own SearXNG instance:

1. **Install SearXNG**:
```bash
git clone https://github.com/searxng/searxng.git
cd searxng
```

2. **Copy Configuration**:
```bash
cp ../tetika1/mcp/searxng-rag-config.yml ./searx/settings.yml
```

3. **Run SearXNG**:
```bash
make docker
```

## 🧪 Testing the Configuration

### Test Categories
```bash
node mcp/searxng-config/test-searxng.mjs
```

### Manual Testing

#### Academic Research
```
http://localhost:8888/search?q=machine+learning+algorithms&categories=science
```

#### Programming
```
http://localhost:8888/search?q=react+hooks+tutorial&categories=it
```

#### Current Events
```
http://localhost:8888/search?q=climate+change+2024&categories=news
```

#### General Knowledge
```
http://localhost:8888/search?q=quantum+computing&categories=general
```

## 📊 Usage in Your MCP Application

The enhanced SearXNG integration automatically:

1. **Detects query category** based on keywords
2. **Selects optimal engines** for that category
3. **Returns enriched results** with category information

### Example API Usage

```javascript
// The MCP route automatically detects category and optimizes search
const response = await fetch('/api/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tool: 'multi_provider_search',
    args: {
      query: 'machine learning transformer architecture',
      provider: 'searxng'
    }
  })
});

// Response includes detected category and optimized results
const result = await response.json();
console.log(result.category); // 'science' or 'it'
console.log(result.provider); // 'searxng-rag'
console.log(result.totalResults); // Number of results
```

## 🎛️ Advanced Configuration

### Custom Engine Weights

Edit `searxng-rag-config.yml` to adjust engine weights:

```yaml
engines:
  - name: google scholar
    weight: 3.0  # Increase for more academic focus
    
  - name: stackoverflow
    weight: 2.5  # Increase for more programming focus
```

### Category-Specific Optimization

Modify the `getOptimalEngines()` function in `app/api/mcp/route.ts`:

```typescript
const engineMaps: Record<string, string> = {
  'your_custom_category': 'specific,engines,for,category'
};
```

### Custom Search Instances

Add your own SearXNG instances in `performSearXNGSearch()`:

```typescript
const instances = [
  'https://your-searxng-instance.com',
  // ... existing instances
];
```

## 🔍 Search Quality Optimization

### Best Practices

1. **Use specific keywords**: More specific queries get better results
2. **Combine categories**: Mix general and specialized sources
3. **Monitor performance**: Check which engines work best for your use cases
4. **Update regularly**: Keep engine configurations current

### Query Optimization Examples

Instead of: `"AI"`
Use: `"machine learning neural networks applications"`

Instead of: `"coding help"`
Use: `"python flask error handling best practices"`

Instead of: `"science news"`
Use: `"2024 breakthrough quantum computing research"`

## 📈 Performance Monitoring

### Check Engine Performance
```bash
# View SearXNG logs
docker-compose logs searxng

# Monitor response times
curl -w "@curl-format.txt" "http://localhost:8888/search?q=test"
```

### Optimize Based on Usage
- Monitor which engines provide best results
- Adjust weights based on performance
- Add/remove engines based on reliability

## 🔧 Troubleshooting

### Common Issues

**SearXNG not starting:**
```bash
# Check Docker status
docker ps

# View logs
docker-compose logs searxng
```

**No results returned:**
- Check if instances are accessible
- Verify engine configuration
- Test with simple queries first

**Slow responses:**
- Reduce number of engines
- Adjust timeout values
- Use local Redis cache

### Debug Mode

Enable debug logging in `settings.yml`:
```yaml
general:
  debug: true
```

## 🎯 Subject-Specific Optimizations

### For Academic Research
- Enable all scholarly engines
- Increase timeouts for thorough search
- Prioritize peer-reviewed sources

### For Programming
- Focus on StackOverflow, GitHub
- Enable code-specific engines
- Quick response times

### For Current Events
- Prioritize news sources
- Enable social media engines
- Recent content focus

## 📚 Additional Resources

- [SearXNG Documentation](https://docs.searxng.org/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Search Engine Optimization Guide](https://docs.searxng.org/admin/engines.html)

## 🔄 Updates and Maintenance

Regular maintenance tasks:
1. Update Docker images monthly
2. Review and adjust engine weights
3. Test new SearXNG instances
4. Monitor search quality metrics
5. Update category detection keywords

This configuration provides a solid foundation for comprehensive research across any subject while maintaining high search quality and performance.
