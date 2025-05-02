// Components/CollaboratorList/AddCollaboratorPopup.tsx

import { useState } from 'react';
import { useTranslation } from "react-i18next";
import { useCreateCollaborator } from "../../api/ReactSublymusApi"; // Importer la mutation
import logger from '../../api/Logger';
import { ApiError } from '../../api/SublymusApi'; // Importer ApiError
import { Confirm } from '../Confirm/Confirm'; // Utiliser Comfirm pour les boutons
import { IoMailOutline } from 'react-icons/io5';

interface AddCollaboratorPopupProps {
    onSuccess: () => void; // Callback en cas de succès
    onCancel: () => void; // Callback pour annuler/fermer
}

export function AddCollaboratorPopup({ onSuccess, onCancel }: AddCollaboratorPopupProps) {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState<string | null>(null); // Erreur de validation locale ou API

    // Initialiser la mutation
    const createCollaboratorMutation = useCreateCollaborator();
    const isLoading = createCollaboratorMutation.isPending;

    // Validation locale simple de l'email
    const validateEmail = (): boolean => {
        setEmailError(null); // Reset error
        if (!email || !email.includes('@') || email.trim().length < 5) {
            setEmailError(t('collaborator.validation.emailInvalid')); // Nouvelle clé
            return false;
        }
        return true;
    };

    // Handler pour l'input
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        if (emailError) setEmailError(null); // Clear error on type
    };

    // Handler pour la soumission
    const handleSubmit = () => {
        if (!validateEmail() || isLoading) {
            return;
        }
        setEmailError(null); // Reset API error message

        createCollaboratorMutation.mutate({
            email
        }, // Envoyer l'email directement
            {
                onSuccess: (data) => {
                    logger.info(`Collaborator invitation/add request sent for ${email}`, data);
                    // Afficher toast succès avec data.message?
                    onSuccess(); // Appeler le callback parent
                },
                onError: (error: ApiError) => {
                    logger.error({ error }, `Failed to add collaborator ${email}`);
                    // Afficher l'erreur API dans le formulaire
                     // Distinguer les erreurs courantes (404 User not found, 409 Already collaborator)
                    if (error.status === 404) {
                         setEmailError(t('collaborator.userNotFound', { email }));
                    } else if (error.status === 409) {
                         setEmailError(t('collaborator.alreadyCollaborator'));
                    } else {
                        setEmailError(error.message || t('error_occurred')); // Erreur générique API
                    }
                    // Afficher un toast d'erreur global?
                }
            }
        );
    };

    return (
        // Conteneur Popup : padding, gap
        <div className="add-collaborator-popup p-4 sm:p-6 flex flex-col gap-4 w-full max-w-md bg-white rounded-lg shadow-xl">
            {/* Email Input */}
            <div>
                <label htmlFor="collaborator-email" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('collaborator.emailLabel')} 
                </label>
                <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <IoMailOutline className="h-5 w-5 text-gray-400" />
                     </div>
                    <input
                        type="email"
                        name="email"
                        id="collaborator-email"
                        value={email}
                        onChange={handleEmailChange}
                        // Appeler handleSubmit sur Enter
                        onKeyUp={(e) => e.key === 'Enter' && handleSubmit()}
                        className={`block w-full rounded-md shadow-sm sm:text-sm h-10 pl-10 pr-3 ${emailError ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                        placeholder={t('collaborator.emailPlaceholder')} 
                        disabled={isLoading}
                        autoFocus // Mettre le focus sur l'input à l'ouverture
                    />
                </div>
                 {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
                 {/* Message d'aide pour S0 */}
                 <p className="mt-1 text-xs text-gray-500">{t('collaborator.addHelpS0')}</p> 
            </div>

            {/* Boutons Confirmation */}
            <Confirm
                onCancel={onCancel}
                confirm={isLoading ? t('common.sending') : t('collaborator.addButtonDirect')} 
                onConfirm={handleSubmit}
                canConfirm={!isLoading && !!email.trim()} // Actif si email non vide et pas en chargement
                // isLoading={isLoading} // Passer l'état de chargement
            />
        </div>
    );
}

// --- Nouvelles clés i18n ---
/*
{
 "collaborator": {
    // ... clés existantes ...
    "addPopupTitle": "Ajouter un Membre à l'Équipe",
    "emailLabel": "Email du collaborateur",
    "emailPlaceholder": "nom@exemple.com",
    "addButtonDirect": "Ajouter le membre",
    "addHelpS0": "L'utilisateur doit déjà avoir un compte Sublymus pour être ajouté.",
    "validation": {
        "emailInvalid": "Veuillez saisir une adresse email valide."
    }
  },
  "common": {
      // ... clés existantes ...
      "sending": "Envoi en cours..."
  }
 // ...
}
*/