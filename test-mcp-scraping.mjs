#!/usr/bin/env node

/**
 * Test script pour le système MCP de scraping intelligent
 * Teste l'extraction de données d'entreprises via les nouvelles APIs MCP
 */

import { spawn } from 'child_process';
import http from 'http';

const TEST_URL = 'https://vivatechnology.com/partners?hashtags=healthcare%2520%2526%2520wellness';
let API_BASE = 'http://localhost:3000'; // Default, will be updated based on server output

// Fonction pour démarrer le serveur Next.js
function startServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Démarrage du serveur Next.js...');
    
    const server = spawn('npm', ['run', 'dev'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    let serverReady = false;
    let serverOutput = '';    server.stdout.on('data', (data) => {
      const output = data.toString();
      serverOutput += output;
      process.stdout.write(output);
      
      // Detect the actual port being used
      const portMatch = output.match(/localhost:(\d+)/);
      if (portMatch) {
        const detectedPort = portMatch[1];
        API_BASE = `http://localhost:${detectedPort}`;
        console.log(`🔍 Port détecté: ${detectedPort}`);
      }
      
      if (output.includes('Ready in') || output.includes('ready on')) {
        if (!serverReady) {
          serverReady = true;
          setTimeout(() => resolve(server), 2000); // Attendre 2s supplémentaires
        }
      }
    });

    server.stderr.on('data', (data) => {
      const output = data.toString();
      serverOutput += output;
      process.stderr.write(output);
    });

    server.on('close', (code) => {
      if (!serverReady) {
        reject(new Error(`Server failed to start, exit code: ${code}`));
      }
    });

    // Timeout après 60 secondes
    setTimeout(() => {
      if (!serverReady) {
        server.kill();
        reject(new Error('Server start timeout'));
      }
    }, 60000);
  });
}

// Fonction pour vérifier si le serveur est accessible
async function checkServerHealth() {
  return new Promise((resolve) => {
    const req = http.get(`${API_BASE}/api/api-status`, (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => resolve(false));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Test de l'API MCP - Navigation Intelligente
async function testIntelligentNavigation() {
  console.log('\n🧠 Test de Navigation Intelligente MCP...');
  
  try {
    const response = await fetch(`${API_BASE}/api/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'intelligent_navigation',
        args: {
          url: TEST_URL,
          task: 'extract_companies',
          maxResults: 10,
          maxPages: 2
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Navigation Intelligente - Résultat:', {
      success: result.success,
      dataType: typeof result.data,
      hasContent: !!result.data?.content?.[0]?.text
    });

    if (result.success && result.data?.content?.[0]?.text) {
      const navigationData = JSON.parse(result.data.content[0].text);
      console.log(`📊 Entreprises trouvées: ${navigationData.totalFound || 0}`);
      console.log(`🔧 Méthode utilisée: ${navigationData.method || 'Unknown'}`);
      
      if (navigationData.companies && navigationData.companies.length > 0) {
        console.log('🏢 Exemple d\'entreprise:', {
          name: navigationData.companies[0].name,
          website: navigationData.companies[0].website,
          hasDescription: !!navigationData.companies[0].description
        });
      }
    }

    return result.success;
  } catch (error) {
    console.error('❌ Erreur Navigation Intelligente:', error.message);
    return false;
  }
}

// Test de l'API MCP - Extraction Directe
async function testDirectExtraction() {
  console.log('\n🎯 Test d\'Extraction Directe MCP...');
  
  try {
    const response = await fetch(`${API_BASE}/api/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'extract_company_data',
        args: {
          url: TEST_URL,
          extractionMode: 'company_directory',
          maxResults: 10
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Extraction Directe - Résultat:', {
      success: result.success,
      dataType: typeof result.data,
      hasContent: !!result.data?.content?.[0]?.text
    });

    if (result.success && result.data?.content?.[0]?.text) {
      const extractData = JSON.parse(result.data.content[0].text);
      console.log(`📊 Entreprises extraites: ${extractData.totalFound || 0}`);
      console.log(`🔧 Méthode utilisée: ${extractData.method || 'Unknown'}`);
    }

    return result.success;
  } catch (error) {
    console.error('❌ Erreur Extraction Directe:', error.message);
    return false;
  }
}

// Test de l'API de Scraping complète
async function testScrapingAPI() {
  console.log('\n🌐 Test de l\'API de Scraping complète...');
  
  try {
    const requestBody = {
      query: TEST_URL,
      mode: 'deep-scraping',
      maxSources: 10,
      includeAnalysis: true
    };
    
    console.log('📤 Données envoyées:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${API_BASE}/api/scraping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📥 Status de réponse:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('📄 Contenu de l\'erreur:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ API Scraping - Résultat:', {
      success: result.success,
      stepsCount: result.steps?.length || 0,
      hasReportData: !!result.reportData,
      companiesFound: result.reportData?.analysis?.companies?.length || 0
    });

    if (result.reportData?.analysis?.companies && result.reportData.analysis.companies.length > 0) {
      console.log('🏢 Entreprises extraites:', result.reportData.analysis.companies.map(c => ({
        name: c.name,
        hasWebsite: !!c.website,
        hasDescription: !!c.description
      })).slice(0, 3));
    }

    return result.success;
  } catch (error) {
    console.error('❌ Erreur API Scraping:', error.message);
    return false;
  }
}

// Fonction principale
async function main() {
  console.log('🧪 Test du Système MCP de Scraping Intelligent');
  console.log('=' .repeat(60));
  
  let server = null;
  
  try {
    // Vérifier si le serveur est déjà en cours
    const serverAlreadyRunning = await checkServerHealth();
    
    if (!serverAlreadyRunning) {
      console.log('⚠️  Serveur non détecté, démarrage automatique...');
      server = await startServer();
      
      // Attendre que le serveur soit complètement prêt
      let retries = 10;
      while (retries > 0 && !(await checkServerHealth())) {
        console.log(`⏳ Attente du serveur... (${retries} essais restants)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        retries--;
      }
      
      if (retries === 0) {
        throw new Error('Impossible de démarrer le serveur');
      }
    }
    
    console.log('✅ Serveur accessible, lancement des tests...');
    
    // Exécuter les tests
    const results = {
      intelligentNavigation: await testIntelligentNavigation(),
      directExtraction: await testDirectExtraction(),
      scrapingAPI: await testScrapingAPI()
    };
    
    // Résumé
    console.log('\n📋 RÉSUMÉ DES TESTS');
    console.log('=' .repeat(40));
    console.log(`🧠 Navigation Intelligente: ${results.intelligentNavigation ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);
    console.log(`🎯 Extraction Directe: ${results.directExtraction ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);
    console.log(`🌐 API Scraping: ${results.scrapingAPI ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);
    
    const successCount = Object.values(results).filter(Boolean).length;
    console.log(`\n🎉 Score: ${successCount}/3 tests réussis`);
    
    if (successCount === 3) {
      console.log('🚀 Tous les tests ont réussi ! Le système MCP est opérationnel.');
    } else {
      console.log('⚠️  Certains tests ont échoué. Vérifiez les logs ci-dessus.');
    }
    
  } catch (error) {
    console.error('💥 Erreur fatale:', error.message);
    process.exit(1);
  } finally {
    if (server) {
      console.log('\n🛑 Arrêt du serveur de test...');
      server.kill();
    }
  }
}

// Gestion des signaux
process.on('SIGINT', () => {
  console.log('\n👋 Arrêt du test demandé...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Arrêt du test...');
  process.exit(0);
});

// Lancement
main().catch(error => {
  console.error('💥 Erreur non gérée:', error);
  process.exit(1);
});
