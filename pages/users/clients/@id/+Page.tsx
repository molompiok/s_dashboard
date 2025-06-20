// pages/users/clients/@id/+Page.tsx
// ❌ Supprimer les imports CSS

import { useEffect, useRef, useState, useMemo } from 'react';
import { PeriodType, StatsData, UserInterface } from '../../../../api/Interfaces/Interfaces'; // Garder Interfaces
import { CommandeList } from '../../../../Components/CommandesList/CommandesList'; // Garder CommandeList
import { Mail, Phone, Star, ShoppingCart, MessageCircle, CreditCard, CalendarClock, UserCircle } from 'lucide-react'; // Utiliser Lucide
import { usePageContext } from '../../../../renderer/usePageContext';
import { getTransmit, useGlobalStore } from '../../../../api/stores/StoreStore'; // Garder Store
// import { useClientStore } from '../ClientStore'; // Remplacé par hooks API
import { useGetUsers, useGetVisitDetails, useGetOrderDetailsStats } from '../../../../api/ReactSublymusApi'; // ✅ Importer hooks API
import IMask from 'imask';
import { getMedia } from '../../../../Components/Utils/StringFormater';
import { ClientStatusColor, NO_PICTURE } from '../../../../Components/Utils/constants'; // Garder couleurs statut
// import { useApp } from '../../../../renderer/AppStore/UseApp'; // Supprimé
import StatsChart from '../../../../Components/UserStatsChart/UserStatsChart'; // Garder StatsChart
import { BreadcrumbItem, Topbar } from '../../../../Components/TopBar/TopBar'; // Garder Topbar
import { useTranslation } from 'react-i18next'; // ✅ i18n
import logger from '../../../../api/Logger';
import { queryClient } from '../../../../api/ReactSublymusApi'; // Pour invalidation SSE
import { DateTime } from 'luxon'; // Pour dates
import { PageNotFound } from '../../../../Components/PageNotFound/PageNotFound'; // Pour 404
import { useMyLocation } from '../../../../Hooks/useRepalceState';
import { cardStyleSimple } from '../../../../Components/Button/Style';
import { StateDisplay } from '../../../../Components/StateDisplay/StateDisplay';
import { IoWarningOutline } from 'react-icons/io5';

export { Page };

