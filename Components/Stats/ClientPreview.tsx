// components/Stats/ClientPreview.tsx
import React, { useMemo } from 'react';
import { UserInterface } from '../../api/Interfaces/Interfaces';
import { Star, MessageCircle, ShoppingCart, CreditCard, CalendarClock, Mail, Phone, DollarSign } from 'lucide-react';
import { getMedia } from '../Utils/StringFormater';
import { ClientStatusColor } from '../Utils/constants';
import IMask from 'imask';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { useMyLocation } from '../../Hooks/useRepalceState';

// 🎨 Sous-composant pour la carte de statistique individuelle
interface StatCardProps {
    label: string;
    value: React.ReactNode;
    icon: React.ElementType;
    colorClasses: { light: string; dark: string; };
    onClick?: () => void;
}
const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, colorClasses, onClick }) => (
    <div
        className={`flex flex-col p-3 rounded-lg transition-all duration-200
                   bg-gray-50/50 dark:bg-black/20 
                   border border-gray-200/50 dark:border-white/10
                   ${onClick ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-black/30 hover:border-gray-300/80 dark:hover:border-white/20' : ''}`}
        onClick={onClick}
    >
        <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
            <Icon className={`w-4 h-4 ${colorClasses.light} dark:${colorClasses.dark}`} />
        </div>
        <span className="text-base font-bold text-gray-800 dark:text-gray-100">{value}</span>
    </div>
);

// 🎨 Sous-composant pour le skeleton de la carte client
const ClientPreviewSkeleton: React.FC = () => (
    <div className="client-preview bg-white/80 dark:bg-white/5 backdrop-blur-lg p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200/80 dark:border-white/10 mb-6 animate-pulse">
        <div className="h-6 w-3/4 bg-gray-300 dark:bg-gray-700 rounded-md mb-6"></div>
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 pb-6 mb-6 border-b border-gray-200/50 dark:border-white/10">
            <div className="w-20 h-20 bg-gray-300 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
            <div className="flex flex-col gap-2.5 flex-grow min-w-0 items-center md:items-start">
                <div className="h-6 w-1/2 bg-gray-300 dark:bg-gray-700 rounded-md"></div>
                <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-800 rounded-md"></div>
                <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-800 rounded-md"></div>
            </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 dark:bg-black/20 rounded-lg"></div>
            ))}
        </div>
    </div>
);


interface ClientPreviewProps {
    client: UserInterface | undefined;
    isLoading: boolean; // 🎨 Pour gérer l'état de chargement
}

