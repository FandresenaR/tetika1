#!/usr/bin/env node

/**
 * Test scraping with a simpler site first to verify the system works
 */

import puppeteer from 'puppeteer';

async function testBasicScraping() {
  let browser;
  
  try {
    console.log('🚀 Testing basic scraping functionality...');
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080'
      ]
    });

    const page = await browser.newPage();
    
    // Test with a simple page first
    console.log('🌐 Testing with a simple page (example.com)...');
    await page.goto('https://example.com', { 
      waitUntil: 'networkidle2', 
      timeout: 10000 
    });
    
    const title = await page.title();
    console.log(`✅ Successfully loaded: ${title}`);
    
    // Test with a more complex site
    console.log('🌐 Testing with a more complex site (httpbin.org)...');
    await page.goto('https://httpbin.org/html', { 
      waitUntil: 'networkidle2', 
      timeout: 10000 
    });
    
    const content = await page.evaluate(() => document.body.textContent);
    console.log(`✅ Successfully loaded httpbin, content length: ${content.length}`);
    
    console.log('✅ Basic scraping test passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Basic scraping test failed:', error.message);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function testVivaTechAlternatives() {
  let browser;
  
  try {
    console.log('🚀 Testing alternative VivaTech approaches...');
    
    browser = await puppeteer.launch({
      headless: false, // Run in visible mode to see what happens
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    const page = await browser.newPage();
    
    // Set a realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Try the main VivaTech page first
    console.log('🌐 Testing main VivaTech page...');
    try {
      await page.goto('https://vivatechnology.com/', { 
        waitUntil: 'domcontentloaded', 
        timeout: 15000 
      });
      
      const title = await page.title();
      console.log(`✅ Main page loaded: ${title}`);
      
      // Now try the partners page
      console.log('🌐 Testing partners page...');
      await page.goto('https://vivatechnology.com/partners', { 
        waitUntil: 'domcontentloaded', 
        timeout: 15000 
      });
      
      const partnersTitle = await page.title();
      console.log(`✅ Partners page loaded: ${partnersTitle}`);
      
      // Wait for content to load
      await page.waitForTimeout(5000);
      
      // Check what we can see
      const pageInfo = await page.evaluate(() => {
        const text = document.body.textContent;
        return {
          title: document.title,
          textLength: text.length,
          hasCompanies: text.toLowerCase().includes('company') || text.toLowerCase().includes('partner'),
          elementCount: document.querySelectorAll('*').length,
          divCount: document.querySelectorAll('div').length,
          linkCount: document.querySelectorAll('a').length
        };
      });
      
      console.log('📋 Partners page info:', JSON.stringify(pageInfo, null, 2));
      
      return true;
      
    } catch (navError) {
      console.error('❌ Navigation failed:', navError.message);
      return false;
    }
    
  } catch (error) {
    console.error('❌ VivaTech test failed:', error.message);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function main() {
  console.log('🧪 Starting comprehensive scraping tests...\n');
  
  // Test 1: Basic functionality
  const basicTest = await testBasicScraping();
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: VivaTech alternatives
  if (basicTest) {
    console.log('Basic test passed, trying VivaTech...');
    const vivaTechTest = await testVivaTechAlternatives();
    
    console.log('\n' + '='.repeat(50));
    console.log('📈 FINAL RESULTS:');
    console.log(`Basic scraping: ${basicTest ? '✅ Pass' : '❌ Fail'}`);
    console.log(`VivaTech access: ${vivaTechTest ? '✅ Pass' : '❌ Fail'}`);
    
    if (!vivaTechTest) {
      console.log('\n💡 RECOMMENDATIONS:');
      console.log('1. The VivaTech site may have anti-bot protection');
      console.log('2. Consider using a proxy or different browser configuration');
      console.log('3. The site might require JavaScript execution time');
      console.log('4. Rate limiting might be in effect');
    }
  } else {
    console.log('❌ Basic test failed - check internet connection and Puppeteer setup');
  }
}

main().catch(console.error);
