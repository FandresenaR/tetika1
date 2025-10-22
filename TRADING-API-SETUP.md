# 🔑 Guide de Configuration des Clés API pour TETIKA Trader

## Vue d'ensemble

TETIKA Trader utilise des APIs **100% gratuites** pour fournir des données de marché en temps réel, des actualités financières et des indicateurs techniques.

## 1. Finnhub - Données de marché et actualités

### 📊 Ce que ça fournit :
- Prix en temps réel (Or, Pétrole, Forex)
- Actualités financières avec sentiment analysis
- Données de marché (volume, high/low)
- **Limite gratuite** : 60 appels/minute

### 🎯 Comment obtenir votre clé :

1. Allez sur https://finnhub.io/register
2. Créez un compte gratuit (email + mot de passe)
3. Confirmez votre email
4. Copiez votre clé API depuis le dashboard
5. Ajoutez-la dans `.env.local` :

```bash
FINNHUB_API_KEY=votre_cle_ici
```

**Note** : La clé ressemble à `c123abc456def789` (20 caractères alphanumériques)

---

## 2. Alpha Vantage - Indicateurs techniques

### 📈 Ce que ça fournit :
- RSI (Relative Strength Index)
- MACD (Moving Average Convergence Divergence)  
- SMA/EMA (Moyennes mobiles)
- **Limite gratuite** : 5 appels/minute, 500/jour

### 🎯 Comment obtenir votre clé :

1. Allez sur https://www.alphavantage.co/support/#api-key
2. Entrez votre email et prénom
3. Cliquez sur "GET FREE API KEY"
4. Copiez la clé qui s'affiche instantanément
5. Ajoutez-la dans `.env.local` :

```bash
ALPHAVANTAGE_API_KEY=votre_cle_ici
```

**Note** : La clé ressemble à `ABC123XYZ456` (16 caractères alphanumériques)

---

## 3. OpenRouter - Analyse IA

### 🤖 Ce que ça fournit :
- Analyse intelligente des données de marché
- Recommandations de trading
- Interprétation des indicateurs techniques
- **Limite gratuite** : Plusieurs modèles gratuits disponibles

### 🎯 Comment obtenir votre clé :

Vous l'avez déjà ! C'est la même clé que pour le chat TETIKA.

Si besoin de la configurer à nouveau :
1. Allez sur https://openrouter.ai/keys
2. Créez une clé API gratuite
3. Ajoutez-la dans `.env.local` :

```bash
OPENROUTER_API_KEY=sk-or-v1-...
```

---

## 📝 Configuration finale

Votre fichier `.env.local` devrait ressembler à :

```bash
# Finnhub - Données de marché
FINNHUB_API_KEY=c123abc456def789

# Alpha Vantage - Indicateurs techniques  
ALPHAVANTAGE_API_KEY=ABC123XYZ456

# OpenRouter - IA (déjà configuré)
OPENROUTER_API_KEY=sk-or-v1-...
```

## 🚀 Redémarrage

Après avoir ajouté les clés :

```bash
npm run dev
```

Puis accédez à http://localhost:3000/trader

---

## ❓ Problèmes courants

### Erreur 403 Finnhub
- ✅ Vérifiez que votre clé est bien dans `.env.local`
- ✅ Confirmez que vous avez validé votre email
- ✅ Redémarrez le serveur après avoir ajouté la clé

### Erreur Alpha Vantage
- ✅ La clé est valide immédiatement après création
- ✅ Limite de 5 appels/minute : espacez vos requêtes
- ✅ Limite de 500 appels/jour

### Pas de données affichées
- ✅ Ouvrez la console du navigateur (F12)
- ✅ Vérifiez les logs du serveur
- ✅ Assurez-vous d'avoir redémarré le serveur

---

## 💰 Versions payantes (optionnel)

Si vous dépassez les limites gratuites :

- **Finnhub** : À partir de $59/mois pour 300 appels/minute
- **Alpha Vantage** : À partir de $49.99/mois pour 75 appels/minute

Pour un usage personnel et des tests, les versions gratuites sont amplement suffisantes !

---

## 🔐 Sécurité

- ⚠️ Ne commitez **JAMAIS** votre `.env.local` sur Git
- ✅ Le fichier `.gitignore` exclut déjà `.env.local`
- 🔒 Les clés sont uniquement utilisées côté serveur (sécurisé)
