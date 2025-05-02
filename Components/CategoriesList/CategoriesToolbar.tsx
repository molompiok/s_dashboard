// Components/CategoriesList/CategoriesToolbar.tsx

import { useState, useEffect } from 'react';
import { IoAddSharp, IoAppsSharp, IoListSharp, IoSearch, IoChevronDown, IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';
import { CategoryFilterType, CategorySortOptions } from '../../Interfaces/Interfaces'; // Importer les types
import { debounce } from '../Utils/functions';
// Importer les composants de filtre (adaptés ou nouveaux)
import { CategoryOrderFilterComponent } from './CategoryOrderFilterComponent'; // Nouveau
import { VisibleFilterComponent } from './VisibleFilterComponent'; // Nouveau/Réutilisable

interface CategoriesToolbarProps {
    filter: CategoryFilterType;
    onFilterChange: (newFilter: CategoryFilterType) => void;
    currentView: 'card' | 'row';
    onViewChange: (view: 'card' | 'row') => void;
}

export function CategoriesToolbar({
    filter,
    onFilterChange,
    currentView,
    onViewChange
}: CategoriesToolbarProps) {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState(filter.search || '');
    const [currentOpenFilter, setCurrentOpenFilter] = useState<string | null>(null); // Pour gérer l'ouverture des popups filtre

    // Debounce la recherche
    useEffect(() => {
        if (searchTerm !== (filter.search || '')) {
            debounce(() => onFilterChange({ ...filter, search: searchTerm || undefined, page: 1 }), 'category-search', 400);
        }
    }, [searchTerm, filter, onFilterChange]);

    // Mettre à jour l'état local si le filtre externe change
    useEffect(() => {
        if (filter.search !== searchTerm) {
            setSearchTerm(filter.search || '');
        }
    }, [filter.search]);

    // Handler générique pour mettre à jour le filtre et fermer le popup
    const handleFilterUpdate = (newFilterData: Partial<CategoryFilterType>) => {
        onFilterChange({ ...filter, ...newFilterData, page: 1 });
        setCurrentOpenFilter(null); // Fermer le popup après sélection
    };

    // Handler pour ouvrir/fermer un popup filtre spécifique
    const toggleFilterPopup = (filterName: string) => {
        setCurrentOpenFilter(current => current === filterName ? null : filterName);
    };

    const categoriesSearchInput = <label htmlFor="category-toolbar-search" className='w-full  ml-auto  relative'>
        <input
            className="w-full sx2:w-56 pl-3 pr-10 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder={t('category.searchPlaceholder')}
            id="category-toolbar-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
        <IoSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
    </label>
    return (
        // Conteneur Toolbar : flex, justify-between, items-center, gap, mb, p, bg, rounded, shadow, border
        <div className="categories-toolbar flex flex-col gap-3 w-full sm:gap-4 mb-4 p-3  rounded-lg  border-gray-200">

            {/* Groupe Gauche: Recherche & Filtres */}
            <div className="flex items-center w-full gap-3 sm:gap-4 flex-wrap">
                <h1 className="text-2xl font-semibold text-gray-900">{t('dashboard.categories')}</h1>
                {/* Recherche */}
                <span className='hidden sx2:flex'>{categoriesSearchInput}</span>
                <div className="flex ml-auto sx2:ml-0 items-center gap-3 sm:gap-4">
                    {/* Toggle Vue */}
                    <div className="flex items-center border border-gray-300 rounded-md p-0.5 bg-gray-100">
                        <button onClick={() => onViewChange('card')} title={t('productList.viewCard')} className={`p-1.5 rounded ${currentView === 'card' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`} aria-pressed={currentView === 'card'}>
                            <IoAppsSharp size={18} />
                        </button>
                        <button onClick={() => onViewChange('row')} title={t('productList.viewRow')} className={`p-1.5 rounded ${currentView === 'row' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`} aria-pressed={currentView === 'row'}>
                            <IoListSharp size={18} />
                        </button>
                    </div>
                </div>
            </div>
            <span className='flex sx2:hidden w-full'>{categoriesSearchInput}</span>
            <div className='flex gap-4'>
                {/* Bouton Filtre OrderBy */}
                <div className="relative">
                    <button
                        onClick={() => toggleFilterPopup('order')}
                        className={`inline-flex items-center border rounded-lg px-2.5 py-1 cursor-pointer transition duration-200 whitespace-nowrap text-sm
                               ${filter.order_by ? 'text-blue-600 bg-blue-100/60 border-blue-200' : 'text-gray-600 border-gray-300'}
                               ${currentOpenFilter === 'order' ? '!bg-blue-100/80 !border-blue-300' : 'hover:bg-gray-100'}`}
                    >
                        <span>{t('dashboard.orderFilters.order')}</span>
                        <IoChevronDown className={`ml-2 h-4 w-4 transition-transform duration-200 ${currentOpenFilter === 'order' ? 'rotate-180' : ''}`} />
                    </button>
                    {/* Popup Filtre OrderBy */}
                    {currentOpenFilter === 'order' && (
                        <CategoryOrderFilterComponent
                            active
                            currentOrder={filter.order_by}
                            setOrder={(order) => handleFilterUpdate({ order_by: order })}
                            onClose={() => setCurrentOpenFilter(null)} // Fermer au clic extérieur ou sélection
                        />
                    )}
                </div>

                {/* Bouton Filtre Visibilité */}
                <div className="relative">
                    <button
                        onClick={() => toggleFilterPopup('visibility')}
                        className={`inline-flex items-center border rounded-lg px-2.5 py-1 cursor-pointer transition duration-200 whitespace-nowrap text-sm
                               ${filter.is_visible !== undefined ? 'text-blue-600 bg-blue-100/60 border-blue-200' : 'text-gray-600 border-gray-300'}
                               ${currentOpenFilter === 'visibility' ? '!bg-blue-100/80 !border-blue-300' : 'hover:bg-gray-100'}`}
                    >
                        <span>{t('common.visibility')}</span>
                        <IoChevronDown className={`ml-2 h-4 w-4 transition-transform duration-200 ${currentOpenFilter === 'visibility' ? 'rotate-180' : ''}`} />
                    </button>
                    {/* Popup Filtre Visibilité */}
                    {currentOpenFilter === 'visibility' && (
                        <VisibleFilterComponent
                            active
                            currentVisibility={filter.is_visible}
                            setVisible={(visibility) => handleFilterUpdate({ is_visible: visibility })}
                            onClose={() => setCurrentOpenFilter(null)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}