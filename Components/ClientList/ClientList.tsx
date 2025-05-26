// Components/ClientList/ClientList.tsx
// import './ClientList.css'; // ❌ Supprimer

import { IoChevronDown, IoSearch } from 'react-icons/io5';
import { UserFilterType, UserInterface } from '../../api/Interfaces/Interfaces';
import { useEffect, useState } from 'react';
import { OrderStatusElement } from '../Status/Satus'; // Peut-être renommer/généraliser?
import { DateRange, DayPicker } from "react-day-picker";
import "react-day-picker/style.css"; // Garder CSS DayPicker
import { ClientCall, debounce } from '../Utils/functions';
import { getMedia } from '../Utils/StringFormater';
// import { getTransmit, useGlobalStore  } from '../../pages/stores/StoreStore'; // Transmit non pertinent ici a priori
import { useGlobalStore } from '../../api/stores/StoreStore';
// import { useClientStore } from '../../pages/users/clients/ClientStore'; // Remplacé par hook API
import { useGetUsers } from '../../api/ReactSublymusApi'; // ✅ Importer hook API
import { ClientStatusColor } from '../Utils/constants'; // Garder pour les couleurs spécifiques client?
import { useTranslation } from 'react-i18next'; // ✅ i18n
import { DateTime } from 'luxon';
import { DateFilterComponent } from '../CommandesList/CommandesList';
import IMask from 'imask';
import { Pagination } from '../Pagination/Pagination';

export { ClientList };

// Définir les statuts clients valides (si applicable, sinon utiliser un filtre texte)
const VALID_CLIENT_STATUS = ['NEW', 'CLIENT', 'PREMIUM', 'BANNED'] as const;
type ValidClientStatus = typeof VALID_CLIENT_STATUS[number];

