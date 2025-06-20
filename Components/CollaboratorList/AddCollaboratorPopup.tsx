// Components/CollaboratorList/AddCollaboratorPopup.tsx

import { useState } from 'react';
import { useTranslation } from "react-i18next";
import { useCreateCollaborator } from "../../api/ReactSublymusApi"; // Importer la mutation
import logger from '../../api/Logger';
import { ApiError } from '../../api/SublymusApi'; // Importer ApiError
import { Confirm } from '../Confirm/Confirm'; // Utiliser Comfirm pour les boutons
import { IoMailOutline } from 'react-icons/io5';
import { showErrorToast, showToast } from '../Utils/toastNotifications';

interface AddCollaboratorPopupProps {
    onSuccess: () => void; // Callback en cas de succès
    onCancel: () => void; // Callback pour annuler/fermer
}

export function AddCollaboratorPopup({ onSuccess, onCancel }: AddCollaboratorPopupProps) {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState<string | null>(null); // Erreur de validation locale ou API
    const [name, setName] = useState('');
    const [nameError, setNameError] = useState<string | null>(null); // Erreur de validation locale ou API

    // Initialiser la mutation
    const createCollaboratorMutation = useCreateCollaborator();
    const isLoading = createCollaboratorMutation.isPending;

    // Validation locale simple de l'email
    const validateForm = (): boolean => {
        let valide = true;
        setEmailError(null); // Reset error
        if (!email || !email.includes('@') || email.trim().length < 5) {
            setEmailError(t('collaborator.validation.emailInvalid')); // Nouvelle clé
            valide = false;
        }
        setNameError(null); // Reset error
        if (!name || name.trim().length < 5) {
            setNameError(t('registerPage.validation.nameRequired')); // Nouvelle clé
            valide = false;
        }
        return valide;
    };

    // Handler pour l'input
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        if (emailError) setEmailError(null); // Clear error on type
    };

    // Handler pour l'input
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
        if (emailError) setNameError(null); // Clear error on type
    };

    // Handler pour la soumission
    const handleSubmit = () => {
        if (!validateForm() || isLoading) {
            return;
        }
        setEmailError(null); // Reset API error message

        createCollaboratorMutation.mutate(
            {
              email,
              dashboard_url: window.location.origin,
              full_name: name,
              setup_account_url: `${window.location.origin}/setup-account`,
            }, // Envoyer l'email directement
            {
              onSuccess: (data) => {
                logger.info(`Collaborator invitation/add request sent for ${email}`, data);
                onSuccess(); // Appeler le callback parent
                showToast("Collaborateur ajouté avec succès"); // ✅ Toast succès
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
                showErrorToast(error); // ❌ Toast erreur
              },
            }
          );
    };

    return (
        // Conteneur Popup : padding, gap
        <div className="add-collaborator-popup p-4 w-full sm:p-6 flex flex-col gap-6 ">

              {/* Name Input */}
              <div>
                <label htmlFor="collaborator-name" className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                    {t('collaborator.nameLabel')}
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IoMailOutline className="h-5 w-5 text-gray-400 dark:text-white/60" />
                    </div>
                    <input
                        type="name"
                        name="name"
                        id="collaborator-name"
                        value={name}
                        onChange={handleNameChange}
                        // Appeler handleSubmit sur Enter
                        onKeyUp={(e) => e.key === 'Enter' && handleSubmit()}
                        className={`block w-full rounded-md shadow-sm sm:text-sm h-10 pl-10 pr-3 ${nameError ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                        placeholder={t('collaborator.namePlaceholder')}
                        disabled={isLoading}
                        autoFocus // Mettre le focus sur l'input à l'ouverture
                    />
                </div>
                {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
                {/* Message d'aide pour S0 */}
                <p className="mt-3 text-xs text-gray-500">{t('collaborator.addNameHelper')}</p>
            </div>
            
            {/* Email Input */}
            <div>
                <label htmlFor="collaborator-email" className="block text-sm font-medium dark:text-white text-gray-700 mb-1">
                    {t('collaborator.emailLabel')}
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IoMailOutline className="h-5 w-5 text-gray-400 dark:text-white/60" />
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
                <p className="mt-3 text-xs text-gray-500 dark:text-white/80">{t('collaborator.addEmailHelper')}</p>
            </div>

            {/* Boutons Confirmation */}
            <Confirm
                onCancel={onCancel}
                confirm={isLoading ? t('common.sending') : t('collaborator.addButtonDirect')}
                onConfirm={handleSubmit}
                canConfirm={!isLoading && !!email.trim() && !!name.trim()} // Actif si email non vide et pas en chargement
            // isLoading={isLoading} // Passer l'état de chargement
            />
        </div>
    );
}
