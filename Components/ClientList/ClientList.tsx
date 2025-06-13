// Components/ClientList/ClientList.tsx

import { IoChevronDown, IoSearch } from 'react-icons/io5';
import { UserFilterType, UserInterface } from '../../api/Interfaces/Interfaces';
import { useEffect, useState } from 'react';
import "react-day-picker/style.css";
import { debounce } from '../Utils/functions';
import { getMedia } from '../Utils/StringFormater';
import { useGlobalStore } from '../../api/stores/StoreStore';
import { useGetUsers } from '../../api/ReactSublymusApi';
import { ClientStatusColor } from '../Utils/constants';
import { useTranslation } from 'react-i18next';
import { DateTime } from 'luxon';
import { DateFilterComponent } from '../CommandesList/CommandesList';
import IMask from 'imask';
import { Pagination } from '../Pagination/Pagination';

export { ClientList };

const VALID_CLIENT_STATUS = ['NEW', 'CLIENT', 'PREMIUM', 'BANNED'] as const;
type ValidClientStatus = typeof VALID_CLIENT_STATUS[number];

function ClientList({ product_id, user_id, initialClients }: { initialClients: UserInterface[], user_id?: string; product_id?: string }) {
    const { t } = useTranslation();
    const [filter, setFilter] = useState<UserFilterType>({ order_by: 'date_desc' });
    const { currentStore } = useGlobalStore();

    const { data: clientsData, isLoading, isError, error: apiError } = useGetUsers(
        { ...filter, with_phones: true, user_id: user_id },
        { enabled: !!currentStore }
    );
    const clients = clientsData?.list ?? [];
    const clientsMeta = clientsData?.meta;

    const accuDate: string[] = [];
    const getDate = (date: string) => {
        if (!date) return '';
        try {
            return new Date(date).toLocaleDateString(t('common.locale'), {
                day: 'numeric', month: 'long', year: 'numeric'
            });
        } catch { return 'Date invalide'; }
    };

    return (
        <div className="client-list w-full flex flex-col px-4 gap-4">
            {/* 🎨 Barre supérieure : Titre + Recherche améliorée */}
            <div className="top w-full flex justify-between flex-wrap items-center gap-4 py-2">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">{t('clientList.title')}</h2>
                <label htmlFor="client-search-input" className='relative w-full min-[460px]:w-auto sm:max-w-xs ml-auto'>
                    <input
                        className="w-full pl-4 pr-10 py-2 bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200"
                        placeholder={t('clientList.searchPlaceholder')}
                        id="client-search-input"
                        type="text"
                        defaultValue={filter.search || ''}
                        onChange={(e) => {
                            const search = e.target.value;
                            debounce(() => setFilter(prev => ({ ...prev, search: search || undefined, page: 1 })), 'client-search', 400);
                        }}
                    />
                    <IoSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                </label>
            </div>

            {/* Filtres */}
            <ClientsFilters filter={filter} setFilter={setFilter} />

            {/* Liste des clients */}
            <div className="list w-full flex flex-col gap-3">
                {isLoading && <div className="p-6 text-center text-gray-500 dark:text-gray-400">{t('common.loading')}</div>}
                {isError && <div className="p-6 text-center text-red-500">{apiError?.message || t('error_occurred')}</div>}
                {!isLoading && !isError && clients.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-10 text-center text-gray-500 dark:text-gray-400">
                        <div className="w-40 h-40 bg-contain bg-center bg-no-repeat mb-4 opacity-70 dark:opacity-50" style={{ backgroundImage: getMedia({ isBackground: true, source: '/res/empty/users.png' }) }}></div>
                        {t('clientList.noClientsFound')}
                    </div>
                )}
                {!isLoading && !isError && clients.map((client) => {
                    const d = getDate(client.created_at);
                    const isNewDate = !accuDate.includes(d);
                    if (isNewDate) accuDate.push(d);
                    const dateHeader = isNewDate && !filter.order_by?.includes('name') && (
                        <h3 className='my-3 font-semibold text-sm text-gray-600 dark:text-gray-400 px-2'>{d}</h3>
                    );
                    return (
                        <div key={client.id}>
                            {dateHeader}
                            <a href={`/users/clients/${client.id}`}>
                                <ClientItem client={client} />
                            </a>
                        </div>
                    );
                })}
            </div>
            {clientsMeta && clientsMeta.total > clientsMeta.per_page && (
                <Pagination
                    currentPage={clientsMeta.current_page}
                    lastPage={clientsMeta.last_page}
                    total={clientsMeta.total}
                    perPage={clientsMeta.per_page}
                    onPageChange={(newPage) => setFilter(prev => ({ ...prev, page: newPage }))}
                />
            )}
        </div>
    );
}

