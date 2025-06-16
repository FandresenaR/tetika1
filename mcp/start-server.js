#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Path to the MCP server
const serverPath = path.join(__dirname, 'servers', 'tetika-agent.js');

console.log('Starting Tetika MCP Agent Server...');
console.log('Server path:', serverPath);

// Start the MCP server
const server = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
    SERPAPI_API_KEY: process.env.SERPAPI_API_KEY || '',
  }
});

server.on('error', (error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`MCP server exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down MCP server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\nShutting down MCP server...');
  server.kill('SIGTERM');
});
