# Tetika

Tetika is a futuristic, secure AI chat interface built with Next.js. It provides a powerful conversational AI experience with support for multiple language models, web search enhancement, and file analysis capabilities, including images and videos.

## Features

- **Multi-model support**: Connect to various AI models through OpenRouter
- **RAG (Retrieval-Augmented Generation)**: Enhanced responses with real-time web search integration
- **Advanced file analysis**: 
  - Upload documents for the AI to analyze and discuss
  - Analyze images using AI vision capabilities with compatible models
  - Extract metadata from video files
- **Modern UI**: Clean, responsive interface built with Tailwind CSS
- **Secure by design**: Your API keys are stored locally, not on any server

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
