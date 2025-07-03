// Scraping Session Manager
// Manages multi-step scraping sessions where the scraper pauses and awaits instructions

export interface ScrapingSession {
  id: string;
  url: string;
  status: 'initialized' | 'analyzing' | 'paused' | 'awaiting_instructions' | 'continuing' | 'completed' | 'error';
  currentPage?: {
    url: string;
    title: string;
    description: string;
    foundLinks: LinkData[];
    foundCompanies: CompanyData[];
    pageAnalysis: PageAnalysis;
  };
  extractionHistory: ExtractionStep[];
  instructions?: string;
  createdAt: number;
  lastUpdated: number;
  extractionMode: 'surface' | 'deep' | 'hybrid';
  maxResults: number;
}

export interface LinkData {
  url: string;
  text: string;
  type: 'company' | 'detail' | 'navigation' | 'external' | 'unknown';
  priority: number; // 1-10, higher is more relevant
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface CompanyData {
  name: string;
  website?: string;
  description?: string;
  logo?: string;
  industry?: string;
  location?: string;
  employees?: string;
  linkedDetailUrl?: string; // URL that might have more details
  extractionConfidence: number; // 0-1, confidence in extraction accuracy
  additionalData?: Record<string, unknown>;
}

export interface PageAnalysis {
  totalElements: number;
  totalLinks: number;
  hasCompanyIndicators: boolean;
  hasListStructure: boolean;
  hasPagination: boolean;
  antieBotDetection: boolean;
  loadingIndicators: boolean;
  estimatedCompanyCount: number;
  recommendedNextSteps: string[];
}

export interface ExtractionStep {
  stepNumber: number;
  action: string;
  url: string;
  timestamp: number;
  result: {
    companiesFound: number;
    linksFound: number;
    errors?: string[];
    metadata?: Record<string, unknown>;
  };
}

// In-memory storage for active scraping sessions
// In a production environment, this would be stored in a database
const activeSessions = new Map<string, ScrapingSession>();

export class ScrapingSessionManager {
  
  static createSession(url: string, options: {
    extractionMode?: 'surface' | 'deep' | 'hybrid';
    maxResults?: number;
    instructions?: string;
  } = {}): ScrapingSession {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const session: ScrapingSession = {
      id: sessionId,
      url,
      status: 'initialized',
      extractionHistory: [],
      instructions: options.instructions,
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      extractionMode: options.extractionMode || 'surface',
      maxResults: options.maxResults || 50
    };
    
    activeSessions.set(sessionId, session);
    console.log(`[SessionManager] Created session ${sessionId} for ${url}`);
    
    return session;
  }
  
  static getSession(sessionId: string): ScrapingSession | null {
    return activeSessions.get(sessionId) || null;
  }
  
  static updateSession(sessionId: string, updates: Partial<ScrapingSession>): ScrapingSession | null {
    const session = activeSessions.get(sessionId);
    if (!session) {
      console.warn(`[SessionManager] Session ${sessionId} not found for update`);
      return null;
    }
    
    const updatedSession = {
      ...session,
      ...updates,
      lastUpdated: Date.now()
    };
    
    activeSessions.set(sessionId, updatedSession);
    console.log(`[SessionManager] Updated session ${sessionId}, status: ${updatedSession.status}`);
    
    return updatedSession;
  }
  
  static addExtractionStep(sessionId: string, step: Omit<ExtractionStep, 'stepNumber' | 'timestamp'>): boolean {
    const session = activeSessions.get(sessionId);
    if (!session) {
      console.warn(`[SessionManager] Session ${sessionId} not found for adding step`);
      return false;
    }
    
    const extractionStep: ExtractionStep = {
      ...step,
      stepNumber: session.extractionHistory.length + 1,
      timestamp: Date.now()
    };
    
    session.extractionHistory.push(extractionStep);
    session.lastUpdated = Date.now();
    
    activeSessions.set(sessionId, session);
    console.log(`[SessionManager] Added extraction step ${extractionStep.stepNumber} to session ${sessionId}`);
    
    return true;
  }
  
