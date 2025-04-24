// Components/SaveButton/SaveButton.tsx
// import './SaveButton.css' // ❌ Supprimer

import { IoCloudUploadSharp, IoWarningOutline } from 'react-icons/io5'; // Ajouter Warning pour état invalide
import { Button } from '../Button/Button'; // Assumer Button refactorisé ou utiliser un simple <button>
import { getImg } from '../Utils/StringFormater';
import { useTranslation } from 'react-i18next'; // ✅ i18n

export { SaveButton };

// Définir les types pour plus de clarté
type ButtonEffect = 'color' | 'height'; // Ou autres effets futurs

interface SaveButtonProps {
    onClick: () => void;
    required?: boolean | null | undefined; // Si le bouton doit être "actif" (action possible)
    title?: string; // Titre personnalisé
    loading?: boolean;
    effect?: ButtonEffect;
    isNew?: boolean; // Indiquer si c'est une action de création
    hasChanges?: boolean; // Indiquer s'il y a des modifications non sauvegardées
}

function SaveButton({
    onClick,
    required = false,
    title,
    loading = false,
    effect = 'color', // Défaut à 'color'
    isNew = false, // Défaut à mode "sauvegarde"
    hasChanges = true // Supposer qu'il y a des changements par défaut si affiché en mode MAJ
}: SaveButtonProps) {
    const { t } = useTranslation(); // ✅ i18n

    // Déterminer le texte et le statut en fonction des props
    let buttonText: string;
    let isDisabled: boolean;
    let showWarning = false;

    if (isNew) {
        buttonText = required ? (title ?? t('common.create')) : t('category.createButtonInvalid'); // Ou autre clé générique
        isDisabled = !required;
        showWarning = !required; // Afficher avertissement si invalide pour création
    } else {
        if (!hasChanges) {
            buttonText = title ?? t('category.noChangesButton');
            isDisabled = true; // Pas cliquable si pas de changements
        } else {
            buttonText = required ? (title ?? t('common.save')) : t('category.saveButtonInvalid');
            isDisabled = !required;
            showWarning = !required; // Afficher avertissement si changements invalides
        }
    }

    // Ajouter état loading
    if (loading) {
        buttonText = isNew ? t('common.creating') : t('common.saving'); // 🌍 i18n
        isDisabled = true;
    }

    // --- Styles Tailwind ---
    // Classes de base
    const baseClasses = "save-button flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-base font-medium shadow-lg transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2";

    // Classes pour état actif/requis (couleur primaire)
    const activeClasses = "bg-gradient-to-br from-blue-500 to-blue-700 text-white hover:from-blue-600 hover:to-blue-800 focus:ring-blue-500 cursor-pointer";

    // Classes pour état inactif/non requis (gris)
    const inactiveClasses = "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-600 cursor-not-allowed";

    // Classes spécifiques à l'effet (simple changement de couleur ici)
    const effectClasses = required ? activeClasses : inactiveClasses;


    return (
        // Utiliser un simple <button> pour une meilleure sémantique et accessibilité
        <button
            type="button" // Important pour éviter soumission de formulaire parent
            onClick={onClick}
            disabled={isDisabled || loading} // Désactiver si invalide OU chargement
            className={`${baseClasses} ${effectClasses}`}
            style={{
                // Ajouter des styles inline si nécessaire (ex: pour effets complexes non gérés par classes)
                 minWidth: '200px' // Assurer une largeur minimale
            }}
        >
            {loading ? (
                // Spinner ou animation de chargement
                 <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
            ) : (
                 // Icône Upload ou Warning
                 showWarning ? <IoWarningOutline size={20} className="-ml-1 mr-2" /> : <IoCloudUploadSharp size={20} className="-ml-1 mr-2" />
            )}
            <span>{buttonText}</span>
        </button>
    );
}

// --- Nouvelles clés i18n ---
/*
{
 "common": {
    // ... clés existantes ...
    "create": "Créer",
    "creating": "Création...",
    "save": "Enregistrer",
    "saving": "Enregistrement..."
 },
 "category": {
     // ... clés existantes ...
     "createButtonInvalid": "Infos manquantes", // Titre si création invalide
     "saveButtonInvalid": "Modifications invalides", // Titre si sauvegarde invalide
     "noChangesButton": "Aucune modification" // Titre si pas de changements
 }
}
*/