const ClientPreview: React.FC<ClientPreviewProps> = ({ client, isLoading }) => {
    const { t, i18n } = useTranslation();
    const { nextPage } = useMyLocation();

    const formatValue = (value: any, type: 'number' | 'currency' | 'rating' | 'relative_date' = 'number'): React.ReactNode => {
        if (value === undefined || value === null) return '-';
        try {
            if (type === 'currency') {
                return Number(value).toLocaleString(t('common.locale'), { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2 });
            }
            if (type === 'rating') return `${Number(value).toFixed(1)} / 5`;
            if (type === 'relative_date') {
                const dt = DateTime.fromISO(value);
                return dt.isValid ? dt.setLocale(i18n.language).toRelative() : '-';
            }
            return Number(value).toLocaleString();
        } catch (e) {
            return String(value);
        }
    };

    const clientStatsConfig = useMemo(() => client?.stats ? [
        { key: 'totalSpent', labelKey: 'usersPage.details.totalSpent', icon: DollarSign, color: { light: 'text-emerald-600', dark: 'text-emerald-400' }, type: 'currency' },
        { key: 'ordersCount', labelKey: 'usersPage.details.ordersCount', icon: CreditCard, color: { light: 'text-indigo-600', dark: 'text-indigo-400' }, type: 'number' },
        { key: 'productsBought', labelKey: 'usersPage.details.productsBought', icon: ShoppingCart, color: { light: 'text-sky-600', dark: 'text-sky-400' }, type: 'number' },
        { key: 'avgRating', labelKey: 'usersPage.details.avgRating', icon: Star, color: { light: 'text-amber-500', dark: 'text-amber-400' }, type: 'rating' },
        { key: 'commentsCount', labelKey: 'usersPage.details.commentsCount', icon: MessageCircle, color: { light: 'text-cyan-600', dark: 'text-cyan-400' }, type: 'number' },
        { key: 'lastVisit', labelKey: 'usersPage.details.lastVisit', icon: CalendarClock, color: { light: 'text-rose-500', dark: 'text-rose-400' }, type: 'relative_date' },
    ] as const : [], [client?.stats, i18n.language]);

    // 🎨 Afficher le skeleton pendant le chargement
    if (isLoading) {
        return <ClientPreviewSkeleton />;
    }
    
    // 🎨 Si pas de chargement et pas de client, afficher un message d'invite
    if (!client) {
        return (
            <div className="client-preview flex items-center justify-center text-center h-full min-h-[400px] bg-white/80 dark:bg-white/5 backdrop-blur-lg p-6 rounded-lg shadow-sm border border-dashed border-gray-300 dark:border-white/10 mb-6">
                <p className="text-gray-500 dark:text-gray-400">{t('stats.selectClientPrompt')}</p>
            </div>
        );
    }

    const status = client.status ?? 'CLIENT';
    const statusColor = (ClientStatusColor as any)?.[status.toUpperCase()] ?? '#6B7280';
    const displayPhone = client.user_phones?.[0] ? IMask.pipe(client.user_phones[0].phone_number || '', { mask: client.user_phones[0].format || '' }) : t('common.notProvided');

    return (
        // 🎨 Conteneur principal avec effet verre dépoli
        <div className="client-preview bg-white/80 dark:bg-white/5 backdrop-blur-lg p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200/80 dark:border-white/10 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6 truncate" title={t('usersPage.details.title', { name: client.full_name || t('common.unknown') })}>
                {t('usersPage.details.title', { name: client.full_name || t('common.unknown') })}
            </h2>

            {/* Section Infos Client de Base */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 pb-6 mb-6 border-b border-gray-200/50 dark:border-white/10">
                <div className="relative flex-shrink-0">
                    <div
                        className="w-20 h-20 flex items-center justify-center font-bold text-gray-500 dark:text-gray-400 text-3xl rounded-full object-cover border-4 border-white/80 dark:border-gray-800/50 shadow-md bg-gray-200 dark:bg-gray-700"
                        style={{ background: getMedia({ isBackground: true, source: client.photo?.[0] }) }}
                    >
                        {!client.photo?.[0] && (client.full_name?.substring(0, 2).toUpperCase() || '?')}
                    </div>
                    <span className="absolute bottom-0 right-0 block h-4 w-4 rounded-full ring-2 ring-white dark:ring-gray-800/50" style={{ backgroundColor: statusColor }} title={t(`clientStatus.${status.toLowerCase()}`, status)}></span>
                </div>
                <div className="flex flex-col gap-1.5 flex-grow min-w-0 text-center md:text-left">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{client.full_name || t('common.anonymous')}</h3>
                    {client.email && (
                        // 🎨 Lien avec couleur `teal` au survol
                        <a href={`mailto:${client.email}`} className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 w-fit mx-auto md:mx-0 transition-colors">
                            <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <span className="truncate">{client.email}</span>
                        </a>
                    )}
                    {displayPhone !== t('common.notProvided') && (
                        <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <span className="truncate">{displayPhone}</span>
                        </div>
                    )}
                    {client.created_at && (
                        <p className='text-xs text-gray-500 dark:text-gray-500 mt-1'>
                            <span>{t('clientDetail.memberSinceLabel')}: </span> 
                            {DateTime.fromISO(client.created_at).setLocale(i18n.language).toLocaleString(DateTime.DATE_MED)}
                        </p>
                    )}
                </div>
            </div>

            {/* Section Stats Client Détaillées */}
            {client.stats ? (
                <div className="stats-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                    {clientStatsConfig.map((stat) => (
                        <StatCard
                            key={stat.key}
                            label={t(stat.labelKey)}
                            value={formatValue(client.stats?.[stat.key as keyof typeof client.stats], stat.type)}
                            icon={stat.icon}
                            colorClasses={{ light: stat.color.light, dark: stat.color.dark }}
                            // onClick={() => { /* Gérer la navigation ici si besoin */ }}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-4">{t('usersPage.details.noStatsAvailable')}</div>
            )}
        </div>
    );
};

export default ClientPreview;