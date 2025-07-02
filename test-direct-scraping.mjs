#!/usr/bin/env node

/**
 * Direct test of the VivaTechnology scraping logic
 */

import puppeteer from 'puppeteer';

const TEST_URL = 'https://vivatechnology.com/partners?hashtags=healthcare%2520%2526%2520wellness';

async function extractVivaTechnologyData(page) {
  console.log('🔍 Starting VivaTechnology extraction...');
  
  try {
    // Wait for the page to load and companies to appear
    await page.waitForSelector('div[data-testid="company-card"], .company-card, [class*="company"], [class*="partner"], .card, .grid-item', {
      timeout: 15000,
      visible: true
    });

    // Scroll to load all content
    console.log('📜 Scrolling to load all content...');
    await page.evaluate(async () => {
      const scrollDelay = 1000;
      const maxScrolls = 5;
      
      for (let i = 0; i < maxScrolls; i++) {
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise(resolve => setTimeout(resolve, scrollDelay));
      }
      
      // Scroll back to top
      window.scrollTo(0, 0);
      await new Promise(resolve => setTimeout(resolve, 500));
    });

    // Wait a bit more for any lazy-loaded content
    await page.waitForTimeout(2000);

    // Extract company data
    const companies = await page.evaluate(() => {
      const results = [];
      
      // Multiple selector strategies for company cards
      const selectors = [
        'div[data-testid="company-card"]',
        '.company-card',
        '[class*="company"]',
        '[class*="partner"]',
        '.card',
        '.grid-item',
        'article',
        '[class*="item"]'
      ];
      
      let elements = [];
      
      for (const selector of selectors) {
        elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          console.log(`Found ${elements.length} elements with selector: ${selector}`);
          break;
        }
      }
      
      if (elements.length === 0) {
        // Fallback: look for any clickable elements that might be companies
        elements = document.querySelectorAll('a[href*="company"], a[href*="partner"], div[onclick], [class*="clickable"]');
      }
      
      elements.forEach((element, index) => {
        try {
          // Extract company name
          let name = '';
          const nameSelectors = ['h1', 'h2', 'h3', 'h4', '.title', '.name', '[class*="title"]', '[class*="name"]'];
          
          for (const selector of nameSelectors) {
            const nameEl = element.querySelector(selector);
            if (nameEl && nameEl.textContent.trim()) {
              name = nameEl.textContent.trim();
              break;
            }
          }
          
          // If no name found in child elements, use element's own text
          if (!name) {
            name = element.textContent?.trim().split('\n')[0] || `Company ${index + 1}`;
          }
          
          // Extract website link
          let website = '';
          const linkEl = element.querySelector('a[href]') || (element.tagName === 'A' ? element : null);
          if (linkEl) {
            website = linkEl.href;
          }
          
          // Extract employee count (look for numbers)
          let employeeCount = '';
          const text = element.textContent || '';
          const employeeMatch = text.match(/(\d+)\s*(employees?|people|staff|team)/i);
          if (employeeMatch) {
            employeeCount = employeeMatch[1];
          }
          
          // Look for size indicators
          const sizeMatch = text.match(/(startup|small|medium|large|enterprise|\d+-\d+|\d+\+)/i);
          if (sizeMatch && !employeeCount) {
            employeeCount = sizeMatch[1];
          }
          
          if (name && name.length > 3) { // Filter out very short names
            results.push({
              name: name.substring(0, 200), // Limit length
              website: website || 'Not available',
              employeeCount: employeeCount || 'Not available',
              elementType: element.tagName,
              hasLink: !!linkEl
            });
          }
        } catch (error) {
          console.error('Error extracting company data:', error);
        }
      });
      
      return results;
    });

    console.log(`✅ Extracted ${companies.length} companies`);
    return companies;
    
  } catch (error) {
    console.error('❌ Extraction failed:', error);
    return [];
  }
}

async function testDirectScraping() {
  let browser;
  
  try {
    console.log('🚀 Launching browser for direct test...');
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor'
      ],
      defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log(`🌐 Navigating to: ${TEST_URL}`);
    await page.goto(TEST_URL, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(3000);
    
    // Extract data
    const companies = await extractVivaTechnologyData(page);
    
    console.log('\n📊 RESULTS:');
    console.log('='.repeat(50));
    
    if (companies.length === 0) {
      console.log('❌ No companies found. The page structure may have changed.');
      
      // Debug: show page structure
      const pageInfo = await page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          bodyText: document.body.textContent.substring(0, 500),
          elementCount: document.querySelectorAll('*').length,
          divCount: document.querySelectorAll('div').length,
          linkCount: document.querySelectorAll('a').length
        };
      });
      
      console.log('📋 Page Debug Info:', JSON.stringify(pageInfo, null, 2));
    } else {
      companies.forEach((company, index) => {
        console.log(`\n${index + 1}. ${company.name}`);
        console.log(`   Website: ${company.website}`);
        console.log(`   Employee Count: ${company.employeeCount}`);
        console.log(`   Element: ${company.elementType}, Has Link: ${company.hasLink}`);
      });
    }
    
    return companies;
    
  } catch (error) {
    console.error('❌ Direct scraping test failed:', error);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function main() {
  console.log('🧪 Starting direct VivaTechnology scraping test...\n');
  
  const results = await testDirectScraping();
  
  console.log('\n' + '='.repeat(50));
  console.log('📈 SUMMARY:');
  console.log(`Total companies extracted: ${results.length}`);
  
  if (results.length > 0) {
    const withWebsites = results.filter(c => c.website !== 'Not available').length;
    const withEmployeeCounts = results.filter(c => c.employeeCount !== 'Not available').length;
    
    console.log(`Companies with websites: ${withWebsites}`);
    console.log(`Companies with employee counts: ${withEmployeeCounts}`);
    console.log('✅ Test completed successfully');
  } else {
    console.log('❌ No data extracted - investigation needed');
  }
}

main().catch(console.error);
