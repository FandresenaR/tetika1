// Test script to verify the RAG provider integration works
// This can be run from Node.js to test the backend functionality

async function testRAGProvider() {
  try {
    console.log('🧪 Testing RAG Provider Integration...');
    
    // Import the enhanced RAG helper
    const { enhanceWithMultiProviderRAG } = await import('./lib/enhanced-rag-helper.js');
    
    // Test with SearXNG (no API key required)
    console.log('\n📡 Testing SearXNG provider...');
    const result = await enhanceWithMultiProviderRAG(
      'What is artificial intelligence?',
      'searxng',
      {}
    );
    
    console.log('✅ SearXNG Result:', {
      hasContext: !!result.contextText,
      contextLength: result.contextText.length,
      sourcesCount: result.sources.length,
      sources: result.sources.map(s => ({ title: s.title, position: s.position }))
    });
    
    return result;
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Export for use
export { testRAGProvider };

// Auto-run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testRAGProvider()
    .then(result => {
      console.log('\n🎉 Test completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}
