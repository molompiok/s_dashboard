// Components/Settings/LegalContactSettingsSection.tsx

import { useState, useEffect, useCallback } from 'react';
import { StoreInterface, StoreSetting } from "../../Interfaces/Interfaces"; // Ajouter StoreSetting si défini
import { useTranslation } from "react-i18next";
// Importer le hook pour mettre à jour les settings (à créer)
// import { useUpdateStoreSettings } from "../../api/ReactSublymusApi";
import logger from '../../api/Logger';
import { ApiError } from '../../api/SublymusApi';

interface LegalContactSettingsSectionProps {
    store: StoreInterface;
    // Passer les settings actuels si disponibles via une autre prop ou via store
    settings?: Partial<StoreSetting>; // Supposons que StoreSetting contient les champs légaux/contact
}

// Type pour l'état local du formulaire
type LegalFormState = Pick<StoreSetting,
    'legal_name' | 'legal_id' | 'legal_address_street' | 'legal_address_city' | 'legal_address_zip' | 'legal_address_country' | 'public_email' | 'public_phone'
>; // Adapter les noms de champs selon le modèle final

// Liste de pays (simplifiée, idéalement utiliser une librairie)
const countries = [
    { code: 'CI', name: 'Côte d\'Ivoire' },
    { code: 'FR', name: 'France' },
    { code: 'SN', name: 'Sénégal' },
    // ... ajouter d'autres pays pertinents
];

