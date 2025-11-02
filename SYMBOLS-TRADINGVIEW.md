# Symboles TradingView - Configuration

## Actifs disponibles dans Tetika Trader

| Symbole Local | Symbole TradingView | Nom | Type | Statut |
|---------------|---------------------|-----|------|--------|
| `GLD` | `ARCA:GLD` | SPDR Gold Trust | ETF Or | ✅ Vérifié |
| `USO` | `NYMEX:CL1!` | WTI Crude Oil Futures | Futures Pétrole | ✅ Vérifié |
| `SLV` | `ARCA:SLV` | iShares Silver Trust | ETF Argent | ✅ Vérifié |
| `AAPL` | `NASDAQ:AAPL` | Apple Inc. | Action Tech | ✅ Vérifié |
| `MSFT` | `NASDAQ:MSFT` | Microsoft Corp. | Action Tech | ✅ Vérifié |
| `TSLA` | `NASDAQ:TSLA` | Tesla Inc. | Action Auto | ✅ Vérifié |
| `GOOGL` | `NASDAQ:GOOGL` | Alphabet Inc. | Action Tech | ✅ Vérifié |
| `AMZN` | `NASDAQ:AMZN` | Amazon.com Inc. | Action E-commerce | ✅ Vérifié |

## Notes importantes

### USO - Pétrole
⚠️ **Changement important** : Le fonds `ARCA:USO` (United States Oil Fund) a été fermé/limité.
- **Solution** : Utilisation de `NYMEX:CL1!` (WTI Crude Oil Futures - contrat du mois)
- **Avantage** : Données en temps réel, plus liquide
- **Alternative** : `AMEX:USL` (United States 12 Month Oil Fund) si besoin d'un ETF

### Conventions TradingView

| Exchange | Préfixe | Exemple |
|----------|---------|---------|
| NYSE Arca | `ARCA:` | `ARCA:GLD` |
| NASDAQ | `NASDAQ:` | `NASDAQ:AAPL` |
| NYMEX (Commodities) | `NYMEX:` | `NYMEX:CL1!` |
| AMEX | `AMEX:` | `AMEX:USL` |

### Recherche de symboles

Pour vérifier un symbole TradingView :
1. Aller sur https://www.tradingview.com/
2. Chercher le symbole dans la barre de recherche
3. Le format exact apparaît dans l'URL (ex: `/symbols/ARCA-GLD/`)

## Ajout de nouveaux actifs

Pour ajouter un nouvel actif :

1. **Vérifier le symbole sur TradingView**
2. **Mettre à jour 3 fichiers** :
   - `app/trader/page.tsx` → Array `AVAILABLE_ASSETS`
   - `components/trading/TradingViewWidget.tsx` → Object `symbolMap`
   - `lib/services/tradingAgentActions.ts` → Array `availableAssets` dans `selectAsset()`

### Exemple d'ajout Bitcoin :

```typescript
// Dans AVAILABLE_ASSETS
{
  symbol: 'BTC',
  name: 'Bitcoin',
  description: 'Bitcoin - Cryptomonnaie',
  emoji: '₿',
  category: 'Crypto'
}

// Dans symbolMap
'BTC': 'BINANCE:BTCUSDT'

// Dans availableAssets
const availableAssets = [..., 'BTC'];
```

## Catégories actuelles

- 🪙 **Matières premières** : GLD, USO, SLV
- 💻 **Technologie** : AAPL, MSFT, GOOGL
- 🚗 **Automobile** : TSLA
- 📦 **E-commerce** : AMZN

## API Finnhub

Les symboles utilisés pour Finnhub API (données de marché) sont les **symboles locaux** (GLD, AAPL, etc.), pas les symboles TradingView.

**Mapping automatique** :
- Frontend/API → Symboles locaux (`GLD`, `AAPL`)
- TradingView Widget → Symboles TradingView (`ARCA:GLD`, `NASDAQ:AAPL`)

---

*Dernière mise à jour : 2 novembre 2025*
