/**
 * Script de test pour la recherche de symboles TradingView
 * Permet de vérifier quels symboles sont disponibles
 */

import { tradingViewSearchService } from './lib/services/tradingViewSearchService.ts';

async function testSymbolSearch() {
  console.log('🔍 Test de recherche de symboles TradingView\n');

  // Test 1: Rechercher GLD (Or)
  console.log('1️⃣ Recherche de "GLD" (Or)...');
  const gldResult = await tradingViewSearchService.searchSymbol('GLD');
  console.log(`   ✅ Trouvé ${gldResult.symbols.length} symbole(s):`);
  gldResult.symbols.slice(0, 3).forEach(s => {
    console.log(`      - ${s.symbol} | ${s.description} | ${s.type} | ${s.exchange}`);
  });
  console.log('');

  // Test 2: Rechercher USO (Pétrole)
  console.log('2️⃣ Recherche de "USO" (Pétrole)...');
  const usoResult = await tradingViewSearchService.searchSymbol('USO');
  console.log(`   ✅ Trouvé ${usoResult.symbols.length} symbole(s):`);
  usoResult.symbols.slice(0, 3).forEach(s => {
    console.log(`      - ${s.symbol} | ${s.description} | ${s.type} | ${s.exchange}`);
  });
  console.log('');

  // Test 3: Rechercher "crude oil" (alternatives au pétrole)
  console.log('3️⃣ Recherche de "crude oil" (alternatives)...');
  const oilResult = await tradingViewSearchService.searchSymbol('crude oil');
  console.log(`   ✅ Trouvé ${oilResult.symbols.length} symbole(s):`);
  oilResult.symbols.slice(0, 5).forEach(s => {
    console.log(`      - ${s.symbol} | ${s.description} | ${s.type} | ${s.exchange}`);
  });
  console.log('');

  // Test 4: Trouver le meilleur symbole pour chaque actif
  console.log('4️⃣ Recherche des meilleurs symboles pour nos actifs...');
  const assets = ['GLD', 'SLV', 'crude oil', 'AAPL', 'MSFT', 'TSLA', 'GOOGL', 'AMZN'];
  
  for (const asset of assets) {
    const bestSymbol = await tradingViewSearchService.findBestSymbol(asset);
    if (bestSymbol) {
      console.log(`   ${asset.padEnd(10)} → ${bestSymbol.symbol.padEnd(20)} | ${bestSymbol.description}`);
    } else {
      console.log(`   ${asset.padEnd(10)} → ❌ Aucun symbole trouvé`);
    }
  }
  console.log('');

  // Test 5: Recherche multiple en parallèle
  console.log('5️⃣ Recherche multiple en parallèle...');
  const multiResults = await tradingViewSearchService.searchMultipleAssets([
    'GLD', 'SLV', 'oil', 'AAPL', 'BTC'
  ]);
  
  Object.entries(multiResults).forEach(([asset, symbol]) => {
    if (symbol) {
      console.log(`   ${asset.padEnd(10)} → ${symbol.symbol}`);
    } else {
      console.log(`   ${asset.padEnd(10)} → ❌ Non trouvé`);
    }
  });

  console.log('\n✅ Tests terminés!');
}

// Exécuter les tests
testSymbolSearch().catch(console.error);
