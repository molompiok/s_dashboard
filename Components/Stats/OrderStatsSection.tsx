// components/Stats/OrderStatsSection.tsx
import React, { useMemo, useState, useEffect } from 'react';
// Assurez-vous que les types sont importés correctement depuis votre source
import { OrderStatsResponse, OrderStatsIncludeOptions, StatsPeriod, OrderStatsResultItem } from '../../api/Interfaces/Interfaces';
import LineChart from './LineChart'; // Importer le graphique modifié
import ChartLegend from './ChartLegend'; // Importer la légende custom
import DimensionBreakdown from './DimensionBreakdown'; // Le composant DimensionBreakdown
import { ChartData } from 'chart.js'; // Type pour les données de Chart.js
import { DateTime } from 'luxon'; // Pour le calcul de plage de dates et formatage

interface OrderStatsSectionProps {
    data: OrderStatsResponse | undefined;
    period: StatsPeriod;
    includes: OrderStatsIncludeOptions; // Les dimensions demandées
    // ex: filterStartDate: DateTime | undefined; filterEndDate: DateTime | undefined;
}

// Labels et couleurs prédéfinies pour les datasets Commandes/CA/Articles
const datasetColors = {
    orders_count: { label: 'Commandes', color: '#4f46e5' }, // indigo-600
    total_price: { label: 'Chiffre d\'affaires', color: '#059669' }, // emerald-600
    items_count: { label: 'Articles vendus', color: '#fcd34d' }, // amber-300
};


// Mapping des clés de dimension API aux labels d'affichage conviviaux pour les COMMANDES
const orderDimensionLabels: Record<keyof OrderStatsIncludeOptions | string, string> = { // Use string index for robustness
    status: 'Statut de la commande',
    payment_status: 'Statut du paiement',
    payment_method: 'Méthode de paiement',
    with_delivery: 'Avec livraison', // Data keys will be 'true' or 'false'
};


