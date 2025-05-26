import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

interface ScrapedData {
  url: string;
  title: string;
  content: string;
  links?: Array<{
    text: string;
    url: string;
    href: string;
  }>;
  images?: Array<{
    src: string;
    alt: string;
  }>;
  metadata?: {
    description?: string;
    keywords?: string;
    author?: string;
    companies?: Array<{
      name: string;
      website?: string;
      description?: string;
      employees?: string;
      tags?: string[];
    }>;
  };
}

interface ScrapingError {
  error: true;
  message: string;
  url: string;
  details?: unknown;
}

// Helper function to normalize URLs
function normalizeUrl(url: string, baseUrl: string): string {
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

// Helper function to clean text content
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
}

// Helper function to extract structured company data
function extractCompanyData($: cheerio.CheerioAPI, url: string): Array<{
  name: string;
  website?: string;
  description?: string;
  employees?: string;
  tags?: string[];
}> {
  const companies: Array<{
    name: string;
    website?: string;
    description?: string;
    employees?: string;
    tags?: string[];
  }> = [];
  
  // Look for company/partner cards or listings
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
      
      // Extract company name
      let name = '';
      const nameSelectors = ['h1', 'h2', 'h3', 'h4', '.name', '.title', '.company-name', '[class*="name"]'];
      for (const nameSelector of nameSelectors) {
        const nameEl = $el.find(nameSelector).first();
        if (nameEl.length && nameEl.text().trim()) {
          name = cleanText(nameEl.text());
          break;
        }
      }
      
      // If no name found, try the element text directly
      if (!name) {
        const elementText = cleanText($el.text());
        if (elementText && elementText.length < 100) {
          name = elementText.split('\n')[0] || elementText.split(' ').slice(0, 4).join(' ');
        }
      }
      
      if (name && name.length > 2 && name.length < 200) {
        const company: {
          name: string;
          website?: string;
          description?: string;
          employees?: string;
          tags?: string[];
        } = { name };
        
        // Extract website
        const linkEl = $el.find('a[href]').first();
        if (linkEl.length) {
          const href = linkEl.attr('href');
          if (href && (href.startsWith('http') || href.startsWith('www'))) {
            company.website = normalizeUrl(href, url);
          }
        }
        
        // Extract description
        const descSelectors = ['.description', '.bio', '.about', 'p', '.summary'];
        for (const descSelector of descSelectors) {
          const descEl = $el.find(descSelector).first();
          if (descEl.length && descEl.text().trim() && descEl.text().trim() !== name) {
            company.description = cleanText(descEl.text()).substring(0, 300);
            break;
          }
        }
        
        // Extract employee count or company size
        const fullText = $el.text().toLowerCase();
        const employeePatterns = [
          /(\d+[\-\+]?)\s*(?:employees?|salariés?|personnes?)/gi,
          /(?:employees?|salariés?)[\s:]*(\d+[\-\+]?)/gi,
          /(\d+[\-\+]?)\s*(?:people|pers\.?)/gi
        ];
        
        for (const pattern of employeePatterns) {
          const match = fullText.match(pattern);
          if (match) {
            company.employees = match[0];
            break;
          }
        }
        
        // Extract tags/hashtags
        const tags: string[] = [];
        const hashtagMatches = $el.text().match(/#[\w\-]+/g);
        if (hashtagMatches) {
          tags.push(...hashtagMatches);
        }
        
        // Look for category or industry information
        const categorySelectors = ['.category', '.industry', '.sector', '.tags', '.keywords'];
        categorySelectors.forEach(catSelector => {
          const catEl = $el.find(catSelector);
          if (catEl.length) {
            const catText = cleanText(catEl.text());
            if (catText && !tags.includes(catText)) {
              tags.push(catText);
            }
          }
        });
        
        if (tags.length > 0) {
          company.tags = tags.slice(0, 10); // Limit to 10 tags
        }
        
        companies.push(company);
      }
    });
  });
  
  // Remove duplicates based on name
  const uniqueCompanies = companies.filter((company, index, self) => 
    index === self.findIndex(c => c.name.toLowerCase() === company.name.toLowerCase())
  );
  
  return uniqueCompanies.slice(0, 50); // Limit to 50 companies
}

