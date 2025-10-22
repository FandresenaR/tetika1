# Système de Nettoyage des Tokens d'IA

## Vue d'ensemble

Le module `aiTokenCleaner` (`lib/utils/aiTokenCleaner.ts`) fournit un système centralisé et extensible pour nettoyer les tokens de formatage spécifiques aux différents modèles d'IA.

## Problème résolu

Les modèles d'IA retournent souvent des tokens techniques dans leurs réponses:
- **Mistral**: `<s>`, `</s>`, `[B_INST]`, `[/B_INST]`
- **GPT**: `<|endoftext|>`, `<|im_start|>`, `<|im_end|>`
- **LLaMA**: `<<SYS>>`, `<</SYS>>`
- **Entités HTML**: `&apos;`, `&quot;`, `&lt;`, `&gt;`

Ces tokens:
- Cassent le formatage Markdown
- Apparaissent dans l'interface utilisateur
- Réduisent la lisibilité des réponses
- Sont spécifiques à chaque modèle

## Architecture

### Fonction principale

```typescript
cleanAITokens(content: string, options?: CleaningOptions): string
```

#### Options

```typescript
interface CleaningOptions {
  modelId?: string;           // ID du modèle (ex: "mistralai/mistral-7b-instruct")
  aggressive?: boolean;       // Si true, applique toutes les règles
  preserveFormatting?: boolean; // Si true, préserve les sauts de ligne
  debug?: boolean;            // Si true, log les transformations
}
```

### Détection automatique

Le système détecte automatiquement le type de modèle à partir de son ID:

```typescript
// Exemples de détection:
"mistralai/mistral-7b-instruct"  → ['mistral']
"meta-llama/llama-3-70b"         → ['llama']
"openai/gpt-4-turbo"             → ['gpt']
"anthropic/claude-3-opus"        → ['claude']
```

### Règles de nettoyage

Les règles sont organisées par catégorie:

#### 1. Entités HTML (toujours appliquées)
- `&apos;` → `'`
- `&quot;` → `"`
- `&lt;` → `<`
- `&gt;` → `>`
- `&amp;` → `&`
- `&#x27;`, `&#39;` → `'`
- `&nbsp;` → ` `

#### 2. Tokens Mistral
- `<s>` (start token)
- `</s>` (end token)
- `[B_INST]`, `[/B_INST]` (instruction markers)
- `[INST]`, `[/INST]` (alternative markers)

#### 3. Tokens LLaMA
- `<<SYS>>`, `<</SYS>>` (system markers)
- `[/INST]` (instruction end)

#### 4. Tokens GPT
- `<|endoftext|>`, `<|startoftext|>`

#### 5. Tokens ChatML (GPT-4, etc.)
- `<|im_start|>`, `<|im_end|>`, `<|im_sep|>`

#### 6. Tokens Claude (Anthropic)
- `[HUMAN]`, `[/HUMAN]`
- `[ASSISTANT]`, `[/ASSISTANT]`

#### 7. Tokens Gemini (Google)
- `<start_of_turn>`, `<end_of_turn>`

#### 8. Tokens génériques (toujours appliqués)
- `<BOS>`, `<EOS>` (begin/end of sequence)

## Utilisation

### Cas d'usage 1: Nettoyage intelligent (recommandé)

```typescript
import { cleanAITokens } from '@/lib/utils/aiTokenCleaner';

// Le système applique uniquement les règles pertinentes pour Mistral
const cleaned = cleanAITokens(rawContent, {
  modelId: 'mistralai/mistral-7b-instruct',
  preserveFormatting: true,
  debug: true
});
```

### Cas d'usage 2: Nettoyage agressif

```typescript
import { cleanAITokensAggressive } from '@/lib/utils/aiTokenCleaner';

// Applique TOUTES les règles de nettoyage
const cleaned = cleanAITokensAggressive(rawContent, true);
```

### Cas d'usage 3: Nettoyage basique (entités HTML uniquement)

```typescript
import { cleanAITokens } from '@/lib/utils/aiTokenCleaner';

// Sans modelId, nettoie uniquement les entités HTML et tokens génériques
const cleaned = cleanAITokens(rawContent);
```

