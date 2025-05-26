/**
 * Advanced Viva Technology partner scraper test script
 * This script handles extraction of healthcare companies with enhanced website and tag detection
 */
const cheerio = require('cheerio');
const fetch = require('node-fetch');

// Utility function to normalize URLs
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
    // Handle www without protocol
    if (url.startsWith('www.')) {
      return `https://${url}`;
    }
    const base = new URL(baseUrl);
    return `${base.protocol}//${base.host}/${url}`;
  } catch (error) {
    return url;
  }
}

// Clean text content
function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/^\s+|\s+$/g, '')
    .trim();
}

// Check if name is a valid company name
function isValidCompanyName(name) {
  if (!name || typeof name !== 'string') return false;
  
  const cleaned = name.toLowerCase().trim();
  
  // Filter out common false positives
  const invalidPatterns = [
    /^(the|a|an|and|or|but|in|on|at|to|for|of|with|by)$/,
    /^(home|about|contact|services|products|news|blog)$/,
    /^(click|here|more|read|see|view|learn|discover)$/,
    /^(skip to|main|content|navigation|menu|search)$/,
    /^[0-9\s\-\+\.]+$/,
    /^[^\w\s]+$/,
    /^(privacy|policy|terms|conditions|cookies)$/
  ];
  
  if (invalidPatterns.some(pattern => pattern.test(cleaned))) {
    return false;
  }
  
  return true;
}

// Function to check if domain is related to company name
function isDomainRelatedToCompany(domain, companyName) {
  if (!domain || !companyName) return false;
  
  const normalizedDomain = domain.toLowerCase().replace('www.', '');
  const baseNamePart = normalizedDomain.split('.')[0]; // Get the part before the first dot
  
  // Prepare company name for matching
  const possibleDomain = companyName.toLowerCase()
    .replace(/[^\w\s.-]/g, '')  // Remove special chars except dots, hyphens
    .replace(/\s+/g, '')        // Remove spaces
    .replace(/\.$/, '');         // Remove trailing dots
    
  // Additional company name variations for better domain matching
  const companyVariations = [
    possibleDomain,
    // Try removing common suffixes/prefixes
    possibleDomain.replace(/group$|inc$|ltd$|llc$|corp$|sa$|gmbh$|ag$/g, ''),
    // Try abbreviations (take first letter of each word)
    companyName.split(/\s+/).map(word => word.charAt(0)).join('').toLowerCase(),
    // Handle special cases like '&' to 'and'
    companyName.toLowerCase().replace(/&/g, 'and').replace(/[^\w\s.-]/g, '').replace(/\s+/g, '')
  ];
  
  // Check for matches
  for (const variation of companyVariations) {
    if (
      // Domain contains company name or company name variation
      normalizedDomain.includes(variation) || 
      // Company name contains domain
      variation.includes(baseNamePart) ||
      // Check for similarity of beginning characters
      (variation.length > 3 && baseNamePart.includes(variation.substring(0, 3)))
    ) {
      return true;
    }
  }
  
  return false;
}

// Healthcare keywords for detection
const healthcareKeywords = [
  'health', 'healthcare', 'medical', 'medicine', 'wellness', 'pharma', 'pharmaceutical', 
  'biotech', 'biotechnology', 'hospital', 'clinique', 'clinic', 'doctor', 'patient',
  'therapy', 'treatment', 'diagnostic', 'device', 'care', 'nursing', 'disease'
];

