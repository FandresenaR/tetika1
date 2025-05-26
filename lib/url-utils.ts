/**
 * Utility functions for handling URLs in chat messages
 */

/**
 * Extracts URLs from a text message
 * @param text The text to search for URLs
 * @returns Array of URLs found in the text
 */
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

/**
 * Checks if a message contains the @scrape command
 * @param message The message text to check
 * @returns An object with flag status and extracted URL
 */
export function checkForScrapeCommand(message: string): { isScrapeCommand: boolean, url: string | null } {
  // Check if message contains @scrape followed by a URL
  const scrapeRegex = /@scrape\s+(https?:\/\/[^\s]+)/i;
  const match = message.match(scrapeRegex);
  
  if (match && match[1]) {
    return {
      isScrapeCommand: true,
      url: match[1]
    };
  }
  
  return {
    isScrapeCommand: false,
    url: null
  };
}

/**
 * Removes the @scrape command from a message
 * @param message The original message text
 * @returns The message text without the @scrape command
 */
export function removeScrapeCommand(message: string): string {
  return message.replace(/@scrape\s+(https?:\/\/[^\s]+)/i, '')
    .trim()
    .replace(/^[,.\s]+|[,.\s]+$/g, ''); // Clean up any leftover punctuation/spaces
}
