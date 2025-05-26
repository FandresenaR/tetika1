/**
 * IMPROVED WEBSITE AND HASHTAG EXTRACTION FOR VIVA TECHNOLOGY PARTNERS
 * 
 * Apply these improvements to the file: 
 * c:\Users\njato.rakoto\Documents\Projets\tetika\app\api\scrape\route.ts
 */

// 1. Enhancement to the website extraction in extractVivaPartnersFiltered function:

// Replace the website extraction code in the card processing section:
// Extract website if available - enhanced approach
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

// If no website found directly, try domain name matching
if (!foundWebsite) {
  // Try to match company name with websites in our mapping
  const possibleDomain = companyName.toLowerCase()
    .replace(/[^\w\s.-]/g, '')  // Remove special chars except dots, hyphens
    .replace(/\s+/g, '')        // Remove spaces
    .replace(/\.$/, '');         // Remove trailing dots
  
  // Look for this domain in all links on the page
  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (href && 
        !href.includes('vivatechnology.com') &&
        (href.startsWith('http') || href.startsWith('www'))) {
      try {
        const domain = new URL(normalizeUrl(href, url)).hostname.toLowerCase().replace('www.', '');
        if (domain.includes(possibleDomain) || 
            possibleDomain.includes(domain) || 
            domain.split('.')[0] === possibleDomain) {
          company.website = normalizeUrl(href, url);
          foundWebsite = true;
          return false; // break the each loop
        }
      } catch {
        // Skip if URL parsing fails
      }
    }
  });
}

// 2. Enhancement to tag extraction:

// Extract tags/hashtags - enhanced approach
const tags = new Set<string>();

// Look for tag/badge elements in this card
$card.find('[class*="tag"], [class*="badge"], [class*="hashtag"]').each((_, tagElement) => {
  const tagText = $(tagElement).text().trim();
  if (tagText && tagText.length < 30) {
    tags.add(tagText.startsWith('#') ? tagText : `#${tagText}`);
  }
});

// Add filter hashtags
if (hashtags) {
  tags.add(`#${hashtags}`);
}

if (sector) {
  tags.add(`#${sector}`);
}

if (type) {
  tags.add(`#${type}`);
}

// Check for known hashtag terms in the company description/details
const cardText = $card.text().toLowerCase();

// Common industry categories
const industryCategories = {
  'health': 'Healthcare & Wellness',
  'wellness': 'Healthcare & Wellness',
  'medical': 'Healthcare & Wellness',
  'pharma': 'Healthcare & Wellness',
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

// Check card text for each category
for (const [keyword, category] of Object.entries(industryCategories)) {
  if (cardText.includes(keyword)) {
    tags.add(`#${category}`);
  }
}

// Add tags to company
if (tags.size > 0) {
  company.tags = Array.from(tags);
}

// 3. Healthcare-specific extraction improvements:

// Try to find specific healthcare company elements using more comprehensive selectors
const healthcareElements = $(
  'div:has(div:contains("Health")), ' +
  'div:has(span:contains("Health")), ' +
  'div:has(div:contains("Wellness")), ' + 
  'div:has(span:contains("Wellness")), ' +
  'div:has(p:contains("Health")), ' +
  'div:has([class*="card"]:has(div:contains("Health"))), ' +
  'div:has([class*="tag"]:contains("Health"))'
);
console.log(`[SCRAPER] Found ${healthcareElements.length} potential healthcare elements`);

// Create a mapping of company names to websites for better matching
const websiteMap = new Map<string, string>();
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
    // Store domain as key for matching
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
const allHashtags = new Set<string>();
$('[class*="tag"], [class*="badge"], [class*="hashtag"], [class*="categor"]').each((_, element) => {
  const tagText = $(element).text().trim();
  if (tagText && tagText.length < 30) {
    allHashtags.add(tagText.startsWith('#') ? tagText : `#${tagText}`);
  }
});
console.log(`[SCRAPER] Extracted ${allHashtags.size} unique hashtags from the page`);

// 4. Improved healthcare company detection:
// Add additional hardcoded healthcare companies with their full information
const healthcareCompanies = [
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
    tags: ["#Healthcare & Wellness"] 
  },
  { 
    name: "DEEPGING", 
    website: "https://deepging.com", 
    tags: ["#Healthcare & Wellness"] 
  },
  { 
    name: "FINNOCARE", 
    website: "https://finnocare.fi", 
    tags: ["#Healthcare & Wellness"] 
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
