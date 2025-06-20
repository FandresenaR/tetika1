#!/usr/bin/env node

/**
 * Test simple pour l'API de scraping
 */

import { spawn } from 'child_process';
import http from 'http';

let serverProcess = null;
let API_BASE = 'http://localhost:3000';

// Fonction pour tester uniquement l'API de scraping
async function testScrapingAPI() {
  console.log('🌐 Test de l\'API de Scraping...');
  
  try {
    const requestBody = {
      query: 'https://vivatechnology.com/partners',
      mode: 'deep-scraping',
      maxSources: 5,
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
      return false;
    }

    const result = await response.json();
    console.log('✅ API Scraping - Résultat:', {
      success: result.success,
      stepsCount: result.steps?.length || 0,
      hasCompanies: !!result.companies,
      companiesCount: result.companies?.length || 0,
      totalFound: result.totalFound || 0,
      mcpMethod: result.mcpMethod || 'None'
    });

    return result.success;
  } catch (error) {
    console.error('❌ Erreur API Scraping:', error.message);
    return false;
  }
}

// Fonction pour vérifier si le serveur est accessible
async function checkServerHealth() {
  try {
    const response = await fetch(`${API_BASE}/api/scraping`, {
      method: 'GET'
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Fonction pour démarrer le serveur si nécessaire
async function startServerIfNeeded() {
  const isHealthy = await checkServerHealth();
  if (isHealthy) {
    console.log('✅ Serveur déjà accessible');
    return true;
  }
  
  console.log('⚠️  Serveur non détecté, démarrage automatique...');
  console.log('🚀 Démarrage du serveur Next.js...');
  
  serverProcess = spawn('npm', ['run', 'dev'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true
  });

  let serverReady = false;

  serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    process.stdout.write(output);
    
    // Detect the actual port being used
    const portMatch = output.match(/localhost:(\d+)/);
    if (portMatch) {
      const detectedPort = portMatch[1];
      API_BASE = `http://localhost:${detectedPort}`;
      console.log(`🔍 Port détecté: ${detectedPort}`);
    }
    
    if (output.includes('Ready in')) {
      serverReady = true;
    }
  });

  serverProcess.stderr.on('data', (data) => {
    process.stderr.write(data.toString());
  });

  // Attendre que le serveur soit prêt
  const maxWait = 30000; // 30 secondes
  const startTime = Date.now();
  
  while (!serverReady && (Date.now() - startTime) < maxWait) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  if (!serverReady) {
    console.error('❌ Timeout lors du démarrage du serveur');
    return false;
  }
  
  // Attendre encore 3 secondes pour être sûr
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Vérifier que l'API répond
  const healthCheck = await checkServerHealth();
  if (healthCheck) {
    console.log('✅ Serveur accessible, lancement des tests...');
    return true;
  } else {
    console.error('❌ Serveur démarré mais API non accessible');
    return false;
  }
}

// Fonction principale
async function main() {
  console.log('🧪 Test Simple du Système de Scraping');
  console.log('='.repeat(50));
  
  try {
    const serverStarted = await startServerIfNeeded();
    if (!serverStarted) {
      console.error('❌ Impossible de démarrer le serveur');
      process.exit(1);
    }
    
    const testResult = await testScrapingAPI();
    
    console.log('\n📋 RÉSUMÉ DU TEST');
    console.log('='.repeat(30));
    console.log(`🌐 API Scraping: ${testResult ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);
    
    if (testResult) {
      console.log('\n🎉 Test réussi !');
    } else {
      console.log('\n⚠️  Test échoué. Vérifiez les logs ci-dessus.');
    }
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
  } finally {
    // Arrêter le serveur si on l'a démarré
    if (serverProcess) {
      console.log('\n🛑 Arrêt du serveur de test...');
      serverProcess.kill();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// Gestion des signaux pour arrêter proprement le serveur
process.on('SIGINT', () => {
  console.log('\n\n🛑 Arrêt forcé...');
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit(0);
});

// Lancer le test
main().catch(console.error);
