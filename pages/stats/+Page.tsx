// pages/stores/stats/+Page.tsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next'; // i18n
import { usePageContext } from '../../renderer/usePageContext'; // Lire URL params

// Hooks API et Types
import {
    useGetKpis, useGetVisitDetails, useGetOrderDetailsStats,
    useGetUsers, useGetProduct, // Hooks pour les détails client/produit
} from '../../api/ReactSublymusApi'; // Ajustez le chemin

import {
    BaseStatsParams, VisitStatsIncludeOptions, OrderStatsIncludeOptions,
    StatsPeriod
} from "../../api/Interfaces/Interfaces";
// Composants UI
import StatsFilters from '../../Components/Stats/StatsFilters'; // Filtres
import KpiCards from '../../Components/Stats/KpiCards'; // KPIs
import ClientPreview from '../../Components/Stats/ClientPreview'; // Preview Client
import ProductPreview from '../../Components/Stats/ProductPreview'; // Preview Produit
import VisitStatsSection from '../../Components/Stats/VisitStatsSection'; // Stats Visites
import OrderStatsSection from '../../Components/Stats/OrderStatsSection'; // Stats Commandes
import { useMyLocation } from '../../Hooks/useRepalceState';
import { SlidersHorizontal } from 'lucide-react';
// Modal (useChildViewer est souvent dans un contexte global, pas besoin d'importer ici)
// import { useChildViewer } from '../../components/ChildViewer/useChildViewer';

// Valeurs par défaut (si nécessaire ici ou passées directement)
const defaultVisitIncludes: VisitStatsIncludeOptions = { browser: true, os: true, device: true, landing_page: true, referrer: true };
const defaultOrderIncludes: OrderStatsIncludeOptions = { status: true, payment_status: true, payment_method: true, with_delivery: true };
const defaultPeriod: StatsPeriod = 'month';
const defaultCounts: Record<StatsPeriod, number> = { day: 7, week: 4, month: 3 };


