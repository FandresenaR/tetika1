# Tetika MCP Agent

This directory contains the Model Context Protocol (MCP) server implementation for Tetika, allowing external applications to interact with Tetika's AI capabilities through a standardized protocol.

## Overview

The Tetika MCP Agent exposes Tetika's core functionalities as MCP tools, including:

- **Web Search**: Search the web using SerpAPI integration
- **AI Chat**: Interact with various AI models through OpenRouter
- **File Analysis**: Analyze documents, images, and videos using AI
- **Conversation Management**: Create, read, update, and delete chat sessions
- **System Status**: Get information about Tetika's configuration and capabilities

## Installation

The MCP dependencies are already included in the main Tetika project. No additional installation is required.

## Configuration

1. **Environment Variables**: Set your API keys in your environment or `.env.local` file:
   ```
   OPENROUTER_API_KEY=your_openrouter_api_key
   SERPAPI_API_KEY=your_serpapi_key
   ```

2. **MCP Configuration**: The MCP server configuration is in `mcp/config.json`

## Usage

### Starting the MCP Server

```bash
# Start the MCP server directly
npm run mcp:start

# Or run the server file directly
node mcp/servers/tetika-agent.js
```

### Testing the MCP Server

```bash
# Run built-in tests
npm run mcp:test

# Or run the test file directly
node mcp/test-server.js
```

### Using the Web Interface

1. Start your Tetika development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/mcp-agent` to use the web interface for testing MCP tools.

3. Or use the MCP Agent button in the main Tetika chat interface.

## Available Tools

### 1. Web Search (`web_search`)

Search the web for information using SerpAPI.

**Parameters:**
- `query` (string, required): The search query
- `location` (string, optional): Geographic location for localized results
- `num_results` (number, optional): Number of results to return (default: 10)

**Example:**
```json
{
  "name": "web_search",
  "arguments": {
    "query": "latest AI developments 2024",
    "location": "France",
    "num_results": 5
  }
}
```

### 2. Chat with AI (`chat_with_ai`)

Interact with AI models through Tetika's OpenRouter integration.

**Parameters:**
- `message` (string, required): The message to send to the AI
- `model` (string, optional): The AI model to use (default: gpt-4-turbo-preview)
- `mode` (string, optional): Chat mode - 'standard' or 'rag' (default: standard)
- `system_prompt` (string, optional): System prompt to set context

**Example:**
```json
{
  "name": "chat_with_ai",
  "arguments": {
    "message": "Explain quantum computing in simple terms",
    "model": "claude-3-sonnet",
    "mode": "rag"
  }
}
```

### 3. Analyze File (`analyze_file`)

Analyze files using AI capabilities.

**Parameters:**
- `file_path` (string): Path to the file to analyze
- `file_content` (string, optional): Base64 encoded file content
- `file_type` (string, required): MIME type of the file
- `analysis_type` (string, optional): Type of analysis - 'document', 'image', 'video', or 'auto'
- `questions` (array, optional): Specific questions to ask about the file

**Example:**
```json
{
  "name": "analyze_file",
  "arguments": {
    "file_path": "/path/to/image.jpg",
    "file_type": "image/jpeg",
    "questions": ["What objects are in this image?", "What is the mood of the image?"]
  }
}
```

### 4. Manage Conversation (`manage_conversation`)

Create, read, update, delete, and search conversations.

**Parameters:**
- `action` (string, required): Action to perform - 'create', 'list', 'get', 'update', 'delete', 'search'
- `session_id` (string): Session ID for get/update/delete actions
- `title` (string): Title for create/update actions
- `search_term` (string): Search term for finding conversations
- `limit` (number, optional): Maximum number of results (default: 10)

**Examples:**
```json
// Create a new conversation
{
  "name": "manage_conversation",
  "arguments": {
    "action": "create",
    "title": "Discussion about AI Ethics"
  }
}

// Search conversations
{
  "name": "manage_conversation",
  "arguments": {
    "action": "search",
    "search_term": "quantum",
    "limit": 5
  }
}
```

### 5. Get Tetika Status (`get_tetika_status`)

Get current status and configuration of Tetika.

**Parameters:**
- `include_models` (boolean, optional): Include available models (default: true)
- `include_settings` (boolean, optional): Include settings (default: true)

**Example:**
```json
{
  "name": "get_tetika_status",
  "arguments": {
    "include_models": true,
    "include_settings": true
  }
}
```

## MCP Protocol Integration

### For MCP Clients

To connect to the Tetika MCP server from an MCP client:

1. **Stdio Transport**: The server runs on stdio transport by default
2. **Server Command**: `node /path/to/tetika/mcp/servers/tetika-agent.js`
3. **Environment**: Ensure API keys are set in the environment

### Example MCP Client Configuration

For Claude Desktop or other MCP clients, add this to your configuration:

```json
{
  "mcpServers": {
    "tetika-agent": {
      "command": "node",
      "args": ["/path/to/your/tetika/mcp/servers/tetika-agent.js"],      "env": {
        "OPENROUTER_API_KEY": "your_key_here",
        "SERPAPI_API_KEY": "your_key_here"
      }
    }
  }
}
```

## Development

### File Structure

```
mcp/
├── servers/
│   ├── tetika-agent.js      # Main MCP server (JavaScript)
│   └── tetika-agent.ts      # Main MCP server (TypeScript)
├── tools/
│   ├── search.js            # Web search tool
│   ├── chat.js              # AI chat tool
│   ├── file-analysis.js     # File analysis tool
│   └── conversation.js      # Conversation management tool
├── config.json              # MCP server configuration
├── start-server.js          # Server startup script
├── test-server.js           # Server testing script
└── README.md               # This file
```

### Adding New Tools

1. Create a new tool file in the `tools/` directory
2. Export a function that handles the tool logic
3. Add the tool to the server's tool list in `servers/tetika-agent.js`
4. Update this README with the new tool documentation

### Error Handling

The MCP server includes comprehensive error handling:
- Tool execution errors are caught and returned as MCP error responses
- Invalid requests return appropriate error codes
- Server errors are logged for debugging

## Troubleshooting

### Common Issues

1. **API Keys Not Working**
   - Ensure environment variables are set correctly
   - Check that API keys have proper permissions
   - Verify the keys are not expired

2. **Server Won't Start**
   - Check Node.js version (requires Node.js 18+)
   - Ensure all dependencies are installed (`npm install`)
   - Check for port conflicts

3. **Tools Not Working**
   - Verify the main Tetika server is running on localhost:3000
   - Check network connectivity
   - Review server logs for error messages

### Debugging

Enable debug output by setting the environment variable:
```bash
DEBUG=mcp:* npm run mcp:start
```

## Contributing

When contributing to the MCP integration:

1. Follow the existing code structure and patterns
2. Add appropriate error handling
3. Update documentation for new tools
4. Test thoroughly with the test script
5. Ensure compatibility with the MCP specification

## License

This MCP integration follows the same license as the main Tetika project.
