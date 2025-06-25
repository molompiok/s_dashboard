// Components/StoreDetails/SelectedStoreDetails.tsx

import { PeriodType, StoreInterface } from "../../api/Interfaces/Interfaces";
import { useTranslation } from "react-i18next";
import {
    BarChart3,
    CheckCircle,
    X,
    Monitor,
    Globe,
    HardDrive,
    Layers,
    PauseCircle,
    Edit,
    Users,
    Settings,
    Store,
    TrendingUp
} from "lucide-react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useGetVisitDetails, useGetOrderDetailsStats, useStartStore, useStopStore } from "../../api/ReactSublymusApi";
import logger from "../../api/Logger";
import { useGlobalStore } from "../../api/stores/StoreStore";
import { useState } from "react";
import { useChildViewer } from "../ChildViewer/useChildViewer";
import { ChildViewer } from "../ChildViewer/ChildViewer";
import { showErrorToast, showToast } from "../Utils/toastNotifications";
import { ConfirmPopup } from "../Confirm/ConfirmPopup";
import { Bar } from "react-chartjs-2";
import { DateTime } from "luxon";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface SelectedStoreDetailsProps {
    store: StoreInterface;
    onEditRequired: (store: StoreInterface) => void
}

// Composant Progress moderne avec glassmorphism
const Progress = ({ progress, color = "bg-emerald-500", className = "" }: any) => (
    <div className={`w-full bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-full h-2 overflow-hidden ${className}`}>
        <div
            className={`h-full ${color} transition-all duration-500 ease-out rounded-full shadow-sm`}
            style={{ width: `${Math.min(progress, 100)}%` }}
        />
    </div>
);

// Composant StatCard avec glassmorphism et responsive
const StatCard = ({ icon: Icon, title, current, limit, color, percentage }: any) => (
    <div className="stat-card group bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-2xl p-3 sx:p-4  border border-white/20 dark:border-white/10 hover:border-emerald-300/50 dark:hover:border-emerald-400/30 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:bg-white/20 dark:hover:bg-white/10">
        <div className="flex items-center gap-2 sx:gap-3 mb-3">
            <div className={`p-1.5 sx:p-2 rounded-xl ${color}/20 bg-opacity-20 dark:bg-opacity-30 backdrop-blur-sm`}>
                <Icon className={`w-4 h-4 sx:w-5 sx:h-5 ${color.replace('bg-', 'text-')}`} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs sx:text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{current} / {limit}</p>
            </div>
        </div>
        <Progress progress={percentage} color={color.replace('bg-', 'bg-')} />
        <div className="mt-2 text-right">
            <span className={`text-xs font-medium ${percentage > 80
                ? 'text-red-500 dark:text-red-400'
                : percentage > 60
                    ? 'text-yellow-500 dark:text-yellow-400'
                    : 'text-emerald-500 dark:text-emerald-400'
                }`}>
                {percentage.toFixed(1)}%
            </span>
        </div>
    </div>
);


function getDatesArray(period: PeriodType, count = 7) {
    const now = DateTime.local();

    return Array.from({ length: count }).map((_, i) => {
        switch (period) {
            case 'day':
                return now.minus({ days: i }).toLocaleString();
            case 'week':
                return now.minus({ weeks: i }).toLocaleString();
            case 'month':
                return now.minus({ months: i }).toLocaleString();
            default:
                return now.toLocaleString();
        }
    }).reverse();
}

