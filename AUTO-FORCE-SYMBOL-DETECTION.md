# Mécanisme de Détection et Forçage Automatique

## 🎯 Problème résolu

**Avant** : L'IA répondait directement sans utiliser `find_best_tradingview_symbol`, donc le symbole n'était jamais mis en cache.

**Après** : Le système **détecte automatiquement** les mots-clés crypto et **force** l'utilisation de l'outil même si l'IA ne le fait pas.

## 🔍 Détection automatique

### Mots-clés surveillés

```typescript
const cryptoKeywords = [
  'bitcoin', 'btc',
  'ethereum', 'eth',
  'crypto',
  'dogecoin', 'doge',
  'litecoin', 'ltc',
  'ripple', 'xrp'
];
```

Si l'utilisateur tape **n'importe lequel** de ces mots → Détection activée !

### Extraction du nom

Le système extrait intelligemment le nom de la crypto :

```typescript
if (message.includes('ethereum')) → cryptoName = 'Ethereum'
if (message.includes('bitcoin'))  → cryptoName = 'Bitcoin'
if (message.includes('dogecoin')) → cryptoName = 'Dogecoin'
// etc.
```

## ⚙️ Mécanisme de forçage

### Workflow automatique

```
1. User: "Montre-moi Bitcoin"
   ↓
2. Système détecte "bitcoin" → needsSymbolSearch = true
   ↓
3. IA analyse et retourne: {"needs_tools": false, "response": "..."}
   ↓
4. 🔧 FORÇAGE AUTOMATIQUE:
   - Système ajoute find_best_tradingview_symbol
   - toolsToExecute.push({
       type: 'find_best_tradingview_symbol',
       params: { assetName: 'Bitcoin' }
     })
   - needsTools = true (forcé)
   ↓
5. find_best_tradingview_symbol exécuté
   ↓
6. Symbole trouvé: BINANCE:BTCUSDT
   ↓
7. Mise en cache automatique
   ↓
8. Widget utilise le cache → Graphique affiché ✅
```

### Code du forçage

```typescript
// Si crypto détectée ET pas déjà dans les outils
if (needsSymbolSearch && !toolsToExecute.some(t => t.type === 'find_best_tradingview_symbol')) {
  console.log('[Trading API] 🔍 Crypto détectée, ajout forcé');
  
  // Extraction du nom
  let cryptoName = 'Bitcoin'; // Défaut
  if (message.includes('ethereum')) cryptoName = 'Ethereum';
  // ...
  
  // Forcer l'outil
  toolsToExecute.push({
    type: 'find_best_tradingview_symbol',
    params: { assetName: cryptoName }
  });
  
  needsTools = true; // Forcer l'exécution
}
```

## 📊 Prompt système renforcé

### Règles critiques ajoutées

```
RÈGLES CRITIQUES - TU DOIS LES SUIVRE:
❗ Si Bitcoin, BTC, Ethereum, ETH, crypto → UTILISE find_best_tradingview_symbol
❗ Si graphique pour nouvel actif → UTILISE find_best_tradingview_symbol
❗ Si "montre", "affiche", "graphique" pour symbole inconnu → UTILISE find_best_tradingview_symbol
❗ NE RÉPONDS JAMAIS directement sans utiliser les outils pour un nouveau symbole!
```

### Actifs connus (pas besoin de recherche)

```
ACTIFS CONNUS (pas besoin de recherche):
- GLD, USO, SLV, AAPL, MSFT, TSLA, GOOGL, AMZN
```

### Workflow obligatoire

```
WORKFLOW OBLIGATOIRE pour BTC, ETH, etc:
1. TOUJOURS utiliser find_best_tradingview_symbol d'abord
2. PUIS select_asset si l'utilisateur veut changer d'actif
3. Le widget affichera automatiquement le graphique
```

## 🎬 Exemples de détection

### Exemple 1 : Bitcoin

**Input** : `"Montre-moi le graphique de Bitcoin"`

**Détection** :
- ✅ Mot-clé détecté : "bitcoin"
- ✅ Extraction : cryptoName = "Bitcoin"
- ✅ Forçage : find_best_tradingview_symbol({assetName: "Bitcoin"})

**Résultat** :
- Symbole trouvé : `BINANCE:BTCUSDT`
- Mis en cache : `BITCOIN → BINANCE:BTCUSDT`
- Widget affiche le graphique ✅

### Exemple 2 : Ethereum

**Input** : `"Analyse ETH pour moi"`

