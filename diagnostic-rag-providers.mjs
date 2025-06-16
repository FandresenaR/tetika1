/**
 * Script de diagnostic pour Fetch MCP et SearXNG
 * Teste les fonctionnalités de recherche et identifie les problèmes
 */

import { FetchMCPProvider } from './lib/fetch-mcp-provider.js';

const testQueries = [
  'What are latest stock information',
  'Tesla stock price',
  'OpenAI GPT-4',
  'Paris weather',
  'JavaScript tutorial'
];

async function testFetchMCP() {
  console.log('🧪 === TEST FETCH MCP ===\n');
  
  const fetchMCP = new FetchMCPProvider();
  
  for (const query of testQueries) {
    console.log(`\n🔍 Test: "${query}"`);
    console.log('─'.repeat(50));
    
    try {
      const startTime = Date.now();
      const results = await fetchMCP.search(query, { maxResults: 3 });
      const endTime = Date.now();
      
      console.log(`⏱️  Temps de réponse: ${endTime - startTime}ms`);
      console.log(`📊 Résultats: ${results.organic_results?.length || 0}`);
      
      if (results.organic_results && results.organic_results.length > 0) {
        console.log('✅ Succès !');
        results.organic_results.slice(0, 2).forEach((result, index) => {
          console.log(`  ${index + 1}. ${result.title}`);
          console.log(`     ${result.snippet.substring(0, 80)}...`);
        });
      } else {
        console.log('❌ Aucun résultat trouvé');
      }
      
    } catch (error) {
      console.log('❌ Erreur:', error.message);
    }
  }
}

async function testSearXNGConnectivity() {
  console.log('\n🧪 === TEST SEARXNG CONNECTIVITY ===\n');
  
  const instances = [
    'https://searx.be',
    'https://searx.tiekoetter.com',
    'https://opnxng.com',
    'https://searxng.world',
    'https://searx.oloke.xyz'
  ];
  
  for (const instance of instances) {
    console.log(`🔗 Test de connectivité: ${instance}`);
    
    try {
      const response = await fetch(`${instance}/search?q=test&format=json`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });
      
      console.log(`  Status: ${response.status}`);
      console.log(`  Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('json')) {
          console.log('  ✅ JSON supporté');
        } else {
          console.log('  ⚠️  HTML seulement');
        }
      }
      
    } catch (error) {
      console.log(`  ❌ Erreur: ${error.message}`);
    }
  }
}

async function testDuckDuckGoAPI() {
  console.log('\n🧪 === TEST DUCKDUCKGO API ===\n');
  
  const testQuery = 'Tesla stock price';
  console.log(`🔍 Test: "${testQuery}"`);
  
  try {
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(testQuery)}&format=json&no_html=1&skip_disambig=1`;
    console.log(`📡 URL: ${ddgUrl}`);
    
    const response = await fetch(ddgUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });
    
    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📋 Données reçues:');
      console.log(`  AbstractText: ${data.AbstractText || 'N/A'}`);
      console.log(`  Answer: ${data.Answer || 'N/A'}`);
      console.log(`  RelatedTopics: ${data.RelatedTopics?.length || 0} sujets`);
      console.log(`  Definition: ${data.Definition || 'N/A'}`);
      
      if (data.AbstractText || data.Answer || (data.RelatedTopics && data.RelatedTopics.length > 0)) {
        console.log('✅ DuckDuckGo API fonctionne');
      } else {
        console.log('⚠️  DuckDuckGo API répond mais sans contenu utile');
      }
    } else {
      console.log('❌ DuckDuckGo API ne répond pas correctement');
    }
    
  } catch (error) {
    console.log(`❌ Erreur DuckDuckGo API: ${error.message}`);
  }
}

async function runDiagnostics() {
  console.log('🚀 DIAGNOSTIC TETIKA RAG PROVIDERS');
  console.log('='.repeat(50));
  
  await testFetchMCP();
  await testSearXNGConnectivity();
  await testDuckDuckGoAPI();
  
  console.log('\n✅ Diagnostic terminé !');
  console.log('\n💡 Conseils:');
  console.log('- Si Fetch MCP ne trouve pas de résultats, vérifiez la connectivité DuckDuckGo');
  console.log('- Si SearXNG échoue, essayez avec SerpAPI');
  console.log('- Les instances SearXNG peuvent être temporairement indisponibles');
}

// Exécuter le diagnostic si ce script est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  runDiagnostics().catch(console.error);
}

export { runDiagnostics, testFetchMCP, testSearXNGConnectivity, testDuckDuckGoAPI };
