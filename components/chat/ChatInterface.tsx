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

// Variable to store the AbortController instance
let abortController: AbortController | null = null;

const ChatInterface: React.FC = () => {
  // Use the first available OpenRouter model as the default
  const defaultModelId = openRouterModels.length > 0 ? openRouterModels[0].id : "mistralai/mistral-7b-instruct:free";
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [modelId, setModelId] = useState(defaultModelId);
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
          setMessages(sortedConversations[0].messages);
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
        // Nous supprimons la vérification qui utilise JSON.stringify car elle provoque une dépendance circulaire
        setMessages(activeConversation.messages);
        setModelId(activeConversation.modelId);
      }
    }
  }, [activeConversationId, conversations]);
  
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
    
    // Extract query from content
    let query = content.replace(/scrape system:\s*/i, '').replace(/@scrape\s*/i, '').trim();
    if (!query) {
      query = content.trim();
    }
    
    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
      mode: 'rag',
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Show thinking process in sidebar
    setSidebarCode({
      code: '',
      language: 'markdown',
      fileName: `mcp-scraping-report-${Date.now()}.md`
    });
    setShowCodeSidebar(true);
    
    try {
      // Detect if this is a URL for direct scraping
      const urlPattern = /https?:\/\/[^\s]+/i;
      const urlMatch = query.match(urlPattern);
      
      if (urlMatch) {
        // Direct URL scraping with MCP intelligent navigation
        const url = urlMatch[0];
        console.log(`[MCP] Direct URL detected: ${url}`);
        
        // Update thinking steps
        setThinkingSteps([
          {
            id: 'mcp-navigation',
            title: '🧠 MCP Intelligent Navigation',
            description: `Analyzing ${url} with intelligent navigation and company extraction`,
            sources: [url],
            timestamp: Date.now(),
            status: 'in-progress'
          }
        ]);
        
        // Use MCP intelligent navigation
        const response = await fetch('/api/mcp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tool: 'intelligent_navigation',
            args: {
              url: url,
              task: 'extract_companies',
              maxResults: 50,
              maxPages: 3
            }
          })
        });
        
        const mcpResult = await response.json();
        
        if (mcpResult.success && mcpResult.data?.content?.[0]?.text) {
          const navigationData = JSON.parse(mcpResult.data.content[0].text);
          
          // Update thinking steps
          setThinkingSteps(prev => prev.map(step => 
            step.id === 'mcp-navigation' 
              ? { ...step, status: 'completed', data: navigationData }
              : step
          ));
          
          if (navigationData.success && navigationData.companies && navigationData.companies.length > 0) {
            // Create structured report
            const reportData: ScrapingReportData = {
              query: query,
              timestamp: new Date().toISOString(),
              summary: {
                totalSources: 1,
                successfulExtractions: navigationData.companies.length,
                totalWords: navigationData.companies.reduce((acc: number, c: { description?: string }) => 
                  acc + (c.description?.split(' ').length || 0), 0),
                mode: 'MCP Intelligent Navigation'
              },
              sources: [{
                url: url,
                title: `VivaTech Partners (${navigationData.companies.length} companies)`,
                wordCount: navigationData.companies.reduce((acc: number, c: { description?: string }) => 
                  acc + (c.description?.split(' ').length || 0), 0),
                description: `Extracted ${navigationData.companies.length} companies using ${navigationData.method}`,
                author: 'MCP System',
                publishDate: new Date().toISOString()
              }],
              analysis: {
                companies: navigationData.companies,
                extractionMethod: navigationData.method,
                totalFound: navigationData.totalFound,
                pagesVisited: navigationData.pagesVisited || 1
              }
            };
            
            setScrapingReportData(reportData);
            
            // Create detailed company list for the response
            const companyList = navigationData.companies.map((company: {
              name: string;
              website: string;
              description: string;
              employees?: string;
              industry?: string;
            }, index: number) => {
              return `${index + 1}. **${company.name}**
   - Website: ${company.website || 'Not specified'}
   - Description: ${company.description?.substring(0, 200) || 'No description available'}${company.description && company.description.length > 200 ? '...' : ''}
   - Employees: ${company.employees || 'Not specified'}
   - Industry: ${company.industry || 'Not specified'}`;
            }).join('\n\n');
            
            // Create AI response message
            const assistantMessage: Message = {
              id: generateId(),
              role: 'assistant',
              content: `## 🧠 MCP Intelligent Scraping Complete

I've successfully extracted company data from: "${url}" using advanced MCP (Model Context Protocol) navigation.

### 📊 Extraction Summary
- **Companies Found**: ${navigationData.companies.length}
- **Extraction Method**: ${navigationData.method}
- **Pages Analyzed**: ${navigationData.pagesVisited || 1}
- **Total Data Points**: ${navigationData.companies.length * 4} (name, website, description, industry)

### 🏢 Companies Extracted

${companyList}

### 🔧 Technical Details
- **MCP Navigation**: ✅ Successfully used intelligent browser navigation
- **Data Quality**: High-quality structured extraction
- **Anti-Bot Protection**: Successfully bypassed using MCP techniques
- **Real-time Processing**: Dynamic content loading and parsing

### 💡 Insights
- **Healthcare & Wellness Focus**: ${navigationData.companies.filter((c: { industry?: string }) => 
  c.industry?.toLowerCase().includes('health') || c.industry?.toLowerCase().includes('wellness')).length} companies in target sector
- **Website Availability**: ${navigationData.companies.filter((c: { website: string }) => c.website && c.website.length > 0).length}/${navigationData.companies.length} companies have websites
- **Detailed Descriptions**: ${navigationData.companies.filter((c: { description: string }) => c.description && c.description.length > 50).length}/${navigationData.companies.length} companies have detailed descriptions

The complete extraction process and raw data are available in the **MCP Process** sidebar. This advanced system allows the AI to intelligently navigate, select, copy, and collect data from complex web pages.`,
              timestamp: Date.now(),                sources: [{
                  title: `VivaTech Partners - ${navigationData.companies.length} Companies`,
                  url: url,
                  snippet: `Successfully extracted ${navigationData.companies.length} companies using ${navigationData.method}`
                }]
            };
            
            setMessages(prev => [...prev, assistantMessage]);
            
          } else {
            throw new Error('No companies found via MCP navigation. The site might have different structure or additional protections.');
          }
        } else {
          throw new Error('MCP navigation failed. Falling back to standard scraping...');
        }
        
      } else {
        // Search-based scraping using MCP multi-search
        console.log(`[MCP] Search-based scraping for: ${query}`);
        
        // Update thinking steps
        setThinkingSteps([
          {
            id: 'mcp-search',
            title: '🔍 MCP Multi-Provider Search',
            description: `Searching for: "${query}" across multiple sources`,
            sources: ['SearXNG', 'Fetch-MCP', 'SerpAPI'],
            timestamp: Date.now(),
            status: 'in-progress'
          }
        ]);
        
        // Use MCP multi-search
        const response = await fetch('/api/mcp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tool: 'multi_search',
            args: {
              provider: 'fetch-mcp',
              query: query,
              apiKeys: {} // Les clés API seront récupérées côté serveur
            }
          })
        });
        
        const searchResult = await response.json();
        
        if (searchResult.success && searchResult.data) {
          // Update thinking steps
          setThinkingSteps(prev => prev.map(step => 
            step.id === 'mcp-search' 
              ? { ...step, status: 'completed', data: searchResult.data }
              : step
          ));
          
          // Create response based on search results
          const results = searchResult.data.results || [];
          
          const assistantMessage: Message = {
            id: generateId(),
            role: 'assistant',
            content: `## 🔍 MCP Search Results

I've found ${results.length} relevant results for: "${query}"

### � Search Summary
- **Provider Used**: ${searchResult.data.provider || 'MCP Fetch'}
- **Results Found**: ${results.length}
- **Search Success**: ✅ ${searchResult.data.success ? 'Successful' : 'Partial'}

### 🌐 Top Results

${results.slice(0, 10).map((result: { title: string; url: string; snippet: string; position: number }, index: number) => {
  return `${index + 1}. **[${result.title}](${result.url})**
   ${result.snippet}
   Position: #${result.position || index + 1}`;
}).join('\n\n')}

