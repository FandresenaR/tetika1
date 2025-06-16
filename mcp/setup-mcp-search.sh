#!/bin/bash

# MCP Web Search Setup Script for Tetika
# This script helps set up the various MCP web search providers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_step() {
    echo -e "${CYAN}🔧 $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install dependencies
install_dependencies() {
    log_step "Installing dependencies..."
    
    # Check for Node.js
    if ! command_exists node; then
        log_error "Node.js is required but not installed. Please install Node.js first."
        exit 1
    fi
    
    # Check for npm
    if ! command_exists npm; then
        log_error "npm is required but not installed. Please install npm first."
        exit 1
    fi
    
    # Check for Docker (for SearXNG)
    if ! command_exists docker; then
        log_warning "Docker not found. SearXNG setup will be skipped."
        SKIP_SEARXNG=true
    fi
    
    # Check for uv (for Fetch MCP)
    if ! command_exists uv; then
        log_info "Installing uv (Python package manager)..."
        curl -LsSf https://astral.sh/uv/install.sh | sh
        source ~/.bashrc
    fi
    
    log_success "Dependencies check completed"
}

# Setup SearXNG
setup_searxng() {
    if [ "$SKIP_SEARXNG" = true ]; then
        log_warning "Skipping SearXNG setup (Docker not available)"
        return
    fi
    
    log_step "Setting up SearXNG..."
    
    # Clone SearXNG MCP if not exists
    if [ ! -d "searxng-mcp" ]; then
        log_info "Cloning SearXNG MCP repository..."
        git clone https://github.com/erhwenkuo/mcp-searxng.git searxng-mcp
    fi
    
    cd searxng-mcp
    
    # Install Python dependencies
    log_info "Installing Python dependencies..."
    uv sync
    
    # Setup SearXNG Docker instance
    cd searxng-docker
    log_info "Starting SearXNG Docker instance..."
    docker compose up -d
    
    # Wait for SearXNG to be ready
    log_info "Waiting for SearXNG to be ready..."
    sleep 10
    
    # Test SearXNG
    if curl -s http://localhost:8888 > /dev/null; then
        log_success "SearXNG is running at http://localhost:8888"
    else
        log_error "SearXNG failed to start"
    fi
    
    cd ../..
}

# Setup Google Custom Search
setup_google_cse() {
    log_step "Setting up Google Custom Search..."
    
    # Install the package
    log_info "Installing Google Custom Search MCP..."
    npm install -g @adenot/mcp-google-search
    
    # Check for required environment variables
    if [ -z "$GOOGLE_API_KEY" ] || [ -z "$GOOGLE_SEARCH_ENGINE_ID" ]; then
        log_warning "Google API credentials not set"
        log_info "Please set the following environment variables:"
        echo "  export GOOGLE_API_KEY=\"your-api-key\""
        echo "  export GOOGLE_SEARCH_ENGINE_ID=\"your-search-engine-id\""
        echo ""
        echo "To get these credentials:"
        echo "1. Go to https://console.cloud.google.com/"
        echo "2. Create/select a project"
        echo "3. Enable Custom Search API"
        echo "4. Create API key in Credentials"
        echo "5. Create Custom Search Engine at https://programmablesearchengine.google.com/"
    else
        log_success "Google Custom Search configured"
    fi
}

# Setup Fetch MCP
setup_fetch_mcp() {
    log_step "Setting up Fetch MCP..."
    
    # Install via pip
    log_info "Installing Fetch MCP server..."
    pip install mcp-server-fetch
    
    log_success "Fetch MCP installed"
}

# Setup Apify RAG Browser
setup_rag_browser() {
    log_step "Setting up Apify RAG Web Browser..."
    
    # Install the package
    log_info "Installing Apify RAG Web Browser MCP..."
    npm install -g @apify/mcp-server-rag-web-browser
    
    # Check for API token
    if [ -z "$APIFY_TOKEN" ]; then
        log_warning "Apify token not set"
        log_info "Please set the APIFY_TOKEN environment variable:"
        echo "  export APIFY_TOKEN=\"your-apify-token\""
        echo ""
        echo "To get an Apify token:"
        echo "1. Go to https://apify.com/"
        echo "2. Sign up/login"
        echo "3. Go to Settings > Integrations"
        echo "4. Copy your API token"
    else
        log_success "Apify RAG Browser configured"
    fi
}

