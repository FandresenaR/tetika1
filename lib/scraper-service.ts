import axios from 'axios';
import { Message } from '@/types';
import { generateUniqueId } from './id-generator';

/**
 * ScraperService - Handles web scraping operations
 */
class ScraperService {
  /**
   * Scrapes a website URL and returns structured data
   * @param url URL to scrape
   * @returns Promise with scraped data
   */  static async scrapeUrl(url: string): Promise<any> {
    try {
      const response = await axios.post('/api/scrape', { url });
      return response.data;
    } catch (error) {
      console.error('Scraping failed:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to scrape URL';
      throw new Error(errorMessage);
    }
  }
  /**
   * Processes a URL and generates an assistant message with the scraped data
   * @param url URL to scrape
   * @returns Object with assistant message containing scraped data
   */
  static async generateScrapingResponse(url: string): Promise<Message> {
    try {
      console.log(`[ScraperService] Scraping URL: ${url}`);
        // Use the centralized ID generator
      const messageId = generateUniqueId();
      console.log(`[ScraperService] Generated message ID: ${messageId}`);
      
      // Initial loading message
      const scrapingMessage: Message = {
        id: messageId,
        role: 'assistant',
        content: `Je cherche des données sur ${url}...`,
        timestamp: Date.now(),
      };
      
      // Call the scraper API
      const scraperData = await this.scrapeUrl(url);
      console.log('[ScraperService] Scraping results:', scraperData);
      
      // Extract data
      const tables = scraperData.data?.tables || [];
      const insights = scraperData.data?.insights || {};
      const title = scraperData.data?.title || 'Résultats';
      const summary = scraperData.data?.summary || '';
      
      // Generate response content
      let content = `Voici les données extraites de **[${title}](${url})** :\n\n`;
      
      if (summary) {
        content += `${summary}\n\n`;
      }
      
      if (tables.length > 0) {
        content += `J'ai extrait ${tables.length} tableau(x) de données.\n`;
      } else {
        content += "Je n'ai pas trouvé de tableaux de données sur cette page.\n";
      }
      
      // Add insights
      if (Object.keys(insights).length > 0) {
        content += "\n**Informations principales**:\n";
        for (const [key, value] of Object.entries(insights)) {
          if (typeof value === 'string') {
            content += `- **${key}**: ${value}\n`;
          }
        }
      }
      
      // Final message with data
      return {
        ...scrapingMessage,
        content,
        scrapedData: {
          url,
          tables,
          insights,
          title,
          summary
        }
      };    } catch (error) {
      // Return error message with a unique ID
      const errorMessage: string = error instanceof Error ? error.message : 'Erreur inconnue';
        const errorResponse: Message = {
        id: generateUniqueId(), // Use the centralized ID generator
        role: 'assistant',
        content: `Désolé, je n'ai pas pu extraire les données de l'URL demandée. Erreur: ${errorMessage}`,
        timestamp: Date.now(),
      };
      
      return errorResponse;
    }
  }
}

export default ScraperService;
