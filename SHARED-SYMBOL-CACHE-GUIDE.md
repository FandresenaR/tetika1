# Guide : Système de Cache Partagé des Symboles

## 🎯 Problème résolu

**Avant** : L'IA trouvait le symbole (ex: `BTCUSD`) mais le widget TradingView ne l'utilisait pas.

**Après** : Quand l'IA découvre un symbole, il est **automatiquement mis en cache** et le widget l'utilise immédiatement !

## 🔄 Workflow complet

### Étape 1 : L'utilisateur demande un nouveau symbole

```
User: "Montre-moi le graphique du Bitcoin"
```

### Étape 2 : L'IA utilise `find_best_tradingview_symbol`

```json
{
  "needs_tools": true,
  "tools": [
    {
      "type": "find_best_tradingview_symbol",
      "params": { "assetName": "Bitcoin" }
    }
  ]
}
```

### Étape 3 : Le système trouve et met en cache

```
🔍 Recherche du meilleur symbole pour: Bitcoin
✅ Symbole trouvé: BINANCE:BTCUSDT
💾 Ajouté au cache: Bitcoin → BINANCE:BTCUSDT
```

**Cache partagé maintenant** :
```javascript
{
  "GLD": "ARCA:GLD",
  "AAPL": "NASDAQ:AAPL",
  "BITCOIN": "BINANCE:BTCUSDT"  // ← Nouveau!
}
```

### Étape 4 : Le widget utilise le cache

```tsx
// Widget check le cache
const cachedSymbol = symbolCache.get("BITCOIN");
// → "BINANCE:BTCUSDT" ✅

// Widget affiche le graphique avec le bon symbole
<TradingView symbol="BINANCE:BTCUSDT" />
```

### Étape 5 : L'IA peut changer l'actif

```json
{
  "type": "select_asset",
  "params": { "symbol": "BITCOIN" }
}
```

Le widget reçoit `selectedAsset="BITCOIN"` → Check le cache → Affiche `BINANCE:BTCUSDT` !

## 🏗️ Architecture

```
┌──────────────┐
│ Utilisateur  │
└──────┬───────┘
       │ "Montre Bitcoin"
       ↓
┌──────────────────────────┐
│   IA (Smart Chat)        │
│                          │
│  find_best_tradingview   │
│       _symbol()          │
└──────┬───────────────────┘
       │
       ↓
┌──────────────────────────┐
│ TradingView Search       │
│   Service                │
│                          │
│  Recherche API           │
│  → BINANCE:BTCUSDT       │
└──────┬───────────────────┘
       │
       ↓
┌──────────────────────────┐
│   Symbol Cache           │
│   (Partagé)              │
│                          │
│  add("BITCOIN",          │
│      "BINANCE:BTCUSDT")  │
└──────┬───────────────────┘
       │
       ├─────────────┬──────────────┐
       ↓             ↓              ↓
┌─────────┐   ┌──────────┐   ┌──────────┐
│   IA    │   │  Widget  │   │   API    │
│         │   │          │   │          │
│ Lit le  │   │ Lit le   │   │ Lit le   │
│ cache   │   │ cache    │   │ cache    │
└─────────┘   └──────────┘   └──────────┘
```

## 📝 Nouvelles actions disponibles

### 1. `find_best_tradingview_symbol` (Recommandé)

**Usage** : Trouver ET mettre en cache automatiquement

```json
{
  "type": "find_best_tradingview_symbol",
  "params": { "assetName": "Ethereum" }
}
```

**Retour** :
```json
{
  "success": true,
  "data": {
    "assetName": "Ethereum",
    "bestSymbol": "BINANCE:ETHUSDT",
    "description": "Ethereum / TetherUS",
    "type": "crypto",
    "exchange": "BINANCE",
    "cached": true  // ← Confirme mise en cache
  }
}
```

### 2. `add_symbol_to_cache` (Manuel)

**Usage** : Ajouter manuellement un symbole au cache

```json
{
  "type": "add_symbol_to_cache",
  "params": {
    "localSymbol": "BTC",
    "tradingViewSymbol": "BINANCE:BTCUSDT",
    "description": "Bitcoin / TetherUS"
  }
}
```

### 3. `get_symbol_cache` (Debug)

**Usage** : Voir le contenu du cache

```json
{
  "type": "get_symbol_cache",
  "params": {}
}
```

