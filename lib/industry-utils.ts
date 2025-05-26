/**
 * Industry detection utilities for categorizing companies
 */

/**
 * Healthcare related keywords for detecting healthcare companies
 */
export const healthcareKeywords = [
  'health', 'healthcare', 'medical', 'medicine', 'wellness', 'pharma', 'pharmaceutical', 
  'biotech', 'biotechnology', 'hospital', 'clinique', 'clinic', 'doctor', 'patient',
  'therapy', 'treatment', 'diagnostic', 'device', 'care', 'nursing', 'disease', 'drug',
  'health-tech', 'life science', 'life-science', 'clinical', 'telemedicine', 'telehealth',
  'medtech', 'med-tech', 'ehealth', 'e-health', 'digital health', 'digital-health',
  'health innovation', 'health-innovation', 'health solution', 'health-solution',
  'rehab', 'rehabilitation', 'disability', 'assistive', 'dental', 'vision', 'optical',
  'orthopedic', 'cardio', 'cardiac', 'cancer', 'oncology', 'surgical', 'surgery',
  'vaccine', 'immunology', 'immunotherapy', 'neurology', 'neurological',
  'elderly care', 'elder-care', 'senior care', 'senior-care', 'mental health',
  'psychology', 'psychiatry', 'therapy', 'behavioral', 'healthcare provider',
  'healthcare facility', 'pharmacy', 'pharmacist', 'healthcare professional',
  'medical device', 'medical equipment', 'medical supplies', 'medical imaging',
  'medical technology', 'medical records', 'electronic health', 'health insurance',
  'healthcare management', 'healthcare system', 'healthcare service', 'healthcare solution',
  'medical solution', 'medical service', 'patient care', 'patient monitoring',
  'health monitoring', 'health tracking', 'fitness tracking', 'preventative',
  'preventive', 'preventative care', 'preventive care', 'medical research',
  'health research', 'healthcare research', 'medical education', 'health education',
  'healthcare education', 'medical training', 'health training', 'healthcare training'
];

/**
 * Industry categories for tagging companies
 */
export const industryCategories: Record<string, string> = {
  'health': 'Healthcare & Wellness',
  'wellness': 'Healthcare & Wellness',
  'medical': 'Healthcare & Wellness',
  'pharma': 'Healthcare & Wellness',
  'hospital': 'Healthcare & Wellness',
  'clinic': 'Healthcare & Wellness',
  'biotech': 'Healthcare & Wellness',
  'patient': 'Healthcare & Wellness',
  'doctor': 'Healthcare & Wellness',
  'therapy': 'Healthcare & Wellness',
  'ai': 'Artificial Intelligence',
  'artificial intelligence': 'Artificial Intelligence',
  'machine learning': 'Artificial Intelligence',
  'data science': 'Artificial Intelligence',
  'neural': 'Artificial Intelligence',
  'nlp': 'Artificial Intelligence',
  'computer vision': 'Artificial Intelligence',
  'deep learning': 'Artificial Intelligence',
  'deep tech': 'Deep Tech & Quantum Computing',
  'quantum': 'Deep Tech & Quantum Computing',
  'robotics': 'Deep Tech & Quantum Computing',
  'nanotech': 'Deep Tech & Quantum Computing',
  'supply chain': 'Industry & Supply Chain',
  'industry': 'Industry & Supply Chain',
  'manufacturing': 'Industry & Supply Chain',
  'logistics': 'Industry & Supply Chain',
  'factory': 'Industry & Supply Chain',
  'fintech': 'Fintech',
  'finance': 'Fintech',
  'banking': 'Fintech',
  'payment': 'Fintech',
  'investment': 'Fintech',
  'insurance': 'Fintech',
  'retail': 'Retail & E-commerce',
  'e-commerce': 'Retail & E-commerce',
  'ecommerce': 'Retail & E-commerce',
  'commerce': 'Retail & E-commerce',
  'shop': 'Retail & E-commerce',
  'marketplace': 'Retail & E-commerce',
  'sustainable': 'Sustainability',
  'climate': 'Sustainability',
  'green': 'Sustainability',
  'renewable': 'Sustainability',
  'environment': 'Sustainability',
  'clean': 'Sustainability',
  'mobility': 'Mobility',
  'transportation': 'Mobility',
  'automotive': 'Mobility',
  'vehicle': 'Mobility',
  'travel': 'Mobility',
  'cyber': 'Cybersecurity',
  'security': 'Cybersecurity',
  'privacy': 'Cybersecurity',
  'encryption': 'Cybersecurity',
  'protection': 'Cybersecurity',
  'food': 'Food & Agriculture',
  'agriculture': 'Food & Agriculture',
  'farm': 'Food & Agriculture',
  'agtech': 'Food & Agriculture'
};

