# Guide de Nettoyage des Modèles Obsolètes

## Problème

Certains modèles affichés dans la liste ne sont plus disponibles ou gratuits sur OpenRouter, ce qui cause des erreurs 404 lors de leur utilisation.

**Exemples de modèles obsolètes :**
- `deepseek/deepseek-r1-distill-qwen-14b:free` → Erreur: "No endpoints found"
- `agentica-org/deepcoder-14b-preview:free` → Erreur: "model not found"

## Solution Automatique

### ✅ Système de Nettoyage (v0.6.3)

Le système nettoie automatiquement les modèles obsolètes :

1. **À chaque synchronisation :**
   - Récupère la liste actuelle depuis l'API OpenRouter
   - Compare avec les modèles en cache
   - Supprime automatiquement les modèles absents

2. **Déclenchement automatique :**
   - Au démarrage de l'application (si cache > 24h)
   - Toutes les 24 heures en arrière-plan

## Solution Manuelle

### Méthode 1 : Via l'Interface (Recommandé)

1. Ouvrir l'application
2. Cliquer sur l'icône **⚙️ Paramètres** (en haut à droite)
3. Aller dans l'onglet **"Modèles"**
4. Cliquer sur le bouton **🔄 "Actualiser"**

**Ce bouton va :**
- Vider le cache localStorage (`tetika-free-models`)
- Supprimer le timestamp de sync (`tetika-models-last-sync`)
- Recharger les modèles depuis l'API OpenRouter
- Supprimer automatiquement les modèles obsolètes

### Méthode 2 : Via la Console du Navigateur

Ouvrir la console (F12) et exécuter :

```javascript
// Vider le cache des modèles
localStorage.removeItem('tetika-free-models');
localStorage.removeItem('tetika-models-last-sync');

// Recharger la page
location.reload();
```

### Méthode 3 : Via l'API (Pour développeurs)

```bash
# Forcer une synchronisation
curl -X POST http://localhost:3000/api/models/sync
```

Ou avec le script fourni :
```bash
node force-sync-models.mjs
```

## Vérification

Après la synchronisation, vérifiez dans la console :

```
[OpenRouter Sync] Removed models (no longer free or available): [
  'deepseek/deepseek-r1-distill-qwen-14b:free',
  'agentica-org/deepcoder-14b-preview:free'
]
```

## Logs de Diagnostic

### ✅ Synchronisation Réussie

```
[OpenRouter Sync] Fetching models from OpenRouter API...
[OpenRouter Sync] Successfully fetched 339 models
[OpenRouter Sync] Cache expired or force refresh, loading from API...
[useOpenRouterModels] Successfully synced 128 models
```

### ❌ Modèle Obsolète Détecté

```
OpenRouter API error details: {
  status: 404,
  statusText: 'Not Found',
  data: {
    rawData: '{"error":{"message":"No endpoints found for deepseek/deepseek-r1-distill-qwen-14b:free.","code":404}}'
  }
}
```

## Technique

### Cache localStorage

Le système utilise 3 clés localStorage :

1. **`tetika-free-models`** : Liste complète des modèles
2. **`tetika-models-last-sync`** : Timestamp de dernière sync
3. **`tetika-rag-provider`** : Provider RAG sélectionné (non affecté)

### Expiration du Cache

- **Durée** : 24 heures
- **Vérification** : À chaque chargement du hook `useOpenRouterModels`
- **Force refresh** : Si `Date.now() - lastSync > 24h`

### Filtrage des Modèles

```typescript
// Créer un Set des IDs actuels
const currentModelIds = new Set(freeModels.map(m => m.id));

// Comparer avec l'ancien cache
const removedModels = previousModels.filter(m => !currentModelIds.has(m.id));

// Log des suppressions
console.log('[OpenRouter Sync] Removed models:', removedModels.map(m => m.id));
```

## Prévention

Pour éviter les erreurs futures :

1. **Synchronisation régulière** : Le système se synchronise automatiquement toutes les 24h
2. **Gestion des erreurs** : Le chat affiche un message d'erreur clair si un modèle n'est plus disponible
3. **Fallback** : En cas d'erreur réseau, le système utilise le cache périmé plutôt que de ne rien afficher

## FAQ

### Q: Pourquoi les modèles obsolètes sont-ils encore affichés ?

**R:** Le cache localStorage n'est pas vidé automatiquement. Il faut soit :
- Attendre 24h pour la synchronisation automatique
- Cliquer manuellement sur "Actualiser" dans les Paramètres

### Q: Comment savoir si un modèle est obsolète ?

**R:** Si vous recevez une erreur 404 avec "No endpoints found" ou "model not found", le modèle est obsolète.

### Q: Les modèles NEW sont-ils affectés ?

**R:** Non. Le système préserve le timestamp `isNew` des modèles existants. Seuls les modèles supprimés perdent leur badge.

### Q: Quelle est la fréquence de mise à jour recommandée ?

**R:** La synchronisation automatique toutes les 24h est suffisante. Vous pouvez forcer une sync si vous rencontrez des erreurs.

## Changelog

### v0.6.3 (2025-10-22)
- ✅ Ajout du système de nettoyage automatique
- ✅ Cache avec expiration 24h
- ✅ Bouton "Actualiser" vide le cache localStorage
- ✅ Logs des modèles supprimés
- ✅ Préservation du badge NEW

### v0.6.2 (2025-10-22)
- ✅ Système de synchronisation initial
- ⚠️ Pas de nettoyage automatique (problème résolu en v0.6.3)
