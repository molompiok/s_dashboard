// pages/stores/[storeId]/settings/+Page.tsx (ou chemin similaire)

import { useState, useEffect } from 'react';
import { usePageContext } from '../../../../renderer/usePageContext';
import { useGetStore } from '../../../../api/ReactSublymusApi';
import { Topbar } from '../../../../Components/TopBar/TopBar';
import { SettingsSidebar } from '../../../../Components/Settings/SettingsSidebar'; // Nouveau
// Importer les composants de section (on les créera ensuite)
import { GeneralSettingsSection } from '../../../../Components/Settings/GeneralSettingsSection';
import { AppearanceSettingsSection } from '../../../../Components/Settings/AppearanceSettingsSection';
import { SubscriptionPlanSection } from '../../../../Components/Settings/SubscriptionPlanSection';
import { DomainsSettingsSection } from '../../../../Components/Settings/DomainsSettingsSection';
import { LegalContactSettingsSection } from '../../../../Components/Settings/LegalContactSettingsSection';
import { RegionalSettingsSection } from '../../../../Components/Settings/RegionalSettingsSection';
import { DangerZoneSection } from '../../../../Components/Settings/DangerZoneSection';
import { useTranslation } from 'react-i18next';
import { PageNotFound } from '../../../../Components/PageNotFound/PageNotFound';
import logger from '../../../../api/Logger';

export { Page };

// Définir les sections possibles
type SettingsSection = 'general' | 'appearance' | 'plan' | 'domains' | 'legal' | 'regional' | 'danger';

function Page() {
    const { t } = useTranslation();
    const { routeParams } = usePageContext();
    const storeId = routeParams?.['id']; // Récupérer l'ID du store depuis l'URL

    // --- État ---
    // Section active (initialiser sur 'general')
    const [activeSection, setActiveSection] = useState<SettingsSection>('general');
    // État pour stocker les données du store une fois chargées
    // const [storeData, setStoreData] = useState<StoreInterface | null>(null); // Géré par React Query

    // --- Récupération des données ---
    const { data: storeData, isLoading, isError, error } = useGetStore(
        storeId,
        { enabled: !!storeId } // Activer si storeId existe
    );

    // --- Rendu Conditionnel ---
    if (isLoading) {
        return <div className="p-6 text-center text-gray-500">{t('common.loading')}</div>;
    }
    // Gérer le cas où l'ID n'est pas dans l'URL ou le store n'est pas trouvé (404)
    if (!storeId || (!isLoading && !storeData)) {
         logger.warn("Store not found or ID missing for settings page", { storeId });
         return <PageNotFound title={t('storesPage.notFound')} />; // Afficher page non trouvée
    }
     // Gérer les autres erreurs de fetch
     if (isError) {
         logger.error({ storeId, error }, "Failed to load store for settings page");
         return <div className="p-6 text-center text-red-500">{error?.message || t('error_occurred')}</div>;
     }


    // --- Sélection du Composant de Section ---
    const renderActiveSection = () => {
        // Passer storeData à chaque section
        if (!storeData) return null; // Sécurité

        switch (activeSection) {
            case 'general':
                return <GeneralSettingsSection store={storeData} />;
            case 'appearance':
                return <AppearanceSettingsSection store={storeData} />;
            case 'plan':
                return <SubscriptionPlanSection store={storeData} />;
            case 'domains':
                return <DomainsSettingsSection store={storeData} />;
            case 'legal':
                return <LegalContactSettingsSection store={storeData} />;
            case 'regional':
                return <RegionalSettingsSection store={storeData} />;
            case 'danger':
                return <DangerZoneSection store={storeData} />;
            default:
                return <GeneralSettingsSection store={storeData} />; // Fallback
        }
    };

    return (
        <div className="w-full min-h-screen flex flex-col bg-gray-100"> {/* Fond légèrement différent */}
            <Topbar back={true} title={t('settingsPage.title', { name: storeData?.name ?? '...' })} /> 
            <main className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 flex-grow">
                {/* Layout à deux colonnes sur desktop */}
                 {/* Utiliser grid, gap */}
                <div className="md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-6 lg:gap-8">
                    {/* Colonne Sidebar */}
                     {/* Utiliser md:col-span-1 */}
                     <div className="md:col-span-1 mb-6 md:mb-0">
                         <SettingsSidebar
                             activeSection={activeSection}
                             onSectionChange={setActiveSection}
                         />
                     </div>

                    {/* Colonne Contenu Principal */}
                     {/* Utiliser md:col-span-2 lg:col-span-3 */}
                     <div className="md:col-span-2 lg:col-span-3">
                         {/* Afficher la section active */}
                         {renderActiveSection()}
                     </div>
                </div>
            </main>
        </div>
    );
}