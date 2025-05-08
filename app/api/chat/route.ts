import { NextRequest, NextResponse } from 'next/server';
import { Message, ChatMode } from '@/types';
import { callAIModel } from '@/lib/api';
import { enhanceWithRAG } from '@/lib/rag-helper';

interface Source {
  title: string;
  url: string;
  snippet: string;
  position: number;
}

// Define types for message content parts
interface TextContent {
  type: 'text';
  text: string;
}

interface ImageContent {
  type: 'image_url' | 'image';
  image_url?: {
    url: string;
  };
  // Add other image-related properties as needed
}

type ContentPart = TextContent | ImageContent;

// Helper function to generate a unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export async function POST(request: NextRequest) {
  try {
    const { messages, model, mode, hasAttachedFile } = await request.json();
    
    // Vérifier que les données requises sont présentes
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages requis et doit être un tableau non vide' },
        { status: 400 }
      );
    }
    
    // Vérifier que le modèle est spécifié et valide
    if (!model || !model.id || !model.provider) {
      console.error("Modèle invalide:", model);
      return NextResponse.json(
        { error: 'Modèle invalide ou incomplet. Veuillez sélectionner un modèle valide.' },
        { status: 400 }
      );
    }
    
    console.log(`Requête reçue - Mode: ${mode}, Modèle: ${model.id}, Provider: ${model.provider}, Fichier joint: ${hasAttachedFile ? 'oui' : 'non'}`);
    
    // Vérifier la compatibilité du modèle pour le traitement des images
    const supportsVision = model.id.includes('gpt-4') && model.id.includes('vision');
    
    // Si le modèle ne supporte pas la vision mais que nous avons des messages avec des images
    // en format base64, convertir ces messages en texte simple
    const processedMessages = messages.map((msg: Message & { content: string | ContentPart[] }) => {
      // Si le message est un tableau (contient des structures multimodales) et le modèle ne supporte pas vision
      if (Array.isArray(msg.content) && !supportsVision) {
        // Convertir le message multimodal en texte uniquement
        const textParts = msg.content
          .filter((part: ContentPart) => part.type === 'text')
          .map((part: TextContent) => part.text)
          .join('\n\n');
        
        // Indiquer qu'il y avait des images qui ne peuvent pas être traitées
        const hasImageParts = msg.content.some((part: ContentPart) => 
          part.type === 'image_url' || part.type === 'image');
        
        const imageNotice = hasImageParts 
          ? "\n\n[Note: Ce message contenait des images, mais le modèle actuel ne peut pas les traiter. Utilisez un modèle compatible avec la vision pour analyser les images.]" 
          : "";
        
        return {
          ...msg,
          content: textParts + imageNotice
        };
      }
      return msg;
    });
    
    // If RAG mode is enabled, enhance the user's message with web search results
    let ragContext = '';
    let sources: Source[] = [];
    
    // Create a new array for messages that we'll send to the AI
    let messagesForAI = [...processedMessages];
    
    if (mode === 'rag') {
      // Get the last user message
      const lastUserMessage = messages.findLast((msg: Message) => msg.role === 'user');
      
      if (lastUserMessage) {
        // Get the SerpAPI key from environment variables
        const serpApiKey = process.env.SERPAPI_API_KEY || '';
        
        if (!serpApiKey) {
          console.error('SERPAPI_API_KEY environment variable is not set');
          return NextResponse.json({ error: 'SerpAPI key is not configured' }, { status: 500 });
        }
        
        // Use our new enhanceWithRAG utility
        const ragResults = await enhanceWithRAG(lastUserMessage.content, serpApiKey);
        
        if (ragResults.error) {
          console.warn(`RAG enhancement warning: ${ragResults.error}`);
        }
        
        ragContext = ragResults.context;
        sources = ragResults.sources;
        
        // Create a copy of the messages array for RAG mode
        const messagesWithRAG = [...messagesForAI];
        
        // Find the index of the last user message
        const lastUserMessageIndex = messagesWithRAG.findLastIndex((msg: Message) => msg.role === 'user');
        
        if (lastUserMessageIndex !== -1) {
          // Create a system message with the search results to insert before the last user message
          const systemMessage: Message & { content: string | ContentPart[] } = {
            id: generateId(),
            role: 'system',
            content: `I'm providing you with recent web search results related to the user's query. 
Please incorporate this information in your response and cite sources when appropriate using [1], [2], etc.

Web search results:
${ragContext}`,
            timestamp: Date.now(),
            mode: 'rag' as ChatMode
          };
          
          // Insert the system message before the last user message
          messagesWithRAG.splice(lastUserMessageIndex, 0, systemMessage);
          
          // Use the enhanced messages array instead of trying to reassign messages
          messagesForAI = messagesWithRAG;
        }
      }
    }
    
    // Si un fichier est présent, ajouter un message système pour indiquer clairement à l'IA
    // qu'un fichier a été joint et qu'elle doit traiter le contenu du fichier
    if (hasAttachedFile) {
      console.log("Un fichier a été détecté dans la requête, ajout d'instructions spéciales pour l'IA");
      
      // Déterminer si le fichier joint est une image en base64
      const hasImageContent = messagesForAI.some(msg => 
        Array.isArray(msg.content) && 
        msg.content.some((part: ContentPart) => part.type === 'image_url' || part.type === 'image')
      );
      
      // Ajouter une instruction spécifique au type de fichier
      const fileTypeMessage = hasImageContent && supportsVision
        ? "L'utilisateur a joint une image. Utilisez vos capacités de vision pour analyser le contenu visuel et répondre aux questions de l'utilisateur concernant cette image."
        : "L'utilisateur a joint un fichier. Le contenu du fichier a été fourni sous forme de message système. Veuillez analyser attentivement ce contenu et répondre aux questions de l'utilisateur concernant ce fichier.";
      
      // Ajouter une instruction au début des messages pour l'IA
      if (!messagesForAI.some(msg => msg.role === 'system' && msg.content.includes('L\'utilisateur a joint'))) {
        messagesForAI.unshift({
          id: generateId(),
          role: 'system',
          content: fileTypeMessage,
          timestamp: Date.now(),
          mode: mode as ChatMode
        });
      }
    }
    
    // Appeler le modèle d'IA avec le message enrichi
    const apiResponse = await callAIModel(model, messagesForAI);
    const aiResponse = apiResponse.choices[0].message.content;
    
    // Return the AI response with sources if in RAG mode
    return NextResponse.json({
      message: aiResponse,
      sources: mode === 'rag' ? sources : []
    });
  } catch (error) {
    console.error('Erreur lors du traitement de la requête chat:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Erreur interne du serveur';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}