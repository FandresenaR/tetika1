/**
 * Helper functions to parse Deep Research mode responses
 */

// Define or import the Source type
export interface Source {
  title: string;
  url: string;
  snippet: string;
  position: number;
}

/**
 * Type for parsed deep research response
 */
export interface ParsedDeepResearchResponse {
  reasoning: string;
  conclusion: string;
  reasoningSources?: Array<{
    reference: string;
    sourceIndex: number;
  }>;
}

/**
 * Extracts reasoning and conclusion sections from Deep Research mode responses
 * Also identifies and links sources to specific reasoning steps
 */
export function parseDeepResearchResponse(
  response: string, 
  sources?: Source[]
): ParsedDeepResearchResponse {
  let reasoning = '';
  let conclusion = '';
  let reasoningSources: Array<{reference: string, sourceIndex: number}> = [];

  // First try with the CONCLUSION format
  const reasoningPattern = /REASONING:\s*([\s\S]*?)(?=\n\nCONCLUSION:)/i;
  const conclusionPattern = /CONCLUSION:\s*([\s\S]*)/i;
  
  const reasoningMatch = response.match(reasoningPattern);
  const conclusionMatch = response.match(conclusionPattern);
  
  if (reasoningMatch && conclusionMatch) {
    reasoning = reasoningMatch[1].trim();
    conclusion = conclusionMatch[1].trim();
    console.log("Deep Research mode: Successfully separated reasoning from conclusion");
    
    // Extract source references from reasoning if sources are provided
    if (sources && sources.length > 0) {
      console.log(`Extracting source references from reasoning with ${sources.length} available sources`);
      reasoningSources = extractSourceReferences(reasoning, sources);
      console.log(`Found ${reasoningSources.length} source references in reasoning`);
    } else {
      console.log("No sources provided, skipping reference extraction");
    }
    
    return { reasoning, conclusion, reasoningSources };
  }
  
  // Fall back to the old ANSWER format for backward compatibility
  const oldReasoningPattern = /REASONING:\s*([\s\S]*?)(?=\n\nANSWER:)/i;
  const oldAnswerPattern = /ANSWER:\s*([\s\S]*)/i;
  
  const oldReasoningMatch = response.match(oldReasoningPattern);
  const oldAnswerMatch = response.match(oldAnswerPattern);
  
  if (oldReasoningMatch && oldAnswerMatch) {
    reasoning = oldReasoningMatch[1].trim();
    conclusion = oldAnswerMatch[1].trim();
    console.log("Deep Research mode: Successfully separated reasoning from answer (legacy format)");
    
    // Extract source references from reasoning if sources are provided
    if (sources && sources.length > 0) {
      reasoningSources = extractSourceReferences(reasoning, sources);
      console.log(`Found ${reasoningSources.length} source references in reasoning (legacy format)`);
    }
    
    return { reasoning, conclusion, reasoningSources };
  }
  
  // Try more flexible patterns
  const altReasoningPattern = /REASONING:?\s*([\s\S]*?)(?=CONCLUSION:|ANSWER:)/i;
  const altConclusionPattern = /(?:CONCLUSION|ANSWER):?\s*([\s\S]*)/i;
  
  const altReasoningMatch = response.match(altReasoningPattern);
  const altConclusionMatch = response.match(altConclusionPattern);
  
  if (altReasoningMatch && altConclusionMatch) {
    reasoning = altReasoningMatch[1].trim();
    conclusion = altConclusionMatch[1].trim();
    console.log("Deep Research mode: Separated reasoning from conclusion using alternative patterns");
    
    // Extract source references from reasoning if sources are provided
    if (sources && sources.length > 0) {
      reasoningSources = extractSourceReferences(reasoning, sources);
      console.log(`Found ${reasoningSources.length} source references in reasoning (alternative patterns)`);
    }
    
    return { reasoning, conclusion, reasoningSources };
  }
  
  // Try to find sections based on common heading patterns
  const headingPattern = /(?:^|\n)(REASONING|CONCLUSION|ANALYSIS|ANSWER)[\s:]*\n/gi;
  const parts = response.split(headingPattern).filter(Boolean);
  
  if (parts.length >= 2) {
    console.log(`Found ${parts.length} sections with heading patterns`);
    
    // Look for the reasoning part
    for (let i = 0; i < parts.length - 1; i++) {
      if (parts[i].toLowerCase().includes("reasoning") || parts[i].toLowerCase().includes("analysis")) {
        reasoning = parts[i].replace(/^(reasoning|analysis):?\s*/i, "").trim();
        
        // Look for the conclusion/answer part after the reasoning
        for (let j = i + 1; j < parts.length; j++) {
          if (parts[j].toLowerCase().includes("answer") || parts[j].toLowerCase().includes("conclusion")) {
            conclusion = parts[j].replace(/^(?:answer|conclusion):?\s*/i, "").trim();
            console.log("Deep Research mode: Manually separated reasoning from conclusion");
            
            // Extract source references from reasoning if sources are provided
            if (sources && sources.length > 0) {
              reasoningSources = extractSourceReferences(reasoning, sources);
              console.log(`Found ${reasoningSources.length} source references in reasoning (manual pattern)`);
            }
            
            return { reasoning, conclusion, reasoningSources };
          }
        }
        break;
      }
    }
  }
  
  // Manual fallback - look for keywords in paragraphs
  if (response.toLowerCase().includes("reasoning") && 
      (response.toLowerCase().includes("answer") || response.toLowerCase().includes("conclusion"))) {
    const paragraphs = response.split(/\n{2,}/);
    
    // Look for the reasoning part
    for (let i = 0; i < paragraphs.length - 1; i++) {
      if (paragraphs[i].toLowerCase().includes("reasoning")) {
        reasoning = paragraphs[i].replace(/^reasoning:?\s*/i, "").trim();
        
        // Look for the conclusion/answer part after the reasoning
        for (let j = i + 1; j < paragraphs.length; j++) {
          if (paragraphs[j].toLowerCase().includes("answer") || paragraphs[j].toLowerCase().includes("conclusion")) {
            conclusion = paragraphs[j].replace(/^(?:answer|conclusion):?\s*/i, "").trim();
            console.log("Deep Research mode: Manually separated reasoning from conclusion by paragraphs");
            
            // Extract source references from reasoning if sources are provided
            if (sources && sources.length > 0) {
              reasoningSources = extractSourceReferences(reasoning, sources);
              console.log(`Found ${reasoningSources.length} source references in reasoning (paragraph split)`);
            }
            
            return { reasoning, conclusion, reasoningSources };
          }
        }
        break;
      }
    }
  }
  
  // If all else fails, split the response in half
  console.log("Deep Research mode: Fallback - using first half as reasoning, second half as conclusion");
  const midpoint = Math.ceil(response.length / 2);
  reasoning = "Analyse du problème:\n\n" + response.substring(0, midpoint);
  conclusion = "Conclusion:\n\n" + response.substring(midpoint);
  
  // Extract source references from reasoning if sources are provided
  if (sources && sources.length > 0) {
    reasoningSources = extractSourceReferences(reasoning, sources);
    console.log(`Found ${reasoningSources.length} source references in reasoning (fallback method)`);
  }
  
  return { reasoning, conclusion, reasoningSources };
}

