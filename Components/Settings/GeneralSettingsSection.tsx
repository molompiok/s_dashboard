// Components/Settings/GeneralSettingsSection.tsx

import { useState, useEffect, useCallback } from 'react';
import { StoreInterface } from "../../Interfaces/Interfaces";
import { useTranslation } from "react-i18next";
import { useStartStore, useStopStore, useUpdateStore } from "../../api/ReactSublymusApi"; // Hook pour la mise à jour
import logger from '../../api/Logger';
import { IoCheckmarkCircle, IoInformationCircleOutline, IoPauseCircle, IoPencil, IoPlayCircleOutline, IoStopCircleOutline, IoSyncCircleOutline } from 'react-icons/io5';
import TimezoneSelect, { ITimezoneOption } from 'react-timezone-select'; // Utiliser un sélecteur de fuseau horaire
import { ApiError } from '../../api/SublymusApi';
import { showErrorToast, showToast } from '../Utils/toastNotifications';

// Installer react-timezone-select: npm install react-timezone-select
// Il faudra peut-être aussi installer les types: npm install --save-dev @types/react-timezone-select

interface GeneralSettingsSectionProps {
    store: StoreInterface; // Recevoir les données complètes du store
}

// Champs modifiables dans cette section
type GeneralFormState = Pick<StoreInterface, 'name' | 'title' | 'description'> & {
    timezone?: string; // Ajouter timezone
};

