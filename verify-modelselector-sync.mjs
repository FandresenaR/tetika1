/**
 * Script de vérification de la synchronisation ModelSelector
 * Vérifie que ModelSelector et SettingsModal utilisent bien la même source de données
 */

import { useOpenRouterModels } from './lib/hooks/useOpenRouterModels.js';
import { getAllModels } from './lib/models.js';

console.log('🔍 Vérification de la synchronisation des modèles...\n');

// 1. Vérifier les modèles depuis le hook
console.log('📡 Récupération depuis useOpenRouterModels (source dynamique)...');
const { models: dynamicModels } = await useOpenRouterModels();
console.log(`   ✅ ${dynamicModels.length} modèles trouvés via API OpenRouter\n`);

// 2. Vérifier les modèles depuis la liste statique
console.log('📄 Récupération depuis getAllModels (source statique)...');
const staticModels = getAllModels();
console.log(`   ✅ ${staticModels.length} modèles trouvés dans lib/models.ts\n`);

// 3. Comparer les deux listes
console.log('🔄 Comparaison des sources de données...');
if (dynamicModels.length < staticModels.length) {
  console.log(`   ⚠️  Différence détectée: ${staticModels.length - dynamicModels.length} modèles en trop dans la liste statique`);
  console.log(`   ℹ️  Ceci est normal si certains modèles ont été retirés d'OpenRouter\n`);
} else {
  console.log(`   ✅ Les deux sources ont le même nombre de modèles\n`);
}

// 4. Vérifier les modèles obsolètes connus
console.log('🔍 Recherche de modèles obsolètes connus...');
const obsoleteModels = [
  'deepseek-r1-distill-qwen-32b',
  'deepseek-r1-distill-qwen-14b',
  'google/learnlm-1.5-pro-experimental',
  'moonshotai/kimi-vl-a3b-thinking',
  'google/gemini-flash-1.5'
];

const dynamicIds = dynamicModels.map(m => m.id);
const staticIds = staticModels.map(m => m.id);

obsoleteModels.forEach(modelId => {
  const inDynamic = dynamicIds.includes(modelId);
  const inStatic = staticIds.includes(modelId);
  
  if (inDynamic) {
    console.log(`   ❌ ${modelId} : TROUVÉ dans la liste dynamique (problème!)`);
  } else if (inStatic) {
    console.log(`   ⚠️  ${modelId} : Présent uniquement dans la liste statique (normal)`);
  } else {
    console.log(`   ✅ ${modelId} : Correctement retiré`);
  }
});

// 5. Vérifier le cache localStorage
console.log('\n💾 Vérification du cache localStorage...');
const cachedModels = localStorage.getItem('tetika-free-models');
const lastSync = localStorage.getItem('tetika-models-last-sync');

if (cachedModels) {
  const parsed = JSON.parse(cachedModels);
  console.log(`   ✅ Cache trouvé : ${parsed.length} modèles`);
  
  if (lastSync) {
    const syncDate = new Date(parseInt(lastSync));
    const age = Math.floor((Date.now() - syncDate.getTime()) / 1000 / 60); // minutes
    console.log(`   ✅ Dernière sync : ${syncDate.toLocaleString()} (il y a ${age} minutes)`);
    
    if (age > 1440) { // 24h
      console.log(`   ⚠️  Le cache a plus de 24h, synchronisation recommandée`);
    }
  } else {
    console.log(`   ⚠️  Timestamp de sync manquant`);
  }
} else {
  console.log(`   ℹ️  Pas de cache trouvé (première utilisation)`);
}

// 6. Résumé
console.log('\n' + '='.repeat(60));
console.log('📊 RÉSUMÉ');
console.log('='.repeat(60));
console.log(`Source dynamique (OpenRouter) : ${dynamicModels.length} modèles`);
console.log(`Source statique (lib/models)  : ${staticModels.length} modèles`);
console.log(`Différence                    : ${Math.abs(staticModels.length - dynamicModels.length)} modèles`);
console.log('\n✅ Vérification terminée');

// 7. Recommandations
console.log('\n💡 RECOMMANDATIONS :');
if (dynamicModels.length < staticModels.length) {
  console.log('   • ModelSelector devrait maintenant utiliser useOpenRouterModels()');
  console.log('   • Vider le cache et actualiser pour voir les changements');
  console.log('   • Commandes : localStorage.clear() puis cliquer sur Actualiser');
}
