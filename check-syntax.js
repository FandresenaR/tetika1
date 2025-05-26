// Simple script to check for syntax errors in the specified file
import fs from 'fs';
import path from 'path';

// Get the file path from command line arguments
const filePath = process.argv[2];

if (!filePath) {
  console.error('Please provide a file path as an argument');
  process.exit(1);
}

// Read the file content
try {
  const content = fs.readFileSync(path.resolve(filePath), 'utf8');
  console.log(`Successfully read file: ${filePath}`);
  
  // Try to parse the file as JavaScript
  try {
    // Use Function constructor as a simple way to check syntax
    // This won't execute the code, just check its syntax
    new Function(content);
    console.log('✅ No syntax errors detected.');
  } catch (syntaxError) {
    console.error('❌ Syntax error detected:');
    console.error(syntaxError.message);
    
    // Try to provide line number information
    const match = syntaxError.message.match(/line\s+(\d+)/i);
    if (match && match[1]) {
      const lineNumber = parseInt(match[1]);
      console.log(`\nContext around line ${lineNumber}:`);
      
      // Show a few lines before and after the error
      const lines = content.split('\n');
      const startLine = Math.max(0, lineNumber - 5);
      const endLine = Math.min(lines.length, lineNumber + 5);
      
      for (let i = startLine; i < endLine; i++) {
        const marker = i === lineNumber - 1 ? '>>> ' : '    ';
        console.log(`${marker}${i + 1}: ${lines[i]}`);
      }
    }
  }
} catch (fileError) {
  console.error(`Error reading file: ${fileError.message}`);
  process.exit(1);
}