const OrderStatsSection: React.FC<OrderStatsSectionProps> = ({ data, period, includes /*, filterStartDate, filterEndDate */ }) => {

    // Prépare les données du graphique de tendance (Commandes/CA/Articles)
    const chartData = useMemo<ChartData<'line'>>(() => {
        // ... (logique chartData identique à la version précédente, sans yAxisID) ...
        if (!data || data.length === 0) {
            return { labels: [], datasets: [] };
        }

        const labels = data.map(item => item.date).sort();
        const datasets = [];

        const createTooltipLabel = (label: string, value: number, key: 'orders_count' | 'total_price' | 'items_count' /*, currency?: string*/) => {
            let formattedValue = value.toLocaleString(undefined, { maximumFractionDigits: key === 'total_price' ? 2 : 0 });
            // const currencySymbol = key === 'total_price' ? currency || '' : ''; // Get currency symbol if available
            return `${label}: ${formattedValue}`; // ${currencySymbol}`;
        };
        // NOTE: Le tooltip ne gère pas la devise via un simple callback `label`. Pour une devise formatée dans le tooltip, il faudrait:
        // 1. Récupérer la devise (ex: from store config or data item)
        // 2. Passez-la en paramètre au composant LineChart.
        // 3. Modifier LineChart pour que son tooltip callback pour l'axe Y (s'il y en a un) formate en devise SI le dataset correspondant est le revenu.
        // OU faire des callbacks de tooltip SPÉCIFIQUES à CHAQUE dataset dans OrderStatsSection comme dans l'ancienne version.
        // Laissez les callbacks spécifiques à chaque dataset ici pour être explicite.
        const currency = 'cfa'; // Get currency from first item (or store config)

        if (data.some(item => (item.orders_count || 0) > 0)) {
            datasets.push({
                label: datasetColors.orders_count.label,
                data: data.map(item => item.orders_count || 0),
                borderColor: datasetColors.orders_count.color,
                backgroundColor: `${datasetColors.orders_count.color}33`,
                fill: true, tension: 0.3, pointRadius: 3, pointHoverRadius: 6,
                tooltip: { callbacks: { label: (context: any) => createTooltipLabel(context.dataset.label || '', context.parsed.y, 'orders_count') } }
            });
        }
        if (data.some(item => (item.total_price || 0) > 0)) {
            datasets.push({
                label: datasetColors.total_price.label,
                data: data.map(item => item.total_price || 0),
                borderColor: datasetColors.total_price.color,
                backgroundColor: `${datasetColors.total_price.color}33`,
                fill: true, tension: 0.3, pointRadius: 3, pointHoverRadius: 6,
                tooltip: { callbacks: { label: (context: any) => `${context.dataset.label || ''}: ${context.parsed.y.toLocaleString(undefined, { style: 'currency', currency: currency || 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 })}` } } // Format currency directly here
            });
        }
        if (data.some(item => (item.items_count || 0) > 0)) {
            datasets.push({
                label: datasetColors.items_count.label,
                data: data.map(item => item.items_count || 0),
                borderColor: datasetColors.items_count.color,
                backgroundColor: `${datasetColors.items_count.color}33`,
                fill: true, tension: 0.3, pointRadius: 3, pointHoverRadius: 6,
                tooltip: { callbacks: { label: (context: any) => createTooltipLabel(context.dataset.label || '', context.parsed.y, 'items_count') } }
            });
        }
        // Return delivery price?

        return { labels, datasets };
    }, [data]);


    // Prépare les items pour la légende custom du graphique principal (commandes)
    const legendItems = useMemo(() => {
        return chartData.datasets.map(ds => ({
            label: ds.label || 'N/A',
            color: ds.borderColor as string || '#ccc',
        }));
    }, [chartData]);

    // Calcule les dates de début et fin RÉELLES couvertes par les données de COMMANDES
    const actualDateRange = useMemo(() => {
        // ... (logique actualDateRange identique à la version visites) ...
        if (!data || data.length === 0) return { actualStartDate: undefined, actualEndDate: undefined };

        const dates = data.map(item => {
            try {
                if (period === 'month') {
                    if (item.date.length === 7 && item.date.includes('-')) {
                        const [yearStr, numStr] = item.date.split('-');
                        const year = parseInt(yearStr, 10);
                        const num = parseInt(numStr, 10);

                        if (item.date.length === 7 && numStr.length === 2 && period === 'month') { // Could be YYYY-MM or YYYY-WW
                            // Assume YYYY-WW from backend if month aggregation is weeks? Check StatsUtils logic.
                            const dtWeek = DateTime.fromObject({ weekYear: year, weekNumber: num, weekday: 1 });
                            if (dtWeek.isValid) return dtWeek;
                            // If not valid ISO Week, try YYYY-MM
                            const dtMonth = DateTime.fromFormat(item.date, 'yyyy-MM');
                            if (dtMonth.isValid) return dtMonth;
                        }
                    }
                    // Try YYYY-MM-DD or generic ISO parsing
                    const dt = DateTime.fromISO(item.date);
                    if (dt.isValid) return dt;

                    console.warn(`OrderStatsSection: Could not parse date string "${item.date}" for period "${period}"`);
                    return DateTime.invalid('Unparsable');
                }
            } catch (e) {
                console.error(`OrderStatsSection: Error parsing date string "${item.date}" for period "${period}": ${e}`);
                return DateTime.invalid('Error during parsing');
            }
        }).filter(dt => !!dt?.isValid);

        if (dates.length === 0) return { actualStartDate: undefined, actualEndDate: undefined };

        const actualStartDate = DateTime.min(...dates);
        const actualEndDate = DateTime.max(...dates);

        return {
            actualStartDate: actualStartDate ? actualStartDate.startOf(period) : undefined,
            actualEndDate: actualEndDate ? actualEndDate.endOf(period).endOf('day') : undefined
        };
    }, [data, period]);

    // Range for navigation (uses actual data range for now)
    const navigationDateRange = useMemo(() => {
        return {
            min_date: actualDateRange.actualStartDate?.toISO(),
            max_date: actualDateRange.actualEndDate?.toISO(),
        };
    }, [actualDateRange]);

    // Agréger les données de dimension sur toute la période reçue (commandes)
    const aggregatedDimensionData = useMemo(() => {
        // ... (logique aggregatedDimensionData identique à la version précédente) ...
        const aggregation: Record<string, Record<string, number>> = {};

        if (!data || data.length === 0) return aggregation;

        // Iterate over dimensions requested via 'includes' props
        const dimensionsToCheck = Object.keys(includes).filter(key => {
            return includes[key as keyof OrderStatsIncludeOptions] === true && orderDimensionLabels[key] !== undefined;
        }) as (keyof OrderStatsIncludeOptions)[];

        dimensionsToCheck.forEach(dimKey => {
            // dimKey IS the data key and also the intended filter param name
            const dataKey = dimKey; // For orders, the key name seems consistent

            // Check if this dataKey exists in any data item and is an object (breakdown structure)
            const isDataKeyPresentAndValid = data.some(item =>
                item[dataKey as keyof OrderStatsResultItem] !== undefined && typeof item[dataKey as keyof OrderStatsResultItem] === 'object' && item[dataKey as keyof OrderStatsResultItem] !== null
            );

            if (!isDataKeyPresentAndValid) return; // Skip this dimension if no valid data is found

            aggregation[dataKey] = {};

            data.forEach(item => {
                const dimensionBreakdown = item[dataKey as keyof OrderStatsResultItem];

                if (dimensionBreakdown && typeof dimensionBreakdown === 'object') { // Ensure it's a valid object
                    Object.entries(dimensionBreakdown).forEach(([subKey, count]) => {
                        if (typeof count === 'number') {
                            aggregation[dataKey][subKey] = (aggregation[dataKey][subKey] || 0) + count;
                        }
                    });
                }
            });
        });

        // Return aggregation indexed by Data Key ('status', 'payment_method', etc.)
        return aggregation;
    }, [data, includes /*, orderDimensionLabels */]);

    // État local pour suivre la dimension de breakdown sélectionnée (commandes)
    const [selectedDimensionKey, setSelectedDimensionKey] = useState<string | null>(null);

    // Met à jour la dimension sélectionnée quand les données ou les dimensions incluses changent
    useEffect(() => {
        const availableDimensionKeys = Object.keys(aggregatedDimensionData);
        if (selectedDimensionKey && availableDimensionKeys.includes(selectedDimensionKey)) {
            return;
        }
        if (availableDimensionKeys.length > 0) {
            setSelectedDimensionKey(availableDimensionKeys[0]);
        } else {
            setSelectedDimensionKey(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [aggregatedDimensionData]);


    // Data et titre pour la dimension sélectionnée (commandes)
    const selectedDimensionData = selectedDimensionKey ? aggregatedDimensionData[selectedDimensionKey] : undefined;
    const selectedDimensionTitle = selectedDimensionKey ? orderDimensionLabels[selectedDimensionKey] : undefined;
    // Filter param name for navigation - uses the DataKey directly for orders
    const selectedFilterParamName = selectedDimensionKey || undefined;


    // Indicateur de données manquantes pour le graphique principal
    const noChartData = (!data || data.length === 0) && !chartData.datasets.some(ds => ds.data.some(v => v !== 0));

    // Indicateur si des breakdowns sont demandés mais aucune donnée de dimension disponible/agrégée
    //@ts-ignore
    const noDimensionData = !Object.keys(aggregatedDimensionData).length > 0 && Object.keys(includes).some(key => includes[key as keyof OrderStatsIncludeOptions]);


    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
            {/* Titre */}
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Statistiques de Commandes</h2>

            {/* Graphique de tendance et Légende */}
            {noChartData ? (
                <div className="text-center text-gray-500 p-8">Aucune donnée de commande pour la période sélectionnée ou filtrée.</div>
            ) : (
                <div className="flex flex-col">
                    {/* Pas de multi-axe Y pour la lisibilité */}
                    <LineChart data={chartData} period={period} />
                    <ChartLegend items={legendItems} />
                </div>
            )}


            {/* Section des breakdowns de dimension (Commandes) */}
            {!noChartData && ( // Afficher la section breakdowns seulement s'il y a des données de tendance
                <div className="mt-6">

                    {noDimensionData ? (
                        // Message si des dimensions étaient demandées mais aucune donnée trouvée
                        <div className="text-center text-gray-500">Aucune donnée détaillée (statuts, paiements, etc.) pour la période sélectionnée ou filtrée.</div>
                    ) : (
                        <>
                            {/* Onglets de sélection de dimension (style Bento) */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {Object.keys(aggregatedDimensionData).map((dimKey) => { // Itère sur les clés REELLEMENT agrégées
                                    const label = orderDimensionLabels[dimKey] || dimKey;
                                    const isSelected = dimKey === selectedDimensionKey;
                                    return (
                                        <button
                                            type="button"
                                            key={dimKey}
                                            onClick={() => setSelectedDimensionKey(dimKey)}
                                            className={`px-3 py-1 text-sm rounded-md transition border
                                                  ${isSelected
                                                    ? 'bg-blue-500 text-white border-blue-600 shadow-sm'
                                                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Conteneur pour la DimensionBreakdown sélectionnée */}
                            {selectedDimensionKey && selectedDimensionData && selectedDimensionTitle && (
                                <DimensionBreakdown
                                    key={`order-breakdown-${selectedDimensionKey}`} // Clé unique
                                    title={selectedDimensionTitle}
                                    data={selectedDimensionData}
                                    period={period}
                                    navigationBaseUrl="/commands" // URL base pour naviguer vers les listes de commandes
                                    filterParamName={selectedFilterParamName || 'dimension'} // Use the DataKey as filter param name
                                    dateRangeParams={navigationDateRange} // Plage de dates pour la navigation
                                />
                            )}

                            {!selectedDimensionKey && Object.keys(aggregatedDimensionData).length > 0 && (
                                // Message si des données de dimension existent mais qu'aucune n'est encore sélectionnée
                                <div className="text-center text-gray-500">Sélectionnez une dimension ci-dessus pour afficher les détails.</div>
                            )}
                        </>
                    )}
                </div>
            )}

        </div>
    );
};

export default OrderStatsSection;