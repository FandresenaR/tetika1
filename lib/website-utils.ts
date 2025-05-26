/**
 * Website utilities for scraping and matching company websites
 */

/**
 * Normalize a URL by ensuring it has the proper protocol and structure
 * @param url The URL to normalize
 * @param baseUrl The base URL to use for relative URLs
 * @returns The normalized URL
 */
export function normalizeUrl(url: string, baseUrl: string): string {
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('//')) {
      return `https:${url}`;
    }
    if (url.startsWith('/')) {
      const base = new URL(baseUrl);
      return `${base.protocol}//${base.host}${url}`;
    }
    // Handle www without protocol
    if (url.startsWith('www.')) {
      return `https://${url}`;
    }
    const base = new URL(baseUrl);
    return `${base.protocol}//${base.host}/${url}`;
  } catch {
    return url;
  }
}

/**
 * Check if a domain is related to a company name
 * @param domain Domain name to check
 * @param companyName Company name to match against
 * @returns True if the domain is related to the company name
 */
export function isDomainRelatedToCompany(domain: string, companyName: string): boolean {
  if (!domain || !companyName) return false;
  
  const normalizedDomain = domain.toLowerCase().replace('www.', '');
  const baseNamePart = normalizedDomain.split('.')[0]; // Get the part before the first dot
  
  // Prepare company name for matching
  const possibleDomain = companyName.toLowerCase()
    .replace(/[^\w\s.-]/g, '')  // Remove special chars except dots, hyphens
    .replace(/\s+/g, '')        // Remove spaces
    .replace(/\.$/, '');         // Remove trailing dots
    
  // Additional company name variations for better domain matching
  const companyVariations = [
    possibleDomain,
    // Try removing common suffixes/prefixes
    possibleDomain.replace(/group$|inc$|ltd$|llc$|corp$|sa$|gmbh$|ag$/g, ''),
    // Try abbreviations (take first letter of each word)
    companyName.split(/\s+/).map(word => word.charAt(0)).join('').toLowerCase(),
    // Handle special cases like '&' to 'and'
    companyName.toLowerCase().replace(/&/g, 'and').replace(/[^\w\s.-]/g, '').replace(/\s+/g, '')
  ];
  
  // Check for matches
  for (const variation of companyVariations) {
    if (
      // Domain contains company name or company name variation
      normalizedDomain.includes(variation) || 
      // Company name contains domain
      variation.includes(baseNamePart) ||
      // Check for similarity of beginning characters
      (variation.length > 3 && baseNamePart.includes(variation.substring(0, 3)))
    ) {
      return true;
    }
  }
  
  return false;
}

/**
 * Database of known healthcare companies and their websites
 */
export const healthcareCompanyWebsites: Record<string, string> = {
  "3D BIOTECHNOLOGY SOLUTIONS": "https://3dbiotechnologicalsolutions.com",
  "AALIA.TECH": "https://aalia.tech",
  "AD'OCC - RÉGION OCCITANIE": "https://www.agence-adocc.com",
  "ADCIS - GROUPE EVOLUCARE": "https://www.adcis.net",
  "AMAZE": "https://www.amaze.co",
  "DATEXIM": "https://www.datexim.ai",
  "DEEPGING": "https://deepging.com",
  "FINNOCARE": "https://finnocare.fi",
  "JURATA": "https://jurata.com",
  "MUHCCS": "https://muhc.ca",
  "MEDTRONIC": "https://www.medtronic.com",
  "ABBVIE": "https://www.abbvie.com",
  "NOVARTIS": "https://www.novartis.com",
  "PHILIPS": "https://www.philips.com",
  "ROCHE": "https://www.roche.com",
  "JOHNSON & JOHNSON": "https://www.jnj.com",
  "PFIZER": "https://www.pfizer.com",
  "BAYER": "https://www.bayer.com",
  "SANOFI": "https://www.sanofi.com",
  "SIEMENS HEALTHINEERS": "https://www.siemens-healthineers.com",
  "THERMO FISHER SCIENTIFIC": "https://www.thermofisher.com",
};

/**
 * Database of company name aliases - maps alternate names to canonical names
 */
export const companyAliases: Record<string, string> = {
  "MEDTRONIC INC": "MEDTRONIC",
  "MEDTRONIC PLC": "MEDTRONIC",
  "J&J": "JOHNSON & JOHNSON",
  "J & J": "JOHNSON & JOHNSON",
  "PHILIPS HEALTHCARE": "PHILIPS",
  "ROYAL PHILIPS": "PHILIPS",
  "KONINKLIJKE PHILIPS": "PHILIPS",
  "PFIZER INC": "PFIZER",
  "SANOFI-AVENTIS": "SANOFI",
};
