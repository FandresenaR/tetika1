# ModelSelector - Migration vers Synchronisation Dynamique

## 🐛 Problème Identifié

### Symptôme
Les modèles obsolètes (LearnLM, DeepSeek R1 distill, etc.) continuaient d'apparaître dans le sélecteur de modèles même après avoir vidé le cache localStorage.

### Diagnostic
```
User: "LearnLM est encore dispo meme apres avoir vider les caches, 
       ce qui veut dire que la liste de modele n'est pas synchro avec 
       'modele' dans parametre"
```

### Cause Racine
**Incohérence architecturale** : Deux composants utilisaient deux sources de données différentes :

1. **SettingsModal** ✅ : Utilisait `useOpenRouterModels()` 
   - Source : API OpenRouter en temps réel
   - Modèles : 52 modèles gratuits actuels
   - Mise à jour : Synchronisation automatique avec cache 24h

2. **ModelSelector** ❌ : Utilisait `getAllModels()` depuis `lib/models.ts`
   - Source : Liste statique codée en dur
   - Modèles : ~100 modèles (incluant obsolètes)
   - Mise à jour : Manuelle (edit du fichier source)

---

## 🔧 Solution Implémentée

### Changements dans `components/chat/ModelSelector.tsx`

#### 1. Remplacement de la source de données

**AVANT :**
```typescript
const allModels = getAllModels(); // Liste statique
```

**APRÈS :**
```typescript
const { 
  models: openRouterModels, 
  isLoading, 
  refreshModels 
} = useOpenRouterModels(); // Hook dynamique

const allModels: any[] = openRouterModels.length > 0 
  ? openRouterModels 
  : staticModels; // Fallback sécurisé
```

#### 2. Simplification de la fonction d'actualisation

**AVANT :**
```typescript
const handleRefreshModels = async () => {
  setIsRefreshing(true);
  try {
    localStorage.removeItem('tetika-free-models');
    localStorage.removeItem('tetika-models-last-sync');
    await fetch('/api/models/sync', { method: 'POST' });
    window.location.reload(); // Rechargement forcé
  } catch (error) {
    console.error('Erreur:', error);
    setIsRefreshing(false);
  }
};
```

**APRÈS :**
```typescript
const handleRefreshModels = async () => {
  try {
    localStorage.removeItem('tetika-free-models');
    localStorage.removeItem('tetika-models-last-sync');
    await refreshModels(); // Délègue au hook
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

#### 3. Utilisation de l'état du hook pour le bouton

**AVANT :**
```typescript
disabled={isRefreshing}
className={isRefreshing ? 'animate-spin' : ''}
{isRefreshing ? 'Actualisation...' : 'Actualiser'}
```

**APRÈS :**
```typescript
disabled={isLoading}
className={isLoading ? 'animate-spin' : ''}
{isLoading ? 'Actualisation...' : 'Actualiser'}
```

---

## ✅ Résultats

### Comportement Corrigé

1. **Cohérence des données** : ModelSelector et SettingsModal affichent maintenant la même liste
2. **Synchronisation automatique** : Les modèles obsolètes disparaissent lors du refresh
3. **Actualisation plus rapide** : Plus besoin de recharger la page entière
4. **Cache unifié** : Une seule source de vérité dans localStorage

### Tests de Validation

| Scénario | Avant | Après |
|----------|-------|-------|
| Nombre de modèles affichés | ~100 (statiques) | 52 (OpenRouter) |
| LearnLM visible après clear cache | ✅ Oui | ❌ Non |
| Actualisation nécessite reload | ✅ Oui | ❌ Non |
| Cohérence SettingsModal/ModelSelector | ❌ Non | ✅ Oui |
| Nouveaux modèles détectés automatiquement | ❌ Non | ✅ Oui |

---

## 📋 Modèles Obsolètes Supprimés

Suite à cette correction, les modèles suivants ont été automatiquement retirés :

- ❌ `deepseek-r1-distill-qwen-32b` (supprimé d'OpenRouter)
- ❌ `deepseek-r1-distill-qwen-14b` (supprimé d'OpenRouter)
- ❌ `google/learnlm-1.5-pro-experimental` (plus gratuit)
- ❌ `moonshotai/kimi-vl-a3b-thinking` (supprimé)
- ❌ `google/gemini-flash-1.5` (plus gratuit)

---

## ⚠️ Notes Techniques

### Type Safety
Pour assurer la compatibilité entre les deux structures de modèles pendant la transition :

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const allModels: any[] = openRouterModels.length > 0 
  ? openRouterModels 
  : staticModels;
```

