#!/usr/bin/env node

/**
 * Enhanced SearXNG Setup Script for RAG Research
 * Optimizes SearXNG instance configuration for comprehensive research across all subjects
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const SEARXNG_CONFIG_DIR = './mcp/searxng-config';
const SEARXNG_DATA_DIR = './mcp/searxng-data';

console.log('🔧 Setting up SearXNG for RAG Research...\n');

// Create directories
[SEARXNG_CONFIG_DIR, SEARXNG_DATA_DIR].forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Enhanced Docker Compose configuration
const dockerComposeConfig = `version: '3.8'

services:
  searxng:
    container_name: tetika-searxng-research
    image: searxng/searxng:latest
    restart: unless-stopped
    ports:
      - "8888:8080"
    volumes:
      - ./searxng-config:/etc/searxng:rw
      - ./searxng-data:/var/lib/searxng:rw
    environment:
      - SEARXNG_BASE_URL=http://localhost:8888/
      - SEARXNG_SECRET=tetika_research_secret_key_2024
    networks:
      - searxng
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - SETGID
      - SETUID
    logging:
      driver: "json-file"
      options:
        max-size: "1m"
        max-file: "1"

  redis:
    container_name: tetika-searxng-redis
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --save 30 1 --loglevel warning
    volumes:
      - redis-data:/data
    networks:
      - searxng
    cap_drop:
      - ALL
    cap_add:
      - SETGID
      - SETUID
      - DAC_OVERRIDE

networks:
  searxng:
    driver: bridge

volumes:
  redis-data:
`;

// Write Docker Compose file
writeFileSync(join(SEARXNG_CONFIG_DIR, 'docker-compose.yml'), dockerComposeConfig);
console.log('✅ Created Docker Compose configuration');

// Copy the enhanced config file
const configSource = './mcp/searxng-rag-config.yml';
const configDest = join(SEARXNG_CONFIG_DIR, 'settings.yml');

if (existsSync(configSource)) {
  const configContent = readFileSync(configSource, 'utf8');
  writeFileSync(configDest, configContent);
  console.log('✅ Copied enhanced RAG configuration');
} else {
  console.log('⚠️  Warning: searxng-rag-config.yml not found, using default config');
}

// Create startup script
const startupScript = `#!/bin/bash

echo "🚀 Starting SearXNG for RAG Research..."

# Navigate to config directory
cd "${SEARXNG_CONFIG_DIR}"

# Pull latest images
echo "📦 Pulling latest Docker images..."
docker-compose pull

# Start services
echo "🔧 Starting SearXNG services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if SearXNG is running
if curl -s http://localhost:8888/ > /dev/null; then
    echo "✅ SearXNG is running at http://localhost:8888"
    echo "🔍 Test search: http://localhost:8888/search?q=test&categories=general"
    echo ""
    echo "📊 Available categories for RAG research:"
    echo "  - general: Broad search across multiple engines"
    echo "  - science: Academic papers, journals, research"
    echo "  - it: Programming, technical documentation"
    echo "  - news: Current events, breaking news"
    echo ""
    echo "🎯 Optimized for subjects:"
    echo "  - Academic research (Google Scholar, ArXiv, PubMed)"
    echo "  - Programming (StackOverflow, GitHub)"
    echo "  - General knowledge (Wikipedia, multiple engines)"
    echo "  - Current events (News sources, Reddit, HackerNews)"
else
    echo "❌ SearXNG failed to start. Check logs with:"
    echo "   docker-compose logs searxng"
fi
`;

writeFileSync(join(SEARXNG_CONFIG_DIR, 'start-searxng.sh'), startupScript);
execSync(`chmod +x "${join(SEARXNG_CONFIG_DIR, 'start-searxng.sh')}"`);
console.log('✅ Created startup script');

// Create PowerShell startup script for Windows
const powershellScript = `# SearXNG RAG Research Startup Script

Write-Host "🚀 Starting SearXNG for RAG Research..." -ForegroundColor Green

# Navigate to config directory
Set-Location "${SEARXNG_CONFIG_DIR.replace(/\//g, '\\')}"

# Pull latest images
Write-Host "📦 Pulling latest Docker images..." -ForegroundColor Yellow
docker-compose pull

# Start services
Write-Host "🔧 Starting SearXNG services..." -ForegroundColor Yellow
docker-compose up -d

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep 10

# Check if SearXNG is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8888/" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ SearXNG is running at http://localhost:8888" -ForegroundColor Green
        Write-Host "🔍 Test search: http://localhost:8888/search?q=test&categories=general" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📊 Available categories for RAG research:" -ForegroundColor White
        Write-Host "  - general: Broad search across multiple engines" -ForegroundColor Gray
        Write-Host "  - science: Academic papers, journals, research" -ForegroundColor Gray
        Write-Host "  - it: Programming, technical documentation" -ForegroundColor Gray
        Write-Host "  - news: Current events, breaking news" -ForegroundColor Gray
        Write-Host ""
        Write-Host "🎯 Optimized for subjects:" -ForegroundColor White
        Write-Host "  - Academic research (Google Scholar, ArXiv, PubMed)" -ForegroundColor Gray
        Write-Host "  - Programming (StackOverflow, GitHub)" -ForegroundColor Gray
        Write-Host "  - General knowledge (Wikipedia, multiple engines)" -ForegroundColor Gray
        Write-Host "  - Current events (News sources, Reddit, HackerNews)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ SearXNG failed to start. Check logs with:" -ForegroundColor Red
    Write-Host "   docker-compose logs searxng" -ForegroundColor Yellow
}
`;

writeFileSync(join(SEARXNG_CONFIG_DIR, 'start-searxng.ps1'), powershellScript);
console.log('✅ Created PowerShell startup script');

// Create test script
const testScript = `#!/usr/bin/env node

/**
 * Test script for SearXNG RAG Research configuration
 */