**Retour** :
```json
{
  "success": true,
  "data": {
    "cacheSize": 10,
    "symbols": {
      "GLD": "ARCA:GLD",
      "BITCOIN": "BINANCE:BTCUSDT",
      "ETHEREUM": "BINANCE:ETHUSDT"
    },
    "availableSymbols": ["GLD", "BITCOIN", "ETHEREUM", ...]
  }
}
```

## 🧪 Tester le système

### Test 1 : Via le chat IA

**Message** :
```
"Trouve-moi le symbole pour Ethereum et affiche le graphique"
```

**L'IA devrait** :
1. Utiliser `find_best_tradingview_symbol` avec `assetName: "Ethereum"`
2. Recevoir `BINANCE:ETHUSDT`
3. Le symbole est mis en cache automatiquement
4. Répondre avec le symbole trouvé
5. Le widget peut maintenant utiliser ce symbole

### Test 2 : Via l'API directement

```bash
# Trouver et mettre en cache
curl -X POST http://localhost:3000/api/tradingview-search \
  -H "Content-Type: application/json" \
  -d '{"action": "findBest", "assetName": "Litecoin"}'

# Vérifier le cache
curl http://localhost:3000/api/tradingview-search?action=cache
```

### Test 3 : Workflow complet

1. **Demander à l'IA** :
   ```
   "Je veux trader Dogecoin, trouve le bon symbole"
   ```

2. **L'IA trouve** :
   ```
   ✅ J'ai trouvé BINANCE:DOGEUSDT pour Dogecoin
   💾 Le symbole est maintenant disponible dans le widget
   ```

3. **Demander à l'IA de changer** :
   ```
   "Change l'actif vers Dogecoin"
   ```

4. **Le widget affiche** :
   ```
   🔍 Recherche du symbole pour: DOGECOIN
   ✅ Symbole trouvé dans le cache partagé: BINANCE:DOGEUSDT
   📊 Affichage du graphique...
   ```

## 💡 Avantages du cache partagé

### ✅ Persistance
- Les symboles découverts sont réutilisables
- Pas besoin de rechercher 2 fois le même symbole

### ✅ Performance
- Vérification cache (instantané) avant recherche API
- Réduction des appels API TradingView

### ✅ Cohérence
- L'IA et le widget utilisent exactement les mêmes symboles
- Pas de désynchronisation

### ✅ Flexibilité
- Support de n'importe quel actif (actions, crypto, futures, forex)
- L'utilisateur peut ajouter manuellement des symboles

## 📊 Ordre de priorité du widget

1. **Cache statique** (8 symboles hardcodés)
   - `GLD`, `USO`, `SLV`, `AAPL`, `MSFT`, `TSLA`, `GOOGL`, `AMZN`
   - ⚡ Instantané

2. **Cache partagé** (symboles découverts par l'IA)
   - Bitcoin, Ethereum, etc.
   - ⚡ Très rapide (en mémoire)

3. **Recherche API** (si pas dans les caches)
   - Appel à TradingView Search API
   - 🕐 ~500ms

4. **Fallback** (`NASDAQ:SYMBOL`)
   - Si tout échoue
   - ⚠️ Peut ne pas fonctionner

## 🎬 Exemple de conversation

**User** : "Montre-moi le graphique du Bitcoin"

**IA** : 
> 🔍 Je recherche le symbole TradingView pour Bitcoin...
> 
> ✅ **Résultat** : Le symbole pour Bitcoin sur TradingView est **BTCUSD** (le plus courant). 🚀
> 
> Voici les options disponibles :
> - **BINANCE:BTCUSDT** - Bitcoin / TetherUS (Recommandé pour crypto)
> - COINBASE:BTCUSD - Bitcoin / USD (Coinbase)
> - BITSTAMP:BTCUSD - Bitcoin / USD (Bitstamp)
> 
> Je vous recommande **BINANCE:BTCUSDT** qui est le plus liquide.
> 
> 💾 **Le symbole est maintenant disponible dans le widget !**
> 
> Vous souhaitez que je change l'actif vers Bitcoin ? 💹

**User** : "Oui, change vers Bitcoin"

**IA** :
> 🎯 Changement d'actif vers Bitcoin...
> 
> ✅ **Actif sélectionné** : BTC
> 📊 Le graphique affiche maintenant **BINANCE:BTCUSDT**
> 
> Je peux aussi vous aider à trouver des opportunités sur d'autres actifs si vous le souhaitez ! 🔍 (J'effectue 1 recherche(s) pour vous répondre.)

---

**Résumé** : L'IA trouve le symbole → Le met en cache → Le widget l'utilise immédiatement ! ✅
