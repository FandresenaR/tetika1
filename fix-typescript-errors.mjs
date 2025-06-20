#!/usr/bin/env node

/**
 * Script de correction rapide pour les erreurs TypeScript dans route.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const routeFilePath = join(process.cwd(), 'app', 'api', 'scraping', 'route.ts');

console.log('🔧 Correction rapide des erreurs TypeScript...');

try {
  let content = readFileSync(routeFilePath, 'utf8');
  
  // Correction 1: Remplacer les waitForTimeout deprecated
  content = content.replace(/await page\.waitForTimeout\((\d+)\);/g, 'await new Promise(resolve => setTimeout(resolve, $1));');
  
  // Correction 2: Corriger les gestions d'erreur
  const errorHandlingReplacements = [
    {
      from: /console\.error\(`\[DirectScraping\] Error: \$\{error\.message\}`\);/g,
      to: `console.error('[DirectScraping] Error:', error instanceof Error ? error.message : 'Unknown error');`
    },
    {
      from: /console\.warn\(`\[DirectScraping\] First strategy failed: \$\{firstError\.message\}`\);/g,
      to: `console.warn('[DirectScraping] First strategy failed:', firstError instanceof Error ? firstError.message : 'Unknown error');`
    },
    {
      from: /console\.warn\(`\[DirectScraping\] Second strategy failed: \$\{secondError\.message\}`\);/g,
      to: `console.warn('[DirectScraping] Second strategy failed:', secondError instanceof Error ? secondError.message : 'Unknown error');`
    }
  ];
  
  errorHandlingReplacements.forEach(replacement => {
    content = content.replace(replacement.from, replacement.to);
  });
  
  // Correction 3: Remplacer async function loadMoreContent
  const loadMoreContentFunction = `
async function loadMoreContent(page: Page): Promise<void> {
  try {
    // Try different strategies to load more content
    const strategies = [
      async () => {
        const loadMoreBtn = await page.$('button[class*="load"], button[class*="more"], .load-more, .show-more');
        if (loadMoreBtn) {
          await loadMoreBtn.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
          return true;
        }
        return false;
      },
      async () => {
        // Try infinite scroll
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await new Promise(resolve => setTimeout(resolve, 2000));
        return true;
      },
      async () => {
        // Try pagination
        const nextBtn = await page.$('a[class*="next"], button[class*="next"], .pagination-next');
        if (nextBtn) {
          await nextBtn.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
          return true;
        }
        return false;
      }
    ];
    
    for (const strategy of strategies) {
      try {
        const success = await strategy();
        if (success) {
          console.log('[loadMoreContent] Successfully loaded more content');
          break;
        }
      } catch (error) {
        console.warn('[loadMoreContent] Strategy failed:', error instanceof Error ? error.message : 'Unknown error');
        continue;
      }
    }
  } catch (error) {
    console.warn('[loadMoreContent] Error:', error instanceof Error ? error.message : 'Unknown error');
  }
}`;
  
  // Remplacer la fonction loadMoreContent si elle existe
  content = content.replace(
    /async function loadMoreContent\(page: any\): Promise<void> \{[\s\S]*?\n\}/,
    loadMoreContentFunction
  );
  
  writeFileSync(routeFilePath, content, 'utf8');
  console.log('✅ Corrections appliquées avec succès!');
  
  console.log('\n📋 Corrections effectuées:');
  console.log('- ✅ Remplacement des waitForTimeout deprecated');
  console.log('- ✅ Amélioration de la gestion d\'erreur');
  console.log('- ✅ Correction de la fonction loadMoreContent');
  
  console.log('\n🎯 Prochaines étapes:');
  console.log('1. npm run build  # Vérifier la compilation');
  console.log('2. npm run dev    # Démarrer le serveur');
  console.log('3. node test-simple-api.js  # Tester l\'API');
  
} catch (error) {
  console.error('❌ Erreur lors de la correction:', error);
  process.exit(1);
}
