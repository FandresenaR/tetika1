/**
 * Script pour forcer la synchronisation et nettoyer les modèles obsolètes
 */

console.log('🔄 Synchronisation forcée des modèles OpenRouter...\n');

async function syncModels() {
  try {
    // Appeler l'API de synchronisation
    const response = await fetch('http://localhost:3000/api/models/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ Synchronisation réussie!\n');
    console.log('📊 Statistiques:');
    console.log(`  Total de modèles: ${data.count}`);
    console.log(`  Modèles gratuits uniquement: Oui`);
    console.log(`  Timestamp: ${new Date(data.timestamp).toLocaleString('fr-FR')}`);
    
    if (data.models && data.models.length > 0) {
      console.log(`\n🎯 Premiers modèles disponibles:`);
      data.models.slice(0, 10).forEach((model, i) => {
        console.log(`  ${i + 1}. ${model.name} (${model.id})`);
      });
      
      // Vérifier si le modèle problématique existe
      const problematicModel = 'deepseek/deepseek-r1-distill-qwen-14b:free';
      const exists = data.models.some(m => m.id === problematicModel);
      
      console.log(`\n🔍 Vérification du modèle problématique:`);
      console.log(`  ID: ${problematicModel}`);
      console.log(`  Existe: ${exists ? '✅ OUI' : '❌ NON (supprimé)'}`);
      
      if (!exists) {
        console.log(`\n✅ Le modèle a été correctement supprimé de la liste!`);
      } else {
        console.log(`\n⚠️  Le modèle existe encore - vérifier l'API OpenRouter`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Le serveur Next.js doit être démarré:');
      console.log('   npm run dev');
    }
  }
}

syncModels();
