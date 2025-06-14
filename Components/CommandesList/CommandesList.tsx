// Components/CommandesList/CommandesList.tsx

import { IoChevronDown, IoChevronForward, IoSearch } from 'react-icons/io5';
import { CommandItem, CommandItemSkeleton } from '../CommandItem/CommandItem';
import { CommandFilterType, CommandInterface } from '../../api/Interfaces/Interfaces';
import { useEffect, useMemo, useState } from 'react';
import { OrderStatusElement, statusColors } from '../Status/Satus';
import { DateRange, DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { ClientCall, debounce } from '../Utils/functions';
import { getMedia } from '../Utils/StringFormater';
import { useGetAllOrders, queryClient } from '../../api/ReactSublymusApi';
import { getTransmit, useGlobalStore } from '../../api/stores/StoreStore';
import { useTranslation } from 'react-i18next';
import { DateTime } from 'luxon';
import Logger from '../../api/Logger';
import { Pagination } from '../Pagination/Pagination';
import { Data } from '../../renderer/AppStore/Data';
import { navigate } from 'vike/client/router';
import { ClipboardList, ListOrdered } from 'lucide-react';

export { CommandeList };

// ===== COMPOSANT PRINCIPAL : CommandeList =====

function CommandeList({ product_id, user_id }: { user_id?: string; product_id?: string }) {
    const { t } = useTranslation();
    const { currentStore } = useGlobalStore();
    const [filter, setFilter] = useState<CommandFilterType>({});

    // --- Data Fetching avec React Query ---
    const d = filter.max_date ? new Date(filter.max_date) : undefined;
    d?.setDate(d.getDate() + 1);
    const { data: commandsData, isLoading, isError, error: apiError } = useGetAllOrders(
        { ...filter, product_id, user_id, max_date: d?.toISOString() },
        { enabled: !!currentStore }
    );
    const commands = commandsData?.list ?? [];
    const meta = commandsData?.meta;

    // --- Gestion des mises à jour en temps réel (SSE) ---
    useEffect(() => {
        if (!currentStore?.api_url) return;
        const transmit = getTransmit(currentStore.api_url);
        const channel = `store/${Data.apiUrl}/new_command`;
        Logger.info(`Subscribing to SSE channel: ${channel}`);
        const subscription = transmit?.subscription(channel);

        async function subscribe() {
            if (!subscription) return;
            try {
                await subscription.create();
                subscription.onMessage<{ id: string }>((data) => {
                    Logger.info({ channel, data }, `Received SSE message`);
                    debounce(() => {
                        Logger.info("Invalidating 'allOrders' query due to SSE event.");
                        queryClient.invalidateQueries({ queryKey: ['allOrders'] });
                    }, 'sse-command-update', 500);
                });
            } catch (err) {
                Logger.error({ channel, error: err }, "Failed to subscribe to SSE channel");
            }
        }
        subscribe();
        return () => {
            Logger.info(`Unsubscribing from SSE channel: ${channel}`);
            subscription?.delete();
        };
    }, [currentStore?.id, currentStore?.api_url]);

    // --- Logique d'affichage des dates ---
    const accuDate: string[] = [];
    const getDate = (date: string) => new Date(date).toLocaleDateString(t('localeCode', { ns: 'common', defaultValue: 'fr-FR' }), {
        day: 'numeric', month: 'long', year: 'numeric'
    });

    // --- Éléments JSX ---
    const searchInput = (
        <label htmlFor="commands-search-input" className='relative w-full max-w-sm ml-auto'>
            <input
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                placeholder={t('dashboard.searchPlaceholder')}
                id="commands-search-input"
                type="text"
                value={filter.search || ''}
                onChange={(e) => {
                    const search = e.currentTarget.value;
                    debounce(() => setFilter((prev) => ({ ...prev, search: search || undefined, page: 1 })), 'search-command', 400);
                }}
            />
            <IoSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        </label>
    );

    return (
        <div className="w-full flex flex-col items-stretch gap-4 p-2 sm:p-4 rounded-xl dark:shadow-emerald-800/50 shadow-emerald-200/50  bg-white/50 dark:bg-white/5 border border-transparent dark:border-white/10">
            {/* Barre supérieure avec titre et recherche */}
            <div className="w-full flex items-center justify-between gap-4">
                <div className='flex items-center gap-4'>
                    <ClipboardList className='min-w-5 min-h-5 text-blue-500' />
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">{t('dashboard.recentOrders')}</h2>
                </div>
                <div className='hidden mob:inline-block'>
                    {searchInput}
                </div>
                {!ClientCall(() => location, { pathname: '' })?.pathname.startsWith('/commands') && (
                    <a className='flex items-center gap-1.5 text-sm font-semibold text-teal-600 dark:text-teal-400 p-2 rounded-lg hover:bg-teal-100/50 dark:hover:bg-teal-900/30 transition whitespace-nowrap min-w-max' href='/commands'>
                        <span className='hidden sl2:inline-block'>{t('common.seeAll')}</span>
                        <IoChevronForward className='w-4 h-4' />
                    </a>
                )}
            </div>
            <div className='inline-block mob:hidden'>
                {searchInput}
            </div>

            <CommandsFilters filter={filter} setFilter={setFilter} />

            {/* Liste des commandes */}
            <div className="w-full flex flex-col items-stretch gap-3">
                {(isLoading || !currentStore) && Array.from({ length: 5 }).map((_, i) => <CommandItemSkeleton key={i} />)}

                {isError && (
                    <div className="p-6 text-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        {t('error_occurred')} <span className='text-xs opacity-80'>{apiError?.message}</span>
                    </div>
                )}

                {!isLoading && currentStore && !isError && commands.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-10 text-center text-gray-500 dark:text-white">
                        <div className="w-40 h-40 bg-contain bg-center bg-no-repeat mb-4" style={{ background: getMedia({ isBackground: true, source: '/res/empty/search.png' }) }}></div>
                        <h3 className="font-semibold text-lg">{t('common.noResults')}</h3>
                        <p className="text-sm">{t('common.noResultsHint')}</p>
                    </div>
                )}

                {!isLoading && !isError && commands.map((a) => {
                    const d = getDate(a.created_at);
                    const isNewDate = !accuDate.includes(d);
                    if (isNewDate) accuDate.push(d);
                    const dateHeader = isNewDate && !filter.order_by?.includes('price') && (
                        <h3 className='mt-4 mb-2 font-bold text-lg text-gray-700 dark:text-gray-300'>{d}</h3>
                    );

                    return (
                        <div key={a.id}>
                            {dateHeader}
                            <div
                                onClick={() => navigate(`/commands/${a.id}`)}
                                role="link"
                                tabIndex={0}
                            >
                                <CommandItem command={a} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination: s'assurer que le composant Pagination gère le dark mode */}
            {meta && meta.total > meta.per_page && (
                <Pagination
                    currentPage={meta.current_page}
                    lastPage={meta.last_page}
                    total={meta.total}
                    perPage={meta.per_page}
                    onPageChange={(newPage) => setFilter(prev => ({ ...prev, page: newPage }))}
                />
            )}
        </div>
    );
}


// ===== COMPOSANT DE FILTRES : CommandsFilters =====

export function CommandsFilters({ filter, setFilter }: { filter: CommandFilterType, setFilter: (filter: CommandFilterType | ((prev: CommandFilterType) => CommandFilterType)) => void }) {
    const { t } = useTranslation();
    const [currentFilter, setCurrentFilter] = useState('');

    const handleFilterChange = (newFilterData: Partial<CommandFilterType>) => {
        setFilter(prev => ({ ...prev, ...newFilterData, page: 1 }));
    };

    const toggleFilter = (filterName: string) => {
        setCurrentFilter(current => current === filterName ? '' : filterName);
    };

    const hasActiveFilters = filter.status?.length || filter.order_by || filter.min_price || filter.max_price || filter.min_date || filter.max_date;

    return (
        <div className="w-full flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
            <div className="w-full flex flex-wrap items-center p-2 gap-2">
                {/* Utilisation de <button> pour l'accessibilité */}
                <button
                    onClick={() => toggleFilter('status')}
                    className={`inline-flex items-center rounded-md px-3 py-1.5 cursor-pointer transition duration-200 whitespace-nowrap text-sm font-medium
                         ${filter.status && filter.status.length > 0 ? 'text-teal-700 bg-teal-100 dark:bg-teal-900/20 dark:text-teal-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'}
                         ${currentFilter === 'status' ? 'ring-2 ring-teal-400' : ''}`}
                >
                    <span>{t('dashboard.orderFilters.status')}</span>
                    <IoChevronDown className={`ml-2 transition-transform duration-200 ${currentFilter === 'status' ? 'rotate-180' : ''}`} />
                </button>
                <button
                    onClick={() => toggleFilter('order')}
                    className={`inline-flex items-center rounded-md px-3 py-1.5 cursor-pointer transition duration-200 whitespace-nowrap text-sm font-medium
                         ${filter.order_by ? 'text-teal-700 bg-teal-100 dark:bg-teal-900/20 dark:text-teal-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'}
                         ${currentFilter === 'order' ? 'ring-2 ring-teal-400' : ''}`}
                >
                    <span>{t('dashboard.orderFilters.order')}</span>
                    <IoChevronDown className={`ml-2 transition-transform duration-200 ${currentFilter === 'order' ? 'rotate-180' : ''}`} />
                </button>
                <button
                    onClick={() => toggleFilter('price')}
                    className={`inline-flex items-center rounded-md px-3 py-1.5 cursor-pointer transition duration-200 whitespace-nowrap text-sm font-medium
                          ${filter.min_price !== undefined || filter.max_price !== undefined ? 'text-teal-700 bg-teal-100 dark:bg-teal-900/20 dark:text-teal-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'}
                          ${currentFilter === 'price' ? 'ring-2 ring-teal-400' : ''}`}
                >
                    <span>{t('dashboard.orderFilters.price')}</span>
                    <IoChevronDown className={`ml-2 transition-transform duration-200 ${currentFilter === 'price' ? 'rotate-180' : ''}`} />
                </button>
                <button
                    onClick={() => toggleFilter('date')}
                    className={`inline-flex items-center rounded-md px-3 py-1.5 cursor-pointer transition duration-200 whitespace-nowrap text-sm font-medium
                           ${filter.min_date || filter.max_date ? 'text-teal-700 bg-teal-100 dark:bg-teal-900/20 dark:text-teal-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'}
                           ${currentFilter === 'date' ? 'ring-2 ring-teal-400' : ''}`}
                >
                    <span>{t('dashboard.orderFilters.date')}</span>
                    <IoChevronDown className={`ml-2 transition-transform duration-200 ${currentFilter === 'date' ? 'rotate-180' : ''}`} />
                </button>

                {/* Bouton pour réinitialiser tous les filtres */}
                {hasActiveFilters && (
                    <button
                        onClick={() => setFilter({ page: 1, })}
                        className="ml-auto text-sm font-medium text-red-600 dark:text-red-400 hover:underline px-3 whitespace-nowrap"
                    >
                        {t('dashboard.orderFilters.resetAll')}
                    </button>
                )}
            </div>

            {/* Conteneur des options de filtre */}
            <div className="w-full">
                <StatusFilterComponent
                    active={currentFilter === 'status'}
                    status={filter.status}
                    setStatus={(status) => handleFilterChange({ status })} />
                <OrderFilterComponent
                    active={currentFilter === 'order'}
                    order={filter.order_by}
                    setOrder={(order_by) => handleFilterChange({ order_by })} />
                <PriceFilterComponent
                    active={currentFilter === 'price'}
                    prices={[filter.min_price, filter.max_price]}
                    setPrice={(price) => handleFilterChange({ min_price: price?.[0], max_price: price?.[1] })} />
                <DateFilterComponent
                    active={currentFilter === 'date'}
                    date={[filter.min_date, filter.max_date]}
                    setDate={(date) => handleFilterChange({ min_date: date?.[0], max_date: date?.[1] })} />
            </div>
        </div>
    );
}

// ===== SOUS-COMPOSANTS DE FILTRES =====

export function FilterPanelWrapper({ active, children }: { active: boolean, children: React.ReactNode }) {
    // Wrapper unifié pour l'animation et le style des panneaux de filtres
    return (
        <div
            className={`grid transition-all duration-300 ease-in-out ${active ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
        >
            <div className="overflow-hidden">
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    {children}
                </div>
            </div>
        </div>
    );
}

export function StatusFilterComponent({ status: currentStatus, setStatus, active }: { active: boolean, status: string[] | undefined, setStatus: (status: string[] | undefined) => void }) {
    const statusList = currentStatus || [];
    const toggleStatus = (s: string) => {
        const newList = statusList.includes(s) ? statusList.filter(f => f !== s) : [...statusList, s];
        setStatus(newList.length > 0 ? newList : undefined);
    };

    return (
        <FilterPanelWrapper active={active}>
            <div className="flex flex-wrap gap-2">
                {Object.keys(statusColors).map(s => (
                    <button type="button" key={s} onClick={() => toggleStatus(s)} className="rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 focus-visible:ring-teal-500 outline-none">
                        <OrderStatusElement
                            status={s as any}
                            //@ts-ignore
                            isSelected={statusList.includes(s)}
                        />
                    </button>
                ))}
            </div>
        </FilterPanelWrapper>
    );
}

export function OrderFilterComponent({ order, setOrder, active }: { active: boolean, order: CommandFilterType['order_by'], setOrder: (order: CommandFilterType['order_by'] | undefined) => void }) {
    const { t } = useTranslation();
    const MapOder = {
        'date_desc': t('dashboard.orderFilters.orderValues.date_desc'),
        'date_asc': t('dashboard.orderFilters.orderValues.date_asc'),
        'total_price_desc': t('dashboard.orderFilters.orderValues.total_price_desc'),
        'total_price_asc': t('dashboard.orderFilters.orderValues.total_price_asc')
    };
    type OrderKey = keyof typeof MapOder;

    return (
        <FilterPanelWrapper active={active}>
            <div className="flex flex-wrap gap-2">
                {(["date_desc", "date_asc", "total_price_desc", "total_price_asc"] as const).map((o: OrderKey) => (
                    <button
                        type="button"
                        key={o}
                        className={`px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors
                           ${o === order
                                ? 'bg-teal-600 text-white border-teal-600'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        onClick={() => setOrder(order === o ? undefined : o)}
                    >
                        {MapOder[o]}
                    </button>
                ))}
            </div>
        </FilterPanelWrapper>
    );
}
export function PriceFilterComponent({ prices, setPrice, active }: { active: boolean, prices: [number | undefined, number | undefined] | undefined, setPrice: (price: [number | undefined, number | undefined] | undefined) => void }) {
    const { t } = useTranslation();
    const minPrice = prices?.[0] ?? '';
    const maxPrice = prices?.[1] ?? '';

    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
        setPrice([isNaN(val as number) ? undefined : val, prices?.[1]]);
    };

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
        setPrice([prices?.[0], isNaN(val as number) ? undefined : val]);
    };

    const handleReset = () => setPrice(undefined);
    const canReset = minPrice !== '' || maxPrice !== '';
    const hasValues = minPrice !== '' || maxPrice !== '';

    return (
        <FilterPanelWrapper active={active}>
            <div className="space-y-4">
                {/* Header avec indicateur d'état */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            {t('dashboard.orderFilters.price')}
                        </span>
                        {hasValues && (
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {minPrice || '0'}cfa - {maxPrice || '∞'}cfa
                            </span>
                        )}
                    </div>
                    {canReset && (
                        <button
                            onClick={handleReset}
                            className="text-xs text-gray-500 hover:text-red-600 dark:text-white dark:hover:text-red-400 transition-colors"
                        >
                            Effacer
                        </button>
                    )}
                </div>

                {/* Inputs avec design amélioré */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative group">
                        <label htmlFor="command-filter-min-price" className="block text-xs font-medium text-gray-600 dark:text-white mb-1.5">
                            {t('dashboard.orderFilters.priceMin')}
                        </label>
                        <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-white">cfa</span>
                            <input
                                type="number"
                                id="command-filter-min-price"
                                value={minPrice}
                                placeholder="0"
                                onChange={handleMinChange}
                                min="0"
                                className="w-full pl-7  ml-5 pr-3 py-2.5 text-sm
                                    bg-white dark:bg-gray-800
                                    border border-gray-200 dark:border-gray-600
                                    rounded-lg shadow-sm
                                    placeholder:text-gray-400 dark:placeholder:text-gray-500
                                    text-gray-900 dark:text-gray-100
                                    focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500
                                    transition-all duration-200
                                    hover:border-gray-300 dark:hover:border-gray-500"
                            />
                        </div>
                    </div>

                    <div className="relative group">
                        <label htmlFor="command-filter-max-price" className="block text-xs font-medium text-gray-600 dark:text-white mb-1.5">
                            {t('dashboard.orderFilters.priceMax')}
                        </label>
                        <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-white">cfa</span>
                            <input
                                type="number"
                                id="command-filter-max-price"
                                value={maxPrice}
                                placeholder="1000"
                                onChange={handleMaxChange}
                                min="0"
                                className="w-full pl-7 ml-5 pr-3 py-2.5 text-sm
                                    bg-white dark:bg-gray-800
                                    border border-gray-200 dark:border-gray-600
                                    rounded-lg shadow-sm
                                    placeholder:text-gray-400 dark:placeholder:text-gray-500
                                    text-gray-900 dark:text-gray-100
                                    focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500
                                    transition-all duration-200
                                    hover:border-gray-300 dark:hover:border-gray-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Séparateur visuel entre les inputs */}
                <div className="flex items-center justify-center -my-2">
                    <div className="w-6 h-px bg-gray-200 dark:bg-gray-600"></div>
                    <span className="px-2 text-xs text-gray-400 dark:text-gray-500">à</span>
                    <div className="w-6 h-px bg-gray-200 dark:bg-gray-600"></div>
                </div>

                {/* Résumé des valeurs sélectionnées */}

            </div>
        </FilterPanelWrapper>
    );
}
export function DateFilterComponent({ date, setDate, active }: { active: boolean; date: [string | undefined, string | undefined] | undefined; setDate: (date: [string | undefined, string | undefined] | undefined) => void; }) {
    const { t } = useTranslation();
    const currentDate = useMemo(() => new Date(), []);
    const defaultMonth = useMemo(() => (date?.[0] ? new Date(date[0]) : currentDate), [date, currentDate]);

    const selectedRange: DateRange | undefined = useMemo(() => {
        const fromDate = date?.[0] ? new Date(date[0]) : undefined;
        const toDate = date?.[1] ? new Date(date[1]) : fromDate;
        return fromDate ? { from: fromDate, to: toDate } : undefined;
    }, [date]);

    const [activeRangeShortcut, setActiveRangeShortcut] = useState<string | null>(() => !date || (!date[0] && !date[1]) ? 'all' : null);

    const MapMargeName = useMemo(() => ({
        '3_days': t('dashboard.orderFilters.dateRanges.3_days'),
        '7_days': t('dashboard.orderFilters.dateRanges.7_days'),
        '1_month': t('dashboard.orderFilters.dateRanges.1_month'),
        all: t('dashboard.orderFilters.dateRanges.all'),
    }), [t]);

    const MapMarge = useMemo(() => ({
        '3_days': [DateTime.fromJSDate(currentDate).minus({ days: 3 }).startOf('day').toISO(), DateTime.fromJSDate(currentDate).endOf('day').toISO()],
        '7_days': [DateTime.fromJSDate(currentDate).minus({ days: 7 }).startOf('day').toISO(), DateTime.fromJSDate(currentDate).endOf('day').toISO()],
        '1_month': [DateTime.fromJSDate(currentDate).minus({ months: 1 }).startOf('day').toISO(), DateTime.fromJSDate(currentDate).endOf('day').toISO()],
        all: undefined,
    }), [currentDate]);

    const handleShortcutClick = (key: keyof typeof MapMarge) => {
        setActiveRangeShortcut(key);
        setDate(MapMarge[key] as [string | undefined, string | undefined] | undefined);
    };

    const handleDayPickerSelect = (range: DateRange | undefined) => {
        setActiveRangeShortcut(null);
        const fromISO = range?.from?.toISOString();
        const toISO = range?.to?.toISOString();
        setDate(fromISO || toISO ? [fromISO, toISO ?? fromISO] : undefined);
    };

    return (
        <FilterPanelWrapper active={active}>
            <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="flex flex-col gap-4">
                    <h4 className="font-medium text-gray-700 dark:text-gray-200">
                        {t('dashboard.orderFilters.dateRanges.shortcuts')}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {(['3_days', '7_days', '1_month', 'all'] as const).map((d) => {
                            const isActive = (d === activeRangeShortcut) && date?.[0];
                            return (
                                <button
                                    key={d}
                                    type="button"
                                    className={`
                                    px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 outline-none
                                    border 
                                    ${isActive
                                            ? 'bg-teal-600 text-white border-teal-600'
                                            : 'border-gray-300 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 ' +
                                            'dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:bg-gray-700'
                                        }
                                `}
                                    onClick={() => handleShortcutClick(d)}
                                >
                                    {MapMargeName[d]}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* DayPicker entièrement stylisé pour light/dark mode */}
                <DayPicker
                    mode="range"
                    selected={selectedRange}
                    onSelect={handleDayPickerSelect}
                    defaultMonth={defaultMonth}
                    toDate={currentDate}
                    // showOutsideDays 
                    // fixedWeeks
                    classNames={{
                        // months: 'flex flex-col sm:flex-row gap-x-4 gap-y-2',
                        month: 'space-y-4',
                        // caption: 'flex justify-center pt-1 relative items-center',
                        // caption_label: 'text-sm font-bold text-gray-800 dark:text-gray-200',
                        // // nav_button: 'h-7 w-7 bg-transparent p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700',
                        // table: 'w-full border-collapse space-y-1 mt-2',
                        // head_row: 'flex',
                        // head_cell: 'flex-1 text-xs font-normal text-gray-500 dark:text-white rounded-md',
                        // row: 'flex w-full mt-2',
                        // cell: 'text-center text-sm p-0 flex-1 relative',
                        // day: 'h-9 w-9 p-0 font-normal rounded-md transition-colors hover:bg-teal-100 dark:hover:bg-teal-800/50 aria-selected:opacity-100',
                        range_start: 'bg-gray-200 text-gray-900 dark:text-gray-900',
                        range_end: 'bg-gray-200 text-gray-900 dark:text-gray-900',
                        range_middle: 'bg-gray-200 text-gray-900 dark:text-gray-900',
                        // selected: 'bg-teal-500 text-white hover:bg-teal-600 focus:bg-teal-600',
                        // today: 'bg-gray-100 dark:bg-gray-700 text-teal-600 dark:text-teal-300 font-bold',
                        // outside: 'text-gray-400 dark:text-gray-500 opacity-50 aria-selected:opacity-30',
                        // disabled: 'text-gray-300 dark:text-gray-600',

                        // months: 'flex flex-col sm:flex-row gap-4',
                        // month: 'space-y-4',
                        // caption: 'flex justify-center pt-1 relative items-center',
                        // caption_label: 'text-sm font-medium text-gray-800 dark:text-gray-200',
                        // table: 'w-full border-collapse space-y-1',
                        // head_row: 'flex',
                        // head_cell: 'flex-1 text-xs font-normal text-gray-500 dark:text-white',
                        // row: 'flex w-full',
                        cell: 'text-center text-sm p-1 flex-1 hover:bg-gray-100 dark:hover:bg-gray-800',
                        day: 'h-8 w-8 p-0 font-normal dark:text-gray-50',
                        root: 'text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg p-3',
                        selected: 'bg-emerald-400 text-gray-900 ',
                        today: 'border border-emerald-400 rounded-md text-emerald-500 dark:text-emerald-300',
                        outside: 'text-gray-400 dark:text-gray-500',
                        disabled: 'text-gray-300 dark:text-gray-600',
                        chevron: ` fill-emerald-500 `,

                    }}
                />
            </div>
        </FilterPanelWrapper>
    );
}