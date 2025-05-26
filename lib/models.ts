import { AIModel } from "../types";

// Fonction utilitaire pour déterminer la catégorie d'un modèle basée sur sa description
export const getCategoryFromDescription = (description: string): 'general' | 'coding' | 'vision' | 'creative' | 'reasoning' | 'research' => {
  const desc = description.toLowerCase();
  
  if (desc.includes('vision') || desc.includes('image') || desc.includes('visual')) {
    return 'vision';
  } else if (desc.includes('code') || desc.includes('coding') || desc.includes('programming') || 
             desc.includes('technical') || desc.includes('developer')) {
    return 'coding';
  } else if (desc.includes('creative') || desc.includes('story') || desc.includes('narrative') || 
             desc.includes('dialogue') || desc.includes('writing')) {
    return 'creative';
  } else if (desc.includes('reasoning') || desc.includes('problem-solving') || 
             desc.includes('advanced reasoning')) {
    return 'reasoning';
  } else if (desc.includes('research') || desc.includes('scientific') || 
             desc.includes('knowledge') || desc.includes('data science')) {
    return 'research';
  }
  
  return 'general';
};

// Modèles OpenRouter 2025
export const openRouterModels: AIModel[] = [
  // Mistral AI models
  {
    id: "mistralai/mistral-7b-instruct:free",
    name: "Mistral 7B Instruct",
    provider: "openrouter",
    description: "Compact but powerful model for everyday tasks",
    maxTokens: 8192,
    free: true,
    category: 'general',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "mistralai/mistral-small-3.1-24b-instruct:free",
    name: "Mistral Small 3.1 24B",
    provider: "openrouter",
    description: "Balanced model with strong reasoning capabilities",
    maxTokens: 16384,
    free: true,
    category: 'reasoning',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "mistralai/mistral-small-24b-instruct-2501:free",
    name: "Mistral Small 24B 2501",
    provider: "openrouter",
    description: "Well-balanced model for general use cases",
    maxTokens: 16384,
    free: true,
    category: 'general',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "mistralai/mistral-nemo:free",
    name: "Mistral Nemo",
    provider: "openrouter",
    description: "Advanced model with improved knowledge and reasoning",
    maxTokens: 16384,
    free: true,
    category: 'reasoning',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  
  // DeepSeek models
  {
    id: "tngtech/deepseek-r1t-chimera:free",
    name: "DeepSeek R1T Chimera",
    provider: "openrouter",
    description: "Code-specialized LLM with excellent reasoning",
    maxTokens: 16384,
    free: true,
    category: 'coding',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "deepseek/deepseek-chat-v3-0324:free",
    name: "DeepSeek Chat v3",
    provider: "openrouter",
    description: "Conversational AI with excellent problem-solving",
    maxTokens: 16384,
    free: true,
    category: 'general',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "deepseek/deepseek-v3-base:free",
    name: "DeepSeek v3 Base",
    provider: "openrouter",
    description: "Versatile base model for general-purpose tasks",
    maxTokens: 16384,
    free: true,
    category: 'general',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "deepseek/deepseek-r1-distill-llama-70b:free",
    name: "DeepSeek R1 Distill Llama 70B",
    provider: "openrouter",
    description: "Knowledge-rich model distilled from Llama architecture",
    maxTokens: 32768,
    free: true,
    category: 'research',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "deepseek/deepseek-r1:free",
    name: "DeepSeek R1",
    provider: "openrouter",
    description: "Advanced reasoning and problem-solving capabilities",
    maxTokens: 16384,
    free: true,
    category: 'reasoning',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "deepseek/deepseek-r1-distill-qwen-32b:free",
    name: "DeepSeek R1 Distill Qwen 32B",
    provider: "openrouter",
    description: "Efficient distilled model with robust reasoning",
    maxTokens: 16384,
    free: true,
    category: 'reasoning',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "deepseek/deepseek-r1-distill-qwen-14b:free",
    name: "DeepSeek R1 Distill Qwen 14B",
    provider: "openrouter",
    description: "Compact distilled model that balances size and capability",
    maxTokens: 8192,
    free: true,
    category: 'general',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "agentica-org/deepcoder-14b-preview:free",
    name: "DeepCoder 14B Preview",
    provider: "openrouter",
    description: "Specialized for coding and technical tasks",
    maxTokens: 8192,
    free: true,
    category: 'coding',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  
  // Vision models
  {
    id: "moonshotai/kimi-vl-a3b-thinking:free",
    name: "KIMI Vision Thinking",
    provider: "openrouter",
    description: "Vision-language model with thinking capabilities",
    maxTokens: 8192,
    free: true,
    category: 'vision',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: false,
    },
  },
  {
    id: "meta-llama/llama-3.2-11b-vision-instruct:free",
    name: "Llama 3.2 11B Vision",
    provider: "openrouter",
    description: "Vision-capable model with instruction tuning",
    maxTokens: 8192,
    free: true,
    category: 'vision',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: false,
    },
  },
  {
    id: "qwen/qwen2.5-vl-72b-instruct:free",
    name: "Qwen 2.5 VL 72B",
    provider: "openrouter",
    description: "Large vision-language model with instruction tuning",
    maxTokens: 32768,
    free: true,
    category: 'vision',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: false,
    },
  },
  {
    id: "qwen/qwen2.5-vl-32b-instruct:free",
    name: "Qwen 2.5 VL 32B",
    provider: "openrouter",
    description: "Mid-size vision-language model with instructions",
    maxTokens: 16384,
    free: true,
    category: 'vision',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: false,
    },
  },
  {
    id: "qwen/qwen2.5-vl-3b-instruct:free",
    name: "Qwen 2.5 VL 3B",
    provider: "openrouter",
    description: "Lightweight vision-language model",
    maxTokens: 4096,
    free: true,
    category: 'vision',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: false,
    },
  },
  {
    id: "bytedance-research/ui-tars-72b:free",
    name: "UI-TARS 72B",
    provider: "openrouter",
    description: "Multimodal AI model for automating browser and desktop tasks through visual interaction",
    maxTokens: 32768,
    free: true,
    category: 'vision',
    features: {
      streaming: true,
      rag: false,
      codeCompletion: true,
    },
  },
  
  // NVIDIA models
  {
    id: "nvidia/llama-3.1-nemotron-nano-8b-v1:free",
    name: "Nemotron Nano 8B",
    provider: "openrouter",
    description: "Compact Llama 3.1 adaptation by NVIDIA",
    maxTokens: 8192,
    free: true,
    category: 'general',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "nvidia/llama-3.3-nemotron-super-49b-v1:free",
    name: "Nemotron Super 49B",
    provider: "openrouter",
    description: "Powerful mid-size Llama 3.3 adapted by NVIDIA",
    maxTokens: 16384,
    free: true,
    category: 'general',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "nvidia/llama-3.1-nemotron-ultra-253b-v1:free",
    name: "Nemotron Ultra 253B",
    provider: "openrouter",
    description: "Extremely large and capable Llama 3.1 variant",
    maxTokens: 32768,
    free: true,
    category: 'reasoning',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  
  // Meta Llama models
  {
    id: "meta-llama/llama-4-maverick:free",
    name: "Llama 4 Maverick",
    provider: "openrouter",
    description: "Next-gen Llama model with enhanced capabilities",
    maxTokens: 16384,
    free: true,
    category: 'general',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct:free",
    name: "Llama 3.3 70B",
    provider: "openrouter",
    description: "Latest large Llama model with instruction tuning",
    maxTokens: 16384,
    free: true,
    category: 'general',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "meta-llama/llama-3.1-405b-instruct:free",
    name: "Llama 3.1 405B",
    provider: "openrouter",
    description: "Massive model with exceptional capabilities",
    maxTokens: 32768,
    free: true,
    category: 'reasoning',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "meta-llama/llama-3.2-3b-instruct:free",
    name: "Llama 3.2 3B",
    provider: "openrouter",
    description: "Compact model ideal for lighter applications",
    maxTokens: 4096,
    free: true,
    category: 'general',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "meta-llama/llama-3.1-405b:free",
    name: "Llama 3.1 405B Base",
    provider: "openrouter",
    description: "Base version of Meta's largest Llama model",
    maxTokens: 32768,
    free: true,
    category: 'general',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  
  // Creative and specialized models
  {
    id: "featherless/qwerky-72b:free",
    name: "Qwerky 72B",
    provider: "openrouter",
    description: "Creative and distinctive conversational model",
    maxTokens: 16384,
    free: true,
    category: 'creative',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: false,
    },
  },
  {
    id: "open-r1/olympiccoder-32b:free",
    name: "OlympicCoder 32B",
    provider: "openrouter",
    description: "Specialized for competitive coding challenges",
    maxTokens: 16384,
    free: true,
    category: 'coding',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "rekaai/reka-flash-3:free",
    name: "Reka Flash 3",
    provider: "openrouter",
    description: "Fast and efficient general-purpose model",
    maxTokens: 8192,
    free: true,
    category: 'general',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "sophosympatheia/rogue-rose-103b-v0.2:free",
    name: "Rogue Rose 103B",
    provider: "openrouter",
    description: "Creative AI with strong dialogue capabilities",
    maxTokens: 16384,
    free: true,
    category: 'creative',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: false,
    },
  },
  {
    id: "allenai/molmo-7b-d:free",
    name: "MOLMO 7B",
    provider: "openrouter",
    description: "Research-focused model with scientific knowledge",
    maxTokens: 8192,
    free: true,
    category: 'research',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: false,
    },
  },
  
  // Qwen standard models
  {
    id: "qwen/qwen-2.5-72b-instruct:free",
    name: "Qwen 2.5 72B",
    provider: "openrouter",
    description: "Latest large Qwen model with instruction tuning",
    maxTokens: 32768,
    free: true,
    category: 'general',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "qwen/qwen-2.5-coder-32b-instruct:free",
    name: "Qwen 2.5 Coder 32B",
    provider: "openrouter",
    description: "Specialized for coding with instruction tuning",
    maxTokens: 16384,
    free: true,
    category: 'coding',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "qwen/qwen-2.5-7b-instruct:free",
    name: "Qwen 2.5 7B",
    provider: "openrouter",
    description: "Efficient compact model with instruction tuning",
    maxTokens: 8192,
    free: true,
    category: 'general',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "qwen/qwen-2-7b-instruct:free",
    name: "Qwen 2 7B",
    provider: "openrouter",
    description: "Previous-gen Qwen model, good balance of size/capability",
    maxTokens: 8192,
    free: true,
    category: 'general',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  
  // Google models
  {
    id: "google/gemini-2.5-pro-exp-03-25",
    name: "Gemini 2.5 Pro Exp",
    provider: "openrouter",
    description: "Experimental version of Gemini Pro with enhanced abilities",
    maxTokens: 16384,
    category: 'general',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "google/gemini-2.0-flash-exp:free",
    name: "Gemini 2.0 Flash",
    provider: "openrouter",
    description: "Fast and efficient Gemini model",
    maxTokens: 8192,
    free: true,
    category: 'general',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "google/gemma-3-1b-it:free",
    name: "Gemma 3 1B",
    provider: "openrouter",
    description: "Ultra-compact Gemma with instruction tuning",
    maxTokens: 2048,
    free: true,
    category: 'general',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "google/gemma-3-4b-it:free",
    name: "Gemma 3 4B",
    provider: "openrouter",
    description: "Compact Gemma with instruction tuning",
    maxTokens: 4096,
    free: true,
    category: 'general',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "google/gemma-3-12b-it:free",
    name: "Gemma 3 12B",
    provider: "openrouter",
    description: "Medium-size Gemma with strong capabilities",
    maxTokens: 8192,
    free: true,
    category: 'general',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "google/gemma-3-27b-it:free",
    name: "Gemma 3 27B",
    provider: "openrouter",
    description: "Larger Gemma model with enhanced reasoning",
    maxTokens: 16384,
    free: true,
    category: 'reasoning',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "google/gemma-2-9b-it:free",
    name: "Gemma 2 9B",
    provider: "openrouter",
    description: "Previous-gen Gemma with good capabilities",
    maxTokens: 8192,
    free: true,
    category: 'general',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "google/gemini-flash-1.5-8b-exp",
    name: "Gemini Flash 1.5 8B",
    provider: "openrouter",
    description: "Experimental Gemini model focused on speed",
    maxTokens: 8192,
    category: 'general',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "google/learnlm-1.5-pro-experimental:free",
    name: "LearnLM 1.5 Pro",
    provider: "openrouter",
    description: "Experimental model for educational tasks",
    maxTokens: 8192,
    free: true,
    category: 'research',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  
  // Tsinghua GLM models
  {
    id: "thudm/glm-4-32b:free",
    name: "GLM-4 32B",
    provider: "openrouter",
    description: "Powerful bilingual model with rich capabilities",
    maxTokens: 16384,
    free: true,
    category: 'general',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "thudm/glm-z1-32b:free",
    name: "GLM-Z1 32B",
    provider: "openrouter",
    description: "Advanced GLM model with enhanced features",
    maxTokens: 16384,
    free: true,
    category: 'general',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "thudm/glm-4-9b:free",
    name: "GLM-4 9B",
    provider: "openrouter",
    description: "Compact GLM model with good performance",
    maxTokens: 8192,
    free: true,
    category: 'general',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "thudm/glm-z1-9b:free",
    name: "GLM-Z1 9B",
    provider: "openrouter",
    description: "Efficient GLM model with robust capabilities",
    maxTokens: 8192,
    free: true,
    category: 'general',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  
  // Microsoft and other research models
  {
    id: "microsoft/mai-ds-r1:free",
    name: "MAI DS R1",
    provider: "openrouter",
    description: "Specialized for data science tasks",
    maxTokens: 8192,
    free: true,
    category: 'research',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "liquid/lfm-40b:free",
    name: "LFM 40B",
    provider: "openrouter",
    description: "Large foundational model with broad capabilities",
    maxTokens: 16384,
    free: true,
    category: 'general',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "shisa-ai/shisa-v2-llama3.3-70b:free",
    name: "Shisa v2 Llama3.3 70B",
    provider: "openrouter",
    description: "Llama 3.3 adaptation with specialized training",
    maxTokens: 16384,
    free: true,
    category: 'general',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "nousresearch/hermes-3-llama-3.1-405b:free",
    name: "Hermes 3 Llama 3.1 405B",
    provider: "openrouter",
    description: "Research-focused model built on Llama 3.1",
    maxTokens: 32768,
    free: true,
    category: 'research',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "microsoft/phi-3-medium-128k-instruct:free",
    name: "Phi-3 Medium 128K",
    provider: "openrouter",
    description: "Medium-sized Phi model with long context window",
    maxTokens: 32768,
    free: true,
    category: 'general',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  
  // Smaller open-source models
  {
    id: "gryphe/mythomist-7b:free",
    name: "MythoMist 7B",
    provider: "openrouter",
    description: "Creative model with strong narrative capabilities",
    maxTokens: 8192,
    free: true,
    category: 'creative',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: false,
    },
  },
  {
    id: "openchat/openchat-7b:free",
    name: "OpenChat 7B",
    provider: "openrouter",
    description: "Open-source conversational model",
    maxTokens: 8192,
    free: true,
    category: 'general',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "undi95/toppy-m-7b:free",
    name: "Toppy-M 7B",
    provider: "openrouter",
    description: "Balanced model with good general capabilities",
    maxTokens: 8192,
    free: true,
    category: 'general',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "huggingfaceh4/zephyr-7b-beta:free",
    name: "Zephyr 7B Beta",
    provider: "openrouter",
    description: "Versatile open-source model",
    maxTokens: 8192,
    free: true,
    category: 'general',
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
];

export const notDiamondModels: AIModel[] = [
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "notdiamond",
    description: "Modèle avancé avec excellentes capacités de raisonnement",
    maxTokens: 8192,
    category: "reasoning",
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "claude-3-opus",
    name: "Claude 3 Opus",
    provider: "notdiamond",
    description: "Modèle le plus avancé d'Anthropic, excellent pour les tâches complexes",
    maxTokens: 100000,
    category: "reasoning",
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "claude-3-sonnet",
    name: "Claude 3 Sonnet",
    provider: "notdiamond",
    description: "Version équilibrée de Claude 3 pour les tâches quotidiennes",
    maxTokens: 100000,
    category: "general",
    features: {
      streaming: true,
      rag: true,
      codeCompletion: true,
    },
  },
  {
    id: "perplexity",
    name: "Perplexity",
    provider: "notdiamond",
    description: "Spécialisé dans la recherche et l'analyse d'informations",
    maxTokens: 4096,
    category: "research",
    features: {
      streaming: true,
      rag: true,
      codeCompletion: false,
    },
  },
];

// Fonction utilitaire pour obtenir les catégories disponibles
export const getAvailableCategories = (): string[] => {
  const categories = new Set<string>();
  
  getAllModels().forEach(model => {
    if (model.category) {
      categories.add(model.category);
    }
  });
  
  return Array.from(categories);
};

export const getAllModels = () => {
  return [...openRouterModels, ...notDiamondModels];
};

export const getModelById = (id: string): AIModel | undefined => {
  return getAllModels().find((model) => model.id === id);
};

// Fonction pour filtrer les modèles par catégorie
export const getModelsByCategory = (category: string | null, provider?: 'openrouter' | 'notdiamond'): AIModel[] => {
  let filteredModels = getAllModels();
  
  // Filtrer par fournisseur si spécifié
  if (provider) {
    filteredModels = filteredModels.filter(model => model.provider === provider);
  }
  
  // Retourner tous les modèles si aucune catégorie n'est spécifiée
  if (!category) {
    return filteredModels;
  }
  
  // Filtrer par catégorie
  return filteredModels.filter(model => model.category === category);
};