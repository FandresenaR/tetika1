import fs from 'fs';
import path from 'path';
import { chatWithAI } from './chat.js';

export async function analyzeFile(args) {
  const { 
    file_path, 
    file_content, 
    file_type, 
    analysis_type = 'auto', 
    questions = [] 
  } = args;

  try {
    let fileContent = file_content;
    let fileName = 'uploaded_file';

    // Read file if path is provided
    if (file_path && !file_content) {
      if (!fs.existsSync(file_path)) {
        throw new Error(`File not found: ${file_path}`);
      }
      
      fileName = path.basename(file_path);
      
      // Read file based on type
      if (file_type.startsWith('text/') || file_type === 'application/json') {
        fileContent = fs.readFileSync(file_path, 'utf8');
      } else {
        // For binary files, read as base64
        const buffer = fs.readFileSync(file_path);
        fileContent = buffer.toString('base64');
      }
    }

    // Determine analysis approach based on file type
    let analysisPrompt = '';
    
    if (file_type.startsWith('image/')) {
      analysisPrompt = `Please analyze this image. ${questions.length > 0 ? 'Specifically answer these questions: ' + questions.join(', ') : 'Describe what you see in detail, including any text, objects, people, or notable features.'}`;
    } else if (file_type.startsWith('text/') || file_type === 'application/json') {
      analysisPrompt = `Please analyze this ${file_type} document content:\n\n${fileContent}\n\n${questions.length > 0 ? 'Please answer these specific questions: ' + questions.join(', ') : 'Provide a comprehensive analysis including key points, themes, and insights.'}`;
    } else if (file_type.startsWith('video/')) {
      analysisPrompt = `I have a video file (${fileName}) of type ${file_type}. ${questions.length > 0 ? 'Please help me understand: ' + questions.join(', ') : 'Please provide information about video analysis capabilities and what insights could be extracted from video content.'}`;
    } else {
      analysisPrompt = `I have a file (${fileName}) of type ${file_type}. ${questions.length > 0 ? 'Please help me with: ' + questions.join(', ') : 'Please provide analysis based on the file type and any insights you can offer.'}`;
    }

    // For image analysis, use a vision-capable model
    const model = file_type.startsWith('image/') ? 'gpt-4-vision-preview' : 'gpt-4-turbo-preview';

    // Prepare the message with file content if it's an image
    let message = analysisPrompt;
    if (file_type.startsWith('image/') && fileContent) {
      // Note: In a real implementation, you'd need to handle image upload to the chat API
      message = `${analysisPrompt}\n\n[Image data provided as base64: ${fileContent.substring(0, 100)}...]`;
    }

    // Use the chat tool to analyze the file
    const analysisResult = await chatWithAI({
      message,
      model,
      mode: 'standard',
      system_prompt: 'You are a helpful assistant specialized in file analysis. Provide detailed, accurate, and useful insights about the content you analyze.',
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            file_name: fileName,
            file_type: file_type,
            analysis_type: analysis_type,
            questions_asked: questions,
            analysis: analysisResult.content[0].text,
          }, null, 2),
        },
      ],
      metadata: {
        file_analyzed: fileName,
        file_type: file_type,
        analysis_method: analysis_type,
        model_used: model,
      },
    };
  } catch (error) {
    console.error('File analysis error:', error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: 'File analysis failed',
            message: error.message,
            file_path: file_path || 'content provided',
            file_type: file_type,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
}
