// pages/index/HomeStat/HomeStat.tsx
// import './HomeStat.css'; // ❌ Supprimer l'import CSS

import { useEffect, useMemo, useRef, useState } from "react";
import { IoPeopleSharp, IoCart, IoEllipsisHorizontalSharp, IoEyeOff, IoEyeSharp } from "react-icons/io5";
import { Nuage } from "../Nuage"; // Garder Nuage
import MyChart from "../MiniChart"; // Garder MiniChart
import { useGetVisitDetails, useGetOrderDetailsStats } from "../../../api/ReactSublymusApi"; // ✅ Importer le hook
import { PeriodType, StatsData } from "../../../api/Interfaces/Interfaces";
import { useGlobalStore } from "../../index/StoreStore";
import { useTranslation } from "react-i18next"; // ✅ Importer useTranslation

export function HomeStat() {
    const { t } = useTranslation(); // ✅ Initialiser la traduction
    const [eye, setEye] = useState(false);
    const compteRef = useRef<HTMLSpanElement | null>(null); // Renommer pour clarté
    const [nuageW, setNuageW] = useState(100);
    const { currentStore } = useGlobalStore();
    // const { fetchStats } = useApp(); // Supprimer l'appel Zustand
    const [period, setPeriod] = useState<PeriodType>('month');
    // const [userStats, setUserStats] = useState<StatsData>(); // Géré par React Query
    const [openPeriod, setOpenPeriod] = useState(false);

    // ✅ Utiliser le hook React Query pour fetch les stats

    // Stats temporelles (visites, commandes, etc.)
    const {
        data: orderStatsData,
        isLoading: isLoadingOderStats,
        isError: isErrorVisit
    } = useGetOrderDetailsStats(
        {
            period: period
        },
        { enabled: !!currentStore }
    );
    const {
        data: visitStatsData,
        isLoading: isLoadingVisitStats,
        isError: isErrorOder
    } = useGetVisitDetails(
        {
            period: period
        },
        { enabled: !!currentStore }
    );
    // Calculer les totaux à partir des données de React Query
    const totalVisits = useMemo(() =>
        visitStatsData?.reduce((sum: any, day: any) => sum + (day.visits || 0), 0) ?? 0,
        [visitStatsData]
    );
    const totalOrders = useMemo(() =>
        orderStatsData?.reduce((sum: any, day: any) => sum + (day.orders_count || 0), 0) ?? 0,
        [orderStatsData]
    );

    // TODO: Ajouter la récupération du total du compte si nécessaire via une autre query/mutation

    // Gérer la largeur du nuage quand on cache/montre le montant
    const toggleEye = () => {
        const w = compteRef.current?.getBoundingClientRect().width || 100;
        setNuageW(w);
        setEye(!eye);
    };

    // Fermer la liste des périodes si on clique ailleurs
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Logique pour fermer si on clique hors du bouton et de la liste...
            // C'est souvent géré par une librairie UI (Headless UI, Radix) ou un hook personnalisé
            if (openPeriod /* && ne clique pas sur le bouton ou la liste */) {
                // setOpenPeriod(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openPeriod]);


    return (
        // Conteneur principal avec grid et breakpoints Tailwind
        <div className="w-full grid grid-cols-1 min-[420px]:grid-cols-2 gap-5 p-2 bg-gradient-to-br from-gray-50 to-slate-200/25 rounded-2xl">
            {/* Account Total Card - md:col-span-2 pour occuper toute la largeur sur md+ */}
            <div className="relative bg-white/95 shadow-md rounded-xl p-5 transition duration-100 ease-in-out min-[420px]:col-span-2">
                <div className="flex justify-between items-center mb-4">
                    {/* 🌍 i18n */}
                    <h3 className="text-slate-600 text-sm font-semibold flex items-center gap-1">
                        {t('dashboard.accountTotal')}
                    </h3>
                    <div className="relative"> {/* Conteneur relatif pour la liste absolue */}
                        <span
                            className="flex items-center gap-3 cursor-pointer text-sm no-select"
                            onClick={() => setOpenPeriod(!openPeriod)}
                            role="button" // Accessibilité
                            tabIndex={0} // Accessibilité
                            onKeyDown={(e) => e.key === 'Enter' && setOpenPeriod(!openPeriod)} // Accessibilité
                        >
                            {/* 🌍 i18n */}
                            <span className="period capitalize">{t(`dashboard.periods.${period}`, period)}</span> {/* Clé dynamique */}
                            <IoEllipsisHorizontalSharp className='text-lg text-slate-500 hover:text-slate-600 hover:scale-110 transition-transform' />
                        </span>
                        {/* Liste déroulante pour la période */}
                        <div
                            className={`absolute right-0 mt-2 w-28 bg-white shadow-lg rounded-xl p-3 z-50 flex flex-col gap-2 transition-all duration-200 ease-in-out ${openPeriod ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95'
                                }`}
                        // aria-hidden={!openPeriod}
                        >
                            {(['day', 'week', 'month'] as const).map(p => (
                                <button // Utiliser des boutons pour l'accessibilité
                                    key={p}
                                    onClick={() => { setPeriod(p); setOpenPeriod(false); }}
                                    // 🌍 i18n
                                    className={`capitalize font-normal text-sm text-left px-2 py-1 rounded hover:bg-gray-100 ${period === p ? 'text-blue-600 font-medium' : 'text-gray-700'}`}
                                >
                                    {t(`dashboard.periods.${p}`, p)} {/* Clé dynamique */}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-2.5">
                    <h1 className='text-2xl flex items-center gap-2.5 text-slate-800'>
                        {!eye ?
                            // TODO: Remplacer 295000 par la vraie valeur du compte
                            <span ref={compteRef}>{Number(295000).toLocaleString()} FCFA</span> :
                            <Nuage color='#3455' density={1} height={20} width={nuageW} speed={1} />}
                        <span className="cursor-pointer text-slate-500 hover:text-slate-600" onClick={toggleEye}>
                            {eye ? <IoEyeSharp size={20} /> : <IoEyeOff size={20} />}
                        </span>
                    </h1>
                </div>
                {/* Lien Voir plus (optionnel pour cette carte) */}
                {/* <a href="/billing" className="absolute bottom-2.5 right-5 text-sm text-blue-500 hover:text-blue-700 hover:underline no-underline">Détails</a> */}
            </div>

            {/* Visits Card */}
            <div className="relative bg-white/95 shadow-md rounded-xl p-5 transition duration-100 ease-in-out">
                <div className="flex justify-between items-center mb-4">
                    {/* 🌍 i18n */}
                    <h3 className="text-slate-600 text-sm font-semibold flex items-center gap-1">
                        <IoPeopleSharp className='w-5 h-5' /> {t('dashboard.visits')}
                    </h3>
                    {/* Optionnel: Bouton options si besoin */}
                </div>
                <div className="flex flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-4">
                        {isLoadingVisitStats && <span className="text-lg text-gray-500">{t('common.loading')}</span>}
                        {isErrorVisit && <span className="text-lg text-red-500">{t('common.error')}</span>}
                        {!isLoadingVisitStats && !isErrorVisit && <h2 className="text-lg font-semibold text-blue-700">{totalVisits}</h2>}
                        {/* Afficher le graphique seulement si données disponibles */}
                        {visitStatsData && visitStatsData.length > 0 &&
                            <MyChart datasets={visitStatsData.slice(-12).map(v => v.visits || 0)} />} {/* Prendre les 12 dernières? */}
                    </div>
                    {/* 🌍 i18n */}
                    <a href="/stats" className="absolute bottom-2.5 left-5 text-sm text-blue-500 hover:text-blue-700 hover:underline no-underline">{t('common.seeMore')}</a>
                </div>
            </div>

            {/* Orders Card */}
            <div className="relative bg-white/95 shadow-md rounded-xl p-5 transition duration-100 ease-in-out">
                <div className="flex justify-between items-center mb-4">
                    {/* 🌍 i18n */}
                    <h3 className="text-slate-600 text-sm font-semibold flex items-center gap-1">
                        <IoCart className='w-5 h-5' /> {t('dashboard.totalOrders')}
                    </h3>
                    {/* Optionnel: Bouton options si besoin */}
                </div>
                <div className="flex flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-4">
                        {isLoadingOderStats && <span className="text-lg text-gray-500">{t('common.loading')}</span>}
                        {isErrorOder && <span className="text-lg text-red-500">{t('common.error')}</span>}
                        {!isLoadingOderStats && !isErrorOder && <h2 className="text-lg font-semibold text-green-700">{totalOrders}</h2>}
                        {/* Afficher le graphique seulement si données disponibles */}
                        {orderStatsData && orderStatsData.length > 0 &&
                            <MyChart datasets={orderStatsData.slice(-12).map(v => v.orders_count || 0)} color='green' />} {/* Prendre les 12 dernières? */}
                    </div>
                    {/* 🌍 i18n */}
                    <a href="/stats" className="absolute bottom-2.5 left-5 text-sm text-blue-500 hover:text-blue-700 hover:underline no-underline">{t('common.seeMore')}</a>
                </div>
            </div>
        </div>
    );
}