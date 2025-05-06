// Components/StoreDetails/SelectedStoreDetails.tsx

import { PeriodType, StoreInterface } from "../../Interfaces/Interfaces";
import { useTranslation } from "react-i18next";
import { IoBarChart, IoCheckmarkCircle, IoChevronForward, IoClose, IoDesktop, IoFingerPrint, IoGlobe, IoGlobeOutline, IoPauseCircle, IoPencil, IoSettings, IoTrash } from "react-icons/io5"; // Ajouter icônes actions
import { Bar } from 'react-chartjs-2'; // Importer Bar pour exemple stats
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'; // Importer modules Chart.js
import { Progrees } from "../Progress/Pregress"; // Utiliser le composant Progress
import { useGetVisitDetails, useGetOrderDetailsStats, useStartStore, useStopStore } from "../../api/ReactSublymusApi"; // Hook pour stats (si applicable au store)
import logger from "../../api/Logger";
import { useGlobalStore } from "../../pages/stores/StoreStore";
import { useState } from "react";
import { Confirm } from "../../Components/Confirm/Confirm";
import { useChildViewer } from "../ChildViewer/useChildViewer";
import { ChildViewer } from "../ChildViewer/ChildViewer";

// Enregistrer les modules Chart.js nécessaires
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface SelectedStoreDetailsProps {
    store: StoreInterface; // Store sélectionné (non partiel ici)
    onEditRequired: (store: StoreInterface) => void
}

