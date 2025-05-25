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
    const author = $('meta[name="author"]').attr('content') || '';

    // Extract main content - try multiple strategies
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
    }

    // Extract links
    const links: Array<{ text: string; url: string; href: string }> = [];
    $('a[href]').each((_, element) => {
      const linkElement = $(element);
      const href = linkElement.attr('href');
      const text = cleanText(linkElement.text());
      
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
    });

    // Limit arrays to reasonable sizes
    const limitedLinks = links.slice(0, 50);
    const limitedImages = images.slice(0, 20);

    console.log(`[SCRAPER] Successfully scraped ${url}: ${content.length} chars, ${limitedLinks.length} links, ${limitedImages.length} images`);

    return {
      url,
      title: cleanText(title),
      content,
      links: limitedLinks,
      images: limitedImages,
      metadata: {
        description: cleanText(description),
        keywords: cleanText(keywords),
        author: cleanText(author)
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
    const { url, prompt } = await request.json();

    if (!url) {
      return NextResponse.json({
        error: true,
        message: 'URL is required'
      }, { status: 400 });
    }

    console.log(`[SCRAPER] API request received for URL: ${url}`);
    console.log(`[SCRAPER] User prompt: ${prompt || 'No specific prompt'}`);

    // Scrape the website
    const result = await scrapeWebsite(url);

    if ('error' in result) {
      return NextResponse.json(result, { status: 400 });
    }

    // If user provided a prompt, we can use AI to analyze the scraped content
    // For now, we'll just return the raw scraped data
    return NextResponse.json({
      success: true,
      data: result,
      prompt: prompt || null,
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
