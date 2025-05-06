// components/Stats/Charts/PieChart.tsx
import React, { useMemo } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement, // 💡 AJOUTEZ CET ÉLÉMENT FONDAMENTAL POUR LES GRAPHIQUES CIRCULAIRES/DOUGHNUT
  Tooltip,
  Legend, // Même si désactivé dans les options, l'enregistrer peut être plus sûr
  ChartOptions,
  ChartData
} from 'chart.js';
// DateTime n'est pas directement utilisé ici mais peut l'être pour formater les labels si besoin
// import { DateTime } from 'luxon';

// 💡 Enregistrer les composants Chart.js nécessaires, incluant ArcElement
ChartJS.register(
  ArcElement, // ✅ ESSENTIEL POUR Pie/Doughnut Charts
  Tooltip,    // ✅ Pour que les tooltips fonctionnent
  Legend      // Peut être enregistré même si désactivé via options
);

interface PieChartProps {
  data: ChartData<'pie'>;
  options?: ChartOptions<'pie'>;
  // Vous pourriez aussi vouloir passer des callbacks spécifiques si vous activez la gestion du clic sur les segments
  // onSegmentClick?: (element: any, index: number) => void;
}

const PieChart: React.FC<PieChartProps> = ({ data, options /*, onSegmentClick */ }) => {

   // Options par défaut pour un Pie Chart
   const defaultOptions: ChartOptions<'pie'> = {
        responsive: true,
        maintainAspectRatio: false, // Important si le conteneur a une hauteur définie
        plugins: {
            legend: {
                display: false, // On utilise une légende custom externe
            },
            tooltip: {
                // Mode et intersect par défaut conviennent bien
                 mode: 'index',
                 intersect: false,
                // Vous pouvez ajouter des callbacks spécifiques si le formatage par défaut ne suffit pas
                 callbacks: {
                      label: (context) => {
                         // Formatage standard du label + pourcentage
                          let label = context.label || '';
                          if (label) {
                              label += ': ';
                          }
                          const value = context.parsed;
                          // Calculer le pourcentage
                           const total = context.dataset.data.reduce((sum: any, val: any) => sum + val, 0); // Total de toutes les valeurs du dataset
                          const percentage = total > 0 ? ((value / total) * 100) : 0;

                           label += `${value.toLocaleString()} (${percentage.toFixed(1)}%)`;

                           // Si vous avez des labels complexes nécessitant traduction/mapping, cela se fait ici
                           // Ex: if (label === 'true') label = t('with_delivery_label');

                          return label;
                      },
                      //@ts-ignore
                      title: (context) => context.label // Le titre du tooltip est juste le label de la tranche
                 }
            }
        },
         // Pas de 'scales' visibles pour un Pie Chart simple
        scales: {}
    };

   // Fusionner les options personnalisées, en assurant que legend display reste false
   const finalOptions: ChartOptions<'pie'> = {
        ...defaultOptions,
        ...options, // Options passées en prop peuvent surcharger le reste...
        plugins: { // ...sauf le paramètre legend display, qui doit rester false
             ...defaultOptions.plugins,
            ...options?.plugins,
             legend: { display: false } // Toujours désactiver la légende Chart.js
        },
        // On peut fusionner d'autres sections imbriquées ici si besoin (ex: tooltip)
        //@ts-ignore
        tooltip: {
             ...defaultOptions.plugins?.tooltip, // Copie les callbacks par défaut
             ...options?.plugins?.tooltip, // Permet de surcharger les callbacks
             callbacks: {
                  ...defaultOptions.plugins?.tooltip?.callbacks, // Assure que les callbacks par défaut sont présents
                   ...options?.plugins?.tooltip?.callbacks // Les callbacks passés via options écrasent/ajoutent
              }
         }
    };

    // Préparer l'objet data passé à Chart.js (juste une copie ou légère transformation si nécessaire)
    const chartJsData = useMemo(() => {
         // Si vous voulez des labels dans les données différentes des labels pour la légende, transformez-les ici.
         // Pour l'instant, les labels sont directs dans DimensionBreakdown via pieChartData
         return data;
    }, [data]); // Ne se met à jour que si les données changent


   return (
      // Définir une hauteur fixe ou utiliser des classes Tailwind comme discuté
      // Assurer que le conteneur a bien une taille (width/height) pour Chart.js
      <div className="w-full h-full flex items-center justify-center"> {/* flex container for centering */}
          <div className="w-full h-full max-w-xs max-h-xs"> {/* Constraint size if needed */}
                {/*
                Ajoutez un gestionnaire d'événement onClick sur la div ou sur la toile du graphique
                si vous souhaitez que les CLICS SUR LES SEGMENTS déclenchent une action (comme la navigation)
                 Plutôt que les clics sur la liste dans DimensionBreakdown.
                Chart.js supporte les événements et fournit les éléments cliqués.
                Pour cela, vous utiliseriez une fonction similaire à handleItemClick,
                mais déclenchée ici, en utilisant les données passées ou une prop onSegmentClick.
                */ }
              <Pie
                  data={chartJsData}
                  options={finalOptions}
                  // Ajoutez des plugins custom ou des événements si nécessaires
              />
          </div>
      </div>
   );
};

export default PieChart;