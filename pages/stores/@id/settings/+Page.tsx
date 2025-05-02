import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePageContext } from '../../../../renderer/usePageContext';
import { useGetStore } from '../../../../api/ReactSublymusApi';
import { BreadcrumbItem, Topbar } from '../../../../Components/TopBar/TopBar';
import { SettingsSidebar } from '../../../../Components/Settings/SettingsSidebar';
import { useTranslation } from 'react-i18next';
import { PageNotFound } from '../../../../Components/PageNotFound/PageNotFound';
import logger from '../../../../api/Logger';
import { GeneralSettingsSection } from '../../../../Components/Settings/GeneralSettingsSection';
import { AppearanceSettingsSection } from '../../../../Components/Settings/AppearanceSettingsSection';
import { SubscriptionPlanSection } from '../../../../Components/Settings/SubscriptionPlanSection';
import { DomainsSettingsSection } from '../../../../Components/Settings/DomainsSettingsSection';
import { LegalContactSettingsSection } from '../../../../Components/Settings/LegalContactSettingsSection';
import { RegionalSettingsSection } from '../../../../Components/Settings/RegionalSettingsSection';
import { DangerZoneSection } from '../../../../Components/Settings/DangerZoneSection';
import { limit } from '../../../../Components/Utils/functions';

export { Page };

type SettingsSection = 'general' | 'appearance' | 'plan' | 'domains' | 'legal' | 'regional' | 'danger';

function Page() {
    const { t } = useTranslation();
    const { routeParams } = usePageContext();
    const storeId = routeParams?.['id'];
    const [activeSection, setActiveSection] = useState<SettingsSection>('general');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const { data: storeData, isLoading, isError, error } = useGetStore(storeId, {
        enabled: !!storeId,
    });

    if (isLoading) {
        return <div className="p-6 text-center text-gray-500">{t('common.loading')}</div>;
    }

    if (!storeId || (!isLoading && !storeData)) {
        logger.warn("Store not found or ID missing for settings page", { storeId });
        return <PageNotFound title={t('storesPage.notFound')} />;
    }

    if (isError) {
        logger.error({ storeId, error }, "Failed to load store for settings page");
        return <div className="p-6 text-center text-red-500">{error?.message || t('error_occurred')}</div>;
    }

    const renderActiveSection = () => {
        if (!storeData) return null;

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
                return <RegionalSettingsSection store={storeData} settings={storeData} />;
            case 'danger':
                return <DangerZoneSection store={storeData} />;
            default:
                return <GeneralSettingsSection store={storeData} />;
        }
    };

    const storeName = storeData?.name;

      const breadcrumbs: BreadcrumbItem[] = useMemo(() => {
         const crumbs: BreadcrumbItem[] = [
             { name: t('navigation.home'), url: '/' },
              // Lien vers la liste principale des stores
             { name: t('navigation.stores'), url: '/stores' },
         ];
          if (storeName) {
              // Lien vers la page principale du store sélectionné? Ou juste le nom?
              // Mettons juste le nom, car on est DANS ses paramètres.
               crumbs.push({ name: limit(storeName, 25) });
               crumbs.push({ name: t('navigation.settings') }); // Page actuelle
          } else if (storeId) {
                crumbs.push({ name: t('common.loading') });
          }
         return crumbs;
     }, [t, storeId, storeName]);

    return (
        <div className="w-full min-h-screen flex flex-col bg-gray-100 relative">
            <Topbar
                back={true}
                breadcrumbs={breadcrumbs}
                // title={t('settingsPage.title', { name: storeData?.name ?? '...' })}
            />
            <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900"
                aria-label="Open sidebar"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
            {/* Mobile Sidebar overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        {/* Fond semi-transparent */}
                        <motion.div
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                            onClick={() => setSidebarOpen(false)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />
                        {/* Menu latéral glissant */}
                        <motion.aside
                            className="fixed top-0 left-0 bottom-0 w-64 bg-white z-50 shadow-xl p-4 overflow-y-auto"
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="flex justify-end mb-4">
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="text-gray-500 hover:text-gray-800"
                                    aria-label="Close sidebar"
                                >
                                    ✕
                                </button>
                            </div>
                            <SettingsSidebar
                                activeSection={activeSection}
                                onSectionChange={(s) => {
                                    setActiveSection(s);
                                    setSidebarOpen(false);
                                }}
                            />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main content */}
            <main className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 flex-grow">
                <div className="md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-6 lg:gap-8">
                    {/* Desktop Sidebar */}
                    <div className="hidden md:block md:col-span-1 mb-6 md:mb-0">
                        <SettingsSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
                    </div>

                    {/* Main Section */}
                    <div className="md:col-span-2 lg:col-span-3">{renderActiveSection()}</div>
                </div>
            </main>
        </div>
    );
}