/**
 * Extracts source references from reasoning text
 * @param reasoning The reasoning text
 * @param sources The available sources
 * @returns Array of source references
 */
function extractSourceReferences(
  reasoning: string, 
  sources: Source[]
): Array<{reference: string, sourceIndex: number}> {
  const sourceReferences: Array<{reference: string, sourceIndex: number}> = [];
  
  // Common reference formats
  const patterns = [
    /\[(\d+)\]/g,       // [1], [2], etc.
    /\((\d+)\)/g,       // (1), (2), etc.
    /\[source\s*(\d+)\]/gi, // [source 1], [Source 2], etc.
    /\(source\s*(\d+)\)/gi, // (source 1), (Source 2), etc.
    /source\s*(\d+):/gi, // Source 1:, source 2:, etc.
    /reference\s*(\d+)/gi, // Reference 1, reference 2, etc.
    /\[ref\s*(\d+)\]/gi, // [ref 1], [Ref 2], etc.
    /\[reference\s*(\d+)\]/gi // [reference 1], [Reference 2], etc.
  ];

  // Process each pattern
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(reasoning)) !== null) {
      const refNumber = parseInt(match[1], 10);
      
      // Check if the reference number is valid (1-based)
      if (refNumber > 0 && refNumber <= sources.length) {
        sourceReferences.push({
          reference: match[0], // The full reference text e.g. [1]
          sourceIndex: refNumber - 1 // Convert to 0-based index
        });
      }
    }
  }
  
  console.log(`Found ${sourceReferences.length} source references in reasoning using ${patterns.length} patterns`);
  
  // If no references found with standard patterns, look for URLs that match source URLs
  if (sourceReferences.length === 0) {
    sources.forEach((source, index) => {
      const sourceUrl = source.url;
      if (sourceUrl && reasoning.includes(sourceUrl)) {
        sourceReferences.push({
          reference: sourceUrl,
          sourceIndex: index
        });
      }
    });
    
    if (sourceReferences.length > 0) {
      console.log(`Found ${sourceReferences.length} URL references in reasoning as fallback`);
    }
  }
  
  // As a last resort, look for titles from the sources
  if (sourceReferences.length === 0) {
    sources.forEach((source, index) => {
      const title = source.title;
      if (title && title.length > 15 && reasoning.includes(title)) {
        sourceReferences.push({
          reference: title,
          sourceIndex: index
        });
        console.log(`Found title reference: "${title.substring(0, 30)}..."`);
      }
    });
    
    if (sourceReferences.length > 0) {
      console.log(`Found ${sourceReferences.length} title references in reasoning as last resort`);
    }
  }
  
  return sourceReferences;
}
