#!/usr/bin/env node

/**
 * Test script for VivaTechnology scraping functionality
 */

import fetch from 'node-fetch';

const TEST_URL = 'https://vivatechnology.com/partners?hashtags=healthcare%2520%2526%2520wellness';
const API_BASE = 'http://localhost:3000';

async function testMCPScraping() {
    console.log('🧪 Testing MCP scraping for VivaTechnology...');
    
    try {
        const response = await fetch(`${API_BASE}/api/mcp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: TEST_URL,
                instructions: 'Extract all company names, their website links, and employee counts from the VivaTechnology partners page. This page loads content dynamically and may require scrolling. If needed, click on company names to get additional details like employee count.'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ MCP Response received');
        console.log('📊 Data extracted:', JSON.stringify(data, null, 2));
        
        return data;
    } catch (error) {
        console.error('❌ MCP scraping failed:', error.message);
        return null;
    }
}

async function testFallbackScraping() {
    console.log('🧪 Testing fallback scraping for VivaTechnology...');
    
    try {
        const response = await fetch(`${API_BASE}/api/scraping`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: TEST_URL,
                instructions: 'Extract all company names, their website links, and employee counts from the VivaTechnology partners page. This page loads content dynamically and may require scrolling.'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Fallback Response received');
        console.log('📊 Data extracted:', JSON.stringify(data, null, 2));
        
        return data;
    } catch (error) {
        console.error('❌ Fallback scraping failed:', error.message);
        return null;
    }
}

async function main() {
    console.log('🚀 Starting VivaTechnology scraping tests...\n');
    
    // Test MCP scraping first
    const mcpResult = await testMCPScraping();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test fallback scraping
    const fallbackResult = await testFallbackScraping();
    
    console.log('\n' + '='.repeat(50));
    console.log('📋 SUMMARY:');
    console.log(`MCP Result: ${mcpResult ? '✅ Success' : '❌ Failed'}`);
    console.log(`Fallback Result: ${fallbackResult ? '✅ Success' : '❌ Failed'}`);
    
    if (mcpResult && mcpResult.data) {
        console.log(`\n📈 MCP extracted ${Array.isArray(mcpResult.data) ? mcpResult.data.length : 'N/A'} items`);
    }
    
    if (fallbackResult && fallbackResult.data) {
        console.log(`📈 Fallback extracted ${Array.isArray(fallbackResult.data) ? fallbackResult.data.length : 'N/A'} items`);
    }
}

main().catch(console.error);
