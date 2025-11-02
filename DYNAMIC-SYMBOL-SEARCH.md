# Système de Recherche Dynamique de Symboles TradingView

## 🎯 Vue d'ensemble

L'IA peut maintenant **découvrir automatiquement** les symboles TradingView disponibles au lieu de se baser sur des suppositions. Fini les erreurs "Invalid symbol" !

## ✨ Nouvelles capacités

### Pour l'IA

L'assistant de trading a accès à 2 nouvelles actions :

1. **`search_tradingview_symbol`** - Rechercher des symboles disponibles
   ```json
   {
     "type": "search_tradingview_symbol",
     "params": { "query": "crude oil" }
   }
   ```
   
2. **`find_best_tradingview_symbol`** - Trouver le meilleur symbole pour un actif
   ```json
   {
     "type": "find_best_tradingview_symbol",
     "params": { "assetName": "gold" }
   }
   ```

### Pour le Widget TradingView

Le widget utilise désormais un système en 2 étapes :

1. **Cache statique** - Pour les symboles connus (GLD, AAPL, etc.)
2. **Recherche dynamique** - Pour les nouveaux symboles

```tsx
// Mapping statique (cache rapide)
const symbolMap = {
  'GLD': 'ARCA:GLD',
  'AAPL': 'NASDAQ:AAPL',
  // ...
};

// Si pas dans le cache → recherche API
if (!symbolMap[symbol]) {
  const result = await fetch('/api/tradingview-search', {
    method: 'POST',
    body: JSON.stringify({
      action: 'findBest',
      assetName: symbol
    })
  });
}
```

## 🔧 Architecture

### Services créés

#### 1. `tradingViewSearchService.ts`

Service de recherche de symboles TradingView.

**Méthodes principales** :
- `searchSymbol(query)` - Recherche générale
- `findBestSymbol(assetName)` - Trouve le meilleur symbole avec priorités
- `searchMultipleAssets(assets[])` - Recherche en parallèle
- `verifySymbol(symbol)` - Vérifie l'existence

**Priorités de sélection** :
1. ETF (fonds) sur ARCA/NASDAQ/AMEX
2. Actions sur NASDAQ/NYSE
3. Futures sur NYMEX
4. Autre (premier résultat)

#### 2. API Route `/api/tradingview-search`

Endpoint pour la recherche de symboles.

**Actions disponibles** :
- `search` - Recherche basique
- `findBest` - Trouver le meilleur
- `verify` - Vérifier existence
- `searchMultiple` - Recherche multiple

**Exemple d'utilisation** :
```javascript
// POST /api/tradingview-search
{
  "action": "search",
  "query": "crude oil"
}

// Réponse
{
  "symbols": [
    {
      "symbol": "NYMEX:CL1!",
      "description": "WTI Crude Oil Futures",
      "type": "futures",
      "exchange": "NYMEX"
    },
    // ...
  ],
  "query": "crude oil",
  "found": true
}
```

### 3. Actions de l'agent

Nouvelles actions dans `tradingAgentActions.ts` :

```typescript
// Rechercher des symboles
async searchTradingViewSymbol(query: string): Promise<ActionResult>

// Trouver le meilleur symbole
async findBestTradingViewSymbol(assetName: string): Promise<ActionResult>
```

## 📋 Workflow de l'IA

### Exemple : "Quel symbole pour le pétrole ?"

1. **Utilisateur** : "Montre-moi le graphique du pétrole"

2. **IA analyse** et décide d'utiliser les outils :
   ```json
   {
     "needs_tools": true,
     "tools": [
       {
         "type": "search_tradingview_symbol",
         "params": { "query": "crude oil" }
       }
     ]
   }
   ```

3. **Système exécute** la recherche :
   ```
   🔍 Recherche de symbole TradingView: crude oil
   ✅ Trouvé 5 symbole(s):
      - NYMEX:CL1! | WTI Crude Oil Futures | futures | NYMEX
      - NYMEX:NG1! | Natural Gas Futures | futures | NYMEX
      - ...
   ```

4. **IA reçoit** les résultats et répond :
   > "J'ai trouvé plusieurs options pour le pétrole :
   > - NYMEX:CL1! (WTI Crude Oil Futures) - Le plus populaire
   > - AMEX:USO (United States Oil Fund) - ETF
   > 
   > Je recommande NYMEX:CL1! pour des données en temps réel."

