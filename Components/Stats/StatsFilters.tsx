// components/Stats/StatsFilters.tsx
import React, { useState, useRef, useEffect } from 'react';
import { DateTime } from 'luxon';
import { StatsPeriod, VisitStatsIncludeOptions, OrderStatsIncludeOptions } from '../../api/Interfaces/Interfaces';
import { useChildViewer } from '../ChildViewer/useChildViewer';
import { ChildViewer } from '../ChildViewer/ChildViewer';
import UserSearchAndSelect from './StatsPopup/UserSearchAndSelect';
import ProductSearchAndSelect from './StatsPopup/ProductSearchAndSelect';
import { IoCloseSharp, IoChevronUp, IoChevronDown } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';
import { optionActiveStyle, optionStyle } from '../Button/Style';

// Constants
const defaultCounts: Record<StatsPeriod, number> = { day: 7, week: 4, month: 3 };
const VALID_STATS_PERIODS: StatsPeriod[] = ['day', 'week', 'month'];
const visitIncludeLabels: Record<keyof VisitStatsIncludeOptions, string> = { browser: 'Navigateur', os: 'OS', device: 'Appareil', landing_page: 'Page URL', referrer: 'Referrer' };
const orderIncludeLabels: Record<keyof OrderStatsIncludeOptions, string> = { status: 'Statut', payment_status: 'Statut paiement', payment_method: 'Méthode paiement', with_delivery: 'Livraison' };

interface StatsFiltersProps {
    period: StatsPeriod;
    setPeriod: (period: StatsPeriod) => void;
    count: number;
    setCount: (count: number) => void;
    customEndDate: string | undefined;
    setCustomEndDate: (date: string | undefined) => void;
    userId: string | undefined;
    setUserId: (userId: string | undefined) => void;
    selectedUserName?: string;
    productId: string | undefined;
    setProductId: (productId: string | undefined) => void;
    selectedProductName?: string;
    visitIncludes: VisitStatsIncludeOptions;
    setVisitIncludes: (includes: VisitStatsIncludeOptions) => void;
    orderIncludes: OrderStatsIncludeOptions;
    setOrderIncludes: (includes: OrderStatsIncludeOptions) => void;
}