// Main scraping function
async function scrapeWebsite(url: string): Promise<ScrapedData | ScrapingError> {
  try {
    console.log(`[SCRAPER] Starting to scrape: ${url}`);
    
    // Validate URL format
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Only HTTP and HTTPS URLs are supported');
    }

    // Make the request with proper headers to mimic a real browser
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

    const html = response.data;
    const $ = cheerio.load(html);

    // Extract basic information
    const title = $('title').text().trim() || $('h1').first().text().trim() || 'No title found';
    
    // Extract metadata
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || '';
    const keywords = $('meta[name="keywords"]').attr('content') || '';
    const author = $('meta[name="author"]').attr('content') || '';    // Extract main content - try multiple strategies with focus on business data
    let content = '';
    
    // Strategy 1: Look for main content areas
    const contentSelectors = [
      'main',
      'article',
      '.content',
      '#content',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.partners',
      '.partner-list',
      '.companies',
      '.company-list',
      '.exhibitors',
      '.startups',
      '.sponsors',
      '.members',
      'body'
    ];

    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim().length > 100) {
        content = cleanText(element.text());
        break;
      }
    }

    // Strategy 2: If no main content found, extract all text
    if (!content || content.length < 100) {
      // Remove script and style elements
      $('script, style, nav, header, footer, aside, .sidebar, .menu, .navigation').remove();
      content = cleanText($('body').text());
    }

    // Limit content length
    if (content.length > 5000) {
      content = content.substring(0, 5000) + '...';
    }    // Extract links with enhanced business data extraction
    const links: Array<{ text: string; url: string; href: string }> = [];
    $('a[href]').each((_, element) => {
      const linkElement = $(element);
      const href = linkElement.attr('href');
      let text = cleanText(linkElement.text());
      
      // If link text is empty, try to get it from parent elements or attributes
      if (!text || text.length === 0) {
        text = cleanText(linkElement.attr('title') || linkElement.attr('alt') || linkElement.find('img').attr('alt') || '');
      }
      
      // Look for company names in nearby elements if link text is still minimal
      if (!text || text.length < 3) {
        const parentText = cleanText(linkElement.parent().text());
        const nextText = cleanText(linkElement.next().text());
        const prevText = cleanText(linkElement.prev().text());
        
        // Use the shortest meaningful text
        [parentText, nextText, prevText].forEach(candidateText => {
          if (candidateText && candidateText.length > 2 && candidateText.length < 100 && !text) {
            text = candidateText;
          }
        });
      }
      
      if (href && text && text.length > 0 && text.length < 200) {
        const normalizedUrl = normalizeUrl(href, url);
        links.push({
          text: text,
          url: normalizedUrl,
          href: href
        });
      }
    });

    // Extract images
    const images: Array<{ src: string; alt: string }> = [];
    $('img[src]').each((_, element) => {
      const imgElement = $(element);
      const src = imgElement.attr('src');
      const alt = imgElement.attr('alt') || '';
      
      if (src) {
        const normalizedSrc = normalizeUrl(src, url);
        images.push({
          src: normalizedSrc,
          alt: cleanText(alt)
        });
      }
    });    // Limit arrays to reasonable sizes
    const limitedLinks = links.slice(0, 50);
    const limitedImages = images.slice(0, 20);

    // Extract structured company data
    const companies = extractCompanyData($, url);

    console.log(`[SCRAPER] Successfully scraped ${url}: ${content.length} chars, ${limitedLinks.length} links, ${limitedImages.length} images, ${companies.length} companies`);

    return {
      url,
      title: cleanText(title),
      content,
      links: limitedLinks,
      images: limitedImages,
      metadata: {
        description: cleanText(description),
        keywords: cleanText(keywords),
        author: cleanText(author),
        companies: companies.length > 0 ? companies : undefined
      }
    };

  } catch (error: unknown) {
    console.error(`[SCRAPER] Error scraping ${url}:`, error);
    
    const err = error as Error & { code?: string; response?: { status?: number } };
    let errorMessage = 'Failed to scrape website';
    
    if (err.code === 'ENOTFOUND') {
      errorMessage = 'Website not found or domain does not exist';
    } else if (err.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout - website took too long to respond';
    } else if (err.response?.status === 403) {
      errorMessage = 'Access forbidden - website blocks scraping';
    } else if (err.response?.status === 404) {
      errorMessage = 'Page not found';
    } else if (err.response?.status === 429) {
      errorMessage = 'Rate limited - too many requests';
    } else if (err.response?.status && err.response.status >= 500) {
      errorMessage = 'Server error on target website';
    } else if (err.message) {
      errorMessage = err.message;
    }

    return {
      error: true,
      message: errorMessage,
      url,
      details: process.env.NODE_ENV === 'development' ? error : undefined
    };
  }
}

// API endpoint
export async function POST(request: NextRequest) {
  try {
    const { url, prompt, mode } = await request.json();

    if (!url) {
      return NextResponse.json({
        error: true,
        message: 'URL is required'
      }, { status: 400 });
    }

    console.log(`[SCRAPER] API request received for URL: ${url}`);
    console.log(`[SCRAPER] User prompt: ${prompt || 'No specific prompt'}`);
    console.log(`[SCRAPER] Mode: ${mode || 'default'}`);

    // Scrape the website
    const result = await scrapeWebsite(url);

    if ('error' in result) {
      return NextResponse.json(result, { status: 400 });
    }    // If user provided a prompt, we can use AI to analyze the scraped content
    // For now, we'll just return the raw scraped data
    return NextResponse.json({
      success: true,
      data: result,
      prompt: prompt || null,
      mode: mode || 'default',
      scrapedAt: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error('[SCRAPER] API Error:', error);
    
    const err = error as Error;
    return NextResponse.json({
      error: true,
      message: err.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}

// GET endpoint for simple URL scraping
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({
        error: true,
        message: 'URL parameter is required'
      }, { status: 400 });
    }

    const result = await scrapeWebsite(url);

    if ('error' in result) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result,
      scrapedAt: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error('[SCRAPER] GET API Error:', error);
    
    const err = error as Error;
    return NextResponse.json({
      error: true,
      message: err.message || 'Internal server error'
    }, { status: 500 });
  }
}
