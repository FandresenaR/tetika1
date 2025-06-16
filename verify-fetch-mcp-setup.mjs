#!/usr/bin/env node

/**
 * Script de vérification finale pour Fetch MCP
 * Vérifie que tout est correctement configuré dans Tetika
 */

import fs from 'fs/promises';
import path from 'path';

async function checkFileExists(filePath, description) {
  try {
    await fs.access(filePath);
    console.log(`✅ ${description}: ${filePath}`);
    return true;
  } catch (error) {
    console.log(`❌ ${description} manquant: ${filePath}`);
    return false;
  }
}

async function checkFileContent(filePath, searchString, description) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    if (content.includes(searchString)) {
      console.log(`✅ ${description} configuré dans: ${filePath}`);
      return true;
    } else {
      console.log(`❌ ${description} non trouvé dans: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Erreur lecture ${filePath}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Vérification de la configuration Fetch MCP\n');
  
  const checks = [];
  
  // Vérifier les fichiers principaux
  checks.push(await checkFileExists('./lib/fetch-mcp-provider.ts', 'Provider Fetch MCP'));
  checks.push(await checkFileExists('./app/api/fetch-mcp/route.ts', 'API Route Fetch MCP'));
  checks.push(await checkFileExists('./mcp/tools/fetch-mcp.js', 'Outil MCP Fetch'));
  checks.push(await checkFileExists('./mcp/servers/tetika-agent-with-fetch.js', 'Serveur MCP avec Fetch'));
  
  // Vérifier les configurations
  checks.push(await checkFileContent('./lib/rag-providers.ts', 'fetch-mcp', 'Fetch MCP dans providers RAG'));
  checks.push(await checkFileContent('./app/api/mcp/route.ts', 'fetch-mcp', 'Fetch MCP dans API MCP'));
  checks.push(await checkFileContent('./package.json', 'test:fetch-mcp', 'Script de test Fetch MCP'));
  
  // Vérifier que Node.js peut accéder aux dépendances
  try {
    const packageJson = JSON.parse(await fs.readFile('./package.json', 'utf8'));
    const hasFetch = 'node-fetch' in (packageJson.dependencies || {});
    const hasJSDOM = 'jsdom' in (packageJson.dependencies || {});
    
    if (hasFetch && hasJSDOM) {
      console.log('✅ Dépendances Fetch MCP installées (node-fetch, jsdom)');
      checks.push(true);
    } else {
      console.log('❌ Dépendances manquantes. Exécutez: npm install node-fetch jsdom');
      checks.push(false);
    }
  } catch (error) {
    console.log('❌ Erreur lecture package.json:', error.message);
    checks.push(false);
  }
  
  const successCount = checks.filter(Boolean).length;
  const totalChecks = checks.length;
  
  console.log('\n🎯 Résumé de la vérification:');
  console.log(`✅ Validations réussies: ${successCount}/${totalChecks}`);
  
  if (successCount === totalChecks) {
    console.log('\n🎉 Fetch MCP est entièrement configuré et prêt à l\'utilisation !');
    console.log('\n📋 Guide d\'utilisation:');
    console.log('1. Démarrez Tetika: npm run dev');
    console.log('2. Allez dans Paramètres > Recherche Web');
    console.log('3. Sélectionnez "Fetch MCP" comme fournisseur');
    console.log('4. Testez avec une question en mode RAG');
    console.log('\n🔧 Fonctionnalités disponibles:');
    console.log('• Recherche web via DuckDuckGo + Wikipedia');
    console.log('• Extraction de contenu de pages web');
    console.log('• API REST: /api/fetch-mcp');
    console.log('• Intégration MCP pour clients externes');
    console.log('• Aucune clé API requise');
  } else {
    console.log('\n⚠️ Configuration incomplète. Vérifiez les éléments manquants ci-dessus.');
  }
  
  console.log('\n📖 Documentation: FETCH-MCP-CONFIGURATION.md');
}

main().catch(console.error);
