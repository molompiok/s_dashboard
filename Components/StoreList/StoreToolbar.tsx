// Components/StoreList/StoreToolbar.tsx

import { useState, useEffect } from 'react';
import { IoAddSharp, IoSearch, IoFunnelOutline } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';
import { debounce } from '../Utils/functions';
import { StoreFilterType } from '../../api/Interfaces/Interfaces';

interface StoreToolbarProps {
    filter: StoreFilterType;
    onFilterChange: (newFilter: StoreFilterType) => void;
    newStoreRequire: () => void;
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
        setCurrentStatus(status);
    };

    return (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Section Filtres et Recherche */}
            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                {/* Filtres de Statut - Design Moderne */}
                <div className="flex items-center">
                    <IoFunnelOutline className="hidden sl2:block w-4 h-4 text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0" />
                    <div className="inline-flex items-center  dark:bg-gray-800  p-1 gap-1">
                        {(['all', 'active', 'inactive'] as const).map((status, index) => (
                            <button
                                key={status}
                                onClick={() => handleStatusChange(status)}
                                className={`
                                    relative cursor-pointer  px-2 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out
                                    ${currentStatus === status 
                                        ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-md ring-1 ring-emerald-200 dark:ring-emerald-800 transform scale-[1.02]' 
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }
                                `}
                            >
                                <span className="relative z-10">
                                    {t(`storesPage.statusFilter.${status}`)}
                                </span>
                                {currentStatus === status && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Barre de Recherche - Design Amélioré */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IoSearch className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 transition-colors duration-200" />
                    </div>
                    <input
                        type="text"
                        id="store-toolbar-search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="
                            block w-full sm:w-72 pl-10 pr-3 py-2 
                            bg-white dark:bg-gray-800 
                            border border-gray-300 dark:border-gray-600 
                            rounded-xl shadow-sm
                            text-gray-900 dark:text-gray-100 
                            placeholder-gray-500 dark:placeholder-gray-400
                            focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent
                            transition-all duration-200 ease-in-out
                            hover:border-gray-400 dark:hover:border-gray-500 overflow-hidden
                        "
                        placeholder={t('storesPage.searchPlaceholder')}
                    />
                    {/* Indicateur de focus subtil */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/5 to-teal-500/5 dark:from-emerald-400/5 dark:to-teal-400/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none" />
                </div>
            </div>

            {/* Bouton Ajouter Store - Design Premium */}
            <button
                onClick={newStoreRequire}
                className="
                    group relative inline-flex items-center gap-2 px-4 py-2
                    bg-gradient-to-r from-emerald-500 to-teal-500 
                    hover:from-emerald-600 hover:to-teal-600
                    dark:from-emerald-600 dark:to-teal-600
                    dark:hover:from-emerald-500 dark:hover:to-teal-500
                    text-white font-semibold rounded-xl shadow-lg 
                    hover:shadow-xl hover:shadow-emerald-500/25 dark:hover:shadow-emerald-400/25
                    transform hover:scale-[1.02] active:scale-[0.98]
                    transition-all duration-200 ease-in-out
                    focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900
                    whitespace-nowrap overflow-hidden
                "
            >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/0 rounded-xl opacity-0 cursor-pointer hover:opacity-100 transition-opacity duration-200" />
                <IoAddSharp className="w-5 h-5" />
                <span className="relative">
                    {t('storesPage.addStoreButton')}
                </span>
             </button>
        </div>
    );
}