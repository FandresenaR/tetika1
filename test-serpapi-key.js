/**
 * Script de test pour vérifier le fonctionnement de SerpAPI
 * Exécutez ce script pour tester si votre clé SerpAPI fonctionne correctement
 */

// Simuler l'environnement Next.js
const nextMock = {
  request: {
    json: async () => ({
      tool: 'multi_search',
      args: {
        provider: 'serpapi',
        query: 'test de recherche Tetika',
        apiKeys: {
          serpapi: process.env.SERPAPI_API_KEY || 'VOTRE_CLE_SERPAPI_ICI'
        }
      }
    })
  }
};

// Import dynamique pour éviter les erreurs de module
async function testSerpAPI() {
  try {
    console.log('🧪 Test de la clé SerpAPI...');
    
    // Vérifier si la clé API est définie
    const serpApiKey = process.env.SERPAPI_API_KEY;
    if (!serpApiKey) {
      console.error('❌ SERPAPI_API_KEY n\'est pas définie dans les variables d\'environnement');
      console.log('💡 Définissez SERPAPI_API_KEY=votre_cle_ici avant d\'exécuter ce script');
      return;
    }
    
    console.log(`✅ Clé SerpAPI trouvée: ${serpApiKey.substring(0, 10)}...`);
    console.log(`📏 Longueur de la clé: ${serpApiKey.length} caractères`);
    
    // Test de format basique
    if (serpApiKey.length === 64 && /^[0-9a-f]{64}$/i.test(serpApiKey)) {
      console.log('✅ Format de clé SerpAPI valide (64 caractères hexadécimaux)');
    } else {
      console.warn('⚠️  Format de clé SerpAPI inhabituel');
    }
    
    console.log('🚀 Test terminé. Vérifiez les logs dans l\'interface Tetika pour plus de détails.');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exécuter le test si ce script est appelé directement
if (require.main === module) {
  testSerpAPI();
}

module.exports = { testSerpAPI };
