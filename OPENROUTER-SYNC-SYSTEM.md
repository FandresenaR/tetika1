# Système de Synchronisation Automatique des Modèles OpenRouter

## Vue d'ensemble

Ce système récupère automatiquement la liste des modèles gratuits depuis l'API OpenRouter, les filtre, les convertit au format de l'application, les classe par catégories, détecte les nouveaux modèles, et les met en cache pour une utilisation optimale.

### Fonctionnalités clés

- ✅ **Synchronisation automatique** depuis l'API OpenRouter
- ✅ **Filtrage des modèles gratuits** (pricing = 0)
- ✅ **Classification automatique par catégories** (général, code, vision, créatif, raisonnement, recherche)
- ✅ **Détection des nouveaux modèles** avec badge "NEW"
- ✅ **Cache intelligent** (mémoire + localStorage)
- ✅ **Interface utilisateur complète** dans les paramètres
- ✅ **Statistiques détaillées** par provider et catégorie

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    API OpenRouter                            │
│              https://openrouter.ai/api/v1/models            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              openRouterSync Service                          │
│  - fetchOpenRouterModels()                                   │
│  - filterFreeModels()                                        │
│  - convertToAppModel()                                       │
│  - Cache avec expiration (1 heure)                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ↓                ↓                ↓
┌────────────────┐ ┌──────────────┐ ┌────────────────┐
│   React Hook   │ │  API Route   │ │  CLI Script    │
│ useOpenRouter  │ │ /api/models  │ │  sync-*.mjs    │
│    Models      │ │    /sync     │ │                │
└────────────────┘ └──────────────┘ └────────────────┘
         │                │                │
         ↓                ↓                ↓
┌─────────────────────────────────────────────────────────────┐
│                     localStorage                             │
│              tetika-free-models-cache                        │
│              (expire après 24 heures)                        │
└─────────────────────────────────────────────────────────────┘
```

## Composants

### 1. Service de Synchronisation

**Fichier**: `lib/services/openRouterSync.ts`

#### Fonctions principales

```typescript
// Récupère tous les modèles depuis OpenRouter
fetchOpenRouterModels(): Promise<OpenRouterModel[]>

// Filtre les modèles gratuits (pricing = 0)
filterFreeModels(models: OpenRouterModel[]): OpenRouterModel[]

// Assigne automatiquement une catégorie au modèle
assignCategory(model: OpenRouterModel): 'general' | 'coding' | 'vision' | 'creative' | 'reasoning' | 'research'

// Convertit au format de l'application avec catégorie et flag isNew
convertToAppModel(model: OpenRouterModel, isNew: boolean)

// Trie par qualité (providers connus, context length)
sortModelsByQuality(models)

// Récupère avec cache et détecte les nouveaux modèles
getCachedFreeModels(forceRefresh?, cacheDuration?)

// Invalide le cache
invalidateModelCache()

// Statistiques des modèles (avec catégories et nouveaux modèles)
getFreeModelsStats()
```

#### Classification par catégories

Le système utilise plusieurs sources pour déterminer la catégorie d'un modèle :

1. **Architecture**: Les modèles avec `modality: "text+image"` → `vision`
2. **Nom du modèle**: Patterns comme "code", "coder", "deepcoder" → `coding`
3. **Nom du modèle**: Patterns comme "r1", "o1", "qwq", "reasoning" → `reasoning`
4. **Description**: Analyse sémantique via `getCategoryFromDescription()` (lib/models.ts)

Catégories disponibles :
- 🌐 **general**: Usage général et polyvalent
- 💻 **coding**: Spécialisé en programmation
- 👁️ **vision**: Traitement d'images et multimodal
- 🎨 **creative**: Création de contenu et narration
- 🧠 **reasoning**: Raisonnement et résolution de problèmes
- 🔬 **research**: Recherche scientifique et données

#### Détection des nouveaux modèles

À chaque synchronisation, le système :

1. **Charge les anciens modèles** depuis localStorage
2. **Extrait les IDs** des modèles précédents
3. **Compare avec les nouveaux** modèles récupérés de l'API
4. **Marque comme `isNew`** les modèles qui n'étaient pas présents avant
5. **Affiche un badge "NEW"** dans l'interface utilisateur

#### Cache

- **Durée**: 1 heure par défaut (configurable)
- **Stockage**: Mémoire + localStorage
- **localStorage**: Expire après 24 heures
- **Invalidation**: Manuelle ou automatique

### 2. Hook React

**Fichier**: `lib/hooks/useOpenRouterModels.ts`

```typescript
const {
  models,           // Liste des modèles avec catégorie et flag isNew
  isLoading,        // État de chargement
  error,            // Erreur éventuelle
  lastSync,         // Date de dernière synchro
  stats,            // Statistiques (total, nouveaux, par provider, par catégorie)
  refreshModels,    // Force un refresh
  filterModels,     // Filtre les modèles (par provider, catégorie, nouveaux, etc.)
  getProviders,     // Liste des providers
} = useOpenRouterModels();
```

#### Filtrage avancé

```tsx
// Filtre par catégorie
const codingModels = filterModels({ category: 'coding' });

