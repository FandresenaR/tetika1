/**
 * Utility functions for handling text-to-speech functionality
 */

// Keep track of the current speech instance to stop it when needed
let currentSpeech: SpeechSynthesisUtterance | null = null;

// Store loaded voices
let cachedVoices: SpeechSynthesisVoice[] = [];

/**
 * Get the best voice for a specific language
 * @param lang - Language code (e.g., 'fr-FR', 'en-US')
 */
const getBestVoiceForLanguage = async (lang: string): Promise<SpeechSynthesisVoice | null> => {
  if (!isSpeechSynthesisSupported()) {
    return null;
  }
  
  const voices = await loadVoices();
  if (!voices || voices.length === 0) {
    return null;
  }
  
  // Get language code prefix (e.g., 'fr' from 'fr-FR')
  const langPrefix = lang.split('-')[0].toLowerCase();
  
  // Look for voices that match our language
  const matchingVoices = voices.filter(voice => 
    voice.lang.toLowerCase().startsWith(langPrefix)
  );
  
  if (matchingVoices.length === 0) {
    return null;
  }
  
  // Preference order:
  // 1. Native voices that match the exact locale
  // 2. Native voices that match the language
  // 3. Any voice that matches the exact locale
  // 4. Any voice that matches the language
  
  // Check for native voices with exact locale match
  const exactNativeMatch = matchingVoices.find(
    voice => voice.lang.toLowerCase() === lang.toLowerCase() && voice.localService
  );
  if (exactNativeMatch) return exactNativeMatch;
  
  // Check for native voices with language match
  const nativeMatch = matchingVoices.find(voice => voice.localService);
  if (nativeMatch) return nativeMatch;
  
  // Check for exact locale match
  const exactMatch = matchingVoices.find(
    voice => voice.lang.toLowerCase() === lang.toLowerCase()
  );
  if (exactMatch) return exactMatch;
  
  // Default to first matching voice
  return matchingVoices[0];
};

// Function to load voices and cache them
const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    // If we already have cached voices, return them
    if (cachedVoices.length > 0) {
      resolve(cachedVoices);
      return;
    }
    
    // If speech synthesis is not supported, resolve with empty array
    if (!isSpeechSynthesisSupported()) {
      resolve([]);
      return;
    }
    
    // Try to get voices
    let voices = window.speechSynthesis.getVoices();
    
    if (voices.length > 0) {
      cachedVoices = voices;
      resolve(voices);
      return;
    }
    
    // If voices are not loaded yet, wait for the onvoiceschanged event
    window.speechSynthesis.onvoiceschanged = () => {
      voices = window.speechSynthesis.getVoices();
      cachedVoices = voices;
      resolve(voices);
    };
    
    // Fallback timeout in case the event never fires
    setTimeout(() => {
      if (cachedVoices.length === 0) {
        voices = window.speechSynthesis.getVoices();
        cachedVoices = voices;
        resolve(voices);
      }
    }, 1000);
  });
};

/**
 * Language detection patterns
 */
const langPatterns = {
  fr: {
    words: [
      // Common articles
      'le', 'la', 'les', 'l\'', 'du', 'des', 'un', 'une', 
      // Common conjunctions
      'et', 'ou', 'donc', 'car', 'mais', 'puis', 'alors', 'ainsi', 'cependant', 'néanmoins',
      // Demonstratives
      'ce', 'cet', 'cette', 'ces', 'celui', 'celle', 'ceux', 'celles',
      // Prepositions
      'à', 'de', 'dans', 'par', 'pour', 'avec', 'sans', 'sur', 'sous', 'entre', 'vers',
      // Common adverbs
      'très', 'trop', 'peu', 'beaucoup', 'assez', 'presque',
      // Common words
      'voici', 'voilà', 'bonjour', 'merci', 'oui', 'non', 'bien', 'mal', 'être', 'avoir'
    ],
    specialChars: ['é', 'è', 'ê', 'ë', 'ç', 'à', 'â', 'ù', 'û', 'î', 'ï', 'ô', 'œ'],
    threshold: 0.06 // If 6% of the text contains French-specific patterns
  },
  en: {
    words: [
      // Common articles
      'the', 'a', 'an', 
      // Common conjunctions
      'and', 'or', 'but', 'so', 'because', 'if', 'when', 'while', 'although', 'however',
      // Demonstratives
      'this', 'that', 'these', 'those',
      // Prepositions
      'in', 'on', 'at', 'by', 'for', 'with', 'without', 'about', 'from', 'to', 'of',
      // Common adverbs
      'very', 'too', 'quite', 'rather', 'almost',
      // Common words
      'here', 'there', 'hello', 'thanks', 'yes', 'no', 'well', 'be', 'have', 'would', 'will', 'can'
    ],
    specialChars: [],
    threshold: 0.08
  }
};

