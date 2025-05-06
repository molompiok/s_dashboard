// components/Stats/Charts/LineChart.tsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions, // Importer ChartOptions
  ChartData // Importer ChartData
} from 'chart.js';
import { DateTime } from 'luxon'; // Pour le formatage des dates

// Enregistrer les composants Chart.js nécessaires
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip, // Tooltip reste utile
  // Legend // On n'enregistre pas la Legend si on ne l'utilise pas
);

// Définir le type de période (ou l'importer depuis une source commune si défini ailleurs)
type StatsPeriod = 'day' | 'week' | 'month'; // S'assurer que c'est cohérent avec StatsUtils

interface LineChartProps {
  // data vient directement de la prop, pas de calcul interne de range
  data: ChartData<'line'>;
  period: StatsPeriod; // Utiliser la période pour le formatage dynamique
  options?: ChartOptions<'line'>; // Options personnalisées pour le graphique (fusionnées)
}

const LineChart: React.FC<LineChartProps> = ({ data, period, options }) => {

  // Déterminer le format de date pour Luxon en fonction de la période
  // Ceci sera utilisé dans les callbacks de Chart.js (tooltip et ticks)
  const luxonFormatString = (p: StatsPeriod): string => {
      switch (p) {
          case 'day': return 'dd MMM'; // ex: "17 Apr"
          case 'week': return 'dd MMM'; // Pour yyyy-WW ou yyyy-MM-dd. Affiche juste la date, l'utilisateur comprend la période
          case 'month': return 'MMM yyyy'; // ex: "Apr 2023"
          // Vous pourriez aussi vouloir ajouter 'dd/MM' ou d'autres formats
          default: return 'yyyy-MM-dd'; // Fallback
      }
  };

   // Les options par défaut avec Chart.js Legend désactivée et formatage axe X/tooltip
  const defaultOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // DÉSactiver la légende intégrée de Chart.js
      },
      title: {
        display: false, // Géré par le composant parent
      },
      tooltip: {
        mode: 'index', // Afficher les tooltips pour toutes les séries à la même date
        intersect: false, // Le tooltip apparaît quand la souris est près de la ligne, pas seulement sur un point
        callbacks: {
           title: (tooltipItems) => {
               if (!tooltipItems || tooltipItems.length === 0) return '';
               // Les labels du graphique SONT les dates brutes (ISO, ou YYYY-MM, YYYY-WW...)
               const label = tooltipItems[0].label; // Utiliser le label tel qu'il est passé par `chartData.labels`
               const date = period === 'month' // Si c'est groupé par mois ou semaine...
                   ? DateTime.fromISO(label + '-01') // Parse YYYY-MM ou YYYY-WW (weekYear+weekNumber) - ajuster si format différent du YYYY-MM
                   : DateTime.fromISO(label); // Parse YYYY-MM-DD

               // Fallback parsing si fromISO échoue (ex: pour yyyy-WW)
               if (!date.isValid) {
                  if(period === 'month' && label.includes('-')) { // Tente de parser YYYY-WW si c'est la période month
                     const parts = label.split('-');
                     const year = parseInt(parts[0], 10);
                     const week = parseInt(parts[1], 10);
                      // Chercher une date valide dans cette semaine, ex: lundi de la semaine ISO
                      const isoWeekDate = DateTime.fromObject({ weekYear: year, weekNumber: week, weekday: 1 }); // lundi de la semaine
                      if (isoWeekDate.isValid) return isoWeekDate.toFormat(luxonFormatString(period));

                  }
                  return label; // Si tout échoue, affiche le label brut
               }
               return date.toFormat(luxonFormatString(period));
           },
           label: (context) => {
                let label = context.dataset.label || '';
                if (label) {
                    label += ': ';
                }
                // Afficher la valeur numéraire, formatée si nécessaire (pas de multi-axe ici)
                if (context.parsed.y !== null) {
                     label += context.parsed.y.toLocaleString(undefined, {
                          // Options de formatage si c'est un montant vs un nombre simple
                          // C'est le parent (OrderStatsSection) qui devra gérer ça via un callback plus spécifique si les datasets mélangent montants et comptes
                     });
                }
                return label;
           }
        }
      },
    },
    scales: {
      x: {
         title: { display: false, text: 'Date' }, // Titre optionnel
         ticks: {
              autoSkip: true, // Autorise Chart.js à masquer des labels si l'espace manque
              maxRotation: 0, // Ne pas faire tourner les labels
              minRotation: 0,
              callback: function(this: any, tickValue: string | number, index: number) {
                   const label = this.getLabelForValue(tickValue as number); // Le label brut
                    const date = period === 'month'
                       ? DateTime.fromISO(label + '-01') // Tenter YYYY-MM comme startOfMonth
                       : DateTime.fromISO(label); // Tenter YYYY-MM-DD

                     // Fallback parsing pour YYYY-WW (utilisé dans StatsUtils pour 'month')
                    if (!date.isValid && period === 'month' && typeof label === 'string' && label.includes('-')) {
                        const parts = label.split('-');
                        const year = parseInt(parts[0], 10);
                        const week = parseInt(parts[1], 10);
                        const isoWeekDate = DateTime.fromObject({ weekYear: year, weekNumber: week, weekday: 1 }); // lundi
                         if (isoWeekDate.isValid) return isoWeekDate.toFormat(luxonFormatString(period));
                    }

                   return date.isValid ? date.toFormat(luxonFormatString(period)) : label; // Appliquer le formatage Luxon
              },
               font: {
                 size: 10 // Petits labels pour ne pas surcharger
               }
         },
         grid: {
            display: false // Retirer la grille verticale si désir du style épuré
         }
      },
      y: {
        title: { display: false, text: 'Valeur' }, // Titre optionnel
        beginAtZero: true,
         ticks: {
             // Adapter le step si les valeurs sont des décimales ou grandes
             stepSize: 1, // Par défaut step de 1, ajuster si valeurs float ou très grandes
              callback: function(value) {
                   // Formatter en nombres entiers si ce sont des comptes, adapter si c'est un montant
                   if (Number.isInteger(value)) return value;
                   return value;
              },
              font: {
                 size: 10 // Petits labels
               }
         },
          grid: {
             color: 'rgba(0,0,0,0.05)', // Grille horizontale très légère
         },
      },
       // Aucune autre échelle Y par défaut pour éviter les multi-axes
    },
     layout: {
         padding: {
             left: 0, right: 0, top: 10, bottom: 0 // Petit padding vertical
         }
     }
  };

   // Fusion simple des options: les options passées via props prennent le dessus.
   // Pour les structures imbriquées (scales, plugins), Chart.js fusionne assez bien nativement
   // pour la plupart des cas simples, mais une fusion profonde peut être nécessaire
   // si l'on surcharge des sous-propriétés très spécifiques. Ici, simple suffit.
   const finalOptions = { ...defaultOptions, ...options };


  return (
    // Définir une hauteur flexible, peut utiliser des classes Tailwind
    <div className="w-full h-64 md:h-72"> {/* Ajuster la hauteur avec des classes Tailwind */}
      <Line options={finalOptions} data={data} />
    </div>
  );
};

export default LineChart;