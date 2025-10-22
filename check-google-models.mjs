/**
 * Vérification des modèles Google disponibles sur OpenRouter
 */

console.log('🔍 Vérification des modèles Google sur OpenRouter...\n');

async function checkGoogleModels() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models');
    const data = await response.json();
    
    // Filtrer les modèles gratuits
    const freeModels = data.data.filter(model => {
      const promptPrice = parseFloat(model.pricing?.prompt || '0');
      const completionPrice = parseFloat(model.pricing?.completion || '0');
      return promptPrice === 0 && completionPrice === 0;
    });
    
    // Filtrer les modèles Google
    const googleModels = freeModels.filter(m => 
      m.id.toLowerCase().startsWith('google/')
    );
    
    console.log(`✅ Total modèles gratuits: ${freeModels.length}`);
    console.log(`🔍 Modèles Google gratuits: ${googleModels.length}\n`);
    
    if (googleModels.length > 0) {
      console.log('📋 Modèles Google disponibles:');
      googleModels.forEach((model, i) => {
        console.log(`  ${i + 1}. ${model.id}`);
        console.log(`     ${model.name}`);
        console.log(`     Contexte: ${model.context_length?.toLocaleString()} tokens\n`);
      });
    } else {
      console.log('❌ Aucun modèle Google gratuit disponible\n');
    }
    
    // Vérifier le modèle spécifique
    const problematicModels = [
      'google/learnlm-1.5-pro-experimental:free',
      'google/gemini-2.0-flash-exp:free',
      'google/gemini-flash-1.5:free'
    ];
    
    console.log('⚠️  Vérification des modèles Google:');
    for (const modelId of problematicModels) {
      const exists = freeModels.some(m => m.id === modelId);
      const model = freeModels.find(m => m.id === modelId);
      console.log(`  ${exists ? '✅' : '❌'} ${modelId}`);
      if (exists && model) {
        console.log(`     Nom: ${model.name}`);
      }
      console.log(`     Status: ${exists ? 'DISPONIBLE' : 'INVALIDE OU N\'EXISTE PAS'}\n`);
    }
    
    // Afficher TOUS les IDs disponibles
    console.log('\n📝 Liste COMPLÈTE des 52 modèles gratuits disponibles:\n');
    freeModels.forEach((model, i) => {
      console.log(`${(i + 1).toString().padStart(2, ' ')}. ${model.id}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkGoogleModels();