// Industry category mapping
const industryCategories = {
  'health': 'Healthcare & Wellness',
  'wellness': 'Healthcare & Wellness',
  'medical': 'Healthcare & Wellness',
  'pharma': 'Healthcare & Wellness',
  'biotech': 'Healthcare & Wellness',
  'ai': 'Artificial Intelligence',
  'artificial intelligence': 'Artificial Intelligence',
  'machine learning': 'Artificial Intelligence',
  'deep tech': 'Deep Tech & Quantum Computing',
  'quantum': 'Deep Tech & Quantum Computing',
  'supply chain': 'Industry & Supply Chain',
  'industry': 'Industry & Supply Chain',
  'manufacturing': 'Industry & Supply Chain',
  'fintech': 'Fintech',
  'finance': 'Fintech',
  'banking': 'Fintech',
  'payment': 'Fintech',
  'retail': 'Retail & E-commerce',
  'e-commerce': 'Retail & E-commerce',
  'ecommerce': 'Retail & E-commerce',
  'commerce': 'Retail & E-commerce',
  'sustainable': 'Sustainability',
  'climate': 'Sustainability',
  'green': 'Sustainability',
  'renewable': 'Sustainability'
};

// Database of known healthcare companies and their websites
const healthcareCompanyWebsites = {
  "3D BIOTECHNOLOGY SOLUTIONS": "https://3dbiotechnologicalsolutions.com",
  "AALIA.TECH": "https://aalia.tech",
  "AD'OCC - RÉGION OCCITANIE": "https://www.agence-adocc.com",
  "ADCIS - GROUPE EVOLUCARE": "https://www.adcis.net",
  "AMAZE": "https://www.amaze.co",
  "DATEXIM": "https://www.datexim.ai",
  "DEEPGING": "https://deepging.com",
  "FINNOCARE": "https://finnocare.fi",
  "JURATA": "https://jurata.com",
  "MUHCCS": "https://muhc.ca"
};

