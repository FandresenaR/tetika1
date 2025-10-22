# Gestion des Erreurs de Rate Limit - Documentation

## Problème

Les modèles gratuits d'OpenRouter peuvent atteindre leurs limites de requêtes, retournant une erreur 429 avec un message générique qui n'aide pas l'utilisateur à comprendre quoi faire.

## Solution Implémentée

### 1. Détection Améliorée des Erreurs de Rate Limit

**Fichier**: `lib/api.ts` (ligne ~876)

Le système détecte maintenant les erreurs 429 et analyse le message d'erreur pour fournir un contexte détaillé:

```typescript
else if (axiosError.response.status === 429) {
  // Parsing du message d'erreur
  const rawError = errorData?.error?.metadata?.raw || ...;
  
  if (rawError.includes('temporarily rate-limited upstream')) {
    // Rate limit du provider upstream (ex: DeepSeek)
    rateLimitMessage = `Le modèle "${modelId}" a atteint sa limite de requêtes gratuites.`;
    suggestion = '\n\n💡 Solutions possibles:\n' +
                '1. Attendez quelques minutes et réessayez\n' +
                '2. Essayez un autre modèle gratuit\n' +
                '3. Ajoutez votre propre clé API...';
  }
}
```

### 2. Messages d'Erreur Structurés

Les erreurs de rate limit retournent maintenant:
- **Message principal** explicite
- **Solutions numérotées** claires
- **Lien vers la configuration** si nécessaire
- **Émoji** pour faciliter la lecture

**Exemple de message:**

```
Le modèle "deepseek/deepseek-chat-v3-0324:free" a atteint sa limite de requêtes gratuites.

💡 Solutions possibles:
1. Attendez quelques minutes et réessayez
2. Essayez un autre modèle gratuit
3. Ajoutez votre propre clé API OpenRouter pour augmenter vos limites: https://openrouter.ai/settings/integrations
```

### 3. Composant ErrorMessage

**Fichier**: `components/ui/ErrorMessage.tsx`

Composant React dédié au formatage des messages d'erreur:

```tsx
<ErrorMessage message={errorMessage} />
```

**Fonctionnalités**:
- ✅ Détecte et formate les listes numérotées
- ✅ Met en évidence les titres avec émojis
- ✅ Préserve les sauts de ligne
- ✅ Styles adaptés au thème dark/light

### 4. Utilitaires de Fallback

**Fichier**: `lib/utils/modelFallback.ts`

Fonctions pour suggérer des modèles alternatifs:

```typescript
// Suggérer des alternatives stables
const alternatives = suggestAlternativeModels(failedModelId);

// Détecter le type d'erreur
const errorType = detectErrorType(errorMessage);

// Générer un message avec suggestions
const message = generateModelSuggestionsMessage(modelId, 'rate-limit');
```

### 5. Intégration dans ChatInterface

**Fichier**: `components/chat/ChatInterface.tsx` (ligne ~1203)

```typescript
// Si l'erreur contient déjà des suggestions (💡), ne pas ajouter de texte supplémentaire
const formattedError = errorContent.includes('💡') 
  ? errorContent 
  : `❌ **Erreur**\n\n${errorContent}\n\nVeuillez réessayer...`;
```

## Types d'Erreurs Détectées

| Code | Type | Message | Suggestions |
|------|------|---------|-------------|
| 429 | Rate Limit Upstream | Limite du provider atteinte | Attendre, changer de modèle, ajouter clé API |
| 429 | Rate Limit General | Trop de requêtes | Attendre quelques instants |
| 401 | Auth Error | Clé API invalide | Vérifier la clé, format sk-or- |
| 404 | Not Found | Modèle introuvable | Choisir un autre modèle |
| 403 | Forbidden | Accès refusé | Vérifier permissions |
| Network | Timeout | Pas de réponse | Vérifier connexion |

## Modèles Alternatifs Recommandés

En cas de rate limit, le système peut suggérer ces modèles plus stables:

1. **Google Gemini Flash 1.5** (`google/gemini-flash-1.5`)
   - Rapide et généralement disponible
   - Bonnes performances

2. **Meta LLaMA 3.2 1B/3B** (`meta-llama/llama-3.2-*-instruct:free`)
   - Léger et rapide
   - Faible consommation de ressources

3. **Qwen 2 7B** (`qwen/qwen-2-7b-instruct:free`)
   - Bon équilibre performance/disponibilité

4. **Microsoft Phi-3 Mini** (`microsoft/phi-3-mini-128k-instruct:free`)
   - Contexte long (128k tokens)
   - Stable

## Flux de Gestion d'Erreur

```
Utilisateur envoie un message
         ↓
API appelle le modèle
         ↓
Erreur 429 (Rate Limit)
         ↓
lib/api.ts détecte et parse l'erreur
         ↓
Message structuré avec suggestions
         ↓
ChatInterface.tsx reçoit l'erreur
         ↓
Formatage conditionnel (vérifie 💡)
         ↓
Message ajouté à la conversation
         ↓
ReactMarkdown affiche avec formatage
```

## Logs de Debug

Lors d'une erreur de rate limit, les logs suivants sont générés:

```
OpenRouter API error details: {
  status: 429,
  statusText: 'Too Many Requests',
  data: { ... }
}

[Rate Limit] Raw error: deepseek/deepseek-chat-v3-0324:free is temporarily rate-limited upstream...

Erreur lors du traitement de la requête chat: Error: Le modèle "..." a atteint sa limite...
```

## Configuration

### Variables d'Environnement

```env
OPENROUTER_API_KEY=sk-or-v1-...
NEXT_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-...
```

### LocalStorage

Les clés API utilisateur sont stockées dans:
- `tetika-openrouter-key`
- `tetika-notdiamond-key`
- `tetika-serpapi-key`

## Améliorations Futures

### Court Terme
- [ ] Système de retry automatique avec backoff exponentiel
- [ ] Cache des réponses pour éviter les appels répétés
- [ ] Indicateur visuel du nombre de requêtes restantes

### Moyen Terme
- [ ] Rotation automatique entre modèles similaires
- [ ] Prédiction des rate limits basée sur l'historique
- [ ] Queue de requêtes avec throttling intelligent

### Long Terme
- [ ] Support multi-provider automatique (fallback OpenRouter → NotDiamond → Local)
- [ ] Analytics des erreurs pour optimiser la sélection de modèles
- [ ] Mode dégradé gracieux avec réponses en cache

## Tests

### Test Manuel

1. Sélectionner un modèle gratuit populaire (ex: DeepSeek Free)
2. Envoyer plusieurs requêtes rapidement
3. Vérifier que l'erreur 429 affiche:
   - Message explicite
   - Solutions numérotées
   - Émoji 💡
   - Lien vers la configuration

### Test Automatisé

```typescript
// TODO: Ajouter des tests unitaires pour:
// - detectErrorType()
// - suggestAlternativeModels()
// - generateModelSuggestionsMessage()
// - ErrorMessage component rendering
```

## Métriques

Pour suivre l'efficacité de la gestion d'erreurs:

- Nombre d'erreurs 429 par modèle
- Temps moyen avant retry utilisateur
- Taux d'adoption des suggestions de modèles alternatifs
- Satisfaction utilisateur (feedback sur les messages d'erreur)

## Références

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)
