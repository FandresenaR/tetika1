import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message as MessageComponent, CodeSidebarContext } from './Message';
import ChatInput from './ChatInput';
import { ModelSelector } from './ModelSelector';
import HistorySidebar from './HistorySidebar';
import CodeSidebar from './CodeSidebar';
import { FileUploader } from '@/components/ui/FileUploader';
import { Message, ChatMode, ChatSession } from '@/types';
import { openRouterModels, getModelById } from '@/lib/models';
import { isImageFile, isVideoFile, createMediaDescription, createImageContentWithBase64 } from '@/lib/media-utils';

// Génère un ID unique
const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

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
  
  // États pour la barre latérale de code
  const [showCodeSidebar, setShowCodeSidebar] = useState(false);
  const [sidebarCode, setSidebarCode] = useState<{ code: string; language: string; fileName: string } | null>(null);
  
  // État pour stocker la valeur précédente de isSidebarCollapsed avant l'ouverture du CodeSidebar
  const [previousSidebarState, setPreviousSidebarState] = useState(false);
  
  // État pour le modal d'upload de fichier
  const [showFileUploader, setShowFileUploader] = useState(false);
  
  // État pour le fichier sélectionné
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // État pour détecter si l'écran est mobile
  const [isMobile, setIsMobile] = useState(false);
  
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
          setModelId(sortedConversations[0].modelId);
        }
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
  }, []);
  
  // Sauvegarde ou met à jour la conversation courante
  const saveCurrentConversation = useCallback(() => {
    if (messages.length === 0) return;
    
    const now = Date.now();
    
    if (activeConversationId) {
      // Mise à jour d'une conversation existante
      setConversations(prev => 
        prev.map(conv => 
          conv.id === activeConversationId 
            ? { ...conv, messages, modelId, updatedAt: now } 
            : conv
        )
      );
    } else {
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
  }, [messages, modelId, activeConversationId]);
  
  // Sauvegarde la conversation lorsque les messages ou le modèle changent
  useEffect(() => {
    if (messages.length > 0) {
      saveCurrentConversation();
    }
  }, [messages, modelId, saveCurrentConversation]);
  
  const handleSendMessage = async (content: string, mode: ChatMode = 'standard', file: File | null = null) => {
    if (!content.trim() && !file) return;
    
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
              content: `Fichier: ${currentFile.name}\n\nContenu:\n${fileContent}\n\nVeuillez analyser ce fichier en fonction de la demande de l'utilisateur.`
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
              // Cela sera converti côté API en format approprié
              messagesForAPI.push({
                role: 'system',
                content: `L'utilisateur a joint une image: ${currentFile.name}\n\nDescription: ${imageContent.description}\n\nImage base64: ${imageContent.base64.substring(0, 50)}...\n\nVeuillez analyser cette image et répondre aux questions de l'utilisateur.`
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
                content: `Vidéo jointe: ${currentFile.name}\n\n${mediaDescription}\n\nVeuillez analyser ces métadonnées de la vidéo en fonction de la demande de l'utilisateur.`
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
            content: `L'utilisateur a joint un fichier: ${currentFile.name} (${currentFile.type || 'type inconnu'}). Type: ${isImage ? 'Image' : isVideo ? 'Vidéo' : 'Fichier non pris en charge'}. Taille: ${(currentFile.size / 1024).toFixed(2)} KB.`
          });
        }
      }
      
      console.log('Envoi au modèle:', modelObject.name, 'mode:', mode, 'avec fichier:', currentFile?.name);
      
      // Appel API pour obtenir la réponse
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesForAPI,
          model: modelObject,
          mode: mode,
          hasAttachedFile: !!currentFile
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Échec de la génération de réponse');
      }
      
      const data = await response.json();
      
      // Créer le message de réponse
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: data.message,
        timestamp: Date.now(),
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
        mode: mode,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erreur lors de l\'obtention de la réponse IA:', error);
      
      // Ajouter un message d'erreur
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: `Désolé, une erreur s'est produite: ${error instanceof Error ? error.message : 'Erreur inconnue'}. Veuillez réessayer.`,
        timestamp: Date.now(),
        mode: mode,
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };
  
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
    handleClearChat();
    // Force le démarrage d'une nouvelle conversation avec le mode sélectionné
    // La chaîne vide comme premier message ne sera pas affichée à l'utilisateur
    // mais permettra d'initialiser le mode
    setRagMode(mode === 'rag');
    handleSendMessage('Bonjour TETIKA, peux-tu m\'aider ?', mode);
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
    }}>
      <div className={`flex flex-col h-screen transition-colors duration-300 ${themeClasses}`}>
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
                title={showSidebar ? "Masquer l'historique" : "Afficher l'historique"}
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
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden xs:inline">Nouvelle</span>
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
              <span className="hidden xs:inline">{currentModelName}</span>
            </button>

            <button
              onClick={() => setShowFileUploader(true)}
              className={`px-2 py-1 rounded-lg text-xs transition-all duration-300 shadow-lg hover:scale-105 flex items-center gap-1
                ${theme === 'dark' 
                  ? 'bg-gradient-to-r from-green-600/30 to-teal-600/30 hover:from-green-600/40 hover:to-teal-600/40 text-green-300 border border-green-800' 
                  : 'bg-gradient-to-r from-green-100 to-teal-100 hover:from-green-200 hover:to-teal-200 text-green-700 border border-green-200'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 10l-4-4m0 0l-4 4m4-4v12" />
              </svg>
              <span className="hidden xs:inline">Upload</span>
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
          >          
            {/* Chat messages container */}
            <div 
              ref={chatContainerRef}
              className={`flex-grow overflow-y-auto py-4 pb-14 sm:pb-16 md:pb-10 px-3 sm:px-6 transition-all duration-300
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
                      </div>
                      <span className="text-xs mt-2 opacity-75">Activer la recherche web pour des réponses enrichies avec des sources</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((message) => {
                      // Ensure message sources follow the expected format by the Message component
                      // This fixes the type error between url and link properties
                      const transformedMessage = {
                        ...message,
                        sources: message.sources?.map(source => ({
                          title: source.title,
                          link: source.url, // Map url to the link property expected by the Message component
                          url: source.url,  // Keep url for backward compatibility
                          snippet: source.snippet,
                          position: source.position
                        }))
                      };
                      
                      return (
                        <MessageComponent 
                          key={message.id} 
                          message={transformedMessage} 
                          theme={theme} 
                          onRegenerateResponse={handleRegenerateResponse} 
                        />
                      );
                    })}
                    {loading && (
                      <div className={`flex gap-2 items-center ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'} animate-pulse`}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-600/20">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span>TETIKA est en train de réfléchir...</span>
                      </div>
                    )}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* Input area - fixed at the bottom with minimal space */}
            <div className={`border-t sticky bottom-0 z-10 transition-all duration-300
              ${theme === 'dark' 
                ? 'border-gray-800 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-lg shadow-blue-900/10' 
                : 'border-gray-200 bg-gradient-to-r from-white via-gray-50 to-white shadow-lg shadow-blue-200/10'}`}>
              <div className="max-w-4xl mx-auto">
                <ChatInput 
                  onSendMessage={handleSendMessage} 
                  loading={loading}
                  theme={theme}
                  ragMode={ragMode}
                  onRagModeChange={toggleRagMode}
                  onFileUploadClick={() => setShowFileUploader(true)}
                  selectedFile={selectedFile}
                  onCancelFileUpload={() => setSelectedFile(null)}
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
              onClose={() => setShowCodeSidebar(false)}
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
      </div>
    </CodeSidebarContext.Provider>
  );
};

export default ChatInterface;