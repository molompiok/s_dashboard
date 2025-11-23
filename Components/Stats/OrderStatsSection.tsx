// components/Stats/OrderStatsSection.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { OrderStatsResponse, OrderStatsIncludeOptions, StatsPeriod, OrderStatsResultItem } from '../../api/Interfaces/Interfaces';
import LineChart from './LineChart';
import ChartLegend from './ChartLegend';
import DimensionBreakdown from './DimensionBreakdown';
import { ChartData } from 'chart.js';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';

interface OrderStatsSectionProps {
    data: OrderStatsResponse | undefined;
    period: StatsPeriod;
    includes: OrderStatsIncludeOptions;
    isLoading: boolean; // 🎨 Added to handle loading state
}

// 🎨 Updated dataset colors for `teal` theme and dark mode
const datasetColors = {
    total_price: { labelKey: 'stats.kpi.totalRevenue', light: '#0d9488', dark: '#2dd4bf' }, // teal-600, teal-400
    orders_count: { labelKey: 'stats.kpi.totalOrders', light: '#4f46e5', dark: '#818cf8' }, // indigo-600, indigo-400
    items_count: { labelKey: 'stats.kpi.itemsCount', light: '#f59e0b', dark: '#fcd34d' }, // amber-500, amber-300
};

const orderDimensionLabels: Record<keyof OrderStatsIncludeOptions | string, string> = {
    status: 'Statut de la commande', payment_status: 'Statut du paiement',
    payment_method: 'Méthode de paiement', with_delivery: 'Avec livraison',
};

// 🎨 Skeleton Component
const OrderStatsSkeleton: React.FC = () => (
    <div className="bg-white/80 dark:bg-white/5 backdrop-blur-lg p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200/80 dark:border-white/10 h-full flex flex-col animate-pulse">
        <div className="h-6 w-1/2 bg-gray-300 dark:bg-gray-700 rounded-md mb-4"></div>
        <div className="flex-grow bg-gray-200 dark:bg-gray-800/50 rounded-lg mb-4"></div>
        <div className="flex gap-2">
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800/50 rounded-md"></div>
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800/50 rounded-md"></div>
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800/50 rounded-md"></div>
        </div>
    </div>
);