## Intégration dans l'API route

Dans `app/api/chat/route.ts`:

```typescript
import { cleanAITokens } from '@/lib/utils/aiTokenCleaner';

// Après extraction du contenu
aiResponse = cleanAITokens(aiResponse, {
  modelId: model.id,
  aggressive: false,
  preserveFormatting: true,
  debug: true
});
```

## Extensibilité

### Ajouter une règle personnalisée

```typescript
import { addCustomCleaningRule } from '@/lib/utils/aiTokenCleaner';

addCustomCleaningRule('mistral', {
  pattern: /\[NEW_TOKEN\]/gi,
  replacement: '',
  description: 'Custom Mistral token',
  models: ['mistral']
});
```

### Inspecter les règles disponibles

```typescript
import { getCleaningRules } from '@/lib/utils/aiTokenCleaner';

const rules = getCleaningRules();
console.log(rules);
```

## Exemples de transformation

### Exemple 1: Mistral

**Avant:**
```
<s> [B_INST] L&apos;IA est là, froide et précise, [/B_INST]
<s> Dans un monde où tout s&apos;aligne, [/s]
```

**Après:**
```
L'IA est là, froide et précise,
Dans un monde où tout s'aligne,
```

### Exemple 2: GPT avec ChatML

**Avant:**
```
<|im_start|>assistant
Voici la réponse avec du &quot;texte&quot;
<|im_end|>
```

**Après:**
```
Voici la réponse avec du "texte"
```

### Exemple 3: Entités HTML

**Avant:**
```
Il a dit &quot;Bonjour&quot; et elle a répondu &apos;Salut&apos;
```

**Après:**
```
Il a dit "Bonjour" et elle a répondu 'Salut'
```

## Logs de debug

Avec `debug: true`, le système affiche:

```
[cleanAITokens] Applied rules: [
  'HTML apostrophe',
  'Mistral: Mistral start token',
  'Mistral: Mistral begin instruction',
  'Generic: Generic beginning of sequence'
]
[cleanAITokens] Original length: 688
[cleanAITokens] Cleaned length: 425
[cleanAITokens] Removed characters: 263
```

## Tests

Exécuter les tests:

```bash
node test-token-cleaner.mjs
```

Les tests couvrent:
- Chaque type de modèle
- Mode agressif vs. intelligent
- Préservation du formatage
- Contenu déjà propre (pas de faux positifs)

## Avantages

✅ **Centralisé**: Une seule source de vérité pour le nettoyage
✅ **Extensible**: Facile d'ajouter de nouveaux modèles/tokens
✅ **Intelligent**: Applique uniquement les règles pertinentes
✅ **Type-safe**: TypeScript avec interfaces strictes
✅ **Debuggable**: Logs détaillés des transformations
✅ **Maintenable**: Code organisé par catégories
✅ **Performant**: Regex compilées une seule fois
✅ **Documenté**: Chaque règle a une description

## Maintenance future

### Ajouter un nouveau modèle

1. Créer une nouvelle catégorie dans `CLEANING_RULES`:
```typescript
nouveauModele: [
  { pattern: /TOKEN/gi, replacement: '', description: 'Description', models: ['nouveau'] }
]
```

2. Ajouter la détection dans `detectModelType()`:
```typescript
if (id.includes('nouveau')) types.push('nouveau');
```

3. Ajouter l'application dans `cleanAITokens()`:
```typescript
if (modelTypes.includes('nouveau') || aggressive) {
  applyRules(CLEANING_RULES.nouveauModele, 'NouveauModele');
}
```

4. Ajouter un test dans `test-token-cleaner.mjs`

## Performance

- Les regex sont appliquées uniquement si le pattern existe dans le texte
- Mode intelligent limite les règles au modèle détecté
- Temps de traitement: ~1-2ms pour un texte de 1000 caractères
- Pas d'impact sur les temps de réponse de l'API

## Compatibilité

- ✅ Next.js 15+
- ✅ TypeScript 5+
- ✅ Node.js 18+
- ✅ Edge Runtime compatible
