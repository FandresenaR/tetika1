export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  mode?: ChatMode; // Ajout de la propriété mode
  sources?: {
    title: string;
    url: string;
    snippet: string;
    position?: number;
  }[];
  attachedFile?: {
    name: string;
    type: string;
    size: number;
    content: string; // Contenu du fichier encodé en base64 ou texte brut
  };
  autoActivatedRAG?: boolean; // Indique si le mode RAG a été activé automatiquement
  reasoning?: string; // Added for Deep Research mode to store reasoning steps
  reasoningSources?: Array<{reference: string, sourceIndex: number}>; // Sources referenced in reasoning
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  modelId: string;
  createdAt: number;
  updatedAt: number;
}

export interface AIModel {
  id: string;
  name: string;
  provider: 'openrouter' | 'notdiamond';
  description: string;
  maxTokens: number;
  free?: boolean;
  promptPrice?: number;
  completionPrice?: number;
  category?: 'general' | 'coding' | 'vision' | 'creative' | 'reasoning' | 'research'; // Catégorie du modèle
  features: {
    streaming?: boolean;
    rag?: boolean;
    codeCompletion?: boolean;
  };
}

export interface AIProviderConfig {
  name: string;
  models: AIModel[];
  apiKey: string;
}

export type ChatMode = 'standard' | 'rag' | 'deep-research';