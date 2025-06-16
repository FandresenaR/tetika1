# MCP Web Search Setup Script for Tetika (Windows PowerShell)
# This script helps set up the various MCP web search providers

param(
    [switch]$All,
    [switch]$Help,
    [switch]$SearXNG,
    [switch]$GoogleCSE,
    [switch]$FetchMCP,
    [switch]$RAGBrowser
)

# Colors for output
function Write-Info($message) {
    Write-Host "ℹ️  $message" -ForegroundColor Blue
}

function Write-Success($message) {
    Write-Host "✅ $message" -ForegroundColor Green
}

function Write-Warning($message) {
    Write-Host "⚠️  $message" -ForegroundColor Yellow
}

function Write-Error-Custom($message) {
    Write-Host "❌ $message" -ForegroundColor Red
}

function Write-Step($message) {
    Write-Host "🔧 $message" -ForegroundColor Cyan
}

# Check if command exists
function Test-Command($command) {
    $null = Get-Command $command -ErrorAction SilentlyContinue
    return $?
}

# Install dependencies
function Install-Dependencies {
    Write-Step "Checking dependencies..."
    
    # Check for Node.js
    if (-not (Test-Command "node")) {
        Write-Error-Custom "Node.js is required but not installed. Please install Node.js first."
        Write-Info "Download from: https://nodejs.org/"
        exit 1
    }
    
    # Check for npm
    if (-not (Test-Command "npm")) {
        Write-Error-Custom "npm is required but not installed. Please install npm first."
        exit 1
    }
    
    # Check for Docker (for SearXNG)
    if (-not (Test-Command "docker")) {
        Write-Warning "Docker not found. SearXNG setup will be skipped."
        $script:SkipSearXNG = $true
    }
    
    # Check for Python and pip (for Fetch MCP)
    if (-not (Test-Command "python")) {
        Write-Warning "Python not found. Installing Python packages may fail."
    }
    
    Write-Success "Dependencies check completed"
}

# Setup SearXNG
function Setup-SearXNG {
    if ($script:SkipSearXNG) {
        Write-Warning "Skipping SearXNG setup (Docker not available)"
        return
    }
    
    Write-Step "Setting up SearXNG..."
    
    # Clone SearXNG MCP if not exists
    if (-not (Test-Path "searxng-mcp")) {
        Write-Info "Cloning SearXNG MCP repository..."
        git clone https://github.com/erhwenkuo/mcp-searxng.git searxng-mcp
    }
    
    Push-Location searxng-mcp
    
    # Install Python dependencies (assuming uv is available)
    Write-Info "Installing Python dependencies..."
    if (Test-Command "uv") {
        uv sync
    } else {
        Write-Warning "uv not found. Please install manually: pip install -r requirements.txt"
    }
    
    # Setup SearXNG Docker instance
    Push-Location searxng-docker
    Write-Info "Starting SearXNG Docker instance..."
    docker compose up -d
    
    # Wait for SearXNG to be ready
    Write-Info "Waiting for SearXNG to be ready..."
    Start-Sleep 10
    
    # Test SearXNG
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8888" -UseBasicParsing -TimeoutSec 5
        Write-Success "SearXNG is running at http://localhost:8888"
    } catch {
        Write-Error-Custom "SearXNG failed to start"
    }
    
    Pop-Location
    Pop-Location
}

# Setup Google Custom Search
function Setup-GoogleCSE {
    Write-Step "Setting up Google Custom Search..."
    
    # Install the package
    Write-Info "Installing Google Custom Search MCP..."
    npm install -g @adenot/mcp-google-search
    
    # Check for required environment variables
    $googleApiKey = [Environment]::GetEnvironmentVariable("GOOGLE_API_KEY")
    $searchEngineId = [Environment]::GetEnvironmentVariable("GOOGLE_SEARCH_ENGINE_ID")
    
    if (-not $googleApiKey -or -not $searchEngineId) {
        Write-Warning "Google API credentials not set"
        Write-Info "Please set the following environment variables:"
        Write-Host "  `$env:GOOGLE_API_KEY = `"your-api-key`""
        Write-Host "  `$env:GOOGLE_SEARCH_ENGINE_ID = `"your-search-engine-id`""
        Write-Host ""
        Write-Host "To get these credentials:"
        Write-Host "1. Go to https://console.cloud.google.com/"
        Write-Host "2. Create/select a project"
        Write-Host "3. Enable Custom Search API"
        Write-Host "4. Create API key in Credentials"
        Write-Host "5. Create Custom Search Engine at https://programmablesearchengine.google.com/"
    } else {
        Write-Success "Google Custom Search configured"
    }
}