const OrderStatsSection: React.FC<OrderStatsSectionProps> = ({ data, period, includes, isLoading }) => {
    const { t } = useTranslation();
    const [isDarkMode, setThemeMode] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setThemeMode(mediaQuery.matches);
        const handler = (e: MediaQueryListEvent) => setThemeMode(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    const chartData = useMemo<ChartData<'line'>>(() => {
        if (!data || data.length === 0) return { labels: [], datasets: [] };

        const labels = data.map(item => item.date).sort();
        const datasets: any[] = [];
        //@ts-ignore
        const rawCurrency = (data[0])?.currency ?? 'cfa'; // Get currency from first item
        
        // Mapping des devises non-ISO vers codes ISO 4217 valides
        const normalizeCurrency = (currency: string): string => {
            const currencyMap: Record<string, string> = {
                'FCFA': 'XOF', // Franc CFA (Afrique de l'Ouest)
                'CFA': 'XOF',
                'cfa': 'XOF',
                'XAF': 'XAF', // Franc CFA (Afrique centrale) - déjà ISO
            };
            return currencyMap[currency.toUpperCase()] || currency.toUpperCase();
        };
        
        const currency = normalizeCurrency(rawCurrency);

        const addDataset = (key: keyof typeof datasetColors, dataKey: keyof OrderStatsResultItem) => {
            //@ts-ignore
            if (data.some(item => (item[dataKey] ?? 0) > 0)) {
                const colors = datasetColors[key];
                const color = isDarkMode ? colors.dark : colors.light;
                datasets.push({
                    label: t(colors.labelKey), data: data.map(item => item[dataKey] ?? 0),
                    borderColor: color, backgroundColor: `${color}33`, fill: true,
                    tension: 0.3, pointRadius: 3, pointHoverRadius: 6,
                    tooltip: { // Keep tooltip logic for currency formatting
                        callbacks: {
                            label: (context: any) => {
                                let label = context.dataset.label || '';
                                if (dataKey === 'total_price') {
                                    try {
                                        return `${label}: ${context.parsed.y.toLocaleString(t('common.locale'), { style: 'currency', currency, minimumFractionDigits: 0 })}`;
                                    } catch (error) {
                                        // Fallback si le code de devise n'est toujours pas valide
                                        return `${label}: ${context.parsed.y.toLocaleString(t('common.locale'))} ${rawCurrency}`;
                                    }
                                }
                                return `${label}: ${context.parsed.y.toLocaleString(t('common.locale'))}`;
                            }
                        }
                    }
                });
            }
        };

        addDataset('total_price', 'total_price');
        addDataset('orders_count', 'orders_count');
        addDataset('items_count', 'items_count');

        return { labels, datasets };
    }, [data, isDarkMode, t]);

    const legendItems = useMemo(() => chartData.datasets.map(ds => ({
        label: ds.label ?? 'N/A', color: ds.borderColor as string ?? '#ccc',
    })), [chartData]);

    const { actualStartDate, actualEndDate } = useMemo(() => {
        if (!data || data.length === 0) return { actualStartDate: undefined, actualEndDate: undefined };
        const dates = data.map(item => DateTime.fromISO(item.date)).filter(dt => dt.isValid);
        if (dates.length === 0) return { actualStartDate: undefined, actualEndDate: undefined };
        return { actualStartDate: DateTime.min(...dates), actualEndDate: DateTime.max(...dates) };
    }, [data]);

    const navigationDateRange = useMemo(() => ({
        min_date: actualStartDate?.startOf(period).toISO(),
        max_date: actualEndDate?.endOf(period).endOf('day').toISO(),
    }), [actualStartDate, actualEndDate, period]);

    const aggregatedDimensionData = useMemo(() => {
        const aggregation: Record<string, Record<string, number>> = {};
        if (!data) return aggregation;
        const dimensionsToCheck = Object.keys(includes).filter(key => includes[key as keyof typeof includes]);

        dimensionsToCheck.forEach(dimKey => {
            if (!data.some(item => item[dimKey as keyof OrderStatsResultItem])) return;
            aggregation[dimKey] = {};
            data.forEach(item => {
                const breakdown = item[dimKey as keyof typeof item];
                if (breakdown && typeof breakdown === 'object') {
                    Object.entries(breakdown).forEach(([subKey, count]) => {
                        if (typeof count === 'number') aggregation[dimKey][subKey] = (aggregation[dimKey][subKey] || 0) + count;
                    });
                }
            });
        });
        return aggregation;
    }, [data, includes]);

    const [selectedDimensionKey, setSelectedDimensionKey] = useState<string | null>(null);

    useEffect(() => {
        const availableKeys = Object.keys(aggregatedDimensionData);
        if (selectedDimensionKey && availableKeys.includes(selectedDimensionKey)) return;
        setSelectedDimensionKey(availableKeys.length > 0 ? availableKeys[0] : null);
    }, [aggregatedDimensionData, selectedDimensionKey]);

    const selectedDimensionData = selectedDimensionKey ? aggregatedDimensionData[selectedDimensionKey] : undefined;
    const selectedDimensionTitle = selectedDimensionKey ? orderDimensionLabels[selectedDimensionKey] : undefined;

    if (isLoading) return <OrderStatsSkeleton />;

    const noChartData = !chartData.datasets.some(ds => ds.data.some(v => (v as number) > 0));
    const noDimensionData = Object.keys(aggregatedDimensionData).length === 0 && Object.values(includes).some(v => v);

    return (
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-lg p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200/80 dark:border-white/10 h-full flex flex-col">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{t('stats.ordersTitle')}</h2>

            {noChartData ? (
                <div className="flex-grow flex items-center justify-center text-center text-gray-500 dark:text-gray-400 p-8">{t('stats.noOrderData')}</div>
            ) : (
                <>
                    <div className="flex flex-col">
                        <LineChart data={chartData} period={period} />
                        <ChartLegend items={legendItems} />
                    </div>

                    <div className="mt-6 border-t border-gray-200/80 dark:border-white/10 pt-4">
                        {noDimensionData ? (
                            <div className="text-center text-gray-500 dark:text-gray-400">{t('stats.noDetailedData')}</div>
                        ) : (
                            <>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {Object.keys(aggregatedDimensionData).map((dimKey) => (
                                        <button
                                            key={dimKey} onClick={() => setSelectedDimensionKey(dimKey)}
                                            className={`px-3 py-1 text-sm rounded-md transition-all border
                                                ${dimKey === selectedDimensionKey
                                                    ? 'bg-teal-500/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/20 shadow-sm'
                                                    : 'bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 border-gray-300/50 dark:border-gray-600/80 hover:bg-gray-200/70 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            {orderDimensionLabels[dimKey] || dimKey}
                                        </button>
                                    ))}
                                </div>

                                {selectedDimensionKey && selectedDimensionData && selectedDimensionTitle && (
                                    <DimensionBreakdown
                                        key={`order-breakdown-${selectedDimensionKey}`}
                                        title={selectedDimensionTitle}
                                        data={selectedDimensionData}
                                        period={period}
                                        navigationBaseUrl="/commands"
                                        filterParamName={selectedDimensionKey}
                                        dateRangeParams={navigationDateRange}
                                    />
                                )}
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default OrderStatsSection;