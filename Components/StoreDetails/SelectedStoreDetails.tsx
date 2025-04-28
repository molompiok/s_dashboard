// Components/StoreDetails/SelectedStoreDetails.tsx

import { StoreInterface } from "../../Interfaces/Interfaces";
import { useTranslation } from "react-i18next";
import { IoCheckmarkCircle, IoChevronForward, IoClose, IoDesktop, IoFingerPrint, IoPauseCircle, IoPencil, IoSettings, IoTrash } from "react-icons/io5"; // Ajouter icônes actions
import { Bar } from 'react-chartjs-2'; // Importer Bar pour exemple stats
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'; // Importer modules Chart.js
import { Progrees } from "../Progress/Pregress"; // Utiliser le composant Progress
import { useGetStats } from "../../api/ReactSublymusApi"; // Hook pour stats (si applicable au store)
import logger from "../../api/Logger";
// Importer les hooks de mutation pour les actions serveur (Start/Stop/Delete Store) si définis
// import { useStartStore, useStopStore, useDeleteStore } from "../../api/ReactSublymusServerApi"; // Exemple

// Enregistrer les modules Chart.js nécessaires
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface SelectedStoreDetailsProps {
    store: StoreInterface; // Store sélectionné (non partiel ici)
}

export function SelectedStoreDetails({ store }: SelectedStoreDetailsProps) {
    const { t } = useTranslation();

    // TODO: Récupérer les stats spécifiques à CE store si l'API le permet
    // Pour l'instant, on utilise des données statiques ou globales
    // const { data: statsData, isLoading: isLoadingStats } = useGetStats({ storeId: store.id }, { enabled: !!store.id });
    const isLoadingStats = false; // Placeholder
    const statsData = { // Placeholder Data
        order_stats: [{ date: '2023-10-01', orders_count: 5 }, { date: '2023-10-02', orders_count: 8 }],
        visits_stats: [{ date: '2023-10-01', visits: 50 }, { date: '2023-10-02', visits: 75 }],
    };

    // TODO: Initialiser les mutations pour les actions serveur
    // const startStoreMutation = useStartStore();
    // const stopStoreMutation = useStopStore();
    // const deleteStoreMutation = useDeleteStore();
    const isActionLoading = false; // Placeholder: = startStoreMutation.isPending || ...

    // --- Handlers pour les actions ---
    const handleStartStop = () => {
        if (store.is_active) {
             logger.warn("Stop store action not implemented");
             // stopStoreMutation.mutate(store.id);
        } else {
            logger.warn("Start store action not implemented");
             // startStoreMutation.mutate(store.id);
        }
    };
    const handleDeleteStore = () => {
         // Ajouter confirmation
         logger.warn("Delete store action not implemented");
         // deleteStoreMutation.mutate(store.id);
    };


    // --- Préparation données Chart.js (Exemple simple) ---
    const chartLabels = statsData?.order_stats?.map(d => d.date) ?? [];
    const chartOrderData = statsData?.order_stats?.map(d => d.orders_count) ?? [];
    const chartVisitData = statsData?.visits_stats?.map(d => d.visits) ?? [];

    const chartData = {
        labels: chartLabels,
        datasets: [
            { label: t('dashboard.totalOrders'), data: chartOrderData, backgroundColor: 'rgba(59, 130, 246, 0.5)' }, // Bleu
            { label: t('dashboard.visits'), data: chartVisitData, backgroundColor: 'rgba(16, 185, 129, 0.5)' }, // Vert
        ],
    };
    const chartOptions = {
        responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } // Pas de décimales pour commandes/visites
    };
    // --- Fin Chart.js ---


    // --- Calcul utilisation disque ---
    // TODO: Récupérer l'utilisation disque réelle si l'API la fournit
    const diskUsageGb = 2.5; // Exemple
    const diskLimitGb = store.disk_storage_limit_gb ?? 10; // Défaut 10Gb si non défini
    const diskUsagePercent = diskLimitGb > 0 ? (diskUsageGb / diskLimitGb) : 0;

    // TODO: Récupérer utilisation réelle Collaborateurs/Produits
    const currentCollaborators = 2;
    const limitCollaborators = 10; // Limite du plan?
    const collaboratorUsagePercent = limitCollaborators > 0 ? (currentCollaborators / limitCollaborators) : 0;
    const currentProducts = 250;
    const limitProducts = 1000; // Limite du plan?
    const productUsagePercent = limitProducts > 0 ? (currentProducts / limitProducts) : 0;


    return (
        // Conteneur principal: fond blanc, rounded, shadow, border, padding, flex col
        <div className="selected-store-details bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 flex flex-col gap-6">

            {/* Section 1: Infos générales et Actions */}
            <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6 pb-6 border-b border-gray-100">
                {/* Image/Logo (Optionnel ici, déjà dans la carte?) */}
                {/* <img src={logoSrc} ... /> */}
                <div className="flex-grow min-w-0">
                    {/* Titre et Statut */}
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-xl font-semibold text-gray-800 truncate" title={store.name}>{store.name}</h2>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${store.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {store.is_active ? <IoCheckmarkCircle /> : <IoPauseCircle />}
                            {store.is_active ? t('storesPage.status.active') : t('storesPage.status.inactive')}
                        </span>
                    </div>
                     {/* Description */}
                     <p className="text-sm text-gray-500 line-clamp-2">{store.description || t('storesPage.noDescription')}</p> 
                      {/* Domaine(s) */}
                      {store.domain_names && store.domain_names.length > 0 && (
                          <div className="mt-2 text-sm">
                               <span className="text-gray-500">{t('storesPage.domainLabel')}: </span> 
                               <a href={`http://${store.domain_names[0]}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium">
                                   {store.domain_names[0]}
                               </a>
                               {store.domain_names.length > 1 && <span className="text-gray-400 text-xs"> (+{store.domain_names.length - 1})</span>}
                          </div>
                      )}
                </div>
                {/* Actions Rapides */}
                <div className="flex flex-wrap gap-2 md:flex-col md:items-end flex-shrink-0">
                     {/* Activer/Stopper */}
                     <button
                         onClick={handleStartStop}
                         disabled={isActionLoading}
                         className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition w-full md:w-auto justify-center ${
                             store.is_active
                                 ? 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100'
                                 : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                         } disabled:opacity-50`}
                     >
                         {store.is_active ? <IoClose size={16} /> : <IoDesktop size={16} />}
                         {store.is_active ? t('storesPage.actions.stop') : t('storesPage.actions.makeAvailable')} 
                     </button>
                      {/* Modifier */}
                      <a href={`/stores/${store.id}/edit`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 w-full md:w-auto justify-center">
                         <IoPencil size={16} /> {t('common.edit')} 
                     </a>
                      {/* Paramètres */}
                      <a href={`/stores/${store.id}/settings`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 w-full md:w-auto justify-center">
                         <IoSettings size={16} /> {t('storesPage.actions.settings')} 
                     </a>
                      {/* Sécurité (exemple) */}
                      {/* <a href={`/stores/${store.id}/security`} className="...">...</a> */}
                      {/* Supprimer (exemple) */}
                      {/* <button onClick={handleDeleteStore} disabled={isActionLoading} className="...">...</button> */}
                </div>
            </div>

             {/* Section 2: Statistiques */}
             <div className="pb-6 border-b border-gray-100">
                  <h3 className="text-base font-medium text-gray-700 mb-3">{t('storesPage.statsTitle')}</h3> 
                  <div className="h-48"> {/* Hauteur fixe pour le graphique */}
                      {isLoadingStats ? (
                           <div className="h-full flex items-center justify-center text-gray-400">{t('common.loading')}...</div>
                      ) : (
                           <Bar options={chartOptions as any} data={chartData} />
                      )}
                 </div>
             </div>

              {/* Section 3: Limites & Utilisation */}
              <div>
                   <h3 className="text-base font-medium text-gray-700 mb-3">{t('storesPage.usageTitle')}</h3> 
                    {/* Utiliser grid pour aligner */}
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                       {/* Disque SSD */}
                        <div className="activity">
                            <div className="flex justify-between mb-1">
                                 <span className="font-medium text-gray-600">{t('storesPage.limits.disk')} (Gb)</span> 
                                 <span className="text-gray-500">{diskUsageGb.toFixed(1)} / {diskLimitGb}</span>
                             </div>
                            <Progrees progress={diskUsagePercent} color="bg-indigo-500" /> {/* Utiliser le composant Progress */}
                        </div>
                         {/* Collaborateurs */}
                         <div className="activity">
                             <div className="flex justify-between mb-1">
                                  <span className="font-medium text-gray-600">{t('storesPage.limits.collaborators')}</span> 
                                  <span className="text-gray-500">{currentCollaborators} / {limitCollaborators}</span>
                              </div>
                             <Progrees progress={collaboratorUsagePercent} color="bg-cyan-500" />
                         </div>
                          {/* Produits */}
                          <div className="activity">
                              <div className="flex justify-between mb-1">
                                   <span className="font-medium text-gray-600">{t('storesPage.limits.products')}</span> 
                                   <span className="text-gray-500">{currentProducts} / {limitProducts}</span>
                               </div>
                              <Progrees progress={productUsagePercent} color="bg-emerald-500" />
                          </div>
                          {/* Ajouter Pays si pertinent */}
                           {/* <div className="activity">...</div> */}
                   </div>
              </div>

        </div>
    );
}