export function SelectedStoreDetails({ store, onEditRequired }: SelectedStoreDetailsProps) {

    const { t, i18n } = useTranslation();
    const { openChild } = useChildViewer();


    const [period, setPeriod] = useState<PeriodType>('month');
    const {
        data: orderStatsData,
        isLoading: isLoadingOderStats
    } = useGetOrderDetailsStats(
        {
            period: period
        },
        { enabled: !!store.id }
    );
    const {
        data: visitStatsData,
        isLoading: isLoadingVisitStats
    } = useGetVisitDetails(
        {
            period: period
        },
        { enabled: !!store.id }
    );
    // const statsData = { // Placeholder Data
    //     order_stats: [{ date: '2023-10-01', orders_count: 5 }, { date: '2023-10-02', orders_count: 8 }],
    //     visits_stats: [{ date: '2023-10-01', visits: 50 }, { date: '2023-10-02', visits: 75 }],
    // };

    const statsData = { // Placeholder Data
        order_stats: orderStatsData,
        visits_stats: visitStatsData,
    };

    console.log({ statsData });

    const { setCurrentStore } = useGlobalStore()
    // TODO: Initialiser les mutations pour les actions serveur
    const startStoreMutation = useStartStore();
    const stopStoreMutation = useStopStore();


    const isActionLoading = startStoreMutation.isPending || startStoreMutation.isPending || stopStoreMutation.isPending

    const isLoadingStats = isLoadingOderStats || isLoadingVisitStats;

    // --- Handlers pour les actions ---
    const _handleStartStop = () => {
        if (store.is_running) {
            logger.warn("Stop store action not implemented");
            store.id && stopStoreMutation.mutate({
                store_id: store.id
            }, {
                onSuccess(data, variables, context) {
                    console.log('Action Stop', data.store);
                    if (!data.store?.id) return;
                    setCurrentStore(data.store)
                },
            });
        } else {
            logger.warn("Start store action not implemented");
            store.id && startStoreMutation.mutate({
                store_id: store.id
            }, {
                onSuccess(data, variables, context) {
                    console.log('Action Satrt', data.store);

                    if (!data.store?.id) return
                    setCurrentStore(data.store)
                },
            });
        }
    }
    const handleStartStop = () => {
        openChild(<ChildViewer>
            <div>
                <h3>{store.is_running ? t('storesPage.comfirm.stop') : t('storesPage.comfirm.start')}</h3>
                <p>{store.is_running ? t('storesPage.comfirm.stopPompt') : t('storesPage.comfirm.startPompt')}</p>
                <Confirm canConfirm
                    cancel={t('common.cancel')}
                    confirm={t('common.ok')}
                    onConfirm={() => {
                        _handleStartStop();
                    }}
                    onCancel={() => {
                        openChild(null)
                    }}
                />
            </div>
        </ChildViewer>, {
            background: '#3455'
        })
    };

    // --- Préparation données Chart.js (Exemple simple) ---
    const chartLabels = statsData?.order_stats?.slice(0, 7).map(_d => _d.date) ?? [];
    const chartOrderData = statsData?.order_stats?.slice(0, 7).map(d => d.orders_count) ?? [];
    const chartVisitData = statsData?.visits_stats?.slice(0, 7).map(d => d.visits) ?? [];

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
                 <div className="flex-grow min-w-0">
                    {/* Titre et Statut */}
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-xl font-semibold text-gray-800 truncate" title={store.name}>{store.name}</h2>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${store.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {store.is_active ? <IoCheckmarkCircle className="w-4 h-4" /> : <IoPauseCircle className="w-4 h-4" />}
                            {store.is_active ? t('storesPage.status.active') : t('storesPage.status.inactive')}
                        </span>
                    </div>
                    {/* Description */}
                    <p className="text-sm text-gray-500 line-clamp-2">{store.description || t('storesPage.noDescription')}</p>
                    {/* <span className="text-gray-500">{t('storesPage.domainLabel')}: </span> */}
                    {/* Url de par defeaut de la boutique. */}
                    {
                        <div className="mt-2 flex items-center gap-1 text-sm">
                            <IoGlobeOutline className="w-4 h-4 text-gray-700" />
                            <span className="text-gray-500">{t('')} </span>
                            <a href={`http://${'sublymus.com/'}${store.slug}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium">
                                {`http://${'sublymus.com/'}${store.slug}`}
                            </a>
                        </div>
                    }
                    {/* Domaine(s) */}
                    {/* {store.domain_names && store.domain_names.length > 0 && (
                        <div className="mt-2 text-sm">
                            <a href={`http://${store.domain_names[0]}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium">
                                {store.domain_names[0]}
                            </a>
                            {store.domain_names.length > 1 && <span className="text-gray-400 text-xs"> (+{store.domain_names.length - 1})</span>}
                        </div>
                    )} */}
                </div>
                {/* Actions Rapides */}
                <div className="flex flex-wrap gap-2 md:flex-col md:items-end flex-shrink-0">
                    {/* Activer/Stopper */}
                    <button
                        onClick={handleStartStop}
                        disabled={isActionLoading}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition w-full md:w-auto justify-center ${store.is_running
                            ? 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100  hover:shadow-md cursor-pointer'
                            : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100  hover:shadow-md cursor-pointer'
                            } disabled:opacity-50`}
                    >
                        {
                            // isActionLoading ? <div className="w-6 h-6" style={{background: getImg('/res/loading_white.gif')}}></div>:
                            store.is_running
                                ? <IoClose size={16} />
                                : <IoDesktop size={16} />}
                        {store.is_running ? t('storesPage.actions.stop') : t('storesPage.actions.makeAvailable')}
                    </button>
                    {/* Modifier */}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 w-full md:w-auto justify-center transition hover:shadow-md cursor-pointer hover:border-blue-200 hover:bg-blue-50/30" onClick={() => onEditRequired(store)}>
                        <IoPencil size={16} /> {t('common.edit')}
                    </span>
                    {/* Paramètres */}
                    <a href={`/stores/${store.id}/settings`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 w-full md:w-auto justify-center transition hover:shadow-md cursor-pointer hover:border-blue-200 hover:bg-blue-50/30">
                        <IoSettings size={16} /> {t('storesPage.actions.settings')}
                    </a>
                </div>
            </div>

            {/* Section 2: Statistiques */}
            <div className="pb-6 border-b border-gray-100">
                <a href={`/stores/stats`} className="inline-flex  items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border border-gray-300  text-gray-700 hover:bg-gray-50 w-full md:w-auto justify-center transition hover:shadow-md cursor-pointer hover:border-blue-200 hover:bg-blue-50/30  bg-blue-50">
                    <IoBarChart size={16} /> {t('storesPage.openStoreStats')}
                </a>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">{t('clientDetail.activityChartTitle')}</h3>
                    {/* Sélecteur Période */}
                    <div className="periods flex items-center gap-1 border border-gray-300 rounded-lg p-0.5">
                        {(['day', 'week', 'month'] as const).map(p => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${p === period ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                {t(`dashboard.periods.${p}`)}
                            </button>
                        ))}
                    </div>
                </div>
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