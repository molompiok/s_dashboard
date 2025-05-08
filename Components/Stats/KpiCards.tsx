// components/Stats/KpiCards.tsx
import React from 'react';
// Importez les icônes nécessaires de Lucide React
import { DollarSign, ShoppingCart, Eye, Users, Percent, PackageOpen /*, autres si besoin */ } from 'lucide-react';
import { KpiStatsResponse } from '../../Interfaces/Interfaces'; // Ajustez le chemin si nécessaire
import { useTranslation } from 'react-i18next'; // i18n

interface KpiCardsProps {
    kpis: KpiStatsResponse | undefined; // KPI data from the API
}

// Define the structure for each KPI card's configuration
interface KpiConfig {
    key: keyof KpiStatsResponse; // Key in the kpis data object
    labelKey: string; // i18n key for the display label
    icon: React.ElementType; // The Lucide icon component
    iconColorClass: string; // Tailwind class for icon color (e.g., 'text-blue-500')
    bgColorClass: string; // Tailwind class for subtle background/border color (e.g., 'bg-blue-50')
    format: 'number' | 'currency' | 'percentage'; // Formatting type
    decimals?: number; // Number of decimals for number/percentage format
}

// Array defining each KPI and its configuration
const kpisConfig: KpiConfig[] = [
    {
        key: 'totalRevenue',
        labelKey: 'stats.kpi.totalRevenue',
        icon: DollarSign,
        iconColorClass: 'text-emerald-600',
        bgColorClass: 'bg-emerald-50 border-emerald-200',
        format: 'currency'
    },
    {
        key: 'totalOrders',
        labelKey: 'stats.kpi.totalOrders',
        icon: ShoppingCart,
        iconColorClass: 'text-indigo-600',
        bgColorClass: 'bg-indigo-50 border-indigo-200',
        format: 'number'
    },
    //  {
    //      key: 'itemsCount', // NOTE: 'itemsCount' is not in KpiStatsResponse yet.
    //                      // If backend provides this KPI, add it to KpiStatsResponse type.
    //                      // Otherwise, remove or use a placeholder if it's computed from order details data (complex).
    //                      // Let's remove this one for now as it's not in KpiStatsResponse provided.
    //                      // If you add an API endpoint for total items count in KPIs, put it back.
    //                      // Let's add a placeholder for now just for the example structure:
    //     // key: 'itemsCount', // Assuming you might add this
    //     // labelKey: 'stats.kpi.itemsCount',
    //     // icon: PackageOpen,
    //     // iconColorClass: 'text-amber-600',
    //     // bgColorClass: 'bg-amber-50 border-amber-200',
    //     // format: 'number'
    // },
    {
        key: 'totalVisits',
        labelKey: 'stats.kpi.totalVisits',
        icon: Eye, // Icon for visits
        iconColorClass: 'text-blue-600',
        bgColorClass: 'bg-blue-50 border-blue-200',
        format: 'number'
    },
    {
        key: 'uniqueVisitors',
        labelKey: 'stats.kpi.uniqueVisitors',
        icon: Users, // Icon for unique users
        iconColorClass: 'text-cyan-600',
        bgColorClass: 'bg-cyan-50 border-cyan-200',
        format: 'number'
    },
    {
        key: 'conversionRate',
        labelKey: 'stats.kpi.conversionRate',
        icon: Percent, // Icon for percentage/conversion
        iconColorClass: 'text-fuchsia-600', // Example color
        bgColorClass: 'bg-fuchsia-50 border-fuchsia-200',
        format: 'percentage',
        decimals: 2 // Percentage needs decimals
    },
     {
         key: 'averageOrderValue',
         labelKey: 'stats.kpi.averageOrderValue',
         icon: DollarSign, // Same as Revenue, or another icon
         iconColorClass: 'text-teal-600',
         bgColorClass: 'bg-teal-50 border-teal-200',
         format: 'currency'
     },
    // Add more KPIs as needed here following the same structure
];


const KpiCards: React.FC<KpiCardsProps> = ({ kpis }) => {
    const { t } = useTranslation(); // i18n

    // Helper function to format the value based on config type
    const formatValue = (value: number | undefined | null, format: 'number' | 'currency' | 'percentage', decimals: number = 0): string => {
        if (value === undefined || value === null) return '-'; // Show dash for missing data

        try {
            if (format === 'currency') {
                // Use locale for currency formatting
                return value.toLocaleString(t('common.locale'), { // Using i18n locale
                    style: 'currency',
                    currency: 'EUR', // TODO: Get actual currency from store/user config
                    minimumFractionDigits: 0, // Avoid decimals for whole Euros/FCFA by default
                    maximumFractionDigits: 2, // Allow decimals up to 2 if they exist
                });
            } else if (format === 'percentage') {
                // Format number and append %
                 return value.toLocaleString(t('common.locale'), {
                     minimumFractionDigits: decimals,
                     maximumFractionDigits: decimals,
                 }) + '%';
            } else { // 'number'
                 // Format number with separators
                 return value.toLocaleString(t('common.locale'), {
                      minimumFractionDigits: decimals,
                      maximumFractionDigits: decimals,
                 });
            }
        } catch (e) {
            console.error("Error formatting KPI value", value, format, e);
            return String(value); // Fallback to raw value
        }
    };


    return (
        // Grid layout for KPI cards
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-6">
            {kpisConfig.map(kpi => {
                // Get the value from the data, default to undefined/null if data is loading or key doesn't exist
                const value = kpis?.[kpi.key as keyof KpiStatsResponse];

                return (
                    // Card Container - applies soft background/border and shadow
                    <div
                         key={kpi.key} // Unique key for list item
                        className={`kpi-card flex flex-col p-4 rounded-lg border ${kpi.bgColorClass} shadow-sm transition hover:shadow-md`} // Added border & shadow transition
                    >
                       
                        {/* Label and Value */}
                        <div className="flex items-center">
                             {/* Icon Container */}
                        <div className={`flex-shrink-0 p-2 mr-4 rounded-full ${kpi.iconColorClass} bg-white bg-opacity-75`}> {/* Icon with contrasting background */}
                             {/* Render Lucide Icon component */}
                            <kpi.icon className="w-6 h-6" strokeWidth={1.8} /> {/* Adjusted stroke width for lighter look */}
                        </div>

                            {/* Label */}
                            <div className="text-sm font-medium text-gray-700">{t(kpi.labelKey)}</div>
                            {/* Value */}
                            
                        </div>
                        <div className="text-xl font-bold text-gray-800 mt-0.5">
                                 {formatValue(value as number, kpi.format, kpi.decimals)}
                             </div>
                    </div>
                );
            })}
        </div>
    );
};

export default KpiCards;