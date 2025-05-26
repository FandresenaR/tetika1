import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import { execPython } from '@/lib/python-executor';

export const dynamic = 'force-dynamic'; // Don't cache this route

/**
 * Web scraping API endpoint
 * @param request - The incoming request with URL to scrape
 * @returns A JSON response with scraped data and structure analysis
 */
export async function POST(request: NextRequest) {
  try {
    const { url, customScript } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // If custom Python script is provided, execute it
    if (customScript) {
      try {
        const result = await execPython(customScript, { url });
        return NextResponse.json({
          success: true,
          data: result.data,
          structure: result.structure || {},
          executionInfo: result.executionInfo || {},
        });
      } catch (error: any) {
        console.error('Python execution error:', error);
        return NextResponse.json({ 
          error: 'Python execution failed', 
          details: error.message 
        }, { status: 500 });
      }
    }    // Default scraping logic if no custom script - use our enhanced Python scraper
    console.log(`[API] Enhanced Web Scraper - Analyzing URL: ${url}`);
    
    // Use our enhanced Python scraper that leverages AI-driven pattern recognition
    try {
      // Default Python script with enhanced capabilities
      const defaultScript = `
# Enhanced web scraper with AI-driven pattern recognition
url = variables["url"]
html = fetch_url(url)
soup = parse_html(html)

# Extract comprehensive data
tables = extract_tables(soup)
lists = extract_lists(soup)
images = extract_images(soup, url)
data_patterns = detect_data_patterns(soup, html)
structure = detect_data_structure(soup, url)
site_analysis = analyze_site_structure(soup, url)

# AI-driven content insights
content_insights = {
    'main_topic': structure['title'],
    'primary_headings': structure['headings'].get('h1', []) + structure['headings'].get('h2', []),
    'content_type': data_patterns['likely_site_type'],
    'has_data_structures': len(tables) > 0,
    'data_types': [pattern.replace('has_', '') for pattern, exists in data_patterns.items() if exists and pattern.startswith('has_')],
    'key_sections': [block['heading'] for block in structure['content_blocks'] if block.get('heading')]
}

result = {
    'data': {
        'tables': tables,
        'lists': lists,
        'images': images
    },
    'structure': structure,
    'patterns': data_patterns,
    'analysis': site_analysis,
    'insights': content_insights,
    'url': url,
    'title': structure['title']
}
`;
      
      const pythonResult = await execPython(defaultScript, { url });
      
      if (!pythonResult.success) {
        throw new Error(pythonResult.error?.message || 'Python scraping failed');
      }

      // Return the enhanced scraped data
      return NextResponse.json({
        success: true,
        url,
        title: pythonResult.structure?.title || url,
        data: pythonResult.data,
        structure: pythonResult.structure,
        patterns: pythonResult.patterns,
        analysis: pythonResult.analysis,
        insights: pythonResult.insights,
        executionInfo: pythonResult.executionInfo
      });
    } catch (error) {
      console.error('Python scraper failed, falling back to basic scraper:', error);
      
      // Fallback to simpler method if Python execution fails
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        }
      });

      // Parse with Cheerio
      const $ = cheerio.load(response.data);
      
      // Extract basic page structure
      const pageStructure = analyzePageStructure($);
      const tables = extractTables($);
      const lists = extractLists($);
      const links = extractLinks($);
      const textContent = $('body').text().trim().substring(0, 5000);
      const dataPatterns = detectDataPatterns(response.data);

      // Return the scraped data
      return NextResponse.json({
        success: true,
        url,
        title: $('title').text(),
        pageStructure,
        tables,
        lists,
        links,
        dataPatterns,
        textSnippet: textContent.substring(0, 200) + '...',
        fallbackMode: true
      });
    }
  } catch (error: any) {
    console.error('Web scraping error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to scrape URL',
        details: error.message
      }, 
      { status: 500 }
    );
  }
}

/**
 * Analyzes the page structure (header, content, footer, etc.)
 */