// --- Composant ClientItem ---
// 🎨 Design amélioré avec opacité et backdrop-blur pour le mode nuit
export function ClientItem({ client }: { client: UserInterface }) {
    const { t } = useTranslation();
    const clientStatus = client.status ?? 'CLIENT';
    const statusColor = (ClientStatusColor as any)[clientStatus] ?? ClientStatusColor['CLIENT'];
    const statusBgColor = `${statusColor}20`;

    const displayPhone = client.user_phones?.[0]
        ? IMask.pipe(client.user_phones?.[0]?.phone_number || '', {
            mask: client.user_phones?.[0]?.format || '',
        })
        : t('common.notProvided');

    return (
        <div className="client-item group flex flex-col sx2:flex-row sm:items-center gap-3 sm:gap-6 p-4 rounded-xl bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-gray-200/80 dark:border-gray-800/80 shadow-sm hover:bg-white dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md transition-all duration-200 cursor-pointer">
            {/* Avatar + Infos principales */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Avatar */}
                <div
                    className="w-12 h-12 rounded-full bg-cover bg-center bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-semibold text-sm flex items-center justify-center shrink-0"
                    style={{ background: getMedia({ isBackground: true, source: client?.photo?.[0] }) }}
                >
                    {!client.photo?.[0] && (client.full_name?.substring(0, 2).toUpperCase() || '?')}
                </div>

                {/* Nom, Email, Téléphone (mobile visible) */}
                <div className="flex flex-col gap-0.5 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate" title={client.full_name}>
                        {client.full_name || t('common.anonymous')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={client.email}>
                        {client.email}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate sm:hidden" title={displayPhone}>
                        {displayPhone}
                    </p>
                </div>
            </div>

            {/* Téléphone (desktop only) */}
            <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 w-28 truncate" title={displayPhone}>
                {displayPhone}
            </p>

            <div className='ml-auto flex items-center gap-6'>
                {/* Date d'inscription */}
                <p className="hidden sm:block text-xs text-gray-400 dark:text-gray-500 w-24 text-right shrink-0">
                    {DateTime.fromISO(client.created_at).setLocale(t('common.locale')).toFormat('dd MMM yy')}
                </p>

                {/* Statut */}
                <div className="sm:w-auto sm:ml-auto flex justify-end shrink-0">
                    <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
                        style={{ backgroundColor: statusBgColor, color: statusColor }}
                    >
                        {t(`clientStatus.${clientStatus.toLowerCase()}`, clientStatus)}
                    </span>
                </div>
            </div>
        </div>
    );
}

// --- Composant ClientsFilters ---
// 🎨 Design des filtres amélioré pour le mode nuit et la couleur `teal`
function ClientsFilters({ filter, setFilter }: { filter: UserFilterType, setFilter: (filter: UserFilterType) => void }) {
    const { t } = useTranslation();
    const [currentFilter, setCurrentFilter] = useState('');

    const handleFilterChange = (newFilterData: Partial<UserFilterType>) => {
        setFilter({ ...filter, ...newFilterData, page: 1 });
    };
    const toggleFilter = (filterName: string) => {
        setCurrentFilter(current => current === filterName ? '' : filterName);
    };

    const isActive = (key: keyof UserFilterType | (keyof UserFilterType)[]) => {
        if (Array.isArray(key)) return key.some(k => !!filter[k]);
        return !!filter[key];
    }
    
    return (
        <div className="filters no-select w-full flex flex-col text-sm">
            <div className="onglet w-full flex items-center p-1.5 gap-2 overflow-x-auto overflow-y-hidden rounded-lg bg-gray-100/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 scrollbar-hide">
                {/* Bouton Status */}
                <div onClick={() => toggleFilter('status')} className={`inline-flex items-center rounded-md px-3 py-1 cursor-pointer transition-all duration-200 whitespace-nowrap text-sm ${isActive('status') ? 'text-teal-700 dark:text-teal-300 bg-teal-500/10 dark:bg-teal-500/15' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-700/60'} ${currentFilter === 'status' ? 'ring-2 ring-teal-400' : ''}`}>
                    <span>{t('clientList.filters.status')}</span>
                    <IoChevronDown className={`ml-2 transition-transform duration-200 ${currentFilter === 'status' ? 'rotate-180' : ''}`} />
                </div>
                {/* Bouton Ordre */}
                <div onClick={() => toggleFilter('order')} className={`inline-flex items-center rounded-md px-3 py-1 cursor-pointer transition-all duration-200 whitespace-nowrap text-sm ${isActive('order_by') ? 'text-teal-700 dark:text-teal-300 bg-teal-500/10 dark:bg-teal-500/15' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-700/60'} ${currentFilter === 'order' ? 'ring-2 ring-teal-400' : ''}`}>
                    <span>{t('clientList.filters.order')}</span>
                    <IoChevronDown className={`ml-2 transition-transform duration-200 ${currentFilter === 'order' ? 'rotate-180' : ''}`} />
                </div>
                {/* Bouton Date */}
                <div onClick={() => toggleFilter('date')} className={`inline-flex items-center rounded-md px-3 py-1 cursor-pointer transition-all duration-200 whitespace-nowrap text-sm ${isActive(['min_date', 'max_date']) ? 'text-teal-700 dark:text-teal-300 bg-teal-500/10 dark:bg-teal-500/15' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-700/60'} ${currentFilter === 'date' ? 'ring-2 ring-teal-400' : ''}`}>
                    <span>{t('clientList.filters.date')}</span>
                    <IoChevronDown className={`ml-2 transition-transform duration-200 ${currentFilter === 'date' ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* 🎨 Conteneur des options avec fond et effet de flou */}
            <div className={`filter-options-container mt-2 rounded-lg transition-all duration-300 ease-in-out ${currentFilter ? 'visible' : 'invisible'}`}>
                 <div className={`content bg-gray-50/50 dark:bg-black/10 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden transition-all duration-300 ${currentFilter ? 'max-h-96' : 'max-h-0'}`}>
                    <ClientStatusFilterComponent
                        active={currentFilter === 'status'}
                        status={filter.status}
                        setStatus={(status) => handleFilterChange({ status })} />
                    <ClientOrderFilterComponent
                        active={currentFilter === 'order'}
                        order={filter.order_by}
                        setOrder={(order_by) => handleFilterChange({ order_by })} />
                    <DateFilterComponent
                        active={currentFilter === 'date'}
                        date={[filter.min_date, filter.max_date]}
                        setDate={(date) => handleFilterChange({ min_date: date?.[0], max_date: date?.[1] })} />
                </div>
            </div>
        </div>
    );
}

// --- Composant ClientStatusFilterComponent ---
function ClientStatusFilterComponent({ status: currentStatus, setStatus, active }: { active: boolean, status: string[] | undefined, setStatus: (status: string[] | undefined) => void }) {
    const { t } = useTranslation();
    const statusList = currentStatus || [];

    const toggleStatus = (s: ValidClientStatus) => {
        const newList = statusList.includes(s) ? statusList.filter(f => f !== s) : [...statusList, s];
        setStatus(newList.length > 0 ? newList : undefined);
    };

    // 🎨 Transition améliorée
    return (
        <div className={`gap-2 flex flex-wrap transition-all duration-300 ease-in-out ${active ? 'p-4 opacity-100' : 'p-0 h-0 opacity-0'}`}>
            {(VALID_CLIENT_STATUS).map(s => {
                const color = (ClientStatusColor as any)[s] ?? '#6B7280';
                const bgColor = `${color}20`;
                const isSelected = statusList.includes(s);
                return (
                    <button
                        type="button"
                        key={s}
                        onClick={() => toggleStatus(s)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${isSelected ? 'ring-2 ring-offset-2 ring-teal-500 dark:ring-offset-gray-900' : 'hover:opacity-80'}`}
                        style={{ color: color, backgroundColor: bgColor, borderColor: `${color}40` }}
                    >
                        {t(`clientStatus.${s.toLowerCase()}`, s)}
                    </button>
                );
            })}
        </div>
    );
}

