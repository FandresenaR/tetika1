/**
 * Système centralisé de nettoyage des tokens de formatage spécifiques aux modèles d'IA
 * Gère les tokens spéciaux, balises de contrôle et entités HTML de différents providers
 */

interface CleaningRule {
  pattern: RegExp;
  replacement: string;
  description: string;
  models?: string[]; // Si défini, s'applique uniquement à ces modèles
}

/**
 * Règles de nettoyage par catégorie
 */
const CLEANING_RULES = {
  // Entités HTML communes
  htmlEntities: [
    { pattern: /&apos;/g, replacement: "'", description: "HTML apostrophe" },
    { pattern: /&quot;/g, replacement: '"', description: "HTML quote" },
    { pattern: /&lt;/g, replacement: '<', description: "HTML less than" },
    { pattern: /&gt;/g, replacement: '>', description: "HTML greater than" },
    { pattern: /&amp;/g, replacement: '&', description: "HTML ampersand" },
    { pattern: /&#x27;/g, replacement: "'", description: "HTML apostrophe hex" },
    { pattern: /&#39;/g, replacement: "'", description: "HTML apostrophe decimal" },
    { pattern: /&nbsp;/g, replacement: ' ', description: "HTML non-breaking space" },
  ] as CleaningRule[],

  // Tokens Mistral (modèles Mistral AI)
  mistral: [
    { pattern: /<s>\s*/gi, replacement: '', description: "Mistral start token", models: ['mistral'] },
    { pattern: /\s*<\/s>/gi, replacement: '', description: "Mistral end token", models: ['mistral'] },
    { pattern: /\[B_INST\]\s*/gi, replacement: '', description: "Mistral begin instruction", models: ['mistral'] },
    { pattern: /\s*\[\/B_INST\]/gi, replacement: '', description: "Mistral end instruction", models: ['mistral'] },
    { pattern: /\[INST\]\s*/gi, replacement: '', description: "Mistral instruction", models: ['mistral'] },
    { pattern: /\s*\[\/INST\]/gi, replacement: '', description: "Mistral end instruction alt", models: ['mistral'] },
  ] as CleaningRule[],

  // Tokens LLaMA et dérivés
  llama: [
    { pattern: /<<SYS>>\s*/gi, replacement: '', description: "LLaMA system start", models: ['llama', 'codellama'] },
    { pattern: /\s*<<\/SYS>>/gi, replacement: '', description: "LLaMA system end", models: ['llama', 'codellama'] },
    { pattern: /\[\/INST\]\s*/gi, replacement: '', description: "LLaMA instruction end", models: ['llama'] },
  ] as CleaningRule[],

  // Tokens GPT et OpenAI
  gpt: [
    { pattern: /<\|endoftext\|>/gi, replacement: '', description: "GPT end of text", models: ['gpt'] },
    { pattern: /<\|startoftext\|>/gi, replacement: '', description: "GPT start of text", models: ['gpt'] },
  ] as CleaningRule[],

  // Tokens ChatML (utilisé par GPT-4, etc.)
  chatml: [
    { pattern: /<\|im_start\|>/gi, replacement: '', description: "ChatML message start", models: ['gpt'] },
    { pattern: /<\|im_end\|>/gi, replacement: '', description: "ChatML message end", models: ['gpt'] },
    { pattern: /<\|im_sep\|>/gi, replacement: '', description: "ChatML separator", models: ['gpt'] },
  ] as CleaningRule[],

  // Tokens Claude (Anthropic)
  claude: [
    { pattern: /\[HUMAN\]\s*/gi, replacement: '', description: "Claude human marker", models: ['claude'] },
    { pattern: /\s*\[\/HUMAN\]/gi, replacement: '', description: "Claude human end", models: ['claude'] },
    { pattern: /\[ASSISTANT\]\s*/gi, replacement: '', description: "Claude assistant marker", models: ['claude'] },
    { pattern: /\s*\[\/ASSISTANT\]/gi, replacement: '', description: "Claude assistant end", models: ['claude'] },
  ] as CleaningRule[],

  // Tokens Gemini (Google)
  gemini: [
    { pattern: /<start_of_turn>/gi, replacement: '', description: "Gemini turn start", models: ['gemini'] },
    { pattern: /<end_of_turn>/gi, replacement: '', description: "Gemini turn end", models: ['gemini'] },
  ] as CleaningRule[],

  // Tokens génériques (BOS/EOS)
  generic: [
    { pattern: /^\s*<BOS>\s*/gi, replacement: '', description: "Generic beginning of sequence" },
    { pattern: /\s*<EOS>\s*$/gi, replacement: '', description: "Generic end of sequence" },
    { pattern: /^\s*<bos>\s*/gi, replacement: '', description: "Generic BOS lowercase" },
    { pattern: /\s*<eos>\s*$/gi, replacement: '', description: "Generic EOS lowercase" },
  ] as CleaningRule[],
};

/**
 * Détecte le type de modèle à partir de son ID
 */
function detectModelType(modelId: string): string[] {
  const id = modelId.toLowerCase();
  const types: string[] = [];

  if (id.includes('mistral')) types.push('mistral');
  if (id.includes('llama') || id.includes('codellama')) types.push('llama');
  if (id.includes('gpt') || id.includes('openai')) types.push('gpt');
  if (id.includes('claude') || id.includes('anthropic')) types.push('claude');
  if (id.includes('gemini') || id.includes('google')) types.push('gemini');

  return types;
}

/**
 * Options de nettoyage
 */
interface CleaningOptions {
  modelId?: string;
  aggressive?: boolean; // Si true, applique toutes les règles même sans correspondance de modèle
  preserveFormatting?: boolean; // Si true, préserve les sauts de ligne multiples
  debug?: boolean; // Si true, log les transformations appliquées
}

/**
 * Nettoie le contenu des tokens de formatage spécifiques aux modèles d'IA
 */
export function cleanAITokens(content: string, options: CleaningOptions = {}): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  const {
    modelId = '',
    aggressive = false,
    preserveFormatting = true,
    debug = false,
  } = options;

  let cleaned = content;
  const modelTypes = detectModelType(modelId);
  const appliedRules: string[] = [];

  // Toujours appliquer le nettoyage des entités HTML
  CLEANING_RULES.htmlEntities.forEach(rule => {
    if (rule.pattern.test(cleaned)) {
      cleaned = cleaned.replace(rule.pattern, rule.replacement);
      appliedRules.push(rule.description);
    }
  });

  // Fonction helper pour appliquer les règles d'une catégorie
  const applyRules = (rules: CleaningRule[], categoryName: string) => {
    rules.forEach(rule => {
      // Appliquer si:
      // 1. Mode agressif activé
      // 2. Pas de restriction de modèle spécifique
      // 3. Le modèle actuel correspond à la règle
      const shouldApply = 
        aggressive || 
        !rule.models || 
        rule.models.some(m => modelTypes.includes(m));

      if (shouldApply && rule.pattern.test(cleaned)) {
        cleaned = cleaned.replace(rule.pattern, rule.replacement);
        appliedRules.push(`${categoryName}: ${rule.description}`);
      }
    });
  };

  // Appliquer les règles spécifiques aux modèles détectés
  if (modelTypes.includes('mistral') || aggressive) {
    applyRules(CLEANING_RULES.mistral, 'Mistral');
  }
  
  if (modelTypes.includes('llama') || aggressive) {
    applyRules(CLEANING_RULES.llama, 'LLaMA');
  }
  
  if (modelTypes.includes('gpt') || aggressive) {
    applyRules(CLEANING_RULES.gpt, 'GPT');
    applyRules(CLEANING_RULES.chatml, 'ChatML');
  }
  
  if (modelTypes.includes('claude') || aggressive) {
    applyRules(CLEANING_RULES.claude, 'Claude');
  }
  
  if (modelTypes.includes('gemini') || aggressive) {
    applyRules(CLEANING_RULES.gemini, 'Gemini');
  }

  // Toujours appliquer les tokens génériques
  applyRules(CLEANING_RULES.generic, 'Generic');

  // Nettoyage final
  cleaned = cleaned.trim();

  // Normaliser les espaces multiples (mais préserver les sauts de ligne si demandé)
  if (preserveFormatting) {
    // Remplacer 3+ sauts de ligne par 2
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  } else {
    // Normaliser tous les espaces
    cleaned = cleaned.replace(/\s+/g, ' ');
  }

  // Debug logging
  if (debug && appliedRules.length > 0) {
    console.log('[cleanAITokens] Applied rules:', appliedRules);
    console.log('[cleanAITokens] Original length:', content.length);
    console.log('[cleanAITokens] Cleaned length:', cleaned.length);
    console.log('[cleanAITokens] Removed characters:', content.length - cleaned.length);
  }

  return cleaned;
}

/**
 * Variante pour mode agressif (nettoie tous les tokens connus)
 */
export function cleanAITokensAggressive(content: string, debug = false): string {
  return cleanAITokens(content, { aggressive: true, debug });
}

/**
 * Ajoute une règle de nettoyage personnalisée (pour extension future)
 */
export function addCustomCleaningRule(
  category: keyof typeof CLEANING_RULES,
  rule: CleaningRule
): void {
  if (CLEANING_RULES[category]) {
    CLEANING_RULES[category].push(rule);
  } else {
    console.warn(`[cleanAITokens] Unknown category: ${category}`);
  }
}

/**
 * Exporte les règles de nettoyage pour inspection
 */
export function getCleaningRules(): typeof CLEANING_RULES {
  return CLEANING_RULES;
}