function Page() {
    const { t, i18n } = useTranslation(); // ✅ i18n
    const { routeParams } = usePageContext();
    const { currentStore } = useGlobalStore();
    const userId = routeParams?.['id'];
    const { nextPage } = useMyLocation()
    // --- State ---
    const [period, setPeriod] = useState<PeriodType>('month');
    const listMarkerRef = useRef<HTMLDivElement | null>(null);

    // --- API Data Fetching ---
    // Client Info + Stats embarquées
    const {
        data: userData,
        isLoading: isLoadingUser,
        isError: isUserError,
        error: userError
    } = useGetUsers(
        { // Filtre pour récupérer UN utilisateur avec ses stats
            user_id: userId,
            with_client_role: true, // S'assurer qu'on récupère un client
            with_client_stats: true, // Demander toutes les stats client
            // with_phones: true,
            // with_addresses:true
        },
        { enabled: !!userId && !!currentStore }
    );
    const user = userData?.list?.[0]; // Récupérer le premier utilisateur de la liste

    // Stats temporelles (visites, commandes, etc.)
    const {
        data: orderStatsData,
        isLoading: isLoadingOderStats
    } = useGetOrderDetailsStats(
        {
            user_id: userId,
            period: period
        },
        { enabled: !!userId && !!currentStore }
    );
    const {
        data: visitStatsData =[],
        isLoading: isLoadingVisitStats
    } = useGetVisitDetails(
        {
            user_id: userId,
            period: period
        },
        { enabled: !!userId && !!currentStore }
    );

    // Logique SSE pour mettre à jour les données si une nouvelle commande arrive pour ce client
    useEffect(() => {
        if (!currentStore?.api_url || !userId) return;
        const transmit = getTransmit(currentStore.api_url);
        const channel = `store/${currentStore.id}/new_command`; // Ou un canal spécifique user?
        logger.info(`Subscribing to SSE channel for potential user updates: ${channel}`);
        const subscription = transmit?.subscription(channel);
        async function subscribe() {
            if (!subscription) return;
            try {
                await subscription.create();
                subscription.onMessage<any>((data) => { // Type générique car on ne connaît pas le format exact
                    // Si une nouvelle commande arrive, invalider les données user (pour recalcul des stats) et les stats temporelles
                    logger.info(`Received SSE command event, invalidating user ${userId} data`);
                    queryClient.invalidateQueries({ queryKey: ['users', { user_id: userId }] });
                    queryClient.invalidateQueries({ queryKey: ['stats', { user_id: userId }] });
                });
            } catch (err) {
                logger.error({ channel, userId, error: err }, "Failed to subscribe to user update SSE channel");
            }
        }
        subscribe();
        return () => {
            logger.info(`Unsubscribing from SSE channel: ${channel}`);
            subscription?.delete();
        };
    }, [currentStore?.id, currentStore?.api_url, userId]);

    // --- Handlers ---
    const focusCommands = () => {
        const page = document.querySelector('#page-container'); // Sélecteur à adapter si besoin
        const target = listMarkerRef.current;
        if (!page || !target) return;
        // Calcul plus robuste de la position
        const targetOffsetTop = target.offsetTop;
        const pageScrollTop = page.scrollTop;
        const topbarHeight = 64; // Hauteur approx de la Topbar (à ajuster)
        const scrollToPosition = targetOffsetTop - topbarHeight - 20; // Scroll un peu au-dessus

        page.scrollTo({ top: scrollToPosition, behavior: 'smooth' });
    };

    // --- Rendu ---
    const isLoading = isLoadingUser || isLoadingOderStats || isLoadingVisitStats;

     if (isLoadingUser || !currentStore) {
        return <ClientDetailPageSkeleton />;
    }

    // 2. État d'Erreur (404, 403, 500, etc.) ou utilisateur non trouvé
    if (isUserError || !user) {
        // Déterminer le type d'erreur pour un message plus précis
        const isNotFound = userError?.status === 404 || !user;
        const title = isNotFound ? t('clientDetail.notFoundTitle') : t('common.errorGeneric.title');
        const description = isNotFound ? t('clientDetail.notFoundDesc') : (userError?.message || t('common.errorGeneric.genericDesc'));

        const breadcrumbs: BreadcrumbItem[] = [
            { name: t('navigation.home'), url: '/' },
            { name: t('navigation.clients'), url: '/users/clients' },
            { name: title },
        ];
        
        return (
            <div className="w-full min-h-screen flex flex-col">
                <Topbar back breadcrumbs={breadcrumbs} />
                <main className="flex-grow flex items-center justify-center p-4">
                    <StateDisplay
                        variant="danger"
                        icon={IoWarningOutline}
                        title={title}
                        description={description}
                    >
                        {/* Le CTA est de retourner à la liste des clients */}
                        <a
                            href="/users/clients"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                        >
                            {t('clientDetail.backToList')}
                        </a>
                    </StateDisplay>
                </main>
            </div>
        );
    }    // Masquer téléphone
    const maskedPhone = user.user_phones?.[0] ? IMask.pipe(user.user_phones?.[0]?.phone_number || '', { mask: user.user_phones?.[0]?.format || '' }) : t('common.notProvided');
    // Statut client
    const statusColor = (ClientStatusColor as any)[user.status || 'CLIENT'] ?? '#6B7280'; // Fallback gris

    // Données pour les StatCards
    const statCardsData = [
        { icon: Star, row: true, labelKey: "usersPage.details.avgRating", value: `${user.stats?.avgRating?.toFixed(1) ?? '-'} / 5`, colorClass: "text-yellow-500", onClick: () => nextPage(`/users/clients/${userId}/comments`) },
        { icon: MessageCircle, row: true, labelKey: "usersPage.details.commentsCount", value: user.stats?.commentsCount ?? 0, colorClass: "text-blue-500", onClick: () => nextPage(`/users/clients/${userId}/comments`) },
        { icon: ShoppingCart, row: true, labelKey: "usersPage.details.productsBought", value: user.stats?.productsBought ?? 0, colorClass: "text-green-500", onClick: focusCommands },
        { icon: CreditCard, row: true, labelKey: "usersPage.details.ordersCount", value: user.stats?.ordersCount ?? 0, colorClass: "text-purple-500", onClick: focusCommands },
        { icon: CalendarClock, labelKey: "usersPage.details.lastVisit", value: user.stats?.lastVisit ? DateTime.fromISO(user.stats.lastVisit).setLocale(i18n.language).toRelative() : '-', colorClass: "text-rose-500" }, // Afficher en relatif
        { icon: CreditCard, labelKey: "usersPage.details.totalSpent", value: `${Number(user.stats?.totalSpent ?? 0).toLocaleString()} ${currentStore?.currency || 'FCFA'}`, colorClass: "text-emerald-500" },
    ];

    console.log(user.stats, statCardsData);

 const sectionCardStyle = "bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-xl shadow-sm border border-gray-200/80 dark:border-white/10";

    return (
        <div className="user-recap-container pb-[200px] w-full flex flex-col min-h-screen">
            <Topbar back={true} title={t('clientDetail.pageTitle', { name: user.full_name })} />
            <main className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">

                {/* Carte Utilisateur */}
                <div className={`user-card ${sectionCardStyle} flex flex-col md:flex-row items-center md:items-start gap-6 p-4 sm:p-6`}>
                    {/* Photo */}
                    <div className="relative flex-shrink-0">
                        <div
                            className="w-24 h-24 flex items-center justify-center font-bold text-gray-500 dark:text-gray-400 text-4xl rounded-full object-cover border-4 border-white/80 dark:border-gray-800/50 shadow-md bg-gray-200 dark:bg-gray-700"
                            style={{ background: getMedia({ isBackground: true, source: user.photo?.[0], from: 'api' }) }}
                        >
                            {!user.photo?.[0] && (user.full_name?.substring(0, 2).toUpperCase() || '?')}
                        </div>

                        {/* Statut Badge */}
                        <span
                            className="absolute bottom-1 right-1 block h-4 w-4 rounded-full ring-2 ring-white dark:ring-gray-800/50"
                            style={{ backgroundColor: statusColor }}
                            title={t(`clientStatus.${user.status?.toLowerCase() || 'client'}`, user.status)}
                        ></span>
                    </div>

                    {/* Infos */}
                    <div className="user-info flex flex-col gap-1.5 flex-grow min-w-0 text-center md:text-left">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">{user.full_name}</h2>
                        {user.email && (
                            <a href={`mailto:${user.email}`} className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 w-fit mx-auto md:mx-0 transition-colors">
                                <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                <span className="truncate">{user.email}</span>
                            </a>
                        )}
                        {maskedPhone && (
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center md:justify-start gap-1 sm:gap-4">
                                <a href={`tel:${maskedPhone}`} className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400">
                                    <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                    <span className="truncate">{maskedPhone}</span>
                                </a>
                                <div className="flex items-center justify-center md:justify-start gap-2 mt-1 sm:mt-0">
                                    <a href={`tel:${maskedPhone}`} title={t('order.callAction')} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><img src={'/res/social/telephone.png'} alt="Call" className="w-6 h-6" /></a>
                                    <a href={`https://wa.me/${maskedPhone}`} title={t('order.whatsappAction')} target="_blank" rel="noreferrer" className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><img src={'/res/social/social.png'} alt="WhatsApp" className="w-6 h-6" /></a>
                                    <a href={`https://t.me/${maskedPhone}`} title={t('order.telegramAction')} target="_blank" rel="noreferrer" className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><img src={'/res/social/telegram.png'} alt="Telegram" className="w-6 h-6" /></a>
                                </div>
                            </div>
                        )}
                        <div className="user-card-foot flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-2">
                            <p><span>{t('clientDetail.statusLabel')}:</span> <strong className='px-2 py-0.5 rounded-full text-xs' style={{ backgroundColor: `${statusColor}33`, color: statusColor }}>{t(`clientStatus.${user.status?.toLowerCase() || 'client'}`, user.status)}</strong></p>
                            <p><span>{t('clientDetail.memberSinceLabel')}:</span> {DateTime.fromISO(user.created_at || '').setLocale(i18n.language).toLocaleString(DateTime.DATE_MED)}</p>
                        </div>
                    </div>
                </div>

                {/* Grille Statistiques */}
                <div className="stats-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {statCardsData.map((stat) => <StatCard key={stat.labelKey}  {...stat} />)}
                </div>

                {/* Section Graphique Visites/Commandes */}
                <div className={`${sectionCardStyle} p-4 sm:p-6`}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('clientDetail.activityChartTitle')}</h3>
                        <div className="periods flex items-center gap-1 bg-gray-100/60 dark:bg-black/20 rounded-lg p-1">
                            {(['day', 'week', 'month'] as const).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 ${p === period ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-300 border-transparent hover:bg-white/80 dark:hover:bg-white/10'}`}
                                >
                                    {t(`dashboard.periods.${p}`)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-64">
                        <StatsChart
                            period={period}
                            data={{
                                order_stats: orderStatsData || [],
                                visits_stats: visitStatsData || []
                            }}
                            setAvailable={() => {}}
                            setResume={() => {}}
                        />
                    </div>
                </div>

                <div ref={listMarkerRef}></div>

                {/* Liste des Commandes du Client */}
                <CommandeList user_id={userId} />

            </main>
        </div>
    );
}

// --- Composant StatCard ---
interface StatCardProps {
    icon: React.ElementType; // Accepter le composant icône Lucide
    labelKey: string;
    value?: React.ReactNode;
    row?: boolean;
    onClick?: () => void;
    colorClass?: string; // Classe Tailwind pour la couleur de l'icône
}

function StatCard({ icon: Icon, labelKey, value, onClick, colorClass = "text-gray-500" }: StatCardProps) {
    const { t } = useTranslation();
    const row = false
    return (
        <div
            className={`stat-card bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between transition hover:shadow-md ${cardStyleSimple} ${onClick ? 'cursor-pointer hover:border-blue-200 hover:bg-blue-50/30' : ''}`}
            onClick={onClick}
        >
            {/* Organisation flexible pour row ou colonne */}
            <div className={`stat-label h-full flex items-center gap-2 ${row ? 'justify-between' : 'flex-col items-start text-left'}`}>
                {/* Icône et Label */}
                <div className={`flex items-center flex-wrap gap-2 ${row ? '' : 'mb-1'}`}>
                    <Icon className={`w-4 h-4 flex-shrink-0 ${colorClass}`} strokeWidth={2} />
                    <span className="text-sm font-medium text-gray-600 dark:text-white/80">{t(labelKey)}</span>
                </div>
                {/* Valeur (si row) */}
                {row && <div className="stat-value text-sm max-[480px]:hidden font-semibold text-gray-900dark:text-white  whitespace-nowrap">{value ?? '-'}</div>}
            </div>
            {/* Valeur (si pas row) */}
            <div className={`stat-value ${row ? 'min-[480px]:hidden' : ''} text-base font-bold text-gray-900 dark:text-white mt-1`}>{value ?? '-'}</div>
        </div>
    );
}



// Ce composant interne imite une carte "verre dépoli" du skeleton
const SkeletonCard = ({ children, className = '' }: { children?: React.ReactNode; className?: string }) => (
    <div className={`bg-gray-100/80 dark:bg-white/5 rounded-xl border border-gray-200/50 dark:border-white/10 p-4 sm:p-6 ${className}`}>
        {children}
    </div>
);

export function ClientDetailPageSkeleton() {
    return (
        <div className="w-full min-h-screen flex flex-col animate-pulse">
            <Topbar back title="..." />

            <main className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
                {/* Squelette de la carte utilisateur */}
                <SkeletonCard className="flex flex-col md:flex-row items-center md:items-start gap-6">
                    <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0"></div>
                    <div className="flex-grow w-full space-y-3">
                        <div className="h-7 w-1/2 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                        <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-600 rounded-md"></div>
                        <div className="h-4 w-2/3 bg-gray-300 dark:bg-gray-600 rounded-md"></div>
                    </div>
                </SkeletonCard>
                
                {/* Squelette des cartes de stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <SkeletonCard key={i} className="h-24"></SkeletonCard>
                    ))}
                </div>

                {/* Squelette du graphique */}
                <SkeletonCard>
                    <div className="flex justify-between items-center mb-4">
                        <div className="h-6 w-1/3 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                        <div className="h-8 w-1/4 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                    <div className="h-64 bg-gray-200 dark:bg-gray-700/50 rounded-lg"></div>
                </SkeletonCard>

                {/* Squelette de la liste de commandes */}
                <div className="h-8 w-1/2 bg-gray-300 dark:bg-gray-600 rounded-lg mt-4"></div>
                 <div className="flex flex-col gap-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <SkeletonCard key={i} className="h-20"></SkeletonCard>
                    ))}
                </div>
            </main>
        </div>
    );
}