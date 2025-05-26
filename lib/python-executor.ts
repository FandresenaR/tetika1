import { PythonShell, Options } from 'python-shell';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

interface PythonExecutionResult {
  success: boolean;
  data?: unknown;
  structure?: Record<string, unknown>;
  patterns?: Record<string, unknown>;
  analysis?: Record<string, unknown>;
  insights?: Record<string, unknown>;
  executionInfo?: {
    executionId: string;
    timestamp: string;
  };
  error?: {
    type: string;
    message: string;
    traceback: string;
  };
}

/**
 * Executes Python code in a temporary file using PythonShell
 * @param code - The Python code to execute
 * @param variables - Variables to pass to the Python script
 * @returns The execution result
 */
export async function execPython(code: string, variables: Record<string, unknown> = {}): Promise<PythonExecutionResult> {  // Create a temporary directory for Python execution
  const tempDir = path.join(os.tmpdir(), 'tetika-python');
  
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Create a unique ID for this execution
    const executionId = uuidv4();
    
    // Prepare Python script with included libraries and helper functions
    const scriptContent = `
import json
import sys
import traceback
import re
import requests
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import pandas as pd
import io
import numpy as np
from collections import Counter
from typing import Dict, List, Any, Tuple, Optional
import base64
from io import BytesIO
import time
import hashlib

# Variables passed from JavaScript
variables = ${JSON.stringify(variables)}

# Helper functions for web scraping
def fetch_url(url, headers=None):
    """Fetch a URL and return the response text"""
    if not headers:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36'
        }
    response = requests.get(url, headers=headers, timeout=30)
    response.raise_for_status()
    return response.text

def parse_html(html):
    """Parse HTML with BeautifulSoup"""
    return BeautifulSoup(html, 'html.parser')

def extract_tables(soup):
    """Extract all tables from the page"""
    tables = []
    for i, table in enumerate(soup.find_all('table')):
        # Try to get table caption if available
        caption = table.find('caption')
        caption_text = caption.get_text(strip=True) if caption else None
        
        # Convert HTML table to pandas DataFrame
        try:
            dfs = pd.read_html(str(table))
            if dfs:
                df = dfs[0]
                # Generate a more meaningful ID based on caption or nearby headings
                table_id = f'table-{i}'
                if caption_text:
                    table_id = f'table-{re.sub(r"[^a-zA-Z0-9]", "-", caption_text.lower())}'
                
                # Check if table has header row
                has_header = True
                if len(df) > 0:
                    # Heuristic: If first row is similar to column names, it's likely a header
                    if df.columns.tolist() == [i for i in range(len(df.columns))]:
                        # No named columns, check if first row might be header
                        if len(df) > 1:
                            first_row = df.iloc[0].tolist()
                            # Convert first row to header and remove it from data
                            df.columns = [str(x) for x in first_row]
                            df = df.iloc[1:]
                            df = df.reset_index(drop=True)
                
                # Convert DataFrame to dict structure
                tables.append({
                    'id': table_id,
                    'caption': caption_text,
                    'headers': df.columns.tolist(),
                    'rows': df.values.tolist(),
                    'metadata': {
                        'rows_count': len(df),
                        'columns_count': len(df.columns),
                        'data_types': {col: str(df[col].dtype) for col in df.columns}
                    }
                })
        except Exception as e:
            # Fallback to manual extraction if pandas fails
            headers = []
            rows = []
            
            # Try to extract headers
            header_row = table.find('thead')
            if header_row:
                headers = [th.get_text(strip=True) for th in header_row.find_all(['th', 'td'])]
            
            # Try to extract rows from table body
            body = table.find('tbody') or table
            for row in body.find_all('tr'):
                cells = [td.get_text(strip=True) for td in row.find_all(['td', 'th'])]
                if cells and (not headers or len(cells) > 0):  # Skip empty rows
                    rows.append(cells)
            
            # If no headers found but rows exist, use first row as header
            if not headers and rows:
                headers = rows[0]
                rows = rows[1:]
            
            # Add table if we found any data
            if headers or rows:
                tables.append({
                    'id': f'table-{i}',
                    'caption': caption_text,
                    'headers': headers,
                    'rows': rows,
                    'metadata': {
                        'rows_count': len(rows),
                        'columns_count': len(headers),
                        'extraction_method': 'manual'
                    }
                })
    
    return tables

def extract_images(soup, base_url):
    """Extract images from the page with details"""
    images = []
    for i, img in enumerate(soup.find_all('img', src=True)):
        if i >= 20:  # Limit to first 20 images
            break
        
        src = img['src']
        if src.startswith('data:'):
            # Skip data URLs
            continue
            
        # Handle relative URLs
        if not src.startswith('http'):
            src = urljoin(base_url, src)
        
        # Get image metadata
        alt_text = img.get('alt', '')
        width = img.get('width', '')
        height = img.get('height', '')
        
        # Find caption if available (common patterns)
        caption = None
        parent = img.parent
        for _ in range(3):  # Look up to 3 levels up
            if parent:
                caption_elem = parent.find(['figcaption', 'caption', '.caption', '.image-caption'])
                if caption_elem:
                    caption = caption_elem.get_text(strip=True)
                    break
                parent = parent.parent
        
        images.append({
            'id': f'img-{i}',
            'src': src,
            'alt': alt_text,
            'width': width,
            'height': height,
            'caption': caption
        })
    
    return images

def detect_data_structure(soup, url):
    """Detect common data structures on the page"""
    base_url = url
    
    structure = {
        'title': soup.title.string.strip() if soup.title else None,
        'meta_description': soup.find('meta', {'name': 'description'})['content'] if soup.find('meta', {'name': 'description'}) else None,
        'headings': {},
        'forms': [],
        'iframes': [],
        'scripts': [],
        'links': [],
        'navigation': {},
        'schema_data': extract_schema_data(soup),
        'content_blocks': identify_content_blocks(soup),
    }
    
    # Extract headings and create page outline
    for level in range(1, 7):
        headings = soup.find_all(f'h{level}')
        if headings:
            structure['headings'][f'h{level}'] = [h.get_text(strip=True) for h in headings]
    
    # Build hierarchical structure of headings
    structure['document_outline'] = build_document_outline(soup)
    
    # Extract forms with detailed info
    for form in soup.find_all('form'):
        form_data = {
            'id': form.get('id', ''),
            'action': form.get('action', ''),
            'method': form.get('method', 'get'),
            'inputs': []
        }
        for inp in form.find_all(['input', 'select', 'textarea']):
            form_data['inputs'].append({
                'name': inp.get('name', ''),
                'type': inp.get('type', inp.name),
                'id': inp.get('id', ''),
                'placeholder': inp.get('placeholder', ''),
                'required': 'required' in inp.attrs or inp.get('required') == True
            })
        structure['forms'].append(form_data)
    
    # Extract iframes
    for iframe in soup.find_all('iframe'):
        structure['iframes'].append({
            'src': iframe.get('src', ''),
            'id': iframe.get('id', ''),
            'title': iframe.get('title', '')
        })
    
    # Extract scripts with src
    for script in soup.find_all('script', src=True):
        structure['scripts'].append(script['src'])
    
    # Extract links (limit to 50)
    for i, link in enumerate(soup.find_all('a', href=True)):
        if i >= 50:
            break
        href = link['href']
        text = link.get_text(strip=True) or href
        structure['links'].append({
            'url': href, 
            'text': text,
            'title': link.get('title', ''),
            'is_external': not href.startswith('/') and urlparse(href).netloc != urlparse(base_url).netloc if href.startswith('http') else False
        })
    
    # Try to identify navigation structure
    nav_elements = soup.find_all(['nav', 'div'], class_=lambda c: c and any(nav_term in str(c) for nav_term in ['nav', 'menu', 'header-links', 'main-menu']))
    
    if nav_elements:
        primary_nav = nav_elements[0]  # Take the first nav element as primary
        nav_links = []
        
        for link in primary_nav.find_all('a', href=True):
            nav_links.append({
                'text': link.get_text(strip=True),
                'url': link['href'],
                'is_active': 'active' in link.get('class', []) if link.get('class') else False
            })
        
        structure['navigation'] = {
            'primary_nav': nav_links,
            'has_dropdown': any('dropdown' in str(el.get('class', '')) for el in primary_nav.find_all())
        }
    
    # Try to identify site structure components
    structure['components'] = {
        'has_header': bool(soup.find('header') or soup.find(id=lambda x: x and 'header' in x.lower()) or soup.find(class_=lambda x: x and 'header' in x.lower())),
        'has_footer': bool(soup.find('footer') or soup.find(id=lambda x: x and 'footer' in x.lower()) or soup.find(class_=lambda x: x and 'footer' in x.lower())),
        'has_sidebar': bool(soup.find('aside') or soup.find(id=lambda x: x and ('sidebar' in x.lower() or 'side-bar' in x.lower())) or soup.find(class_=lambda x: x and ('sidebar' in x.lower() or 'side-bar' in x.lower()))),
        'has_search': bool(soup.find('input', {'type': 'search'}) or soup.find('form', class_=lambda x: x and 'search' in x.lower()) or soup.find('form', id=lambda x: x and 'search' in x.lower())),
        'has_pagination': bool(soup.find(class_=lambda x: x and any(term in (x.lower() if x else '') for term in ['pagination', 'pager', 'pages'])))
    }
    
    return structure

def extract_schema_data(soup):
    """Extract structured data (schema.org, JSON-LD, etc.) from the page"""
    schema_data = []
    
    # Extract JSON-LD
    for script in soup.find_all('script', type='application/ld+json'):
        try:
            data = json.loads(script.string)
            schema_data.append({
                'type': 'JSON-LD',
                'data': data
            })
        except:
            pass
    
    # Extract microdata
    items = soup.find_all(itemtype=True)
    for item in items:
        item_data = {
            'type': 'Microdata',
            'itemType': item['itemtype'],
            'properties': {}
        }
        
        # Extract properties
        for prop in item.find_all(itemprop=True):
            prop_name = prop['itemprop']
            if prop.name == 'meta':
                prop_value = prop.get('content', '')
            elif prop.name == 'img':
                prop_value = prop.get('src', '')
            elif prop.name == 'a':
                prop_value = prop.get('href', '')
            elif prop.name == 'time':
                prop_value = prop.get('datetime', prop.get_text(strip=True))
            else:
                prop_value = prop.get_text(strip=True)
            
            item_data['properties'][prop_name] = prop_value
        
        schema_data.append(item_data)
    
    return schema_data

def identify_content_blocks(soup):
    """Identify main content blocks and their structure"""
    blocks = []
    
    # Try to identify main content area
    main_content = soup.find('main') or soup.find('article') or soup.find(id=lambda x: x and x.lower() in ['content', 'main', 'main-content']) or soup.find(class_=lambda x: x and any(term in x.lower() for term in ['content', 'main', 'article', 'post']))
    
    if not main_content:
        # If still not found, try to identify by exclusion (not header, footer, nav, sidebar)
        non_content_tags = ['header', 'footer', 'nav', 'aside']
        non_content_elements = []
        for tag in non_content_tags:
            non_content_elements.extend(soup.find_all(tag))
            non_content_elements.extend(soup.find_all(class_=lambda x: x and tag in x.lower()))
        
        # Remove non-content elements and find the element with most text
        for el in non_content_elements:
            el.extract()
        
        # Find the div with the most text content
        divs = soup.find_all('div')
        if divs:
            main_content = max(divs, key=lambda x: len(x.get_text(strip=True)))
    
    if main_content:
        # Extract sections within main content
        for section in main_content.find_all(['section', 'div'], class_=lambda x: x and any(term in (x.lower() if x else '') for term in ['section', 'block', 'module'])) or [main_content]:
            
            # Find heading if available
            heading = section.find(['h1', 'h2', 'h3', 'h4'])
            heading_text = heading.get_text(strip=True) if heading else None
            
            # Count the types of content in this section
            text_length = len(section.get_text(strip=True))
            images_count = len(section.find_all('img'))
            lists_count = len(section.find_all(['ul', 'ol']))
            
            # Determine the primary content type
            content_type = 'text'
            if images_count > 0 and images_count > text_length / 200:  # Roughly 1 image per 200 chars of text
                content_type = 'image-rich'
            elif lists_count > 0 and lists_count > text_length / 400:
                content_type = 'list-based'
            
            blocks.append({
                'heading': heading_text,
                'content_type': content_type,
                'text_length': text_length,
                'images_count': images_count,
                'lists_count': lists_count,
                'has_table': bool(section.find('table')),
                'id': section.get('id', ''),
                'classes': section.get('class', [])
            })
    
    return blocks

def build_document_outline(soup):
    """Build hierarchical document outline based on heading structure"""
    headings = []
    for i in range(1, 7):
        for heading in soup.find_all(f'h{i}'):
            headings.append({
                'level': i,
                'text': heading.get_text(strip=True),
                'id': heading.get('id', ''),
                'element_position': len(headings)  # To maintain document order
            })
    
    # Sort headings by their position in the document
    headings.sort(key=lambda h: h['element_position'])
    
    # Build hierarchical structure
    outline = []
    current_hierarchy = {i: None for i in range(1, 7)}
    
    for heading in headings:
        level = heading['level']
        
        # Create current heading node
        node = {
            'text': heading['text'],
            'id': heading['id'],
            'children': []
        }
        
        # Determine where to place this heading in the hierarchy
        if level == 1:
            # Top level heading
            outline.append(node)
            current_hierarchy[1] = node
            # Reset lower levels
            for i in range(2, 7):
                current_hierarchy[i] = None
        else:
            # Find the parent heading
            parent_level = level - 1
            while parent_level > 0 and current_hierarchy[parent_level] is None:
                parent_level -= 1
            
            if parent_level > 0:
                # Add to parent
                current_hierarchy[parent_level]['children'].append(node)
            else:
                # No parent found, add to root
                outline.append(node)
            
            # Update current level and reset lower levels
            current_hierarchy[level] = node
            for i in range(level + 1, 7):
                current_hierarchy[i] = None
    
    return outline

def extract_lists(soup):
    """Extract lists from the page with rich information"""
    lists = []
    
    for i, list_elem in enumerate(soup.find_all(['ul', 'ol'])):
        # Check if this list is part of a navigation element and skip if it is
        if list_elem.find_parent(['nav', 'header']) or any('nav' in cls.lower() for cls in list_elem.get('class', [])):
            continue
            
        # Get list type
        list_type = 'ordered' if list_elem.name == 'ol' else 'unordered'
        
        # Extract list items with rich data
        items = []
        for j, li in enumerate(list_elem.find_all('li')):
            # Check for links in the list item
            links = li.find_all('a')
            
            # Extract text and strip list markers
            text = li.get_text(strip=True)
            text = re.sub(r'^[\d\w][\.\)]\s*', '', text)  # Remove potential list markers like "1." or "a."
            
            item_data = {
                'text': text,
                'has_link': len(links) > 0,
                'links': [{
                    'text': a.get_text(strip=True),
                    'href': a.get('href', '')
                } for a in links]
            }
            
            # Check for nested lists
            nested_lists = li.find_all(['ul', 'ol'])
            if nested_lists:
                item_data['has_nested_list'] = True
                item_data['nested_list_type'] = 'ordered' if nested_lists[0].name == 'ol' else 'unordered'
            
            items.append(item_data)
        
        # Look for a heading that might be associated with this list
        heading = None
        current = list_elem.previous_sibling
        for _ in range(3):  # Look back up to 3 elements
            if current and current.name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
                heading = current.get_text(strip=True)
                break
            current = current.previous_sibling if hasattr(current, 'previous_sibling') else None
        
        # Add list if it has items
        if items:
            lists.append({
                'id': list_elem.get('id') or f'list-{i}',
                'type': list_type,
                'items': [item['text'] for item in items],  # Simple format for main items
                'item_count': len(items),
                'heading': heading,
                'rich_items': items  # Detailed format
            })
    
    return lists

def detect_data_patterns(soup, html) -> dict:
    """Detect common data patterns on the page with advanced analysis"""
    
    # Basic text content
    text_content = soup.get_text(strip=True)
    
    patterns = {
        # Financial patterns
        'has_pricing': bool(re.search(r'(\$|€|£|\¥)\s?\d+(\.\d{2})?|price|cost|subscription|plan|monthly|yearly|pricing', html, re.IGNORECASE)),
        'has_currency': bool(re.search(r'(\$|€|£|\¥|USD|EUR|GBP|JPY)', html)),
        
        # Date & time patterns
        'has_date_patterns': bool(re.search(r'\d{2}[\/\.\-]\d{2}[\/\.\-]\d{4}|\d{4}[\/\.\-]\d{2}[\/\.\-]\d{2}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec', html, re.IGNORECASE)),
        'has_time_patterns': bool(re.search(r'\d{1,2}:\d{2}(:\d{2})?(\s?[AP]M)?', html, re.IGNORECASE)),
        
        # Contact information
        'has_email_patterns': bool(re.search(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}', html)),
        'has_phone_patterns': bool(re.search(r'(\+\d{1,3}[\s\-]?)?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}', html)),
        'has_address_patterns': bool(re.search(r'street|avenue|road|boulevard|lane|drive|way|plaza|square|P\.O\. Box|zip code|postal code', html, re.IGNORECASE)),
        
        # E-commerce patterns
        'has_product_listing': bool(re.search(r'(product|item|listing) (grid|list)|add to (cart|basket)|buy now|checkout|price|stock', html, re.IGNORECASE)),
        'has_shopping_cart': bool(re.search(r'(shopping\s?(cart|basket)|checkout|your order)', html, re.IGNORECASE)),
        'has_product_reviews': bool(re.search(r'(customer|product|user)\s?reviews?|ratings?', html, re.IGNORECASE)),
        
        # Navigation patterns
        'has_pagination': bool(re.search(r'(pagination|pager|pages?)', html, re.IGNORECASE) or re.search(r'next\s+page|previous\s+page|page\s+\d+\s+of\s+\d+', html, re.IGNORECASE)),
        'has_breadcrumbs': bool(soup.find(['nav', 'div'], class_=lambda c: c and 'breadcrumb' in (c.lower() if c else ''))),
        
        # Social patterns
        'has_social_sharing': bool(re.search(r'share on|share this|facebook|twitter|instagram|linkedin|pinterest|youtube', html, re.IGNORECASE)),
        'has_social_links': bool(soup.find_all('a', href=lambda h: h and any(s in h.lower() for s in ['facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com']))),
        
        # Media patterns
        'has_video_content': bool(soup.find(['video', 'iframe']) or re.search(r'youtube.com/embed|vimeo.com/video|player.vimeo.com|youtube.com/watch', html, re.IGNORECASE)),
        'has_audio_content': bool(soup.find('audio') or re.search(r'podcast|audio player|listen now', html, re.IGNORECASE)),
        
        # User interaction patterns
        'has_login_form': bool(re.search(r'login|sign in|log in|username|forgot password', html, re.IGNORECASE)),
        'has_signup_form': bool(re.search(r'sign up|register|create account|join now', html, re.IGNORECASE)),
        'has_contact_form': bool(re.search(r'contact us|get in touch|send message|enquiry form', html, re.IGNORECASE)),
        'has_search_functionality': bool(soup.find('input', {'type': 'search'}) or re.search(r'search|find', html, re.IGNORECASE)),
        
        # Content patterns
        'has_blog_structure': bool(re.search(r'blog|article|post date|author|comments|published on', html, re.IGNORECASE)),
        'has_news_structure': bool(re.search(r'news|press release|latest updates|breaking', html, re.IGNORECASE)),
        'has_faq_structure': bool(re.search(r'FAQ|frequently asked questions|Q&A|questions and answers', html, re.IGNORECASE)),
        
        # Technical patterns
        'has_cookie_notice': bool(re.search(r'cookie|cookies policy|we use cookies|accept cookies', html, re.IGNORECASE)),
        'has_privacy_policy': bool(re.search(r'privacy policy|data protection|GDPR', html, re.IGNORECASE)),
        'has_terms_of_service': bool(re.search(r'terms of service|terms and conditions|terms of use', html, re.IGNORECASE)),
        
        # Miscellaneous
        'has_testimonials': bool(re.search(r'testimonials|what our customers say|client feedback|review', html, re.IGNORECASE)),
        'has_call_to_action': bool(re.search(r'get started|learn more|sign up now|try it free|contact us|subscribe', html, re.IGNORECASE))
    }
    
    # Check for multi-language support
    lang_tags = set()
    for element in soup.find_all(attrs={'lang': True}):
        lang_tags.add(element.get('lang', '').split('-')[0])
    
    patterns['has_multi_language'] = len(lang_tags) > 1
    patterns['detected_languages'] = list(lang_tags) if lang_tags else None
    
    # Detect potential website type
    site_type = 'unknown'
    type_score = {
        'e-commerce': 0,
        'blog': 0, 
        'corporate': 0,
        'news': 0,
        'portfolio': 0,
        'educational': 0
    }
    
    # Simple heuristics for website type classification
    if patterns['has_product_listing'] or patterns['has_shopping_cart']:
        type_score['e-commerce'] += 2
    
    if patterns['has_blog_structure']:
        type_score['blog'] += 2
    
    if patterns['has_news_structure']:
        type_score['news'] += 2
    
    if re.search(r'company|about us|our team|mission|vision|careers|jobs', html, re.IGNORECASE):
        type_score['corporate'] += 1
    
    if re.search(r'portfolio|projects|work|gallery|showcase', html, re.IGNORECASE):
        type_score['portfolio'] += 1
    
    if re.search(r'course|lesson|lecture|syllabus|curriculum|student|education|learning', html, re.IGNORECASE):
        type_score['educational'] += 1
    
    # Additional points based on other patterns
    if patterns['has_testimonials']:
        type_score['corporate'] += 0.5
        type_score['portfolio'] += 0.5
    
    if patterns['has_pricing']:
        type_score['e-commerce'] += 0.5
        type_score['corporate'] += 0.5
    
    # Get the site type with the highest score
    if any(score > 1 for score in type_score.values()):
        site_type = max(type_score.items(), key=lambda x: x[1])[0]
    
    patterns['likely_site_type'] = site_type
    patterns['site_type_confidence'] = max(min(1, max(type_score.values()) / 3), 0)  # Scale from 0 to 1
    
    return patterns

def analyze_site_structure(soup, url):
    """Performs a comprehensive analysis of the site structure and content"""
    
    # Basic site properties
    site_analysis = {
        'url': url,
        'domain': urlparse(url).netloc,
        'page_title': soup.title.string.strip() if soup.title else None,
        'meta': {
            'description': soup.find('meta', {'name': 'description'})['content'] if soup.find('meta', {'name': 'description'}) else None,
            'keywords': soup.find('meta', {'name': 'keywords'})['content'] if soup.find('meta', {'name': 'keywords'}) else None,
            'author': soup.find('meta', {'name': 'author'})['content'] if soup.find('meta', {'name': 'author'}) else None,
            'viewport': soup.find('meta', {'name': 'viewport'})['content'] if soup.find('meta', {'name': 'viewport'}) else None
        },
        'favicon': find_favicon(soup, url),
        'main_language': soup.html.get('lang') if soup.html and 'lang' in soup.html.attrs else None
    }
    
    # Page content analysis
    text_content = soup.get_text(" ", strip=True)
    word_count = len(re.findall(r'\\w+', text_content))
    
    # Get text density and reading level
    site_analysis['content_stats'] = {
        'word_count': word_count,
        'paragraph_count': len(soup.find_all('p')),
        'heading_count': sum(len(soup.find_all(f'h{i}')) for i in range(1, 7)),
        'link_count': len(soup.find_all('a')),
        'image_count': len(soup.find_all('img')),
        'script_count': len(soup.find_all('script')),
        'estimated_reading_time': f"{max(1, word_count // 200)} min",  # Assuming 200 words per minute
    }
    
    # Technology detection (basic)
    tech_indicators = {
        'framework': {
            'react': bool(soup.find_all(string=lambda s: s and ('__NEXT_DATA__' in s or 'reactRoot' in s))),
            'vue': bool(soup.find_all(attrs={"data-v-": True}) or soup.find_all(string=lambda s: s and '__vue__' in s)),
            'angular': bool(soup.find_all(attrs={"ng-": True}) or soup.find_all(string=lambda s: s and 'ng' in s)),
            'bootstrap': bool(soup.find_all(class_=lambda c: c and 'bootstrap' in (c.lower() if c else ''))),
            'jquery': bool(soup.find_all('script', src=lambda s: s and 'jquery' in s.lower())),
            'wordpress': bool(soup.find_all(class_=lambda c: c and 'wp-' in (c if c else ''))),
            'tailwind': bool(soup.find_all(class_=lambda c: c and re.search(r'\\b(bg|text|flex|grid|p|m)\\-', c if c else '')))
        }
    }
    
    site_analysis['tech_detection'] = tech_indicators
    
    # Try to identify the website's purpose
    purpose_terms = {
        'e-commerce': ['shop', 'store', 'buy', 'cart', 'checkout', 'product', 'purchase', 'order'],
        'blog': ['blog', 'post', 'article', 'author', 'published', 'comments'],
        'portfolio': ['portfolio', 'project', 'work', 'client', 'showcase'],
        'corporate': ['about us', 'company', 'team', 'mission', 'services', 'solutions'],
        'news': ['news', 'latest', 'update', 'breaking', 'report'],
        'educational': ['course', 'learn', 'lesson', 'tutorial', 'student', 'class']
    }
    
    purpose_scores = {}
    for purpose, terms in purpose_terms.items():
        score = sum(1 for term in terms if re.search(r'\\b' + term + r'\\b', text_content.lower()))
        purpose_scores[purpose] = score
    
    site_analysis['likely_purpose'] = max(purpose_scores.items(), key=lambda x: x[1])[0] if any(purpose_scores.values()) else 'unknown'
    
    # Analyze site usability indicators
    site_analysis['usability'] = {
        'has_search': bool(soup.find('input', {'type': 'search'}) or soup.find('form', {'role': 'search'})),
        'has_navigation': bool(soup.find('nav') or soup.find(attrs={"role": "navigation"})),
        'has_footer_links': bool(soup.find('footer') and soup.find('footer').find('a')),
        'has_social_links': bool(soup.find_all('a', href=lambda h: h and any(s in h.lower() for s in ['facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com']))),
        'has_language_selector': bool(soup.find(class_=lambda c: c and any(term in (c.lower() if c else '') for term in ['lang', 'language', 'translate']))),
        'has_mobile_optimization': bool(soup.find('meta', {'name': 'viewport'}))
    }
    
    return site_analysis

def find_favicon(soup, url):
    """Find favicon for the website"""
    favicon = soup.find('link', rel=lambda r: r and r.lower() in ['icon', 'shortcut icon'])
    if favicon and 'href' in favicon.attrs:
        favicon_url = favicon['href']
        if not favicon_url.startswith('http'):
            return urljoin(url, favicon_url)
        return favicon_url
    return urljoin(url, '/favicon.ico')  # Default location

# Main execution context
try {
    # User-provided code (will be injected below)
    ${code}
    
    # If the user code didn't define 'result', create a default result
    if 'result' not in locals():
        # Try to make a reasonable default if URL was provided
        if 'url' in variables:
            url = variables['url']
            html = fetch_url(url)
            soup = parse_html(html)
            
            # Extract key data
            tables = extract_tables(soup)
            lists = extract_lists(soup)
            images = extract_images(soup, url)
            data_patterns = detect_data_patterns(soup, html)
            structure = detect_data_structure(soup, url)
            site_analysis = analyze_site_structure(soup, url)
            
            # AI-driven content analysis
            content_insights = {
                'main_topic': structure['title'],
                'primary_headings': structure['headings'].get('h1', []) + structure['headings'].get('h2', []),
                'content_type': data_patterns['likely_site_type'],
                'has_data_structures': len(tables) > 0,
                'data_types': [pattern.replace('has_', '') for pattern, exists in data_patterns.items() if exists and pattern.startswith('has_')],
                'key_sections': [block['heading'] for block in structure['content_blocks'] if block.get('heading')]
            }
            
            result = {
                'data': {
                    'tables': tables,
                    'lists': lists,
                    'images': images
                },
                'structure': structure,
                'patterns': data_patterns,
                'analysis': site_analysis,
                'insights': content_insights,
                'url': url,
                'title': structure['title']
            }
        else:
            result = {
                'data': None,
                'message': 'No result generated. Please define a "result" variable in your code.'
            }
    
    # Print the result as JSON so it can be captured by PythonShell
    print(json.dumps({
        'success': True,
        'data': result.get('data'),
        'structure': result.get('structure', {}),
        'patterns': result.get('patterns', {}),
        'analysis': result.get('analysis', {}),
        'insights': result.get('insights', {}),
        'executionInfo': {
            'executionId': '${executionId}',
            'timestamp': __import__('datetime').datetime.now().isoformat()
        }
    }))
except Exception as e:
    error_type = type(e).__name__
    error_message = str(e)
    error_traceback = traceback.format_exc()
    
    print(json.dumps({
        'success': False,
        'error': {
            'type': error_type,
            'message': error_message,
            'traceback': error_traceback
        },
        'executionInfo': {
            'executionId': '${executionId}',
            'timestamp': __import__('datetime').datetime.now().isoformat()
        }
    }))
    sys.exit(1)
`;
      // Write the script to a temporary file
    const scriptPath = path.join(tempDir, `script-${executionId}.py`);
    fs.writeFileSync(scriptPath, scriptContent, 'utf8');
    
    // Execute the Python script
    let result: PythonExecutionResult;
    try {
      const options: Options = {
        mode: 'json' as const,
        pythonOptions: ['-u'], // unbuffered output
        scriptPath: tempDir,
      };
      
      const output = await PythonShell.run(`script-${executionId}.py`, options);
      result = output[0] as PythonExecutionResult; // Get the JSON output
    } catch (err: unknown) {
      console.error('Python execution error:', err);
      // Try to extract error information from stderr if available
      const errorInfo = err && typeof err === 'object' && 'stderr' in err ? 
        { type: 'ExecutionError', message: String((err as {stderr: string}).stderr), traceback: String((err as {traceback?: string}).traceback || '') } :
        { type: 'UnknownError', message: err instanceof Error ? err.message : 'Unknown Python execution error', traceback: '' };
      
      throw new Error(JSON.stringify(errorInfo));
    } finally {
      // Clean up the temporary file
      try {
        fs.unlinkSync(scriptPath);
      } catch (e) {
        console.warn('Failed to clean up temporary Python script:', e);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Python execution system error:', error);
    throw error;
  }
}

/**
 * Check if Python is installed and accessible
 */
export async function checkPythonAvailability(): Promise<{ available: boolean; version?: string; error?: unknown }> {
  try {
    const options: Options = {
      mode: 'text' as const,
      pythonOptions: ['-V'],
    };
    const output = await PythonShell.run('', options);
    return { available: true, version: output[0] };
  } catch (error: unknown) {
    return { available: false, error };
  }
}
