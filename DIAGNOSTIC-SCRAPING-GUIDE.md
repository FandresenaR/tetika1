# Guide de Diagnostic du Système de Scraping MCP

## 🚨 Problème Identifié
Les tests automatisés montrent une erreur HTTP 400 "Bad Request" lors de l'appel à l'API de scraping.

## 🔍 Étapes de Diagnostic

### Étape 1: Vérifier que le serveur fonctionne
```bash
# Dans un premier terminal
npm run dev
```

Attendez que le message "Ready in X.Xs" apparaisse et notez le port utilisé (par défaut 3000, ou 3002 si 3000 est occupé).

### Étape 2: Tester l'API avec curl
```bash
# Test GET (doit fonctionner)
curl http://localhost:3000/api/scraping

# Test POST (le problème)
curl -X POST http://localhost:3000/api/scraping \
  -H "Content-Type: application/json" \
  -d '{
    "query": "https://vivatechnology.com/partners",
    "mode": "deep-scraping",
    "maxSources": 5,
    "includeAnalysis": true
  }'
```

### Étape 3: Utiliser le test JavaScript simple
```bash
# Dans un deuxième terminal
node test-api-basic.js
```

### Étape 4: Vérifier les logs du serveur
Dans le premier terminal où le serveur tourne, vérifiez:
- S'il y a des erreurs lors du parsing JSON
- Si la requête arrive bien au serveur
- Les messages de debug ajoutés

## 🛠️ Solutions Potentielles

### Solution 1: Problème d'encodage URL
L'URL `https://vivatechnology.com/partners?hashtags=healthcare%2520%2526%2520wellness` contient des caractères encodés qui pourraient causer des problèmes.

**Test:** Utilisez une URL plus simple:
```json
{
  "query": "https://vivatechnology.com/partners",
  "mode": "deep-scraping",
  "maxSources": 5,
  "includeAnalysis": true
}
```

### Solution 2: Problème de CORS
Si vous testez depuis un navigateur, il pourrait y avoir des problèmes de CORS.

**Test:** Utilisez curl ou le script Node.js pour éviter les restrictions CORS.

### Solution 3: Problème de timeout
L'API a un timeout de 90 secondes qui pourrait être dépassé.

**Test:** Réduisez `maxSources` à 1 ou 2.

### Solution 4: Problème de dépendances
Certaines dépendances comme Puppeteer pourraient ne pas être installées.

**Test:**
```bash
npm install
npm audit fix
```

## 🧪 Test Manuel Rapide

Ouvrez le navigateur à l'adresse: `http://localhost:3000/test-mcp-scraping.html`

Cette page contient des boutons de test pour chaque fonctionnalité MCP.

## 📋 Checklist de Vérification

- [ ] Le serveur Next.js démarre sans erreur
- [ ] L'API GET `/api/scraping` répond avec HTTP 200
- [ ] L'API POST `/api/scraping` avec des données simples fonctionne
- [ ] Les dépendances sont installées (`npm install`)
- [ ] Aucune erreur dans la console du serveur

## 🆘 Si Tout Échoue

1. **Redémarrez le serveur:**
   ```bash
   # Arrêtez avec Ctrl+C puis:
   npm run dev
   ```

2. **Nettoyez le cache:**
   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Vérifiez les versions:**
   ```bash
   node --version  # Doit être >= 18
   npm --version   # Doit être >= 8
   ```

4. **Mode debug complet:**
   Ajoutez `console.log` dans `/app/api/scraping/route.ts` au début de la fonction POST pour voir exactement ce qui est reçu.

## 📞 Points de Contact

- Vérifiez le fichier `MCP-SCRAPING-SYSTEM.md` pour la documentation complète
- Consultez `TETIKA-MCP-IMPLEMENTATION-FINALE.md` pour les exemples d'usage
- Les tests sont dans `test-mcp-scraping.mjs` et `test-api-basic.js`
