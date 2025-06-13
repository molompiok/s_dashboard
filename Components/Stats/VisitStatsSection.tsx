// components/Stats/VisitStatsSection.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { VisitStatsResponse, VisitStatsIncludeOptions, StatsPeriod, VisitStatsResultItem } from '../../api/Interfaces/Interfaces';
import LineChart from './LineChart';
import ChartLegend from './ChartLegend';
import DimensionBreakdown from './DimensionBreakdown';
import { ChartData } from 'chart.js';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';

interface VisitStatsSectionProps {
    data: VisitStatsResponse | undefined;
    period: StatsPeriod;
    includes: VisitStatsIncludeOptions;
    isLoading: boolean; // 🎨 Added to handle loading state
}

// 🎨 Updated dataset colors for `teal` theme and dark mode
const datasetColors = {
    visits: { labelKey: 'stats.visits', light: '#0d9488', dark: '#2dd4bf' }, // teal-600, teal-400
    users_count: { labelKey: 'stats.uniqueVisitors', light: '#4f46e5', dark: '#818cf8' }, // indigo-600, indigo-400
};

const dimensionLabels: Record<keyof VisitStatsIncludeOptions | string, string> = {
    browser: 'Navigateur', os: 'Système d\'exploitation', device: 'Appareil',
    landing_page: 'Page de destination', referrer: 'Referrer',
};

// 🎨 Skeleton Component
const VisitStatsSkeleton: React.FC = () => (
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


const VisitStatsSection: React.FC<VisitStatsSectionProps> = ({ data, period, includes, isLoading }) => {
    const { t } = useTranslation();
    const [isDarkMode, setIsDarkMode] = useState(false); // State to track dark mode

    useEffect(() => {
        // Check for dark mode on mount and when it changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setIsDarkMode(mediaQuery.matches);
        const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    const chartData = useMemo<ChartData<'line'>>(() => {
        if (!data || data.length === 0) return { labels: [], datasets: [] };
        
        const labels = data.map(item => item.date).sort();
        const datasets = [];

        if (data.some(item => (item.visits ?? 0) > 0)) {
            const colors = datasetColors.visits;
            const color = isDarkMode ? colors.dark : colors.light;
            datasets.push({
                label: t(colors.labelKey), data: data.map(item => item.visits ?? 0),
                borderColor: color, backgroundColor: `${color}33`,
                fill: true, tension: 0.3, pointRadius: 3, pointHoverRadius: 6,
            });
        }
        if (data.some(item => (item.users_count ?? 0) > 0)) {
            const colors = datasetColors.users_count;
            const color = isDarkMode ? colors.dark : colors.light;
            datasets.push({
                label: t(colors.labelKey), data: data.map(item => item.users_count ?? 0),
                borderColor: color, backgroundColor: `${color}33`,
                fill: true, tension: 0.3, pointRadius: 3, pointHoverRadius: 6,
            });
        }
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
            if (!data.some(item => item[dimKey as keyof VisitStatsResultItem])) return;
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
    const selectedDimensionTitle = selectedDimensionKey ? dimensionLabels[selectedDimensionKey] : undefined;

    // 🎨 Use skeleton on loading
    if (isLoading) return <VisitStatsSkeleton />;

    const noChartData = !chartData.datasets.some(ds => ds.data.some(v => (v as number) > 0));
    const noDimensionData = Object.keys(aggregatedDimensionData).length === 0 && Object.values(includes).some(v => v);

    return (
        // 🎨 Main container with glassmorphism for dark mode
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-lg p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200/80 dark:border-white/10 h-full flex flex-col">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{t('stats.visitsTitle')}</h2>

            {noChartData ? (
                <div className="flex-grow flex items-center justify-center text-center text-gray-500 dark:text-gray-400 p-8">{t('stats.noVisitData')}</div>
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
                                {/* 🎨 Redesigned tabs */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {Object.keys(aggregatedDimensionData).map((dimKey) => {
                                        const label = dimensionLabels[dimKey] || dimKey;
                                        const isSelected = dimKey === selectedDimensionKey;
                                        return (
                                            <button
                                                key={dimKey} onClick={() => setSelectedDimensionKey(dimKey)}
                                                className={`px-3 py-1 text-sm rounded-md transition-all border
                                                    ${isSelected
                                                        ? 'bg-teal-500/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/20 shadow-sm'
                                                        : 'bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 border-gray-300/50 dark:border-gray-600/80 hover:bg-gray-200/70 dark:hover:bg-gray-700'
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {selectedDimensionKey && selectedDimensionData && selectedDimensionTitle && (
                                    <DimensionBreakdown
                                        key={`visit-breakdown-${selectedDimensionKey}`}
                                        title={selectedDimensionTitle}
                                        data={selectedDimensionData}
                                        period={period}
                                        navigationBaseUrl="/users/visites"
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

export default VisitStatsSection;