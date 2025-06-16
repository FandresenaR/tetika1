// Mettre à jour l'interface Message pour inclure la fonction de post-traitement
export interface Message {
  id: string;
  role: string;
  content: string;
  timestamp?: number;
  model?: AIModel;
  mode?: ChatMode; // Ajout de la propriété mode
  sources?: {
    title: string;
    link: string;
    url?: string; // Ajout de la propriété url pour compatibilité
    snippet: string;
    position?: number; // Ajout de position qui est aussi utilisée
  }[];
  attachedFile?: {
    name: string;
    type: string;
    size: number;
    content: string; // Contenu du fichier encodé en base64 ou texte brut
  };
  autoActivatedRAG?: boolean; // Indique si le mode RAG a été activé automatiquement
  postProcess?: (content: string) => string;  // Nouvelle propriété pour post-traitement
}

// Définir les modes de chat disponibles
export type ChatMode = 'standard' | 'rag';

// Définition des interfaces nécessaires
export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  maxTokens: number;
  free?: boolean;
  promptPrice?: number;
  completionPrice?: number;
  category?: string;
  features: {
    streaming?: boolean;
    rag?: boolean;
    codeCompletion?: boolean;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  modelId: string;
  createdAt: number;
  updatedAt: number;
}