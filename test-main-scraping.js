const http = require('http');

// Test direct de l'API de scraping principale
async function testMainScrapingAPI() {
  console.log('🌐 Test de l\'API de Scraping Principale');
  console.log('='.repeat(50));
  
  const requestBody = {
    query: 'https://vivatechnology.com/partners',
    mode: 'deep-scraping',
    maxSources: 5,
    includeAnalysis: true
  };
  
  console.log('📤 Données envoyées:', JSON.stringify(requestBody, null, 2));
  
  const postData = JSON.stringify(requestBody);
  
  const options = {
    hostname: 'localhost',
    port: 3001, // Port détecté
    path: '/api/scraping',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      console.log(`📥 Status: ${res.statusCode} ${res.statusMessage}`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(data);
            console.log('✅ Réponse JSON valide:');
            console.log(`- Success: ${result.success}`);
            console.log(`- Steps: ${result.steps ? result.steps.length : 'N/A'}`);
            console.log(`- Companies: ${result.companies ? result.companies.length : 'N/A'}`);
            console.log(`- MCP Method: ${result.mcpMethod || 'N/A'}`);
            console.log(`- Total Found: ${result.totalFound || 'N/A'}`);
            
            if (result.steps && result.steps.length > 0) {
              console.log('\n📋 Étapes de traitement:');
              result.steps.forEach((step, index) => {
                console.log(`${index + 1}. ${step.title} - ${step.status}`);
              });
            }
            
            if (result.companies && result.companies.length > 0) {
              console.log('\n🏢 Entreprises trouvées:');
              result.companies.slice(0, 3).forEach((company, index) => {
                console.log(`${index + 1}. ${company.name} - ${company.website}`);
              });
            }
            
            resolve(true);
          } catch (e) {
            console.log('❌ Réponse JSON invalide:', data.substring(0, 500));
            resolve(false);
          }
        } else {
          console.log(`❌ Erreur HTTP ${res.statusCode}:`, data);
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Erreur de connexion:', err.message);
      resolve(false);
    });
    
    req.setTimeout(60000, () => {
      req.destroy();
      console.log('⏰ Timeout (60s)');
      resolve(false);
    });
    
    req.write(postData);
    req.end();
  });
}

testMainScrapingAPI().then(success => {
  console.log('\n🎯 RÉSULTAT FINAL:');
  console.log(success ? '✅ API de scraping principale FONCTIONNE !' : '❌ Problème avec l\'API principale');
}).catch(console.error);
