// components/Stats/DimensionBreakdown.tsx
import React, { useMemo, useState } from 'react';
// Importez PieChart.tsx que j'ai fourni précédemment
import PieChart from './PieChart';
// Assurez-vous que StatsPeriod et les types de date sont importés correctement
import { StatsPeriod } from '../../api/Interfaces/Interfaces';
import { ChartData } from 'chart.js'; // Pour typer les données du Pie Chart
import ChartLegend from './ChartLegend';
import { useMyLocation } from '../../Hooks/useRepalceState';

interface DimensionBreakdownProps {
    title: string; // Titre du breakdown (ex: "Navigateur", "Statut de la commande")
    data: Record<string, number> | undefined; // Les données agrégées pour cette dimension { clé: count }
    period: StatsPeriod; // La période globale (si nécessaire, pas pour la nav direct)
    navigationBaseUrl: string; // L'URL de base pour la navigation (ex: '/users/visites', '/commands')
    filterParamName: string; // Le nom du paramètre dans l'URL pour filtrer cette dimension (ex: 'device', 'status', 'landing_page')
    dateRangeParams: { min_date?: string, max_date?: string }; // Les dates de la plage analysée pour la navigation
}

// Couleurs pour le Pie Chart (adapter si vous avez une palette spécifique)
const PIE_COLORS = [
    '#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', // Couleurs primaires
    '#6366f1', '#06b6d4', '#a855f7', '#ec4899', '#eab308', // Couleurs secondaires
    '#d946ef', '#f43f5e', '#fb923c', '#facc15', '#a3e635', // Plus de nuances
];

