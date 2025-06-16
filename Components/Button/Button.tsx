// Components/Button/Button.tsx

import{ JSX, ButtonHTMLAttributes } from 'react'; // Importer ButtonHTMLAttributes
import { IoChevronForward } from 'react-icons/io5';

export { Button };

// Étendre les props HTML standard du bouton
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    // Props spécifiques au composant
    icon?: JSX.Element;
    title?: string;
    forwardIcon?: JSX.Element | null; // Renommé pour clarté, null pour masquer explicitement
    isVertical?: boolean;
    justifyContent?: 'center' | 'start' | 'end' | 'between' | 'around' | 'evenly'; // Utiliser valeurs Tailwind
    variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'ghost'; // Styles prédéfinis
    size?: 'sm' | 'md' | 'lg'; // Tailles prédéfinies
    loading?: boolean; // État de chargement
    // className est déjà inclus dans ButtonHTMLAttributes
    // onClick est déjà inclus
    // style est déjà inclus
}

// Mapping des styles de variantes vers les classes Tailwind
const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 ',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50  disabled:text-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700  disabled:bg-red-400',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600  disabled:bg-yellow-300',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100  disabled:text-gray-400',
};

// Mapping des tailles vers les classes Tailwind
const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
    md: 'px-4 py-2 text-sm rounded-lg gap-2', // Taille par défaut
    lg: 'px-5 py-2.5 text-base rounded-lg gap-2.5',
};

// Mapping des justifications flexbox
const justifyClasses: Record<NonNullable<ButtonProps['justifyContent']>, string> = {
    start: 'justify-start',
    end: 'justify-end',
    center: 'justify-center',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
};

function Button({
    icon,
    title,
    forwardIcon, // Utiliser nom explicite
    isVertical = false,
    justifyContent = 'start', // Défaut à start
    variant = 'secondary', // Défaut à secondaire (blanc)
    size = 'md', // Défaut à moyen
    loading = false,
    className = '', // Récupérer className des props
    children, // Accepter children pour plus de flexibilité
    ...props // Récupérer toutes les autres props HTML standard (disabled, type, onClick, style, etc.)
}: ButtonProps) {

    // Construire les classes dynamiquement
    const combinedClassName = `
        button inline-flex  items-center border border-transparent font-medium shadow-sm  transition duration-150 ease-in-out
        ${isVertical ? 'flex-col' : 'flex-row'}
        ${justifyClasses[justifyContent]}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${loading ? 'opacity-75 cursor-wait' : 'cursor-pointer'} // Style chargement/désactivé
        ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''} // Style désactivé standard
        ${className} // Appliquer classes personnalisées en dernier
    `.replace(/\s+/g, ' ').trim(); // Nettoyer les espaces

    // Déterminer l'icône forward à afficher
    const finalForwardIcon = forwardIcon === null ? null : (forwardIcon === undefined ? <IoChevronForward className='ml-auto w-4 h-4 dark:text-white/80' /> : forwardIcon);

    return (
        <button
            type="button" // Défaut à button, peut être surchargé par props
            {...props} // Appliquer toutes les autres props HTML
            className={combinedClassName}
            disabled={props.disabled || loading} // Désactiver si loading ou explicitement désactivé
        >
            {/* Indicateur de chargement */}
            {loading && (
                <svg className="animate-spin h-4 w-4 text-currentColor -ml-1 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            )}

            {/* Icône Principale (si fournie et pas en chargement) */}
            {!loading && icon && (
                 // Donner une taille par défaut à l'icône basée sur la taille du bouton?
                 // Pour l'instant, laisser l'icône définir sa taille ou utiliser classes externes.
                <span className="button-icon">{icon}</span>
            )}

            {/* Titre ou Children */}
            {(title || children) && !loading && ( // Ne pas afficher texte si loading? Ou afficher texte + spinner? Affichons texte + spinner.
                 <span className="button-text dark:text-white">{title || children}</span>
            )}

            {/* Icône Forward (si fournie et pas en chargement) */}
            {!loading && finalForwardIcon && (
                <span className={`button-forward ${isVertical ? 'mt-auto' : 'ml-auto'}`}>{finalForwardIcon}</span>
            )}
        </button>
    );
}