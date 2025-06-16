/**
 * Test script to verify RAG provider integration
 * Run this from the browser console or as a node script
 */

// Test function to verify RAG provider selection in UI
function testRAGProviderSelection() {
  console.log('🧪 Testing RAG Provider Selection Integration');
  
  // Check if RAG providers are defined
  const ragProvidersModule = require('./lib/rag-providers');
  console.log('✅ RAG providers loaded:', ragProvidersModule.RAG_PROVIDERS.length);
  
  // Check each provider
  ragProvidersModule.RAG_PROVIDERS.forEach(provider => {
    console.log(`📡 Provider: ${provider.name} (${provider.id})`);
    console.log(`   - Requires API Key: ${provider.requiresApiKey}`);
    console.log(`   - Priority: ${provider.priority}`);
    console.log(`   - Description: ${provider.description}`);
  });
  
  return true;
}

// Test function to verify localStorage integration
function testLocalStorageIntegration() {
  console.log('🧪 Testing localStorage Integration');
  
  // Test setting and getting RAG provider
  const testProvider = 'google-cse';
  localStorage.setItem('tetika-rag-provider', testProvider);
  const retrievedProvider = localStorage.getItem('tetika-rag-provider');
  
  console.log(`✅ Set provider: ${testProvider}, Retrieved: ${retrievedProvider}`);
  
  // Test setting API keys
  const testApiKey = 'test-api-key-123';
  localStorage.setItem('tetika-rag-google-cse-key', testApiKey);
  const retrievedKey = localStorage.getItem('tetika-rag-google-cse-key');
  
  console.log(`✅ Set API key: ${testApiKey}, Retrieved: ${retrievedKey}`);
  
  // Clean up
  localStorage.removeItem('tetika-rag-provider');
  localStorage.removeItem('tetika-rag-google-cse-key');
  
  return retrievedProvider === testProvider && retrievedKey === testApiKey;
}

// Test function to check MCP API endpoint
async function testMCPEndpoint() {
  console.log('🧪 Testing MCP API Endpoint');
  
  try {
    const response = await fetch('/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'multi_search',
        args: {
          provider: 'searxng',
          query: 'test query',
          apiKeys: {}
        }
      })
    });
    
    const result = await response.json();
    console.log('✅ MCP API Response:', result);
    
    return result.success === true;
  } catch (error) {
    console.error('❌ MCP API Error:', error);
    return false;
  }
}

// Test function to check enhanced RAG helper
async function testEnhancedRAGHelper() {
  console.log('🧪 Testing Enhanced RAG Helper');
  
  try {
    const { enhanceWithMultiProviderRAG } = require('./lib/enhanced-rag-helper');
    
    const result = await enhanceWithMultiProviderRAG(
      'What is artificial intelligence?',
      'searxng',
      {}
    );
    
    console.log('✅ Enhanced RAG Result:', result);
    
    return result && (result.contextText || result.sources);
  } catch (error) {
    console.error('❌ Enhanced RAG Error:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting RAG Provider Integration Tests\n');
  
  const results = {
    providerSelection: testRAGProviderSelection(),
    localStorage: testLocalStorageIntegration(),
    mcpEndpoint: await testMCPEndpoint(),
    enhancedRAG: await testEnhancedRAGHelper()
  };
  
  console.log('\n📊 Test Results:');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const allPassed = Object.values(results).every(result => result === true);
  console.log(`\n${allPassed ? '🎉' : '⚠️'} Overall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  return results;
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testRAGProviderSelection,
    testLocalStorageIntegration,
    testMCPEndpoint,
    testEnhancedRAGHelper,
    runAllTests
  };
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  console.log('RAG Provider Integration Test Suite Loaded');
  console.log('Run runAllTests() to start testing');
}
