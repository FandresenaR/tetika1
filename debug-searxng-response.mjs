#!/usr/bin/env node

import axios from 'axios';

async function debugSearXNGResponse() {
  const query = 'test artificial intelligence';  const instances = [
    'https://searx.be',
    'https://searx.ninja',
    'https://search.bus-hit.me',
    'https://searx.prvcy.eu',
    'https://searx.tiekoetter.com'
  ];

  for (const instance of instances) {
    try {
      console.log(`\n=== Testant ${instance} ===`);
      
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        engines: 'google,bing,duckduckgo',
        safesearch: '1',
        language: 'fr',
        time_range: '',
        categories: 'general'
      });
      
      const response = await axios({
        method: 'GET',
        url: `${instance}/?${params.toString()}`,
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TetikaChatApp/1.0 SearXNG-Debug',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        },
      });
      
      console.log('Status:', response.status);
      console.log('Headers:', JSON.stringify(response.headers, null, 2));
      console.log('Data type:', typeof response.data);
      console.log('Data keys:', Object.keys(response.data || {}));
      
      if (response.data && response.data.results) {
        console.log('Results count:', response.data.results.length);
        console.log('First result sample:', JSON.stringify(response.data.results[0], null, 2));
      } else {
        console.log('Full response data:', JSON.stringify(response.data, null, 2));
      }
      
      break; // Success, stop testing other instances
      
    } catch (error) {
      console.error(`Erreur avec ${instance}:`, error.message);
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
      }
    }
  }
}

debugSearXNGResponse().catch(console.error);
