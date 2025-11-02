/**
 * Test du système de cache partagé
 */

console.log('🧪 Test du cache partagé de symboles\n');

const API_URL = 'http://localhost:3000/api/tradingview-search';

async function testSharedCache() {
  try {
    // Test 1: Rechercher Bitcoin et le mettre en cache
    console.log('1️⃣ Test: Rechercher et mettre en cache Bitcoin');
    const btcResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'findBest',
        assetName: 'Bitcoin'
      })
    });
    const btcData = await btcResponse.json();
    console.log('   Résultat:', btcData.symbol ? `✅ ${btcData.symbol.symbol}` : '❌ Non trouvé');
    console.log('');

    // Test 2: Vérifier que Bitcoin est dans le cache
    console.log('2️⃣ Test: Vérifier le cache pour Bitcoin');
    const cacheCheckResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'getCache',
        symbol: 'BITCOIN'
      })
    });
    const cacheData = await cacheCheckResponse.json();
    console.log('   Cache:', cacheData.cached ? `✅ ${cacheData.symbol}` : '❌ Pas en cache');
    console.log('');

    // Test 3: Obtenir tout le cache
    console.log('3️⃣ Test: Récupérer tout le cache');
    const allCacheResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'getAllCache'
      })
    });
    const allCache = await allCacheResponse.json();
    console.log('   Taille du cache:', allCache.stats.size);
    console.log('   Symboles disponibles:');
    Object.entries(allCache.symbols).forEach(([local, tv]) => {
      console.log(`      ${local} → ${tv}`);
    });
    console.log('');

    // Test 4: Ajouter manuellement un symbole
    console.log('4️⃣ Test: Ajouter manuellement Ethereum au cache');
    const addResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'addToCache',
        localSymbol: 'ETH',
        tradingViewSymbol: 'BINANCE:ETHUSDT',
        description: 'Ethereum / TetherUS'
      })
    });
    const addData = await addResponse.json();
    console.log('   Ajout:', addData.success ? '✅ Succès' : '❌ Échec');
    console.log('');

    // Test 5: Vérifier que ETH est maintenant en cache
    console.log('5️⃣ Test: Vérifier ETH dans le cache');
    const ethCacheResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'getCache',
        symbol: 'ETH'
      })
    });
    const ethCache = await ethCacheResponse.json();
    console.log('   Cache ETH:', ethCache.cached ? `✅ ${ethCache.symbol}` : '❌ Pas en cache');

    console.log('\n✅ Tests terminés!');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n⚠️  Assurez-vous que le serveur est démarré (npm run dev)');
  }
}

testSharedCache();