// Filtre les nouveaux modèles uniquement
const newModels = filterModels({ onlyNew: true });

// Filtre par provider et avec vision
const googleVisionModels = filterModels({ 
  provider: 'google', 
  hasVision: true 
});

// Recherche textuelle
const searchResults = filterModels({ 
  search: 'deepseek' 
});

// Combinaison de filtres
const filteredModels = filterModels({
  category: 'reasoning',
  minContextLength: 32000,
  onlyNew: true
});
```

#### Utilisation

```tsx
import { useOpenRouterModels } from '@/lib/hooks/useOpenRouterModels';

function MyComponent() {
  const { models, isLoading, refreshModels } = useOpenRouterModels();
  
  if (isLoading) return <div>Chargement...</div>;
  
  return (
    <div>
      <button onClick={refreshModels}>Actualiser</button>
      <p>{models.length} modèles disponibles</p>
      {models.map(model => (
        <div key={model.id}>{model.name}</div>
      ))}
    </div>
  );
}
```

#### Filtrage

```typescript
// Filtrer par provider
const googleModels = filterModels({ provider: 'google' });

// Filtrer avec vision
const visionModels = filterModels({ hasVision: true });

// Filtrer par contexte minimum
const longContextModels = filterModels({ minContextLength: 100000 });

// Recherche textuelle
const searchResults = filterModels({ search: 'llama' });

// Combinaison
const results = filterModels({
  provider: 'meta-llama',
  hasVision: false,
  minContextLength: 50000,
  search: 'instruct'
});
```

### 3. API Route

**Fichier**: `app/api/models/sync/route.ts`

#### GET /api/models/sync

Récupère la liste des modèles gratuits.

**Query params**:
- `refresh`: Force refresh (`true`/`false`)
- `includeStats`: Inclure statistiques (`true`/`false`)

**Réponse**:
```json
{
  "success": true,
  "models": [...],
  "count": 42,
  "timestamp": "2025-10-22T12:00:00.000Z",
  "stats": {
    "total": 42,
    "totalAvailable": 150,
    "free": 42,
    "byProvider": {
      "google": 5,
      "meta-llama": 8,
      ...
    },
    "withVision": 3,
    "averageContextLength": 45000,
    "maxContextLength": 200000
  }
}
```

**Exemples**:
```bash
# Récupération simple
curl http://localhost:3000/api/models/sync

# Avec refresh forcé
curl http://localhost:3000/api/models/sync?refresh=true

# Avec statistiques
curl http://localhost:3000/api/models/sync?includeStats=true
```

#### POST /api/models/sync

Déclenche une synchronisation forcée.

**Réponse**:
```json
{
  "success": true,
  "message": "Models synchronized successfully",
  "count": 42,
  "timestamp": "2025-10-22T12:00:00.000Z"
}
```

### 4. Composant UI

**Fichier**: `components/admin/ModelSyncPanel.tsx`

Composant d'interface pour gérer la synchronisation.

```tsx
import { ModelSyncPanel } from '@/components/admin/ModelSyncPanel';

<ModelSyncPanel 
  onModelsUpdated={(count) => console.log(`${count} modèles chargés`)}
  className="my-custom-class"
/>
```

**Fonctionnalités**:
- ✅ Affichage du nombre de modèles
- ✅ Bouton d'actualisation
- ✅ Statistiques en temps réel
- ✅ Liste des providers
- ✅ Indicateur de dernière synchro
- ✅ Gestion des erreurs

### 5. Script CLI

**Fichier**: `sync-openrouter-models.mjs`

Script en ligne de commande pour synchroniser les modèles.

**Usage**:
```bash
# Synchronisation simple
node sync-openrouter-models.mjs

# Avec statistiques
node sync-openrouter-models.mjs --stats

# Sauvegarder dans un fichier
node sync-openrouter-models.mjs --save

# Spécifier le fichier de sortie
node sync-openrouter-models.mjs --save --output ./models.json
```

**Sortie**:
```
🔄 Synchronisation des modèles OpenRouter...

📡 Récupération des modèles depuis l'API OpenRouter...
✅ 150 modèles récupérés

🔍 Filtrage des modèles gratuits...
✅ 42 modèles gratuits trouvés

🔄 Conversion au format de l'application...
✅ 42 modèles convertis et triés

🏆 TOP 10 MODÈLES GRATUITS
════════════════════════════════════════════════════════════════════════════════
 1. 👁️ Gemini 1.5 Flash                        google          1000k
 2.    LLaMA 3.2 3B Instruct                   meta-llama      131k
 3.    Mistral 7B Instruct                     mistralai       32k