export function LegalContactSettingsSection({ store, settings = {} }: LegalContactSettingsSectionProps) {
    const { t } = useTranslation();
    // Initialiser la mutation (à créer dans ReactSublymusApi)
    // const updateSettingsMutation = useUpdateStoreSettings();
    const updateSettingsMutation = { isPending: false, mutate: (data: any, options: any) => { console.log("Update settings mutation:", data); options.onSuccess?.(); } }; // Placeholder

    const isLoading = updateSettingsMutation.isPending
    // --- État Local du Formulaire ---
    const [formState, setFormState] = useState<Partial<LegalFormState>>({});
    const [hasChanges, setHasChanges] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    // Initialiser/Réinitialiser le formulaire avec les données du store/settings
    useEffect(() => {
        setFormState({
            legal_name: settings.legal_name ?? '',
            legal_id: settings.legal_id ?? '',
            legal_address_street: settings.legal_address_street ?? '',
            legal_address_city: settings.legal_address_city ?? '',
            legal_address_zip: settings.legal_address_zip ?? '',
            legal_address_country: settings.legal_address_country ?? '', // Code pays
            public_email: settings.public_email ?? '',
            public_phone: settings.public_phone ?? '',
        });
        setHasChanges(false);
        setApiError(null);
    }, [settings]); // Réagir aux changements de settings (après sauvegarde par ex.)

    // --- Détection des changements ---
    useEffect(() => {
         const changed = formState.legal_name !== (settings.legal_name ?? '') ||
                         formState.legal_id !== (settings.legal_id ?? '') ||
                         formState.legal_address_street !== (settings.legal_address_street ?? '') ||
                         formState.legal_address_city !== (settings.legal_address_city ?? '') ||
                         formState.legal_address_zip !== (settings.legal_address_zip ?? '') ||
                         formState.legal_address_country !== (settings.legal_address_country ?? '') ||
                         formState.public_email !== (settings.public_email ?? '') ||
                         formState.public_phone !== (settings.public_phone ?? '');
         setHasChanges(changed);
    }, [formState, settings]);

    // --- Handlers ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
         // Reset erreur API au changement
         if (apiError) setApiError(null);
    };

    // --- Validation (Simpliste ici, l'API backend devrait valider plus en détail) ---
    const validateForm = (): boolean => {
        // Ajouter des validations si nécessaire (ex: email, format téléphone)
        return true;
    };

    // --- Sauvegarde ---
    const handleSaveChanges = () => {
         if (!validateForm() || !hasChanges || updateSettingsMutation.isPending) {
             return;
         }
         setApiError(null); // Reset erreur API

         // Construire l'objet data à envoyer (tous les champs de ce formulaire)
          const dataToUpdate: Partial<StoreSetting> = { ...formState };

          // TODO: Appeler la mutation (à créer) pour sauvegarder les StoreSettings
          logger.warn("Update store settings mutation not implemented yet. Data:", dataToUpdate);
         // updateSettingsMutation.mutate(
         //     { store_id: store.id, settings: dataToUpdate },
         //     {
         //         onSuccess: () => {
         //             logger.info(`Store ${store.id} legal/contact settings updated`);
         //             setHasChanges(false); // Reset après succès
         //             // Afficher toast succès
         //         },
         //         onError: (error: ApiError) => {
         //             logger.error({ error }, `Failed to update legal/contact settings for store ${store.id}`);
         //             setApiError(error.message);
         //             // Afficher toast erreur
         //         }
         //     }
         // );
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
             {/* En-tête */}
             <div className="px-4 py-5 sm:px-6 border-b border-gray-100">
                <h3 className="text-lg leading-6 font-medium text-gray-900">{t('settingsPage.sidebar.legal')}</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">{t('settingsLegal.description')}</p> 
            </div>

            {/* Formulaire */}
             {/* Utiliser space-y-6 pour espacement */}
            <div className="px-4 py-5 sm:p-6 space-y-6">
                {/* Nom Légal */}
                <div>
                    <label htmlFor="legal_name" className="block text-sm font-medium text-gray-700">{t('settingsLegal.legalNameLabel')}</label> 
                    <input type="text" name="legal_name" id="legal_name" value={formState.legal_name || ''} onChange={handleInputChange}
                           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10"/>
                </div>
                {/* ID Légal */}
                 <div>
                    <label htmlFor="legal_id" className="block text-sm font-medium text-gray-700">{t('settingsLegal.legalIdLabel')}</label> 
                    <input type="text" name="legal_id" id="legal_id" value={formState.legal_id || ''} onChange={handleInputChange}
                            placeholder={t('settingsLegal.legalIdPlaceholder')} 
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10"/>
                </div>

                {/* Adresse Physique */}
                <fieldset className="border-t border-gray-200 pt-6">
                    <legend className="text-base font-medium text-gray-900 mb-1">{t('settingsLegal.addressTitle')}</legend> 
                    <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-6">
                             <label htmlFor="legal_address_street" className="block text-sm font-medium text-gray-700">{t('settingsLegal.addressStreetLabel')}</label> 
                             <input type="text" name="legal_address_street" id="legal_address_street" value={formState.legal_address_street || ''} onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10"/>
                        </div>
                        <div className="sm:col-span-2">
                             <label htmlFor="legal_address_city" className="block text-sm font-medium text-gray-700">{t('settingsLegal.addressCityLabel')}</label> 
                             <input type="text" name="legal_address_city" id="legal_address_city" value={formState.legal_address_city || ''} onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10"/>
                        </div>
                         <div className="sm:col-span-2">
                              <label htmlFor="legal_address_zip" className="block text-sm font-medium text-gray-700">{t('settingsLegal.addressZipLabel')}</label> 
                              <input type="text" name="legal_address_zip" id="legal_address_zip" value={formState.legal_address_zip || ''} onChange={handleInputChange}
                                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10"/>
                         </div>
                         <div className="sm:col-span-2">
                             <label htmlFor="legal_address_country" className="block text-sm font-medium text-gray-700">{t('settingsLegal.addressCountryLabel')}</label> 
                              <select id="legal_address_country" name="legal_address_country" value={formState.legal_address_country || ''} onChange={handleInputChange}
                                      className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm h-10 cursor-pointer">
                                  <option value="">{t('common.select')}</option> 
                                  {countries.map(c => (
                                      <option key={c.code} value={c.code}>{c.name}</option>
                                  ))}
                              </select>
                         </div>
                    </div>
                </fieldset>

                 {/* Contact Public */}
                 <fieldset className="border-t border-gray-200 pt-6">
                      <legend className="text-base font-medium text-gray-900 mb-1">{t('settingsLegal.contactTitle')}</legend> 
                      <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                           <div>
                                <label htmlFor="public_email" className="block text-sm font-medium text-gray-700">{t('settingsLegal.publicEmailLabel')}</label> 
                                <input type="email" name="public_email" id="public_email" value={formState.public_email || ''} onChange={handleInputChange}
                                       placeholder="contact@maboutique.com"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10"/>
                                 <p className="mt-1 text-xs text-gray-500">{t('settingsLegal.publicEmailHelp')}</p> 
                           </div>
                           <div>
                                <label htmlFor="public_phone" className="block text-sm font-medium text-gray-700">{t('settingsLegal.publicPhoneLabel')}</label> 
                                <input type="tel" name="public_phone" id="public_phone" value={formState.public_phone || ''} onChange={handleInputChange}
                                        placeholder="+225 xx xx xx xx xx"
                                         className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10"/>
                                  <p className="mt-1 text-xs text-gray-500">{t('settingsLegal.publicPhoneHelp')}</p> 
                           </div>
                      </div>
                 </fieldset>

                  {/* Erreur API Générale */}
                  {apiError && <p className="mt-1 text-sm text-red-600">{apiError}</p>}

            </div>

            {/* Pied de page */}
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

// --- Interface StoreSetting (à définir plus précisément selon l'API backend) ---
