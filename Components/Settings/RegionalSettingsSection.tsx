// Components/Settings/RegionalSettingsSection.tsx

import { useState, useEffect, useCallback } from 'react';
import { StoreInterface, StoreSetting } from "../../api/Interfaces/Interfaces"; // Assurer import StoreSetting
import { useTranslation } from "react-i18next";
// Importer le hook pour mettre à jour les settings
import { useUpdateStore } from "../../api/ReactSublymusApi";
import logger from '../../api/Logger';
import { ApiError } from '../../api/SublymusApi';
import Select from 'react-select'; // Utiliser react-select pour une meilleure UX

interface RegionalSettingsSectionProps {
    store: StoreInterface;
    settings?: Partial<StoreSetting>;
}

// Type pour l'état local du formulaire
type RegionalFormState = Pick<StoreSetting, 'timezone' | 'currency'>;

// Options disponibles (à enrichir ou charger depuis une source externe/config)
const supportedLocales = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English (Anglais)' },
    // Ajouter d'autres langues supportées par l'application
];

const supportedCurrencies = [
    { value: 'XOF', label: 'Franc CFA (XOF)' },
    { value: 'EUR', label: 'Euro (cfa)' },
    { value: 'USD', label: 'Dollar Américain ($)' },
    // Ajouter d'autres devises
];

export function RegionalSettingsSection({ store, settings = {} }: RegionalSettingsSectionProps) {
    const { t } = useTranslation();
    // Initialiser la mutation (à créer)
    const updateSettingsMutation = useUpdateStore();

    const isLoading = updateSettingsMutation.isPending
    // --- État Local ---
    const [formState, setFormState] = useState<Partial<RegionalFormState>>({});
    const [hasChanges, setHasChanges] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    // Initialiser/Réinitialiser le formulaire
    useEffect(() => {
        setFormState({
            timezone: settings.timezone ?? 'fr', // Défaut 'fr'
            currency: settings.currency ?? 'XOF',         // Défaut 'XOF'
        });
        setHasChanges(false);
        setApiError(null);
    }, [settings]);

    // --- Détection des changements ---
    useEffect(() => {
        const changed = formState.timezone !== (settings.timezone ?? 'fr') ||
            formState.currency !== (settings.currency ?? 'XOF');
        setHasChanges(changed);
    }, [formState, settings]);

    // --- Handlers ---
    // Utiliser useCallback pour la stabilité des références (important pour react-select)
    const handleLocaleChange = useCallback((selectedOption: any) => { // Type de react-select
        setFormState(prev => ({ ...prev, timezone: selectedOption?.value }));
        if (apiError) setApiError(null);
    }, [apiError]);

    const handleCurrencyChange = useCallback((selectedOption: any) => { // Type de react-select
        setFormState(prev => ({ ...prev, currency: selectedOption?.value }));
        if (apiError) setApiError(null);
    }, [apiError]);


    // --- Sauvegarde ---
    const handleSaveChanges = () => {
        // Pas besoin de validation locale spécifique pour des selects a priori
        if (!hasChanges || updateSettingsMutation.isPending) {
            return;
        }
        setApiError(null);

        // TODO  Partial<StoreSettings>
        const dataToUpdate: StoreInterface = {};
        if (formState.timezone !== (settings.timezone ?? 'fr')) dataToUpdate.timezone = formState.timezone;
        if (formState.currency !== (settings.currency ?? 'XOF')) dataToUpdate.currency = formState.currency;

        if (Object.keys(dataToUpdate).length === 0) {
            setHasChanges(false);
            return;
        }

        // TODO: Appeler la mutation useUpdateStoreSettings
        logger.warn("Update store settings mutation not implemented yet. Data:", dataToUpdate);
        store.id && updateSettingsMutation.mutate(
            { store_id: store.id, data: dataToUpdate },
            { onSuccess: () => { setHasChanges(false); }, onError: (error) => { setApiError(error.message); /*...*/ } }
        );
    };

    // Trouver les objets complets pour react-select
    const selectedLocaleOption = supportedLocales.find(opt => opt.value === formState.timezone);
    const selectedCurrencyOption = supportedCurrencies.find(opt => opt.value === formState.currency);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* En-tête */}
            <div className="px-4 py-5 sm:px-6 border-b border-gray-100">
                <h3 className="text-lg leading-6 font-medium text-gray-900">{t('settingsPage.sidebar.regional')}</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">{t('settingsRegional.description')}</p>
            </div>

            {/* Formulaire */}
            <div className="px-4 py-5 sm:p-6 space-y-6">
                {/* Langue par Défaut */}
                <div>
                    <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">{t('settingsRegional.defaultLocaleLabel')}</label>
                    {/* Utiliser react-select */}
                    <Select
                        id="timezone"
                        name="timezone"
                        options={supportedLocales}
                        value={selectedLocaleOption}
                        onChange={handleLocaleChange}
                        className="mt-1 react-select-container" // Classe pour ciblage global
                        classNamePrefix="react-select" // Préfixe pour éléments internes
                        placeholder={t('common.select')}
                        noOptionsMessage={() => t('common.noOptions')}
                        styles={{ // Styles inline pour surcharger si besoin (ou utiliser classes globales)
                            control: (base) => ({ ...base, minHeight: '2.5rem', height: '2.5rem', borderColor: '#D1D5DB' }),
                            valueContainer: (base) => ({ ...base, padding: '0 0.75rem' }),
                            indicatorsContainer: (base) => ({ ...base, height: '2.5rem' }),
                            // Ajouter d'autres styles pour menu, options etc.
                        }}
                    />
                    <p className="mt-1 text-xs text-gray-500">{t('settingsRegional.defaultLocaleHelp')}</p>
                </div>

                {/* Devise par Défaut */}
                <div>
                    <label htmlFor="currency" className="block text-sm font-medium text-gray-700">{t('settingsRegional.defaultCurrencyLabel')}</label>
                    <Select
                        id="currency"
                        name="currency"
                        options={supportedCurrencies}
                        value={selectedCurrencyOption}
                        onChange={handleCurrencyChange}
                        className="mt-1 react-select-container"
                        classNamePrefix="react-select"
                        placeholder={t('common.select')}
                        noOptionsMessage={() => t('common.noOptions')}
                        styles={{
                            control: (base) => ({ ...base, minHeight: '2.5rem', height: '2.5rem', borderColor: '#D1D5DB' }),
                            valueContainer: (base) => ({ ...base, padding: '0 0.75rem' }),
                            indicatorsContainer: (base) => ({ ...base, height: '2.5rem' }),
                        }}
                    />
                    <p className="mt-1 text-xs text-gray-500">{t('settingsRegional.defaultCurrencyHelp')}</p>
                </div>

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