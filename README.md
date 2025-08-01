# Tetika

Tetika is a futuristic, secure AI chat interface built with Next.js. It provides a powerful conversational AI experience with support for multiple language models, web search enhancement, and file analysis capabilities, including images and videos.

## Versions
- **v0.2.0** (Current): Added Settings button and improved local API key management
- **v0.1.0**: Initial release with multi-model support and RAG capabilities

## Features

- **Multi-model support**: Connect to various AI models through OpenRouter
- **RAG (Retrieval-Augmented Generation)**: Enhanced responses with real-time web search integration
- **Advanced file analysis**: 
  - Upload documents for the AI to analyze and discuss
  - Analyze images using AI vision capabilities with compatible models
  - Extract metadata from video files
- **MCP Agent**: Model Context Protocol server integration for external tool access
- **Modern UI**: Clean, responsive interface built with Tailwind CSS
- **Secure by design**: Your API keys are stored locally in browser storage
- **Settings Management**: Convenient settings button to manage API keys and preferences
- **Multi-Provider Web Search**: 
  - **Fetch MCP**: Direct web fetching with DuckDuckGo and Wikipedia (no API key required)
  - **SearXNG**: Open source metasearch engine
  - **SerpAPI**: Professional search API with fallback support

## Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- An OpenRouter API key ([Get one here](https://openrouter.ai))
- Optional: SerpAPI key for web search capability ([Sign up here](https://serpapi.com))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/FandresenaR/tetika.git
cd tetika
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser

5. Enter your OpenRouter API key when prompted to start using Tetika

## Environment Variables

Create a `.env.local` file in the root directory with the following (optional) variables:

```
SERPAPI_API_KEY=your_serpapi_key_here
```

## Usage

- **Standard Chat Mode**: Default conversation with your selected AI model
- **RAG Mode**: Enhanced responses with real-time web search results and citations
- **File Analysis**: Upload documents for the AI to analyze and discuss

## Technologies Used

- [Next.js 15](https://nextjs.org/)
- [React 19](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [OpenRouter API](https://openrouter.ai/docs)

## MCP Agent

Tetika includes a Model Context Protocol (MCP) server that exposes its capabilities as standardized tools for external applications.

### Features

- **Web Search Tool**: Search the web using SerpAPI integration
- **AI Chat Tool**: Interact with AI models through OpenRouter
- **File Analysis Tool**: Analyze documents, images, and videos
- **Conversation Management**: Create, read, update, delete chat sessions
- **System Status**: Get Tetika configuration and capabilities

### Usage

1. **Web Interface**: Access the MCP Agent interface at `/mcp-agent` or click the "MCP Agent" button in the main chat interface.

2. **MCP Server**: Start the standalone MCP server for external clients:
```bash
npm run mcp:start
```

3. **Testing**: Test the MCP server functionality:
```bash
npm run mcp:test
```

### External Integration

For MCP clients like Claude Desktop, add this configuration:

```json
{
  "mcpServers": {
    "tetika-agent": {
      "command": "node",
      "args": ["path/to/tetika/mcp/servers/tetika-agent.js"],
      "env": {
        "OPENROUTER_API_KEY": "your_key",
        "SERPAPI_API_KEY": "your_key"
      }
    }
  }
}
```

See the [MCP README](./mcp/README.md) for detailed documentation.

## Architecture & Design Patterns

Tetika implements several design patterns and architectural principles:

- **MVC Pattern**: Separation of data models, views (React components), and controllers (API routes)
- **Repository Pattern**: Abstraction for data storage and retrieval operations
- **Service Pattern**: Encapsulation of external API calls and business logic
- **Strategy Pattern**: Dynamic selection and configuration of AI models
- **Adapter Pattern**: Normalization of different AI model response formats
- **Singleton Pattern**: Single instance management for APIs and storage
- **Factory Pattern**: Creation of categorized models based on descriptions
- **Component-Based Architecture**: Modular, reusable UI components
- **Dependency Injection**: For flexible configuration and testability

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
