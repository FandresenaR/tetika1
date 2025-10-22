import { Message, ChatMode } from '@/types';

interface ChatAPIResponse {
  message: string;
  sources?: Array<{
    title: string;
    url: string;
    snippet: string;
    position?: number;
  }>;
  autoActivatedRAG?: boolean;
}

interface ChatAPIError {
  error: string;
  details?: string;
}

/**
 * Service centralisé pour gérer les appels à l'API de chat
 * Fournit une gestion d'erreur robuste et une interface cohérente
 */
export class ChatService {
  private abortController: AbortController | null = null;
  
  /**
   * Envoyer un message au service de chat
   */
  async sendMessage(
    messages: Array<{ role: string; content: string }>,
    model: {
      id: string;
      provider: string;
      name?: string;
      features?: { rag?: boolean };
    },
    mode: ChatMode,
    apiKeys: {
      openrouter?: string;
      notdiamond?: string;
      serpapi?: string;
    },
    ragProvider?: string,
    hasAttachedFile?: boolean
  ): Promise<ChatAPIResponse> {
    // Créer un nouveau AbortController pour cette requête
    this.abortController = new AbortController();
    
    try {
      // Validation des paramètres
      if (!messages || messages.length === 0) {
        throw new Error('Messages requis');
      }
      
      if (!model || !model.id) {
        throw new Error('Modèle requis');
      }
      
      // Préparer le corps de la requête
      const requestBody = {
        messages,
        model,
        mode,
        hasAttachedFile: hasAttachedFile || false,
        ragProvider,
        apiKeys,
      };
      
      console.log('[ChatService] Envoi de la requête:', {
        messageCount: messages.length,
        modelId: model.id,
        mode,
        hasAttachedFile,
      });
      
      // Effectuer la requête
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: this.abortController.signal,
        body: JSON.stringify(requestBody),
      });
      
      // Gérer les erreurs HTTP
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Échec de la génération de réponse';
        
        try {
          const errorData: ChatAPIError = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
          
          if (errorData.details) {
            errorMessage += ` - ${errorData.details}`;
          }
        } catch (parseError) {
          console.error('[ChatService] Erreur de parsing de l\'erreur:', parseError);
          errorMessage = `${errorMessage}: ${errorText.substring(0, 100)}`;
        }
        
        throw new Error(errorMessage);
      }
      
      // Parser la réponse
      let data: ChatAPIResponse;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('[ChatService] Erreur de parsing de la réponse:', parseError);
        throw new Error('Erreur lors de la lecture de la réponse du serveur');
      }
      
      // Valider la structure de la réponse
      if (!data || typeof data.message !== 'string') {
        console.error('[ChatService] Réponse invalide:', data);
        throw new Error('La réponse du serveur est invalide ou incomplète');
      }
      
      // Valider que le message n'est pas vide
      if (!data.message.trim()) {
        console.warn('[ChatService] Message vide reçu de l\'API');
        throw new Error('Le serveur a retourné une réponse vide');
      }
      
      console.log('[ChatService] Réponse reçue avec succès:', {
        messageLength: data.message.length,
        sourcesCount: data.sources?.length || 0,
        autoActivatedRAG: data.autoActivatedRAG || false,
      });
      
      return data;
    } catch (error) {
      // Gestion des annulations
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('[ChatService] Requête annulée par l\'utilisateur');
        throw new Error('Demande annulée par l\'utilisateur');
      }
      
      // Gestion des erreurs réseau
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('[ChatService] Erreur réseau:', error);
        throw new Error('Erreur de connexion au serveur. Vérifiez votre connexion internet.');
      }
      
      // Re-lancer l'erreur si c'est déjà une Error
      if (error instanceof Error) {
        throw error;
      }
      
      // Erreur inconnue
      console.error('[ChatService] Erreur inconnue:', error);
      throw new Error('Une erreur inconnue s\'est produite');
    } finally {
      this.abortController = null;
    }
  }
  
  /**
   * Annuler la requête en cours
   */
  cancelRequest(): void {
    if (this.abortController) {
      console.log('[ChatService] Annulation de la requête en cours');
      this.abortController.abort();
      this.abortController = null;
    }
  }
  
  /**
   * Vérifier si une requête est en cours
   */
  isRequestInProgress(): boolean {
    return this.abortController !== null;
  }
}

// Export d'une instance singleton pour une utilisation facile
export const chatService = new ChatService();
