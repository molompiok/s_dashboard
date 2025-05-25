// Components/StoreList/StoreToolbar.tsx

import { useState, useEffect } from 'react';
import { IoAddSharp, IoSearch } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';
import { debounce } from '../Utils/functions';
import { StoreFilterType } from '../../api/Interfaces/Interfaces';

interface StoreToolbarProps {
    filter: StoreFilterType;
    onFilterChange: (newFilter: StoreFilterType) => void;
    newStoreRequire: () => void
}

export function StoreToolbar({ filter, onFilterChange, newStoreRequire }: StoreToolbarProps) {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState(filter.search || '');
    const [currentStatus, setCurrentStatus] = useState<StoreFilterType['status']>('all');

    // Debounce la recherche
    useEffect(() => {
        if (searchTerm !== (filter.search || '')) {
            debounce(() => onFilterChange({ ...filter, search: searchTerm || undefined, page: 1 }), 'store-search', 400);
        }
    }, [searchTerm, filter, onFilterChange]);

    // Mettre à jour l'état local si le filtre externe change
    useEffect(() => {
        if (filter.search !== searchTerm) {
            setSearchTerm(filter.search || '');
        }
    }, [filter.search]);

    const handleStatusChange = (status: StoreFilterType['status']) => {
        onFilterChange({ ...filter, is_active: status == 'all' ? undefined : status == 'active' ? true : false, page: 1 });
        setCurrentStatus(status)
    };

    return (
        // Utiliser flex, flex-wrap, justify-end (par défaut), items-center, gap
        <div className="flex flex-wrap justify-start sm:justify-end items-center gap-3 sm:gap-4">
            {/* Filtres Statut */}
            <div className="flex items-center border border-gray-300 rounded-md p-0.5 bg-gray-100 text-sm">
                {(['all', 'active', 'inactive'] as const).map(status => (
                    <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className={`px-3 py-1 rounded ${currentStatus === status ? 'bg-white text-blue-600 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                        {t(`storesPage.statusFilter.${status}`)}
                    </button>
                ))}
            </div>

            {/* Recherche */}
            <label htmlFor="store-toolbar-search" className='relative'>
                <input
                    className="w-48 sm:w-56 pl-3 pr-10 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder={t('storesPage.searchPlaceholder')}
                    id="store-toolbar-search"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <IoSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            </label>

            {/* Bouton Ajouter Store */}
            <a onClick={() => {
                newStoreRequire()
            }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                <IoAddSharp size={18} className="-ml-1" />
                {t('storesPage.addStoreButton')}
            </a>

        </div>
    );
}
