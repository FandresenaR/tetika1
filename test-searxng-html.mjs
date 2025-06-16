#!/usr/bin/env node

import axios from 'axios';
import * as cheerio from 'cheerio';

async function testSearXNGHTMLParsing() {
  const query = 'artificial intelligence';
  const instances = [
    'https://searx.be',
    'https://searx.tiekoetter.com',
    'https://opnxng.com',
    'https://searxng.world',
    'https://searx.oloke.xyz',
    'https://seek.fyi'
  ];

  for (const instance of instances) {
    try {
      console.log(`\n=== Testant ${instance} ===`);
      
      const params = new URLSearchParams({
        q: query,
        language: 'fr',
        time_range: '',
        categories: 'general'
      });
      
      const response = await axios({
        method: 'GET',
        url: `${instance}/search?${params.toString()}`,
        timeout: 15000,
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
      });
      
      console.log('Status:', response.status);
      console.log('Content-Type:', response.headers['content-type']);
      
      if (response.status === 200 && response.data.includes('results')) {
        // Try to parse HTML
        const $ = cheerio.load(response.data);
        const results = [];
        
        // Common SearXNG result selectors
        const resultSelectors = [
          '.result',
          '#results .result',
          '.result-default',
          'article.result'
        ];
        
        let foundResults = false;
        for (const selector of resultSelectors) {
          const elements = $(selector);
          if (elements.length > 0) {
            console.log(`Found ${elements.length} results with selector: ${selector}`);
            
            elements.each((i, element) => {
              if (i >= 5) return false; // Limit to 5 for testing
              
              const $el = $(element);
              const title = $el.find('h3 a, .result-title a, a h3').first().text().trim();
              const url = $el.find('h3 a, .result-title a, a h3').first().attr('href');
              const snippet = $el.find('.result-content, .content, p').first().text().trim();
              
              if (title && url) {
                results.push({
                  title,
                  url: url.startsWith('http') ? url : `${instance}${url}`,
                  snippet: snippet || 'No description available'
                });
              }
            });
            
            foundResults = true;
            break;
          }
        }
        
        if (foundResults) {
          console.log('Sample results:', JSON.stringify(results.slice(0, 3), null, 2));
          console.log(`✅ ${instance} fonctionne avec parsing HTML!`);
          break; // Success, stop testing
        } else {
          console.log('❌ Aucun résultat trouvé avec les sélecteurs connus');
        }
      } else {
        console.log('❌ Réponse non-HTML ou pas de résultats');
      }
      
    } catch (error) {
      console.error(`❌ Erreur avec ${instance}:`, error.message);
      if (error.response) {
        console.log('Response status:', error.response.status);
      }
    }
  }
}

testSearXNGHTMLParsing().catch(console.error);
