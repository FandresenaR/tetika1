# Configuration Fetch MCP pour la Recherche Web

## Vue d'ensemble

Fetch MCP est maintenant intégré dans Tetika comme fournisseur de recherche web. Il permet de :

1. **Recherche web directe** : Utilise DuckDuckGo et Wikipedia pour obtenir des informations
2. **Extraction de contenu** : Récupère et analyse le contenu de pages web spécifiques
3. **Fonctionnement sans clé API** : Gratuit et ne nécessite aucune configuration

## Configuration dans l'Interface

### 1. Accès aux Paramètres
- Cliquez sur le bouton **Paramètres** dans l'interface Tetika
- Allez dans l'onglet **"Recherche Web"**

### 2. Sélection de Fetch MCP
- **Fetch MCP** apparaît dans la liste des fournisseurs disponibles
- Il est marqué comme **"Gratuit"** (aucune clé API requise)
- Priorité : **3** (utilisé après SearXNG et Google CSE)

### 3. Activation
- Sélectionnez **Fetch MCP** comme fournisseur de recherche
- Aucune configuration supplémentaire nécessaire
- Sauvegardez les paramètres

## Fonctionnalités

### Recherche Web
- Utilise l'API DuckDuckGo Instant Answer
- Recherche dans Wikipedia français
- Extraction automatique du contenu
- Résultats formatés avec titre, URL et snippet

### Extraction de Contenu
- Fetch direct d'URLs spécifiques
- Analyse du contenu HTML
- Extraction des métadonnées (titre, description, etc.)
- Nettoyage automatique du contenu

## Utilisation via API

### Endpoint dédié : `/api/fetch-mcp`

#### Recherche Web
```bash
# POST
curl -X POST http://localhost:3000/api/fetch-mcp \
  -H "Content-Type: application/json" \
  -d '{
    "action": "search",
    "query": "intelligence artificielle 2024",
    "options": {
      "maxResults": 5
    }
  }'

# GET
curl "http://localhost:3000/api/fetch-mcp?action=search&query=AI"
```

#### Fetch d'URL
```bash
# POST
curl -X POST http://localhost:3000/api/fetch-mcp \
  -H "Content-Type: application/json" \
  -d '{
    "action": "fetch",
    "url": "https://fr.wikipedia.org/wiki/Intelligence_artificielle",
    "options": {
      "headers": {
        "Accept-Language": "fr-FR"
      }
    }
  }'

# GET
curl "http://localhost:3000/api/fetch-mcp?action=fetch&url=https://example.com"
```

## Intégration MCP

### Serveur MCP avec Fetch
Le serveur MCP étendu (`tetika-agent-with-fetch.js`) inclut :

- `fetch_web_content` : Récupération directe de contenu web
- `search_web_fetch` : Recherche web avec Fetch MCP
- Tous les outils existants (recherche, chat, analyse de fichiers)

### Configuration Claude Desktop
```json
{
  "mcpServers": {
    "tetika-agent-with-fetch": {
      "command": "node",
      "args": ["path/to/tetika/mcp/servers/tetika-agent-with-fetch.js"],
      "env": {
        "OPENROUTER_API_KEY": "your_key",
        "SERPAPI_API_KEY": "your_key"
      }
    }
  }
}
```

## Tests et Validation

### Test d'intégration
```bash
npm run test:fetch-mcp
```

Ce script teste :
- ✅ API DuckDuckGo
- ✅ API Wikipedia  
- ✅ Recherche Fetch MCP
- ✅ Fetch d'URL direct

### Test via interface web
1. Activez le mode RAG dans Tetika
2. Sélectionnez Fetch MCP comme fournisseur
3. Posez une question nécessitant une recherche web
4. Vérifiez que les sources sont affichées

## Avantages de Fetch MCP

### ✅ Avantages
- **Gratuit** : Aucune clé API requise
- **Rapide** : Accès direct aux APIs publiques
- **Fiable** : Multiples sources (DuckDuckGo + Wikipedia)
- **Flexible** : Recherche ET extraction de contenu
- **Respectueux** : User-Agent approprié, timeouts, gestion d'erreurs

### ⚠️ Limitations
- Nombre de résultats limité (APIs gratuites)
- Pas de recherche en temps réel Google
- Dépendant de la disponibilité des APIs publiques
- Contenu limité aux sources configurées

## Ordre de Priorité RAG

1. **SearXNG** (gratuit, métamoteur)
2. **Google CSE** (clé API requise)
3. **Fetch MCP** (gratuit, direct)  ← **NOUVEAU**
4. **Apify RAG** (clé API requise)
5. **Serper** (clé API requise)
6. **SerpAPI** (fallback, clé API requise)

## Dépannage

### Aucun résultat de recherche
- Vérifiez la connectivité internet
- Testez avec des requêtes plus simples
- Consultez les logs de la console

### Erreurs de fetch d'URL
- Vérifiez que l'URL est accessible publiquement
- Certains sites bloquent les scrapers automatiques
- Utilisez des headers appropriés

### Performance lente
- Les APIs gratuites peuvent avoir des limitations de débit
- Le fallback vers d'autres fournisseurs se fait automatiquement

## Support

- **Documentation** : Voir le code dans `/lib/fetch-mcp-provider.ts`
- **Tests** : Exécutez `npm run test:fetch-mcp`
- **Logs** : Consultez la console du navigateur et les logs serveur