  static deleteSession(sessionId: string): boolean {
    const deleted = activeSessions.delete(sessionId);
    if (deleted) {
      console.log(`[SessionManager] Deleted session ${sessionId}`);
    }
    return deleted;
  }
  
  static getAllActiveSessions(): ScrapingSession[] {
    return Array.from(activeSessions.values());
  }
  
  static cleanupOldSessions(maxAgeHours: number = 24): number {
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    let deletedCount = 0;
    
    for (const [sessionId, session] of activeSessions.entries()) {
      if (session.lastUpdated < cutoffTime) {
        activeSessions.delete(sessionId);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      console.log(`[SessionManager] Cleaned up ${deletedCount} old sessions (older than ${maxAgeHours}h)`);
    }
    
    return deletedCount;
  }
  
  static getSessionStatus(sessionId: string): {
    exists: boolean;
    status?: string;
    currentPage?: string;
    extractionSteps?: number;
    companiesFound?: number;
    lastUpdated?: number;
  } {
    const session = activeSessions.get(sessionId);
    
    if (!session) {
      return { exists: false };
    }
    
    const totalCompanies = session.extractionHistory.reduce((total, step) => 
      total + step.result.companiesFound, 0);
    
    return {
      exists: true,
      status: session.status,
      currentPage: session.currentPage?.url,
      extractionSteps: session.extractionHistory.length,
      companiesFound: totalCompanies,
      lastUpdated: session.lastUpdated
    };
  }
}

// Utility functions for analyzing pages and links
export class ScrapingAnalyzer {
  
  static async analyzePage(page: import('puppeteer').Page): Promise<PageAnalysis> {
    return await page.evaluate(() => {
      const totalElements = document.querySelectorAll('*').length;
      const totalLinks = document.querySelectorAll('a[href]').length;
      
      // Company indicators
      const bodyText = document.body.textContent?.toLowerCase() || '';
      const hasCompanyIndicators = [
        'company', 'startup', 'partner', 'exhibitor', 'enterprise',
        'business', 'corporation', 'firm', 'organization', 'vendor'
      ].some(term => bodyText.includes(term));
      
      // List structure detection
      const listSelectors = [
        '.grid', '.list', '.directory', '.catalog', '.cards',
        '[class*="grid"]', '[class*="list"]', '[class*="directory"]'
      ];
      const hasListStructure = listSelectors.some(selector => 
        document.querySelectorAll(selector).length > 0);
      
      // Pagination detection
      const paginationSelectors = [
        '.pagination', '.pager', '.page-nav', '[class*="pagination"]',
        'a[href*="page"]', 'button[aria-label*="page"]'
      ];
      const hasPagination = paginationSelectors.some(selector => 
        document.querySelectorAll(selector).length > 0);
      
      // Anti-bot detection (basic indicators)
      const antieBotDetection = bodyText.includes('cloudflare') || 
                               bodyText.includes('please wait') ||
                               bodyText.includes('checking your browser') ||
                               document.title.toLowerCase().includes('just a moment');
      
      // Loading indicators
      const loadingSelectors = [
        '.loading', '.spinner', '.loader', '[class*="loading"]',
        '[class*="spinner"]', '[class*="loader"]'
      ];
      const loadingIndicators = loadingSelectors.some(selector => 
        document.querySelectorAll(selector).length > 0);
      
      // Estimate company count based on various indicators
      const companySelectors = [
        '.partner-card', '.company-card', '.exhibitor-card', '.startup-card',
        '[data-testid*="partner"]', '[data-testid*="company"]',
        '.card', '.item', '.listing', '.entry'
      ];
      
      let estimatedCompanyCount = 0;
      for (const selector of companySelectors) {
        const count = document.querySelectorAll(selector).length;
        if (count > estimatedCompanyCount) {
          estimatedCompanyCount = count;
        }
      }
      
      // Recommend next steps
      const recommendedNextSteps: string[] = [];
      
      if (antieBotDetection) {
        recommendedNextSteps.push('Use advanced anti-bot evasion techniques');
      }
      
      if (loadingIndicators) {
        recommendedNextSteps.push('Wait for dynamic content to load');
        recommendedNextSteps.push('Try scrolling to trigger lazy loading');
      }
      
      if (hasPagination) {
        recommendedNextSteps.push('Consider navigating through pagination');
        recommendedNextSteps.push('Extract links to additional pages');
      }
      
      if (estimatedCompanyCount > 20) {
        recommendedNextSteps.push('Page contains many potential companies - extract systematically');
      } else if (estimatedCompanyCount === 0) {
        recommendedNextSteps.push('No obvious company indicators - try alternative extraction methods');
        recommendedNextSteps.push('Look for links to company detail pages');
      }
      
      if (totalLinks > 100) {
        recommendedNextSteps.push('Many links found - filter for relevant company/detail pages');
      }
      
      return {
        totalElements,
        totalLinks,
        hasCompanyIndicators,
        hasListStructure,
        hasPagination,
        antieBotDetection,
        loadingIndicators,
        estimatedCompanyCount,
        recommendedNextSteps
      };
    });
  }
  