function analyzePageStructure($: cheerio.CheerioAPI) {
  // Basic structure detection
  const structure = {
    hasHeader: $('header').length > 0 || $('nav').length > 0,
    hasFooter: $('footer').length > 0,
    hasMainContent: $('main').length > 0 || $('article').length > 0,
    hasSidebar: $('aside').length > 0 || $('sidebar').length > 0,
    sections: [] as any[],
    mainContentPath: '',
  };
  
  // Try to identify main content area
  let mainContentSelector = 'main';
  if ($('main').length === 0) {
    if ($('article').length > 0) mainContentSelector = 'article';
    else if ($('.content').length > 0) mainContentSelector = '.content';
    else if ($('#content').length > 0) mainContentSelector = '#content';
  }
  
  structure.mainContentPath = mainContentSelector;
  
  // Identify major sections
  $('section, div[class*="section"], div[id*="section"]').each((i, el) => {
    const section = $(el);
    const headingText = section.find('h1, h2, h3').first().text().trim();
    if (headingText) {
      structure.sections.push({
        heading: headingText,
        id: section.attr('id') || null,
        class: section.attr('class') || null,
      });
    }
  });
  
  return structure;
}

/**
 * Extracts tables from the page
 */
function extractTables($: cheerio.CheerioAPI) {
  const tables: any[] = [];
  
  $('table').each((i, tableEl) => {
    const table = $(tableEl);
    const headers: string[] = [];
    const rows: string[][] = [];
    
    // Get table headers
    table.find('tr').first().find('th, td').each((j, headerEl) => {
      headers.push($(headerEl).text().trim());
    });
    
    // Get table rows
    table.find('tr').slice(1).each((j, rowEl) => {
      const row: string[] = [];
      $(rowEl).find('td').each((k, cellEl) => {
        row.push($(cellEl).text().trim());
      });
      if (row.length > 0) rows.push(row);
    });
    
    if (headers.length > 0 || rows.length > 0) {
      tables.push({
        id: table.attr('id') || `table-${i}`,
        headers,
        rows,
      });
    }
  });
  
  return tables;
}

/**
 * Extracts lists from the page
 */
function extractLists($: cheerio.CheerioAPI) {
  const lists: any[] = [];
  
  $('ul, ol').each((i, listEl) => {
    const list = $(listEl);
    const items: string[] = [];
    
    list.find('li').each((j, itemEl) => {
      items.push($(itemEl).text().trim());
    });
    
    if (items.length > 0) {
      lists.push({
        id: list.attr('id') || `list-${i}`,
        type: listEl.name === 'ul' ? 'unordered' : 'ordered',
        items
      });
    }
  });
  
  return lists;
}

/**
 * Extracts links from the page
 */
function extractLinks($: cheerio.CheerioAPI) {
  const links: any[] = [];
  
  $('a[href]').each((i, linkEl) => {
    const link = $(linkEl);
    const href = link.attr('href');
    const text = link.text().trim();
    
    if (href && !href.startsWith('javascript:') && href !== '#') {
      links.push({
        text: text || href,
        url: href,
      });
    }
  });
  
  return links.slice(0, 50); // Limit to 50 links
}

/**
 * Detects common data patterns on the page
 */
function detectDataPatterns(html: string) {
  const patterns = {
    hasPricing: /(\$|€)\s?\d+(\.\d{2})?|price|pricing|cost|subscription|plan/i.test(html),
    hasDatePatterns: /\d{2}\/\d{2}\/\d{4}|\d{2}\-\d{2}\-\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i.test(html),
    hasEmailPatterns: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i.test(html),
    hasProductListing: /(product|item|listing) (grid|list)/i.test(html) || /(add to cart|buy now)/i.test(html),
    hasPagination: /(pagination|pager)/i.test(html) || /(next page|previous page)/i.test(html),
    hasRatings: /(star rating|customer review|out of 5)/i.test(html),
  };
  
  return patterns;
}
