import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message as MessageComponent, CodeSidebarContext } from './Message';
import ChatInput from './ChatInput';
import { ModelSelector } from './ModelSelector';
import HistorySidebar from './HistorySidebar';
import CodeSidebar from './CodeSidebar';
import { moveSettingsButton } from '@/lib/mobile-settings-mover';
import { FileUploader } from '@/components/ui/FileUploader';
import SpeechSynthesisCheck from '@/components/ui/SpeechSynthesisCheck';
import SettingsButton from '@/components/ui/SettingsButton';
import { Message, ChatMode, ChatSession } from '@/types';
import { openRouterModels, getModelById } from '@/lib/models';
import { isImageFile, isVideoFile, createMediaDescription, createImageContentWithBase64 } from '@/lib/media-utils';
import { DEFAULT_RAG_PROVIDER } from '@/lib/rag-providers';
import { useChatMessages } from '@/lib/hooks/useChatMessages';
import { chatService } from '@/lib/services/chatService';

interface ThinkingStep {
  id: string;
  title: string;
  description: string;
  sources: string[];
  timestamp: number;
  status: 'in-progress' | 'completed' | 'error';
  data?: unknown;
}

interface ScrapingReportData {
  query: string;
  timestamp: string;
  summary: {
    totalSources: number;
    successfulExtractions: number;
    totalWords: number;
    mode: string;
  };
  sources: Array<{
    url: string;
    title: string;
    wordCount: number;
    description: string;
    author: string;
    publishDate: string;
  }>;
  analysis?: unknown;
  rawContent?: unknown;
}

