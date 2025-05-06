// components/Stats/ChartLegend.tsx
import React from 'react';
// Vous pourriez vouloir une fonction pour normaliser les couleurs hex/rgba si nécessaire
// import { toHex } from '../Utils/colorUtils'; // Exemple si vous avez des utilitaires couleur

interface LegendItem {
    label: string;
    // Utiliser une seule propriété couleur, le style peut être défini ici
    // borderColor est souvent plus fiable pour les lignes que backgroundColor
    color: string; // Ex: 'rgb(75, 192, 192)' ou 'rgba(75, 192, 192, 0.5)'
    // Ajoutez d'autres propriétés si les légendes ont d'autres fonctions (ex: onClick pour toggle visibility)
    onClick?: () => void; // Optionnel: si vous voulez interagir avec la légende
    isActive?: boolean; // Optionnel: pour indiquer si la série est visible/active
}

interface ChartLegendProps {
    items: LegendItem[];
}

const ChartLegend: React.FC<ChartLegendProps> = ({ items }) => {
     if (!items || items.length === 0) return null; // Ne rien afficher si pas d'items

     // Helper pour déterminer la couleur du cercle (prendre le 'rgb'/'rgba' ou hex)
     const getLegendColorStyle = (color: string): React.CSSProperties => {
          // Simple check si la couleur est une string valide pour CSS background
          // Vous pourriez affiner cela avec des regex ou une utilitaire couleur
          if (typeof color === 'string' && color.length > 0) {
              return { backgroundColor: color, borderColor: color }; // Border color peut donner une meilleure visibilité pour le carré
          }
          return { backgroundColor: '#ccc', borderColor: '#ccc' }; // Couleur par défaut grise
     };


    return (
        // Utiliser flex, gap pour l'alignement et l'espacement
        <div className="chart-legend flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2 text-sm text-gray-600 mt-4">
            {items.map((item, index) => (
                 // Chaque item de légende
                <div
                    key={`${item.label}-${index}`} // Utiliser index en plus si labels non uniques
                    className={`flex items-center gap-1.5 ${item.onClick ? 'cursor-pointer' : ''} ${item.isActive === false ? 'opacity-50' : ''}`}
                    onClick={item.onClick}
                >
                    {/* Le petit carré de couleur */}
                    <span
                        className="w-3 h-3 rounded-full" // Carré ou rond? Les ronds sont subtils. Utilisez 'rounded' ou 'rounded-full'
                        style={getLegendColorStyle(item.color)}
                    ></span>
                    {/* Le label du dataset */}
                    <span>{item.label}</span>
                </div>
            ))}
        </div>
    );
};

export default ChartLegend;