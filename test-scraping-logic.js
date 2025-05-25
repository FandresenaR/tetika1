#!/usr/bin/env node

/**
 * Test unitaire pour la fonction de scraping
 * Ce script teste directement la logique de scraping sans passer par l'API
 */

const axios = require('axios');
const cheerio = require('cheerio');

// Copie des fonctions utilitaires de l'API
function normalizeUrl(url, baseUrl) {
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('//')) {
      return `https:${url}`;
    }
    if (url.startsWith('/')) {
      const base = new URL(baseUrl);
      return `${base.protocol}//${base.host}${url}`;
    }
    const base = new URL(baseUrl);
    return `${base.protocol}//${base.host}/${url}`;
  } catch {
    return url;
  }
}

function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
}

function extractCompanyData($, url) {
  const companies = [];
  
  const companySelectors = [
    '.company',
    '.partner',
    '.startup',
    '.exhibitor',
    '.member',
    '.sponsor',
    '[class*="company"]',
    '[class*="partner"]',
    '[class*="startup"]',
    '[class*="exhibitor"]'
  ];
  
  companySelectors.forEach(selector => {
    $(selector).each((_, element) => {
      const $el = $(element);
      
      let name = cleanText($el.find('h1, h2, h3, h4, .name, .title, .company-name').first().text()) ||
                 cleanText($el.attr('data-name') || '') ||
                 cleanText($el.find('a').first().text());
      
      if (!name && $el.text().length < 200) {
        name = cleanText($el.text());
      }
      
      if (name && name.length > 2 && name.length < 100) {
        const website = $el.find('a[href*="http"]').attr('href') || 
                       $el.attr('data-website') || 
                       ($el.find('a').attr('href') ? normalizeUrl($el.find('a').attr('href'), url) : undefined);
        
        const description = cleanText($el.find('.description, .summary, p').first().text()) || undefined;
        const employees = cleanText($el.find('.employees, .size, .team-size').first().text()) || undefined;
        
        const tags = [];
        $el.find('.tag, .category, .sector, .industry').each((_, tagEl) => {
          const tag = cleanText($(tagEl).text());
          if (tag && tag.length > 1 && tag.length < 50) {
            tags.push(tag);
          }
        });
        
        companies.push({
          name,
          website,
          description,
          employees,
          tags: tags.length > 0 ? tags : undefined
        });
      }
    });
  });
  
  return companies;
}

async function testScrapeWebsite(url) {
  try {
    console.log(`🔍 Test de scraping pour: ${url}`);
    
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Only HTTP and HTTPS URLs are supported');
    }

    const response = await axios({
      method: 'GET',
      url: url,
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      maxRedirects: 5,
      validateStatus: (status) => status < 400,
    });

    console.log(`✅ HTTP ${response.status} - Contenu reçu: ${response.data.length} caractères`);

    const html = response.data;
    const $ = cheerio.load(html);

    const title = $('title').text().trim() || $('h1').first().text().trim() || 'No title found';
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || '';
    const keywords = $('meta[name="keywords"]').attr('content') || '';
    const author = $('meta[name="author"]').attr('content') || '';

    console.log(`📄 Titre: ${title}`);
    console.log(`📝 Description: ${description.substring(0, 100)}...`);

    // Extract content
    let content = '';
    const contentSelectors = [
      'main', 'article', '.content', '#content', '.post-content', 
      '.entry-content', '.article-content', 'body'
    ];

    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim().length > 100) {
        content = cleanText(element.text());
        break;
      }
    }

    if (!content || content.length < 100) {
      $('script, style, nav, header, footer, aside, .sidebar, .menu, .navigation').remove();
      content = cleanText($('body').text());
    }

    if (content.length > 5000) {
      content = content.substring(0, 5000) + '...';
    }

    console.log(`📖 Contenu extrait: ${content.length} caractères`);

    // Extract companies
    const companies = extractCompanyData($, url);
    console.log(`🏢 Entreprises trouvées: ${companies.length}`);

    companies.forEach((company, index) => {
      console.log(`  ${index + 1}. ${company.name}${company.website ? ` - ${company.website}` : ''}`);
    });

    // Extract links
    const links = [];
    $('a[href]').slice(0, 20).each((_, element) => {
      const linkElement = $(element);
      const href = linkElement.attr('href');
      let text = cleanText(linkElement.text());
      
      if (href && text && text.length > 0 && text.length < 200) {
        const normalizedUrl = normalizeUrl(href, url);
        links.push({ text, url: normalizedUrl, href });
      }
    });

    console.log(`🔗 Liens extraits: ${links.length}`);

    return {
      success: true,
      url,
      title: cleanText(title),
      content,
      links: links.slice(0, 10), // Limit for display
      metadata: {
        description: cleanText(description),
        keywords: cleanText(keywords),
        author: cleanText(author),
        companies: companies.length > 0 ? companies : undefined
      }
    };

  } catch (error) {
    console.error(`❌ Erreur de scraping pour ${url}:`, error.message);
    
    let errorMessage = 'Failed to scrape website';
    
    if (error.code === 'ENOTFOUND') {
      errorMessage = 'Website not found or domain does not exist';
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout - website took too long to respond';
    } else if (error.response?.status === 403) {
      errorMessage = 'Access forbidden - website blocks scraping';
    } else if (error.response?.status === 404) {
      errorMessage = 'Page not found';
    } else if (error.response?.status === 429) {
      errorMessage = 'Rate limited - too many requests';
    } else if (error.response?.status && error.response.status >= 500) {
      errorMessage = 'Server error on target website';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: true,
      message: errorMessage,
      url,
      details: error.code || error.response?.status
    };
  }
}

async function runTests() {
  console.log('🧪 Test unitaire de la fonction de scraping\n');

  const testUrls = [
    'https://example.com',
    'https://httpbin.org/html',
    'https://www.mozilla.org'
  ];

  for (const url of testUrls) {
    console.log(`\n${'='.repeat(50)}`);
    const result = await testScrapeWebsite(url);
    
    if (result.success) {
      console.log('✅ Scraping réussi');
    } else {
      console.log('❌ Échec du scraping');
      console.log(`   Erreur: ${result.message}`);
      console.log(`   Détails: ${result.details}`);
    }
    console.log(`${'='.repeat(50)}`);
  }

  console.log('\n🎯 Test terminé. Si tous les tests passent, le problème vient de l\'API Next.js, pas de la logique de scraping.');
}

runTests().catch(console.error);