/**
 * Map subcategories to their parent categories
 */
export const subcategoryMap: Record<string, string[]> = {
  'Healthcare & Wellness': [
    'Pharmaceuticals', 'Medical Devices', 'Diagnostics', 'Health IT',
    'Digital Health', 'Biotechnology', 'Telemedicine', 'Medical Equipment'
  ],
  'Artificial Intelligence': [
    'Machine Learning', 'Natural Language Processing', 'Computer Vision',
    'Predictive Analytics', 'Neural Networks', 'AI Applications'
  ],
  'Deep Tech & Quantum Computing': [
    'Quantum Computing', 'Nanotechnology', 'Advanced Materials',
    'Robotics', 'Space Tech', 'Biotechnology'
  ],
  'Industry & Supply Chain': [
    'Manufacturing', 'Logistics', 'Supply Chain Management',
    'Industrial Automation', 'Industrial IoT', 'Quality Control'
  ],
  'Fintech': [
    'Payments', 'Banking', 'Insurance', 'Wealth Management',
    'Cryptocurrency', 'Blockchain', 'RegTech', 'Financial Services'
  ],
  'Retail & E-commerce': [
    'E-commerce Platforms', 'Retail Technology', 'Consumer Goods',
    'Marketplaces', 'Omnichannel', 'Last Mile Delivery'
  ],
  'Sustainability': [
    'CleanTech', 'Renewable Energy', 'Waste Management',
    'Circular Economy', 'Green Technology', 'Carbon Capture'
  ]
};

/**
 * Detect if a text contains healthcare-related terms
 * @param text Text to analyze
 * @returns True if healthcare-related terms are found
 */
export function isHealthcareRelated(text: string): boolean {
  if (!text) return false;
  
  const lowerText = text.toLowerCase();
  return healthcareKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

/**
 * Extract industry tags from text
 * @param text Text to analyze
 * @returns Array of industry tags
 */
export function extractIndustryTags(text: string): string[] {
  if (!text) return [];
  
  const lowerText = text.toLowerCase();
  const tags = new Set<string>();
  
  // Check for industry categories
  for (const [keyword, category] of Object.entries(industryCategories)) {
    if (lowerText.includes(keyword.toLowerCase())) {
      tags.add(`#${category}`);
    }
  }
  
  // If we found healthcare related terms, also add relevant subcategories
  if (tags.has('#Healthcare & Wellness')) {
    // Look for subcategories
    for (const subcat of subcategoryMap['Healthcare & Wellness']) {
      if (lowerText.includes(subcat.toLowerCase())) {
        tags.add(`#${subcat}`);
      }
    }
    
    // Add more specific healthcare-related tags based on keywords
    if (lowerText.includes('pharma') || lowerText.includes('drug') || lowerText.includes('medication')) {
      tags.add('#Pharmaceuticals');
    }
    if (lowerText.includes('device') || lowerText.includes('equipment') || lowerText.includes('implant')) {
      tags.add('#Medical Devices');
    }
    if (lowerText.includes('biotech') || lowerText.includes('gene') || lowerText.includes('cell')) {
      tags.add('#Biotechnology');
    }
    if (lowerText.includes('digital') || lowerText.includes('platform') || lowerText.includes('software')) {
      tags.add('#Digital Health');
    }
    if (lowerText.includes('tele') || lowerText.includes('remote') || lowerText.includes('virtual')) {
      tags.add('#Telemedicine');
    }
  }
  
  return Array.from(tags);
}
