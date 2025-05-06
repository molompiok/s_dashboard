// Components/Status/Satus.tsx
// import './Status.css'; // ❌ Supprimer l'import CSS

import { JSX } from 'react';
import { FaHourglassHalf, FaTimesCircle, FaCheckCircle, FaUndoAlt, FaBoxOpen, FaTruckLoading, FaExclamationTriangle, FaMoneyCheckAlt, FaClock, FaSyncAlt, FaShippingFast, FaStore, FaBan, FaShoppingBag } from 'react-icons/fa';
import { OrderStatus } from '../Utils/constants'; // Assurez-vous que cet enum est bien exporté/importé

// --- Types et Enums (inchangés) ---
// type OrderStatusKey = keyof typeof OrderStatus; // Peut être utile

// --- Mappage des Icônes (inchangé, react-icons est OK) ---
const statusIcons: Record<OrderStatus, JSX.Element> = {
    [OrderStatus.PENDING]: <FaHourglassHalf />,
    [OrderStatus.CANCELED]: <FaTimesCircle />,
    [OrderStatus.CONFIRMED]: <FaCheckCircle />,
    [OrderStatus.PROCESSING]: <FaSyncAlt />,
    [OrderStatus.SHIPPED]: <FaShippingFast />,
    [OrderStatus.READY_FOR_PICKUP]: <FaStore />,
    [OrderStatus.PICKED_UP]: <FaShoppingBag />,
    [OrderStatus.NOT_PICKED_UP]: <FaExclamationTriangle />,
    [OrderStatus.DELIVERED]: <FaBoxOpen />,
    [OrderStatus.NOT_DELIVERED]: <FaExclamationTriangle />,
    [OrderStatus.RETURNED]: <FaUndoAlt />,
    [OrderStatus.FAILED]: <FaBan/>
};

const getStatusIcon = (status: OrderStatus): JSX.Element | null => statusIcons[status] ?? null;

// --- Mappage des Classes Tailwind pour les Couleurs ---
// Utiliser les noms de couleurs Tailwind pour le texte et l'arrière-plan
const statusColors: Record<OrderStatus, { text: string; bg: string; border?: string }> = {
    [OrderStatus.PENDING]:           { text: 'text-orange-600',  bg: 'bg-orange-100' },
    [OrderStatus.CANCELED]:          { text: 'text-red-600',     bg: 'bg-red-100' },
    [OrderStatus.CONFIRMED]:         { text: 'text-green-600',   bg: 'bg-green-100' },
    [OrderStatus.PROCESSING]:        { text: 'text-blue-600',    bg: 'bg-blue-100' },
    [OrderStatus.SHIPPED]:           { text: 'text-indigo-600',  bg: 'bg-indigo-100' },
    [OrderStatus.READY_FOR_PICKUP]:  { text: 'text-yellow-600',  bg: 'bg-yellow-100' },
    [OrderStatus.PICKED_UP]:         { text: 'text-teal-600',    bg: 'bg-teal-100' },
    [OrderStatus.NOT_PICKED_UP]:     { text: 'text-rose-600',    bg: 'bg-rose-100' },
    [OrderStatus.DELIVERED]:         { text: 'text-emerald-600', bg: 'bg-emerald-100' },
    [OrderStatus.NOT_DELIVERED]:     { text: 'text-rose-600',    bg: 'bg-rose-100' },
    [OrderStatus.RETURNED]:          { text: 'text-gray-600',    bg: 'bg-gray-100' },
    [OrderStatus.FAILED]:            { text: 'text-black',       bg: 'bg-gray-200' }
};


// Fonction pour obtenir les classes Tailwind ou un style par défaut
const getStatusClasses = (status: OrderStatus | string): { text: string; bg: string } => {
    const upperStatus = status?.toLowerCase() as OrderStatus; // Tenter de caster
   return statusColors[upperStatus] ?? { text: 'text-gray-700', bg: 'bg-gray-200' }; // Couleur par défaut
};

// --- Composant OrderStatusElement ---
// Ajout de isSelected pour gérer le style du filtre
const OrderStatusElement = ({ status, isSelected }: { status: OrderStatus | string, isSelected?: boolean }) => {
    const upperStatus = status?.toUpperCase() as OrderStatus; // Normaliser
    const icon = getStatusIcon(upperStatus);
    const classes = getStatusClasses(upperStatus);
    const label = upperStatus?.split('_').join(' ').toLowerCase() ?? 'unknown'; // Formatage label

    // Construire les classes conditionnelles
    const combinedClasses = `
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium leading-none no-select
        ${classes.bg} ${classes.text}
        ${isSelected ? 'ring-2 ring-offset-1 ring-blue-400' : ''} /* Style si sélectionné (pour filtres) */
        cursor-default /* Style par défaut, le parent peut le rendre cliquable */
    `;

    // Utiliser t() pour le label si disponible (nécessite useTranslation)
    // const { t } = useTranslation();
    // const label = t(`dashboard.orderFilters.statusValues.${status.toLowerCase()}`, status?.split('_').join(' ').toLowerCase());


    if (!status) return null; // Ne rien rendre si status est invalide/null

    return (
        <span className={combinedClasses}>
            {icon && <span>{icon}</span>} {/* Afficher l'icône si elle existe */}
            <span className="capitalize">{label}</span> {/* Mettre en majuscule la première lettre */}
        </span>
    );
};

// Exporter les éléments nécessaires
export { OrderStatusElement, statusIcons, statusColors, getStatusIcon, getStatusClasses };