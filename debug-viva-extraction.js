// Debug script for Viva Technology partners extraction
import axios from 'axios';
import * as cheerio from 'cheerio';

async function debugVivaExtraction() {
  try {
    console.log('Debugging Viva Technology partners extraction...');
    
    // Fetch the page content directly
    const url = 'https://vivatechnology.com/partners';
    console.log(`Fetching content from: ${url}`);
    
    const response = await axios({
      method: 'GET',
      url: url,
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    console.log('Content fetched successfully');
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Extract basic page info
    const title = $('title').text().trim();
    console.log(`Page title: "${title}"`);
    
    // Debug page structure
    console.log('\nPage structure analysis:');
    const mainSelectors = [
      'main', 
      'article', 
      '.content', 
      '#content',
      '.partners',
      '.partner-list', 
      '.companies', 
      '.company-list'
    ];

    for (const selector of mainSelectors) {
      const elements = $(selector);
      console.log(`${selector}: ${elements.length} elements found`);
      if (elements.length > 0) {
        console.log(`  Sample text: "${elements.first().text().substring(0, 100).trim()}..."`);
      }
    }
    
    // Look for potential company containers
    console.log('\nSearching for potential company containers:');
    const potentialContainers = [
      '.grid', '.cards', '.items', '.list', '.partners', '.row', '.companies', 
      '[class*="partner"]', '[class*="company"]', '[class*="card"]', '[class*="item"]'
    ];
    
    for (const selector of potentialContainers) {
      const elements = $(selector);
      console.log(`${selector}: ${elements.length} elements found`);
      if (elements.length > 0 && elements.length < 50) {
        console.log(`  First few elements:`);
        elements.slice(0, 3).each((i, el) => {
          const $el = $(el);
          console.log(`    Element ${i+1}: ${$el.attr('class') || 'no class'}`);
          console.log(`      Text: "${$el.text().substring(0, 100).trim()}..."`);
          // Check for links within this container
          const links = $el.find('a');
          console.log(`      Links: ${links.length}`);
          links.slice(0, 2).each((j, link) => {
            const $link = $(link);
            console.log(`        Link ${j+1}: Text="${$link.text().trim()}" Href="${$link.attr('href')}"`);
          });
        });
      }
    }
    
    // Extract all links and analyze for potential company data
    console.log('\nAnalyzing links for company data:');
    const allLinks = $('a[href]');
    console.log(`Total links found: ${allLinks.length}`);
    
    // Filter links that might be company websites
    let potentialCompanyLinks = 0;
    const companyLinkTexts = [];
    
    allLinks.each((i, el) => {
      const $link = $(el);
      const href = $link.attr('href') || '';
      const text = $link.text().trim();
      
      // Skip empty or very short texts
      if (!text || text.length < 3) return;
      
      // Skip navigation/common website elements
      const skipWords = ['home', 'about', 'contact', 'login', 'register', 'terms', 'privacy'];
      if (skipWords.some(word => text.toLowerCase().includes(word))) return;
      
      // Check if this looks like it could be a company name & external link
      if (
        text.length > 2 && 
        text.length < 50 && 
        !href.includes('vivatechnology.com') &&
        (href.startsWith('http') || href.startsWith('www'))
      ) {
        potentialCompanyLinks++;
        if (companyLinkTexts.length < 10) {
          companyLinkTexts.push(`"${text}" -> ${href}`);
        }
      }
    });
    
    console.log(`Potential company links found: ${potentialCompanyLinks}`);
    console.log('Sample company links:');
    companyLinkTexts.forEach((text, i) => console.log(`  ${i+1}. ${text}`));
    
  } catch (error) {
    console.error('Error debugging Viva extraction:', error);
  }
}

debugVivaExtraction();