5. **Widget TradingView** utilise le symbole trouvé

## 🧪 Tests

### Script de test inclus

```bash
node test-tradingview-search.mjs
```

**Ce qu'il teste** :
- ✅ Recherche de GLD (Or)
- ✅ Recherche de USO (Pétrole)
- ✅ Recherche "crude oil" (alternatives)
- ✅ Meilleurs symboles pour 8 actifs
- ✅ Recherche multiple en parallèle

### Test manuel via API

```bash
# Rechercher un symbole
curl -X POST http://localhost:3000/api/tradingview-search \
  -H "Content-Type: application/json" \
  -d '{"action": "search", "query": "gold"}'

# Trouver le meilleur
curl -X POST http://localhost:3000/api/tradingview-search \
  -H "Content-Type: application/json" \
  -d '{"action": "findBest", "assetName": "silver"}'
```

## 💡 Avantages

### Avant (système statique)
❌ Symboles hardcodés dans le code
❌ Erreurs si symbole invalide
❌ Maintenance manuelle nécessaire
❌ Pas d'alternatives automatiques

### Après (système dynamique)
✅ Découverte automatique des symboles
✅ Fallback intelligent si erreur
✅ Pas de maintenance manuelle
✅ L'IA peut suggérer des alternatives
✅ Support de nouveaux actifs sans code

## 🔄 Fallback et gestion d'erreur

Le système a plusieurs niveaux de sécurité :

1. **Cache statique** → Symboles connus utilisés directement
2. **Recherche API** → Si nouveau symbole
3. **Fallback NASDAQ** → Si recherche échoue
4. **Message d'erreur** → Affiché à l'utilisateur

```typescript
try {
  const symbol = await tradingViewSearchService.findBestSymbol(assetName);
  if (symbol) {
    return symbol.symbol; // Ex: "ARCA:GLD"
  }
} catch (error) {
  // Fallback
  return `NASDAQ:${assetName}`; // Ex: "NASDAQ:AAPL"
}
```

## 📊 Exemples de conversations

### Exemple 1 : Découverte d'actif

**User** : "Je veux trader de l'argent, c'est quoi le bon symbole ?"

**IA** : 
> 🔍 Je recherche les symboles disponibles pour l'argent...
> 
> J'ai trouvé :
> - **ARCA:SLV** - iShares Silver Trust (ETF) ✅ Recommandé
> - COMEX:SI1! - Silver Futures
> - NYSE:AG - First Majestic Silver Corp
> 
> Je vous recommande **SLV** qui est un ETF liquide suivant directement le prix de l'argent.

### Exemple 2 : Vérification de symbole

**User** : "Le symbole ARCA:USO fonctionne toujours ?"

**IA** :
> 🔍 Je vérifie ce symbole...
> 
> ⚠️ ARCA:USO n'est plus disponible ou limité. 
> 
> Alternatives pour le pétrole :
> - **NYMEX:CL1!** - WTI Crude Oil Futures (Recommandé)
> - AMEX:USL - United States 12 Month Oil Fund
> 
> Je peux changer l'actif vers une alternative si vous voulez.

## 🚀 Utilisation dans le code

### Dans l'IA (prompt système)

```typescript
const systemPrompt = `
Tu as accès à ces outils :
- search_tradingview_symbol : Rechercher des symboles
- find_best_tradingview_symbol : Trouver le meilleur symbole

Utilise-les pour vérifier les symboles avant de les suggérer !
`;
```

### Dans le widget

```tsx
<TradingViewWidget 
  symbol="GLD"  // Le widget trouvera automatiquement ARCA:GLD
  theme="dark"
/>
```

Le widget affiche maintenant :
- 🔍 "Recherche du symbole..." pendant la recherche
- ⚠️ Avertissement si symbole non trouvé
- ✅ Symbole TradingView trouvé dans le lien

## 📝 À faire (Améliorations futures)

- [ ] Cache persistant (localStorage) des symboles découverts
- [ ] Préchargement des symboles au démarrage
- [ ] Interface admin pour gérer le mapping manuel
- [ ] Analytics sur les symboles les plus utilisés
- [ ] Support de crypto via Binance/Coinbase
- [ ] Recherche par ISIN/CUSIP

---

**Date de création** : 2 novembre 2025
**Version** : 1.0
**Auteur** : Tetika AI Trading System
