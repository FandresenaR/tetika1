/**
 * Script de test pour le système de nettoyage des tokens d'IA
 */

import { cleanAITokens, cleanAITokensAggressive, getCleaningRules } from './lib/utils/aiTokenCleaner.ts';

console.log('=== Test du système de nettoyage des tokens d\'IA ===\n');

// Test 1: Mistral avec tokens de formatage
console.log('Test 1: Mistral avec tokens de formatage');
const mistralContent = " <s> [B_INST] L&apos;IA est là, froide et précise, [/B_INST]\n<s> Dans un monde où tout s&apos;aligne, [/s]\n<s> [B_INST] Calculant sans répit, sans trêve, [/B_INST]";
console.log('Original:', mistralContent);
const cleaned1 = cleanAITokens(mistralContent, { modelId: 'mistralai/mistral-7b-instruct', debug: true });
console.log('Nettoyé:', cleaned1);
console.log('\n---\n');

// Test 2: GPT avec tokens ChatML
console.log('Test 2: GPT avec tokens ChatML');
const gptContent = "<|im_start|>user\nHello<|im_end|>\n<|im_start|>assistant\nHi there!<|im_end|>";
console.log('Original:', gptContent);
const cleaned2 = cleanAITokens(gptContent, { modelId: 'openai/gpt-4', debug: true });
console.log('Nettoyé:', cleaned2);
console.log('\n---\n');

// Test 3: Contenu générique avec entités HTML
console.log('Test 3: Contenu générique avec entités HTML');
const htmlContent = "Il a dit &quot;Bonjour&quot; et elle a répondu &apos;Salut&apos; avec un sourire &lt;3";
console.log('Original:', htmlContent);
const cleaned3 = cleanAITokens(htmlContent, { debug: true });
console.log('Nettoyé:', cleaned3);
console.log('\n---\n');

// Test 4: Mode agressif (tous les tokens)
console.log('Test 4: Mode agressif');
const mixedContent = "<s> [INST] Hello [/INST] <|im_start|> Response &apos;here&apos; <|im_end|> </s>";
console.log('Original:', mixedContent);
const cleaned4 = cleanAITokensAggressive(mixedContent, true);
console.log('Nettoyé:', cleaned4);
console.log('\n---\n');

// Test 5: Contenu propre (pas de tokens)
console.log('Test 5: Contenu propre');
const cleanContent = "Ceci est un texte normal sans aucun token spécial.";
console.log('Original:', cleanContent);
const cleaned5 = cleanAITokens(cleanContent, { debug: true });
console.log('Nettoyé:', cleaned5);
console.log('Identique:', cleanContent === cleaned5);
console.log('\n---\n');

// Afficher les règles disponibles
console.log('Règles de nettoyage disponibles:');
const rules = getCleaningRules();
Object.keys(rules).forEach(category => {
  console.log(`\n${category}:`);
  rules[category].forEach(rule => {
    console.log(`  - ${rule.description}`);
  });
});

console.log('\n=== Tests terminés ===');
