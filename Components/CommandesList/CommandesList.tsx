// Components/CommandesList/CommandesList.tsx
// import './CommandesList.css'; // ❌ Supprimer

import { IoChevronDown, IoChevronForward, IoSearch } from 'react-icons/io5';
// import { useApp } from '../../renderer/AppStore/UseApp'; // Supprimé
// import { ChildViewer } from '../ChildViewer/ChildViewer'; // Supposé non utilisé ici
import { CommandItem } from '../CommandItem/CommandItem';
import { CommandFilterType, CommandInterface } from '../../Interfaces/Interfaces';
import { useEffect, useMemo, useState } from 'react';
import { OrderStatusElement, statusColors /*, statusIcons */ } from '../Status/Satus'; // statusIcons non utilisé
import { DateRange, DayPicker } from "react-day-picker";
import "react-day-picker/style.css"; // Garder l'import CSS de react-day-picker
import { ClientCall, debounce } from '../Utils/functions'; // Garder debounce, ClientCall
// import { FiMaximize } from 'react-icons/fi'; // Non utilisé
import { getImg } from '../Utils/StringFormater';
import { useCommandStore } from '../../pages/commands/CommandStore'; // Sera remplacé par hook API
import { useGetAllOrders } from '../../api/ReactSublymusApi'; // ✅ Importer le hook
import { getTransmit, useGlobalStore } from '../../pages/stores/StoreStore';
import { useTranslation } from 'react-i18next'; // ✅ Importer useTranslation
import { queryClient } from '../../api/ReactSublymusApi'; // Importer queryClient pour invalidation SSE
import { DateTime } from 'luxon';
import Logger from '../../api/Logger';
import { CommandItemSkeleton } from '../CommandItem/CommandItem';



export { CommandeList };