/**
 * Check if the browser supports speech synthesis
 */
export const isSpeechSynthesisSupported = (): boolean => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

/**
 * Detects the language of a given text
 * @param text - Text to analyze
 * @returns 'fr-FR' for French or 'en-US' for English
 */
export const detectLanguage = (text: string): string => {
  if (!text || text.trim().length === 0) {
    return 'fr-FR'; // Default to French
  }

  // Use only the first 1000 characters for faster analysis
  const sampleText = text.length > 1000 ? text.substring(0, 1000) : text;
  
  // Normalize and lowercase the text for analysis
  const normalizedText = sampleText.toLowerCase();
  const words = normalizedText.split(/\s+/);
  const totalWords = words.length;

  if (totalWords === 0) {
    return 'fr-FR';
  }

  // Count French and English patterns
  let frenchScore = 0;
  let englishScore = 0;

  // Count occurrences of common words
  words.forEach(word => {
    // Remove punctuation
    const cleanWord = word.replace(/[.,;:!?()'"]/g, '');
    
    if (cleanWord.length === 0) return;
    
    if (langPatterns.fr.words.includes(cleanWord)) {
      frenchScore++;
    }
    if (langPatterns.en.words.includes(cleanWord)) {
      englishScore++;
    }
  });

  // Check for language-specific patterns
  
  // French patterns
  const frenchPatterns = [
    // Contractions with apostrophes
    /\b(c'est|qu'il|qu'elle|d'un|j'ai|n'est|s'il|l'on|aujourd'hui|m'a|t'as|s'en)\b/ig,
    // French-specific word endings
    /\b\w+(eau|aux|eaux|eux|ance|ence|ité|té|oir|oire|eur|euse|ère|isme|ment)\b/ig,
    // Typical French constructions
    /\b(ne\s+\w+\s+pas|il\s+y\s+a|est-ce\s+que|qu'est-ce\s+que|il\s+faut)\b/ig,
    // Articles with gender
    /\b(le|la|les|un|une|des|du|au|aux)\s+\w+\b/ig
  ];
  
  // English patterns
  const englishPatterns = [
    // Contractions
    /\b(it's|isn't|don't|can't|that's|there's|i'm|you're|we're|they're|won't|wouldn't|couldn't|shouldn't)\b/ig,
    // English-specific word endings
    /\b\w+(ness|ful|less|ship|tion|sion|ally|ily|ing|ed)\b/ig,
    // Typical English constructions
    /\b(there\s+is|there\s+are|have\s+to|has\s+been|would\s+have|should\s+have)\b/ig,
    // Articles without gender
    /\b(the|a|an)\s+\w+\b/ig
  ];
  
  // Apply pattern matching and add to scores
  frenchPatterns.forEach(pattern => {
    const matches = normalizedText.match(pattern);
    if (matches) {
      frenchScore += matches.length * 1.5; // Weighted more heavily
    }
  });
  
  englishPatterns.forEach(pattern => {
    const matches = normalizedText.match(pattern);
    if (matches) {
      englishScore += matches.length * 1.5; // Weighted more heavily
    }
  });

  // Check for special characters (mainly for French)
  for (const char of langPatterns.fr.specialChars) {
    const regex = new RegExp(char, 'g');
    const matches = normalizedText.match(regex);
    if (matches) {
      frenchScore += matches.length * 0.5; // Weighted less heavily than word patterns
    }
  }

  // Calculate final scores
  // We normalize by the total words to get comparable values
  const frenchPercentage = frenchScore / totalWords;
  const englishPercentage = englishScore / totalWords;

  // Log scores for debugging
  console.log(`Language detection: French score: ${frenchPercentage.toFixed(2)} (${frenchScore}), English score: ${englishPercentage.toFixed(2)} (${englishScore})`);

  // First check for overwhelming evidence in either direction
  if (englishPercentage > frenchPercentage * 1.5) {
    return 'en-US';
  }
  
  if (frenchPercentage > englishPercentage * 1.5) {
    return 'fr-FR';
  }
  
  // For closer calls, look at the absolute score difference
  if (englishPercentage > frenchPercentage) {
    return 'en-US';
  }
  
  // Default to French if scores are equal or French is higher
  return 'fr-FR';
};

/**
 * Speak the given text using the browser's speech synthesis API
 * @param text - Text to be spoken
 * @param lang - Language code (can be auto-detected if not provided)
 */
export const speakText = (text: string, lang?: string): boolean => {
  // Check if speech synthesis is supported
  if (!isSpeechSynthesisSupported()) {
    console.error("Speech synthesis is not supported in this browser");
    return false;
  }

  // First stop any ongoing speech
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
  
  // Auto-detect language if not specified
  const detectedLang = lang || detectLanguage(text);
  // Clean text by removing markdown formatting, code blocks, etc.
  const cleanedText = cleanTextForSpeech(text);
  // Create a new speech utterance
  const utterance = new SpeechSynthesisUtterance(cleanedText);
  utterance.lang = detectedLang;
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  // Try to find a suitable voice for the language
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      // Find the best voice for this language
      getBestVoiceForLanguage(detectedLang).then(bestVoice => {
        if (bestVoice) {
          utterance.voice = bestVoice;
          console.log(`Using voice: ${bestVoice.name} (${bestVoice.lang}) for ${detectedLang}`);
          
          // If we're already speaking, we need to cancel and restart with the new voice
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
          }
        } else {
          console.log(`No specific voice found for ${detectedLang}, using browser default`);
        }
      });
    } catch (e) {
      console.error('Error selecting voice:', e);
    }
  }

  console.log(`Speaking text in detected language: ${detectedLang}`);
  
  // Store the current speech instance
  currentSpeech = utterance;
  // Start speaking
  window.speechSynthesis.speak(utterance);
  
  // Chrome and Edge sometimes stop playing after about 15 seconds
  // This is a workaround for the browser bug
  if (utterance.text.length > 100) {
    const resumeInterval = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        clearInterval(resumeInterval);
      } else {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000); // Every 10 seconds
    
    utterance.onend = () => {
      clearInterval(resumeInterval);
    };
    
    utterance.onerror = () => {
      clearInterval(resumeInterval);
    };
  }
  
  return true;
};

