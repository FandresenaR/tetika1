const http = require('http');

// Test très simple pour diagnostiquer le problème
console.log('🧪 Diagnostic de l\'API de Scraping');
console.log('='.repeat(40));

// Test des différents ports
const ports = [3000, 3001, 3002, 3003];
let foundPort = null;

async function testPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/api/scraping`, (res) => {
      console.log(`✅ Port ${port}: ${res.statusCode} ${res.statusMessage}`);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`📄 Réponse du port ${port}:`, data.substring(0, 200) + '...');
          resolve(port);
        } else {
          resolve(null);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ Port ${port}: ${err.message}`);
      resolve(null);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      console.log(`⏰ Port ${port}: Timeout`);
      resolve(null);
    });
  });
}

async function testAPI(port) {
  const postData = JSON.stringify({
    query: 'https://vivatechnology.com/partners',
    mode: 'deep-scraping',
    maxSources: 5,
    includeAnalysis: true
  });

  const options = {
    hostname: 'localhost',
    port: port,
    path: '/api/scraping',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve) => {
    console.log(`🚀 Test POST sur le port ${port}...`);
    console.log(`📤 Données: ${postData}`);
    
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
      console.log('❌ Erreur de requête:', err.message);
      resolve(false);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      console.log('⏰ Timeout de la requête');
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  // Étape 1: Trouver le serveur
  console.log('🔍 Recherche du serveur...');
  for (const port of ports) {
    const result = await testPort(port);
    if (result) {
      foundPort = result;
      break;
    }
  }
  
  if (!foundPort) {
    console.log('❌ Aucun serveur trouvé. Lancez `npm run dev` dans un autre terminal.');
    process.exit(1);
  }
  
  console.log(`\n✅ Serveur trouvé sur le port ${foundPort}`);
  
  // Étape 2: Tester l'API POST
  console.log('\n🧪 Test de l\'API POST...');
  const testResult = await testAPI(foundPort);
  
  console.log('\n📋 RÉSUMÉ');
  console.log('='.repeat(20));
  console.log(`🌐 API accessible: ${foundPort ? '✅' : '❌'}`);
  console.log(`🚀 Test POST: ${testResult ? '✅' : '❌'}`);
  
  if (!testResult) {
    console.log('\n💡 CONSEILS DE DÉPANNAGE:');
    console.log('1. Vérifiez que le serveur Next.js fonctionne');
    console.log('2. Vérifiez les logs du serveur pour des erreurs');
    console.log('3. Testez avec une URL plus simple');
  }
}

main().catch(console.error);