function CommandeList({ product_id, user_id }: { user_id?: string; product_id?: string }) {
    const { t } = useTranslation(); // ✅ Initialiser i18n
    const [filter, setFilter] = useState<CommandFilterType>({});
    // const { getCommands } = useCommandStore(); // Supprimé
    const { currentStore } = useGlobalStore();
    // const [commands, setCommands] = useState<CommandInterface[]>([]); // Géré par React Query

    // ✅ Utiliser le hook React Query
    const d = filter.max_date ? new Date(filter.max_date) : undefined;
    d?.setDate(d.getDate() + 1);
    const { data: commandsData, isLoading, isError, error: apiError, refetch } = useGetAllOrders(
        { ...filter, product_id, user_id, max_date: d?.toISOString() }, // Fusionner filtres
        { enabled: !!currentStore } // Activer seulement si store chargé
    );
    const commands = commandsData?.list ?? []; // Extraire la liste
    const commandsMeta = commandsData?.meta; // Extraire meta pour pagination future

    // Gestion SSE pour rafraîchissement temps réel
    useEffect(() => {
        if (!currentStore?.url) return;

        const transmit = getTransmit(currentStore.url);
        const channel = `store/${currentStore.id}/new_command`; // Utiliser ID du store courant
        // const channelUpdate = `store/${currentStore.id}/update_command`; // Écouter aussi les MAJ

        Logger.info(`Subscribing to SSE channel: ${channel}`);
        const subscription = transmit?.subscription(channel);
        // const subscriptionUpdate = transmit?.subscription(channelUpdate);

        async function subscribe() {
            if (!subscription /* || !subscriptionUpdate */) return;

            try {
                await subscription.create();
                // await subscriptionUpdate.create();

                const handleMessage = (data: any) => {
                    Logger.info({ channel, data }, `Received SSE message`);
                    // Invalider la query pour rafraîchir la liste
                    // Utiliser debounce pour éviter les invalidations trop fréquentes
                    debounce(() => {
                        Logger.info("Invalidating 'allOrders' query due to SSE event.");
                        queryClient.invalidateQueries({ queryKey: ['allOrders'] });
                        // Pas besoin de refetch() manuel si invalidateQueries est utilisé
                    }, 'sse-command-update', 500); // Debounce de 500ms
                };

                subscription.onMessage<{ id: string }>(handleMessage);
                // subscriptionUpdate.onMessage<{ id: string }>(handleMessage);

            } catch (err) {
                Logger.error({ channel, error: err }, "Failed to subscribe to SSE channel");
            }
        }

        subscribe();

        return () => {
            Logger.info(`Unsubscribing from SSE channel: ${channel}`);
            subscription?.delete();
            // subscriptionUpdate?.delete();
        };

    }, [currentStore?.id, currentStore?.url]); // Dépendances pour re-subscribe si store change

    // --- Logique d'affichage des dates (inchangée) ---
    const accuDate: string[] = [];
    const getDate = (date: string) => {
        const d = new Date(date).toLocaleDateString('fr', { // TODO: utiliser la locale i18n
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        return d;
    };
    // --- Fin Logique Dates ---

    return (
        // Utiliser flex-col et gap-2
        <div className="w-full flex flex-col items-stretch gap-2">
            {/* Barre supérieure avec titre et recherche */}
            <div className="w-full flex items-center justify-between gap-4 p-2"> {/* Ajouter padding et gap */}
                {/* 🌍 i18n */}
                <h2 className="text-lg font-semibold text-gray-700 whitespace-nowrap">{t('dashboard.recentOrders')}</h2>
                <label htmlFor="commands-search-input" className='relative w-full max-w-xs ml-auto'> {/* Limiter largeur recherche */}
                    <input
                        className="w-full pl-3 pr-10 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder={t('dashboard.searchPlaceholder')} // 🌍 i18n
                        id="commands-search-input"
                        type="text"
                        value={filter.search || ''}
                        onChange={(e) => {
                            const search = e.currentTarget.value;
                            // Utiliser debounce pour la recherche
                            debounce(() => setFilter((prev) => ({ ...prev, search: search || undefined, page: 1 })), 'search-command', 400); // Reset page à 1
                        }}
                    />
                    <IoSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </label>
                {/* Lien "Tout voir" (si non sur la page /commands) */}
                {!ClientCall(() => location, { pathname: '' })?.pathname.startsWith('/commands') && (
                    <a className='flex items-center gap-1 text-sm text-blue-600 p-2 rounded-lg hover:bg-blue-100/50 transition whitespace-nowrap min-w-max' href='/commands'>
                        {t('common.seeAll')} {/* 🌍 i18n */}
                        <IoChevronForward className='w-4 h-4' />
                    </a>
                )}
            </div>

            {/* Filtres */}
            <CommandsFilters filter={filter} setFilter={setFilter} />

            {/* Liste des commandes */}
            {/* Utiliser flex-col et gap-3 */}
            <div className="w-full flex flex-col items-stretch gap-3">
                {isLoading && (
                    // Squelette ou indicateur de chargement
                    Array.from({ length: 5 }).map((_, i) => <CommandItemSkeleton />)
                )}
                {isError && (
                    // Message d'erreur
                    <div className="p-6 text-center text-red-500">
                        {t('error_occurred')} <span className='text-xs'>{apiError?.message}</span>
                    </div>
                )}
                {!isLoading && !isError && commands.length === 0 && (
                    // Message "Aucun résultat"
                    <div className="flex flex-col items-center justify-center p-10 text-center text-gray-500">
                        <div className="w-40 h-40 bg-contain bg-center bg-no-repeat mb-4" style={{ background: getImg('/res/empty/search.png') }}></div>
                        {t('common.noResults')}
                    </div>
                )}
                {!isLoading && !isError && commands.map((a) => {
                    const d = getDate(a.created_at);
                    const isNewDate = !accuDate.includes(d);
                    if (isNewDate) accuDate.push(d);
                    // Afficher la date seulement si elle est nouvelle (logique inchangée)
                    const dateHeader = isNewDate && !filter.order_by?.includes('price') && (
                        <h2 className='my-3 font-bold text-base opacity-80'>{d}</h2>
                    );

                    return (
                        <div key={a.id}>
                            {dateHeader}
                            {/* Utiliser un lien ou un bouton selon l'action voulue */}
                            <a href={`/commands/${a.id}`}>
                                <CommandItem command={a} /> {/* Passer commandItem à CommandItem */}
                            </a>
                        </div>
                    );
                })}
            </div>
            {/* TODO: Ajouter la pagination basée sur commandsMeta */}
        </div>
    );
}

// --- Composant CommandsFilters (Fonctionnalité et état interne inchangés, juste styles Tailwind) ---
function CommandsFilters({ filter, setFilter }: { filter: CommandFilterType, setFilter: (filter: CommandFilterType) => void }) {
    const { t } = useTranslation(); // ✅ i18n
    const [currentFilter, setCurrentFilter] = useState('');

    const handleFilterChange = (newFilterData: Partial<CommandFilterType>) => {
        setFilter({ ...filter, ...newFilterData, page: 1 }); // Reset page à 1 lors d'un changement de filtre
    };

    const toggleFilter = (filterName: string) => {
        setCurrentFilter(current => current === filterName ? '' : filterName);
    };

    return (
        // Utiliser flex-col
        <div className="w-full flex flex-col mb-0">
            {/* Onglets des filtres */}
            {/* Utiliser flex, gap, p-2, overflow-x-auto, scrollbar-hide */}
            <div className="w-full flex items-center p-2 gap-3 overflow-x-auto overflow-y-hidden rounded-xl scrollbar-hide border-b border-gray-200">
                {/* Bouton Status */}
                <div
                    onClick={() => toggleFilter('status')}
                    className={`inline-flex items-center border rounded-lg px-2 py-0.5 cursor-pointer transition duration-200 whitespace-nowrap text-sm
                         ${filter.status && filter.status.length > 0 ? 'text-blue-600 bg-blue-100/60 border-blue-200' : 'text-gray-600 border-gray-300'}
                         ${currentFilter === 'status' ? '!bg-blue-100/80 !border-blue-300' : 'hover:bg-gray-100'}`}
                >
                    <span>{t('dashboard.orderFilters.status')}</span>
                    <IoChevronDown className={`ml-2 transition-transform duration-200 ${currentFilter === 'status' ? 'rotate-180' : ''}`} />
                </div>
                {/* Bouton Ordre */}
                <div
                    onClick={() => toggleFilter('order')}
                    className={`inline-flex items-center border rounded-lg px-2 py-0.5 cursor-pointer transition duration-200 whitespace-nowrap text-sm
                         ${filter.order_by ? 'text-blue-600 bg-blue-100/60 border-blue-200' : 'text-gray-600 border-gray-300'}
                         ${currentFilter === 'order' ? '!bg-blue-100/80 !border-blue-300' : 'hover:bg-gray-100'}`}
                >
                    <span>{t('dashboard.orderFilters.order')}</span>
                    <IoChevronDown className={`ml-2 transition-transform duration-200 ${currentFilter === 'order' ? 'rotate-180' : ''}`} />
                </div>
                {/* Bouton Prix */}
                <div
                    onClick={() => toggleFilter('price')}
                    className={`inline-flex items-center border rounded-lg px-2 py-0.5 cursor-pointer transition duration-200 whitespace-nowrap text-sm
                          ${filter.min_price !== undefined || filter.max_price !== undefined ? 'text-blue-600 bg-blue-100/60 border-blue-200' : 'text-gray-600 border-gray-300'}
                          ${currentFilter === 'price' ? '!bg-blue-100/80 !border-blue-300' : 'hover:bg-gray-100'}`}
                >
                    <span>{t('dashboard.orderFilters.price')}</span>
                    <IoChevronDown className={`ml-2 transition-transform duration-200 ${currentFilter === 'price' ? 'rotate-180' : ''}`} />
                </div>
                {/* Bouton Date */}
                <div
                    onClick={() => toggleFilter('date')}
                    className={`inline-flex items-center border rounded-lg px-2 py-0.5 cursor-pointer transition duration-200 whitespace-nowrap text-sm
                           ${filter.min_date || filter.max_date ? 'text-blue-600 bg-blue-100/60 border-blue-200' : 'text-gray-600 border-gray-300'}
                           ${currentFilter === 'date' ? '!bg-blue-100/80 !border-blue-300' : 'hover:bg-gray-100'}`}
                >
                    <span>{t('dashboard.orderFilters.date')}</span>
                    <IoChevronDown className={`ml-2 transition-transform duration-200 ${currentFilter === 'date' ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Conteneur des options de filtre */}
            {/* Utiliser mt-2 */}
            <div className="mt-2">
                {/* Chaque div enfant gère sa propre visibilité/hauteur */}
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

// --- Composant StatusFilterComponent ---
function StatusFilterComponent({ status: currentStatus, setStatus, active }: { active: boolean, status: string[] | undefined, setStatus: (status: string[] | undefined) => void }) {
    const { t } = useTranslation(); // ✅ i18n
    const statusList = currentStatus || [];

    const toggleStatus = (s: string) => {
        const newList = statusList.includes(s) ? statusList.filter(f => f !== s) : [...statusList, s];
        setStatus(newList.length > 0 ? newList : undefined);
    };

    return (
        // Utiliser flex, flex-wrap, gap-1.5 et les styles de transition/visibilité
        <div className={`gap-1.5 flex flex-wrap transition-all duration-200 ease-in-out overflow-hidden ${active ? 'h-auto opacity-100 visible p-4 border-t border-gray-200 -mt-px' : 'h-0 opacity-0 invisible p-0'}`}>
            {Object.keys(statusColors).map(s => ( // Assumer que statusColors contient tous les status possibles
                <button type="button" key={s} onClick={() => toggleStatus(s)}>
                    {/* Passer les props pour le style conditionnel */}
                    <OrderStatusElement
                        status={s as any}
                        //@ts-ignore
                        isSelected={statusList.includes(s)}
                    />
                </button>
            ))}
        </div>
    );
}

// --- Composant OrderFilterComponent ---
export function OrderFilterComponent({ order, setOrder, active }: { active: boolean, order: CommandFilterType['order_by'], setOrder: (order: CommandFilterType['order_by'] | undefined) => void }) {
    const { t } = useTranslation(); // ✅ i18n
    // Mapping des clés aux traductions
    const MapOder = {
        'date_desc': t('dashboard.orderFilters.orderValues.date_desc'),
        'date_asc': t('dashboard.orderFilters.orderValues.date_asc'),
        'total_price_desc': t('dashboard.orderFilters.orderValues.total_price_desc'),
        'total_price_asc': t('dashboard.orderFilters.orderValues.total_price_asc')
    };
    type OrderKey = keyof typeof MapOder; // Type pour les clés valides

    return (
        <div className={`gap-1.5 flex flex-wrap transition-all duration-200 ease-in-out overflow-hidden ${active ? 'h-auto opacity-100 visible p-4 border-t border-gray-200 -mt-px' : 'h-0 opacity-0 invisible p-0'}`}>
            {(["date_desc", "date_asc", "total_price_desc", "total_price_asc"] as const).map((o: OrderKey) => (
                <button // Utiliser des boutons
                    type="button"
                    key={o}
                    // Appliquer les styles conditionnels Tailwind
                    className={`px-2 py-0.5 border rounded-lg text-sm cursor-pointer
                       ${o === order ? 'bg-primary-100/60 text-primary border-primary-300/50' : 'border-gray-300 text-gray-500 hover:bg-gray-100'}`}
                    onClick={() => setOrder(order === o ? undefined : o)}
                >
                    {MapOder[o]}
                </button>
            ))}
        </div>
    );
}

// --- Composant PriceFilterComponent ---
export function PriceFilterComponent({ prices, setPrice, active }: { active: boolean, prices: [number | undefined, number | undefined] | undefined, setPrice: (price: [number | undefined, number | undefined] | undefined) => void }) {
    const { t } = useTranslation(); // ✅ i18n
    const minPrice = prices?.[0] ?? ''; // Utiliser chaîne vide pour input contrôlé
    const maxPrice = prices?.[1] ?? '';

    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
        setPrice([isNaN(val as number) ? undefined : val, prices?.[1]]);
    };
    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
        setPrice([prices?.[0], isNaN(val as number) ? undefined : val]);
    };
    const handleReset = (e: React.MouseEvent<HTMLSpanElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setPrice(undefined);
    };
    const canReset = minPrice !== '' || maxPrice !== '';

    return (
        // Utiliser flex, flex-wrap, gap-4, items-end et les styles de transition/visibilité
        <div className={`flex flex-wrap gap-4 items-end transition-all duration-200 ease-in-out overflow-hidden ${active ? 'h-auto opacity-100 visible p-4 border-t border-gray-200 -mt-px' : 'h-0 opacity-0 invisible p-0'}`}>
            {/* Input Min Price */}
            <label htmlFor="command-filter-min-price" className="flex flex-col gap-1 w-40">
                <span className="text-sm text-gray-600">{t('dashboard.orderFilters.priceMin')}</span>
                <input
                    type="number"
                    id="command-filter-min-price"
                    value={minPrice}
                    placeholder={t('dashboard.orderFilters.priceMin')}
                    onChange={handleMinChange}
                    min="0" // Attribut HTML min
                    className="px-3 py-1.5 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none m-0" // style pour masquer flèches
                />
            </label>
            {/* Input Max Price */}
            <label htmlFor="command-filter-max-price" className="flex flex-col gap-1 w-40">
                <span className="text-sm text-gray-600">{t('dashboard.orderFilters.priceMax')}</span>
                <input
                    type="number"
                    id="command-filter-max-price"
                    value={maxPrice}
                    placeholder={t('dashboard.orderFilters.priceMax')}
                    onChange={handleMaxChange}
                    min="0" // Attribut HTML min
                    className="px-3 py-1.5 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none m-0" // style pour masquer flèches
                />
            </label>
            {/* Reset Button */}
            {/* Utiliser w-full sm:w-auto pour layout */}
            <div className="reset w-full sm:w-auto">
                <span
                    onClick={canReset ? handleReset : undefined}
                    className={`inline-flex border rounded-lg px-3 py-1 text-sm transition ${canReset
                            ? 'text-red-500 border-red-200 cursor-pointer hover:bg-red-50'
                            : 'text-gray-400 border-gray-200 cursor-not-allowed'
                        }`}
                >
                    {t('dashboard.orderFilters.reset')}
                </span>
            </div>
        </div>
    );
}

// --- Composant DateFilterComponent ---
export function DateFilterComponent({ date, setDate, active }: { active: boolean, date: [string | undefined, string | undefined] | undefined, setDate: (date: [string | undefined, string | undefined] | undefined) => void }) {
    const { t, i18n } = useTranslation(); // ✅ i18n
    const currentDate = useMemo(() => new Date(), []); // Mémoriser la date actuelle
    const defaultMonth = useMemo(() => date?.[0] ? new Date(date[0]) : currentDate, [date, currentDate]);

    // Convertir les dates ISO string en objets Date pour DayPicker
    const selectedRange: DateRange | undefined = useMemo(() => {
        const fromDate = date?.[0] ? new Date(date[0]) : undefined;
        const toDate = date?.[1] ? new Date(date[1]) : fromDate; // Si 'to' manque, utiliser 'from'
        return fromDate ? { from: fromDate, to: toDate } : undefined;
    }, [date]);

    const [activeRangeShortcut, setActiveRangeShortcut] = useState<string | null>(() => {
        // Essayer de déterminer si la plage actuelle correspond à un raccourci
        if (!date || (!date[0] && !date[1])) return 'all';
        // Ajouter la logique pour comparer date avec MapMarge (complexe à cause des heures/ms)
        return null;
    });


    // Mapping des clés aux traductions pour les raccourcis
    const MapMargeName: Record<string, string> = {
        '3_days': t('dashboard.orderFilters.dateRanges.3_days'),
        '7_days': t('dashboard.orderFilters.dateRanges.7_days'),
        '1_month': t('dashboard.orderFilters.dateRanges.1_month'),
        'all': t('dashboard.orderFilters.dateRanges.all')
    };
    // Calcul des plages (exécuté une seule fois)
    const MapMarge = useMemo(() => ({
        '3_days': [DateTime.fromJSDate(currentDate).minus({ days: 3 }).startOf('day').toISO(), DateTime.fromJSDate(currentDate).endOf('day').toISO()],
        '7_days': [DateTime.fromJSDate(currentDate).minus({ days: 7 }).startOf('day').toISO(), DateTime.fromJSDate(currentDate).endOf('day').toISO()],
        '1_month': [DateTime.fromJSDate(currentDate).minus({ months: 1 }).startOf('day').toISO(), DateTime.fromJSDate(currentDate).endOf('day').toISO()],
        'all': undefined
    }), [currentDate]);

    const handleShortcutClick = (key: keyof typeof MapMarge) => {
        setActiveRangeShortcut(key);
        setDate(MapMarge[key] as [string | undefined, string | undefined] | undefined);
    };

    const handleDayPickerSelect = (range: DateRange | undefined) => {
        setActiveRangeShortcut(null); // Désactiver les raccourcis si sélection manuelle
        const fromISO = range?.from?.toISOString();
        const toISO = range?.to?.toISOString();
        // S'assurer que 'to' est bien après 'from' pour DayPicker range
        setDate(fromISO || toISO ? [fromISO, toISO ?? fromISO] : undefined);
    };


    return (
        <div className={`flex flex-col items-start gap-4 transition-all duration-200 ease-in-out overflow-hidden ${active ? 'h-auto opacity-100 visible p-4 border-t border-gray-200 -mt-px' : 'h-0 opacity-0 invisible p-0'}`}>
            {/* Raccourcis de date */}
            <div className="flex flex-wrap gap-3">
                {(['3_days', '7_days', '1_month', 'all'] as const).map(d => (
                    <button // Utiliser bouton
                        type="button"
                        key={d}
                        // Appliquer styles conditionnels Tailwind
                        className={`px-2 py-0.5 border rounded-lg text-sm cursor-pointer
                           ${d === activeRangeShortcut ? 'bg-yellow-100 text-yellow-600 border-yellow-200' : 'border-gray-300 text-gray-500 hover:bg-gray-100'}`}
                        onClick={() => handleShortcutClick(d)}
                    >
                        {MapMargeName[d]}
                    </button>
                ))}
            </div>
            {/* react-day-picker */}
            {/* Appliquer des styles via la prop `styles` ou `classNames` pour intégrer Tailwind */}
            <DayPicker
                mode="range"
                selected={selectedRange}
                onSelect={handleDayPickerSelect}
                defaultMonth={defaultMonth} // Utiliser le mois par défaut calculé
                toDate={currentDate} // Ne pas permettre de sélectionner le futur
                // locale={l} // Importer la locale 'fr' depuis date-fns
                showOutsideDays
                fixedWeeks
                // Exemple d'utilisation de classNames pour Tailwind (peut nécessiter des ajustements)
                classNames={{
                    root: "bg-white p-3 rounded-lg shadow",
                    caption: "flex justify-center items-center relative mb-4",
                    caption_label: "text-lg font-medium text-gray-800",
                    nav: "flex items-center",
                    nav_button: "h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 absolute",
                    nav_button_previous: "left-1",
                    nav_button_next: "right-1",
                    table: "w-full border-collapse",
                    head_row: "flex",
                    head_cell: "w-10 text-xs font-medium text-gray-500 pb-2 text-center",
                    row: "flex w-full mt-2",
                    cell: "w-10 h-10 flex items-center justify-center text-sm relative text-gray-700",
                    day: "h-8 w-8 rounded-full hover:bg-blue-100 cursor-pointer",
                    day_today: "font-bold text-blue-600",
                    day_selected: "!bg-blue-500 text-white hover:!bg-blue-600",
                    day_range_start: "!rounded-l-full !bg-blue-500 text-white",
                    day_range_end: "!rounded-r-full !bg-blue-500 text-white",
                    day_range_middle: "!rounded-none bg-blue-100 text-blue-700",
                    day_outside: "text-gray-300",
                    day_disabled: "text-gray-300 cursor-not-allowed",
                }}
            />
        </div>
    );
}