**Détection** :
- ✅ Mot-clé détecté : "eth"
- ✅ Extraction : cryptoName = "Ethereum"
- ✅ Forçage : find_best_tradingview_symbol({assetName: "Ethereum"})

**Résultat** :
- Symbole trouvé : `BINANCE:ETHUSDT`
- Mis en cache : `ETHEREUM → BINANCE:ETHUSDT`
- Widget affiche le graphique ✅

### Exemple 3 : Crypto générique

**Input** : `"Quelles sont les meilleures crypto du moment?"`

**Détection** :
- ✅ Mot-clé détecté : "crypto"
- ✅ Extraction : cryptoName = "Bitcoin" (défaut)
- ✅ Forçage : find_best_tradingview_symbol({assetName: "Bitcoin"})

**Note** : L'IA peut ensuite utiliser d'autres recherches pour répondre complètement.

## 💬 Message final renforcé

Le prompt final contient maintenant une instruction spéciale :

```typescript
⚠️ IMPORTANT: Tu viens de découvrir et mettre en cache un nouveau symbole TradingView. 
Mentionne EXPLICITEMENT dans ta réponse que le graphique va maintenant s'afficher avec le bon symbole.
```

Cela force l'IA à dire quelque chose comme :

> ✅ J'ai trouvé le symbole **BINANCE:BTCUSDT** pour Bitcoin !
> 📊 **Le graphique va maintenant s'afficher avec les données en temps réel de Bitcoin.**

## 🧪 Tester le forçage

### Test 1 : Message simple

```bash
curl -X POST http://localhost:3000/api/trading \
  -H "Content-Type: application/json" \
  -d '{
    "action": "smartChat",
    "message": "Montre-moi Bitcoin",
    "context": "Actif actuel: GLD"
  }'
```

**Attendu** :
- Logs : `🔍 Crypto détectée, ajout forcé de find_best_tradingview_symbol`
- Réponse contient le symbole trouvé
- Cache mis à jour

### Test 2 : Vérifier le cache après

```bash
curl http://localhost:3000/api/tradingview-search?action=cache
```

**Attendu** :
```json
{
  "symbols": {
    "GLD": "ARCA:GLD",
    "BITCOIN": "BINANCE:BTCUSDT"  // ← Ajouté par le forçage
  }
}
```

## 📝 Logs de debug

Le système affiche maintenant des logs clairs :

```
[Trading API] 🔍 Crypto détectée, ajout forcé de find_best_tradingview_symbol
[TradingAgent] 🎯 Recherche du meilleur symbole pour: Bitcoin
[TradingAgent] ✅ Symbole trouvé: BINANCE:BTCUSDT
[SymbolCache] ✅ Ajouté: BITCOIN → BINANCE:BTCUSDT
[TradingView Widget] ✅ Symbole trouvé dans le cache partagé: BINANCE:BTCUSDT
```

## ⚡ Avantages du forçage

### ✅ Fiabilité
- Même si l'IA "oublie" d'utiliser l'outil, le système le force

### ✅ Rapidité
- Pas besoin de redemander à l'utilisateur
- Symbole trouvé dès la première question

### ✅ Transparence
- Logs clairs de ce qui se passe
- L'IA informe l'utilisateur explicitement

### ✅ Extensibilité
- Facile d'ajouter d'autres mots-clés
- Fonctionne pour n'importe quelle crypto

## 🔮 Extensions possibles

### Ajouter plus de mots-clés

```typescript
const cryptoKeywords = [
  // Existants
  'bitcoin', 'btc', 'ethereum', 'eth', 'crypto',
  // Nouveaux
  'solana', 'sol',
  'cardano', 'ada',
  'polkadot', 'dot',
  'matic', 'polygon',
  // ...
];
```

### Détection d'actions

```typescript
const stockKeywords = ['apple', 'microsoft', 'tesla', 'amazon', 'google'];
const forexKeywords = ['eur', 'usd', 'gbp', 'jpy', 'forex'];
const commodityKeywords = ['gold', 'silver', 'oil', 'gas', 'copper'];
```

### Forçage multi-outil

```typescript
if (needsSymbolSearch) {
  toolsToExecute.push(
    { type: 'find_best_tradingview_symbol', params: { assetName: cryptoName }},
    { type: 'search_news', params: { symbol: cryptoName }},
    { type: 'get_market_data', params: { symbol: cryptoName }}
  );
}
```

---

**Résumé** : Le système détecte automatiquement les mots-clés crypto et force l'utilisation de `find_best_tradingview_symbol` même si l'IA ne le fait pas. Le symbole est trouvé, mis en cache, et le widget l'utilise immédiatement ! 🚀
