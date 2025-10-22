# Guide du Badge "NEW" et Classification par Catégories

## Vue d'ensemble

Le système de synchronisation des modèles OpenRouter détecte automatiquement les nouveaux modèles et les classe par catégories pour faciliter leur découverte et utilisation.

## Badge "NEW"

### Fonctionnement

Lorsque vous synchronisez les modèles :

1. **Comparaison avec le cache précédent** : Le système charge les modèles du cache localStorage
2. **Détection des nouveaux** : Compare les IDs des modèles récupérés avec ceux du cache
3. **Marquage automatique** : Les modèles qui n'existaient pas auparavant reçoivent `isNew: { added: Date.now() }`
4. **Conservation du timestamp** : Les modèles existants gardent leur timestamp d'origine
5. **Vérification de l'expiration** : Le badge "NEW" disparaît automatiquement après **3 mois (90 jours)**
6. **Affichage visuel** : Badge vert "NEW" avec bordure dans l'interface pour les modèles < 3 mois

### Interface utilisateur

Dans **Paramètres > Modèles** :

```
🆕 Modèles récemment ajoutés:
┌─────────────────────────────────────────────────┐
│ 🧠 DeepSeek R1 [NEW]              128k ctx     │
│ 💻 DeepCoder 14B Preview [NEW]    8k ctx      │
│ 🌐 Mistral Small 3.1 [NEW]       16k ctx      │
└─────────────────────────────────────────────────┘
```

Caractéristiques :
- ✅ Maximum 10 modèles affichés
- ✅ Icône de catégorie visible
- ✅ Badge "NEW" en vert vif
- ✅ Taille du contexte affichée
- ✅ Scroll automatique si plus de 10

### Statistiques

Carte dédiée dans les statistiques :

```
┌─────────────────┐
│ Nouveaux        │
│      7          │ ← En vert vif
└─────────────────┘
```

## Classification par Catégories

### Catégories disponibles

| Icône | Catégorie    | Description                          | Exemples                          |
|-------|--------------|--------------------------------------|-----------------------------------|
| 🌐    | **général**  | Usage polyvalent et quotidien       | Mistral 7B, DeepSeek Chat        |
| 💻    | **code**     | Spécialisé en programmation         | DeepCoder, CodeLlama             |
| 👁️    | **vision**   | Traitement d'images et multimodal   | Qwen2-VL, Llama Vision           |
| 🎨    | **créatif**  | Création de contenu et narration    | StoryWriter, Creative Models     |
| 🧠    | **raisonnement** | Résolution complexe de problèmes | DeepSeek R1, QwQ, O1             |
| 🔬    | **recherche**| Recherche scientifique et données   | Research Models, Data Science    |

### Algorithme de classification

Le système utilise **plusieurs sources** pour déterminer la catégorie :

#### 1. Architecture du modèle (priorité haute)

```typescript
if (model.architecture?.modality === 'text+image') {
  return 'vision'; // ← 100% fiable
}
```

#### 2. Patterns dans le nom (priorité moyenne)

**Coding** :
- Mots-clés : `code`, `coder`, `developer`, `programming`, `deepcoder`
- Exemples : "DeepCoder 14B", "CodeLlama 70B"

**Reasoning** :
- Mots-clés : `reasoning`, `think`, `r1`, `o1`, `qwq`
- Exemples : "DeepSeek R1", "QwQ 32B Preview"

#### 3. Analyse de la description (priorité basse)

Utilise `getCategoryFromDescription()` de `lib/models.ts` :

```typescript
const description = "Advanced reasoning and problem-solving capabilities";
const category = getCategoryFromDescription(description);
// → 'reasoning'
```

Mots-clés détectés :
- **Vision** : vision, image, visual
- **Coding** : code, coding, programming, technical, developer
- **Creative** : creative, story, narrative, dialogue, writing
- **Reasoning** : reasoning, problem-solving
- **Research** : research, scientific, knowledge, data science

#### 4. Fallback

Si aucun pattern n'est détecté → **général**

### Grille de catégories dans l'UI

```
Par catégorie:
┌──────────────┬──────────────┬──────────────┐
│ 🌐 Général   │ 💻 Code      │ 👁️ Vision    │
│     24       │     8        │     12       │
├──────────────┼──────────────┼──────────────┤
│ 🎨 Créatif   │ 🧠 Raison.   │ 🔬 Recherche │
│     3        │     15       │     7        │
└──────────────┴──────────────┴──────────────┘
```

## Filtres dans le Sélecteur de Modèles