function ClientList({ product_id, user_id, initialClients }: { initialClients: UserInterface[], user_id?: string; product_id?: string }) {
  const { t } = useTranslation(); // ✅ i18n
  // L'état du filtre local
  const [filter, setFilter] = useState<UserFilterType>({
    // with_client_role: true, // Toujours filtrer par client ici
    order_by: 'date_desc' // Ordre par défaut
  });
  const { currentStore } = useGlobalStore();

  const { data: clientsData, isLoading, isError, error: apiError } = useGetUsers(
    {
      ...filter,
      // Passer les filtres spécifiques à ce composant si nécessaire
      // Ex: Si product_id ou user_id étaient utilisés pour filtrer les clients (ce qui semble étrange ici)
      // product_id: product_id,
      with_phones: true,
      user_id: user_id
    },
    { enabled: !!currentStore } // Activer seulement si store chargé
  );
  const clients = clientsData?.list ?? [];
  const clientsMeta = clientsData?.meta;

  // --- Logique d'affichage des dates (inchangée) ---
  const accuDate: string[] = [];
  const getDate = (date: string) => {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString(t('common.locale'), { // Utiliser locale i18n
        day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch { return 'Date invalide'; }
  };

  console.log(clients);


  return (
    // Utiliser flex flex-col gap-4
    <div className="client-list w-full flex flex-col px-4 gap-4">
      {/* Barre supérieure Titre + Recherche */}
      {/* Utiliser flex justify-between items-center flex-wrap gap-4 */}
      <div className="top w-full flex justify-between flex-wrap items-center  gap-4 p-2">
        <h2 className="text-lg font-semibold text-gray-700 whitespace-nowrap">{t('clientList.title')}</h2>
        <label htmlFor="client-search-input" className='relative w-full min-[460px]:w-auto sm:max-w-xs ml-auto'>
          <input
            className="w-full pl-3 pr-10 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder={t('clientList.searchPlaceholder')}
            id="client-search-input"
            type="text"
            defaultValue={filter.search || ''}
            onChange={(e) => {
              const search = e.target.value;
              debounce(() => setFilter(prev => ({ ...prev, search: search || undefined, page: 1 })), 'client-search', 400);
            }}
          />
          <IoSearch className="absolute right-3 top-[16px] -translate-y-1/2 text-gray-400" />
        </label>
      </div>

      {/* Filtres */}
      <ClientsFilters filter={filter} setFilter={setFilter} />

      {/* Liste des clients */}
      {/* Utiliser flex flex-col gap-3 */}
      <div className="list w-full flex flex-col gap-3">
        {isLoading && <div className="p-6 text-center text-gray-500">{t('common.loading')}</div>}
        {isError && <div className="p-6 text-center text-red-500">{apiError?.message || t('error_occurred')}</div>}
        {!isLoading && !isError && clients.length === 0 && (
          <div className="flex flex-col items-center justify-center p-10 text-center text-gray-500">
            <div className="w-40 h-40 bg-contain bg-center bg-no-repeat mb-4 opacity-70" style={{ backgroundImage: getMedia({ isBackground: true, source: '/res/empty/users.png' }) }}></div>
            {t('clientList.noClientsFound')}
          </div>
        )}
        {!isLoading && !isError && clients.map((client) => {
          const d = getDate(client.created_at);
          const isNewDate = !accuDate.includes(d);
          if (isNewDate) accuDate.push(d);
          const dateHeader = isNewDate && !filter.order_by?.includes('name') && ( // Afficher date si pas trié par nom
            <h3 className='my-3 font-semibold text-sm text-gray-600 px-2'>{d}</h3>
          );
          return (
            <div key={client.id}>
              {dateHeader}
              {/* Rendre l'item client cliquable */}
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
    <div className="client-item hover:bg-slate-100 flex flex-col sx2:flex-row sm:items-center gap-3 sm:gap-6 p-4 rounded-xl bg-white shadow-sm hover:border-gray-200 transition duration-150 cursor-pointer">
      {/* Avatar + Infos principales */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Avatar */}
        <div
          className="w-12 h-12 rounded-full bg-cover bg-center bg-gray-200 text-gray-500 font-semibold text-sm flex items-center justify-center shrink-0"
          style={{
            background: getMedia({ isBackground: true, source: client?.photo?.[0] })
          }}
        >
          {!client.photo?.[0] &&
            (client.full_name?.substring(0, 2).toUpperCase() || '?')}
        </div>

        {/* Nom, Email, Téléphone (mobile visible) */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <p
            className="text-sm font-medium text-gray-800 truncate"
            title={client.full_name}
          >
            {client.full_name || t('common.anonymous')}
          </p>
          <p
            className="text-xs text-gray-500 truncate"
            title={client.email}
          >
            {client.email}
          </p>
          <p
            className="text-xs text-gray-500 truncate sm:hidden"
            title={displayPhone}
          >
            {displayPhone}
          </p>
        </div>
      </div>

      {/* Téléphone (desktop only) */}
      <p
        className="hidden sm:block text-xs text-gray-500 w-28 truncate"
        title={displayPhone}
      >
        {displayPhone}
      </p>
      <div className='ml-auto flex items-center gap-6'>
        {/* Date d'inscription */}
        <p className=" sm:block text-xs text-gray-400 w-24 text-right shrink-0">
          {DateTime.fromISO(client.created_at)
            .setLocale(t('common.locale'))
            .toFormat('dd MMM yy')}
        </p>

        {/* Statut */}
        <div className=" sm:w-auto sm:ml-auto flex justify-end shrink-0">
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
            style={{
              backgroundColor: statusBgColor,
              color: statusColor,
            }}
          >
            {t(`clientStatus.${clientStatus.toLowerCase()}`, clientStatus)}
          </span>
        </div>
      </div>
    </div>
  );
}


// --- Composant ClientsFilters (Similaire à CommandesFilters mais adapté) ---
function ClientsFilters({ filter, setFilter }: { filter: UserFilterType, setFilter: (filter: UserFilterType) => void }) {
  const { t } = useTranslation(); // ✅ i18n
  const [currentFilter, setCurrentFilter] = useState('');

  const handleFilterChange = (newFilterData: Partial<UserFilterType>) => {
    setFilter({ ...filter, ...newFilterData, page: 1 }); // Reset page
  };
  const toggleFilter = (filterName: string) => {
    setCurrentFilter(current => current === filterName ? '' : filterName);
  };

  return (
    <div className="filters no-select w-full flex flex-col mb-0 text-sm"> {/* Taille texte globale */}
      <div className="onglet w-full flex items-center p-2 gap-3 overflow-x-auto overflow-y-hidden rounded-xl scrollbar-hide border-b border-gray-200">
        {/* Bouton Status */}
        <div onClick={() => toggleFilter('status')} className={`inline-flex items-center border rounded-lg px-2 py-0.5 cursor-pointer transition duration-200 whitespace-nowrap ${filter.status && filter.status.length > 0 ? 'text-blue-600 bg-blue-100/60 border-blue-200' : 'text-gray-600 border-gray-300'} ${currentFilter === 'status' ? '!bg-blue-100/80 !border-blue-300' : 'hover:bg-gray-100'}`}>
          <span>{t('clientList.filters.status')}</span>
          <IoChevronDown className={`ml-2 transition-transform duration-200 ${currentFilter === 'status' ? 'rotate-180' : ''}`} />
        </div>
        {/* Bouton Ordre */}
        <div onClick={() => toggleFilter('order')} className={`inline-flex items-center border rounded-lg px-2 py-0.5 cursor-pointer transition duration-200 whitespace-nowrap ${filter.order_by ? 'text-blue-600 bg-blue-100/60 border-blue-200' : 'text-gray-600 border-gray-300'} ${currentFilter === 'order' ? '!bg-blue-100/80 !border-blue-300' : 'hover:bg-gray-100'}`}>
          <span>{t('clientList.filters.order')}</span>
          <IoChevronDown className={`ml-2 transition-transform duration-200 ${currentFilter === 'order' ? 'rotate-180' : ''}`} />
        </div>
        {/* Bouton Date */}
        <div onClick={() => toggleFilter('date')} className={`inline-flex items-center border rounded-lg px-2 py-0.5 cursor-pointer transition duration-200 whitespace-nowrap ${filter.min_date || filter.max_date ? 'text-blue-600 bg-blue-100/60 border-blue-200' : 'text-gray-600 border-gray-300'} ${currentFilter === 'date' ? '!bg-blue-100/80 !border-blue-300' : 'hover:bg-gray-100'}`}>
          <span>{t('clientList.filters.date')}</span>
          <IoChevronDown className={`ml-2 transition-transform duration-200 ${currentFilter === 'date' ? 'rotate-180' : ''}`} />
        </div>
      </div>
      {/* Conteneur des options */}
      <div className="mt-2">
        <ClientStatusFilterComponent // Nouveau composant pour status client
          active={currentFilter === 'status'}
          status={filter.status}
          setStatus={(status) => handleFilterChange({ status })} />
        <ClientOrderFilterComponent // Nouveau composant pour tri client
          active={currentFilter === 'order'}
          order={filter.order_by}
          setOrder={(order_by) => handleFilterChange({ order_by })} />
        <DateFilterComponent
          active={currentFilter === 'date'}
          date={[filter.min_date, filter.max_date]}
          setDate={(date) => handleFilterChange({ min_date: date?.[0], max_date: date?.[1] })} />
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

  return (
    <div className={`gap-1.5 flex flex-wrap transition-all duration-200 ease-in-out overflow-hidden ${active ? 'h-auto opacity-100 visible p-4 border-t border-gray-200 -mt-px' : 'h-0 opacity-0 invisible p-0'}`}>
      {(VALID_CLIENT_STATUS).map(s => {
        const color = (ClientStatusColor as any)[s] ?? '#6B7280'; // Gris par défaut
        const bgColor = `${color}20`;
        const isSelected = statusList.includes(s);
        return (
          <button
            type="button"
            key={s}
            onClick={() => toggleStatus(s)}
            // Appliquer styles conditionnels pour sélection
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${isSelected ? 'ring-1 ring-offset-1 ring-blue-400' : 'hover:opacity-80'}`}
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
  // Mapping des clés aux traductions
  const MapOrder: Record<string, string> = { // Utiliser string comme clé pour le map
    'date_desc': t('clientList.filters.orderValues.date_desc'),
    'date_asc': t('clientList.filters.orderValues.date_asc'),
    'full_name_asc': t('clientList.filters.orderValues.name_asc'), // Ajusté clé
    'full_name_desc': t('clientList.filters.orderValues.name_desc'), // Ajusté clé
  };
  type OrderKey = keyof typeof MapOrder;

  return (
    <div className={`gap-1.5 flex flex-wrap transition-all duration-200 ease-in-out overflow-hidden ${active ? 'h-auto opacity-100 visible p-4 border-t border-gray-200 -mt-px' : 'h-0 opacity-0 invisible p-0'}`}>
      {(["date_desc", "date_asc", "full_name_asc", "full_name_desc"] as const).map((o: OrderKey) => (
        <button
          type="button"
          key={o}
          className={`px-2 py-0.5 border rounded-lg text-sm cursor-pointer ${o === order ? 'bg-primary-100/60 text-primary border-primary-300/50' : 'border-gray-300 text-gray-500 hover:bg-gray-100'}`}
          onClick={() => setOrder(order === o ? undefined : o as any)}
        >
          {MapOrder[o]}
        </button>
      ))}
    </div>
  );
}