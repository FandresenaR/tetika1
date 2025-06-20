const fetch = require('node-fetch');

// Configuration
const API_BASE = 'http://localhost:3000';
const TEST_URL = 'https://vivatechnology.com/partners?hashtags=healthcare%2520%2526%2520wellness';

async function testMCPSystem() {
  console.log('🧪 Test du Système MCP de Scraping Intelligent');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: MCP Intelligent Navigation
    console.log('\n🧠 Test 1: MCP Intelligent Navigation...');
    const navResponse = await fetch(`${API_BASE}/api/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'intelligent_navigation',
        args: {
          url: TEST_URL,
          task: 'extract_companies',
          maxResults: 5,
          maxPages: 1
        }
      })
    });

    if (navResponse.ok) {
      const navResult = await navResponse.json();
      console.log('✅ Navigation intelligente:', {
        success: navResult.success,
        hasData: !!navResult.data
      });
      
      if (navResult.success && navResult.data?.content?.[0]?.text) {
        const data = JSON.parse(navResult.data.content[0].text);
        console.log(`📊 Entreprises trouvées: ${data.totalFound || 0}`);
      }
    } else {
      console.log('❌ Navigation intelligente échouée:', navResponse.status);
    }

    // Test 2: MCP Company Extraction
    console.log('\n🎯 Test 2: MCP Company Extraction...');
    const extractResponse = await fetch(`${API_BASE}/api/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'extract_company_data',
        args: {
          url: TEST_URL,
          extractionMode: 'company_directory',
          maxResults: 5
        }
      })
    });

    if (extractResponse.ok) {
      const extractResult = await extractResponse.json();
      console.log('✅ Extraction de données:', {
        success: extractResult.success,
        hasData: !!extractResult.data
      });
    } else {
      console.log('❌ Extraction de données échouée:', extractResponse.status);
    }

    // Test 3: API Status
    console.log('\n🔍 Test 3: API Status...');
    const statusResponse = await fetch(`${API_BASE}/api/api-status`);
    console.log('API Status:', statusResponse.ok ? '✅ OK' : '❌ KO');

    console.log('\n🎉 Tests terminés !');
    
  } catch (error) {
    console.error('💥 Erreur lors des tests:', error.message);
  }
}

// Lancement des tests
testMCPSystem();