const DimensionBreakdown: React.FC<DimensionBreakdownProps> = ({
    title,
    data,
    // period, // Pas utilisé dans ce composant pour l'instant
    navigationBaseUrl,
    filterParamName,
    dateRangeParams,
}) => {
    // État pour basculer entre liste et graphique
    const [showList, setShowList] = useState(true); // Démarre en mode liste

    // Hook de navigation Vike
    const { nextPage } = useMyLocation()

    // Prépare les données triées pour la vue liste et pour le graphique
    const sortedData = useMemo(() => {
        if (!data) return [];
        // Convertir l'objet en tableau d'entrées [clé, count] et trier par count décroissant
        const entries = Object.entries(data)
            // Assurez-vous que 'true'/'false' sont affichés de manière lisible si filterParamName est 'with_delivery'
            .map(([key, count]) => {
                let displayKey = key;
                if (filterParamName === 'with_delivery') {
                    displayKey = key === 'true' ? 'Avec livraison' : (key === 'false' ? 'Sans livraison' : key);
                }
                // Ajoutez d'autres mappings si besoin (ex: 'pending' -> 'En attente')
                // Pour l'i18n des statuts, il faudrait passer un dictionnaire de traduction ou le hook t().
                // Pour l'instant, mapping simple pour 'with_delivery'.

                return [key, count, displayKey] as [string, number, string]; // [originalKey, count, displayLabel]
            })
            .sort(([, countA], [, countB]) => countB - countA);

        return entries;
    }, [data, filterParamName]); // Dépendance: data change, ou si le type de filtre (with_delivery) impacte l'affichage

    // Prépare les données pour le Pie Chart
    const pieChartData = useMemo<ChartData<'pie'>>(() => {
        const labels = sortedData.map(([, , displayKey]) => displayKey || 'N/A'); // Utilise displayLabel
        const counts = sortedData.map(([, count]) => count);
        const backgroundColors = counts.map((_, index) => PIE_COLORS[index % PIE_COLORS.length]); // Cycle through colors

        return {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: backgroundColors,
                borderColor: '#ffffff', // Couleur de bordure des segments (ex: blanc)
                borderWidth: 1,
            }],
        };
    }, [sortedData]); // Dépend de sortedData

    // Prépare les items pour la légende custom du Pie Chart (même que sortedData)
    const pieLegendItems = useMemo(() => {
        // Utilise la même structure que sortedData, mais pour la légende custom
        return sortedData.map(([originalKey, count, displayKey], index) => ({
            label: `${displayKey} (${count})`, // Label incluant le count
            color: PIE_COLORS[index % PIE_COLORS.length], // La couleur du segment correspondant
            // Pas de onClick/isActive ici car on gère la navigation sur les items de la LISTE,
            // mais on pourrait ajouter une logique si on voulait rendre les légendes cliquables aussi.
        }));
    }, [sortedData]);


    // Gestionnaire de clic pour la navigation
    const handleItemClick = (itemValue: string) => {
        // itemValue est la clé originale (ex: 'mobile', 'returned', 'true')

        // Construire les query parameters
        const queryParams = new URLSearchParams();
        if (dateRangeParams?.min_date) queryParams.set('min_date', dateRangeParams.min_date);
        if (dateRangeParams?.max_date) queryParams.set('max_date', dateRangeParams.max_date);
        // Ajouter le filtre spécifique à cette dimension/valeur
        // Encode la valeur pour l'URL
        queryParams.set(filterParamName, encodeURIComponent(itemValue));

        // Construire l'URL complète
        const url = `${navigationBaseUrl}?${queryParams.toString()}`;

        // Naviguer
        nextPage(url);
    }


    // Ne rien afficher si aucune donnée
    if (!data || sortedData.length === 0) {
        // Afficher un message si data est null/vide APRÈS le chargement initial ?
        // Ou simplement masquer le composant. Le parent gère l'état de chargement et noData global.
        // Pour l'instant, on masque juste.
        return null;
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col">
            {/* Header avec titre et sélecteur de vue */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-md font-semibold text-gray-700">{title}</h3>
                {/* Sélecteur Liste/Graphique */}
                {/* Utiliser des boutons ou icônes pour switcher */}
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setShowList(true)}
                        className={`px-2 py-0.5 rounded text-sm transition ${showList ? 'bg-blue-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        Liste
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowList(false)}
                        className={`px-2 py-0.5 rounded text-sm transition ${!showList ? 'bg-blue-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        Graphique
                    </button>
                </div>
            </div>

            {/* Corps : Liste ou Graphique */}
            <div className="flex-grow overflow-hidden"> {/* Ajouté pour gérer hauteur/scroll si besoin */}
                {showList ? (
                    // Vue Liste
                    <ul className="text-sm text-gray-700 max-h-64 overflow-y-auto"> {/* Hauteur max et scroll pour la liste si elle est longue */}
                        {sortedData.map(([originalKey, count, displayKey], index) => (
                            <li
                                key={originalKey || `item-${index}`} // Clé unique
                                className={`flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition cursor-pointer`} // Style cliquable
                                onClick={() => handleItemClick(originalKey)} // Appeler gestionnaire de navigation
                            >
                                {/* Légende colorée inline dans la liste */}
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></span>
                                    <span className="truncate">{displayKey || 'Inconnu'}</span>
                                </div>
                                <span className="font-medium text-gray-900 flex-shrink-0">{count}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    // Vue Graphique
                    <div className="flex flex-col items-center"> {/* Centrer graphique et légende si vue seule */}
                        <div className="w-48 h-48 mb-4"> {/* Conteneur pour le graphique avec une taille définie */}

                            <PieChart data={pieChartData as any} options={{ /* Options spécifiques si besoin */ }} />
                        </div>
                        {/* Légende pour le graphique - Peut être juste le nom/pourcentage ici ou liste complète */}
                        {/* Option 1: Légende simplifiée (juste nom et couleur) */}
                        {/* <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-gray-600 mt-2">
                              {pieChartData.labels?.map((label, index) => (
                                  <div key={`pie-legend-${label}-${index}`} className="flex items-center gap-1">
                                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pieChartData.datasets[0].backgroundColor[index] as string }}></span>
                                      <span>{label}</span>
                                  </div>
                              ))}
                         </div> */}
                        {/* Option 2: Utiliser le composant ChartLegend custom (meilleur pour la cohérence) */}
                        {/* Les items ici peuvent être les mêmes que les labels du Pie Chart */}
                        <ChartLegend items={pieLegendItems.map(item => ({
                            ...item,
                            // Optionnel: afficher juste la clé dans la légende ChartLegend pour ne pas répéter le count?
                            // label: item.label.substring(0, item.label.lastIndexOf(' (') === -1 ? item.label.length : item.label.lastIndexOf(' ('))
                        }))} />
                    </div>
                )}
            </div>

        </div>
    );
};

export default DimensionBreakdown;