const StatsFilters: React.FC<StatsFiltersProps> = ({
    period, setPeriod, count, setCount,
    customEndDate, setCustomEndDate,
    userId, setUserId, selectedUserName,
    productId, setProductId, selectedProductName,
    visitIncludes, setVisitIncludes,
    orderIncludes, setOrderIncludes,
}) => {
    const { t } = useTranslation();
    const { openChild } = useChildViewer();

    // L'état pour le nombre n'a pas besoin de logique d'animation complexe ici.
    // La simplicité est souvent préférable.

    const handleOpenUserSelect = () => {
        openChild(
            <ChildViewer title={t('stats.selectClientTitle')}>
                <UserSearchAndSelect
                    onClientSelected={(client) => { setUserId(client?.id); openChild(null); }}
                    currentSelectedUserId={userId}
                    onClose={() => openChild(null)}
                />
            </ChildViewer>,
            { background: 'rgba(30, 41, 59, 0.7)', blur: 4 }
        );
    };

    const handleOpenProductSelect = () => {
        openChild(
            <ChildViewer title={t('stats.selectProductTitle')}>
                <ProductSearchAndSelect
                    onProductSelected={(product) => { setProductId(product?.id); openChild(null); }}
                    currentSelectedProductId={productId}
                    onClose={() => openChild(null)}
                />
            </ChildViewer>,
            { background: 'rgba(30, 41, 59, 0.7)', blur: 4 }
        );
    };

    const handlePeriodChange = (newPeriod: StatsPeriod) => {
        setPeriod(newPeriod);
        setCount(defaultCounts[newPeriod]);
    };

    // 🎨 Utilisation de Partial<T> pour une mise à jour plus propre et type-safe
    const handleVisitIncludeChange = (key: keyof VisitStatsIncludeOptions) => {
        //@ts-ignore
        setVisitIncludes(prev => ({ ...prev, [key]: !prev[key] }));
    };
    const handleOrderIncludeChange = (key: keyof OrderStatsIncludeOptions) => {
        //@ts-ignore
        setOrderIncludes(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        // 🎨 Conteneur principal avec effet verre dépoli pour le mode nuit
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-lg p-4 rounded-lg shadow-sm border border-gray-200/80 dark:border-white/10 mb-6">
            <div className="flex flex-col gap-6">
                <h2 className="text-lg font-semibold dark:text-white">Filtres</h2>

                {/* --- Groupe Période et Nombre --- */}
                <div className="hidden lg:flex flex-wrap gap-x-6 gap-y-4 items-end">
                    {/* Filtre Période */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{t('stats.periodLabel')}</label>
                        <div className="flex flex-wrap gap-2 rounded-lg p-1 bg-gray-100/60 dark:bg-gray-900/20">
                            {VALID_STATS_PERIODS.map(p => (
                                <button
                                    key={p} onClick={() => handlePeriodChange(p)}
                                    // 🎨 Styles des boutons avec `teal` comme couleur d'accentuation
                                    className={p === period
                                        ? optionActiveStyle : optionStyle}>
                                    {t(`stats.periods.${p}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filtre Nombre de Périodes */}
                    <div>
                        <label htmlFor="count" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{t('stats.countLabel')}</label>
                        <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden w-fit bg-white dark:bg-gray-800/50">
                            <button onClick={() => setCount(Math.max(1, count - 1))} disabled={count <= 1} className="px-3 py-2 text-gray-600 dark:text-gray-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700/60 transition">
                                <IoChevronDown className="w-4 h-4" />
                            </button>
                            <div className="px-4 py-1.5 text-sm font-semibold text-gray-800 dark:text-gray-100 border-x border-gray-300 dark:border-gray-600">
                                {count}
                            </div>
                            <button onClick={() => setCount(count + 1)} className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition">
                                <IoChevronUp className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- Groupe Sélection Client et Produit --- */}
                <div className="flex flex-wrap gap-x-6 gap-y-4 items-center">
                    {/* Filtre Sélection Client */}
                    <div className="relative w-full sm:w-52">
                        <label htmlFor="select-client-filter" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{t('stats.clientLabel')}</label>
                        {/* 🎨 Bouton de sélection avec style d'input */}
                        <div id="select-client-filter" onClick={handleOpenUserSelect}
                            className="flex items-center justify-between w-full px-3 py-2 bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm cursor-pointer hover:border-teal-400 dark:hover:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm transition-colors">
                            <span className="truncate text-gray-800 dark:text-gray-200">
                                {userId && selectedUserName ? selectedUserName : t('stats.selectClientPlaceholder')}
                            </span>
                            {userId && (
                                <button onClick={(e) => { e.stopPropagation(); setUserId(undefined); }} className="flex items-center justify-center w-5 h-5 ml-2 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                                    <IoCloseSharp className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filtre Sélection Produit */}
                    <div className="relative w-full sm:w-52">
                        <label htmlFor="select-product-filter" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{t('stats.productLabel')}</label>
                        <div id="select-product-filter" onClick={handleOpenProductSelect}
                            className="flex items-center justify-between w-full px-3 py-2 bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm cursor-pointer hover:border-teal-400 dark:hover:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm transition-colors">
                            <span className="truncate text-gray-800 dark:text-gray-200">
                                {productId && selectedProductName ? selectedProductName : t('stats.selectProductPlaceholder')}
                            </span>
                            {productId && (
                                <button onClick={(e) => { e.stopPropagation(); setProductId(undefined); }} className="flex items-center justify-center w-5 h-5 ml-2 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                                    <IoCloseSharp className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- Groupe Options et Date --- */}
                <div className="flex flex-col gap-6">
                    {/* 🎨 Input date avec le bon color-scheme pour le mode nuit */}
                    <div>
                        <label htmlFor="customEndDate" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{t('stats.endDateLabel')}</label>
                        <input
                            type="date" id="customEndDate"
                            value={customEndDate ? DateTime.fromISO(customEndDate).toFormat('yyyy-MM-dd') : ''}
                            onChange={(e) => setCustomEndDate(e.target.value ? DateTime.fromFormat(e.target.value, 'yyyy-MM-dd').toISO() ?? undefined : undefined)}
                            className="px-3 py-2 block w-fit rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800/50 dark:[color-scheme:dark] transition-colors"
                        />
                    </div>
                    {/* Groupe Options d'inclusion */}
                    <div className="flex flex-wrap gap-x-8 gap-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{t('stats.visitDetailsLabel')}</label>
                            <div className="flex flex-wrap gap-2">
                                {Object.keys(visitIncludeLabels).map(key => {
                                    const dimKey = key as keyof VisitStatsIncludeOptions;
                                    const isIncluded = visitIncludes[dimKey];
                                    return (
                                        <button key={dimKey} onClick={() => handleVisitIncludeChange(dimKey)}
                                            // 🎨 Style des toggles avec `teal`
                                            className={`px-3 py-1 text-xs rounded-full transition-all border
                                                ${isIncluded
                                                    ? 'bg-teal-500/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/20'
                                                    : 'bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 border-gray-300/50 dark:border-gray-600/80 hover:bg-gray-200/70 dark:hover:bg-gray-700'
                                                }`}>
                                            {visitIncludeLabels[dimKey]}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{t('stats.orderDetailsLabel')}</label>
                            <div className="flex flex-wrap gap-2">
                                {Object.keys(orderIncludeLabels).map(key => {
                                    const dimKey = key as keyof OrderStatsIncludeOptions;
                                    const isIncluded = orderIncludes[dimKey];
                                    return (
                                        <button key={dimKey} onClick={() => handleOrderIncludeChange(dimKey)}
                                            className={`px-3 py-1 text-xs rounded-full transition-all border
                                                ${isIncluded
                                                    ? 'bg-teal-500/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/20'
                                                    : 'bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 border-gray-300/50 dark:border-gray-600/80 hover:bg-gray-200/70 dark:hover:bg-gray-700'
                                                }`}>
                                            {orderIncludeLabels[dimKey]}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsFilters;