// components/Stats/VisitStatsSection.tsx
import React, { useMemo, useState, useEffect } from 'react';
// Assurez-vous que ces types/interfaces correspondent à ceux définis dans Interfaces.ts ou SublymsReactApi.ts
import { VisitStatsResponse, VisitStatsIncludeOptions, StatsPeriod, VisitStatsResultItem } from '../../Interfaces/Interfaces';
import LineChart from './LineChart'; // Importer le graphique modifié
import ChartLegend from './ChartLegend'; // Importer la légende custom
import DimensionBreakdown from './DimensionBreakdown'; // Le composant DimensionBreakdown
import { ChartData } from 'chart.js'; // Type pour les données de Chart.js
import { DateTime } from 'luxon'; // Pour le calcul de plage de dates et formatage

interface VisitStatsSectionProps {
    data: VisitStatsResponse | undefined;
    period: StatsPeriod;
    includes: VisitStatsIncludeOptions; // Les dimensions demandées par l'utilisateur (pour afficher tous les onglets potentiels)
    // Ajouter la plage de dates filtre du parent pour passer aux breakdowns si la plage calculée (actualDateRange) ne suffit pas
    // ex: filterStartDate: DateTime | undefined; filterEndDate: DateTime | undefined;
}

// Labels et couleurs prédéfinies pour les datasets Visites/Utilisateurs
const datasetColors = {
    visits: { label: 'Visites', color: '#3b82f6' }, // bleu-500 Tailwind approx
    users_count: { label: 'Visiteurs Uniques', color: '#10b981' }, // vert-500 Tailwind approx
};

// Mapping des clés de dimension API aux labels d'affichage conviviaux
// Utiliser ici les clés EXACTES retournées par l'API pour la data
const dimensionLabels: Record<keyof VisitStatsIncludeOptions | string, string> = { // Ajoutez 'string' pour couvrir d'éventuels autres champs, ou raffinez
    browser: 'Navigateur',
    os: 'Système d\'exploitation',
    device: 'Appareil',
    landing_page: 'Page de destination', // Confirmed backend uses 'landing_page'
    referrer: 'Referrer',
};


