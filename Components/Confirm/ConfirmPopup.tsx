// Components/Confirm/ConfirmPopup.tsx

import { JSX, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IoAlertCircleOutline, IoCheckmarkCircleOutline, IoInformationCircleOutline } from 'react-icons/io5'; // Ajouter icônes

export { ConfirmPopup };

// Niveaux d'alerte pour le style
type DangerLevel = 'confirm' | 'warning' | 'danger';

interface ConfirmPopupProps {
    title: string;
    description?: string; // Texte descriptif principal
    actionText?: string; // Texte pour le bouton d'action principal (ex: "Confirmer", "Supprimer", "Envoyer")
    cancelText?: string; // Texte pour le bouton d'annulation
    onCancel: () => void;
    onAction: () => void; // Renommé depuis onDelete
    dangerLevel?: DangerLevel; // Niveau de danger pour le style
    isLoading?: boolean;
    style?: React.CSSProperties | undefined;
    children?: React.ReactNode; // Pour ajouter du contenu supplémentaire si besoin (ex: input de confirmation)
}

// Mapping DangerLevel -> Styles Tailwind (Couleurs + Icône)
const levelStyles: Record<DangerLevel, { icon: JSX.Element; buttonClasses: string; titleColor: string; descColor: string; iconBg: string; iconColor: string }> = {
    confirm: {
        icon: <IoCheckmarkCircleOutline className="h-6 w-6 text-blue-600" aria-hidden="true" />,
        buttonClasses: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        titleColor: 'text-gray-900',
        descColor: 'text-gray-500',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600' // Inutilisé si icône fournie directement
    },
    warning: {
        icon: <IoAlertCircleOutline className="h-6 w-6 text-yellow-600" aria-hidden="true" />,
        buttonClasses: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500',
        titleColor: 'text-yellow-900',
        descColor: 'text-yellow-700',
        iconBg: 'bg-yellow-100',
        iconColor: 'text-yellow-600'
    },
    danger: {
        icon: <IoAlertCircleOutline className="h-6 w-6 text-red-600" aria-hidden="true" />,
        buttonClasses: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        titleColor: 'text-red-900',
        descColor: 'text-red-700',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600'
    },
};

function ConfirmPopup({
    title,
    description,
    actionText,
    cancelText,
    onCancel,
    onAction, // Renommé
    dangerLevel = 'confirm', // Défaut à 'confirm' (bleu)
    isLoading ,
    style,
    children // Accepter children
}: ConfirmPopupProps) {
    const { t } = useTranslation();

    // Déterminer les textes et styles par défaut
    const finalActionText = actionText || (dangerLevel === 'danger' ? t('common.delete') : t('common.confirm'));
    const finalCancelText = cancelText || t('common.cancel');
    const styles = levelStyles[dangerLevel];

    // Classes communes et spécifiques
    const confirmButtonClasses = `
        inline-flex items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition ease-in-out duration-150 flex-1 sm:flex-none sm:w-auto
        ${styles.buttonClasses}
    `;
    const cancelButtonClasses = `
        inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex-1 sm:flex-none sm:w-auto
    `;

    const [loading, setLoading] = useState(false)


    return (
        // Conteneur Popup
        <div style={style} className="confirm-popup w-full  bg-white rounded-lg shadow-xl p-4 sm:p-6 text-center">

            {/* Icône */}
            {/* Utiliser la couleur d'icône définie dans levelStyles */}
            <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${styles.iconBg}`}>
                {styles.icon}
            </div>

            {/* Titre */}
            <div className="mt-3 text-center sm:mt-5">
                <h3 className={`text-lg font-semibold leading-6 ${styles.titleColor}`} id="modal-title">
                    {title}
                </h3>
                {/* Description */}
                {description && (
                    <div className="mt-2">
                        <p className={`text-sm ${styles.descColor}`}>
                            {description}
                        </p>
                    </div>
                )}
                 {/* Contenu enfant additionnel */}
                 {children && <div className="mt-4 text-left">{children}</div>}
            </div>

            {/* Boutons */}
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
                        onAction()}
                    } // Appeler onAction
                     disabled={isLoading??loading}
                >
                    {(isLoading??loading) ? (
                       <svg className={`animate-spin h-4 w-4  text-white`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    ) : (
                        finalActionText
                    )}
                </button>
            </div>
        </div>
    );
}