import axios from 'axios';

const SEARXNG_URL = 'http://localhost:8888';

const testQueries = [
  { query: 'machine learning algorithms', category: 'science', description: 'Scientific research' },
  { query: 'react hooks tutorial', category: 'it', description: 'Programming documentation' },
  { query: 'climate change 2024', category: 'news', description: 'Current events' },
  { query: 'quantum computing', category: 'general', description: 'General knowledge' },
];

async function testSearXNG() {
  console.log('🧪 Testing SearXNG RAG Research Configuration...\\n');
  
  for (const test of testQueries) {
    try {
      console.log(\`🔍 Testing: \${test.query} (\${test.description})\`);
      
      const response = await axios.get(\`\${SEARXNG_URL}/search\`, {
        params: {
          q: test.query,
          categories: test.category,
          format: 'json'
        },
        timeout: 10000
      });
      
      if (response.data && response.data.results) {
        console.log(\`✅ Found \${response.data.results.length} results\`);
        if (response.data.results[0]) {
          console.log(\`   First result: \${response.data.results[0].title}\`);
        }
      } else {
        console.log('⚠️  No results found');
      }
    } catch (error) {
      console.log(\`❌ Error: \${error.message}\`);
    }
    console.log('');
  }
}

testSearXNG().catch(console.error);
`;

writeFileSync(join(SEARXNG_CONFIG_DIR, 'test-searxng.mjs'), testScript);
console.log('✅ Created test script');

console.log('\n🎉 SearXNG RAG Research setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Make sure Docker is running');
console.log('2. Run the startup script:');
console.log(`   cd ${SEARXNG_CONFIG_DIR}`);
console.log('   ./start-searxng.sh (Linux/Mac)');
console.log('   .\\start-searxng.ps1 (Windows PowerShell)');
console.log('3. Test the configuration:');
console.log('   node test-searxng.mjs');
console.log('\n🔗 SearXNG will be available at: http://localhost:8888');
