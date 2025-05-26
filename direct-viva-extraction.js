// Direct extraction test for Viva Technology partners
import axios from 'axios';
import * as cheerio from 'cheerio';

async function extractVivaCompanies() {
  try {
    console.log('Testing direct extraction for Viva Technology partners...');
    
    // Fetch the page content directly
    const url = 'https://vivatechnology.com/partners';
    console.log(`Fetching content from: ${url}`);
    
    const response = await axios({
      method: 'GET',
      url: url,
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });

    console.log('Content fetched successfully');
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Find the specific grid with company names
    const grid = $('.w-full.max-w-\\[1800px\\].mx-auto.text-center.grid');
    
    if (!grid.length) {
      console.log('Grid element not found');
      return;
    }
    
    console.log('Grid element found, extracting text content...');
    const gridText = grid.text();
    
    // Parse companies from grid text
    const companies = extractCompaniesFromText(gridText);
    
    console.log(`Found ${companies.length} potential companies`);
    console.log('Sample companies:');
    companies.slice(0, 20).forEach((name, i) => {
      console.log(`${i+1}. ${name}`);
    });
    
    // Another approach: try to find distinct items in the grid
    console.log('\nAttempting to find grid items...');
    const gridItems = grid.children();
    console.log(`Found ${gridItems.length} direct child elements in the grid`);
    
    if (gridItems.length > 0 && gridItems.length < 200) {
      console.log('Analyzing grid items...');
      gridItems.slice(0, 5).each((i, el) => {
        const $el = $(el);
        console.log(`Item ${i+1}: "${$el.text().trim().substring(0, 100)}..."`);
      });
    }
    
  } catch (error) {
    console.error('Error in direct extraction:', error);
  }
}

function extractCompaniesFromText(text) {
  // Clean the text
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  // Split by potential separators
  const rawCompanies = cleanText.split(/[\s\.,:;]+/);
  
  // Filter for potential company names
  const companies = rawCompanies
    .map(name => name.trim())
    .filter(name => name.length > 2 && name.length < 30) // Reasonable company name length
    .filter(name => !/^\d+$/.test(name)) // Not just numbers
    .filter(name => !isCommonWord(name)); // Not common words
  
  return companies;
}

function isCommonWord(word) {
  const commonWords = [
    'the', 'and', 'a', 'an', 'or', 'but', 'if', 'then', 'else', 'when',
    'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further',
    'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
    'all', 'any', 'both', 'each', 'few', 'more', 'most', 'some',
    'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
    'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don',
    'should', 'now', 'home', 'about', 'contact', 'us', 'our',
    'june', 'july', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday',
    'paris', 'france', 'expo'
  ];
  
  return commonWords.includes(word.toLowerCase());
}

extractVivaCompanies();
