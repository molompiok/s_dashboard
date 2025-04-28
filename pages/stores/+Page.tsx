// pages/stores/+Page.tsx

import { useState, useEffect } from 'react';
import { Topbar } from '../../Components/TopBar/TopBar';
import { StoresList } from '../../Components/StoreList/StoresList'; // Swiper Horizontal
import { SelectedStoreDetails } from '../../Components/StoreDetails/SelectedStoreDetails'; // Nouveau
import { ThemeManager } from '../../Components/ThemeManager/ThemeManager'; // Nouveau
import { StoreToolbar } from '../../Components/StoreList/StoreToolbar'; // Nouveau
import { StoreInterface } from '../../Interfaces/Interfaces';
import { useStore } from './StoreStore'; // Garder Zustand pour état global stores/currentStore
import { useGetStores } from '../../api/ReactSublymusApi'; // Hook pour fetch la liste
import { useTranslation } from 'react-i18next';
import logger from '../../api/Logger';

export { Page };

// Type pour les filtres de store (simple pour S0)
export interface StoreFilterType {
    search?: string;
    page?:number,
    limit?:number,
    status?: 'active' | 'inactive' | 'all'; // Ex: 'active', 'inactive', 'all'
}

function Page() {
    const { t } = useTranslation();
    // Gérer le store sélectionné globalement via Zustand
    const { currentStore, setCurrentStore, stores: storesFromZustand } = useStore();
    // Filtre local pour la toolbar
    const [filter, setFilter] = useState<StoreFilterType>({ status: 'all' });
    const [isLoadingInitialStore, setIsLoadingInitialStore] = useState(true);

    // Utiliser React Query pour récupérer la liste des stores
    const { data: storesData, isLoading: isLoadingList, isError, error } = useGetStores(
        filter, // Passer les filtres
        // { enabled: true } // Toujours activé a priori
    );
    const storesList = storesData?.list ?? [];

     // Sélectionner le premier store ou celui en mémoire au chargement
     useEffect(() => {
        if (isLoadingList || !storesList || storesList.length === 0) {
             setIsLoadingInitialStore(false); // Fin du chargement même si vide/erreur
             return;
        };

        // Essayer de trouver le store courant dans la nouvelle liste
         const currentStoreStillExists = currentStore && storesList.some(s => s.id === currentStore.id);

        if (currentStoreStillExists) {
             // Garder le store courant s'il existe toujours
              setIsLoadingInitialStore(false);
              logger.debug("Current store still exists in fetched list.");
        } else {
            // Sinon, essayer de charger depuis localStorage
            let storedStore = null;
            try {
                const storedJson = localStorage.getItem('current_store');
                 if (storedJson) {
                    storedStore = JSON.parse(storedJson);
                     // Vérifier si celui du localStorage est dans la liste chargée
                     if (!storesList.some(s => s.id === storedStore?.id)) {
                         storedStore = null; // Invalider si plus dans la liste
                     }
                 }
            } catch (e) { logger.warn("Failed to parse current_store from localStorage", e); }

            // Sélectionner le store du localStorage (s'il est valide) ou le premier de la liste
            const storeToSelect = storedStore ?? storesList[0];
            if (storeToSelect) {
                 logger.info("Setting current store:", { storeId: storeToSelect.id, source: storedStore ? 'localStorage' : 'firstInList' });
                 setCurrentStore(storeToSelect);
            } else {
                logger.warn("No store available to select.");
                setCurrentStore(undefined); // Aucun store à sélectionner
            }
        }
         setIsLoadingInitialStore(false); // Marquer la fin du chargement initial
    }, [storesList, isLoadingList, currentStore, setCurrentStore]); // Dépendances


    const handleSelectStore = (store: StoreInterface) => {
        setCurrentStore(store);
    };

    return (
        <div className="w-full min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50/30"> {/* Fond légèrement bleuté */}
            <Topbar />
            <main className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">

                {/* Titre et Toolbar */}
                 <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                     <h1 className="text-2xl font-semibold text-gray-900">{t('storesPage.title')}</h1> 
                     <StoreToolbar filter={filter} onFilterChange={setFilter} />
                 </div>


                {/* Liste Horizontale des Stores */}
                <StoresList
                    stores={storesList}
                    isLoading={isLoadingList}
                    selectedStoreId={currentStore?.id}
                    onSelectStore={handleSelectStore}
                    // Ajouter prop pour le lien "Voir tout"
                    // viewAllUrl="/stores/manage" // Exemple d'URL
                />

                {/* Détails du Store Sélectionné & Gestion Thème */}
                {/* Afficher seulement si un store est sélectionné et après chargement initial */}
                {isLoadingInitialStore ? (
                     <div className="p-10 text-center text-gray-500">{t('common.loading')}...</div> // Loader simple pendant la sélection initiale
                ) : currentStore ? (
                    <div className="flex flex-col gap-6 mt-4"> {/* Espace après la liste */}
                        <SelectedStoreDetails store={currentStore} />
                        <ThemeManager store={currentStore} />
                         {/* Ajouter InventoryManager ici si besoin */}
                    </div>
                ) : (
                     // Message si aucun store n'est sélectionné ou disponible
                     !isLoadingList && storesList.length === 0 && (
                          <div className="text-center py-10 text-gray-500">
                              <p>{t('storesPage.noStoresFound')}</p> 
                              {/* Ajouter un bouton pour créer le premier store? */}
                          </div>
                     )
                )}

            </main>
        </div>
    );
}