  static async extractRelevantLinks(page: import('puppeteer').Page, maxLinks: number = 50): Promise<LinkData[]> {
    return await page.evaluate((maxLinks: number) => {
      const links: LinkData[] = [];
      const processedUrls = new Set<string>();
      
      const linkElements = document.querySelectorAll('a[href]');
      
      for (let i = 0; i < Math.min(linkElements.length, maxLinks * 2); i++) {
        const link = linkElements[i] as HTMLAnchorElement;
        const href = link.href;
        const text = link.textContent?.trim() || '';
        
        // Skip duplicates and invalid links
        if (processedUrls.has(href) || !href || href === '#' || href === 'javascript:void(0)') {
          continue;
        }
        
        processedUrls.add(href);
        
        // Determine link type and priority
        let type: LinkData['type'] = 'unknown';
        let priority = 1;
        
        const lowerHref = href.toLowerCase();
        const lowerText = text.toLowerCase();
        
        // Company/partner links
        if (lowerHref.includes('/partner') || lowerHref.includes('/company') || 
            lowerHref.includes('/exhibitor') || lowerHref.includes('/startup')) {
          type = 'company';
          priority = 8;
        }
        // Detail pages
        else if (lowerHref.includes('/detail') || lowerHref.includes('/profile') || 
                 lowerHref.includes('/view/') || lowerText.includes('view details')) {
          type = 'detail';
          priority = 7;
        }
        // Navigation
        else if (lowerText.includes('next') || lowerText.includes('more') || 
                 lowerText.includes('page') || lowerHref.includes('page=')) {
          type = 'navigation';
          priority = 6;
        }
        // External links
        else if (!lowerHref.includes(window.location.hostname)) {
          type = 'external';
          priority = 3;
        }
        
        // Boost priority for healthcare-related links
        const healthcareKeywords = ['health', 'medical', 'wellness', 'biotech', 'pharma'];
        if (healthcareKeywords.some(keyword => 
          lowerHref.includes(keyword) || lowerText.includes(keyword))) {
          priority += 2;
        }
        
        // Lower priority for navigation and generic links
        const genericTerms = ['home', 'about', 'contact', 'login', 'menu', 'search'];
        if (genericTerms.some(term => lowerText.includes(term))) {
          priority = Math.max(1, priority - 3);
        }
        
        if (text.length > 0 && priority > 2) {
          links.push({
            url: href,
            text: text.substring(0, 100), // Limit text length
            type,
            priority,
            description: `${type} link: ${text}`,
            metadata: {
              isInternal: lowerHref.includes(window.location.hostname),
              hasCompanyKeywords: ['company', 'partner', 'startup'].some(k => 
                lowerHref.includes(k) || lowerText.includes(k))
            }
          });
        }
        
        if (links.length >= maxLinks) {
          break;
        }
      }
      
      // Sort by priority (highest first)
      return links.sort((a, b) => b.priority - a.priority);
    }, maxLinks);
  }
}