export function SelectedStoreDetails({ store, onEditRequired }: SelectedStoreDetailsProps) {
    const { t } = useTranslation();
    const { openChild } = useChildViewer();
    const [period, setPeriod] = useState<PeriodType>('month');
    const [showFull, setShowFull] = useState(false);
    const {
        data: orderStatsData,
        isLoading: isLoadingOderStats
    } = useGetOrderDetailsStats(
        { period: period },
        { enabled: !!store.id }
    );

    const {
        data: visitStatsData = [],
        isLoading: isLoadingVisitStats
    } = useGetVisitDetails(
        { period: period },
        { enabled: !!store.id }
    );

    const statsData = {
        order_stats: orderStatsData,
        visits_stats: visitStatsData,
    };

    const { setCurrentStore } = useGlobalStore();
    const startStoreMutation = useStartStore();
    const stopStoreMutation = useStopStore();

    const isActionLoading = startStoreMutation.isPending || stopStoreMutation.isPending;
    const isLoadingStats = isLoadingOderStats || isLoadingVisitStats;

    // Handlers
    const _handleStartStop = () => {
        if (store.is_running) {
            store.id && stopStoreMutation.mutate(
                { store_id: store.id },
                {
                    onSuccess(data) {
                        if (!data.store?.id) return;
                        setCurrentStore(data.store);
                        openChild(null);
                        showToast("Boutique arrêtée avec succès", 'INFO');
                    },
                    onError(error) {
                        openChild(null);
                        logger.error({ error }, `Failed to stop store ${store.id}`);
                        showErrorToast(error);
                    },
                }
            );
        } else {
            store.id && startStoreMutation.mutate(
                { store_id: store.id },
                {
                    onSuccess(data) {
                        if (!data.store?.id) return;
                        setCurrentStore(data.store);
                        openChild(null);
                        showToast("Boutique démarrée avec succès", 'SUCCESS');
                    },
                    onError(error) {
                        openChild(null);
                        logger.error({ error }, `Failed to start store ${store.id}`);
                        showErrorToast(error);
                    },
                }
            );
        }
    };

    const handleStartStop = () => {
        openChild(<ChildViewer>
            <ConfirmPopup
                title={store.is_running ? t('storesPage.comfirm.stop') : t('storesPage.comfirm.start')}
                description={store.is_running ? t('storesPage.comfirm.stopPompt') : t('storesPage.comfirm.startPompt')}
                dangerLevel="confirm"
                cancelText={t('common.cancel')}
                actionText={t('common.ok')}
                onAction={() => { _handleStartStop(); }}
                onCancel={() => { openChild(null); }}
            />
        </ChildViewer>, {
            background: '#3455'
        });
    };

    // --- Préparation données Chart.js (Exemple simple) ---
    let chartLabels = statsData?.order_stats?.slice(0, 7).map(_d => _d.date)
    chartLabels = (chartLabels?.length || 0) > 0 ? chartLabels : getDatesArray(period);
    let chartOrderData = statsData?.order_stats?.slice(0, 7).map(d => d.orders_count);
    chartOrderData = (chartOrderData?.length || 0) > 0 ? chartOrderData : Array.from({ length: 7 }).map(() => 0.05);
    let chartVisitData = statsData?.visits_stats?.slice(0, 7).map(d => d.visits);
    chartVisitData = (chartVisitData?.length || 0) > 0 ? chartVisitData : Array.from({ length: 7 }).map(() => 0.05);

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

    // Stats et données
    const diskUsageGb = 2.5;
    const diskLimitGb = store.disk_storage_limit_gb ?? 10;
    const diskUsagePercent = diskLimitGb > 0 ? (diskUsageGb / diskLimitGb) * 100 : 0;

    const stats = {
        diskUsageGb: 2.4,
        diskLimitGb: 10,
        currentCollaborators: 3,
        limitCollaborators: 5,
        currentProducts: 127,
        limitProducts: 500
    };

    const currentCollaborators = 2;
    const limitCollaborators = 10;
    const collaboratorUsagePercent = limitCollaborators > 0 ? (currentCollaborators / limitCollaborators) * 100 : 0;
    const currentProducts = 250;
    const limitProducts = 1000;
    const productUsagePercent = limitProducts > 0 ? (currentProducts / limitProducts) * 100 : 0;


    const description = store.description || 'Aucune description disponible';
    const limit = 100;

    const isLong = description.length > limit;
    const displayedDescription = showFull ? description : description.slice(0, limit);

    // Composant Description
    const Desc = (
        <>
            <p className="text-gray-600 dark:text-gray-300 mb-3 leading-relaxed text-sm sx:text-base">
                {displayedDescription}
                {isLong && (
                    <>
                        {!showFull && '...'}
                        <button
                            onClick={() => setShowFull(!showFull)}
                            className="ml-2 text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                        >
                            {showFull ? 'Voir moins' : 'Voir plus'}
                        </button>
                    </>
                )}
            </p>

            <div className="flex items-center gap-2 text-xs sx:text-sm">
                <Globe className="w-4 h-4 sx:w-4 sx:h-4 text-gray-500" />
                <span className="text-gray-500 dark:text-gray-400">URL: </span>
                <a
                    href={`http://${store.default_domain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-500 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 font-medium hover:underline transition-colors"
                >
                    {store.default_domain}
                </a>
            </div>
        </>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-4 sx:space-y-6 ">
            {/* Header avec actions principales */}
            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-2xl sx:rounded-3xl p-3 sx:p-4 border border-white/20 dark:border-white/10 shadow-xl">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Informations principales */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3  mb-4">
                            <div className="p-2  bg-emerald-500/20 dark:bg-emerald-400/20 backdrop-blur-sm rounded-xl sx:rounded-2xl">
                                <Store className="w-4 h-4 sx:w-5 sx:h-5 text-emerald-500 dark:text-emerald-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 sx:gap-3 mb-2">
                                    <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate" title={store.name}>
                                        {store.name}
                                    </h1>
                                    <span className={`inline-flex items-center gap-1 sx:gap-1.5 px-2 sx:px-3 py-1 rounded-full text-xs sx:text-sm font-medium backdrop-blur-sm ${store.is_active
                                            ? 'bg-emerald-500/20 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300/30'
                                            : 'bg-gray-500/20 dark:bg-gray-400/20 text-gray-600 dark:text-gray-400 border border-gray-300/30'
                                        }`}>
                                        {store.is_active ? <CheckCircle className="w-4 h-4 sx:w-4 sx:h-4" /> : <PauseCircle className="w-4 h-4 sx:w-4 sx:h-4" />}
                                        {store.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="hidden sx:block">
                                    {Desc}
                                </div>
                            </div>
                        </div>
                        <div className="block sx:hidden">
                            {Desc}
                        </div>
                    </div>

                    {/* Actions rapides */}
                    <div className="flex flex-wrap gap-2 sx:gap-3 lg:flex-col lg:min-w-[180px] sl2:lg:min-w-[200px]">
                        <button
                            onClick={handleStartStop}
                            disabled={isActionLoading}
                            className={`flex items-center justify-center gap-2 px-3 py-2  rounded-xl  font-medium text-xs  transition-all duration-300 min-w-[120px]  backdrop-blur-sm ${store.is_running
                                ? 'bg-amber-500/20 dark:bg-amber-400/20 border border-amber-300/30 dark:border-amber-400/20 text-amber-700 dark:text-amber-300 hover:bg-amber-500/30 dark:hover:bg-amber-400/30 hover:shadow-lg hover:shadow-amber-500/20'
                                : 'bg-emerald-500/20 dark:bg-emerald-400/20 border border-emerald-300/30 dark:border-emerald-400/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30 dark:hover:bg-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/20'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {store.is_running ? <X className="w-4 h-4" /> : <Monitor className="w-4 h-4 sx:w-4 sx:h-4" />}
                            {store.is_running ? 'Arrêter' : 'Démarrer'}
                        </button>

                        <button
                            onClick={() => onEditRequired(store)}
                            className="flex items-center justify-center gap-2 px-3  py-2 rounded-xl font-medium text-xs  bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-blue-300/50 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-white/10 hover:border-blue-300/50 dark:hover:border-blue-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 min-w-[120px] "
                        >
                            <Edit className="w-4 h-4 " />
                            Modifier
                        </button>

                        <a
                            href={`/${store.id}/settings`}
                            className="flex items-center justify-center gap-2 px-3  py-2 rounded-xl font-medium text-xs  bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-blue-300/50 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-white/10 hover:border-blue-300/50 dark:hover:border-blue-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 min-w-[120px] "
                        >
                            <Settings className="w-4 h-4 " />
                            Paramètres
                        </a>
                    </div>
                </div>
            </div>

            {/* Section Statistiques */}
            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-2xl sx:rounded-3xl p-3 sx:p-4 border border-white/20 dark:border-white/10 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sx:gap-4 mb-4 sx:mb-6">
                    <div className="flex items-center gap-2 sx:gap-3">
                        <div className="p-1.5 sx:p-2 bg-blue-500/20 dark:bg-blue-400/20 backdrop-blur-sm rounded-lg sx:rounded-xl">
                            <TrendingUp className="w-4 h-4 sx:w-5 sx:h-5 text-blue-500 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-base sx:text-xl font-semibold text-gray-900 dark:text-white">Activité de la boutique</h2>
                            <p className="text-xs sx:text-sm text-gray-500 dark:text-gray-400">Aperçu des performances récentes</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <a
                            href="/stats"
                            className="flex items-center gap-2 px-3 sx:px-4 py-2 rounded-lg sx:rounded-xl font-medium text-xs sx:text-sm bg-blue-500/20 dark:bg-blue-400/20 backdrop-blur-sm border border-blue-300/30 dark:border-blue-400/20 text-blue-700 dark:text-blue-300 hover:bg-blue-500/30 dark:hover:bg-blue-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
                        >
                            <BarChart3 className="w-4 h-4 sx:w-4 sx:h-4" />
                            Voir tout
                        </a>

                        <div className="flex items-center bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-lg sx:rounded-xl p-1 border border-white/20 dark:border-white/10">
                            {(['day', 'week', 'month'] as const).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`px-2 sx:px-3 py-1 sx:py-1.5 rounded-md sx:rounded-lg text-xs font-medium transition-all duration-300 ${p === period
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/10'
                                        }`}
                                >
                                    {p === 'day' ? 'Jour' : p === 'week' ? 'Semaine' : 'Mois'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="sx:h-56 w-full h-full bg-white/5 dark:bg-white/5 backdrop-blur-sm rounded-xl sx:rounded-2xl flex items-center justify-center border border-white/10 dark:border-white/5">
                    {isLoadingStats ? (
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm">Chargement des statistiques...</span>
                        </div>
                    ) : (
                        <div className="w-full h-full text-gray-500  dark:text-gray-400 text-sm">
                            <Bar width="100%" height="100%" options={chartOptions as any} data={chartData} />
                        </div>
                    )}
                </div>
            </div>

            {/* Section Utilisation et Limites */}
            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-2xl sx:rounded-3xl p-3 sx:p-4 border border-white/20 dark:border-white/10 shadow-xl">
                <div className="flex items-center gap-2 sx:gap-3 mb-4 sx:mb-6">
                    <div className="p-1.5 sx:p-2 bg-purple-500/20 dark:bg-purple-400/20 backdrop-blur-sm rounded-lg sx:rounded-xl">
                        <Layers className="w-4 h-4 sx:w-5 sx:h-5 text-purple-500 dark:text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-base  sx:text-xl font-semibold text-gray-900 dark:text-white">Utilisation & Limites</h2>
                        <p className="text-xs sx:text-sm text-gray-500 dark:text-gray-400">Surveillez votre consommation de ressources</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sx:gap-4">
                    <StatCard
                        icon={HardDrive}
                        title="Stockage SSD"
                        current={`${stats.diskUsageGb.toFixed(1)} GB`}
                        limit={`${stats.diskLimitGb} GB`}
                        color="bg-indigo-500"
                        percentage={diskUsagePercent}
                    />

                    <StatCard
                        icon={Users}
                        title="Collaborateurs"
                        current={stats.currentCollaborators}
                        limit={stats.limitCollaborators}
                        color="bg-cyan-500"
                        percentage={collaboratorUsagePercent}
                    />

                    <StatCard
                        icon={Store}
                        title="Produits"
                        current={stats.currentProducts}
                        limit={stats.limitProducts}
                        color="bg-emerald-500"
                        percentage={productUsagePercent}
                    />
                </div>
            </div>
        </div>
    );
}

// components/Skeletons/StoreSkeleton.tsx

// Ce composant interne imite une carte "verre dépoli" du skeleton
const SkeletonCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-gray-100/80 dark:bg-white/5 rounded-2xl border border-gray-200/50 dark:border-white/10 p-4 ${className}`}>
        {children}
    </div>
);

export default function StoreSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 animate-pulse">
      
      {/* Squelette de l'en-tête */}
      <SkeletonCard>
        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
          {/* Infos principales */}
          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex items-center gap-4">
              {/* Icône de la boutique */}
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
              <div className="space-y-2">
                {/* Nom de la boutique */}
                <div className="h-6 w-48 bg-gray-300 dark:bg-gray-600 rounded-md"></div>
                {/* Statut */}
                <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>

            {/* URL */}
            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>

          {/* Actions */}
          <div className="flex  gap-2 lg:flex-col lg:min-w-[200px]">
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          </div>
        </div>
      </SkeletonCard>

      {/* Squelette des Statistiques */}
      <SkeletonCard>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
            <div className="space-y-2">
              <div className="h-6 w-56 bg-gray-300 dark:bg-gray-600 rounded-md"></div>
              <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
          {/* Graphique */}
          <div className="h-56 bg-gray-200 dark:bg-gray-700/50 rounded-2xl"></div>
        </div>
      </SkeletonCard>

      {/* Squelette de l'Utilisation & Limites */}
      <SkeletonCard>
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                <div className="space-y-2">
                <div className="h-6 w-56 bg-gray-300 dark:bg-gray-600 rounded-md"></div>
                <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {/* Carte de limite */}
              <div className="p-4 bg-gray-200/50 dark:bg-gray-700/50 rounded-xl space-y-2">
                <div className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded-md"></div>
                <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="h-3 w-1/2 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
               {/* Carte de limite */}
              <div className="p-4 bg-gray-200/50 dark:bg-gray-700/50 rounded-xl space-y-2">
                <div className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded-md"></div>
                <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="h-3 w-1/2 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
               {/* Carte de limite */}
              <div className="p-4 bg-gray-200/50 dark:bg-gray-700/50 rounded-xl space-y-2">
                <div className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded-md"></div>
                <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="h-3 w-1/2 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
            </div>
        </div>
      </SkeletonCard>
    </div>
  );
}