const VisitStatsSection: React.FC<VisitStatsSectionProps> = ({ data, period, includes /*, filterStartDate, filterEndDate */ }) => {

     // Prépare les données du graphique de tendance (Visites/Utilisateurs Uniques)
    const chartData = useMemo<ChartData<'line'>>(() => {
        // ... (logique chartData identique à la version précédente) ...
         if (!data || data.length === 0) {
             return { labels: [], datasets: [] };
         }

         const labels = data.map(item => item.date).sort();
         const datasets = [];
         if (data.some(item => (item.visits || 0) > 0)) { // Check for presence of non-zero visits
             datasets.push({
                 label: datasetColors.visits.label,
                 data: data.map(item => item.visits || 0), // Ensure number fallback
                 borderColor: datasetColors.visits.color,
                 backgroundColor: `${datasetColors.visits.color}33`,
                 fill: true, tension: 0.3, pointRadius: 3, pointHoverRadius: 6,
             });
         }
         if (data.some(item => (item.users_count || 0) > 0)) { // Check for presence of non-zero users_count
             datasets.push({
                 label: datasetColors.users_count.label,
                 data: data.map(item => item.users_count || 0), // Ensure number fallback
                 borderColor: datasetColors.users_count.color,
                 backgroundColor: `${datasetColors.users_count.color}33`,
                 fill: true, tension: 0.3, pointRadius: 3, pointHoverRadius: 6,
             });
         }

         return { labels, datasets, };
     }, [data]);

     // Prépare les items pour la légende custom du graphique principal
    const legendItems = useMemo(() => {
         return chartData.datasets.map(ds => ({
             label: ds.label || 'N/A',
             color: ds.borderColor as string || '#ccc',
         }));
     }, [chartData]);

    // Calcule les dates de début et fin RÉELLES couvertes par les données de VISITES
    const actualDateRange = useMemo(() => {
         // ... (logique actualDateRange identique à la version précédente) ...
         // Assurez-vous que cette logique parse correctement 'YYYY-MM-DD', 'YYYY-MM', 'YYYY-WW'
        if (!data || data.length === 0) return { actualStartDate: undefined, actualEndDate: undefined };

         const dates = data.map(item => {
              // Handle date parsing logic based on item.date format
               try {
                    if (period === 'month') {
                       // Try YYYY-WW format first if applicable from backend
                       if (item.date.length === 7 && item.date.includes('-')) {
                           const [yearStr, weekStr] = item.date.split('-');
                            const year = parseInt(yearStr, 10);
                            const week = parseInt(weekStr, 10);
                            // Luxon parsing for ISO Week Date (requires weekYear)
                            const dtWeek = DateTime.fromObject({ weekYear: year, weekNumber: week, weekday: 1 }); // Start of ISO week (Monday)
                             if(dtWeek.isValid) return dtWeek;
                             // Fallback to Month parsing if not a valid ISO Week
                            const dtMonth = DateTime.fromFormat(item.date, 'yyyy-MM'); // Parse YYYY-MM
                            if(dtMonth.isValid) return dtMonth;

                        }
                    }
                     // Try YYYY-MM-DD or generic ISO parsing
                    const dt = DateTime.fromISO(item.date);
                    if(dt.isValid) return dt;

                     console.warn(`VisitStatsSection: Could not parse date string "${item.date}" for period "${period}"`);
                    return DateTime.invalid('Unparsable'); // Indicate parsing failed
                } catch (e) {
                    console.error(`VisitStatsSection: Error parsing date string "${item.date}" for period "${period}": ${e}`);
                    return DateTime.invalid('Error during parsing'); // Indicate parsing error
                }
           }).filter(dt => dt.isValid);


         if (dates.length === 0) return { actualStartDate: undefined, actualEndDate: undefined };

         const actualStartDate = DateTime.min(...dates);
         const actualEndDate = DateTime.max(...dates);

         return {
              actualStartDate: actualStartDate ? actualStartDate.startOf(period) : undefined, // Start of period of earliest date
             actualEndDate: actualEndDate ? actualEndDate.endOf(period).endOf('day') : undefined // End of period of latest date, end of day
         };

     }, [data, period]);

     // Range for navigation - use filter range if available, fallback to actual data range
     const navigationDateRange = useMemo(() => {
         // This logic assumes parent component passes filter dates OR uses actual data dates
         // For now, use actual data range calculated above. Adapt if parent filters are better.
          return {
             min_date: actualDateRange.actualStartDate?.toISO(),
             max_date: actualDateRange.actualEndDate?.toISO(),
          };
     }, [actualDateRange]); // Uses the calculated date range

     // Agréger les données de dimension sur toute la période reçue
      const aggregatedDimensionData = useMemo(() => {
         // ... (logique aggregatedDimensionData identique à la version précédente) ...
           const aggregation: Record<string, Record<string, number>> = {};

           if (!data || data.length === 0) return aggregation;

          // Iterate over dimensions that are requested via 'includes' props
           // AND might be present in data structure based on dimensionLabels
           const dimensionsToCheck = Object.keys(includes).filter(key => {
               // Only process dimensions that are TRUE in 'includes' AND have a defined label/mapping
               return includes[key as keyof VisitStatsIncludeOptions] === true && dimensionLabels[key] !== undefined;
            }) as (keyof VisitStatsIncludeOptions)[];


           dimensionsToCheck.forEach(dimKey => {
               // Note: dimKey is the *frontend* type key (ex: 'browser', 'pageUrl'), but data key might be different ('landing_page')
               // Need a map here if keys differ. Assume dimensionLabels keys ARE the data keys for now, except for known pageUrl->landing_page.
               // Let's map specifically pageUrl (UI type) to landing_page (Data Key) if pageUrl is included
               const dataKey =   dimKey;

               // Check if this dataKey exists in any data item before creating an entry
               const isDataKeyPresent = data.some(item => item[dataKey as keyof VisitStatsResultItem] !== undefined);
               if (!isDataKeyPresent) return; // Skip this dimension if its data key is not in results

               aggregation[dataKey] = {}; // Aggregate using the Data Key


               data.forEach(item => {
                   const dimensionBreakdown = item[dataKey as keyof VisitStatsResultItem];

                   if (dimensionBreakdown && typeof dimensionBreakdown === 'object') {
                       Object.entries(dimensionBreakdown).forEach(([subKey, count]) => {
                           if (typeof count === 'number') { // Ensure count is a number
                                aggregation[dataKey][subKey] = (aggregation[dataKey][subKey] || 0) + count;
                           }
                       });
                   }
               });

                // Post-aggregation cleanup: Remove subKeys with 0 count if desired, or remove main key if total count is 0
                 // const totalAggregated = Object.values(aggregation[dataKey]).reduce((sum, count) => sum + count, 0);
                 // if (totalAggregated === 0) {
                 //      delete aggregation[dataKey];
                 // }

           });

           // Return aggregation indexed by Data Key ('browser', 'landing_page', etc.)
           return aggregation;

     }, [data, includes /*, dimensionLabels, possible mapping needed */ ]);


     // État local pour suivre la dimension de breakdown sélectionnée
     const [selectedDimensionKey, setSelectedDimensionKey] = useState<string | null>(null);

     // Met à jour la dimension sélectionnée quand les données ou les dimensions incluses changent
     // Initialise ou reset la sélection si l'ancienne clé n'est plus disponible
     useEffect(() => {
        const availableDimensionKeys = Object.keys(aggregatedDimensionData);
         // Si une dimension est déjà sélectionnée et est toujours disponible, ne rien faire
         if (selectedDimensionKey && availableDimensionKeys.includes(selectedDimensionKey)) {
             return;
         }
        // Si la dimension sélectionnée n'est plus disponible, ou si rien n'est sélectionné
         // Sélectionner la première dimension disponible si il y en a
         if (availableDimensionKeys.length > 0) {
             setSelectedDimensionKey(availableDimensionKeys[0]);
         } else {
             // Aucune dimension disponible ou incluse
             setSelectedDimensionKey(null);
         }
         // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [aggregatedDimensionData]); // Re-run quand les données agrégées changent


     // Data et titre pour la dimension sélectionnée
     const selectedDimensionData = selectedDimensionKey ? aggregatedDimensionData[selectedDimensionKey] : undefined;
     const selectedDimensionTitle = selectedDimensionKey ? dimensionLabels[selectedDimensionKey] : undefined;
     // Map filter param name: UI type 'pageUrl' maps to backend 'landing_page' param name if selectedDimensionKey is landing_page.
      // DimensionBreakdown needs the *filter param name* to build URL, which should match the backend key
     const selectedFilterParamName = selectedDimensionKey || undefined; // Use the DataKey directly as filter param name


    // Indicateur de données manquantes pour le graphique principal
    //@ts-ignore
    const noChartData = (!data || data.length === 0) && !chartData.datasets.some(ds => ds.data.some(v => v > 0));
    
    // Indicateur si des breakdowns sont demandés mais aucune donnée de dimension disponible/agrégée
    //@ts-ignore
    const noDimensionData = !Object.keys(aggregatedDimensionData).length > 0 && Object.keys(includes).some(key => includes[key as keyof VisitStatsIncludeOptions]); // Some dimension requested but none present in data/aggregated

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
            {/* Titre */}
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Statistiques de Visites</h2>

            {/* Graphique de tendance et Légende */}
             {noChartData ? (
                 <div className="text-center text-gray-500 p-8">Aucune donnée de visite pour la période sélectionnée ou filtrée.</div>
            ) : (
                <div className="flex flex-col">
                    <LineChart data={chartData} period={period} />
                    <ChartLegend items={legendItems} />
                </div>
            )}

             {/* Section des breakdowns de dimension */}
             { !noChartData && ( // Afficher la section breakdowns seulement s'il y a des données de tendance
                <div className="mt-6"> {/* Espacement entre le graphique et les breakdowns */}

                     {noDimensionData ? (
                         // Message si des dimensions étaient demandées mais aucune donnée trouvée
                         <div className="text-center text-gray-500">Aucune donnée détaillée (navigateur, OS, etc.) pour la période sélectionnée ou filtrée.</div>
                     ) : (
                        <>
                            {/* Onglets de sélection de dimension (style Bento) */}
                             <div className="flex flex-wrap gap-2 mb-4"> {/* flex-wrap pour les petites résolutions, gap pour l'espacement, mb pour séparer du contenu */}
                                 {Object.keys(aggregatedDimensionData).map((dimKey) => { // Itère sur les clés REELLEMENT agrégées
                                     // Utilise le label convivial, fallback à la clé si non trouvé
                                     const label = dimensionLabels[dimKey] || dimKey;
                                     const isSelected = dimKey === selectedDimensionKey;
                                     return (
                                         <button
                                              type="button" // Assurer que ce sont des boutons si utilisés dans un formulaire
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
                                 // Rendre le DimensionBreakdown uniquement si une dimension est sélectionnée et a des données agrégées
                                 <DimensionBreakdown
                                     key={`visit-breakdown-${selectedDimensionKey}`} // Clé unique pour React
                                     title={selectedDimensionTitle}
                                     data={selectedDimensionData}
                                     period={period}
                                     navigationBaseUrl="/users/visites" // URL base pour naviguer vers les listes de visites
                                      // Le nom du paramètre dans l'URL correspond à la clé Data/Backend ('browser', 'landing_page', etc.)
                                     filterParamName={selectedFilterParamName || 'dimension'} // Default 'dimension' if something goes wrong, but should be key
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

export default VisitStatsSection;