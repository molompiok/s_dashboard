// Components/CategoriesList/CategoriesToolbar.tsx

import { useState, useEffect } from 'react';
import { IoAddSharp, IoAppsSharp, IoChevronDown, IoListSharp, IoSearch } from 'react-icons/io5';
import { CategoryFilterType } from '../../Interfaces/Interfaces'; // Assumer type FilterType adapté
import { useTranslation } from 'react-i18next';
import { debounce } from '../Utils/functions'; // Garder debounce

interface CategoriesToolbarProps {
    filter: CategoryFilterType;
    onFilterChange: (newFilter: CategoryFilterType) => void;
    currentView: 'card' | 'row';
    onViewChange: (view: 'card' | 'row') => void;
    // Ajouter d'autres props si nécessaire, ex: totalCount
}

export function CategoriesToolbar({
    filter,
    onFilterChange,
    currentView,
    onViewChange
}: CategoriesToolbarProps) {
    const { t } = useTranslation();
    // État local pour la recherche pour utiliser debounce
    const [searchTerm, setSearchTerm] = useState(filter.search || '');

    // Mettre à jour le filtre externe après debounce
    useEffect(() => {
        // Ne pas déclencher la recherche si seulement initialisé ou si vide après avoir été non vide
        // Comparer avec filter.search pour éviter boucle infinie si filtre externe change
        if (searchTerm !== (filter.search || '')) {
            debounce(() => onFilterChange({ ...filter, search: searchTerm || undefined, page: 1 }), 'category-search', 400);
        }
    }, [searchTerm, filter, onFilterChange]); // Ajouter filter et onFilterChange aux dépendances

    // Mettre à jour l'état local si le filtre externe change (ex: reset)
    useEffect(() => {
        if (filter.search !== searchTerm) {
            setSearchTerm(filter.search || '');
        }
    }, [filter.search]); // Ne dépendre que de filter.search


    const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        onFilterChange({ ...filter, order_by: event.target.value || undefined as any, page: 1 });
    };

    // Options de tri (utiliser les clés i18n)
    const sortOptions = [
        { value: 'name_asc', label: t('category.sortOptions.name_asc') },
        { value: 'name_desc', label: t('category.sortOptions.name_desc') },
        { value: 'created_at_desc', label: t('category.sortOptions.created_at_desc') },
        { value: 'created_at_asc', label: t('category.sortOptions.created_at_asc') },
        { value: 'product_count_desc', label: t('category.sortOptions.product_count_desc') },
        { value: 'product_count_asc', label: t('category.sortOptions.product_count_asc') },
    ];

    return (
        // Conteneur principal de la barre d'outils
        // Utiliser flex, flex-wrap, justify-between, items-center, gap, mb
        <div className="flex flex-wrap justify-between items-center gap-3 sm:gap-4 mb-4 p-3 bg-white rounded-lg shadow-sm border border-gray-200">

            {/* Groupe Gauche: Recherche et Tri */}
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                {/* Recherche */}
                <label htmlFor="category-toolbar-search" className='relative'>
                    <input
                        className="w-48 sm:w-56 pl-3 pr-10 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder={t('category.searchPlaceholder')}
                        id="category-toolbar-search"
                        type="text"
                        value={searchTerm} // Utiliser l'état local
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <IoSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                </label>

                {/* Sélecteur de Tri */}
                <div className="relative w-full sm:w-auto max-w-xs">
                    <select
                        id="category-sort"
                        value={filter.order_by || 'name_asc'}
                        onChange={handleSortChange}
                        className="appearance-none w-full pl-4 pr-12 py-1.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 hover:border-gray-300 shadow-sm transition-all duration-300 cursor-pointer"
                        aria-label={t('category.sortLabel')}
                    >
                        {sortOptions.map(option => (
                            <option
                                key={option.value}
                                value={option.value}
                                className="text-gray-800 bg-white hover:bg-blue-50 font-medium py-2"
                            >
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                        <IoChevronDown className="text-gray-500 text-base transition-transform duration-300 group-focus-within:rotate-180" />
                    </div>
                </div>
            </div>

            {/* Groupe Droit: Toggle Vue et Bouton Ajouter */}
            <div className="flex items-center gap-3 sm:gap-4">
                {/* Toggle Vue */}
                <div className="flex items-center border border-gray-300 rounded-md p-0.5 bg-gray-100">
                    <button
                        onClick={() => onViewChange('card')}
                        title={t('productList.viewCard')}
                        className={`p-1.5 rounded ${currentView === 'card' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                        aria-pressed={currentView === 'card'}
                    >
                        <IoAppsSharp size={18} />
                    </button>
                    <button
                        onClick={() => onViewChange('row')}
                        title={t('productList.viewRow')}
                        className={`p-1.5 rounded ${currentView === 'row' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                        aria-pressed={currentView === 'row'}
                    >
                        <IoListSharp size={18} />
                    </button>
                </div>

                {/* Bouton Ajouter */}
                <a
                    href="/categories/new" // Lien vers la page de création
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <IoAddSharp size={18} className="-ml-1" />
                    {t('category.addCategoryButton')}
                </a>
            </div>
        </div>
    );
}