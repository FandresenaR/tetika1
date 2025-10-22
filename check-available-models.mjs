/**
 * Script pour vérifier les modèles disponibles sur OpenRouter
 * et comparer avec le cache localStorage
 */

console.log('🔍 Vérification des modèles DeepSeek disponibles sur OpenRouter...\n');

async function checkModels() {
  try {
    // Récupérer les modèles depuis l'API OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log(`✅ Total de modèles sur OpenRouter: ${data.data.length}\n`);
    
    // Filtrer les modèles gratuits
    const freeModels = data.data.filter(model => {
      const promptPrice = parseFloat(model.pricing?.prompt || '0');
      const completionPrice = parseFloat(model.pricing?.completion || '0');
      return promptPrice === 0 && completionPrice === 0;
    });
    
    console.log(`💰 Modèles gratuits: ${freeModels.length}\n`);
    
    // Filtrer les modèles DeepSeek
    const deepseekModels = freeModels.filter(m => 
      m.id.toLowerCase().includes('deepseek')
    );
    
    console.log(`🎯 Modèles DeepSeek gratuits disponibles: ${deepseekModels.length}\n`);
    
    if (deepseekModels.length > 0) {
      console.log('📋 Liste des modèles DeepSeek gratuits:');
      deepseekModels.forEach((model, i) => {
        console.log(`  ${i + 1}. ${model.id}`);
        console.log(`     Nom: ${model.name}`);
        console.log(`     Contexte: ${model.context_length?.toLocaleString()} tokens\n`);
      });
    } else {
      console.log('❌ Aucun modèle DeepSeek gratuit disponible actuellement\n');
    }
    
    // Vérifier les modèles spécifiques qui causent des erreurs
    const problematicModels = [
      'deepseek/deepseek-r1-distill-qwen-32b:free',
      'deepseek/deepseek-r1-distill-qwen-14b:free',
      'agentica-org/deepcoder-14b-preview:free'
    ];
    
    console.log('⚠️  Vérification des modèles problématiques:\n');
    
    for (const modelId of problematicModels) {
      const exists = freeModels.some(m => m.id === modelId);
      console.log(`  ${exists ? '✅' : '❌'} ${modelId}`);
      console.log(`     Status: ${exists ? 'DISPONIBLE' : 'N\'EXISTE PLUS'}\n`);
    }
    
    // Suggestions
    console.log('\n💡 Solutions:');
    console.log('  1. Ouvrir l\'application TETIKA');
    console.log('  2. Cliquer sur ⚙️ Paramètres');
    console.log('  3. Onglet "Modèles"');
    console.log('  4. Cliquer sur "🔄 Actualiser"');
    console.log('\n  Cela supprimera les modèles obsolètes du cache.');
    
    // Modèles alternatifs recommandés
    if (deepseekModels.length > 0) {
      console.log('\n✨ Modèles DeepSeek alternatifs recommandés:');
      deepseekModels.slice(0, 3).forEach((model, i) => {
        console.log(`  ${i + 1}. ${model.name} (${model.id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkModels();
