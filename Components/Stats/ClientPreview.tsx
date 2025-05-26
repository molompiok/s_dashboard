// components/Stats/ClientPreview.tsx
import React, { useMemo } from 'react';
// Assurez-vous que les types sont importés correctement
import { UserInterface, } from '../../api/Interfaces/Interfaces'; // Types User et UserInterface['stats']
// Importez les icônes pour les stats client (comme dans votre page @id)
import { Star, MessageCircle, ShoppingCart, CreditCard, CalendarClock, Mail, Phone, DollarSign } from 'lucide-react'; // Icônes
// Utilitaires
import { getMedia } from '../Utils/StringFormater'; // Image helper
import { ClientStatusColor } from '../Utils/constants'; // Couleurs de statut client
import IMask from 'imask'; // Masquage téléphone
import { DateTime } from 'luxon'; // Formatage date
// Importez le composant StatCard
import StatCard from './StatCard'; // Ajustez le chemin

import { useTranslation } from 'react-i18next'; // i18n
import { useMyLocation } from '../../Hooks/useRepalceState';


interface ClientPreviewProps {
    // Le client à prévisualiser (peut être undefined si pas de client sélectionné ou en cours de chargement parent)
    client: UserInterface | undefined;
    // Ajoutez la devise si elle n'est pas dans l'objet client.stats et est nécessaire pour formatter totalSpent
    // currency?: string; // Assumons qu'elle est récupérée ou globalement dispo si besoin
    // Ajouter les dates de filtre globales si ClientPreview StatCards déclenchent une navigation (comme les DimensionBreakdowns)
    // minDateFilter?: string; // ISO string
    // maxDateFilter?: string; // ISO string
}

