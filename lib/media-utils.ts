/**
 * Utilitaires pour le traitement des fichiers multimédias (images et vidéos)
 */

/**
 * Extrait les métadonnées basiques d'une image
 * @param file Fichier image
 * @returns Les métadonnées de l'image
 */
export async function extractImageMetadata(file: File): Promise<{
  width: number;
  height: number;
  format: string;
  size: number;
  filename: string;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      // Extraire le format à partir de l'extension du fichier
      const extension = file.name.split('.').pop()?.toLowerCase() || 'unknown';
      const format = extension === 'jpg' ? 'jpeg' : extension;
      
      const metadata = {
        width: img.width,
        height: img.height,
        format,
        size: file.size,
        filename: file.name
      };
      
      URL.revokeObjectURL(objectUrl);
      resolve(metadata);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };
    
    img.src = objectUrl;
  });
}

/**
 * Extrait les métadonnées basiques d'une vidéo
 * @param file Fichier vidéo
 * @returns Les métadonnées de la vidéo
 */
export async function extractVideoMetadata(file: File): Promise<{
  duration: number;
  width: number;
  height: number;
  format: string;
  size: number;
  filename: string;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);
    
    video.onloadedmetadata = () => {
      // Extraire le format à partir de l'extension du fichier
      const extension = file.name.split('.').pop()?.toLowerCase() || 'unknown';
      
      const metadata = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        format: extension,
        size: file.size,
        filename: file.name
      };
      
      URL.revokeObjectURL(objectUrl);
      resolve(metadata);
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load video'));
    };
    
    video.src = objectUrl;
  });
}

/**
 * Détermine si un fichier est une image
 * @param file Fichier à vérifier
 * @returns Vrai si le fichier est une image
 */
export function isImageFile(file: File): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.tiff', '.ico'];
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  return imageExtensions.includes(extension);
}

/**
 * Détermine si un fichier est une vidéo
 * @param file Fichier à vérifier
 * @returns Vrai si le fichier est une vidéo
 */
export function isVideoFile(file: File): boolean {
  const videoExtensions = ['.mp4', '.webm', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.m4v'];
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  return videoExtensions.includes(extension);
}

/**
 * Convertit une image en chaîne base64
 * @param file Fichier image
 * @returns Promesse avec la chaîne base64 de l'image
 */
export function convertImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert image to base64'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Crée une représentation textuelle d'une image avec sa description en base64
 * La représentation inclut les métadonnées et l'image encodée en base64 pour les modèles
 * qui peuvent traiter les images directement
 * @param file Fichier image
 * @returns Description et contenu de l'image au format base64
 */
export async function createImageContentWithBase64(file: File): Promise<{
  description: string;
  base64: string;
}> {
  try {
    const metadata = await extractImageMetadata(file);
    const base64Data = await convertImageToBase64(file);
    
    const description = `[IMAGE]
Filename: ${metadata.filename}
Format: ${metadata.format.toUpperCase()}
Dimensions: ${metadata.width}x${metadata.height} pixels
Size: ${(metadata.size / 1024).toFixed(2)} KB
[/IMAGE]`;
    
    return {
      description,
      base64: base64Data
    };
  } catch (error) {
    console.error('Error creating image content with base64:', error);
    throw error;
  }
}

/**
 * Créer une description textuelle d'un fichier multimédia
 * @param file Fichier multimédia (image ou vidéo)
 * @returns Une description textuelle du fichier
 */
export async function createMediaDescription(file: File): Promise<string> {
  try {
    if (isImageFile(file)) {
      const metadata = await extractImageMetadata(file);
      return `[IMAGE]
Filename: ${metadata.filename}
Format: ${metadata.format.toUpperCase()}
Dimensions: ${metadata.width}x${metadata.height} pixels
Size: ${(metadata.size / 1024).toFixed(2)} KB
[/IMAGE]`;
    } else if (isVideoFile(file)) {
      const metadata = await extractVideoMetadata(file);
      return `[VIDEO]
Filename: ${metadata.filename}
Format: ${metadata.format.toUpperCase()}
Dimensions: ${metadata.width}x${metadata.height} pixels
Duration: ${metadata.duration.toFixed(2)} seconds
Size: ${(metadata.size / (1024 * 1024)).toFixed(2)} MB
[/VIDEO]`;
    } else {
      return `Unknown media type: ${file.name}`;
    }
  } catch (error) {
    console.error('Error creating media description:', error);
    return `Failed to process media file: ${file.name}`;
  }
}