# Setup Fetch MCP
function Setup-FetchMCP {
    Write-Step "Setting up Fetch MCP..."
    
    # Install via pip
    Write-Info "Installing Fetch MCP server..."
    try {
        pip install mcp-server-fetch
        Write-Success "Fetch MCP installed"
    } catch {
        Write-Error-Custom "Failed to install Fetch MCP. Please ensure Python and pip are installed."
    }
}

# Setup Apify RAG Browser
function Setup-RAGBrowser {
    Write-Step "Setting up Apify RAG Web Browser..."
    
    # Install the package
    Write-Info "Installing Apify RAG Web Browser MCP..."
    npm install -g @apify/mcp-server-rag-web-browser
    
    # Check for API token
    $apifyToken = [Environment]::GetEnvironmentVariable("APIFY_TOKEN")
    
    if (-not $apifyToken) {
        Write-Warning "Apify token not set"
        Write-Info "Please set the APIFY_TOKEN environment variable:"
        Write-Host "  `$env:APIFY_TOKEN = `"your-apify-token`""
        Write-Host ""
        Write-Host "To get an Apify token:"
        Write-Host "1. Go to https://apify.com/"
        Write-Host "2. Sign up/login"
        Write-Host "3. Go to Settings > Integrations"
        Write-Host "4. Copy your API token"
    } else {
        Write-Success "Apify RAG Browser configured"
    }
}

# Create environment file
function Create-EnvFile {
    Write-Step "Creating environment configuration..."
    
    $envFile = ".env.mcp.ps1"
    
    $envContent = @"
# MCP Web Search Environment Configuration for Windows PowerShell
# Run this script to set environment variables: . .\.env.mcp.ps1

# Google Custom Search (required for Google CSE provider)
`$env:GOOGLE_API_KEY = "your-google-api-key-here"
`$env:GOOGLE_SEARCH_ENGINE_ID = "your-search-engine-id-here"

# Apify (required for RAG Web Browser provider)
`$env:APIFY_TOKEN = "your-apify-token-here"

# Serper.dev (optional, for Serper provider)
`$env:SERPER_API_KEY = "your-serper-api-key-here"

# SerpAPI (existing, for fallback)
`$env:SERPAPI_KEY = "your-serpapi-key-here"

# SearXNG instance URL (if self-hosted)
`$env:SEARXNG_URL = "http://localhost:8888"

Write-Host "🔧 MCP environment variables loaded" -ForegroundColor Green
"@
    
    Set-Content -Path $envFile -Value $envContent
    
    Write-Success "Environment file created: $envFile"
    Write-Info "Please edit $envFile and add your API keys"
    Write-Info "Then run: . .\$envFile"
}

# Test installation
function Test-Installation {
    Write-Step "Testing MCP providers..."
    
    # Check if MCP SDK is available
    $mcpInstalled = npm list -g @modelcontextprotocol/sdk 2>$null
    if (-not $mcpInstalled) {
        Write-Info "Installing MCP SDK..."
        npm install -g @modelcontextprotocol/sdk
    }
    
    # Check if test script exists
    if (Test-Path "test-real-servers.js") {
        Write-Info "Running provider tests..."
        node test-real-servers.js --list
        Write-Success "Test script is ready"
    } else {
        Write-Warning "Test script not found"
    }
}

# Show help
function Show-Help {
    Write-Host @"
MCP Web Search Setup Script for Windows

Usage:
  .\setup-mcp-search.ps1 [options]

Options:
  -All         Install all providers
  -SearXNG     Install SearXNG only
  -GoogleCSE   Install Google Custom Search only
  -FetchMCP    Install Fetch MCP only
  -RAGBrowser  Install RAG Browser only
  -Help        Show this help message

Interactive mode (default):
  Run without arguments for interactive setup

Providers:
  - SearXNG: Meta-search engine (free, Docker required)
  - Google CSE: Google Custom Search (paid, API key required)  
  - Fetch MCP: Web content fetcher (free)
  - RAG Browser: Apify web scraper (paid, API token required)

Examples:
  .\setup-mcp-search.ps1 -All
  .\setup-mcp-search.ps1 -SearXNG -GoogleCSE
"@
}

# Main setup function
function Main-Setup {
    Write-Host @"
╔══════════════════════════════════════════════════════════════╗
║                  MCP Web Search Setup                       ║
║                      for Tetika                             ║
║                    (Windows PowerShell)                     ║
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan
    
    Write-Info "This script will set up MCP web search providers"
    Write-Host ""
    
    # Handle command line arguments
    if ($Help) {
        Show-Help
        return
    }
    
    # Determine what to install
    $installSearXNG = $false
    $installGoogle = $false
    $installFetch = $false
    $installRAG = $false
    
    if ($All) {
        $installSearXNG = $true
        $installGoogle = $true
        $installFetch = $true
        $installRAG = $true
    } elseif ($SearXNG -or $GoogleCSE -or $FetchMCP -or $RAGBrowser) {
        $installSearXNG = $SearXNG
        $installGoogle = $GoogleCSE
        $installFetch = $FetchMCP
        $installRAG = $RAGBrowser
    } else {
        # Interactive mode
        Write-Host "What would you like to install?"
        Write-Host "1) All providers (recommended)"
        Write-Host "2) SearXNG only"
        Write-Host "3) Google Custom Search only"
        Write-Host "4) Fetch MCP only"
        Write-Host "5) Custom selection"
        Write-Host ""
        
        $choice = Read-Host "Enter your choice (1-5)"
        
        switch ($choice) {
            "1" { 
                $installSearXNG = $true
                $installGoogle = $true
                $installFetch = $true
                $installRAG = $true
            }
            "2" { $installSearXNG = $true }
            "3" { $installGoogle = $true }
            "4" { $installFetch = $true }
            "5" {
                $installSearXNG = (Read-Host "Install SearXNG? (y/n)") -eq "y"
                $installGoogle = (Read-Host "Install Google CSE? (y/n)") -eq "y"
                $installFetch = (Read-Host "Install Fetch MCP? (y/n)") -eq "y"
                $installRAG = (Read-Host "Install RAG Browser? (y/n)") -eq "y"
            }
            default {
                Write-Error-Custom "Invalid choice"
                exit 1
            }
        }
    }
    
    # Install dependencies
    Install-Dependencies
    
    # Install selected providers
    if ($installSearXNG) {
        Setup-SearXNG
    }
    
    if ($installGoogle) {
        Setup-GoogleCSE
    }
    
    if ($installFetch) {
        Setup-FetchMCP
    }
    
    if ($installRAG) {
        Setup-RAGBrowser
    }
    
    # Create environment file
    Create-EnvFile
    
    # Test installation
    Test-Installation
    
    Write-Host ""
    Write-Success "MCP Web Search setup completed!"
    Write-Host ""
    Write-Info "Next steps:"
    Write-Host "1. Edit .env.mcp.ps1 and add your API keys"
    Write-Host "2. Load environment: . .\.env.mcp.ps1"
    Write-Host "3. Test providers: node test-real-servers.js"
    Write-Host "4. Run hybrid server: node servers/tetika-agent-advanced.js"
    Write-Host ""
    Write-Info "Documentation: see MCP-Migration-Guide.md"
}

# Initialize variables
$script:SkipSearXNG = $false

# Run the setup
Main-Setup
