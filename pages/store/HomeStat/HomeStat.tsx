import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IoPeopleSharp, IoCart, IoEllipsisHorizontalSharp, IoEyeOff, IoEyeSharp, IoChevronDown } from "react-icons/io5";
import { Nuage } from "../Nuage";
import MyChart from "../MiniChart";
import { useGetVisitDetails, useGetOrderDetailsStats } from "../../../api/ReactSublymusApi";
import { PeriodType, StatsData } from "../../../api/Interfaces/Interfaces";
import { useGlobalStore } from "../../../api/stores/StoreStore";
import { useTranslation } from "react-i18next";
import { ClientCall } from "../../../Components/Utils/functions";

// Types pour une meilleure type safety
interface StatCard {
    title: string;
    value: number | string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    isLoading: boolean;
    isError: boolean;
    chartData?: number[];
    chartColor?: string;
    href: string;
}

// Constantes pour éviter la duplication
const PERIODS = ['day', 'week', 'month'] as const;

const DEFAULT_VISIBILITY = 'account_visiblity';

export function HomeStat() {
    const { t } = useTranslation();
    const [isAccountVisible, setIsAccountVisible] = useState<Boolean>(ClientCall(function(){return localStorage.getItem(DEFAULT_VISIBILITY)=='true'},false));
    const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
    const [period, setPeriod] = useState<PeriodType>('month');
    const [cloudWidth, setCloudWidth] = useState(100);

    // Refs
    const accountRef = useRef<HTMLSpanElement | null>(null);
    const periodMenuRef = useRef<HTMLDivElement | null>(null);

    // Global state
    const { currentStore } = useGlobalStore();

    // API calls avec error handling amélioré
    const {
        data: orderStatsData = [],
        isLoading: isLoadingOrderStats,
        isError: isErrorOrderStats,
        error: orderStatsError
    } = useGetOrderDetailsStats(
        { period },
        {
            enabled: !!currentStore,
            // retry: 2,
            // staleTime: 5 * 60 * 1000, // 5 minutes
        }
    );

    const {
        data: visitStatsData = [],
        isLoading: isLoadingVisitStats,
        isError: isErrorVisitStats,
        error: visitStatsError
    } = useGetVisitDetails(
        { period },
        {
            enabled: !!currentStore,
            // retry: 2,
            // staleTime: 5 * 60 * 1000, // 5 minutes
        }
    );

    // Calculs optimisés avec gestion d'erreur
    const totalVisits = useMemo(() => {
        if (!visitStatsData?.length) return 0;
        try {
            return visitStatsData.reduce((sum, day) => sum + (day.visits || 0), 0);
        } catch (error) {
            console.error('Error calculating total visits:', error);
            return 0;
        }
    }, [visitStatsData]);

    const totalOrders = useMemo(() => {
        if (!orderStatsData?.length) return 0;
        try {
            return orderStatsData.reduce((sum, day) => sum + (day.orders_count || 0), 0);
        } catch (error) {
            console.error('Error calculating total orders:', error);
            return 0;
        }
    }, [orderStatsData]);

    const totalRevenue = useMemo(() => {
        if (!orderStatsData?.length) return 0;
        try {
            return orderStatsData.reduce((sum, day) => sum + (Number(day.total_price) || 0), 0);
        } catch (error) {
            console.error('Error calculating total revenue:', error);
            return 0;
        }
    }, [orderStatsData]);

    // Handlers optimisés
    const toggleAccountVisibility = useCallback(() => {
        if (accountRef.current) {
            const width = accountRef.current.getBoundingClientRect().width;
            setCloudWidth(width);
        }
        
        setIsAccountVisible(prev => {
            const v = !prev
            localStorage.setItem(DEFAULT_VISIBILITY,v+'');
            return v
        });
    }, []);

    const handlePeriodChange = useCallback((newPeriod: PeriodType) => {
        setPeriod(newPeriod);
        setIsPeriodMenuOpen(false);
    }, []);

    const togglePeriodMenu = useCallback(() => {
        setIsPeriodMenuOpen(prev => !prev);
    }, []);

    // Fermeture du menu période lors du clic extérieur
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isPeriodMenuOpen &&
                periodMenuRef.current &&
                !periodMenuRef.current.contains(event.target as Node)
            ) {
                setIsPeriodMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isPeriodMenuOpen]);

    // Gestion du clavier pour l'accessibilité
    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            togglePeriodMenu();
        }
        if (event.key === 'Escape') {
            setIsPeriodMenuOpen(false);
        }
    }, [togglePeriodMenu]);

    // Configuration des cartes statistiques
    const statCards: StatCard[] = useMemo(() => [
        {
            title: t('dashboard.visits'),
            value: totalVisits,
            icon: IoPeopleSharp,
            color: 'text-blue-700',
            isLoading: isLoadingVisitStats,
            isError: isErrorVisitStats,
            chartData: visitStatsData?.slice(-12).map(v => v.visits || 0),
            chartColor: 'blue',
            href: '/stats'
        },
        {
            title: t('dashboard.totalOrders'),
            value: totalOrders,
            icon: IoCart,
            color: 'text-green-700',
            isLoading: isLoadingOrderStats,
            isError: isErrorOrderStats,
            chartData: orderStatsData?.slice(-12).map(v => v.orders_count || 0),
            chartColor: 'green',
            href: '/stats'
        }
    ], [
        t,
        totalVisits,
        totalOrders,
        isLoadingVisitStats,
        isErrorVisitStats,
        isLoadingOrderStats,
        isErrorOrderStats,
        visitStatsData,
        orderStatsData
    ]);

    // Formatage du montant
    const formatCurrency = useCallback((amount: number) => {
        return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
    }, []);

    return (
        <div className="w-full grid grid-cols-1 dark:text-gray-200 min-[420px]:grid-cols-2 gap-5 p-2 bg-gradient-to-br from-gray-50 to-slate-200/25 dark:from-slate-900/20 dark:to-slate-800/20 rounded-2xl">
            {/* Account Total Card */}
            <div className="relative bg-white/95 dark:bg-white/5 shadow-md rounded-xl p-5 transition-all duration-200 ease-in-out hover:shadow-lg min-[420px]:col-span-2 border border-transparent dark:border-white/10">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-slate-600 dark:text-slate-300 text-sm font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                        {t('dashboard.accountTotal')}
                    </h3>

                    {/* Period Selector */}
                    <div className="relative" ref={periodMenuRef}>
                        <button
                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                            onClick={togglePeriodMenu}
                            onKeyDown={handleKeyDown}
                            aria-expanded={isPeriodMenuOpen}
                            aria-haspopup="listbox"
                            aria-label={t('dashboard.selectPeriod')}
                        >
                            <span className="capitalize font-medium text-slate-700 dark:text-gray-100">
                                {t(`dashboard.periods.${period}`, period)}
                            </span>
                            <IoChevronDown
                                className={`text-slate-500 dark:text-gray-300 transition-transform duration-200 ${isPeriodMenuOpen ? 'rotate-180' : ''
                                    }`}
                            />
                        </button>

                        {/* Dropdown Menu */}
                        <div
                            className={`absolute right-0 mt-2 w-32 bg-white dark:bg-slate-800 shadow-lg rounded-xl border border-gray-100 dark:border-white/10 py-2 z-50 transition-all duration-200 ease-in-out transform origin-top-right ${isPeriodMenuOpen ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95'
                                }`}
                            role="listbox"
                            aria-label={t('dashboard.periodOptions')}
                        >
                            {PERIODS.map(periodOption => (
                                <button
                                    key={periodOption}
                                    onClick={() => handlePeriodChange(periodOption)}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-colors duration-150 ${period === periodOption
                                            ? 'text-blue-600 font-medium bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400'
                                            : 'text-gray-700 dark:text-gray-200'
                                        }`}
                                    role="option"
                                    aria-selected={period === periodOption}
                                >
                                    {t(`dashboard.periods.${periodOption}`, periodOption)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Revenue Display */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                            {!isAccountVisible ? (
                                <span ref={accountRef} className="tabular-nums">
                                    {formatCurrency(totalRevenue)}
                                </span>
                            ) : (
                                <Nuage
                                    color="#678"
                                    density={1}
                                    height={36}
                                    width={cloudWidth}
                                    speed={1}
                                />
                            )}
                            <button
                                className="p-2 text-slate-500 dark:text-gray-300 hover:text-slate-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onClick={toggleAccountVisibility}
                                aria-label={isAccountVisible ? t('common.showAmount') : t('common.hideAmount')}
                                title={isAccountVisible ? t('common.showAmount') : t('common.hideAmount')}
                            >
                                {isAccountVisible ? <IoEyeOff size={20} /> : <IoEyeSharp size={20} />}
                            </button>
                        </h1>
                    </div>

                    <div className="text-sm text-slate-500 dark:text-gray-400">
                        {t('dashboard.periodRevenue', { period: t(`dashboard.periods.${period}`) })}
                    </div>
                </div>

                <a
                    href={undefined}
                    className="absolute bottom-3 right-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded px-1"
                >
                    {t('common.details')}
                </a>
            </div>

            {/* Statistics Cards */}
            {statCards.map((card, index) => (
                <StatCard key={index} {...card} />
            ))}
        </div>
    );

}

// Composant StatCard séparé pour une meilleure réutilisabilité
function StatCard({
    title,
    value,
    icon: Icon,
    color,
    isLoading,
    isError,
    chartData,
    chartColor = 'blue',
    href
}: StatCard) {
    const { t } = useTranslation();

    return (
        <div className="relative bg-white/95 dark:bg-white/5 shadow-md dark:shadow-none rounded-xl p-5 transition-all duration-200 ease-in-out hover:shadow-lg dark:hover:shadow-xl group border border-transparent dark:border-white/10">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-slate-600 dark:text-gray-200 text-sm font-semibold flex items-center gap-2">
                    <Icon className="w-5 h-5 text-slate-500 dark:text-gray-400" />
                    {title}
                </h3>
            </div>

            <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        {isLoading && (
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 border-2 border-blue-200 dark:border-blue-400 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin"></div>
                                <span className="text-sm text-gray-500 dark:text-gray-300">{t('common.loading')}</span>
                            </div>
                        )}

                        {isError && (
                            <div className="flex items-center gap-2 text-red-500 dark:text-red-400">
                                <span className="text-sm">⚠️</span>
                                <span className="text-sm">{t('common.error')}</span>
                            </div>
                        )}

                        {!isLoading && !isError && (
                            <h2 className={`text-2xl font-bold ${color} tabular-nums`}>
                                {typeof value === 'number' ? value.toLocaleString() : value}
                            </h2>
                        )}
                    </div>

                    {/* Chart */}
                    {chartData && chartData.length > 0 && !isLoading && !isError && (
                        <div className="flex-shrink-0">
                            <MyChart
                                datasets={chartData}
                                color={chartColor as any}
                            />
                        </div>
                    )}
                </div>
            </div>

            <a
                href={href}
                className="absolute bottom-1 left-4 text-sm text-blue-600 dark:text-emerald-400 hover:text-blue-800 dark:hover:text-emerald-300 hover:underline transition-colors duration-150 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-emerald-500 focus:ring-offset-1 rounded px-1"
            >
                {t('common.seeMore')}
            </a>
        </div>
    );
}