# Create environment file
create_env_file() {
    log_step "Creating environment configuration..."
    
    ENV_FILE=".env.mcp"
    
    cat > "$ENV_FILE" << EOF
# MCP Web Search Environment Configuration
# Copy these to your shell profile or .env file

# Google Custom Search (required for Google CSE provider)
export GOOGLE_API_KEY="your-google-api-key-here"
export GOOGLE_SEARCH_ENGINE_ID="your-search-engine-id-here"

# Apify (required for RAG Web Browser provider)
export APIFY_TOKEN="your-apify-token-here"

# Serper.dev (optional, for Serper provider)
export SERPER_API_KEY="your-serper-api-key-here"

# SerpAPI (existing, for fallback)
export SERPAPI_KEY="your-serpapi-key-here"

# SearXNG instance URL (if self-hosted)
export SEARXNG_URL="http://localhost:8888"
EOF
    
    log_success "Environment file created: $ENV_FILE"
    log_info "Please edit $ENV_FILE and add your API keys"
}

# Test installation
test_installation() {
    log_step "Testing MCP providers..."
    
    # Test Node.js MCP client SDK
    if ! npm list @modelcontextprotocol/sdk >/dev/null 2>&1; then
        log_info "Installing MCP SDK..."
        npm install @modelcontextprotocol/sdk
    fi
    
    # Run the test script
    if [ -f "test-real-servers.js" ]; then
        log_info "Running provider tests..."
        node test-real-servers.js --list
        log_success "Test script is ready"
    else
        log_warning "Test script not found"
    fi
}

# Main setup function
main_setup() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                  MCP Web Search Setup                       ║"
    echo "║                      for Tetika                             ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    log_info "This script will set up MCP web search providers"
    echo
    
    # Check what to install
    if [ "$1" = "--all" ]; then
        INSTALL_ALL=true
    elif [ "$1" = "--help" ]; then
        show_help
        exit 0
    else
        echo "What would you like to install?"
        echo "1) All providers (recommended)"
        echo "2) SearXNG only"
        echo "3) Google Custom Search only"
        echo "4) Fetch MCP only"
        echo "5) Custom selection"
        echo
        read -p "Enter your choice (1-5): " choice
        
        case $choice in
            1) INSTALL_ALL=true ;;
            2) INSTALL_SEARXNG=true ;;
            3) INSTALL_GOOGLE=true ;;
            4) INSTALL_FETCH=true ;;
            5) 
                read -p "Install SearXNG? (y/n): " yn_searxng
                read -p "Install Google CSE? (y/n): " yn_google
                read -p "Install Fetch MCP? (y/n): " yn_fetch
                read -p "Install RAG Browser? (y/n): " yn_rag
                
                [[ $yn_searxng =~ ^[Yy] ]] && INSTALL_SEARXNG=true
                [[ $yn_google =~ ^[Yy] ]] && INSTALL_GOOGLE=true
                [[ $yn_fetch =~ ^[Yy] ]] && INSTALL_FETCH=true
                [[ $yn_rag =~ ^[Yy] ]] && INSTALL_RAG=true
                ;;
            *) log_error "Invalid choice"; exit 1 ;;
        esac
    fi
    
    # Install dependencies
    install_dependencies
    
    # Install selected providers
    if [ "$INSTALL_ALL" = true ] || [ "$INSTALL_SEARXNG" = true ]; then
        setup_searxng
    fi
    
    if [ "$INSTALL_ALL" = true ] || [ "$INSTALL_GOOGLE" = true ]; then
        setup_google_cse
    fi
    
    if [ "$INSTALL_ALL" = true ] || [ "$INSTALL_FETCH" = true ]; then
        setup_fetch_mcp
    fi
    
    if [ "$INSTALL_ALL" = true ] || [ "$INSTALL_RAG" = true ]; then
        setup_rag_browser
    fi
    
    # Create environment file
    create_env_file
    
    # Test installation
    test_installation
    
    echo
    log_success "MCP Web Search setup completed!"
    echo
    log_info "Next steps:"
    echo "1. Edit .env.mcp and add your API keys"
    echo "2. Source the environment: source .env.mcp"
    echo "3. Test providers: node test-real-servers.js"
    echo "4. Run hybrid server: node servers/tetika-agent-advanced.js"
    echo
    log_info "Documentation: see MCP-Migration-Guide.md"
}

show_help() {
    echo "MCP Web Search Setup Script"
    echo
    echo "Usage:"
    echo "  $0 [options]"
    echo
    echo "Options:"
    echo "  --all     Install all providers"
    echo "  --help    Show this help message"
    echo
    echo "Interactive mode (default):"
    echo "  Run without arguments for interactive setup"
    echo
    echo "Providers:"
    echo "  - SearXNG: Meta-search engine (free, Docker required)"
    echo "  - Google CSE: Google Custom Search (paid, API key required)"
    echo "  - Fetch MCP: Web content fetcher (free)"
    echo "  - RAG Browser: Apify web scraper (paid, API token required)"
}

# Run the setup
main_setup "$@"
