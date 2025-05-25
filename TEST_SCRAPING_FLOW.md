# Test Guide: New Scraping UX Flow

## Overview
The scraping functionality has been improved with a two-step process:

1. **Step 1**: Enter URL → System waits for instructions
2. **Step 2**: Enter prompt → Execute scraping with both URL and prompt

## How to Test

### 1. Start Scraping Mode
- Type `@` in the chat input
- Context menu appears
- Enter a URL (e.g., `https://vivatechnology.com/partners`)
- Click "Start Scraping"

### 2. Expected Behavior After URL Entry
- ✅ Context menu closes
- ✅ Orange "Scraping Mode Active" indicator appears with "RAG AUTO-ON" badge
- ✅ RAG mode automatically activates (toggle switches to RAG)
- ✅ Input placeholder changes to: "Enter instructions for scraping: [URL]"
- ✅ Send button turns orange
- ✅ No immediate scraping execution

### 3. Enter Instructions
- Type your specific extraction instructions, e.g.:
  - "Extract all company names and websites"
  - "Find startup companies with employee counts"
  - "Get partner information including descriptions"
- Press Enter or click Send button

### 4. Expected Scraping Execution
- ✅ Loading state activates
- ✅ API call made with both URL and prompt
- ✅ Success message includes the user's instructions
- ✅ ScrapedDataTable opens with extracted data
- ✅ Companies tab shows business data if detected

### 5. Cancel Scraping Mode
- Click the X button in the orange indicator
- ✅ Scraping mode deactivates
- ✅ RAG mode reverts to previous state (before scraping was activated)
- ✅ Input returns to normal state

## Test URLs
- VivaTechnology Partners: `https://vivatechnology.com/partners`
- CES Exhibitors: `https://www.ces.tech/exhibitors`
- TechCrunch Startup Directory: `https://techcrunch.com/startups`

## Expected Data Extraction
The enhanced scraper should detect:
- Company names
- Website URLs
- Employee counts (when available)
- Descriptions
- Tags/categories
- Contact information

## New Features

### 🤖 Automatic RAG Mode Activation
When entering scraping mode, RAG mode is automatically activated because:
- Scraped data benefits from RAG processing for better analysis
- RAG mode provides enhanced contextual understanding of scraped content
- Automatic activation improves workflow efficiency
- Previous RAG state is preserved and restored when canceling scraping

### Visual Indicators
- **"RAG AUTO-ON"** badge appears in the scraping mode indicator
- RAG toggle automatically switches to ON when scraping starts
- Orange scraping indicator shows both scraping URL and RAG status

## API Changes
- Added `prompt` parameter to scraping API
- Enhanced company data extraction logic
- Better business-focused content selectors