// --- Composant ClientOrderFilterComponent ---
function ClientOrderFilterComponent({ order, setOrder, active }: { active: boolean, order: UserFilterType['order_by'], setOrder: (order: UserFilterType['order_by'] | undefined) => void }) {
    const { t } = useTranslation();
    const MapOrder: Record<string, string> = {
        'date_desc': t('clientList.filters.orderValues.date_desc'),
        'date_asc': t('clientList.filters.orderValues.date_asc'),
        'full_name_asc': t('clientList.filters.orderValues.name_asc'),
        'full_name_desc': t('clientList.filters.orderValues.name_desc'),
    };
    type OrderKey = keyof typeof MapOrder;
    
    // 🎨 Transition et styles améliorés
    return (
        <div className={`gap-2 flex flex-wrap transition-all duration-300 ease-in-out ${active ? 'p-4 opacity-100' : 'p-0 h-0 opacity-0'}`}>
            {(["date_desc", "date_asc", "full_name_asc", "full_name_desc"] as const).map((o: OrderKey) => (
                <button
                    type="button"
                    key={o}
                    className={`px-3 py-1 border rounded-lg text-sm cursor-pointer transition-all duration-200 ${o === order ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30' : 'border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    onClick={() => setOrder(order === o ? undefined : o as any)}
                >
                    {MapOrder[o]}
                </button>
            ))}
        </div>
    );
}

// Remarque: Le composant DateFilterComponent n'était pas dans le code fourni. 
// J'ai présumé qu'il suivait la même logique de prop `active` que les autres filtres.
// Assurez-vous qu'il ait une transition similaire pour une expérience utilisateur fluide.