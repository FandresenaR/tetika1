#!/usr/bin/env node
/**
 * Test URL encoding fix for VivaTech navigation
 */

// Test the URL encoding issue
const testUrl = "https://vivatechnology.com/innovation/startup/bedr%20-%20sustainable%20outdoor%20architecture/";
console.log("Original URL:", testUrl);

// Test current logic
let validUrl = testUrl.trim();
console.log("After trim:", validUrl);

// Add protocol if missing
if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
  validUrl = `https://${validUrl}`;
}
console.log("After protocol check:", validUrl);

// Test URL validation
try {
  const urlObj = new URL(validUrl);
  console.log("URL validation passed");
  console.log("Protocol:", urlObj.protocol);
  console.log("Host:", urlObj.host);
  console.log("Pathname:", urlObj.pathname);
  console.log("Search:", urlObj.search);
} catch (error) {
  console.error("URL validation failed:", error.message);
}

// Test proper URL handling
console.log("\n--- Testing proper URL handling ---");

function fixUrlEncoding(url) {
  // Handle double encoding issue
  let fixed = url.replace(/%2520/g, '%20');
  
  // Properly encode spaces and special characters
  try {
    const urlObj = new URL(fixed);
    // Re-encode the pathname properly
    urlObj.pathname = urlObj.pathname.split('/').map(segment => 
      segment ? encodeURIComponent(decodeURIComponent(segment)) : segment
    ).join('/');
    return urlObj.toString();
  } catch (error) {
    console.error("URL fix failed:", error.message);
    return url;
  }
}

const fixedUrl = fixUrlEncoding(testUrl);
console.log("Fixed URL:", fixedUrl);

// Test with simpler URL
const simpleUrl = "https://vivatechnology.com/";
console.log("\n--- Testing simple URL ---");
console.log("Simple URL:", simpleUrl);

try {
  const urlObj = new URL(simpleUrl);
  console.log("Simple URL validation passed");
} catch (error) {
  console.error("Simple URL validation failed:", error.message);
}