### Nouveaux Filtres (v0.6.1)

Le sélecteur de modèles inclut maintenant **2 filtres rapides** :

#### 🆕 Filtre "Nouveau"
- Affiche uniquement les modèles ajoutés **il y a moins de 3 mois**
- Badge vert avec compteur de modèles
- Animation et bordure lumineuse quand activé

#### 👁️ Filtre "Multimodal"
- Affiche les modèles avec capacité vision (traitement d'images)
- Badge violet avec compteur
- Filtre sur `category: 'vision'` et `features.rag: true`

### Interface Utilisateur

```
Filtres rapides
┌───────────────────────────────────────────────┐
│ [🆕 Nouveau (7)]  [👁️ Multimodal (12)]      │
└───────────────────────────────────────────────┘

Par spécialité
┌───────────────────────────────────────────────┐
│ [Général] [Programmation] [Vision]           │
│ [Créativité] [Raisonnement] [Recherche]      │
└───────────────────────────────────────────────┘
```

### Fonctionnalités

- ✅ **Toggle on/off** : Clic pour activer/désactiver
- ✅ **Compteurs dynamiques** : Nombre de modèles par filtre
- ✅ **Combinaison possible** : Nouveau + Catégorie, etc.
- ✅ **Réinitialisation globale** : Bouton "Réinitialiser" efface tous les filtres
- ✅ **Badge "NEW"** visible sur chaque carte de modèle récent

## Filtrage avancé (Programmation)

### Par catégorie

```tsx
import { useOpenRouterModels } from '@/lib/hooks/useOpenRouterModels';

function MyComponent() {
  const { filterModels } = useOpenRouterModels();
  
  // Tous les modèles de coding
  const codingModels = filterModels({ category: 'coding' });
  
  // Modèles de raisonnement uniquement
  const reasoningModels = filterModels({ category: 'reasoning' });
}
```

### Nouveaux modèles uniquement

```tsx
// Tous les nouveaux modèles
const newModels = filterModels({ onlyNew: true });

// Nouveaux modèles de vision
const newVisionModels = filterModels({ 
  category: 'vision',
  onlyNew: true 
});
```

### Combinaison complexe

```tsx
// Nouveaux modèles de raisonnement avec contexte >32k
const filteredModels = filterModels({
  category: 'reasoning',
  onlyNew: true,
  minContextLength: 32000
});
```

## API et Données

### Type AIModel étendu

```typescript
interface AIModel {
  id: string;
  name: string;
  provider: 'openrouter' | 'notdiamond';
  description: string;
  maxTokens: number;
  free?: boolean;
  category?: 'general' | 'coding' | 'vision' | 'creative' | 'reasoning' | 'research';
  isNew?: boolean; // ← Badge "NEW"
  features: {
    streaming?: boolean;
    rag?: boolean;
    codeCompletion?: boolean;
  };
}
```

### Statistiques enrichies

```typescript
interface Stats {
  total: number;
  new: number; // ← Nombre de nouveaux modèles
  byProvider: Record<string, number>;
  byCategory: Record<string, number>; // ← Par catégorie
  withVision: number;
  averageContextLength: number;
  maxContextLength: number;
}
```

Exemple de données :

```json
{
  "total": 69,
  "new": 7,
  "byProvider": {
    "mistralai": 4,
    "deepseek": 8,
    "google": 12
  },
  "byCategory": {
    "general": 24,
    "coding": 8,
    "vision": 12,
    "creative": 3,
    "reasoning": 15,
    "research": 7
  },
  "withVision": 12,
  "averageContextLength": 24576,
  "maxContextLength": 131072
}
```

## Workflow utilisateur

### Premier sync

1. **Clic sur "Actualiser"** dans Paramètres > Modèles
2. **Récupération** des modèles depuis OpenRouter API
3. **Classification** automatique par catégorie
4. **Tous les modèles sont marqués comme nouveaux** (pas de cache précédent)
5. **Affichage** : Badge "NEW" sur tous les modèles

### Syncs ultérieurs

1. **Charge le cache** localStorage précédent avec timestamps
2. **Compare les IDs** entre ancien et nouveau
3. **Préserve les timestamps** des modèles existants
4. **Crée un timestamp** pour les nouveaux modèles (`id` absent du cache)
5. **Vérifie l'expiration** : Si > 3 mois, le badge "NEW" n'est plus affiché
6. **Affichage** : Badge "NEW" uniquement sur les modèles < 3 mois

### Persistence

- **Cache mémoire** : 1 heure
- **localStorage** : 24 heures
- **Badge "NEW"** : **Expire automatiquement après 3 mois** depuis l'ajout du modèle

## Performance

### Optimisations

- ✅ **Lazy loading** : Liste des nouveaux limitée à 10
- ✅ **Scroll virtuel** : Si plus de 10 modèles
- ✅ **Cache efficace** : Comparaison O(n) avec Set()
- ✅ **Rendering optimisé** : Grille CSS Grid responsive

### Métriques

```
Temps de sync moyen     : 800ms
Détection de nouveaux   : <10ms
Classification          : <5ms par modèle
Rendu UI                : <100ms
```

## Exemples d'utilisation

### Afficher uniquement les nouveaux modèles de code

```tsx
function NewCodingModels() {
  const { filterModels, isLoading } = useOpenRouterModels();
  
  const models = filterModels({ 
    category: 'coding',
    onlyNew: true 
  });
  
  return (
    <div>
      <h2>🆕 Nouveaux modèles de code</h2>
      {models.map(model => (
        <div key={model.id}>
          <span>💻</span>
          <span>{model.name}</span>
          {model.isNew && <span className="badge-new">NEW</span>}
        </div>
      ))}
    </div>
  );
}
```

### Filtrer par catégorie avec sélecteur

```tsx
function CategoryFilter() {
  const [category, setCategory] = useState<string>('all');
  const { filterModels } = useOpenRouterModels();
  
  const models = category === 'all' 
    ? filterModels({}) 
    : filterModels({ category });
  
  return (
    <>
      <select onChange={(e) => setCategory(e.target.value)}>
        <option value="all">Toutes les catégories</option>
        <option value="coding">💻 Code</option>
        <option value="reasoning">🧠 Raisonnement</option>
        <option value="vision">👁️ Vision</option>
      </select>
      
      <ModelList models={models} />
    </>
  );
}
```

## Troubleshooting

### Le badge "NEW" ne s'affiche pas

**Causes possibles** :
1. Cache localStorage absent → Tous les modèles sont considérés comme anciens
2. Pas de nouveaux modèles depuis le dernier sync
3. localStorage désactivé dans le navigateur

**Solution** :
```typescript
// Forcer un refresh complet
invalidateModelCache();
await refreshModels();
```

### Catégorie incorrecte

**Cause** : Patterns de détection incomplets

**Solution** : Mettre à jour `assignCategory()` dans `openRouterSync.ts`

```typescript
// Ajouter un nouveau pattern
const codingPatterns = ['code', 'coder', 'developer', 'YOUR_PATTERN'];
```

### Statistiques manquantes

**Cause** : `getFreeModelsStats()` n'a pas été appelé

**Solution** :
```tsx
const { stats, refreshModels } = useOpenRouterModels();

// Force le chargement des stats
useEffect(() => {
  if (!stats) refreshModels();
}, []);
```

## Roadmap

### Fonctionnalités futures

- [ ] **Filtre UI** : Sélecteur de catégorie dans l'interface
- [ ] **TTL pour badge NEW** : Expiration après 7 jours
- [ ] **Notifications** : Alert lors de l'ajout de nouveaux modèles
- [ ] **Favoris** : Marquer des modèles comme favoris
- [ ] **Comparaison** : Comparer plusieurs modèles côte à côte
- [ ] **Historique** : Voir l'évolution des modèles dans le temps

### Améliorations

- [ ] **Auto-sync** : Synchronisation automatique toutes les 24h
- [ ] **Badges multiples** : NEW, POPULAR, RECOMMENDED
- [ ] **Catégories personnalisées** : Permettre à l'utilisateur de créer ses propres catégories
- [ ] **Export** : Exporter la liste des modèles en JSON/CSV

## Références

- **Code source**
  - `lib/services/openRouterSync.ts` - Service de synchronisation
  - `lib/hooks/useOpenRouterModels.ts` - Hook React
  - `components/ui/SettingsModal.tsx` - Interface utilisateur
  - `lib/models.ts` - Fonction `getCategoryFromDescription()`

- **Documentation**
  - [OPENROUTER-SYNC-SYSTEM.md](./OPENROUTER-SYNC-SYSTEM.md) - Système complet
  - [MODELS-SYNC-SETTINGS-GUIDE.md](./MODELS-SYNC-SETTINGS-GUIDE.md) - Guide UI
  - [CHANGELOG.md](./CHANGELOG.md) - Version 0.6.0

- **API OpenRouter**
  - https://openrouter.ai/api/v1/models - Liste des modèles
  - https://openrouter.ai/docs - Documentation officielle