// Génère un ID unique
const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const ChatInterface: React.FC = () => {
  // Use the first available OpenRouter model as the default
  const defaultModelId = openRouterModels.length > 0 ? openRouterModels[0].id : "mistralai/mistral-7b-instruct:free";
  
  // Utiliser le hook personnalisé pour gérer les messages de manière robuste
  const {
    messages,
    addUserMessage,
    addAssistantMessage,
    clearMessages: clearChatMessages,
    loadMessages,
    truncateMessagesAfter,
  } = useChatMessages();
  
  const [loading, setLoading] = useState(false);
  const [modelId, setModelId] = useState(defaultModelId);
  
  // Helper pour ajouter un message générique (compatible ancien code)
  // Doit être défini après modelId
  const addMessage = useCallback((message: Message) => {
    if (message.role === 'assistant') {
      return addAssistantMessage(
        message.content,
        message.modelId || modelId,
        message.mode || 'standard',
        message.sources,
        message.autoActivatedRAG
      );
    } else if (message.role === 'user') {
      return addUserMessage(
        message.content,
        message.mode || 'standard',
        message.attachedFile
      );
    }
  }, [addUserMessage, addAssistantMessage, modelId]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [conversations, setConversations] = useState<ChatSession[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    // État global pour le mode RAG
  const [ragMode, setRagMode] = useState<boolean>(false);
  
  // État pour le fournisseur RAG sélectionné
  const [selectedRAGProvider, setSelectedRAGProvider] = useState<string>(DEFAULT_RAG_PROVIDER);
    // États pour la barre latérale de code
  const [showCodeSidebar, setShowCodeSidebar] = useState(false);
  const [sidebarCode, setSidebarCode] = useState<{ code: string; language: string; fileName: string } | null>(null);
    // États pour le mode scraping et le processus de réflexion
  const [scrapingMode, setScrapingMode] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [scrapingReportData, setScrapingReportData] = useState<ScrapingReportData | null>(null);
  
  // État pour stocker la valeur précédente de isSidebarCollapsed avant l'ouverture du CodeSidebar
  const [previousSidebarState, setPreviousSidebarState] = useState(false);
  
  // État pour le modal d'upload de fichier
  const [showFileUploader, setShowFileUploader] = useState(false);
  
  // État pour le fichier sélectionné
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
    // État pour détecter si l'écran est mobile
  const [isMobile, setIsMobile] = useState(false);
  
  // États pour les sections collapsibles des exemples
  const [showRagExamples, setShowRagExamples] = useState(false);
  const [showMcpExamples, setShowMcpExamples] = useState(false);
  
  // Anciennement pour les suggestions RAG - supprimé
    // Fonction pour détecter si on est sur mobile
  useEffect(() => {
    const checkIfMobile = () => {
      const isMobileView = window.innerWidth < 768; // 768px est le breakpoint md de tailwind
      setIsMobile(isMobileView);
    };
    
    // Vérifier initialement
    checkIfMobile();
    
    // Ajouter un event listener pour le redimensionnement
    window.addEventListener('resize', checkIfMobile);
    
    // Nettoyer l'event listener
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  // Effet pour déplacer le bouton des paramètres sur mobile
  useEffect(() => {
    // Activer la fonction qui déplace le bouton des paramètres
    moveSettingsButton();
  }, []);
    // Effect pour écouter les changements de fournisseur RAG
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tetika-rag-provider' && e.newValue) {
        setSelectedRAGProvider(e.newValue);
      }
    };

    const handleRAGProviderChange = (e: CustomEvent) => {
      const providerId = e.detail?.providerId;
      if (providerId) {
        setSelectedRAGProvider(providerId);
        console.log('[RAG] Provider changed to:', providerId);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('rag-provider-changed', handleRAGProviderChange as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('rag-provider-changed', handleRAGProviderChange as EventListener);
    };
  }, []);

  // La sidebar sera toujours fixée à un état spécifique en fonction de l'appareil
  useEffect(() => {
    if (isMobile) {
      // Sur mobile, sidebar toujours cachée par défaut jusqu'à ce qu'elle soit ouverte manuellement
      setIsSidebarCollapsed(true);
      setShowSidebar(false);
    } else {
      // Sur desktop, sidebar toujours visible et non collapsée par défaut
      setIsSidebarCollapsed(false);
      setShowSidebar(true);
    }
  }, [isMobile]);
  
  // Gérer le collapse automatique du sidebar gauche quand le sidebar droit s'ouvre
  useEffect(() => {
    if (showCodeSidebar) {
      // Sauvegarder l'état actuel du sidebar gauche
      setPreviousSidebarState(isSidebarCollapsed);
      
      // Sur tout appareil, masquer la sidebar gauche quand le sidebar droit est ouvert
      setShowSidebar(false);
    } else {
      // Sur desktop seulement, restaurer la sidebar gauche
      if (!isMobile) {
        setShowSidebar(true);
      }
    }
  }, [showCodeSidebar, isSidebarCollapsed, previousSidebarState, isMobile]);
  
  // Fonction pour basculer le mode RAG
  const toggleRagMode = (enabled: boolean) => {
    setRagMode(enabled);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Charge les conversations depuis le stockage local au chargement initial
  useEffect(() => {
    try {
      const storedConversations = localStorage.getItem('tetika-conversations');
      if (storedConversations) {
        const parsedConversations = JSON.parse(storedConversations) as ChatSession[];
        setConversations(parsedConversations);
        
        // Si des conversations existent, sélectionne la plus récente
        if (parsedConversations.length > 0) {
          const sortedConversations = [...parsedConversations].sort((a, b) => b.updatedAt - a.updatedAt);
          const mostRecentId = sortedConversations[0].id;
          setActiveConversationId(mostRecentId);
          loadMessages(sortedConversations[0].messages);
          setModelId(sortedConversations[0].modelId);        }
      }
      
      // Charger le fournisseur RAG sélectionné
      const savedRAGProvider = localStorage.getItem('tetika-rag-provider');
      if (savedRAGProvider) {
        setSelectedRAGProvider(savedRAGProvider);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Sauvegarde les conversations dans le stockage local lorsqu'elles changent
  useEffect(() => {
    if (conversations.length > 0) {
      try {
        localStorage.setItem('tetika-conversations', JSON.stringify(conversations));
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des conversations:', error);
      }
    }
  }, [conversations]);
  // Met à jour les messages et le modèle lorsque la conversation active change
  useEffect(() => {
    if (activeConversationId) {
      const activeConversation = conversations.find(c => c.id === activeConversationId);
      if (activeConversation) {
        // Charger les messages de la conversation active
        loadMessages(activeConversation.messages);
        setModelId(activeConversation.modelId);
      }
    }
  }, [activeConversationId, conversations, loadMessages]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Effet pour ajuster la hauteur du conteneur de chat
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (chatContainerRef.current) {
        const headerHeight = 64; // Hauteur approximative du header
        const inputHeight = 96; // Hauteur approximative de la zone d'input
        const windowHeight = window.innerHeight;
        chatContainerRef.current.style.height = `${windowHeight - headerHeight - inputHeight}px`;
      }
    });
    
    if (chatContainerRef.current) {
      resizeObserver.observe(chatContainerRef.current);
    };
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);  // La fonction saveCurrentConversation est maintenant intégrée directement dans le useEffect
  // Nous utilisons une référence pour suivre le dernier état des messages et éviter les boucles infinies
  const prevMessagesRef = useRef<{messages: Message[], modelId: string, activeConversationId: string | null}>({
    messages: [],
    modelId: defaultModelId,
    activeConversationId: null
  });
  
  // Sauvegarde la conversation lorsque les messages ou le modèle changent
  useEffect(() => {
    // Vérifier si les messages ont réellement changé pour éviter les boucles
    if (
      messages.length === 0 || 
      (
        prevMessagesRef.current.activeConversationId === activeConversationId &&
        prevMessagesRef.current.messages.length === messages.length &&
        prevMessagesRef.current.modelId === modelId &&
        JSON.stringify(prevMessagesRef.current.messages) === JSON.stringify(messages)
      )
    ) {
      return;
    }
    
    // Mettre à jour notre référence
    prevMessagesRef.current = {
      messages: [...messages],
      modelId,
      activeConversationId
    };
    
    // Éviter de sauvegarder si nous venons juste de sélectionner une conversation
    if (messages.length > 0) {
      const timeoutId = setTimeout(() => {
        // On ne sauvegarde que si nous avons un ID actif ou si nous avons des messages
        if (activeConversationId || messages.length > 0) {
          // Mise à jour manuelle sans utiliser saveCurrentConversation
          const now = Date.now();
          
          if (activeConversationId) {
            // Vérifier si la conversation existe déjà
            const existingConvIndex = conversations.findIndex(conv => conv.id === activeConversationId);
            
            if (existingConvIndex >= 0) {
              // Mise à jour d'une conversation existante
              const updatedConversations = [...conversations];
              updatedConversations[existingConvIndex] = {
                ...updatedConversations[existingConvIndex],
                messages,
                modelId,
                updatedAt: now
              };
              setConversations(updatedConversations);
            }
          } else if (messages.length > 0) {
            // Création d'une nouvelle conversation
            const newConversation: ChatSession = {
              id: generateId(),
              title: "",
              messages,
              modelId,
              createdAt: now,
              updatedAt: now,
            };
            
            setConversations(prev => [...prev, newConversation]);
            setActiveConversationId(newConversation.id);
          }
        }
      }, 50); // Légère attente pour éviter les conflits
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages, modelId, activeConversationId, conversations, defaultModelId]);  const handleScrapingRequest = async (content: string) => {
    setLoading(true);
    setScrapingMode(true);
    setThinkingSteps([]);
    setScrapingReportData(null);
    
    // Enhanced parsing for @scraper command
    const scraperMatch = content.match(/@scraper\s*(.*)$/i);
    let query = '';
    let instructions = '';
    
    if (scraperMatch) {
      const scraperContent = scraperMatch[1].trim();
      
      // Check if it's just @scraper without content - prompt for input
      if (!scraperContent) {
        const promptMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: `## 🤖 AI-Powered Web Scraper Ready

I'm ready to help you scrape any website with AI-guided intelligence! Please provide:

### 📋 **Required Information:**
1. **Website URL** - The page you want to scrape
2. **Data Instructions** - What specific data you want to extract

### 💡 **Example Format:**
\`\`\`
@scraper https://example.com/companies
Extract company names, websites, descriptions, and contact information
\`\`\`

### 🎯 **What I Can Extract:**
- **Company Data**: Names, websites, descriptions, employees, industry
- **Contact Information**: Emails, phone numbers, addresses
- **Product Data**: Names, prices, descriptions, specifications
- **Job Listings**: Titles, companies, locations, salaries
- **News Articles**: Headlines, dates, authors, content
- **Any structured data** from web pages

### 🧠 **AI-Enhanced Features:**
- **Smart Navigation**: AI understands page structure and navigates intelligently
- **Content Analysis**: LLM analyzes the page to find the best extraction strategy
- **Anti-Bot Bypassing**: Advanced techniques to access protected content
- **Dynamic Content**: Handles JavaScript-heavy sites and lazy loading
- **Instruction Following**: Precisely extracts data based on your specific requirements

Just type your URL and instructions, and I'll handle the rest!`,
          timestamp: Date.now(),
          mode: 'rag',
        };
        
        addMessage(promptMessage);
        setLoading(false);
        setScrapingMode(false);
        return;
      }
      
      // Parse URL and instructions from the content
      const urlMatch = scraperContent.match(/https?:\/\/[^\s]+/i);
      if (urlMatch) {
        query = urlMatch[0];
        instructions = scraperContent.replace(urlMatch[0], '').trim();
      } else {
        // No URL found, treat entire content as search query
        query = scraperContent;
      }
    } else {
      // Legacy parsing for backward compatibility
      query = content.replace(/scrape system:\s*/i, '').replace(/@scrape\s*/i, '').trim();
      if (!query) {
        query = content.trim();
      }
    }
    
    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
      mode: 'rag',
    };
    
    addMessage(userMessage);
    
    // Show thinking process in sidebar
    setSidebarCode({
      code: '',
      language: 'markdown',
      fileName: `ai-scraper-report-${Date.now()}.md`
    });
    setShowCodeSidebar(true);
    
    try {
      // Detect if this is a URL for direct scraping
      const urlPattern = /https?:\/\/[^\s]+/i;
      const urlMatch = query.match(urlPattern);
      
      if (urlMatch) {
        // AI-Enhanced Direct URL scraping
        const url = urlMatch[0];
        console.log(`[AI Scraper] Direct URL detected: ${url}`);
        
        // Step 1: AI Analysis Phase
        setThinkingSteps([
          {
            id: 'ai-analysis',
            title: '🧠 AI Content Analysis',
            description: `Using OpenRouter LLM to analyze page structure and determine optimal scraping strategy for ${url}`,
            sources: [url],
            timestamp: Date.now(),
            status: 'in-progress'
          }
        ]);
        
        // Get AI analysis of the page first
        const aiAnalysisResponse = await fetch('/api/mcp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tool: 'chat_with_ai',
            args: {
              message: `You are an expert web scraper. I need to scrape data from this URL: ${url}
              
${instructions ? `User instructions: ${instructions}` : ''}

Please analyze this URL and provide:
1. What type of website this likely is (e.g., company directory, e-commerce, news site, etc.)
2. What data structures are likely to be present
3. Recommended scraping approach and selectors
4. Any potential challenges (anti-bot protection, dynamic content, etc.)
5. Best extraction strategy for the requested data

Format your response as a JSON object with keys: websiteType, dataStructures, selectors, challenges, strategy`,
              system_prompt: "You are a professional web scraping expert. Analyze URLs and provide detailed technical guidance for data extraction. Always respond with practical, actionable advice."
            }
          })
        });
        
        const aiAnalysisResult = await aiAnalysisResponse.json();
        let aiGuidance = null;
        
        if (aiAnalysisResult.success && aiAnalysisResult.data?.content?.[0]?.text) {
          try {
            // Try to parse AI response as JSON, fallback to plain text
            const aiText = aiAnalysisResult.data.content[0].text;
            aiGuidance = aiText.includes('{') ? JSON.parse(aiText.match(/\{[\s\S]*\}/)?.[0] || '{}') : { strategy: aiText };
          } catch {
            aiGuidance = { strategy: aiAnalysisResult.data.content[0].text };
          }
        }
        
        // Update thinking steps with AI analysis
        setThinkingSteps(prev => prev.map(step => 
          step.id === 'ai-analysis' 
            ? { ...step, status: 'completed', data: aiGuidance }
            : step
        ));
        
        // Step 2: AI-Guided Scraping
        setThinkingSteps(prev => [...prev, {
          id: 'ai-guided-scraping',
          title: '🚀 AI-Guided Data Extraction',
          description: `Executing AI-optimized scraping strategy for ${url}`,
          sources: [url],
          timestamp: Date.now(),
          status: 'in-progress'
        }]);
        
        // Enhanced scraping with AI guidance
        const scrapingResponse = await fetch('/api/mcp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tool: 'interactive_scraper',
            args: {
              action: 'start',
              url: url,
              aiGuidance: aiGuidance,
              instructions: instructions || 'Extract all relevant data from this page'
            }
          })
        });
        
        const scrapingResult = await scrapingResponse.json();
        
        if (scrapingResult.success && scrapingResult.data?.content?.[0]?.text) {
          const sessionData = JSON.parse(scrapingResult.data.content[0].text);
          
          if (sessionData.success && sessionData.sessionId) {
            // Continue with AI-guided workflow
            await executeAIGuidedScraping(sessionData.sessionId, url, instructions, aiGuidance);
          } else {
            throw new Error('Failed to start scraping session. The URL might be inaccessible.');
          }
        } else {
          throw new Error('Initial scraping setup failed. Please check the URL and try again.');
        }
        
      } else {
        // Search-based scraping using AI-enhanced search
        await executeAIGuidedSearch(query);
      }
      
    } catch (error) {
      console.error('AI Scraping error:', error);
      
      // Update thinking steps to show error
      setThinkingSteps(prev => prev.map(step => ({
        ...step,
        status: 'error' as const,
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      })));
      
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: `❌ **AI Scraping Error**

I encountered an error while performing the AI-enhanced scraping analysis:

${error instanceof Error ? error.message : 'Unknown error occurred'}

### 🔧 AI Scraper System Capabilities
The new AI-powered scraper system enables:
- **Intelligent Navigation**: AI can browse, select, and extract data from complex pages
- **Dynamic Content Loading**: Handles JavaScript-heavy sites and dynamic content
- **Anti-Bot Bypassing**: Advanced techniques to work with protected sites
- **Structured Data Extraction**: Specifically designed for various data types

### 💡 **Tips for Better Results:**
- For direct URLs: Use \`@scraper https://example.com extract company data\`
- For searches: Use \`@scraper companies in healthcare Paris\`
- The system now uses advanced AI navigation to intelligently collect data
- AI allows the system to actually "see" and interact with web pages like a human

### 🚀 **Enhanced Features:**
- Real-time page navigation and content selection
- Intelligent link following and data collection
- Dynamic content extraction (AJAX, React, Vue.js sites)
- Structured output formatting for any data type

Please try again with a different query or URL. The AI system is designed to handle complex scraping scenarios that traditional methods cannot.`,
        timestamp: Date.now(),
      };
      
      addMessage(errorMessage);
    } finally {
      setLoading(false);
      setScrapingMode(false);
    }
  };

  // Helper function for AI-guided scraping workflow
  const executeAIGuidedScraping = async (sessionId: string, url: string, instructions: string, aiGuidance: unknown) => {
    // Step 3: AI Page Analysis
    setThinkingSteps(prev => [...prev, {
      id: 'page-analysis',
      title: '📊 AI Page Structure Analysis',
      description: `AI analyzing page elements and content structure`,
      sources: [url],
      timestamp: Date.now(),
      status: 'in-progress'
    }]);
    
    const analysisResponse = await fetch('/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'interactive_scraper',
        args: {
          action: 'analyze',
          sessionId: sessionId
        }
      })
    });
    
    const analysisResult = await analysisResponse.json();
    
    if (analysisResult.success && analysisResult.data?.content?.[0]?.text) {
      const pageInfo = JSON.parse(analysisResult.data.content[0].text);
      
      setThinkingSteps(prev => prev.map(step => 
        step.id === 'page-analysis' 
          ? { ...step, status: 'completed', data: pageInfo }
          : step
      ));
      
      // Step 4: AI-Optimized Extraction
      setThinkingSteps(prev => [...prev, {
        id: 'ai-extraction',
        title: '⚡ AI-Optimized Data Extraction',
        description: `Using AI to intelligently extract data based on page analysis`,
        sources: [url],
        timestamp: Date.now(),
        status: 'in-progress'
      }]);
      
      // Generate AI-optimized extraction instructions
      const extractionPrompt = `Based on the page analysis, extract data from this page:
      
Page Info: ${JSON.stringify(pageInfo.pageInfo, null, 2)}
User Instructions: ${instructions || 'Extract all relevant data'}
AI Guidance: ${JSON.stringify(aiGuidance, null, 2)}

Please provide specific extraction instructions that will capture the most relevant data.`;
      
      const extractionInstructionsResponse = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool: 'chat_with_ai',
          args: {
            message: extractionPrompt,
            system_prompt: "You are an expert data extraction specialist. Generate clear, specific instructions for extracting data from web pages based on the page structure analysis."
          }
        })
      });
      
      let finalInstructions = instructions || 'Extract all relevant data from this page';
      if (extractionInstructionsResponse.ok) {
        const instructionsResult = await extractionInstructionsResponse.json();
        if (instructionsResult.success && instructionsResult.data?.content?.[0]?.text) {
          finalInstructions = instructionsResult.data.content[0].text;
        }
      }
      
      // Perform the actual extraction with AI-optimized instructions
      const extractionResponse = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool: 'interactive_scraper',
          args: {
            action: 'extract',
            sessionId: sessionId,
            instructions: finalInstructions
          }
        })
      });
      
      const extractionResult = await extractionResponse.json();
      
      if (extractionResult.success && extractionResult.data?.content?.[0]?.text) {
        const extractedData = JSON.parse(extractionResult.data.content[0].text);
        
        setThinkingSteps(prev => prev.map(step => 
          step.id === 'ai-extraction' 
            ? { ...step, status: 'completed', data: extractedData }
            : step
        ));
        
        // Cleanup session
        await fetch('/api/mcp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tool: 'interactive_scraper',
            args: {
              action: 'cleanup',
              sessionId: sessionId
            }
          })
        });
        
        if (extractedData.success && extractedData.extractedData && extractedData.extractedData.length > 0) {
          // Create successful AI scraping response
          await createAIScrapingResponse(url, extractedData, pageInfo, aiGuidance);
        } else {
          throw new Error('AI-guided extraction found no data. The page might be empty or have strong protections.');
        }
      } else {
        throw new Error('AI-guided extraction failed. Please try a different approach.');
      }
    } else {
      throw new Error('Page analysis failed. Cannot proceed with extraction.');
    }
  };

  // Helper function for AI-guided search
  const executeAIGuidedSearch = async (query: string) => {
    console.log(`[AI Search] Search-based scraping for: ${query}`);
    
    // Update thinking steps
    setThinkingSteps([
      {
        id: 'ai-search',
        title: '🔍 AI-Enhanced Multi-Provider Search',
        description: `AI analyzing search intent and finding optimal sources for: "${query}"`,
        sources: ['SearXNG', 'Fetch-MCP', 'SerpAPI'],
        timestamp: Date.now(),
        status: 'in-progress'
      }
    ]);
    
    // Use AI to enhance search strategy
    const searchStrategyResponse = await fetch('/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'chat_with_ai',
        args: {
          message: `I need to search for: "${query}". Please provide the best search strategy including:
1. Optimal keywords to use
2. What type of sources to prioritize
3. What data I should expect to find
4. Best search provider to use (SearXNG, SerpAPI, or Fetch-MCP)

Format as JSON with keys: keywords, sourceTypes, expectedData, provider`,
          system_prompt: "You are an expert search strategist. Analyze search queries and provide optimal search approaches."
        }
      })
    });
    
    let searchStrategy = { keywords: query, provider: 'fetch-mcp' };
    if (searchStrategyResponse.ok) {
      const strategyResult = await searchStrategyResponse.json();
      if (strategyResult.success && strategyResult.data?.content?.[0]?.text) {
        try {
          const strategyText = strategyResult.data.content[0].text;
          searchStrategy = JSON.parse(strategyText.match(/\{[\s\S]*\}/)?.[0] || '{}');
        } catch {
          // Use default strategy if parsing fails
        }
      }
    }
    
    // Execute search with AI-optimized strategy
    const searchResponse = await fetch('/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'multi_search',
        args: {
          provider: searchStrategy.provider || 'fetch-mcp',
          query: searchStrategy.keywords || query,
          apiKeys: {}
        }
      })
    });
    
    const searchResult = await searchResponse.json();
    
    if (searchResult.success && searchResult.data) {
      setThinkingSteps(prev => prev.map(step => 
        step.id === 'ai-search' 
          ? { ...step, status: 'completed', data: searchResult.data }
          : step
      ));
      
      const results = searchResult.data.results || [];
      
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: `## 🔍 AI-Enhanced Search Results

I've found ${results.length} relevant results for: "${query}" using AI-optimized search strategy.

### 🧠 AI Search Analysis
- **Search Strategy**: ${JSON.stringify(searchStrategy, null, 2)}
- **Provider Used**: ${searchResult.data.provider || 'AI-Enhanced Fetch-MCP'}
- **Results Found**: ${results.length}
- **Search Success**: ✅ ${searchResult.data.success ? 'Successful' : 'Partial'}

### 🌐 Top Results

${results.slice(0, 10).map((result: { title: string; url: string; snippet: string; position: number }, index: number) => {
  return `${index + 1}. **[${result.title}](${result.url})**
   ${result.snippet}
   Position: #${result.position || index + 1}`;
}).join('\n\n')}

