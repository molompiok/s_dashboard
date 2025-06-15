// pages/stores/+Page.tsx

import { useState, useEffect, useMemo } from 'react';
import { BreadcrumbItem, Topbar } from '../../Components/TopBar/TopBar';
import { StoresList } from '../../Components/StoreList/StoresList';
import { SelectedStoreDetails } from '../../Components/StoreDetails/SelectedStoreDetails';
import { ThemeManager } from '../../Components/ThemeManager/ThemeManager';
import { StoreToolbar } from '../../Components/StoreList/StoreToolbar';
import { StoreFilterType, StoreInterface } from '../../api/Interfaces/Interfaces';
import { useGlobalStore } from '../../api/stores/StoreStore';
import { useGetStoreList } from '../../api/ReactSublymusApi';
import { useTranslation } from 'react-i18next';
import logger from '../../api/Logger';
import { useChildViewer } from '../../Components/ChildViewer/useChildViewer';
import { StoreCreationEditionWizard } from './StoreCreationWizard';
import { InventoryManager } from '../../Components/InventoryManager/InventoryManager';
import { limit } from '../../Components/Utils/functions';
import { IoStorefrontOutline, IoSparkles } from 'react-icons/io5';

export { Page };

function Page() {
  const { t } = useTranslation();
  const { currentStore, setCurrentStore } = useGlobalStore();
  const [filter, setFilter] = useState<StoreFilterType>({});
  const [isLoadingInitialStore, setIsLoadingInitialStore] = useState(true);
  const { openChild } = useChildViewer();

  const { data: storesData, isLoading: isLoadingList, isError, error } = useGetStoreList(filter);
  const storesList = storesData?.list ?? [];

  // Logique de sélection du store initial (inchangée)
  useEffect(() => {
    if (isLoadingList || !storesList || storesList.length === 0) {
      setIsLoadingInitialStore(false);
      return;
    }

    const currentStoreStillExists = currentStore && storesList.some(s => s.id === currentStore.id);

    if (currentStoreStillExists) {
      setIsLoadingInitialStore(false);
      logger.debug("Current store still exists in fetched list.");
    } else {
      let storedStore: StoreInterface | null = null;
      try {
        const storedJson = localStorage.getItem('current_store');
        if (storedJson) {
          storedStore = JSON.parse(storedJson);
          if (!storesList.some(s => s.id === storedStore?.id)) {
            storedStore = null;
          }
        }
      } catch (e) {
        logger.warn("Failed to parse current_store from localStorage", e);
      }

      const storeToSelect = storedStore ?? storesList[0];
      if (storeToSelect) {
        logger.info("Setting current store:", {
          storeId: storeToSelect.id,
          source: storedStore ? 'localStorage' : 'firstInList'
        });
        setCurrentStore(storeToSelect);
      } else {
        logger.warn("No store available to select.");
        setCurrentStore(undefined);
      }
    }
    setIsLoadingInitialStore(false);
  }, [storesList, isLoadingList, currentStore, setCurrentStore]);

  const handleStoreCreateEdit = (store?: StoreInterface | undefined) => {
    openChild(
      <StoreCreationEditionWizard
        onSaveSuccess={(collected, mode) => {
          console.log('collected', mode, collected);
          openChild(null);
        }}
        onCancel={() => openChild(null)}
        initialStoreData={store}
      />,
      { className: "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300" }
    );
  };

  const handleSelectStore = (store: StoreInterface) => {
    setCurrentStore(store);
  };

  const storeName = currentStore?.name;

  return (
    <div className="min-h-screen pb-[200px]">
      <Topbar key={'acceuil-admin'} search={false}/>

      {/* Container principal avec padding adaptatif */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Header Section - Design Premium */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row flex-wrap lg:items-center lg:justify-between gap-6 mb-6">
            {/* Titre avec icône et gradient */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center min-w-12 min-h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-lg">
                <IoStorefrontOutline className="min-w-6 min-h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold whitespace-nowrap bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  {t('storesPage.title')}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('storesPage.subtitle', { count: storesList.length })}
                </p>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex-shrink-0">
              <StoreToolbar
                filter={filter}
                onFilterChange={setFilter}
                newStoreRequire={handleStoreCreateEdit}
              />
            </div>
          </div>

          {/* Stats Cards - Optionnel */}
          {/* {storesList.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                    <IoStorefrontOutline className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {storesList.length}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('storesPage.stats.totalStores')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                    <IoSparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {storesList.filter(s => s.is_active).length}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('storesPage.stats.activeStores')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <IoStorefrontOutline className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {storesList.filter(s => s.is_running).length}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('storesPage.stats.runningStores')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}  */}
        </div>
        <div className="p-4">
          <StoresList
            stores={storesList}
            isLoading={isLoadingList}
            selectedStoreId={currentStore?.id}
            onSelectStore={handleSelectStore}
            newStoreRequire={handleStoreCreateEdit}
          />
        </div>

        {/* Contenu Principal - Grille moderne */}
        {isLoadingInitialStore ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-lg mb-4 animate-pulse">
                <IoStorefrontOutline className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                {t('common.loading')}...
              </p>
            </div>
          </div>
        ) : currentStore ? (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Colonne principale - Détails et Thème */}
            <div className="xl:col-span-8 space-y-8">
              <SelectedStoreDetails
                store={currentStore}
                onEditRequired={handleStoreCreateEdit}
              />
            </div>

            {/* Colonne secondaire - Inventaire et autres */}
            <div className="xl:col-span-4">
              <ThemeManager store={currentStore} />
            </div>
          </div>
        ) : (
          <>
            {/* État vide - Design amélioré */}
            {!isLoadingList && storesList.length === 0 && (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-3xl shadow-lg mb-6">
                  <IoStorefrontOutline className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t('storesPage.noStoresFound')}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {t('storesPage.noStoresDescription')}
                </p>
                <button
                  onClick={() => handleStoreCreateEdit()}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                >
                  <IoStorefrontOutline className="w-5 h-5" />
                  {t('storesPage.createFirstStore')}
                </button>
              </div>
            )}

            {/* ThemeManager sans store sélectionné */}
            <ThemeManager store={undefined} />
          </>
        )}
      </main>
    </div>
  );
}