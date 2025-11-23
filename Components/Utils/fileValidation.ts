import { getFileType } from './functions';

export const MAX_FILE_SIZE_MB = 12;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export interface FileValidationResult {
  isValid: boolean;
  error?: {
    fileName: string;
    fileSize: number;
    fileType: 'image' | 'video';
  };
}

/**
 * Valide la taille d'un fichier (image ou vidéo)
 * @param file - Le fichier à valider
 * @returns Résultat de la validation avec les détails de l'erreur si invalide
 */
export function validateFileSize(file: File): FileValidationResult {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const fileType = getFileType(file);
    const type: 'image' | 'video' = fileType === 'video' ? 'video' : 'image';
    
    return {
      isValid: false,
      error: {
        fileName: file.name,
        fileSize: file.size,
        fileType: type,
      },
    };
  }

  return { isValid: true };
}

/**
 * Valide plusieurs fichiers et retourne le premier fichier invalide trouvé
 * @param files - Tableau de fichiers à valider
 * @returns Résultat de la validation avec les détails du premier fichier invalide
 */
export function validateFiles(files: File[]): FileValidationResult {
  for (const file of files) {
    const result = validateFileSize(file);
    if (!result.isValid) {
      return result;
    }
  }
  return { isValid: true };
}

