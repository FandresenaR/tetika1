#!/usr/bin/env node

import fetch from 'node-fetch';

async function testServerStatus() {
    try {
        console.log('🔍 Testing server connectivity...');
        const response = await fetch('http://localhost:3000/api/health', {
            method: 'GET',
            timeout: 5000
        });
        
        console.log(`Server Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.text();
            console.log('Response:', data);
        }
    } catch (error) {
        console.error('❌ Server connection failed:', error.message);
        console.log('💡 The server may not be running. Please start it with: npm run dev');
    }
}

testServerStatus();