export function Page() {
    const { t } = useTranslation(); // i18n
    const pageContext = usePageContext(); // Pour lire les paramètres initiaux de l'URL
    const { nextPage } = useMyLocation()
    // --- État des Filtres ---
    // Filtres contrôlés par l'utilisateur VIA StatsFilters ou sélection modale
    const [period, setPeriod] = useState<StatsPeriod>(defaultPeriod);
    const [count, setCount] = useState<number>(defaultCounts[defaultPeriod]);
    const [customEndDate, setCustomEndDate] = useState<string | undefined>(undefined); // ISO String

    // IDs venant de l'URL ou sélection modale -> impactent les requêtes
    const [userId, setUserId] = useState<string | undefined>(pageContext.routeParams?.client_id); // Initialiser depuis l'URL
    const [productId, setProductId] = useState<string | undefined>(() => !userId ? pageContext.routeParams?.product_id : undefined); // Initialiser depuis URL SEULEMENT si pas de client_id

    // Noms pour affichage dans StatsFilters (mis à jour par les hooks useGetUsers/useGetProduct)
    const [selectedUserName, setSelectedUserName] = useState<string | undefined>(undefined);
    const [selectedProductName, setSelectedProductName] = useState<string | undefined>(undefined);

    // Options d'inclusion
    const [visitIncludes, setVisitIncludes] = useState<VisitStatsIncludeOptions>(defaultVisitIncludes);
    const [orderIncludes, setOrderIncludes] = useState<OrderStatsIncludeOptions>(defaultOrderIncludes);

    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // --- Effet pour synchroniser l'état avec les paramètres URL ---
    useEffect(() => {
        // Lire depuis l'URL (qui peut changer via navigation ou sélection modale)
        const urlParams = new URLSearchParams(window.location.search);
        const clientIdFromUrl = urlParams.get('client_id') || undefined;
        const productIdFromUrl = urlParams.get('product_id') || undefined;

        // Appliquer la priorité client > produit
        const effectiveUserId = clientIdFromUrl;
        const effectiveProductId = effectiveUserId ? undefined : productIdFromUrl; // Efface productId si clientId est présent

        // Mettre à jour l'état local SEULEMENT si nécessaire pour éviter boucle infinie
        if (effectiveUserId !== userId) {
            setUserId(effectiveUserId);
            setSelectedUserName(undefined); // Réinitialiser le nom affiché
        }
        if (effectiveProductId !== productId) {
            setProductId(effectiveProductId);
            setSelectedProductName(undefined); // Réinitialiser le nom affiché
        }
        // TODO: Lire aussi period/count/end_at/includes depuis l'URL si on veut les persister dans l'URL? Pour l'instant, non.

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageContext.urlPathname, pageContext.urlOriginal]); // Déclenché par changement d'URL Vike


    // --- Construction des paramètres pour les Hooks API ---
    const baseParams = useMemo<BaseStatsParams>(() => ({
        period,
        count,
        end_at: customEndDate,
        // Appliquer userId ou productId aux requêtes API en fonction de l'état actuel
        user_id: userId,
        product_id: productId,
    }), [period, count, customEndDate, userId, productId]); // Dépend des états

    const visitQueryParams = useMemo(() => ({
        ...baseParams,
        // Ne pas inclure product_id dans les params de visite car non pertinent
        product_id: undefined,
        include: visitIncludes,
    }), [baseParams, visitIncludes]);

    const orderQueryParams = useMemo(() => ({
        ...baseParams,
        include: orderIncludes,
    }), [baseParams, orderIncludes]);

    // KPIs sont généralement globaux ou basés sur les filtres temporels seulement
    const kpiQueryParams = useMemo(() => ({
        period: baseParams.period,
        count: baseParams.count,
        end_at: baseParams.end_at,
        // Exclure user_id/product_id ici sauf si l'API KPI les supporte
    }), [baseParams.period, baseParams.count, baseParams.end_at]);


    // --- Appels API via React Query Hooks ---
    // Hook pour les KPIs (toujours appelé, potentiellement ignoré dans l'affichage si preview)
    const { data: kpiData, isLoading: isKpiLoading, isError: isKpiError, error: kpiError } = useGetKpis(kpiQueryParams);

    // Hook pour les détails du client sélectionné (activé seulement si userId est défini)
    const { data: selectedUserData, isLoading: isLoadingUser } = useGetUsers(
        { user_id: userId, with_client_role: true, with_client_stats: true, with_phones: true, limit: 1 }, // Inclure stats/phones pour la preview
        { enabled: !!userId } // Activer seulement si on a un userId
    );
    const selectedClient = selectedUserData?.list?.[0]; // Extraire l'objet client

    // Hook pour les détails du produit sélectionné (activé seulement si productId est défini)
    const { data: selectedProductData, isLoading: isLoadingProduct } = useGetProduct(
        { product_id: productId, with_feature: true }, // Pas besoin des features pour la preview simple
        { enabled: !!productId } // Activer seulement si on a un productId
    );
    const selectedProduct = selectedProductData; // C'est directement l'objet produit

    // Hook pour les stats de visites (activé sauf si on affiche un produit seul)
    const { data: visitDetailsData, isLoading: isVisitDetailsLoading, isError: isVisitDetailsError, error: visitDetailsError } = useGetVisitDetails(
        visitQueryParams,
        // Activer SAUF si on a un productId (car visites non liées à un produit)
        { enabled: !productId }
    );

    // Hook pour les stats de commandes (toujours activé, mais filtré par userId/productId si défini dans baseParams)
    const { data: orderDetailsData, isLoading: isOrderDetailsLoading, isError: isOrderDetailsError, error: orderDetailsError } = useGetOrderDetailsStats(
        orderQueryParams
    );


    // --- Effet pour mettre à jour les noms affichés dans StatsFilters ---
    useEffect(() => {
        setSelectedUserName(selectedClient?.full_name);
    }, [selectedClient]);
    useEffect(() => {
        setSelectedProductName(selectedProduct?.name);
    }, [selectedProduct]);


    // --- Gestion des états globaux de chargement/erreur ---
    // Combine les états des requêtes pertinentes en fonction du contexte (client/produit/global)
    const isLoading = useMemo(() => {
        if (userId) return isKpiLoading || isLoadingUser || isVisitDetailsLoading || isOrderDetailsLoading;
        if (productId) return isKpiLoading || isLoadingProduct || isOrderDetailsLoading;
        return isKpiLoading || isVisitDetailsLoading || isOrderDetailsLoading;
    }, [userId, productId, isKpiLoading, isLoadingUser, isLoadingProduct, isVisitDetailsLoading, isOrderDetailsLoading]);

    const isError = isKpiError || isVisitDetailsError || isOrderDetailsError; // Simplifié, affiner si besoin
    const error = kpiError || visitDetailsError || orderDetailsError;


    // --- Handlers pour la mise à jour des filtres (passés à StatsFilters) ---
    // Les setters simples (setPeriod, setCount, setCustomEndDate, setVisitIncludes, setOrderIncludes) sont directement passés.
    // Handlers pour Client/Produit qui modifient l'URL (déclenchant le useEffect de synchro)
    const handleSetUserId = useCallback((newUserId: string | undefined) => {
        const urlParams = new URLSearchParams(window.location.search);
        if (newUserId) {
            urlParams.set('client_id', newUserId);
            urlParams.delete('product_id'); // Priorité client
        } else {
            urlParams.delete('client_id');
        }
        // Navigue vers la même page mais avec les nouveaux query params
        nextPage(`${window.location.pathname}?${urlParams.toString()}`);
        // L'état local `userId` sera mis à jour par le useEffect de synchro URL
    }, []);

    const handleSetProductId = useCallback((newProductId: string | undefined) => {
        const urlParams = new URLSearchParams(window.location.search);
        if (newProductId && !urlParams.get('client_id')) { // Appliquer seulement si pas de client_id
            urlParams.set('product_id', newProductId);
        } else {
            urlParams.delete('product_id');
        }
        nextPage(`${window.location.pathname}?${urlParams.toString()}`);
        // L'état local `productId` sera mis à jour par le useEffect de synchro URL
    }, []);
    const filter = <StatsFilters
        period={period}
        setPeriod={setPeriod} // Passer le setter direct
        count={count}
        setCount={setCount} // Passer le setter direct
        customEndDate={customEndDate}
        setCustomEndDate={setCustomEndDate} // Passer le setter direct
        userId={userId}
        setUserId={handleSetUserId} // Utiliser le handler qui modifie l'URL
        selectedUserName={selectedUserName} // Passer le nom pour affichage
        productId={productId}
        setProductId={handleSetProductId} // Utiliser le handler qui modifie l'URL
        selectedProductName={selectedProductName} // Passer le nom pour affichage
        visitIncludes={visitIncludes}
        setVisitIncludes={setVisitIncludes} // Passer le setter direct
        orderIncludes={orderIncludes}
        setOrderIncludes={setOrderIncludes} // Passer le setter direct
    />
    // --- Rendu ---
    return (
        <div className="page-stats  pb-[200px]  flex  flex-col lg:flex-row min-h-screen">

            <aside className="hidden lg:block lg:w-60 min-w-60 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto  shadow">
                <div className="">
                    {filter}
                </div>
            </aside>


            {/* Mobile toggle button */}
            <div className="lg:hidden p-4">
                <button
                    onClick={() => setIsMobileOpen(true)}
                    className="flex items-center gap-2 px-3 py-2  rounded cursor-pointer shadow-sm  hover:shadow-md bg-white"
                >
                    <SlidersHorizontal className="w-5 h-5" />
                    Filtres
                </button>
            </div>

            <div
                className={`fixed inset-0 z-50 transition-opacity duration-300 ${isMobileOpen ? "bg-black/40 pointer-events-auto opacity-100" : "opacity-0 pointer-events-none"
                    } lg:hidden`}
                onClick={() => setIsMobileOpen(false)}
            >
                <div
                    className={`absolute top-0 left-0 h-full w-80 bg-white shadow transition-transform duration-300 transform ${isMobileOpen ? "translate-x-0" : "-translate-x-full"
                        }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center p-4 border-b">
                        <h2 className="text-lg font-semibold">Filtres</h2>
                        <button onClick={() => setIsMobileOpen(false)} className="text-gray-500 hover:text-black">
                            ✕
                        </button>
                    </div>
                    <div className="p-4">
                        {filter}
                    </div>
                </div>
            </div>
            <div className="relative p-2   min-h-screen">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white/80 mb-6">{t('stats.pageTitle')}</h1>
                {/* Sidebar desktop */}


                {/* Affichage principal (KPIs ou Preview) */}
                <div className="mt-6 w-full"> {/* Espacement après les filtres */}

                    {/* Condition pour afficher Client Preview OU Product Preview OU KPIs */}
                    {userId ? (
                        // Afficher Client Preview si un client est sélectionné
                        <ClientPreview isLoading={isLoading} client={selectedClient} />
                    ) : productId ? (
                        // Afficher Product Preview si un produit est sélectionné (et pas de client)
                        selectedProduct && <ProductPreview isLoading={isLoading} product={selectedProduct} />
                    ) : (
                        // Afficher KPIs si aucun client/produit n'est sélectionné
                        <KpiCards isLoading={isLoading} kpis={kpiData} />
                    )}
                </div>

                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6"> {/* Grille pour les sections Visites/Commandes */}

                    {/* Section Visites (conditionnelle) */}
                    {/* Ne pas afficher si on filtre par produit OU si loading/erreur */}
                    {!productId && !isError && (
                        <VisitStatsSection
                        isLoading={isLoading}
                            data={visitDetailsData}
                            period={period}
                            includes={visitIncludes}
                        />
                    )}
                    {/* Placeholder si section cachée par filtre produit mais pas de client */}
                    {productId && !userId && (
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-full flex items-center justify-center text-gray-400 italic">
                            {t('stats.visitStatsHiddenForProduct')}
                        </div>
                    )}

                    {/* Section Commandes (toujours affichée sauf si erreur/loading) */}
                    { !isError && (
                        <OrderStatsSection
                            isLoading={isLoading}
                            data={orderDetailsData}
                            period={period}
                            includes={orderIncludes}
                        />
                    )}

                    {/* Gérer le cas où la grille n'a qu'un seul enfant à cause du filtre productId */}
                    {/* Pourrait nécessiter d'ajuster les classes de la grille parente si nécessaire */}

                </div>
                {/* ChildViewer est global via son propre provider/hook, pas besoin de le rendre ici */}
            </div>
        </div>
    );
}