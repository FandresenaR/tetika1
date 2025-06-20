const http = require('http');

async function testSimpleAPI() {
  console.log('🧪 Test de l\'API de Test Simple');
  console.log('='.repeat(40));
  
  // Test GET first
  console.log('1️⃣ Test GET...');
  const getResult = await testEndpoint('/api/test-scraping', 'GET');
  
  // Test POST
  console.log('\n2️⃣ Test POST...');
  const postData = {
    query: 'https://vivatechnology.com/partners',
    mode: 'deep-scraping',
    maxSources: 5,
    includeAnalysis: true
  };
  
  const postResult = await testEndpoint('/api/test-scraping', 'POST', postData);
  
  // Test with problematic URL
  console.log('\n3️⃣ Test POST avec URL complexe...');
  const complexData = {
    query: 'https://vivatechnology.com/partners?hashtags=healthcare%2520%2526%2520wellness',
    mode: 'deep-scraping',
    maxSources: 5,
    includeAnalysis: true
  };
  
  const complexResult = await testEndpoint('/api/test-scraping', 'POST', complexData);
  
  console.log('\n📋 RÉSUMÉ DES TESTS');
  console.log('='.repeat(30));
  console.log(`✅ GET: ${getResult ? 'SUCCÈS' : 'ÉCHEC'}`);
  console.log(`✅ POST Simple: ${postResult ? 'SUCCÈS' : 'ÉCHEC'}`);
  console.log(`✅ POST Complexe: ${complexResult ? 'SUCCÈS' : 'ÉCHEC'}`);
}

async function testEndpoint(path, method, data = null) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: findPort(),
      path: path,
      method: method,
      headers: method === 'POST' ? {
        'Content-Type': 'application/json'
      } : {}
    };
    
    const postData = data ? JSON.stringify(data) : null;
    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
      console.log(`📤 Envoi: ${postData}`);
    }
    
    const req = http.request(options, (res) => {
      console.log(`📥 Status: ${res.statusCode} ${res.statusMessage}`);
      
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(responseData);
            console.log('✅ Réponse:', JSON.stringify(result, null, 2));
            resolve(true);
          } catch (e) {
            console.log('❌ JSON invalide:', responseData);
            resolve(false);
          }
        } else {
          console.log(`❌ Erreur ${res.statusCode}:`, responseData);
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Erreur de connexion:', err.message);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.log('❌ Timeout');
      resolve(false);
    });
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

function findPort() {
  // Try to detect port from environment or use default
  const ports = [3000, 3001, 3002];
  // For now, just return 3000 - in a real scenario, we'd test each port
  return 3000;
}

testSimpleAPI().catch(console.error);
