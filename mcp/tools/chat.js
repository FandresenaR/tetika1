import axios from 'axios';

export async function chatWithAI(args) {
  const { 
    message, 
    model = 'gpt-4-turbo-preview', 
    mode = 'standard', 
    system_prompt 
  } = args;

  try {
    // Prepare messages array
    const messages = [];
    
    if (system_prompt) {
      messages.push({
        role: 'system',
        content: system_prompt,
      });
    }
    
    messages.push({
      role: 'user',
      content: message,
    });

    // Use Tetika's existing chat API endpoint
    const response = await axios.post('http://localhost:3000/api/chat', {
      messages,
      model,
      mode,      apiKeys: {
        openrouter: process.env.OPENROUTER_API_KEY,
        serpapi: process.env.SERPAPI_API_KEY,
      },
    });

    if (response.data.error) {
      throw new Error(response.data.error);
    }

    // Extract the AI response
    const aiResponse = response.data.content || response.data.message || response.data;
    
    return {
      content: [
        {
          type: 'text',
          text: typeof aiResponse === 'string' ? aiResponse : JSON.stringify(aiResponse, null, 2),
        },
      ],
      metadata: {
        model_used: model,
        mode_used: mode,
        has_sources: !!response.data.sources,
        sources: response.data.sources || [],
      },
    };
  } catch (error) {
    console.error('AI chat error:', error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: 'AI chat failed',
            message: error.message,
            original_message: message,
            model_requested: model,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
}
