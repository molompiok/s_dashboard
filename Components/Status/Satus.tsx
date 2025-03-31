import { FaHourglassHalf, FaTimesCircle, FaCheckCircle, FaUndoAlt, FaBoxOpen, FaTruckLoading, FaExclamationTriangle, FaMoneyCheckAlt, FaClock } from 'react-icons/fa';
import './Status.css'
import { OrderStatus } from '../Utils/constants';
import { JSX } from 'react';

export { statusIcons,getStatusIcon, OrderStatusElement,statusColors, getStatusColor, }



// Objet de correspondance des icônes
const statusIcons: Record<keyof typeof OrderStatus, JSX.Element> = {
    PENDING: <FaHourglassHalf />,
    CANCELED: <FaTimesCircle />,
    CONFIRMED: <FaCheckCircle />,
    RETURNED: <FaUndoAlt />,
    DELIVERED: <FaBoxOpen />,
    PICKED_UP: <FaTruckLoading />,
    NOT_DELIVERED: <FaExclamationTriangle />,
    NOT_PICKED_UP: <FaExclamationTriangle />,
    WAITING_FOR_PAYMENT: <FaMoneyCheckAlt />,
    WAITING_PICKED_UP: <FaClock />,
};

// Fonction qui retourne l'icône correspondant au statut
const getStatusIcon = (status: keyof typeof OrderStatus) => statusIcons[status] || null;

const statusColors: Record<keyof typeof OrderStatus, string> = {
    PENDING: '#FFA500',          // 🟠 Orange → En attente  
    CANCELED: '#FF4C4C',         // 🔴 Rouge vif → Annulé  
    CONFIRMED: '#4CAF50',        // ✅ Vert → Confirmé  
    RETURNED: '#6C757D',         // 🔄 Gris foncé → Retourné  
    DELIVERED: '#00AA33',        // 📦 Vert foncé → Livré  
    PICKED_UP: '#007BFF',        // 🚚 Bleu → Récupéré  
    NOT_DELIVERED: '#FF6347',    // ⚠️ Rouge orangé → Non livré  
    NOT_PICKED_UP: '#FF6347',    // ⚠️ Rouge orangé → Non récupéré  
    WAITING_FOR_PAYMENT: '#c9ab00', // 💰 Jaune → En attente de paiement  
    WAITING_PICKED_UP: '#17A2B8',   // ⏳ Bleu ciel → En attente d'enlèvement  
};

const getStatusColor = (status: keyof typeof OrderStatus) => statusColors[status] || '#000000';  // Default color

const OrderStatusElement = ({ status , color,background}: {background?:string|undefined,color?:string|undefined, status: keyof typeof OrderStatus }) => {
    const c =  color || getStatusColor(status);
    return status && (
    <span className='order-status-element' style={{background: background || `${c}22`, color:c }} >
        {getStatusIcon(status)} <span style={{color:c}}>{status?.split('_').join(' ').toLowerCase()}</span>
    </span>
)};
