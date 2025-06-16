#!/usr/bin/env node

/**
 * Test script for Fetch MCP integration
 * Tests the APIs that Fetch MCP uses directly
 */

async function testDuckDuckGoAPI() {
  console.log('\n=== Test DuckDuckGo API Direct ===');
  
  try {
    const query = 'intelligence artificielle';
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    
    console.log(`Test API DuckDuckGo: ${ddgUrl}`);
    
    const response = await fetch(ddgUrl);
    const data = await response.json();
    
    console.log('\nRéponse DuckDuckGo:');
    console.log({
      Abstract: data.Abstract?.substring(0, 100) + '...',
      AbstractText: data.AbstractText?.substring(0, 100) + '...',
      AbstractURL: data.AbstractURL,
      RelatedTopicsCount: data.RelatedTopics?.length || 0,
      AnswerType: data.AnswerType,
      Answer: data.Answer
    });
    
    if (data.AbstractText || data.Answer || (data.RelatedTopics && data.RelatedTopics.length > 0)) {
      console.log('✅ API DuckDuckGo fonctionne');
      return true;
    } else {
      console.log('⚠️ API DuckDuckGo: réponse vide');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erreur API DuckDuckGo:', error.message);
    return false;
  }
}

async function testWikipediaAPI() {
  console.log('\n=== Test Wikipedia API ===');
  
  try {
    const query = 'intelligence artificielle';
    const searchUrl = `https://fr.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=2&namespace=0&format=json&origin=*`;
    
    console.log(`Test API Wikipedia: ${searchUrl}`);
    
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    console.log('\nRéponse Wikipedia:');
    console.log({
      searchTerm: data[0],
      titlesCount: data[1]?.length || 0,
      titles: data[1]?.slice(0, 2),
      urls: data[3]?.slice(0, 2)
    });
    
    if (data[1] && data[1].length > 0) {
      console.log('✅ API Wikipedia fonctionne');
      return true;
    } else {
      console.log('⚠️ API Wikipedia: aucun résultat');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erreur API Wikipedia:', error.message);
    return false;
  }
}

async function testWebFetch() {
  console.log('\n=== Test Fetch Web Simple ===');
  
  try {
    const url = 'https://httpbin.org/json';
    console.log(`Test fetch simple: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Fetch web fonctionne');
      console.log('Données reçues:', Object.keys(data));
      return true;
    } else {
      console.log('❌ Fetch web échoué:', response.status);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erreur fetch web:', error.message);
    return false;
  }
}

async function testTetikaFetchMCPAPI() {
  console.log('\n=== Test API Tetika Fetch MCP ===');
  
  try {
    // Test si le serveur Tetika est en cours d'exécution
    const response = await fetch('http://localhost:3000/api/fetch-mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'search',
        query: 'test',
        options: { maxResults: 2 }
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Tetika Fetch MCP accessible');
      console.log('Réponse:', {
        success: data.success,
        hasData: !!data.data,
        error: data.error
      });
      return true;
    } else {
      console.log('⚠️ API Tetika Fetch MCP non accessible (serveur arrêté?)');
      return false;
    }
    
  } catch (error) {
    console.log('⚠️ Serveur Tetika non démarré:', error.message);
    console.log('   💡 Démarrez le serveur avec: npm run dev');
    return false;
  }
}

async function main() {
  console.log('🚀 Test d\'intégration Fetch MCP\n');
  
  const results = [];
  
  // Test les APIs externes
  results.push(await testDuckDuckGoAPI());
  results.push(await testWikipediaAPI());
  results.push(await testWebFetch());
  
  // Test l'API Tetika (optionnel si serveur en cours)
  results.push(await testTetikaFetchMCPAPI());
  
  const successCount = results.filter(Boolean).length;
  const totalTests = results.length;
  
  console.log('\n🎯 Résumé des tests:');
  console.log(`✅ Réussis: ${successCount}/${totalTests}`);
  
  if (successCount >= 3) {
    console.log('🎉 Fetch MCP prêt à être utilisé!');
  } else {
    console.log('⚠️ Quelques tests ont échoué, vérifiez la connectivité internet');
  }
  
  console.log('\n📋 Étapes suivantes:');
  console.log('1. Démarrez Tetika: npm run dev');
  console.log('2. Allez dans Paramètres > Recherche Web');
  console.log('3. Sélectionnez "Fetch MCP" comme fournisseur');
  console.log('4. Activez le mode RAG et testez une question');
}

// Exécuter les tests
main().catch(console.error);
