import { useState, useCallback, useRef } from 'react';
import { Message, ChatMode } from '@/types';

/**
 * Hook personnalisé pour gérer l'état des messages de manière robuste
 * Évite les race conditions et assure la cohérence des messages
 */
export const useChatMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>([]);
  
  // Synchroniser le ref avec le state
  const updateMessages = useCallback((newMessages: Message[]) => {
    messagesRef.current = newMessages;
    setMessages(newMessages);
  }, []);
  
  /**
   * Ajouter un message utilisateur
   */
  const addUserMessage = useCallback((content: string, mode: ChatMode, attachedFile?: Message['attachedFile']) => {
    const userMessage: Message = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      role: 'user',
      content,
      timestamp: Date.now(),
      mode,
      attachedFile,
    };
    
    const newMessages = [...messagesRef.current, userMessage];
    updateMessages(newMessages);
    
    return userMessage;
  }, [updateMessages]);
  
  /**
   * Ajouter un message assistant
   * Cette fonction garantit qu'on ne crée jamais un message vide
   */
  const addAssistantMessage = useCallback((
    content: string,
    modelId: string,
    mode: ChatMode,
    sources?: Message['sources'],
    autoActivatedRAG?: boolean
  ) => {
    // Validation: ne jamais ajouter un message vide
    if (!content || content.trim() === '') {
      console.error('Tentative d\'ajout d\'un message assistant vide - ignoré');
      return null;
    }
    
    const assistantMessage: Message = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      role: 'assistant',
      content,
      timestamp: Date.now(),
      modelId,
      mode,
      sources: sources || [],
      autoActivatedRAG,
    };
    
    const newMessages = [...messagesRef.current, assistantMessage];
    updateMessages(newMessages);
    
    return assistantMessage;
  }, [updateMessages]);
  
  /**
   * Mettre à jour un message existant
   */
  const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    const newMessages = messagesRef.current.map(msg => 
      msg.id === messageId ? { ...msg, ...updates } : msg
    );
    updateMessages(newMessages);
  }, [updateMessages]);
  
  /**
   * Supprimer tous les messages (clear chat)
   */
  const clearMessages = useCallback(() => {
    updateMessages([]);
  }, [updateMessages]);
  
  /**
   * Charger des messages depuis une source externe (ex: localStorage)
   */
  const loadMessages = useCallback((loadedMessages: Message[]) => {
    updateMessages(loadedMessages);
  }, [updateMessages]);
  
  /**
   * Obtenir le dernier message d'un rôle spécifique
   */
  const getLastMessageByRole = useCallback((role: 'user' | 'assistant' | 'system') => {
    return messagesRef.current.findLast(msg => msg.role === role);
  }, []);
  
  /**
   * Supprimer tous les messages après un index donné
   */
  const truncateMessagesAfter = useCallback((index: number) => {
    const newMessages = messagesRef.current.slice(0, index + 1);
    updateMessages(newMessages);
  }, [updateMessages]);
  
  return {
    messages,
    addUserMessage,
    addAssistantMessage,
    updateMessage,
    clearMessages,
    loadMessages,
    getLastMessageByRole,
    truncateMessagesAfter,
  };
};
