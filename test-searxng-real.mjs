// Test script for real SearXNG integration
import { multiProviderSearch } from './app/api/mcp/route.js';

async function testSearXNG() {
  try {
    console.log('🔍 Testing real SearXNG integration...\n');
    
    const testQuery = "Yas Madagascar";
    const result = await multiProviderSearch({
      provider: 'searxng',
      query: testQuery,
      apiKeys: {}
    });
    
    console.log('✅ SearXNG Search Results:');
    console.log(`Provider: ${result.provider}`);
    console.log(`Success: ${result.success}`);
    console.log(`Results count: ${result.results.length}\n`);
    
    if (result.results && result.results.length > 0) {
      result.results.forEach((result, index) => {
        console.log(`[${index + 1}] ${result.title}`);
        console.log(`    URL: ${result.url}`);
        console.log(`    Snippet: ${result.snippet.substring(0, 100)}...`);
        console.log('');
      });
    }
    
    return result;
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run test
testSearXNG()
  .then(() => {
    console.log('🎉 Real SearXNG integration test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
