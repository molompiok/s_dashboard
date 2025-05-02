// Components/ThemeList/ThemeFilters.tsx

import { useState, useEffect } from 'react';
import { IoSearch } from "react-icons/io5";
import { useTranslation } from "react-i18next";
import Select from 'react-select'; // Utiliser react-select pour les tags? Ou des checkboxes?
import { ThemeFilterType } from '../../pages/themes/market/+Page'; // Importer le type de filtre
import { debounce } from '../Utils/functions';

interface ThemeFiltersProps {
    filter: ThemeFilterType;
    onFilterChange: (newFilter: ThemeFilterType) => void;
    // Ajouter les tags disponibles si filtrage par tags dynamique
    // availableTags?: string[];
}

// Options statiques pour le tri et le prix
const priceOptions = [
    { value: 'all', labelKey: 'themeMarket.priceOptions.all' },
    { value: 'free', labelKey: 'themeMarket.priceOptions.free' },
    { value: 'premium', labelKey: 'themeMarket.priceOptions.premium' },
];

const sortOptions = [
    { value: 'name_asc', labelKey: 'themeMarket.sortOptions.name_asc' },
    { value: 'name_desc', labelKey: 'themeMarket.sortOptions.name_desc' },
    { value: 'date_desc', labelKey: 'themeMarket.sortOptions.date_desc' },
];
// TODO: Ajouter tags/features disponibles (peut venir de l'API)
const availableTagsExample = [
    { value: '3d_viewer', labelKey: 'themeFeatures.3d_viewer' },
    { value: 'ar_support', labelKey: 'themeFeatures.ar_support' },
    { value: 'marketplace_layout', labelKey: 'themeFeatures.marketplace_layout' },
    { value: 'blog', labelKey: 'themeFeatures.blog' },
    { value: 'food', labelKey: 'themeFeatures.food' },
];


export function ThemeFilters({ filter, onFilterChange }: ThemeFiltersProps) {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState(filter.search || '');

    // Debounce la recherche
    useEffect(() => {
        if (searchTerm !== (filter.search || '')) {
            debounce(() => onFilterChange({ ...filter, search: searchTerm || undefined, page: 1 }), 'theme-search', 400);
        }
    }, [searchTerm, filter, onFilterChange]);

     // Mettre à jour l'état local si le filtre externe change
     useEffect(() => {
        if (filter.search !== searchTerm) {
            setSearchTerm(filter.search || '');
        }
    }, [filter.search]);


    // Handlers pour les selects
    const handlePriceChange = (selectedOption: any) => {
        onFilterChange({ ...filter, price: selectedOption?.value ?? 'all', page: 1 });
    };

    const handleSortChange = (selectedOption: any) => {
         onFilterChange({ ...filter, sort: selectedOption?.value ?? 'name_asc', page: 1 });
    };

    // Handler pour les tags (si multi-select)
    const handleTagsChange = (selectedOptions: any) => {
         const selectedTags = selectedOptions ? selectedOptions.map((opt: any) => opt.value) : undefined;
         onFilterChange({ ...filter, tags: selectedTags, page: 1 });
    };

    // Trouver les objets options correspondants aux valeurs du filtre pour react-select
    const currentPriceOption = priceOptions.find(opt => opt.value === (filter.price || 'all'));
    const currentSortOption = sortOptions.find(opt => opt.value === (filter.sort || 'name_asc'));
    const currentTagOptions = filter.tags ? availableTagsExample.filter(opt => filter.tags?.includes(opt.value)) : [];


    return (
        // Utiliser flex flex-col gap-4
        <div className="theme-filters flex flex-col gap-4">
            {/* Recherche */}
            <div className='relative'>
                <input
                    className="w-full pl-3 pr-10 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder={t('themeMarket.searchPlaceholder')}
                    id="theme-filter-search"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <IoSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
            </div>

             {/* Filtres Select */}
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 {/* Filtre Prix */}
                 <div>
                     <label htmlFor="theme-filter-price" className="block text-xs font-medium text-gray-500 mb-1">{t('themeMarket.filterPriceLabel')}</label>
                     <Select
                         id="theme-filter-price"
                         options={priceOptions.map(opt => ({ ...opt, label: t(opt.labelKey) }))}
                         value={currentPriceOption ? { ...currentPriceOption, label: t(currentPriceOption.labelKey) } : null}
                         onChange={handlePriceChange}
                         className="react-select-container text-sm"
                         classNamePrefix="react-select"
                         placeholder={t('common.select')}
                         isClearable={false}
                     />
                 </div>
                  {/* Filtre Tri */}
                  <div>
                      <label htmlFor="theme-filter-sort" className="block text-xs font-medium text-gray-500 mb-1">{t('themeMarket.sortLabel')}</label>
                      <Select
                          id="theme-filter-sort"
                          options={sortOptions.map(opt => ({ ...opt, label: t(opt.labelKey) }))}
                          value={currentSortOption ? { ...currentSortOption, label: t(currentSortOption.labelKey) } : null}
                          onChange={handleSortChange}
                          className="react-select-container text-sm"
                          classNamePrefix="react-select"
                          placeholder={t('common.select')}
                          isClearable={false}
                      />
                  </div>
             </div>

             {/* Filtre Tags (Exemple avec multi-select) */}
              <div>
                   <label htmlFor="theme-filter-tags" className="block text-xs font-medium text-gray-500 mb-1">{t('themeMarket.filterTagsLabel')}</label>
                   <Select
                       id="theme-filter-tags"
                       isMulti // Activer multi-sélection
                       options={availableTagsExample.map(opt => ({ ...opt, label: t(opt.labelKey) }))}
                       value={currentTagOptions.map(opt => ({ ...opt, label: t(opt.labelKey) }))}
                       onChange={handleTagsChange}
                       className="react-select-container text-sm"
                       classNamePrefix="react-select"
                       placeholder={t('common.select')}
                       noOptionsMessage={() => t('common.noOptions')}
                       closeMenuOnSelect={false} // Garder ouvert pour multi-sélection
                    />
              </div>
        </div>
    );
}