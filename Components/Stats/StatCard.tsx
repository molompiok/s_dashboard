// components/Stats/StatCard.tsx
import React from 'react';
import { useTranslation } from 'react-i18next'; // i18n

interface StatCardProps {
    icon: React.ElementType; // Icône (ex: de Lucide React)
    labelKey: string; // Clé i18n pour le libellé
    value?: React.ReactNode; // La valeur affichée (peut être un nombre, string, JSX)
    // row?: boolean; // Non utilisé dans l'implémentation du snippet, on le retire pour simplifier ou on adapte l'implémentation pour le gérer. Restons simple: alignement flex-col par défaut.
    onClick?: () => void; // Callback au clic (pour naviguer ou autre)
    colorClass?: string; // Classe Tailwind pour la couleur de l'icône (ex: 'text-blue-500')
     valueColorClass?: string; // Classe pour la couleur de la valeur
    // bgColorClass?: string; // Ajouter si la carte elle-même a un fond coloré (les KpiCards ont déjà ça, à voir si on uniformise)
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, labelKey, value, onClick, colorClass = "text-gray-500", valueColorClass }) => {
    const { t } = useTranslation();

    return (
        <div
            className={`stat-card bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between transition hover:shadow-md
                        ${onClick ? 'cursor-pointer hover:border-blue-200 hover:bg-blue-50/30' : ''}`} // Styles interactifs si cliquable
            onClick={onClick}
        >
            {/* Icône et Label */}
             {/* Flex gap pour aligner l'icône et le label, items-center verticalement */}
             <div className={`flex items-center gap-2 mb-1`}> {/* mb-1 pour l'espacement avec la valeur */}
                {/* Icône avec couleur définie */}
                <Icon className={`w-5 h-5 flex-shrink-0 ${colorClass}`} strokeWidth={1.8} /> {/* Icône Lucide stylisée */}
                 {/* Label (utilise i18n) */}
                <span className="text-sm font-medium text-gray-600">{t(labelKey)}</span>
            </div>

            {/* Valeur - Styling propre */}
             <div className={`stat-value text-base font-bold text-gray-900 ${valueColorClass ?? ''}`}> {/* text-base plus petit que 2xl des KpiCards, pour plus de compacité ici */}
                 {value ?? '-'} {/* Afficher un tiret si la valeur est undefined/null */}
            </div>
        </div>
    );
}

export default StatCard;