const ClientPreview: React.FC<ClientPreviewProps> = ({ client /*, currency, minDateFilter, maxDateFilter*/ }) => {
    const { t, i18n } = useTranslation(); // i18n
    const { nextPage } = useMyLocation(); // Router pour la navigation si StatCard devient cliquable


    // Formatage pour totalSpent (devise) et notes
    const formatValue = (value: number | string | undefined | null, type: 'number' | 'currency' | 'rating' | 'relative_date' = 'number'): React.ReactNode => {
        if (value === undefined || value === null) return '-'; // Gère undefined/null

        try {
            if (type === 'currency') {
                // TODO: Utiliser la vraie devise du store ou de l'objet client si dispo
                const displayCurrency = 'FCFA'; // Fallback FCFA ou autre si pas dans stats
                return `${Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${displayCurrency}`;
            } else if (type === 'rating') {
                // Formater la note et afficher "/ 5"
                return `${Number(value).toFixed(1)} / 5`;
            } else if (type === 'relative_date') {
                // value is ISO string, format relative
                if (typeof value !== 'string' || !value) return '-';
                const dt = DateTime.fromISO(value);
                if (!dt.isValid) return '-';
                return dt.setLocale(i18n.language).toRelative() || '-';
            }
            else { // 'number' simple
                return Number(value).toLocaleString(); // Formatage simple du nombre (séparateur milliers)
            }
        } catch (e) {
            console.error("Error formatting client stat value", value, type, e);
            return String(value); // Fallback simple
        }
    };

    // Définition des statCards pour les stats spécifiques du client
    // Similaire à KpiCards config, mais pointe vers client.stats
    const clientStatsConfig = useMemo(() => [
        // S'assurer que client.stats existe avant d'essayer d'accéder aux propriétés
        {
            key: 'avgRating' as keyof UserInterface['stats'],
            labelKey: 'usersPage.details.avgRating',
            icon: Star, iconColorClass: 'text-yellow-500',
            value: formatValue(client?.stats?.avgRating, 'rating'),
            // onClick: client?.id ? () => router.go(`/users/clients/${client.id}/comments`) : undefined, // Naviguer vers page commentaires?
        },
        {
            key: 'commentsCount' as keyof UserInterface['stats'],
            labelKey: 'usersPage.details.commentsCount',
            icon: MessageCircle, iconColorClass: 'text-blue-500',
            value: formatValue(client?.stats?.commentsCount, 'number'),
            // onClick: client?.id ? () => router.go(`/users/clients/${client.id}/comments`) : undefined, // Naviguer
        },
        {
            key: 'productsBought' as keyof UserInterface['stats'],
            labelKey: 'usersPage.details.productsBought',
            icon: ShoppingCart, iconColorClass: 'text-green-500',
            value: formatValue(client?.stats?.productsBought, 'number'),
            // onClick: client?.id ? () => router.go(`/commands?user_id=${client.id}`) : undefined, // Naviguer vers Commandes filtrées? Ajouter date range params ici? { min_date: minDateFilter, max_date: maxDateFilter }
        },
        {
            key: 'ordersCount' as keyof UserInterface['stats'],
            labelKey: 'usersPage.details.ordersCount',
            icon: CreditCard, iconColorClass: 'text-purple-500', // Utilisez CreditCard ou autre
            value: formatValue(client?.stats?.ordersCount, 'number'),
            // onClick: client?.id ? () => router.go(`/commands?user_id=${client.id}`) : undefined, // Naviguer vers Commandes filtrées?
        },
        {
            key: 'totalSpent' as keyof UserInterface['stats'],
            labelKey: 'usersPage.details.totalSpent',
            icon: DollarSign, iconColorClass: 'text-emerald-600', // Assorti au KPI global
            value: formatValue(client?.stats?.totalSpent, 'currency'),
            // onClick: client?.id ? () => router.go(`/commands?user_id=${client.id}`) : undefined, // Naviguer vers Commandes filtrées?
        },
        {
            key: 'lastVisit' as keyof UserInterface['stats'],
            labelKey: 'usersPage.details.lastVisit',
            icon: CalendarClock, iconColorClass: 'text-rose-500',
            value: formatValue(client?.stats?.lastVisit, 'relative_date'),
            // Non cliquable par défaut
        },
        // Add more client stats if they are available in user.stats
    ], [client?.stats, t, i18n.language /*, minDateFilter, maxDateFilter*/]); // Re-memoize if client or formatting needs change (currency/locale)


    // Si le client n'est pas défini (parent en cours de chargement, ou aucun client sélectionné/trouvé)
    if (!client) {
        // Le parent devrait gérer le loading de 'client', ici on renvoie null si le client prop est null/undefined
        return null; // Or return a simple placeholder card if design needs it
    }


    // Statut client couleur (réutilisé de @id page)
    const status = client.status ?? 'CLIENT'; // Default status
    const statusColor = (ClientStatusColor as any)?.[status.toUpperCase()] ?? '#6B7280'; // Fallback to gray if status key missing


    // Afficher téléphone avec masquage (réutilisé de @id page ou ClientItem)
    const displayPhone = client.user_phones?.[0] ?
        IMask.pipe(client.user_phones?.[0]?.phone_number || '', { mask: client.user_phones?.[0]?.format || '' }) :
        t('common.notProvided');

    const hasStatsData = client.stats !== undefined && client.stats !== null;


    return (
        // Conteneur principal - une carte pour la prévisualisation client entière
        <div className="client-preview bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-6">{t('usersPage.details.title', { name: client.full_name || t('common.unknown') })}</h2>

            {/* Section Infos Client de Base */}
            <div className="user-card-basic flex flex-col md:flex-row items-center md:items-start gap-6 pb-6 mb-6 border-b border-gray-100"> {/* Padding bottom et bordure pour séparer */}
                {/* Photo ou initiales */}
                <div className="relative flex-shrink-0">
                    <div
                        className="w-20 h-20 flex items-center font-bold text-gray-500 justify-center text-3xl rounded-full object-cover border-4 border-white shadow-sm"
                        style={{ background: getMedia({isBackground:true,source:client.photo?.[0],from:'api'})}}
                    >
                        {!client.photo?.[0] && (client.full_name?.substring(0, 2).toUpperCase() || '?')}
                    </div>
                    {/* Statut Badge */}
                    <span
                        className="absolute bottom-0 right-0 block h-4 w-4 rounded-full ring-2 ring-white"
                        style={{ backgroundColor: statusColor }}
                        title={t(`clientStatus.${status?.toLowerCase() || 'client'}`, status)}
                    ></span>
                </div>
                {/* Infos Textuelles */}
                <div className="flex flex-col gap-1.5 flex-grow min-w-0 text-center md:text-left">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{client.full_name || t('common.anonymous')}</h3>
                    {client.email && (
                        <a href={`mailto:${client.email}`} className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-600 hover:text-blue-600 w-fit mx-auto md:mx-0">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="truncate">{client.email}</span>
                        </a>
                    )}
                    {/* Téléphone avec Masque */}
                    {displayPhone !== t('common.notProvided') && (
                        <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="truncate">{displayPhone}</span>
                        </div>
                    )}
                    {/* Date d'inscription - Si présente et pertinente ici */}
                    {client.created_at && (
                        <p className='text-xs text-gray-500 '><span>{t('clientDetail.memberSinceLabel')}:</span> {DateTime.fromISO(client.created_at || '').setLocale(i18n.language).toLocaleString(DateTime.DATE_MED)}</p>
                    )}
                </div>
            </div>


            {/* Section Stats Client Détaillées */}
            {hasStatsData ? (
                <div className="stats-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {/* Mapping sur la config pour créer les StatCards */}
                    {clientStatsConfig.map((stat) => (
                        // StatCard n'a pas de onClick géré en interne, si cliquable, ça se passe ici
                        <StatCard
                            key={stat.key}
                            labelKey={stat.labelKey}
                            icon={stat.icon}
                            colorClass={stat.iconColorClass}
                            value={stat.value}
                        // Si la StatCard doit être cliquable pour naviguer vers une liste filtrée :
                        // onClick={stat.onClick}
                        />
                    ))}
                </div>
            ) : (
                // Message si les stats client ne sont pas disponibles dans l'objet client
                <div className="text-center text-gray-500">{t('usersPage.details.noStatsAvailable')}</div>
            )}

        </div>
    );
};

export default ClientPreview;