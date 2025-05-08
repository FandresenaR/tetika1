import React, { useState, useEffect } from 'react';
import { Message } from '@/types';

interface HistorySidebarProps {
  conversations: { id: string; title: string; messages: Message[]; date: Date }[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onCreateNewConversation: () => void;
  onPurgeAllHistory: () => void;
  theme: 'dark' | 'light';
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onCreateNewConversation,
  onPurgeAllHistory,
  theme,
  isCollapsed,
  onToggleCollapse,
}) => {
  // État pour vérifier si on est sur mobile
  const [isMobile, setIsMobile] = useState(false);
  
  // Vérifier si on est sur mobile lors du chargement et à chaque redimensionnement
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Vérification initiale
    checkIsMobile();
    
    // Ajouter l'écouteur d'événement pour le redimensionnement
    window.addEventListener('resize', checkIsMobile);
    
    // Nettoyage
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
  // Récupère le titre d'une conversation à partir de ses messages
  const getConversationTitle = (messages: Message[]): string => {
    if (messages.length === 0) return "Nouvelle conversation";
    
    // Prendre le premier message de l'utilisateur
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (!firstUserMessage) return "Nouvelle conversation";
    
    // Limiter à 30 caractères
    const title = firstUserMessage.content.substring(0, 30);
    return title.length < firstUserMessage.content.length ? `${title}...` : title;
  };
  
  // Formate la date pour affichage
  const formatDate = (date: Date): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date >= today) {
      return "Aujourd'hui";
    } else if (date >= yesterday) {
      return "Hier";
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };
  
  // Détermine si la sidebar est effectivement réduite sur le mode desktop
  const isDesktopCollapsed = !isMobile && isCollapsed;
  
  // Gère le clic sur le bouton Fermer de la sidebar mobile
  const handleCloseMobile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Sur mobile, nous voulons vraiment fermer la sidebar, pas juste la réduire
    onToggleCollapse();
  };

  return (
    <>
      {/* Overlay de fond pour mobile - apparaît uniquement quand la sidebar est ouverte sur mobile */}
      {isMobile && !isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={handleCloseMobile}
          aria-hidden="true"
        />
      )}
      
      {/* Le conteneur principal de la sidebar */}
      <div 
        className={`
          flex flex-col h-full
          transition-all duration-300 ease-in-out
          border-r ${theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'}
          ${isMobile 
            ? `fixed top-0 left-0 bottom-0 z-30 w-[85%] max-w-xs ${isCollapsed ? '-translate-x-full' : 'translate-x-0'} shadow-xl` 
            : isCollapsed ? 'w-16' : 'w-64'
          }
        `}
      >
        {/* Entête de la sidebar */}
        <div className={`flex items-center justify-between p-3 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
          {(!isDesktopCollapsed || isMobile) && (
            <h2 className={`font-medium truncate ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
              Historique
            </h2>
          )}
          
          {isMobile ? (
            <button
              onClick={handleCloseMobile}
              className={`p-1.5 rounded-md transition-all duration-300 ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
              }`}
              aria-label="Fermer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <></>
          )}
        </div>
        
        {/* Bouton Nouvelle conversation */}
        <button
          onClick={onCreateNewConversation}
          className={`flex items-center justify-center gap-2 p-3 transition-all duration-300 ${
            isDesktopCollapsed ? 'px-0' : 'px-3'
          } ${
            theme === 'dark'
              ? 'hover:bg-gray-800 text-blue-400 hover:text-blue-300'
              : 'hover:bg-gray-200 text-blue-600 hover:text-blue-700'
          }`}
          title="Nouvelle conversation"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          {(!isDesktopCollapsed || isMobile) && <span>Nouvelle conversation</span>}
        </button>
        
        {/* Liste des conversations */}
        <div className="overflow-y-auto flex-grow">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={`w-full text-left flex items-center gap-2 p-3 truncate transition-all duration-300 ${
                isDesktopCollapsed ? 'justify-center' : 'px-3'
              } ${
                activeConversationId === conversation.id
                  ? theme === 'dark'
                    ? 'bg-gray-800 text-blue-300'
                    : 'bg-blue-50 text-blue-700'
                  : theme === 'dark'
                  ? 'text-gray-300 hover:bg-gray-800/50'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title={getConversationTitle(conversation.messages)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 flex-shrink-0 ${
                  activeConversationId === conversation.id
                    ? theme === 'dark'
                      ? 'text-blue-400'
                      : 'text-blue-600'
                    : theme === 'dark'
                    ? 'text-gray-500'
                    : 'text-gray-400'
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              {(!isDesktopCollapsed || isMobile) && (
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-sm">
                    {getConversationTitle(conversation.messages)}
                  </span>
                  <span className={`text-xs ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {formatDate(conversation.date)}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
        
        {/* Pied de la sidebar avec options */}
        {(!isDesktopCollapsed || isMobile) && (
          <div className={`p-3 border-t ${
            theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
          }`}>
            <div className={`flex items-center justify-between mb-2 flex-wrap gap-2`}>
              <div className={`text-xs ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Conversations stockées localement
              </div>
              <button
                onClick={() => {
                  if (confirm('Êtes-vous sûr de vouloir supprimer tout l\'historique des conversations ?')) {
                    onPurgeAllHistory();
                  }
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all
                  ${theme === 'dark' 
                    ? 'bg-red-900/20 text-red-300 hover:bg-red-800/30' 
                    : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                title="Supprimer tout l'historique des conversations"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Purger
              </button>
            </div>
            
            {conversations.length > 0 && (
              <div className={`text-xs ${
                theme === 'dark' ? 'text-gray-600' : 'text-gray-500'
              }`}>
                {conversations.length} conversation{conversations.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default HistorySidebar;