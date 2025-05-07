// Components/Confirm/ConfirmDelete.tsx
// import './ConfirmDelete.css'; // ❌ Supprimer

import { useState } from 'react';
import { getImg } from '../Utils/StringFormater'; // Garder pour le spinner
import { useTranslation } from 'react-i18next'; // ✅ i18n
import { IoAlertCircleOutline } from 'react-icons/io5'; // Ajouter icône d'avertissement

export { ConfirmDelete };

interface ConfirmDeleteProps {
    title: string; // Titre principal de la confirmation
    description?: string; // Texte descriptif/avertissement supplémentaire
    warningText?: string; // Texte d'avertissement spécifique (alternative à description)
    confirmText?: string; // Texte pour le bouton de confirmation (ex: "Supprimer")
    cancelText?: string; // Texte pour le bouton d'annulation
    onCancel: () => void;
    onDelete: () => void; // Renommer en onConfirm pour plus de généricité? Gardons onDelete pour l'instant.
    isDanger?: boolean; // Pour appliquer le style rouge par défaut
    isLoading?: boolean; // Pour afficher le spinner et désactiver
    style?: React.CSSProperties | undefined; // Garder pour styles inline spécifiques
}

function ConfirmDelete({
    title,
    description,
    warningText, // Utiliser warningText ou description
    confirmText,
    cancelText,
    onCancel,
    onDelete,
    isDanger = true, // Rouge par défaut pour suppression
    isLoading,
    style
}: ConfirmDeleteProps) {
    const { t } = useTranslation(); // ✅ i18n

    // Déterminer les textes des boutons
    const finalConfirmText = confirmText || (isDanger ? t('common.delete') : t('common.confirm'));
    const finalCancelText = cancelText || t('common.cancel');

    // Déterminer les classes du bouton de confirmation
    const confirmButtonClasses = `
        inline-flex items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition ease-in-out duration-150 flex-1 sm:flex-none sm:w-auto
        ${isDanger
            ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
            : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' // Style bleu par défaut si non danger
        }
    `;

    const cancelButtonClasses = `
        inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex-1 sm:flex-none sm:w-auto
    `;

    const [loading, setLoading] = useState(false)

    return (
         // Conteneur principal : padding, max-width, bg, rounded, shadow
         // Retirer le fond semi-transparent d'ici, il est géré par ChildViewer
        <div style={style} className="confirm-delete w-full bg-white rounded-lg shadow-xl p-4 sm:p-6 text-center">

            {/* Icône Avertissement (optionnel) */}
            {isDanger && (
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                    <IoAlertCircleOutline className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
            )}

             {/* Titre */}
            <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg font-semibold leading-6 text-gray-900" id="modal-title">
                    {title}
                </h3>
                {/* Description / Avertissement */}
                 {(description || warningText) && (
                     <div className="mt-2">
                         <p className={`text-sm ${isDanger ? 'text-red-600' : 'text-gray-500'}`}>
                             {description || warningText}
                         </p>
                     </div>
                 )}
            </div>

             {/* Boutons */}
             {/* Utiliser mt-5 sm:mt-6, grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 */}
            <div className="mt-5 sm:mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <button
                    type="button"
                    className={cancelButtonClasses}
                    onClick={onCancel}
                    disabled={isLoading??loading}
                >
                    {finalCancelText}
                </button>
                <button
                    type="button"
                    className={confirmButtonClasses}
                    onClick={()=>{
                        setLoading(true);
                        onDelete();
                    }} // Appeler onDelete au clic
                    disabled={isLoading??loading}
                >
                    {(isLoading??loading) ? (
                         // Spinner intégré
                         <svg className={`animate-spin h-4 w-4 text-white ${isDanger ? '' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                    ) : (
                        finalConfirmText
                    )}
                </button>
            </div>
        </div>
    );
}
