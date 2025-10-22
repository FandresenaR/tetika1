#!/usr/bin/env node
/**
 * Script CLI pour synchroniser les modèles gratuits OpenRouter
 * Usage: node sync-openrouter-models.mjs [options]
 * 
 * Options:
 *   --stats    Afficher les statistiques détaillées
 *   --save     Sauvegarder dans un fichier JSON
 *   --output   Chemin du fichier de sortie (défaut: ./free-models.json)
 */

import { 
  fetchOpenRouterModels, 
  filterFreeModels, 
  convertToAppModel,
  sortModelsByQuality,
  getFreeModelsStats 
} from './lib/services/openRouterSync.ts';
import { writeFileSync } from 'fs';

const args = process.argv.slice(2);
const showStats = args.includes('--stats');
const saveToFile = args.includes('--save');
const outputIndex = args.indexOf('--output');
const outputFile = outputIndex !== -1 ? args[outputIndex + 1] : './free-models.json';

console.log('🔄 Synchronisation des modèles OpenRouter...\n');

try {
  // Récupérer tous les modèles
  console.log('📡 Récupération des modèles depuis l\'API OpenRouter...');
  const allModels = await fetchOpenRouterModels();
  console.log(`✅ ${allModels.length} modèles récupérés\n`);

  // Filtrer les modèles gratuits
  console.log('🔍 Filtrage des modèles gratuits...');
  const freeModels = filterFreeModels(allModels);
  console.log(`✅ ${freeModels.length} modèles gratuits trouvés\n`);

  // Convertir au format de l'application
  console.log('🔄 Conversion au format de l\'application...');
  const appModels = freeModels.map(convertToAppModel);
  const sortedModels = sortModelsByQuality(appModels);
  console.log(`✅ ${sortedModels.length} modèles convertis et triés\n`);

  // Afficher les statistiques si demandé
  if (showStats) {
    console.log('📊 STATISTIQUES\n');
    console.log('═'.repeat(60));
    
    const stats = {
      total: sortedModels.length,
      byProvider: {},
      withVision: sortedModels.filter(m => m.features.vision).length,
      averageContextLength: Math.round(
        sortedModels.reduce((sum, m) => sum + m.contextLength, 0) / sortedModels.length
      ),
      maxContextLength: Math.max(...sortedModels.map(m => m.contextLength)),
      minContextLength: Math.min(...sortedModels.map(m => m.contextLength)),
    };

    // Compter par provider
    sortedModels.forEach(model => {
      const provider = model.id.split('/')[0];
      stats.byProvider[provider] = (stats.byProvider[provider] || 0) + 1;
    });

    console.log(`Total de modèles gratuits: ${stats.total}`);
    console.log(`Modèles avec vision: ${stats.withVision}`);
    console.log(`Contexte moyen: ${stats.averageContextLength.toLocaleString()} tokens`);
    console.log(`Contexte max: ${stats.maxContextLength.toLocaleString()} tokens`);
    console.log(`Contexte min: ${stats.minContextLength.toLocaleString()} tokens`);
    console.log('\nRépartition par provider:');
    console.log('─'.repeat(60));
    
    Object.entries(stats.byProvider)
      .sort((a, b) => b[1] - a[1])
      .forEach(([provider, count]) => {
        const percentage = ((count / stats.total) * 100).toFixed(1);
        console.log(`  ${provider.padEnd(30)} ${count.toString().padStart(3)} (${percentage}%)`);
      });
    
    console.log('═'.repeat(60));
    console.log();
  }

  // Afficher les top 10 modèles
  console.log('🏆 TOP 10 MODÈLES GRATUITS\n');
  console.log('═'.repeat(80));
  sortedModels.slice(0, 10).forEach((model, index) => {
    const provider = model.id.split('/')[0];
    const contextK = (model.contextLength / 1000).toFixed(0);
    const vision = model.features.vision ? '👁️' : '  ';
    console.log(`${(index + 1).toString().padStart(2)}. ${vision} ${model.name.padEnd(40)} ${provider.padEnd(15)} ${contextK}k`);
  });
  console.log('═'.repeat(80));
  console.log();

  // Sauvegarder dans un fichier si demandé
  if (saveToFile) {
    console.log(`💾 Sauvegarde dans ${outputFile}...`);
    const output = {
      timestamp: new Date().toISOString(),
      count: sortedModels.length,
      models: sortedModels,
    };
    writeFileSync(outputFile, JSON.stringify(output, null, 2));
    console.log(`✅ Sauvegardé avec succès\n`);
  }

  console.log('✨ Synchronisation terminée avec succès!\n');
  console.log('💡 Options disponibles:');
  console.log('   --stats   Afficher les statistiques détaillées');
  console.log('   --save    Sauvegarder dans un fichier JSON');
  console.log('   --output  Spécifier le fichier de sortie (défaut: ./free-models.json)');
  console.log();

} catch (error) {
  console.error('❌ ERREUR:', error.message);
  console.error('\nDétails:', error);
  process.exit(1);
}