Cette solution temporaire utilise `any` car :
- `openRouterModels` a la structure : `{ id, name, provider, contextLength, isFree, ... }`
- `staticModels` a la structure : `AIModel { id, name, provider, maxTokens, free, ... }`

### Amélioration Future
Créer un type unifié pour les deux sources :
```typescript
type UnifiedModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
  // Propriétés communes normalisées
};
```

---

## 🔄 Architecture Finale

```
┌─────────────────────────────────────────┐
│         OpenRouter API                   │
│   https://openrouter.ai/api/v1/models   │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│    lib/services/openRouterSync.ts       │
│  - fetchOpenRouterModels()               │
│  - filterFreeModels()                    │
│  - convertToAppModel()                   │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│    lib/hooks/useOpenRouterModels.ts     │
│  - Cache 24h dans localStorage          │
│  - Synchronisation automatique          │
│  - refreshModels()                       │
└───────────┬─────────────────────────────┘
            │
            ├──────────────┬───────────────┐
            ▼              ▼               ▼
    ┌──────────────┐  ┌──────────┐  ┌──────────────┐
    │ ModelSelector│  │ Settings │  │ Autres...    │
    └──────────────┘  └──────────┘  └──────────────┘
        52 modèles       52 modèles     52 modèles
           ✅               ✅              ✅
```

**Avant** : ModelSelector était isolé avec sa liste statique
**Après** : Tous les composants partagent la même source dynamique

---

## 📝 Instructions pour les Utilisateurs

### Comment actualiser les modèles

1. **Depuis le sélecteur de modèles** (nouvelle méthode) :
   - Cliquez sur "Choisir un modèle"
   - Cliquez sur le bouton 🔄 "Actualiser"
   - Attendez quelques secondes
   - Les modèles obsolètes disparaissent instantanément

2. **Depuis les paramètres** (méthode existante) :
   - Ouvrez "Paramètres" → Onglet "Modèles"
   - Cliquez sur 🔄 "Actualiser les modèles"
   - Les deux listes sont maintenant synchronisées

### Vérification rapide
Pour confirmer que le fix fonctionne :
```
1. Ouvrir la console du navigateur (F12)
2. Exécuter : localStorage.getItem('tetika-free-models')
3. Compter les modèles : devrait être ~52 (pas 100+)
4. Chercher "learnlm" : ne devrait PAS apparaître
```

---

## 🎯 Impact Version

**Version concernée** : v0.6.3
**Type de fix** : BUG CRITIQUE
**Breaking changes** : Non
**Migration requise** : Non (automatique)

---

## 📚 Fichiers Modifiés

```
components/chat/ModelSelector.tsx     (REFACTORING MAJEUR)
├── Import useState (retiré useEffect)
├── Import useOpenRouterModels
├── Remplacement getAllModels() → hook
├── État isRefreshing → isLoading
└── Simplification handleRefreshModels()

CHANGELOG.md                          (DOCUMENTATION)
├── Section "Corrigé" ajoutée
├── Explication du problème
└── Description de la solution

MODELSELECTOR-SYNC-FIX.md            (CE DOCUMENT)
└── Documentation technique complète
```

---

## ✨ Conclusion

Cette correction résout un problème architectural fondamental où deux composants utilisaient des sources de données différentes pour afficher les modèles. La migration de `ModelSelector` vers `useOpenRouterModels()` garantit maintenant la cohérence des données dans toute l'application.

**Résultat** : Les modèles affichés sont toujours à jour avec OpenRouter, et les modèles obsolètes disparaissent automatiquement lors de l'actualisation.