export function GeneralSettingsSection({ store }: GeneralSettingsSectionProps) {
    const { t } = useTranslation();
    const updateStoreMutation = useUpdateStore();
    const startStoreMutation = useStartStore();
    const stopStoreMutation = useStopStore();
    const isActionLoading = startStoreMutation.isPending || stopStoreMutation.isPending; 
    const isLoading = updateStoreMutation.isPending
    // --- État Local du Formulaire ---
    const [formState, setFormState] = useState<GeneralFormState>({
        name: store.name ?? '',
        title: store.title ?? '',
        description: store.description ?? '',
        timezone: store.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone, // Lire timezone depuis store ou détecter
    });
    const [hasChanges, setHasChanges] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

    // Mettre à jour l'état local si la prop store change (ex: après une sauvegarde externe)
    useEffect(() => {
        setFormState({
            name: store.name ?? '',
            title: store.title ?? '',
            description: store.description ?? '',
            timezone: store.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        setHasChanges(false); // Reset état modifié
        setFieldErrors({}); // Reset erreurs
    }, [store]);

    // --- Détection des changements ---
    useEffect(() => {
        // Comparer l'état actuel avec les données originales du store
        const changed = formState.name !== (store.name ?? '') ||
            formState.title !== (store.title ?? '') ||
            formState.description !== (store.description ?? '') ||
            formState.timezone !== (store.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
        setHasChanges(changed);
    }, [formState, store]);

    // --- Handlers ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
        setFieldErrors(prev => ({ ...prev, [name]: '' })); // Reset erreur
    };

    const handleTimezoneChange = (tz: ITimezoneOption | string) => {
        const timezoneValue = typeof tz === 'string' ? tz : tz.value;
        setFormState(prev => ({ ...prev, timezone: timezoneValue }));
        setFieldErrors(prev => ({ ...prev, timezone: '' }));
    };


    // --- Validation Locale ---
    const validateForm = (): boolean => {
        const errors: { [key: string]: string } = {};
        let isValid = true;
        if (!formState.name || formState.name.trim().length < 3) {
            errors.name = t('settingsGeneral.validation.nameRequired');
            isValid = false;
        }
        if (!formState.title || formState.title.trim().length < 3) {
            errors.title = t('settingsGeneral.validation.titleRequired');
            isValid = false;
        }
        // Ajouter validation timezone si nécessaire
        setFieldErrors(errors);
        return isValid;
    };
    const handleStartStop = () => {
        if (isActionLoading || !store.id) return; // Sécurité

        const action = store.is_running ? stopStoreMutation : startStoreMutation;
        const actionName = store.is_running ? 'stop' : 'start';

        action.mutate(
            { store_id: store.id },
            {
              onSuccess: (data) => {
                logger.info(`Store ${actionName} requested successfully`, { storeId: store.id, jobId: data.store });
                showToast(`Demande de ${actionName} envoyée avec succès`); // ✅ Toast succès
                // L'invalidation du cache 'storeDetails' dans le hook mettra à jour l'UI
              },
              onError: (error: ApiError) => {
                logger.error({ error }, `Failed to request store ${actionName} for store ${store.id}`);
                showErrorToast(error); // ❌ Toast erreur
                // On ne revert pas l'état is_running ici car l'état réel est côté serveur
                // et sera mis à jour par le refetch après invalidation.
              },
            }
          );
    };

    // --- Sauvegarde ---
    const handleSaveChanges = () => {
        if (!validateForm() || !hasChanges || updateStoreMutation.isPending) {
            return;
        }

        // Préparer les données à envoyer (seulement les champs de cette section)
        const dataToUpdate: Partial<StoreInterface> = {};
        if (formState.name !== store.name) dataToUpdate.name = formState.name;
        if (formState.title !== store.title) dataToUpdate.title = formState.title;
        if (formState.description !== store.description) dataToUpdate.description = formState.description;
        if (formState.timezone !== store.timezone) dataToUpdate.timezone = formState.timezone; // Envoyer timezone

        // Si aucune donnée n'a réellement changé (double vérification)
        if (Object.keys(dataToUpdate).length === 0) {
            setHasChanges(false); // Marquer comme non modifié
            return;
        }

        // Appel à la mutation (updateStore gère FormData, mais ici on n'a pas de fichier)
        // Il faut adapter `updateStore` dans `SublymusApi` ou créer une méthode spécifique
        // pour envoyer du JSON pour ce cas.
        // Supposons que `updateStore` peut gérer un objet simple pour l'instant
        // ou adapter l'appel ici :
        store.id && updateStoreMutation.mutate(
            { store_id: store.id, data: dataToUpdate }, // Passer l'objet data directement
            {
              onSuccess: () => {
                logger.info(`Store ${store.id} general settings updated`);
                setHasChanges(false); // Reset après succès
                setFieldErrors({});
                showToast("Paramètres généraux de la boutique mis à jour avec succès"); // ✅ Toast succès
                // Les données seront rafraîchies via l'invalidation du hook parent useGetStoreById
              },
              onError: (error: ApiError) => {
                logger.error({ error }, `Failed to update general settings for store ${store.id}`);
                setFieldErrors({ api: error.message }); // Afficher erreur API
                showErrorToast(error); // ❌ Toast erreur
              },
            }
          );

    };

    return (
        // Conteneur Section : bg, rounded, shadow, border
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* En-tête Section */}
            <div className="px-4 py-5 sm:px-6 border-b border-gray-100">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {t('settingsPage.sidebar.general')}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    {t('settingsGeneral.description')}
                </p>
            </div>

            {/* Formulaire */}
            <div className="px-4 py-5 sm:px-6 space-y-6"> {/* Utiliser space-y pour l'espacement */}
                {/* Nom Boutique */}
                <div>
                    <label htmlFor="store-name" className="block text-sm font-medium text-gray-700">{t('settingsGeneral.nameLabel')}</label>
                    <input
                        type="text"
                        name="name"
                        disabled
                        id="store-name"
                        value={formState.name || ''}
                        onChange={handleInputChange}
                        className={`mt-1 opacity-40 block w-full px-4 rounded-md shadow-sm sm:text-sm h-10 ${fieldErrors.name ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                    />
                    {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
                </div>

                {/* Titre Boutique */}
                <div>
                    <label htmlFor="store-title" className="block text-sm font-medium text-gray-700">{t('settingsGeneral.titleLabel')}</label>
                    <input
                        type="text"
                        name="title"
                        id="store-title"
                        value={formState.title || ''}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full px-4 rounded-md shadow-sm sm:text-sm h-10 ${fieldErrors.title ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                    />
                    {fieldErrors.title && <p className="mt-1 text-xs text-red-600">{fieldErrors.title}</p>}
                    <p className="mt-1 text-xs text-gray-500">{t('settingsGeneral.titleHelp')}</p>
                </div>

                {/* Description Boutique */}
                <div>
                    <label htmlFor="store-description" className="block text-sm font-medium text-gray-700">{t('settingsGeneral.storeDescriptionLabel')}</label>
                    <textarea
                        id="store-description"
                        name="description"
                        rows={4}
                        className={`mt-1 block w-full p-4 rounded-md shadow-sm sm:text-sm ${fieldErrors.description ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                        value={formState.description || ''}
                        onChange={handleInputChange}
                    ></textarea>
                    {fieldErrors.description && <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>}
                    <p className="mt-1 text-xs text-gray-500">{t('settingsGeneral.storeDescriptionHelp')}</p>
                </div>

                {/* Fuseau Horaire */}
                <div>
                    <label htmlFor="store-timezone" className="block text-sm font-medium text-gray-700">{t('settingsGeneral.timezoneLabel')}</label>
                    {/* Utiliser react-timezone-select */}
                    {/* Ajouter une classe CSS globale pour styliser ce composant si nécessaire */}
                    <TimezoneSelect
                        id="store-timezone"
                        value={formState.timezone || ''}
                        onChange={handleTimezoneChange}
                        className="mt-1 react-timezone-select" // Classe pour cibler le style global
                        classNamePrefix="react-select" // Préfixe pour les sous-éléments
                    />
                    {fieldErrors.timezone && <p className="mt-1 text-xs text-red-600">{fieldErrors.timezone}</p>}
                    <p className="mt-1 text-xs text-gray-500">{t('settingsGeneral.timezoneHelp')}</p>
                </div>

                {/* Statut Boutique (Lecture Seule) */}
                <div>
                    <span className="block text-sm font-medium text-gray-700">{t('settingsGeneral.statusLabel')}</span>
                    <div className={`mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${store.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {store.is_active ? <IoCheckmarkCircle className="w-4 h-4" /> : <IoPauseCircle className="w-4 h-4"/>}
                        {store.is_active ? t('storesPage.status.active') : t('storesPage.status.inactive')}
                    </div>
                    <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                        <IoInformationCircleOutline className="w-4 h-4" />
                        {t('settingsGeneral.statusHelp')}
                    </p>
                </div>

                   {/* ---- NOUVELLE SECTION POUR is_running ---- */}
                   <div>
                    <span className="block text-sm font-medium text-gray-700">{t('settingsGeneral.runtimeStatusLabel')}</span> 
                    <div className="mt-1 flex items-center gap-4">
                         {/* Indicateur Visuel du Statut */}
                         <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                             store.is_running
                                 ? 'bg-sky-100 text-sky-700' // Bleu clair pour "en cours"
                                 : 'bg-red-100 text-red-700' // Rouge pour "stoppé"
                         }`}>
                             {isActionLoading ? (
                                 <IoSyncCircleOutline className="animate-spin w-3.5 h-3.5" /> // Spinner pendant l'action
                             ) : store.is_running ? (
                                 <IoPlayCircleOutline className="w-4 h-4" /> // Icône Play pour en cours
                             ) : (
                                 <IoStopCircleOutline className="w-4 h-4" /> // Icône Stop pour arrêté
                             )}
                             {isActionLoading
                                 ? (store.is_running ? t('common.stopping') : t('common.starting')) // Texte pendant action
                                 : (store.is_running ? t('storesPage.status.running') : t('storesPage.status.stopped'))} 
                         </span>
                         {/* Bouton d'Action Start/Stop */}
                          <button
                              type="button"
                              onClick={handleStartStop}
                              disabled={isActionLoading}
                              className={`inline-flex hover:shadow-sm cursor-pointer items-center justify-center px-3 py-1 border rounded-md text-sm font-medium transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed ${
                                  store.is_running
                                      ? 'border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100' // Style Stop
                                      : 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100' // Style Start
                              }`}
                          >
                              {isActionLoading ? (
                                  <svg className="animate-spin h-4 w-4 text-currentColor" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                              ) : (
                                  store.is_running ? <IoStopCircleOutline className="-ml-0.5 mr-1 h-4 w-4" /> : <IoPlayCircleOutline className="-ml-0.5 mr-1 h-4 w-4" />
                              )}
                              {store.is_running ? t('storesPage.actions.stop') : t('storesPage.actions.start')} 
                         </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                        <IoInformationCircleOutline className="w-3.5 h-3.5"/>
                         {store.is_running ? t('settingsGeneral.runtimeStatusHelpRunning') : t('settingsGeneral.runtimeStatusHelpStopped')} 
                    </p>
                </div>

                {/* Erreur API Générale */}
                {fieldErrors.api && <p className="mt-1 text-sm text-red-600">{fieldErrors.api}</p>}

            </div>

            {/* Pied de page avec Bouton Enregistrer */}
            <div className="px-4 py-3 sm:px-6 bg-gray-50 text-right rounded-b-lg">
                <button
                    type="button"
                    onClick={handleSaveChanges}
                    disabled={!hasChanges || isLoading}
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? t('common.saving') : t('common.saveChanges')}
                </button>
            </div>
        </div>
    );
}
