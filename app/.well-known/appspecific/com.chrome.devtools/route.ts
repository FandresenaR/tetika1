import { NextResponse } from 'next/server';

// This file responds to Chrome DevTools requests for enhanced debugging capabilities
export async function GET() {
  // Return a configuration object with debugging capabilities
  return NextResponse.json({
    // Version of the protocol
    version: 1,
    
    // Identify the application
    id: "tetika-ai-app",
    
    // Human-readable name
    name: "TETIKA AI Chat Application",
    
    // Application capabilities
    capabilities: {
      // Enable network inspection with custom categories
      network: {
        conditions: true,
        blockURLs: true,
        customRequestHeaders: true
      },
      
      // Storage inspection (localStorage, sessionStorage, etc.)
      storage: true,
      
      // DOM debugging
      dom: {
        // Enable DOM mutation breakpoints
        mutationBreakpoints: true,
        // Highlight in DOM tree when hovering in page
        highlightOnHover: true
      },
      
      // JavaScript debugging
      js: {
        // Support breaking when exceptions are thrown
        breakOnExceptions: true
      },
      
      // Custom panels (if you want to add them in the future)
      panels: []
    }
  }, { 
    status: 200,
    headers: {
      'Cache-Control': 'max-age=3600',
      'Content-Type': 'application/json'
    }
  });
}