/**
 * Stop the current speech if any
 */
export const stopSpeech = (): void => {
  if (!isSpeechSynthesisSupported()) return;
  
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    currentSpeech = null;
  }
};

/**
 * Check if speech synthesis is currently active
 */
export const isSpeaking = (): boolean => {
  if (!isSpeechSynthesisSupported()) return false;
  
  return window.speechSynthesis.speaking;
};

/**
 * Clean text for speech synthesis by removing markdown, code blocks, URLs, etc.
 * @param text - Original text with potential markdown formatting
 */
const cleanTextForSpeech = (text: string): string => {
  let cleaned = text;
  
  // Remove code blocks (both inline and multi-line)
  cleaned = cleaned.replace(/```[\s\S]*?```/g, 'Code block omitted for speech.');
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  
  // Remove URLs
  cleaned = cleaned.replace(/https?:\/\/[^\s)]+/g, 'URL omitted.');
  
  // Remove markdown headings
  cleaned = cleaned.replace(/#{1,6}\s+/g, '');
  
  // Remove markdown bold and italic
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
  cleaned = cleaned.replace(/__([^_]+)__/g, '$1');
  cleaned = cleaned.replace(/_([^_]+)_/g, '$1');
  
  // Remove markdown list markers
  cleaned = cleaned.replace(/^\s*[-*+]\s+/gm, '');
  cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, '');
  
  return cleaned;
};