...
```

## Format des Modèles

### Format OpenRouter (source)

```typescript
{
  id: "google/gemini-flash-1.5",
  name: "Gemini 1.5 Flash",
  pricing: {
    prompt: "0",
    completion: "0"
  },
  context_length: 1000000,
  architecture: {
    modality: "text+image"
  }
}
```

### Format Application (converti)

```typescript
{
  id: "google/gemini-flash-1.5",
  name: "Gemini 1.5 Flash",
  provider: "openrouter",
  contextLength: 1000000,
  isFree: true,
  features: {
    rag: true,
    vision: true,
    streaming: true
  },
  pricing: {
    prompt: "0",
    completion: "0"
  }
}
```

## Filtrage et Tri

### Critères de Filtrage

1. **Prix**: `pricing.prompt === "0"` ET `pricing.completion === "0"`
2. **Disponibilité**: Modèles actuellement disponibles sur OpenRouter

### Critères de Tri (par ordre de priorité)

1. **Providers connus**: google, meta-llama, microsoft, mistralai, qwen
2. **Context length**: Plus grand = meilleur
3. **Alphabétique**: Par nom en dernier recours

## Performance

### Cache

- **Niveau 1**: Mémoire (JavaScript) - 1 heure
- **Niveau 2**: localStorage - 24 heures
- **Fallback**: API si cache invalide

### Temps de Réponse

- **Cache valide**: < 10ms
- **localStorage**: < 50ms
- **API**: 500-2000ms

### Optimisations

- ✅ Cache multi-niveaux
- ✅ Chargement paresseux (lazy)
- ✅ Synchronisation en arrière-plan
- ✅ Fallback graceful

## Gestion des Erreurs

### Erreurs Réseau

```typescript
try {
  const models = await getCachedFreeModels();
} catch (error) {
  // Utilise les données en cache si disponibles
  const cached = loadFreeModelsFromLocalStorage();
  if (cached) return cached;
  
  // Sinon, affiche une erreur
  throw new Error('Impossible de charger les modèles');
}
```

### Erreurs API

- **429 (Rate Limit)**: Retry avec backoff
- **500 (Server Error)**: Utilise le cache
- **Timeout**: Fallback vers localStorage

## Intégration

### Dans un Composant Existant

```tsx
import { useOpenRouterModels } from '@/lib/hooks/useOpenRouterModels';

function ModelSelector() {
  const { models, isLoading, filterModels } = useOpenRouterModels();
  
  // Filtrer les modèles avec vision
  const visionModels = filterModels({ hasVision: true });
  
  return (
    <select>
      {visionModels.map(model => (
        <option key={model.id} value={model.id}>
          {model.name}
        </option>
      ))}
    </select>
  );
}
```

### Mise à Jour Manuelle

```tsx
function AdminPanel() {
  const { refreshModels } = useOpenRouterModels();
  
  return (
    <button onClick={() => refreshModels()}>
      Synchroniser les modèles
    </button>
  );
}
```

### Synchronisation Automatique

```tsx
useEffect(() => {
  // Synchroniser toutes les 6 heures
  const interval = setInterval(() => {
    refreshModels();
  }, 6 * 60 * 60 * 1000);
  
  return () => clearInterval(interval);
}, [refreshModels]);
```

## Tests

### Test Manuel

1. Ouvrir l'application
2. Le hook charge automatiquement les modèles
3. Vérifier dans DevTools: `localStorage.getItem('tetika-free-models-cache')`
4. Attendre 1 heure et vérifier le refresh automatique

### Test CLI

```bash
# Test simple
node sync-openrouter-models.mjs

# Test avec statistiques
node sync-openrouter-models.mjs --stats

# Test sauvegarde
node sync-openrouter-models.mjs --save --output test-models.json
cat test-models.json
```

### Test API

```bash
# Test GET
curl http://localhost:3000/api/models/sync?includeStats=true | jq

# Test POST
curl -X POST http://localhost:3000/api/models/sync | jq
```

## Configuration

### Variables d'Environnement

Aucune variable spécifique nécessaire (API OpenRouter publique).

### Paramètres Configurables

```typescript
// Durée du cache (défaut: 1 heure)
const cacheDuration = 60 * 60 * 1000; // millisecondes

// Providers prioritaires
const knownProviders = ['google', 'meta-llama', 'microsoft', 'mistralai', 'qwen'];

// Expiration localStorage (défaut: 24 heures)
const localStorageMaxAge = 24; // heures
```

## Métriques

### Suivi Recommandé

- Nombre de modèles gratuits disponibles
- Nombre de providers
- Context length moyen
- Taux de succès de synchronisation
- Temps de réponse API

### Logs

```
[OpenRouter Sync] Fetching models from OpenRouter API...
[OpenRouter Sync] Successfully fetched 150 models
[OpenRouter Sync] Found 42 free models
[OpenRouter Sync] Using cached models
[OpenRouter Sync] Cache expired, fetching new models
```

## Roadmap

### Court Terme
- [x] Service de synchronisation
- [x] Hook React
- [x] API route
- [x] Composant UI
- [x] Script CLI
- [ ] Tests unitaires

### Moyen Terme
- [ ] Webhook pour notifications de nouveaux modèles
- [ ] Comparaison de versions (changelog des modèles)
- [ ] Filtres avancés (par capacités spécifiques)
- [ ] Favoris utilisateur

### Long Terme
- [ ] Prédiction de disponibilité basée sur l'historique
- [ ] Recommandation de modèles selon la tâche
- [ ] Benchmark automatique des modèles
- [ ] Support multi-providers (NotDiamond, etc.)
