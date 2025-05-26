import { ChatSession, Message } from '@/types';
import { generateId } from './api';

// Clé utilisée pour stocker les sessions dans le localStorage
const STORAGE_KEY = 'tetika-chat-sessions';

// Récupérer toutes les sessions de chat
export const getAllChatSessions = (): ChatSession[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const sessionsJson = localStorage.getItem(STORAGE_KEY);
    if (!sessionsJson) return [];
    
    return JSON.parse(sessionsJson);
  } catch (error) {
    console.error('Error retrieving chat sessions:', error);
    return [];
  }
};

// Récupérer une session de chat par ID
export const getChatSessionById = (id: string): ChatSession | undefined => {
  const sessions = getAllChatSessions();
  return sessions.find(session => session.id === id);
};

// Créer une nouvelle session de chat
export const createChatSession = (modelId: string, initialMessages: Message[] = []): ChatSession => {
  const newSession: ChatSession = {
    id: generateId(),
    title: `Nouvelle conversation ${new Date().toLocaleString()}`,
    messages: initialMessages,
    modelId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  const sessions = getAllChatSessions();
  sessions.push(newSession);
  saveChatSessions(sessions);
  
  return newSession;
};

// Mettre à jour une session de chat existante
export const updateChatSession = (session: ChatSession): ChatSession => {
  const sessions = getAllChatSessions();
  const index = sessions.findIndex(s => s.id === session.id);
  
  if (index !== -1) {
    sessions[index] = {
      ...session,
      updatedAt: Date.now(),
    };
    saveChatSessions(sessions);
  }
  
  return session;
};

// Supprimer une session de chat
export const deleteChatSession = (id: string): void => {
  const sessions = getAllChatSessions();
  const filteredSessions = sessions.filter(session => session.id !== id);
  saveChatSessions(filteredSessions);
};

// Ajouter un message à une session de chat
export const addMessageToChatSession = (sessionId: string, message: Message): ChatSession | undefined => {
  const sessions = getAllChatSessions();
  const index = sessions.findIndex(s => s.id === sessionId);
  
  if (index !== -1) {
    sessions[index].messages.push(message);
    sessions[index].updatedAt = Date.now();
    
    // Si c'est le premier message utilisateur, définir le titre
    if (message.role === 'user' && sessions[index].messages.filter(m => m.role === 'user').length === 1) {
      sessions[index].title = message.content.substring(0, 30) + (message.content.length > 30 ? '...' : '');
    }
    
    saveChatSessions(sessions);
    return sessions[index];
  }
  
  return undefined;
};

// Fonction privée pour sauvegarder les sessions dans le localStorage
const saveChatSessions = (sessions: ChatSession[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Error saving chat sessions:', error);
  }
};