### 💡 Next Steps - AI-Powered Extraction
To extract detailed data from any of these sources, simply use:
\`@scraper [URL] [specific extraction instructions]\`

Example:
\`@scraper ${results[0]?.url || 'https://example.com'} extract company names, descriptions, and contact info\`

The AI system will:
1. **Analyze** the page structure intelligently
2. **Navigate** through dynamic content
3. **Extract** precisely the data you need
4. **Format** results in a structured way`,
        timestamp: Date.now(),
        sources: results.slice(0, 5).map((result: { title: string; url: string; snippet: string }) => ({
          title: result.title,
          link: result.url,
          url: result.url,
          snippet: result.snippet
        }))
      };
      
      addMessage(assistantMessage);
    } else {
      throw new Error('AI-enhanced search failed. Please try a different query or check your connection.');
    }
  };

  // Helper function to create AI scraping response
  const createAIScrapingResponse = async (url: string, extractedData: unknown, pageInfo: unknown, aiGuidance: unknown) => {
    const data = extractedData as { extractedData: Array<{ text?: string; link?: string; image?: string; price?: string; email?: string; phone?: string; [key: string]: unknown }>, summary?: { withLinks?: number; withImages?: number; withPrices?: number; withEmails?: number; withPhones?: number } };
    const page = pageInfo as { pageInfo?: { title?: string; totalElements?: number; bodyTextLength?: number; availableLinks?: unknown[] } };
    
    // Create structured report
    const reportData: ScrapingReportData = {
      query: url,
      timestamp: new Date().toISOString(),
      summary: {
        totalSources: 1,
        successfulExtractions: data.extractedData.length,
        totalWords: data.extractedData.reduce((acc: number, item: { text?: string }) => 
          acc + (item.text?.split(' ').length || 0), 0),
        mode: 'AI-Enhanced Interactive Scraper'
      },
      sources: [{
        url: url,
        title: page.pageInfo?.title || 'Scraped Page',
        wordCount: data.extractedData.reduce((acc: number, item: { text?: string }) => 
          acc + (item.text?.split(' ').length || 0), 0),
        description: `AI-extracted ${data.extractedData.length} items using intelligent analysis`,
        author: 'AI Scraper',
        publishDate: new Date().toISOString()
      }],
      analysis: {
        aiGuidance: aiGuidance,
        pageInfo: page.pageInfo,
        extractedData: data.extractedData,
        extractionMethod: 'AI-Guided Interactive Scraper'
      }
    };
    
    setScrapingReportData(reportData);
    
    // Create detailed response
    const itemsList = data.extractedData.slice(0, 20).map((item, index) => {
      let itemText = `${index + 1}. `;
      if (item.text) {
        itemText += `**${item.text.substring(0, 100)}${item.text.length > 100 ? '...' : ''}**`;
      }
      if (item.link) {
        itemText += `\n   - Link: ${item.link}`;
      }
      if (item.image) {
        itemText += `\n   - Image: ${item.image}`;
      }
      if (item.price) {
        itemText += `\n   - Price: ${item.price}`;
      }
      if (item.email) {
        itemText += `\n   - Email: ${item.email}`;
      }
      if (item.phone) {
        itemText += `\n   - Phone: ${item.phone}`;
      }
      return itemText;
    }).join('\n\n');
    
    const guidanceData = aiGuidance as { websiteType?: string; strategy?: string } | null;
    
    // Create AI response message
    const assistantMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: `## 🤖 AI-Enhanced Web Scraping Complete

I've successfully analyzed and extracted data from: "${url}" using advanced AI-guided scraping techniques.

### 🧠 AI Analysis Results
- **Website Type**: ${guidanceData?.websiteType || 'Detected automatically'}
- **Scraping Strategy**: ${guidanceData?.strategy || 'AI-optimized extraction'}
- **Data Points Found**: ${data.extractedData.length}
- **Extraction Method**: AI-Guided Interactive Scraper

### 📊 Extraction Summary
- **Total Items**: ${data.extractedData.length}
- **Items with Links**: ${data.summary?.withLinks || 0}
- **Items with Images**: ${data.summary?.withImages || 0}
- **Items with Prices**: ${data.summary?.withPrices || 0}
- **Items with Emails**: ${data.summary?.withEmails || 0}
- **Items with Phones**: ${data.summary?.withPhones || 0}

### 🎯 Extracted Data

${itemsList}

${data.extractedData.length > 20 ? `\n*... and ${data.extractedData.length - 20} more items. See the complete report in the sidebar.*` : ''}

### 🚀 AI-Enhanced Features Used
- **Intelligent Page Analysis**: AI analyzed page structure for optimal extraction
- **Dynamic Strategy Selection**: AI chose the best approach based on content type
- **Smart Element Detection**: AI identified relevant data patterns automatically
- **Contextual Extraction**: AI understood the meaning behind different page elements

### 💡 Technical Insights
- **Page Elements Analyzed**: ${page.pageInfo?.totalElements || 'N/A'}
- **Content Length**: ${page.pageInfo?.bodyTextLength || 'N/A'} characters
- **Available Link Types**: ${page.pageInfo?.availableLinks?.length || 0} different link patterns
- **AI Guidance Quality**: ${aiGuidance ? 'High-quality strategic analysis' : 'Basic extraction'}

The complete extraction process, AI analysis, and raw data are available in the **AI Scraper Report** sidebar. This system combines the power of large language models with advanced web scraping for intelligent, context-aware data extraction.`,
      timestamp: Date.now(),
      sources: [{
        title: `AI-Scraped Data - ${data.extractedData.length} Items`,
        url: url,
        snippet: `Successfully extracted ${data.extractedData.length} items using AI-guided analysis`
      }]
    };
    
    addMessage(assistantMessage);
  };

  const handleSendMessage = async (content: string, mode: ChatMode = 'standard', file: File | null = null) => {
    if (!content.trim() && !file) return;
    
    // Check if this is a scraping request
    const isScrapingRequest = content.toLowerCase().includes('scrape system:') || 
                              content.toLowerCase().includes('@scraper') ||
                              content.toLowerCase().includes('@scrape') ||
                              (selectedRAGProvider === 'fetch-mcp' && (
                                content.toLowerCase().includes('analyse') ||
                                content.toLowerCase().includes('extract') ||
                                content.toLowerCase().includes('scrape')
                              ));
    
    if (isScrapingRequest) {
      return handleScrapingRequest(content);
    }
    
    // Reset le fichier sélectionné après utilisation
    const currentFile = file || selectedFile;
    setSelectedFile(null);
    
    // Création du message utilisateur avec le fichier joint si présent
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
      mode: mode,
    };
    
    // Joindre le fichier au message si présent
    if (currentFile) {
      userMessage.attachedFile = {
        name: currentFile.name,
        size: currentFile.size,
        type: currentFile.type || 'unknown',
        content: ''  // Le contenu sera ajouté ci-dessous si c'est un fichier texte
      };
      console.log("Message avec fichier attaché:", userMessage);
    }
    
    // Ajouter le message utilisateur à la conversation
    addUserMessage(content, mode, userMessage.attachedFile);
    setLoading(true);
    
    // PAS de message assistant temporaire - on attend la vraie réponse
    
    try {
      // Récupérer l'objet modèle complet
      const modelObject = getModelById(modelId);
      
      if (!modelObject) {
        throw new Error('Modèle non trouvé. Veuillez sélectionner un modèle valide.');
      }
      
      // Préparer les messages pour l'API
      const messagesForAPI = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content
      }));
      
      // Traitement spécial pour les fichiers
      if (currentFile) {
        // Extensions de fichiers texte reconnues
        const textExtensions = ['.txt', '.md', '.js', '.jsx', '.ts', '.tsx', '.json', '.css', 
                               '.html', '.xml', '.csv', '.yml', '.yaml', '.py', '.java', '.c', 
                               '.cpp', '.cs', '.php', '.rb', '.go', '.rs', '.sql'];
        
        const fileExtension = `.${currentFile.name.split('.').pop()?.toLowerCase()}`;
        
        // Vérifier si c'est un fichier texte
        const isTextFile = currentFile.type.includes('text') || textExtensions.includes(fileExtension);
        
        // Vérifier si c'est un PDF
        const isPDF = currentFile.type === 'application/pdf' || fileExtension === '.pdf';
        
        // Nouveau: Vérifier si c'est une image ou vidéo
        const isImage = isImageFile(currentFile);
        const isVideo = isVideoFile(currentFile);
        
        if (isTextFile) {
          try {
            // Lire le contenu du fichier texte
            const fileContent = await currentFile.text();
            
            // Mettre à jour la propriété content dans attachedFile
            if (userMessage.attachedFile) {
              userMessage.attachedFile.content = fileContent;
            }
            
            // Ajouter un message système avec le contenu du fichier
            messagesForAPI.push({
              role: 'system',
              content: `Fichier: ${currentFile.name}\n\nContenu:\n${fileContent}\n\nVeuillez analyser ce fichier en fonction de la demande de l&apos;utilisateur.`
            });
          } catch (error) {
            console.error('Erreur lors de la lecture du fichier:', error);
          }
        }
        // Nouveau: Traitement des fichiers PDF
        else if (isPDF) {
          try {
            // Convertir le PDF en base64
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve, reject) => {
              reader.onload = () => {
                const result = reader.result as string;
                // Extraire seulement la partie base64 (après la virgule)
                const base64 = result.split(',')[1] || result;
                resolve(base64);
              };
              reader.onerror = reject;
              reader.readAsDataURL(currentFile);
            });
            
            const pdfBase64 = await base64Promise;
            
            // Mettre à jour la propriété content dans attachedFile
            if (userMessage.attachedFile) {
              userMessage.attachedFile.content = `PDF en base64 (${(pdfBase64.length / 1024).toFixed(2)} KB)`;
            }
            
            // Pour les modèles multimodaux, envoyer le PDF en base64
            // Le modèle pourra extraire et lire le texte du PDF
            messagesForAPI.push({
              role: 'system',
              content: `L'utilisateur a joint un fichier PDF: ${currentFile.name} (${(currentFile.size / 1024).toFixed(2)} KB).\n\nContenu PDF en base64:\n${pdfBase64}\n\nVeuillez extraire et analyser le contenu de ce PDF pour répondre aux questions de l'utilisateur.`
            });
            
            console.log(`PDF "${currentFile.name}" converti en base64 et ajouté aux messages (${(pdfBase64.length / 1024).toFixed(2)} KB)`);
          } catch (error) {
            console.error('Erreur lors de la lecture du PDF:', error);
            messagesForAPI.push({
              role: 'system',
              content: `Erreur lors de la lecture du fichier PDF: ${currentFile.name}. L'utilisateur a joint un PDF mais son contenu n'a pas pu être extrait.`
            });
          }
        } 
        // Nouveau: Traitement des images
        else if (isImage || isVideo) {
          try {
            if (isImage) {
              // Pour les images, créer à la fois la description et récupérer le base64
              const imageContent = await createImageContentWithBase64(currentFile);
              
              // Mettre à jour la propriété content dans attachedFile pour les métadonnées
              if (userMessage.attachedFile) {
                userMessage.attachedFile.content = imageContent.description;
              }
              
              // Créer un message système formaté en JSON stringifié pour supporter la vision
              messagesForAPI.push({
                role: 'system',
                content: `L&apos;utilisateur a joint une image: ${currentFile.name}\n\nDescription: ${imageContent.description}\n\nImage base64: ${imageContent.base64.substring(0, 50)}...\n\nVeuillez analyser cette image et répondre aux questions de l&apos;utilisateur.`
              });
            } else {
              // Pour les vidéos, utiliser seulement les métadonnées pour l'instant
              const mediaDescription = await createMediaDescription(currentFile);
              
              // Mettre à jour la propriété content dans attachedFile pour les métadonnées
              if (userMessage.attachedFile) {
                userMessage.attachedFile.content = mediaDescription;
              }
              
              // Ajouter un message système avec la description de la vidéo
              messagesForAPI.push({
                role: 'system',
                content: `Vidéo jointe: ${currentFile.name}\n\n${mediaDescription}\n\nVeuillez analyser ces métadonnées de la vidéo en fonction de la demande de l&apos;utilisateur.`
              });
            }
          } catch (error) {
            console.error('Erreur lors du traitement du fichier multimédia:', error);
            
            // En cas d'erreur, ajouter un message système d'erreur
            messagesForAPI.push({
              role: 'system',
              content: `Une erreur s'est produite lors du traitement du fichier multimédia: ${currentFile.name}. Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
            });
          }
        }
        else {
          // Pour les autres types de fichiers (Word, Excel, PowerPoint, etc.)
          // Les convertir en base64 pour que les modèles multimodaux puissent les traiter
          try {
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve, reject) => {
              reader.onload = () => {
                const result = reader.result as string;
                // Extraire seulement la partie base64 (après la virgule)
                const base64 = result.split(',')[1] || result;
                resolve(base64);
              };
              reader.onerror = reject;
              reader.readAsDataURL(currentFile);
            });
            
            const fileBase64 = await base64Promise;
            
            // Mettre à jour la propriété content dans attachedFile
            if (userMessage.attachedFile) {
              userMessage.attachedFile.content = `Fichier en base64 (${(fileBase64.length / 1024).toFixed(2)} KB)`;
            }
            
            // Déterminer le type de fichier pour donner des instructions appropriées
            let fileTypeDescription = 'document';
            if (currentFile.type.includes('word') || fileExtension === '.docx' || fileExtension === '.doc') {
              fileTypeDescription = 'document Word';
            } else if (currentFile.type.includes('excel') || currentFile.type.includes('spreadsheet') || fileExtension === '.xlsx' || fileExtension === '.xls') {
              fileTypeDescription = 'fichier Excel/tableur';
            } else if (currentFile.type.includes('powerpoint') || currentFile.type.includes('presentation') || fileExtension === '.pptx' || fileExtension === '.ppt') {
              fileTypeDescription = 'présentation PowerPoint';
            } else if (fileExtension === '.zip' || fileExtension === '.rar' || fileExtension === '.7z') {
              fileTypeDescription = 'archive compressée';
            }
            
            // Envoyer le fichier en base64 avec des instructions claires
            messagesForAPI.push({
              role: 'system',
              content: `L'utilisateur a joint un ${fileTypeDescription}: ${currentFile.name} (${currentFile.type || 'type inconnu'}, ${(currentFile.size / 1024).toFixed(2)} KB).\n\nContenu du fichier en base64:\n${fileBase64}\n\nVeuillez analyser le contenu de ce fichier pour répondre aux questions de l'utilisateur. Si vous pouvez extraire du texte ou des données structurées de ce fichier, faites-le.`
            });
            
            console.log(`Fichier "${currentFile.name}" (${fileTypeDescription}) converti en base64 et ajouté aux messages (${(fileBase64.length / 1024).toFixed(2)} KB)`);
          } catch (error) {
            console.error('Erreur lors de la lecture du fichier:', error);
            // En cas d'erreur, ajouter quand même une indication du fichier
            messagesForAPI.push({
              role: 'system',
              content: `L'utilisateur a joint un fichier: ${currentFile.name} (${currentFile.type || 'type inconnu'}). Taille: ${(currentFile.size / 1024).toFixed(2)} KB. Le contenu du fichier n'a pas pu être extrait, mais l'utilisateur souhaite probablement des informations à son sujet.`
            });
          }
        }
      }
      
      // Récupérer les clés API depuis le localStorage
      const openRouterKey = localStorage.getItem('tetika-openrouter-key') || '';
      const notdiamondKey = localStorage.getItem('tetika-notdiamond-key') || '';
      const serpapiKey = localStorage.getItem('tetika-serpapi-key') || '';
      
      const apiKeys = {
        openrouter: openRouterKey,
        notdiamond: notdiamondKey,
        serpapi: serpapiKey
      };
      
      console.log('Envoi au modèle:', modelObject.name, 'mode:', mode, 'avec fichier:', currentFile?.name);
      
      // Utiliser le service de chat pour envoyer le message
      const data = await chatService.sendMessage(
        messagesForAPI,
        modelObject,
        mode,
        apiKeys,
        selectedRAGProvider,
        !!currentFile
      );
      
      // Déterminer le mode réel en fonction de si le RAG a été activé automatiquement
      const responseMode = data.autoActivatedRAG ? 'rag' : mode;
      
      // Si le RAG a été activé automatiquement, mettre à jour l'état
      if (data.autoActivatedRAG) {
        setRagMode(true);
      }
      
      // Ajouter le message assistant avec la réponse complète
      // Le hook validera automatiquement que le contenu n'est pas vide
      const assistantMessage = addAssistantMessage(
        data.message,
        modelId,
        responseMode,
        data.sources ? data.sources.map((source: { 
          title: string; 
          url: string; 
          snippet: string; 
          position?: number 
        }) => ({
          title: source.title,
          link: source.url,
          url: source.url,
          snippet: source.snippet,
          position: source.position
        })) : [],
        data.autoActivatedRAG
      );
      
      if (!assistantMessage) {
        throw new Error('Impossible de créer le message assistant - contenu vide');
      }
    } catch (err) {
      // Gestion des erreurs améliorée
      const isUserCancellation = 
        (err instanceof DOMException && err.name === 'AbortError') || 
        (err instanceof Error && (
          err.name === 'AbortError' || 
          err.message.includes('annulée') ||
          err.message.includes('canceled') ||
          err.message.includes('cancelled') ||
          err.message === 'Demande annulée par l\'utilisateur'
        ));
      
      if (isUserCancellation) {
        console.log('✓ Génération arrêtée par l\'utilisateur');
        return;
      }
      
      // Pour les autres erreurs, afficher un message à l'utilisateur
      console.error('Erreur lors de l\'obtention de la réponse IA:', err);
      
      const errorContent = err instanceof Error 
        ? err.message 
        : 'Une erreur inconnue s\'est produite';
      
      // Formater le message d'erreur avec un préfixe approprié
      // Si l'erreur contient déjà des suggestions (💡), ne pas ajouter de texte supplémentaire
      const formattedError = errorContent.includes('💡') 
        ? errorContent 
        : `❌ **Erreur**\n\n${errorContent}\n\nVeuillez réessayer ou choisir un autre modèle.`;
      
      // Ajouter un message d'erreur
      addAssistantMessage(
        formattedError,
        modelId,
        mode
      );
    } finally {
      setLoading(false);
    }
  };
    // Fonction pour arrêter la génération de la réponse
  const handleStopGeneration = useCallback(() => {
    console.log('Arrêt de la génération de la réponse');
    try {
      chatService.cancelRequest();
    } catch (err) {
      console.log('Erreur lors de l\'annulation de la requête:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fonction pour régénérer une réponse
  const handleRegenerateResponse = async () => {
    if (messages.length < 2) return;
    
    // Trouver le dernier message utilisateur
    let lastUserMessageIndex = messages.length - 1;
    while (lastUserMessageIndex >= 0 && messages[lastUserMessageIndex].role !== 'user') {
      lastUserMessageIndex--;
    }
    
    if (lastUserMessageIndex < 0) return;
    
    // Récupérer le dernier message utilisateur
    const lastUserMessage = messages[lastUserMessageIndex];
    
    // Supprimer tous les messages après ce message utilisateur
    truncateMessagesAfter(lastUserMessageIndex);
    
    // Réenvoyer le message pour générer une nouvelle réponse
    const mode = lastUserMessage.mode as ChatMode || 'standard';
    
    await handleSendMessage(lastUserMessage.content, mode);
  };
  
  const handleModelChange = (newModelId: string) => {
    setModelId(newModelId);
    setIsModelSelectorOpen(false);
  };
    const handleClearChat = () => {
    // Crée une nouvelle conversation et efface les messages
    clearChatMessages(); // Utiliser la fonction du hook
    setActiveConversationId(null);
    // RAG suggestions code removed
  };

  // Ajout de la fonction pour purger tout l'historique
  const handlePurgeAllHistory = () => {
    // Effacer toutes les conversations du stockage
    setConversations([]);
    setActiveConversationId(null);
    clearChatMessages(); // Utiliser la fonction du hook
    
    // Effacer également du localStorage
    try {
      localStorage.removeItem('tetika-conversations');
    } catch (error) {
      console.error('Erreur lors de la suppression des conversations:', error);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
    const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
  };
  
  const handleCreateNewConversation = () => {
    handleClearChat();
  };
    // Fonction pour gérer les clics sur les suggestions RAG - supprimée
  
  // Fonction spécifique pour gérer le bouton hamburger (sandwich) sur mobile
  const handleMobileMenuButtonClick = () => {
    console.log('Bouton hamburger cliqué, état actuel:', { isSidebarCollapsed });
    
    if (isMobile) {
      // Sur mobile, on force l'affichage de la sidebar
      setShowSidebar(true);
      // On s'assure que la sidebar n'est pas collapsée (pour qu'elle soit visible)
      setIsSidebarCollapsed(false);
      console.log('Sidebar mobile ouverte');
    } else {
      // Sur desktop, on bascule simplement la visibilité
      setShowSidebar(!showSidebar);
    }
  };

  const handleStartNewConversation = (mode: ChatMode) => {
    handleClearChat();    // Force le démarrage d'une nouvelle conversation avec le mode sélectionné
    // La chaîne vide comme premier message ne sera pas affichée à l'utilisateur
    // mais permettra d'initialiser le mode
    setRagMode(mode === 'rag');
    handleSendMessage("Bonjour TETIKA, peux-tu m&apos;aider ?", mode);
  };

  const themeClasses = theme === 'dark' 
    ? 'bg-gray-900 text-white' 
    : 'bg-gray-100 text-gray-800';
  
  const headerClasses = theme === 'dark'
    ? 'border-gray-800 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900'
    : 'border-gray-200 bg-gradient-to-r from-white via-gray-100 to-white';
  
  const emptyStateClasses = theme === 'dark'
    ? 'text-gray-400'
    : 'text-gray-500';
  
  // Get display name for the current model
  const currentModelName = getModelById(modelId)?.name || modelId;
  
  return (
    <CodeSidebarContext.Provider value={{ 
      showCodeSidebar, 
      setShowCodeSidebar, 
      sidebarCode, 
      setSidebarCode 
    }}>      <div className={`flex flex-col h-screen transition-colors duration-300 ${themeClasses}`}>        {/* Component to check if the browser supports speech synthesis */}
        <SpeechSynthesisCheck />
        {/* Bouton de paramètres */}
        <SettingsButton />
          {/* MCP Agent Button - Positioned to avoid header conflicts */}
        <div className="fixed top-16 right-4 z-20">
          <button
            onClick={() => window.open('/mcp-agent', '_blank')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 hover:scale-105 border shadow-lg
              ${theme === 'dark' 
                ? 'bg-purple-900/90 backdrop-blur-sm border-purple-600/50 text-purple-200 hover:bg-purple-800/95 hover:border-purple-500' 
                : 'bg-purple-50/90 backdrop-blur-sm border-purple-200 text-purple-700 hover:bg-purple-100/95 hover:border-purple-300'}`}
            title="Ouvrir l'Agent MCP - Tâches autonomes complexes"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span className="text-sm font-medium hidden sm:inline">Agent MCP</span>
            <span className="text-xs font-medium sm:hidden">MCP</span>
            <div className={`w-2 h-2 rounded-full animate-pulse
              ${theme === 'dark' ? 'bg-purple-400' : 'bg-purple-500'}`}></div>
          </button>
        </div>
        {/* Header with model selector - now fixed at the top */}
        <div className={`sticky top-0 z-20 flex items-center justify-between px-2 py-2 border-b transition-all duration-300 ${headerClasses} backdrop-blur shadow-lg`}>
          <div className="flex items-center gap-2.5">
            {/* Mobile logo & menu button in a container */}
            <div className="flex items-center gap-3 relative">
              {/* Menu button with proper spacing and positioning */}
              <button
                onClick={handleMobileMenuButtonClick}
                className={`flex items-center justify-center p-1 rounded-md hover:bg-gray-800/20 transition-all duration-300
                  ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`}
                title={showSidebar ? "Masquer l&apos;historique" : "Afficher l&apos;historique"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d={showSidebar 
                      ? "M4 6h16M4 12h16M4 18h7" 
                      : "M4 6h16M4 12h16M4 18h16"} 
                  />
                </svg>
              </button>

              {/* Logo - always visible with responsive variants */}
              <div className="relative flex items-center ml-1.5">
                {/* Desktop logo */}
                <h1 className="hidden sm:block text-xl font-bold">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">TETIKA</span> AI
                </h1>
                
                {/* Mobile logo - just T letter with proper spacing */}
                <h1 className="block sm:hidden text-xl font-bold">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">T</span>
                </h1>
                
                <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
              </div>
              
              {/* Beta badge */}
              <span className="text-xs bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-1.5 py-0.5 rounded-full shadow-lg shadow-blue-500/20">Beta</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-3">
            <button 
              onClick={toggleTheme}
              className={`p-1 rounded-full hover:bg-gray-800/20 transition-all duration-300 hover:scale-110 hover:shadow-lg`}
              title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            
            <button 
              onClick={handleClearChat}
              className={`px-2 py-1 rounded-lg text-xs transition-all duration-300 hover:shadow-lg hover:scale-105 flex items-center gap-1
                ${theme === 'dark' 
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700 border border-gray-300'}`}
              title="Effacer la conversation"
            >              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden md:inline">Nouvelle conversation</span>
            </button>
              <button
              className={`px-2 py-1 rounded-lg text-xs transition-all duration-300 shadow-lg hover:scale-105 flex items-center gap-1
                ${theme === 'dark' 
                  ? 'bg-gradient-to-r from-blue-600/30 to-cyan-600/30 hover:from-blue-600/40 hover:to-cyan-600/40 text-blue-300 border border-blue-800' 
                  : 'bg-gradient-to-r from-blue-100 to-cyan-100 hover:from-blue-200 hover:to-cyan-200 text-blue-700 border border-blue-200'}`}
              onClick={() => setIsModelSelectorOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div className="flex flex-col items-start leading-tight">
                <span className="hidden md:inline text-xs">Changer de modèle</span>
                <span className={`text-xs font-medium truncate max-w-[120px] ${theme === 'dark' ? 'text-cyan-200' : 'text-blue-800'}`}>
                  {currentModelName}
                </span>
              </div>
            </button><button
              onClick={() => setShowFileUploader(true)}
              className={`px-2 py-1 rounded-lg text-xs transition-all duration-300 shadow-lg hover:scale-105 flex items-center gap-1
                ${theme === 'dark' 
                  ? 'bg-gradient-to-r from-green-600/30 to-teal-600/30 hover:from-green-600/40 hover:to-teal-600/40 text-green-300 border border-green-800' 
                  : 'bg-gradient-to-r from-green-100 to-teal-100 hover:from-green-200 hover:to-teal-200 text-green-700 border border-green-200'}`}
            >              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 10l-4-4m0 0l-4 4m4-4v12" />
              </svg>
              <span className="hidden md:inline">Uploader un fichier</span>
              <span className="md:hidden hidden xs:inline">Upload</span>
            </button>

            <button
              onClick={() => window.open('/mcp-agent', '_blank')}
              className={`px-2 py-1 rounded-lg text-xs transition-all duration-300 shadow-lg hover:scale-105 flex items-center gap-1
                ${theme === 'dark' 
                  ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 hover:from-purple-600/40 hover:to-pink-600/40 text-purple-300 border border-purple-800' 
                  : 'bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 text-purple-700 border border-purple-200'}`}
              title="Ouvrir l'interface MCP Agent"
            >              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="hidden md:inline">MCP Agent</span>
              <span className="md:hidden hidden xs:inline">MCP</span>
            </button>
          </div>
        </div>
        
        {/* Main content area with sidebar and chat */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          {showSidebar && (
            <HistorySidebar
              conversations={conversations.map(conv => ({
                id: conv.id,
                title: conv.title,
                messages: conv.messages,
                date: new Date(conv.updatedAt)
              }))}
              activeConversationId={activeConversationId}
              onSelectConversation={handleSelectConversation}
              onCreateNewConversation={handleCreateNewConversation}
              onPurgeAllHistory={handlePurgeAllHistory}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              theme={theme}
              isCollapsed={isSidebarCollapsed}
            />
          )}
          
          {/* Main Chat Area - ajustement dynamique en fonction de l'état du code sidebar */}
          <div 
            className={`relative flex flex-col flex-grow h-full overflow-hidden transition-all duration-300 ease-in-out
              ${showCodeSidebar ? 'md:max-w-[calc(100%-55%)] lg:max-w-[calc(100%-45%)] xl:max-w-[calc(100%-38%)]' : 'w-full'}`}
          >            {/* Chat messages container */}
            <div 
              ref={chatContainerRef}
              className={`flex-grow overflow-y-auto pt-8 pb-14 sm:pb-16 md:pb-10 px-3 sm:px-6 transition-all duration-300
                ${theme === 'dark' 
                  ? 'bg-gradient-to-b from-gray-950 to-gray-900 bg-mesh-pattern' 
                  : 'bg-gradient-to-b from-gray-50 to-white bg-mesh-pattern-light'}`}
              style={{
                backgroundImage: theme === 'dark' 
                  ? 'radial-gradient(circle at 1px 1px, rgba(44, 82, 130, 0.1) 1px, transparent 0)'
                  : 'radial-gradient(circle at 1px 1px, rgba(37, 99, 235, 0.05) 1px, transparent 0)',
                backgroundSize: '40px 40px'
              }}
            >
              <div className="max-w-4xl mx-auto">
                {messages.length === 0 ? (
                  <div className={`flex flex-col items-center justify-center h-64 ${emptyStateClasses}`}>
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-3 shadow-lg
                      ${theme === 'dark' 
                        ? 'bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-800/30' 
                        : 'bg-gradient-to-br from-blue-100 to-cyan-100 border border-blue-200'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-medium mb-2">
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">TETIKA</span> Chat
                    </h2>
                    <p className="mb-1">Commencez une nouvelle conversation</p>
                    <div className="flex flex-col items-center mt-4 gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartNewConversation('standard')}
                          className={`rounded-md px-3 py-1.5 text-sm font-medium shadow transition-all hover:scale-105
                          ${theme === 'dark' 
                            ? 'bg-gray-800 text-white border border-gray-700 hover:bg-gray-700' 
                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}>
                          Mode standard
                        </button>
                        <span>ou</span>
                        <button
                          onClick={() => handleStartNewConversation('rag')}
                          className={`rounded-md px-3 py-1.5 text-sm font-medium shadow-md transition-all hover:scale-105
                          ${theme === 'dark' 
                            ? 'bg-gradient-to-r from-blue-900/40 to-cyan-900/40 text-blue-300 border border-blue-800/40 hover:from-blue-900/60 hover:to-cyan-900/60' 
                            : 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200 hover:from-blue-200 hover:to-cyan-200'}`}>
                          Mode RAG (recherche web)
                        </button>
                      </div>                      <span className="text-xs mt-2 opacity-75">Activer la recherche web pour des réponses enrichies avec des sources</span>
                      
                      {/* MCP Agent Showcase Section */}
                      <div className={`mt-8 w-full max-w-lg rounded-lg p-4 transition-all border-2
                        ${theme === 'dark' 
                          ? 'bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border-purple-600/30' 
                          : 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200/50'}`}>
                        <div className="flex items-center mb-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3
                            ${theme === 'dark' ? 'bg-purple-600/20' : 'bg-purple-100'}`}>
                            <svg className={`w-4 h-4 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                          </div>
                          <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-purple-300' : 'text-purple-700'}`}>
                            🚀 Mode Agent MCP - Tâches Autonomes
                          </h3>
                        </div>
                          <p className={`text-xs mb-4 ${theme === 'dark' ? 'text-purple-200/80' : 'text-purple-600/80'}`}>
                          L&apos;Agent MCP peut exécuter des tâches complexes de manière autonome en utilisant plusieurs outils et sources.
                        </p>
                        
                        <div 
                          onClick={() => {
                            window.open('/mcp-agent', '_blank');
                          }}
                          className={`cursor-pointer p-3 rounded-lg transition-all hover:scale-[1.02] transform
                            ${theme === 'dark' 
                              ? 'bg-purple-800/40 border border-purple-700/50 hover:bg-purple-800/60' 
                              : 'bg-white border border-purple-200 hover:bg-purple-50 hover:border-purple-300'}`}>
                          <div className="flex items-start">
                            <div className={`w-6 h-6 rounded flex items-center justify-center mr-3 mt-0.5
                              ${theme === 'dark' ? 'bg-purple-600' : 'bg-purple-500'}`}>
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9,5V9H21V5M9,19H21V15H9M9,14H21V10H9M4,9H8L6,7M4,19H8L6,17M4,14H8L6,12"/>
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-purple-200' : 'text-purple-700'}`}>
                                Analyse de marché IA complète
                              </p>
                              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-purple-300/70' : 'text-purple-600/70'}`}>
                                Recherche + Analyse + Rapport avec graphiques et sources
                              </p>
                              <div className="flex items-center mt-2">
                                <span className={`text-xs px-2 py-1 rounded-full mr-2
                                  ${theme === 'dark' 
                                    ? 'bg-purple-700/60 text-purple-200' 
                                    : 'bg-purple-100 text-purple-700'}`}>
                                  Multi-outils
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full
                                  ${theme === 'dark' 
                                    ? 'bg-indigo-700/60 text-indigo-200' 
                                    : 'bg-indigo-100 text-indigo-700'}`}>
                                  Autonome
                                </span>
                              </div>
                            </div>
                            <div className={`text-xs ${theme === 'dark' ? 'text-purple-400' : 'text-purple-500'}`}>
                              →
                            </div>
                          </div>
                        </div>
                      </div>
                        {/* Exemples de prompts pour démonstration client */}
                      <div className={`mt-8 w-full max-w-lg rounded-lg p-4 transition-all
                        ${theme === 'dark' 
                          ? 'bg-gray-800/60 border border-gray-700/50' 
                          : 'bg-white/80 border border-gray-200/70'}`}>
                        <h3 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>
                          Exemples de prompts pour démo
                        </h3>
                        
                        <div className="space-y-3">
                          {/* Bouton RAG Demo */}
                          <div>
                            <button
                              onClick={() => setShowRagExamples(!showRagExamples)}
                              className={`w-full flex items-center justify-between p-2 rounded-lg transition-all hover:scale-[1.01]
                                ${theme === 'dark' 
                                  ? 'bg-blue-900/40 hover:bg-blue-900/60 border border-blue-800/60 text-blue-200' 
                                  : 'bg-blue-100 hover:bg-blue-200 border border-blue-200 text-blue-700'}`}>
                              <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <span className="font-medium">RAG Demo</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full
                                  ${theme === 'dark' 
                                    ? 'bg-blue-800/60 text-blue-300' 
                                    : 'bg-blue-200 text-blue-700'}`}>
                                  4 exemples
                                </span>
                              </div>
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className={`h-4 w-4 transition-transform ${showRagExamples ? 'rotate-180' : ''}`} 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            
                            {showRagExamples && (
                              <div className="mt-2 space-y-2 pl-4">
                                <div 
                                  onClick={() => {
                                    setRagMode(true);
                                    handleSendMessage("Quelles sont les dernières avancées en matière d&apos;intelligence artificielle générative?", "rag");
                                  }}
                                  className={`cursor-pointer p-2 rounded transition-all hover:scale-[1.01]
                                    ${theme === 'dark' 
                                      ? 'bg-blue-900/30 border border-blue-800/40 hover:bg-blue-900/40' 
                                      : 'bg-blue-50 border border-blue-100 hover:bg-blue-100/70'}`}>
                                  <p className={`text-sm ${theme === 'dark' ? 'text-blue-200' : 'text-blue-700'}`}>
                                    &quot;Quelles sont les dernières avancées en matière d&apos;intelligence artificielle générative?&quot;
                                  </p>
                                  <div className="flex items-center mt-1">
                                    <span className={`text-xs px-1.5 py-0.5 rounded mr-2
                                      ${theme === 'dark' 
                                        ? 'bg-blue-800/60 text-blue-300'
                                        : 'bg-blue-100 text-blue-700'}`}>
                                      RAG
                                    </span>
                                    <span className="text-xs opacity-70">Obtient des informations à jour depuis le web</span>
                                  </div>
                                </div>
                                
                                <div 
                                  onClick={() => {
                                    setRagMode(true);
                                    handleSendMessage("Explique-moi la situation actuelle entre l&apos;Ukraine et la Russie", "rag");
                                  }}
                                  className={`cursor-pointer p-2 rounded transition-all hover:scale-[1.01]
                                    ${theme === 'dark' 
                                      ? 'bg-blue-900/30 border border-blue-800/40 hover:bg-blue-900/40' 
                                      : 'bg-blue-50 border border-blue-100 hover:bg-blue-100/70'}`}>
                                  <p className={`text-sm ${theme === 'dark' ? 'text-blue-200' : 'text-blue-700'}`}>
                                    &quot;Explique-moi la situation actuelle entre l&apos;Ukraine et la Russie&quot;
                                  </p>
                                  <div className="flex items-center mt-1">
                                    <span className={`text-xs px-1.5 py-0.5 rounded mr-2
                                      ${theme === 'dark' 
                                        ? 'bg-blue-800/60 text-blue-300' 
                                        : 'bg-blue-100 text-blue-700'}`}>
                                      RAG
                                    </span>
                                    <span className="text-xs opacity-70">Recherches des infos récentes sur des événements actuels</span>
                                  </div>
                                </div>
                                
                                <div 
                                  onClick={() => {
                                    setRagMode(true);
                                    handleSendMessage("Quelles sont les meilleures pratiques pour développer une application React en 2025?", "rag");
                                  }}
                                  className={`cursor-pointer p-2 rounded transition-all hover:scale-[1.01]
                                    ${theme === 'dark' 
                                      ? 'bg-blue-900/30 border border-blue-800/40 hover:bg-blue-900/40' 
                                      : 'bg-blue-50 border border-blue-100 hover:bg-blue-100/70'}`}>
                                  <p className={`text-sm ${theme === 'dark' ? 'text-blue-200' : 'text-blue-700'}`}>
                                    &quot;Quelles sont les meilleures pratiques pour développer une application React en 2025?&quot;
                                  </p>
                                  <div className="flex items-center mt-1">
                                    <span className={`text-xs px-1.5 py-0.5 rounded mr-2
                                      ${theme === 'dark' 
                                        ? 'bg-blue-800/60 text-blue-300' 
                                        : 'bg-blue-100 text-blue-700'}`}>
                                      RAG
                                    </span>
                                    <span className="text-xs opacity-70">Recherche des informations techniques récentes</span>
                                  </div>
                                </div>
                                
                                <div 
                                  onClick={() => {
                                    setRagMode(true);
                                    handleSendMessage("Quels sont les impacts du changement climatique observés en 2025?", "rag");
                                  }}
                                  className={`cursor-pointer p-2 rounded transition-all hover:scale-[1.01]
                                    ${theme === 'dark' 
                                      ? 'bg-blue-900/30 border border-blue-800/40 hover:bg-blue-900/40' 
                                      : 'bg-blue-50 border border-blue-100 hover:bg-blue-100/70'}`}>
                                  <p className={`text-sm ${theme === 'dark' ? 'text-blue-200' : 'text-blue-700'}`}>
                                    &quot;Quels sont les impacts du changement climatique observés en 2025?&quot;
                                  </p>
                                  <div className="flex items-center mt-1">
                                    <span className={`text-xs px-1.5 py-0.5 rounded mr-2
                                      ${theme === 'dark' 
                                        ? 'bg-blue-800/60 text-blue-300' 
                                        : 'bg-blue-100 text-blue-700'}`}>
                                      RAG
                                    </span>
                                    <span className="text-xs opacity-70">Accède aux données environnementales récentes</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Bouton AGENT MCP Demo */}
                          <div>
                            <button
                              onClick={() => setShowMcpExamples(!showMcpExamples)}
                              className={`w-full flex items-center justify-between p-2 rounded-lg transition-all hover:scale-[1.01]
                                ${theme === 'dark' 
                                  ? 'bg-purple-900/40 hover:bg-purple-900/60 border border-purple-800/60 text-purple-200' 
                                  : 'bg-purple-100 hover:bg-purple-200 border border-purple-200 text-purple-700'}`}>
                              <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="font-medium">AGENT MCP Demo</span>                                <span className={`text-xs px-1.5 py-0.5 rounded-full
                                  ${theme === 'dark' 
                                    ? 'bg-purple-800/60 text-purple-300' 
                                    : 'bg-purple-200 text-purple-700'}`}>
                                  4 exemples
                                </span>
                              </div>
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className={`h-4 w-4 transition-transform ${showMcpExamples ? 'rotate-180' : ''}`} 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                              {showMcpExamples && (
                              <div className="mt-2 space-y-2 pl-4">
                                {/* Exemple 1: Scraping VivaTech */}
                                <div 
                                  onClick={() => {
                                    setRagMode(true);
                                    setSelectedRAGProvider('fetch-mcp');
                                    localStorage.setItem('tetika-rag-provider', 'fetch-mcp');
                                    window.dispatchEvent(new CustomEvent('rag-provider-changed', { 
                                      detail: { providerId: 'fetch-mcp' } 
                                    }));
                                    handleSendMessage("Scrape system: https://vivatechnology.com/partners?hashtags=healthcare%2520%2526%2520wellness je veux la liste des noms d'entreprise dans ce lien", "rag");
                                  }}
                                  className={`cursor-pointer p-2 rounded transition-all hover:scale-[1.01]
                                    ${theme === 'dark' 
                                      ? 'bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-800/40 hover:from-purple-900/40 hover:to-indigo-900/40' 
                                      : 'bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 hover:from-purple-100/70 hover:to-indigo-100/70'}`}>
                                  <p className={`text-sm ${theme === 'dark' ? 'text-purple-200' : 'text-purple-700'}`}>
                                    &quot;Extraire les entreprises de VivaTech avec MCP&quot;
                                  </p>
                                  <div className="flex items-center mt-1">
                                    <span className={`text-xs px-1.5 py-0.5 rounded mr-2
                                      ${theme === 'dark' 
                                        ? 'bg-purple-800/60 text-purple-300' 
                                        : 'bg-purple-100 text-purple-700'}`}>
                                      MCP SCRAPING
                                    </span>
                                    <span className="text-xs opacity-70">Navigation intelligente + extraction structurée</span>
                                  </div>
                                </div>

                                {/* Exemple 2: Recherche d'entreprises */}
                                <div 
                                  onClick={() => {
                                    setRagMode(true);
                                    setSelectedRAGProvider('fetch-mcp');
                                    localStorage.setItem('tetika-rag-provider', 'fetch-mcp');
                                    window.dispatchEvent(new CustomEvent('rag-provider-changed', { 
                                      detail: { providerId: 'fetch-mcp' } 
                                    }));
                                    handleSendMessage("Scrape system: startups françaises dans la fintech avec plus de 50 employés", "rag");
                                  }}
                                  className={`cursor-pointer p-2 rounded transition-all hover:scale-[1.01]
                                    ${theme === 'dark' 
                                      ? 'bg-gradient-to-r from-green-900/30 to-blue-900/30 border border-green-800/40 hover:from-green-900/40 hover:to-blue-900/40' 
                                      : 'bg-gradient-to-r from-green-50 to-blue-50 border border-green-100 hover:from-green-100/70 hover:to-blue-100/70'}`}>
                                  <p className={`text-sm ${theme === 'dark' ? 'text-green-200' : 'text-green-700'}`}>
                                    &quot;Rechercher des startups fintech françaises&quot;
                                  </p>
                                  <div className="flex items-center mt-1">
                                    <span className={`text-xs px-1.5 py-0.5 rounded mr-2
                                      ${theme === 'dark' 
                                        ? 'bg-green-800/60 text-green-300' 
                                        : 'bg-green-100 text-green-700'}`}>
                                      MCP SEARCH
                                    </span>
                                    <span className="text-xs opacity-70">Recherche multi-sources + collecte de données</span>
                                  </div>
                                </div>

                                {/* Exemple 3: Analyse complexe avec scraping */}
                                <div 
                                  onClick={() => {
                                    setRagMode(true);
                                    setSelectedRAGProvider('fetch-mcp');
                                    localStorage.setItem('tetika-rag-provider', 'fetch-mcp');
                                    window.dispatchEvent(new CustomEvent('rag-provider-changed', { 
                                      detail: { providerId: 'fetch-mcp' } 
                                    }));
                                    handleSendMessage("Analyse les startups IA françaises (scraping de sites, LinkedIn, actualités), compare leurs technologies et investissements, puis génère un rapport d'investissement complet avec graphiques et recommandations", "rag");
                                  }}
                                  className={`cursor-pointer p-2 rounded transition-all hover:scale-[1.01]
                                    ${theme === 'dark' 
                                      ? 'bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-800/40 hover:from-orange-900/40 hover:to-red-900/40' 
                                      : 'bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100 hover:from-orange-100/70 hover:to-red-100/70'}`}>                                  <p className={`text-sm ${theme === 'dark' ? 'text-orange-200' : 'text-orange-700'}`}>
                                    &quot;Rapport d&apos;investissement IA avec scraping multi-sources&quot;
                                  </p>
                                  <div className="flex items-center mt-1">
                                    <span className={`text-xs px-1.5 py-0.5 rounded mr-2
                                      ${theme === 'dark' 
                                        ? 'bg-orange-800/60 text-orange-300' 
                                        : 'bg-orange-100 text-orange-700'}`}>
                                      AGENT MCP
                                    </span>
                                    <span className="text-xs opacity-70">Tâche complexe multi-étapes avec outils autonomes</span>
                                  </div>
                                </div>
                                
                                {/* Exemple 4: Agent MCP avancé */}
                                <div 
                                  onClick={() => {
                                    // Navigate to MCP Agent page for this complex task
                                    window.open('/mcp-agent', '_blank');
                                  }}
                                  className={`cursor-pointer p-2 rounded transition-all hover:scale-[1.01]
                                    ${theme === 'dark' 
                                      ? 'bg-purple-900/30 border border-purple-800/40 hover:bg-purple-900/40' 
                                      : 'bg-purple-50 border border-purple-100 hover:bg-purple-100/70'}`}>
                                  <p className={`text-sm ${theme === 'dark' ? 'text-purple-200' : 'text-purple-700'}`}>
                                    &quot;Agent MCP autonome pour tâches complexes&quot;
                                  </p>
                                  <div className="flex items-center mt-1">
                                    <span className={`text-xs px-1.5 py-0.5 rounded mr-2
                                      ${theme === 'dark' 
                                        ? 'bg-purple-800/60 text-purple-300' 
                                        : 'bg-purple-100 text-purple-700'}`}>
                                      MCP AGENT
                                    </span>
                                    <span className="text-xs opacity-70">Navigation vers l&apos;interface MCP dédiée</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Exemple standard (toujours visible) */}
                          <div 
                            onClick={() => {
                              setRagMode(false);
                              handleSendMessage("Rédige un court poème sur l&apos;intelligence artificielle", "standard");
                            }}
                            className={`cursor-pointer p-2 rounded transition-all hover:scale-[1.01]
                              ${theme === 'dark' 
                                ? 'bg-gray-800/80 border border-gray-700/60 hover:bg-gray-800' 
                                : 'bg-gray-50 border border-gray-200 hover:bg-gray-100/70'}`}>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                              &quot;Rédige un court poème sur l&apos;intelligence artificielle&quot;
                            </p>
                            <div className="flex items-center mt-1">
                              <span className={`text-xs px-1.5 py-0.5 rounded mr-2
                                ${theme === 'dark' 
                                  ? 'bg-gray-700 text-gray-300' 
                                  : 'bg-gray-200 text-gray-700'}`}>
                                STD
                              </span>
                              <span className="text-xs opacity-70">Tâche créative sans besoin de données externes</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((message) => {                      // Ensure message sources follow the expected format by the Message component
                      // This fixes the type error between url and link properties
                      const transformedMessage = {
                        ...message,
                        conversationContext: messages.map(m => ({ 
                          role: m.role, 
                          content: m.content 
                        })),
                        sources: message.sources?.map(source => ({
                          title: source.title,
                          link: source.url, // Map url to the link property expected by the Message component
                          url: source.url,  // Keep url for backward compatibility
                          snippet: source.snippet,
                          position: source.position
                        }))
                      };
                        return (                        <MessageComponent 
                          key={message.id} 
                          message={transformedMessage} 
                          theme={theme} 
                          onRegenerateResponse={handleRegenerateResponse}
                          onSuggestionClick={(suggestion) => {
                            setRagMode(true);
                            handleSendMessage(suggestion, 'rag');
                          }}
                        />
                      );
                    })}                    {loading && (
                      <div className={`flex gap-2 items-center ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'} animate-pulse`}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-600/20">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span>TETIKA est en train de réfléchir...</span>
                      </div>                    )}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* Input area - fixed at the bottom with minimal space */}
            <div 
              className={`border-t sticky bottom-0 z-10 transition-all duration-300 ${
                theme === 'dark' 
                  ? 'border-gray-800 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-lg shadow-blue-900/10' 
                  : 'border-gray-200 bg-gradient-to-r from-white via-gray-50 to-white shadow-lg shadow-blue-200/10'
              }`}
            >
              <div className="max-w-4xl mx-auto">                <ChatInput 
                  onSendMessage={handleSendMessage}
                  loading={loading}
                  theme={theme}
                  ragMode={ragMode}
                  selectedRAGProvider={selectedRAGProvider}
                  onRagModeChange={toggleRagMode}
                  onRAGProviderChange={setSelectedRAGProvider}
                  onFileUploadClick={() => setShowFileUploader(true)}
                  selectedFile={selectedFile}
                  onCancelFileUpload={() => setSelectedFile(null)}
                  _previousMessages={messages.map(m => ({ 
                    role: m.role, 
                    content: m.content 
                  }))}
                  onInputFocus={() => {}}
                  onStopGeneration={handleStopGeneration}
                />
              </div>
            </div>
          </div>
            {/* Barre latérale de code */}
          {showCodeSidebar && sidebarCode && (
            <CodeSidebar
              code={sidebarCode.code}
              language={sidebarCode.language}
              fileName={sidebarCode.fileName}
              theme={theme}
              onClose={() => {
                setShowCodeSidebar(false);
                setScrapingMode(false);
                setThinkingSteps([]);
                setScrapingReportData(null);
              }}
              mode={scrapingMode ? 'thinking-process' : 'code'}
              thinkingSteps={thinkingSteps}
              reportData={scrapingReportData}
            />
          )}
        </div>

        {/* Model Selector Modal */}
        {isModelSelectorOpen && (
          <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50 p-4"
              style={{backgroundColor: 'rgba(0,0,0,0.6)'}}>
            <div className={`relative max-w-2xl w-full max-h-[80vh] overflow-y-auto rounded-xl shadow-2xl transform transition-all duration-300
              ${theme === 'dark' 
                ? 'bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700' 
                : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'} p-6`}>
              <button 
                onClick={() => setIsModelSelectorOpen(false)}
                className={`absolute top-4 right-4 p-1 rounded-full transition-all duration-300 hover:scale-110
                  ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'}`}
                title="Fermer"
                aria-label="Fermer la fenêtre de sélection de modèle"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2
                ${theme === 'dark' ? 'text-gradient-blue' : 'text-gradient-blue-light'}`}
                style={{
                  background: theme === 'dark' ? 'linear-gradient(90deg, #60a5fa, #22d3ee)' : 'linear-gradient(90deg, #3b82f6, #0ea5e9)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 24 24" stroke="currentColor"
                    style={{stroke: theme === 'dark' ? '#22d3ee' : '#0ea5e9'}}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Choisir un modèle
              </h2>
              <ModelSelector 
                currentModel={modelId} 
                onModelChange={handleModelChange}
                theme={theme} 
              />
            </div>
          </div>
        )}

        {/* File Uploader Modal */}
        {showFileUploader && (
          <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50 p-4"
              style={{backgroundColor: 'rgba(0,0,0,0.6)'}}>
            <div className={`relative max-w-2xl w-full max-h-[80vh] overflow-y-auto rounded-xl shadow-2xl transform transition-all duration-300
              ${theme === 'dark' 
                ? 'bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700' 
                : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'}`}>
              <FileUploader 
                onFileSelect={(file) => {
                  setSelectedFile(file);
                  setShowFileUploader(false);
                }}
                onClose={() => setShowFileUploader(false)}
                theme={theme}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <Footer theme={theme} />
      </div>
    </CodeSidebarContext.Provider>
  );
};

// Footer component with copyright and links
const Footer: React.FC<{ theme: 'dark' | 'light' }> = ({ theme }) => {
  const currentYear = new Date().getFullYear();
  
  // Vérifier si on est sur mobile
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Version simplifiée pour mobile
  if (isMobile) {
    return (
      <footer className={`w-full py-1.5 text-center text-[10px] border-t ${
        theme === 'dark' 
          ? 'bg-gray-900/60 border-gray-800/50 text-gray-500' 
          : 'bg-white/60 border-gray-200/50 text-gray-400'
      }`}>
        <div className="flex justify-center items-center">
          <span>© {currentYear} Fandresena</span>
        </div>
      </footer>
    );
  }
  
  // Version complète pour desktop
  return (
    <footer className={`w-full py-3 px-4 text-center text-xs border-t ${
      theme === 'dark' 
        ? 'bg-gray-900/80 border-gray-800 text-gray-400' 
        : 'bg-white/80 border-gray-200 text-gray-600'
    }`}>
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4">
        <span>Copyright © {currentYear} <a 
          href="https://github.com/FandresenaR/tetika1" 
          target="_blank" 
          rel="noopener noreferrer"
          className={`font-medium hover:underline ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}
        >
          Fandresena
        </a></span>
        
        <span className="hidden sm:inline">•</span>
        
        <a 
          href="https://github.com/FandresenaR/tetika1" 
          target="_blank" 
          rel="noopener noreferrer"
          className={`hover:underline ${theme === 'dark' ? 'text-gray-400 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'}`}
        >
          <span className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </span>
        </a>
        
        <span className="hidden sm:inline">•</span>
        
        <a 
          href="https://www.linkedin.com/in/njato-rakotoarisoa/" 
          target="_blank" 
          rel="noopener noreferrer"
          className={`hover:underline ${theme === 'dark' ? 'text-gray-400 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'}`}
        >
          <span className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
            LinkedIn
          </span>
        </a>
        
        <span className="hidden sm:inline">•</span>
        
        <a 
          href="/cgu" 
          className={`hover:underline ${theme === 'dark' ? 'text-gray-400 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'}`}
        >
          Conditions générales d&apos;utilisation
        </a>
        
        <span className="hidden sm:inline">•</span>
          <a 
          href="/politique-ia" 
          className={`hover:underline ${theme === 'dark' ? 'text-gray-400 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'}`}
        >
          <span className="flex items-center gap-1">
            Politique IA
            <span className={`text-2xs px-1 py-0.5 rounded-full ${
              theme === 'dark' ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700'
            }`}>
              En vigueur
            </span>
          </span>
        </a>
      </div>
    </footer>
  );
};

export default ChatInterface;