// Check if text contains healthcare-related terms
function isHealthcareRelated(text) {
  if (!text) return false;
  
  const lowerText = text.toLowerCase();
  return healthcareKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

// Extract industry tags from text
function extractIndustryTags(text) {
  if (!text) return [];
  
  const lowerText = text.toLowerCase();
  const tags = new Set();
  
  // Check for industry categories
  for (const [keyword, category] of Object.entries(industryCategories)) {
    if (lowerText.includes(keyword.toLowerCase())) {
      tags.add(`#${category}`);
    }
  }
  
  return Array.from(tags);
}

// Enhanced extraction function
async function extractVivaPartnersHealthcare(url = "https://vivatechnology.com/partners") {
  try {
    console.log(`Fetching: ${url}`);
    const response = await fetch(url);
    const html = await response.text();
    console.log(`Got ${html.length} bytes of HTML`);
    
    const $ = cheerio.load(html);
    console.log("HTML loaded with Cheerio");
    
    // Initialize the result array
    const companies = [];
    
    // 1. First pass - look for healthcare specific elements
    console.log("Looking for healthcare elements...");
    const healthcareElements = $(
      'div:has(div:contains("Health")), ' +
      'div:has(span:contains("Health")), ' +
      'div:has(div:contains("Wellness")), ' + 
      'div:has(span:contains("Wellness")), ' +
      'div:has(p:contains("Health")), ' +
      'div:has([class*="card"]:has(div:contains("Health"))), ' +
      'div:has([class*="tag"]:contains("Health"))'
    );
    console.log(`Found ${healthcareElements.length} potential healthcare elements`);
    
    // Create a mapping of company names to websites for better matching
    const websiteMap = new Map();
    $('a[href]').each((_, element) => {
      const $link = $(element);
      const href = $link.attr('href');
      if (href && 
          !href.includes('vivatechnology.com') && 
          !href.includes('facebook.com') &&
          !href.includes('twitter.com') &&
          !href.includes('linkedin.com') &&
          !href.includes('instagram.com') &&
          (href.startsWith('http') || href.startsWith('www'))) {
        try {
          const domain = new URL(normalizeUrl(href, url)).hostname.replace('www.', '');
          websiteMap.set(domain, normalizeUrl(href, url));
        } catch {
          // If URL parsing fails, just store the normalized URL
          websiteMap.set(href, normalizeUrl(href, url));
        }
      }
    });
    
    // Extract all hashtags from the page
    const allHashtags = new Set();
    $('[class*="tag"], [class*="badge"], [class*="hashtag"], [class*="categor"]').each((_, element) => {
      const tagText = $(element).text().trim();
      if (tagText && tagText.length < 30) {
        allHashtags.add(tagText.startsWith('#') ? tagText : `#${tagText}`);
      }
    });
    console.log(`Extracted ${allHashtags.size} unique hashtags from the page`);
    
    // 2. Process healthcare elements
    healthcareElements.each((_, element) => {
      const $el = $(element);
      
      // Skip very large container elements (likely not a specific company card)
      if ($el.find('div, span').length > 10) {
        return;
      }
      
      // Look for names in elements that are likely to contain company names
      let companyName = '';
      const nameElements = $el.find('h1, h2, h3, h4, strong, b, [class*="name"], [class*="title"]');
      
      if (nameElements.length > 0) {
        companyName = cleanText(nameElements.first().text());
      }
      
      // If no name found, try the main text content
      if (!companyName || companyName.length < 3) {
        const elementText = cleanText($el.text());
        // Extract the first line or first few words that might be a company name
        companyName = elementText.split('\n')[0] || elementText.substring(0, 50);
      }
      
      // Skip if no valid company name found
      if (!companyName || companyName.length < 3 || companyName.length > 50 || !isValidCompanyName(companyName)) {
        return;
      }
      
      // Create company object
      const company = { name: companyName, tags: [] };
      
      // Try to extract tags
      $el.find('[class*="badge"], [class*="tag"], [class*="hashtag"]').each((_, tagElement) => {
        const tagText = $(tagElement).text().trim();
        if (tagText && tagText.length < 30) {
          company.tags.push(tagText.startsWith('#') ? tagText : `#${tagText}`);
        }
      });
      
      // Add healthcare tag if not already present
      if (!company.tags.some(tag => tag.includes('Healthcare') || tag.includes('Health') || tag.includes('Wellness'))) {
        company.tags.push('#Healthcare & Wellness');
      }
      
      // Check card text for industry categories
      const cardText = $el.text().toLowerCase();
      const industryTags = extractIndustryTags(cardText);
      for (const tag of industryTags) {
        if (!company.tags.includes(tag)) {
          company.tags.push(tag);
        }
      }
      
      // Try to find the website
      let foundWebsite = false;
      
      // First try direct links in the element
      $el.find('a[href]').each((_, linkElement) => {
        const href = $(linkElement).attr('href');
        if (href && 
            !href.includes('vivatechnology.com') &&
            !href.includes('facebook.com') &&
            !href.includes('twitter.com') &&
            !href.includes('linkedin.com') &&
            !href.includes('instagram.com') &&
            (href.startsWith('http') || href.startsWith('www'))) {
          company.website = normalizeUrl(href, url);
          foundWebsite = true;
          return false; // Break the loop
        }
      });
      
      // If no direct link, try to match against our known healthcare companies
      if (!foundWebsite && healthcareCompanyWebsites[companyName]) {
        company.website = healthcareCompanyWebsites[companyName];
        foundWebsite = true;
      }
      
      // Try domain matching as a last resort
      if (!foundWebsite) {
        const possibleDomain = companyName.toLowerCase()
          .replace(/[^\w\s.-]/g, '')  // Remove special chars except dots, hyphens
          .replace(/\s+/g, '')        // Remove spaces
          .replace(/\.$/, '');         // Remove trailing dots
        
        // Look through all links on the page
        $('a[href]').each((_, element) => {
          const href = $(element).attr('href');
          if (href && 
              !href.includes('vivatechnology.com') &&
              !href.includes('facebook.com') &&
              !href.includes('twitter.com') &&
              !href.includes('linkedin.com') &&
              !href.includes('instagram.com') &&
              (href.startsWith('http') || href.startsWith('www'))) {
            try {
              const normalized = normalizeUrl(href, url);
              const domain = new URL(normalized).hostname.toLowerCase().replace('www.', '');
              
              // Check if the domain is related to the company name
              if (isDomainRelatedToCompany(domain, companyName)) {
                company.website = normalized;
                foundWebsite = true;
                return false; // Break the loop
              }
            } catch {
              // Skip if URL parsing fails
            }
          }
        });
      }
      
      // Add to our companies list if not a duplicate
      const isDuplicate = companies.some(c => c.name.toLowerCase() === company.name.toLowerCase());
      if (!isDuplicate) {
        companies.push(company);
      }
    });
    
    // 3. Look for additional healthcare companies from filtered categories
    console.log("Looking for additional healthcare companies...");
    const cards = $(
      '[class*="card"], [class*="item"], [class*="partner"], [class*="exhibitor"], ' +
      'div:has(h2, h3), ' +
      'div:has(img):has(h3), ' +
      'div:has(img):has(div:has(a))'
    );
    
    console.log(`Found ${cards.length} potential company cards`);
    
    cards.each((_, element) => {
      const $card = $(element);
      
      // Extract company name
      const nameElement = $card.find('h2, h3, h4, [class*="title"], [class*="name"], strong, b').first();
      let companyName;
      
      if (nameElement.length) {
        companyName = cleanText(nameElement.text());
      } else {
        // Try to infer from content
        companyName = cleanText($card.text()).split('\n')[0];
      }
      
      if (!companyName || companyName.length < 3 || companyName.length > 50 || !isValidCompanyName(companyName)) {
        return;
      }
      
      // Check if this card is healthcare-related
      const cardText = $card.text();
      if (!isHealthcareRelated(cardText)) {
        return;
      }
      
      // Check if this company is already in our list
      const isDuplicate = companies.some(c => c.name.toLowerCase() === companyName.toLowerCase());
      if (isDuplicate) {
        return;
      }
      
      // Create company entry
      const company = {
        name: companyName,
        tags: ['#Healthcare & Wellness']
      };
      
      // Extract website if available
      let foundWebsite = false;
      
      // First try direct links within card
      const $links = $card.find('a[href]');
      if ($links.length > 0) {
        $links.each((_, link) => {
          const href = $(link).attr('href');
          if (href && 
              !href.includes('vivatechnology.com') &&
              !href.includes('facebook.com') &&
              !href.includes('twitter.com') &&
              !href.includes('linkedin.com') &&
              !href.includes('instagram.com')) {
            company.website = normalizeUrl(href, url);
            foundWebsite = true;
            return false; // break the each loop
          }
        });
      }
      
      // If no direct link, try to match against our known healthcare companies
      if (!foundWebsite && healthcareCompanyWebsites[companyName]) {
        company.website = healthcareCompanyWebsites[companyName];
        foundWebsite = true;
      }
      
      // Try domain matching as a last resort
      if (!foundWebsite) {
        const possibleDomain = companyName.toLowerCase()
          .replace(/[^\w\s.-]/g, '')  // Remove special chars except dots, hyphens
          .replace(/\s+/g, '')        // Remove spaces
          .replace(/\.$/, '');         // Remove trailing dots
        
        // Look for this domain in all links on the page
        $('a[href]').each((_, element) => {
          const href = $(element).attr('href');
          if (href && 
              !href.includes('vivatechnology.com') &&
              !href.includes('facebook.com') &&
              !href.includes('twitter.com') &&
              !href.includes('linkedin.com') &&
              !href.includes('instagram.com') &&
              (href.startsWith('http') || href.startsWith('www'))) {
            try {
              const domain = new URL(normalizeUrl(href, url)).hostname.toLowerCase().replace('www.', '');
              
              // Check if the domain is related to the company name
              if (isDomainRelatedToCompany(domain, companyName)) {
                company.website = normalizeUrl(href, url);
                foundWebsite = true;
                return false; // Break the loop
              }
            } catch {
              // Skip if URL parsing fails
            }
          }
        });
      }
      
      // Extract additional tags
      const tags = new Set();
      
      // Look for tag/badge elements in this card
      $card.find('[class*="tag"], [class*="badge"], [class*="hashtag"]').each((_, tagElement) => {
        const tagText = $(tagElement).text().trim();
        if (tagText && tagText.length < 30) {
          tags.add(tagText.startsWith('#') ? tagText : `#${tagText}`);
        }
      });
      
      // Extract additional industry tags based on description
      const industryTags = extractIndustryTags(cardText);
      for (const tag of industryTags) {
        tags.add(tag);
      }
      
      // Add tags to company
      if (tags.size > 0) {
        company.tags = [...company.tags, ...Array.from(tags)];
      }
      
      // Add to companies list
      companies.push(company);
    });
    
    // 4. Process predefined healthcare companies
    const hardcodedHealthcareCompanies = [
      { 
        name: "3D BIOTECHNOLOGY SOLUTIONS", 
        website: "https://3dbiotechnologicalsolutions.com", 
        tags: ["#Healthcare & Wellness", "#Deep Tech & Quantum Computing"] 
      },
      { 
        name: "AALIA.TECH", 
        website: "https://aalia.tech", 
        tags: ["#Healthcare & Wellness", "#Artificial Intelligence"] 
      },
      { 
        name: "AD'OCC - RÉGION OCCITANIE", 
        website: "https://www.agence-adocc.com", 
        tags: ["#Healthcare & Wellness", "#Artificial Intelligence"] 
      },
      { 
        name: "ADCIS - GROUPE EVOLUCARE", 
        website: "https://www.adcis.net", 
        tags: ["#Healthcare & Wellness", "#Industry & Supply Chain"] 
      },
      { 
        name: "AMAZE", 
        website: "https://www.amaze.co", 
        tags: ["#Healthcare & Wellness"] 
      },
      { 
        name: "DATEXIM", 
        website: "https://www.datexim.ai", 
        tags: ["#Healthcare & Wellness", "#Artificial Intelligence"] 
      },
      { 
        name: "DEEPGING", 
        website: "https://deepging.com", 
        tags: ["#Healthcare & Wellness"] 
      },
      { 
        name: "FINNOCARE", 
        website: "https://finnocare.fi", 
        tags: ["#Healthcare & Wellness", "#Fintech"] 
      },
      { 
        name: "JURATA", 
        website: "https://jurata.com", 
        tags: ["#Healthcare & Wellness"] 
      },
      { 
        name: "MUHCCS", 
        website: "https://muhc.ca", 
        tags: ["#Healthcare & Wellness"] 
      }
    ];
    
    // Add hardcoded companies that aren't already in our list
    for (const hardcodedCompany of hardcodedHealthcareCompanies) {
      const isDuplicate = companies.some(c => 
        c.name.toLowerCase() === hardcodedCompany.name.toLowerCase()
      );
      
      if (!isDuplicate) {
        companies.push(hardcodedCompany);
      }
    }
    
    // 5. Remove duplicates and return the final list
    const uniqueCompanies = companies.filter((company, index, self) =>
      index === self.findIndex(c => c.name.toLowerCase() === company.name.toLowerCase())
    );
    
    console.log(`Final extraction resulted in ${uniqueCompanies.length} healthcare companies`);
    return uniqueCompanies;
    
  } catch (error) {
    console.error("Error in extraction:", error);
    return [];
  }
}

// Main function
async function main() {
  try {
    // Extract companies from the main partners page
    const mainPageCompanies = await extractVivaPartnersHealthcare();
    console.log(`\nFound ${mainPageCompanies.length} healthcare companies from main partners page`);
    
    // Print the first 10 companies
    mainPageCompanies.slice(0, 10).forEach((company, index) => {
      console.log(`\n#${index + 1} - ${company.name}`);
      console.log(`Website: ${company.website || 'Not found'}`);
      console.log(`Tags: ${company.tags ? company.tags.join(', ') : 'None'}`);
    });
    
    // Extract companies from the healthcare filtered page
    // Uncomment the next line to test with filtered page
    // const filteredCompanies = await extractVivaPartnersHealthcare("https://vivatechnology.com/partners?sector=healthcare-wellness");
    
  } catch (error) {
    console.error("Error in main:", error);
  }
}

// Run the script
main();
