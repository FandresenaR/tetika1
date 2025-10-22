/**
 * Vérification des modèles Moonshot AI disponibles
 */

console.log('🔍 Vérification des modèles Moonshot AI sur OpenRouter...\n');

async function checkMoonshotModels() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models');
    const data = await response.json();
    
    // Filtrer les modèles gratuits
    const freeModels = data.data.filter(model => {
      const promptPrice = parseFloat(model.pricing?.prompt || '0');
      const completionPrice = parseFloat(model.pricing?.completion || '0');
      return promptPrice === 0 && completionPrice === 0;
    });
    
    // Filtrer les modèles Moonshot
    const moonshotModels = freeModels.filter(m => 
      m.id.toLowerCase().includes('moonshot') || m.id.toLowerCase().includes('kimi')
    );
    
    console.log(`✅ Total modèles gratuits: ${freeModels.length}`);
    console.log(`🌙 Modèles Moonshot/Kimi gratuits: ${moonshotModels.length}\n`);
    
    if (moonshotModels.length > 0) {
      console.log('📋 Modèles Moonshot disponibles:');
      moonshotModels.forEach((model, i) => {
        console.log(`  ${i + 1}. ${model.id}`);
        console.log(`     ${model.name}`);
        console.log(`     Contexte: ${model.context_length?.toLocaleString()} tokens\n`);
      });
    } else {
      console.log('❌ Aucun modèle Moonshot/Kimi gratuit disponible\n');
    }
    
    // Vérifier le modèle spécifique
    const problematicModel = 'moonshotai/kimi-vl-a3b-thinking:free';
    const exists = freeModels.some(m => m.id === problematicModel);
    
    console.log(`⚠️  Modèle problématique:`);
    console.log(`  ${exists ? '✅' : '❌'} ${problematicModel}`);
    console.log(`     Status: ${exists ? 'DISPONIBLE' : 'N\'EXISTE PLUS'}\n`);
    
    // Liste des modèles recommandés
    console.log('\n💡 Modèles gratuits recommandés (top 10):');
    const topModels = freeModels
      .sort((a, b) => (b.context_length || 0) - (a.context_length || 0))
      .slice(0, 10);
    
    topModels.forEach((model, i) => {
      console.log(`  ${i + 1}. ${model.name}`);
      console.log(`     ID: ${model.id}`);
      console.log(`     Contexte: ${model.context_length?.toLocaleString()} tokens\n`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkMoonshotModels();
