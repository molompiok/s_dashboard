// components/Stats/KpiCards.tsx
import React from 'react';
import { DollarSign, ShoppingCart, Eye, Users, Percent, PackageOpen } from 'lucide-react';
import { KpiStatsResponse } from '../../api/Interfaces/Interfaces';
import { useTranslation } from 'react-i18next';

interface KpiCardsProps {
    kpis: KpiStatsResponse | undefined; // KPI data from the API
    isLoading?: boolean; // 🎨 Added to handle loading state
}

// 🎨 Simplified config: color is now an object for light/dark modes
interface KpiConfig {
    key: keyof KpiStatsResponse;
    labelKey: string;
    icon: React.ElementType;
    color: {
        light: string; // e.g., 'text-teal-600'
        dark: string;  // e.g., 'text-teal-400'
    };
    format: 'number' | 'currency' | 'percentage';
    decimals?: number;
}

const kpisConfig: KpiConfig[] = [
    {
        key: 'totalRevenue', labelKey: 'stats.kpi.totalRevenue', icon: DollarSign,
        color: { light: 'text-emerald-600', dark: 'text-emerald-400' },
        format: 'currency'
    },
    {
        key: 'totalOrders', labelKey: 'stats.kpi.totalOrders', icon: ShoppingCart,
        color: { light: 'text-indigo-600', dark: 'text-indigo-400' },
        format: 'number'
    },
    {
        key: 'totalVisits', labelKey: 'stats.kpi.totalVisits', icon: Eye,
        color: { light: 'text-sky-600', dark: 'text-sky-400' },
        format: 'number'
    },
    {
        key: 'uniqueVisitors', labelKey: 'stats.kpi.uniqueVisitors', icon: Users,
        color: { light: 'text-cyan-600', dark: 'text-cyan-400' },
        format: 'number'
    },
    {
        key: 'conversionRate', labelKey: 'stats.kpi.conversionRate', icon: Percent,
        color: { light: 'text-fuchsia-600', dark: 'text-fuchsia-400' },
        format: 'percentage', decimals: 2
    },
    {
        key: 'averageOrderValue', labelKey: 'stats.kpi.averageOrderValue', icon: DollarSign,
        color: { light: 'text-teal-600', dark: 'text-teal-400' },
        format: 'currency'
    },
];

const formatValue = (value: number | undefined | null, format: 'number' | 'currency' | 'percentage', locale: string, decimals: number = 0): string => {
    if (value === undefined || value === null) return '-';
    try {
        if (format === 'currency') {
            return value.toLocaleString(locale, { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2 });
        } else if (format === 'percentage') {
            return value.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + '%';
        } else {
            return value.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
        }
    } catch (e) {
        console.error("Error formatting KPI value", value, format, e);
        return String(value);
    }
};

// 🎨 Skeleton Card Component
const KpiCardSkeleton: React.FC = () => {
    return (
        <div className="flex min-w-[200px] flex-col p-4 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 animate-pulse">
            <div className="flex justify-between items-start">
                <div className="h-5 w-2/3 bg-gray-300 dark:bg-gray-700 rounded-md"></div>
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
            </div>
            <div className="mt-4 h-8 w-1/3 bg-gray-300 dark:bg-gray-700 rounded-md"></div>
        </div>
    );
};


const KpiCards: React.FC<KpiCardsProps> = ({ kpis, isLoading }) => {
    const { t } = useTranslation();

    return (
        // Grid layout
        <div className="grid grid-cols-1 w-full sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4 md:gap-5 mb-6">
            {isLoading
                ? // 🎨 Show skeletons while loading
                  Array.from({ length: 6 }).map((_, index) => <KpiCardSkeleton key={index} />)
                : // Show actual KPI cards when data is available
                  kpisConfig.map(kpi => {
                    const value = kpis?.[kpi.key];
                    const Icon = kpi.icon;

                    return (
                        // 🎨 Card with glassmorphism for dark mode and hover effect
                        <div
                            key={kpi.key}
                            className={`kpi-card group flex flex-col p-4 rounded-lg 
                                       bg-white/80 dark:bg-white/5
                                       backdrop-blur-md 
                                       border border-gray-200/80 dark:border-white/10
                                       hover:border-gray-300 dark:hover:border-white/20
                                       shadow-sm hover:shadow-lg dark:hover:shadow-2xl dark:hover:shadow-black/20
                                       transition-all duration-300 ease-in-out`}
                        >
                            {/* Header: Label + Icon */}
                            <div className="flex justify-between items-start">
                                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {t(kpi.labelKey)}
                                </div>
                                <Icon 
                                    className={`w-6 h-6 flex-shrink-0 ${kpi.color.light} dark:${kpi.color.dark} transition-transform duration-300 group-hover:scale-110`} 
                                    strokeWidth={1.8} 
                                />
                            </div>

                            {/* Main Value */}
                            <div className={`mt-2 text-3xl font-bold ${kpi.color.light} dark:${kpi.color.dark}`}>
                                {formatValue(value as number, kpi.format, t('common.locale'), kpi.decimals)}
                            </div>
                        </div>
                    );
                })}
        </div>
    );
};

export default KpiCards;