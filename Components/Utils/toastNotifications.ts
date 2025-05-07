// utils/toastNotifications.ts
import toast from 'react-hot-toast';
import { ApiError } from '../../api/SublymusApi'; // Importer ApiError
import { getI18n } from 'react-i18next';


/**
 * Affiche un toast de succès.
 * @param message Message à afficher. Si non fourni, utilise un message générique.
 */
export const showToast = (
    message?: string,
    level: 'INFO' | 'ERROR' | 'WARNING' | 'CANCEL' | 'SUCCESS' = 'SUCCESS'
  ): void => {
    const i18n = getI18n();
  
    const defaultMessages: Record<typeof level, string> = {
      SUCCESS: i18n.t('api.successDefault', 'Opération réussie !'),
      INFO: i18n.t('api.infoDefault', 'Information.'),
      WARNING: i18n.t('api.warningDefault', 'Attention !'),
      ERROR: i18n.t('api.errorDefault', 'Une erreur est survenue.'),
      CANCEL: i18n.t('api.cancelDefault', 'Opération annulée.'),
    };
  
    const iconThemes: Record<typeof level, { primary: string; secondary: string }> = {
      SUCCESS: { primary: '#10B981', secondary: '#FFFFFF' },  // vert
      INFO:    { primary: '#3B82F6', secondary: '#FFFFFF' },  // bleu
      WARNING: { primary: '#F59E0B', secondary: '#FFFFFF' },  // orange
      ERROR:   { primary: '#EF4444', secondary: '#FFFFFF' },  // rouge
      CANCEL:  { primary: '#6B7280', secondary: '#FFFFFF' },  // gris
    };
  
    const toastStyles: Record<typeof level, React.CSSProperties> = {
      SUCCESS: { background: '#D1FAE5', color: '#065F46', fontSize: '14px' }, // vert
      INFO:    { background: '#DBEAFE', color: '#1E40AF', fontSize: '14px' }, // bleu
      WARNING: { background: '#FEF3C7', color: '#92400E', fontSize: '14px' }, // orange
      ERROR:   { background: '#FECACA', color: '#7F1D1D', fontSize: '14px' }, // rouge
      CANCEL:  { background: '#E5E7EB', color: '#374151', fontSize: '14px' }, // gris
    };
  
    toast(message || defaultMessages[level], {
      iconTheme: iconThemes[level],
      style: toastStyles[level],
    });
  };
  
/**
 * Affiche un toast d'erreur.
 * Tente d'extraire le message depuis ApiError, sinon affiche un message générique.
 * @param error L'erreur interceptée (peut être de type unknown).
 */
export const showErrorToast = (error: any): void => {
    const i18n = getI18n()
    let errorMessage = error// i18n.t('api.errorDefault', 'Une erreur est survenue.'); // Clé i18n pour erreur générique

    if (error instanceof ApiError) {
        // Utiliser le message de l'ApiError s'il existe
        errorMessage = error?.message || errorMessage;
    } else if (error instanceof Error) {
        // Utiliser le message d'une erreur standard JS
        errorMessage = error.message || errorMessage;
    }
    // Vous pourriez ajouter d'autres vérifications de type d'erreur ici

    toast.error(errorMessage, {
        style: {
            // Styles spécifiques erreur si besoin
            background: '#FEE2E2', // Rouge léger Tailwind
            color: '#991B1B',    // Rouge foncé Tailwind
        },
         iconTheme: { // Optionnel: changer couleur icône erreur
           primary: '#EF4444', // Rouge Tailwind
           secondary: '#FFFFFF',
         },
    });
};