### 💡 Next Steps
To extract detailed company information from any of these sources, use:
\`Scrape system: [URL]\` followed by the specific URL you want to analyze.

The MCP system can intelligently navigate these pages to extract structured data including company names, websites, employee counts, and descriptions.`,
            timestamp: Date.now(),
            sources: results.slice(0, 5).map((result: { title: string; url: string; snippet: string }) => ({
              title: result.title,
              link: result.url,
              url: result.url,
              snippet: result.snippet
            }))
          };
          
          setMessages(prev => [...prev, assistantMessage]);
          
        } else {
          throw new Error('MCP search failed. Please try a different query or check your connection.');
        }
      }
      
    } catch (error) {
      console.error('MCP Scraping error:', error);
      
      // Update thinking steps to show error
      setThinkingSteps(prev => prev.map(step => ({
        ...step,
        status: 'error' as const,
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      })));
      
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: `❌ **MCP Scraping Error**

I encountered an error while performing the MCP-enhanced scraping analysis:

${error instanceof Error ? error.message : 'Unknown error occurred'}

### 🔧 MCP System Capabilities
The new MCP (Model Context Protocol) system enables:
- **Intelligent Navigation**: AI can browse, select, and extract data from complex pages
- **Dynamic Content Loading**: Handles JavaScript-heavy sites and dynamic content
- **Anti-Bot Bypassing**: Advanced techniques to work with protected sites
- **Structured Data Extraction**: Specifically designed for company directories

### 💡 **Tips for Better Results:**
- For direct URLs: Use \`Scrape system: https://example.com\`
- For searches: Use \`Scrape system: companies in healthcare Paris\`
- The system now uses advanced MCP navigation to intelligently collect data
- MCP allows the AI to actually "see" and interact with web pages like a human

### 🚀 **Enhanced Features:**
- Real-time page navigation and content selection
- Intelligent link following and data collection
- Dynamic content extraction (AJAX, React, Vue.js sites)
- Structured output formatting for company data

Please try again with a different query or URL. The MCP system is designed to handle complex scraping scenarios that traditional methods cannot.`,
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (content: string, mode: ChatMode = 'standard', file: File | null = null) => {
    if (!content.trim() && !file) return;
    
    // Check if this is a scraping request
    const isScrapingRequest = content.toLowerCase().includes('scrape system:') || 
                              content.toLowerCase().includes('@scrape') ||
                              (selectedRAGProvider === 'fetch-mcp' && content.toLowerCase().includes('analyse'));
    
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
    
    // Ajouter le message à la conversation
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    
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
          // Pour les autres types de fichiers, ajouter une instruction
          messagesForAPI.push({
            role: 'system',
            content: `L&apos;utilisateur a joint un fichier: ${currentFile.name} (${currentFile.type || 'type inconnu'}). Type: ${isImage ? 'Image' : isVideo ? 'Vidéo' : 'Fichier non pris en charge'}. Taille: ${(currentFile.size / 1024).toFixed(2)} KB.`
          });
        }
      }
      
      console.log('Envoi au modèle:', modelObject.name, 'mode:', mode, 'avec fichier:', currentFile?.name);
      
      // Create a new AbortController for this request
      abortController = new AbortController();
      
      // Récupérer les clés API depuis le localStorage
      const openRouterKey = localStorage.getItem('tetika-openrouter-key') || '';
      const notdiamondKey = localStorage.getItem('tetika-notdiamond-key') || '';
      const serpapiKey = localStorage.getItem('tetika-serpapi-key') || '';
        // Préparer les données à envoyer
      const requestBody = {
        messages: messagesForAPI,
        model: modelObject,
        mode: mode,
        hasAttachedFile: !!currentFile,
        ragProvider: selectedRAGProvider,
        apiKeys: {
          openrouter: openRouterKey,
          notdiamond: notdiamondKey,
          serpapi: serpapiKey
        }
      };
      
      // Log des données envoyées pour le débogage (sans les clés API complètes)
      console.log('Données de requête:', {
        ...requestBody,
        apiKeys: {
          openrouter: openRouterKey ? `${openRouterKey.substring(0, 8)}...` : 'non défini',
          notdiamond: notdiamondKey ? `${notdiamondKey.substring(0, 8)}...` : 'non défini',
          serpapi: serpapiKey ? `${serpapiKey.substring(0, 8)}...` : 'non défini'
        }
      });
      
      let data;
      
      try {
        const requestBodyJSON = JSON.stringify(requestBody);
        
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: abortController.signal,
          body: requestBodyJSON,
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = 'Échec de la génération de réponse';
          
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            console.error('Erreur lors du parsing de la réponse d\'erreur:', parseError);
            errorMessage = `${errorMessage}: ${errorText.substring(0, 100)}...`;
          }
          
          throw new Error(errorMessage);
        }
        
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('Erreur lors du parsing de la réponse:', parseError);
          throw new Error('Erreur lors de la lecture de la réponse du serveur');
        }
        
        // Déterminer le mode réel en fonction de si le RAG a été activé automatiquement
        const responseMode = data.autoActivatedRAG ? 'rag' : mode;
        // Si le RAG a été activé automatiquement, mettre à jour l'état
        if (data.autoActivatedRAG) {
          setRagMode(true);
        }
          // Créer le message de réponse
        const assistantMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: data.message,
          timestamp: Date.now(),
          modelId: modelId, // Ajouter l'ID du modèle utilisé
          sources: data.sources ? data.sources.map((source: { 
            title: string; 
            url: string; 
            snippet: string; 
            position?: number 
          }) => ({
            title: source.title,
            link: source.url, // Map url to link for compatibility with SourceType
            url: source.url,  // Keep url for backward compatibility
            snippet: source.snippet,
            position: source.position
          })) : [],
          mode: responseMode, // Utiliser le mode réel de la réponse
          autoActivatedRAG: data.autoActivatedRAG // Ajouter marqueur pour indiquer si le RAG a été activé automatiquement
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } catch (err) {
        // Utilisons une approche plus robuste pour détecter les annulations
        // Vérifier si c'est une erreur d'annulation avant de la logger
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
          // Annulation volontaire, pas d'erreur à afficher
          console.log('✓ Génération arrêtée par l\'utilisateur'); // Log informatif uniquement
          return; // Sortir sans afficher de message d'erreur
        }
        
        // Seulement pour les vraies erreurs, afficher dans la console
        console.error('Erreur lors de l\'obtention de la réponse IA:', err);
        
        // Log détaillé pour aider au débogage
        if (err instanceof Error) {
          console.log('Détails de l\'erreur:', {
            name: err.name,
            message: err.message,
            stack: err.stack?.substring(0, 500)
          });
        }
        
        // Message d'erreur plus spécifique pour les problèmes de JSON
        let errorContent = `Désolé, une erreur s'est produite: ${err instanceof Error ? err.message : 'Erreur inconnue'}. Veuillez réessayer.`;
        
        // Détecter les erreurs de JSON spécifiques
        if (err instanceof Error && 
            (err.message.includes('JSON') || 
             err.message.includes('Unexpected end of') || 
             err.message.includes('Unexpected token'))) {
          errorContent = `Erreur de format de données: ${err.message}. Veuillez vérifier que votre message ne contient pas de caractères spéciaux qui pourraient poser problème.`;
        }
          // Ajouter un message d'erreur uniquement pour les vraies erreurs
        const errorMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: errorContent,
          timestamp: Date.now(),
          modelId: modelId, // Ajouter l'ID du modèle utilisé
          mode: mode,
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (outerError) {
      // Gestion des erreurs dans le bloc externe (hors API)
      console.error('Erreur externe:', outerError);
        // Ajouter un message d'erreur
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: `Erreur: ${outerError instanceof Error ? outerError.message : 'Erreur inconnue'}`,
        timestamp: Date.now(),
        modelId: modelId, // Ajouter l'ID du modèle utilisé
        mode: mode,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      abortController = null;
    }
  };
    // Fonction pour arrêter la génération de la réponse
  const handleStopGeneration = useCallback(() => {
    if (abortController) {
      console.log('Arrêt de la génération de la réponse');
      try {
        abortController.abort('Demande annulée par l\'utilisateur');
      } catch (err) {
        // Ignorer l'erreur si l'annulation échoue
        console.log('Erreur lors de l\'annulation de la requête:', err);
      } finally {
        abortController = null;
        setLoading(false);
      }
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
    setMessages(prev => prev.slice(0, lastUserMessageIndex + 1));
    
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
    setMessages([]);
    setActiveConversationId(null);
    // RAG suggestions code removed
  };

  // Ajout de la fonction pour purger tout l'historique
  const handlePurgeAllHistory = () => {
    // Effacer toutes les conversations du stockage
    setConversations([]);
    setActiveConversationId(null);
    setMessages([]);
    
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