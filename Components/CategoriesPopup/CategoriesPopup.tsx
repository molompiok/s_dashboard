// Components/CategoriesPopup/CategoriesPopup.tsx
// import './CategoriesPopup.css'; // ❌ Supprimer

import { useEffect, useState, useMemo } from 'react';
import { CategoryInterface, FilterType } from '../../Interfaces/Interfaces';
// import { useCategory } from '../../pages/category/CategoryStore'; // Remplacé
import { useGetCategories } from '../../api/ReactSublymusApi'; // ✅ Importer hook API
import { useGlobalStore } from '../../pages/stores/StoreStore';
// import { useApp } from '../../renderer/AppStore/UseApp'; // Supposé non utilisé ici
import { CategoryItemMini } from '../CategoryItem/CategoryItemMini'; // Utiliser le Mini Item ici aussi? Ou un RowItem? Prenons Mini pour l'instant.
import { IoSearch } from 'react-icons/io5';
import { getImg } from '../Utils/StringFormater';
import { useTranslation } from 'react-i18next'; // ✅ i18n
import { debounce } from '../Utils/functions'; // Garder debounce
import { CategoryItemSkeletonMini } from '../CategoryItem/CategoryItemMini';

export { CategoriesPopup };

interface CategoriesPopupProps {
    onSelected?: (category: CategoryInterface) => void; // Callback quand une catégorie est sélectionnée
    ignore?: string[]; // IDs des catégories à ignorer/cacher
    initialSearch?: string; // Terme de recherche initial
}

function CategoriesPopup({ onSelected, ignore = [], initialSearch = '' }: CategoriesPopupProps) {
    const { t } = useTranslation(); 
    const { currentStore } = useGlobalStore();
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialSearch);

    // Débouncer la recherche
    useEffect(() => {
        debounce(() => setDebouncedSearchTerm(searchTerm), 'category-popup-search', 300);
    }, [searchTerm]);

    // ✅ Utiliser React Query pour fetcher les catégories avec le filtre de recherche
    const { data: categoriesData, isLoading, isError } = useGetCategories(
        { search: debouncedSearchTerm || undefined, limit: 100,with_product_count:true }, // Limite haute pour tout afficher, ajouter pagination si besoin
        { enabled: !!currentStore }
    );

    // Filtrer les catégories à ignorer côté client
    const filteredList = useMemo(() => {
        return categoriesData?.list?.filter(c => !ignore.includes(c.id)) ?? [];
    }, [categoriesData?.list, ignore]);

    return (
        // Utiliser flex flex-col, gap, padding
        <div className="list-categories-popup flex flex-col gap-4 px-4 pb-48 sm:p-6 max-h-[70vh] overflow-y-auto"> {/* Hauteur max et scroll */}
            {/* Barre de recherche */}
            {/* Utiliser flex justify-center mb-4 */}
            <div className="flex justify-center mb-4 sticky top-0 bg-white backdrop-blur-sm py-2 z-12 "> {/* Rendre sticky */}
                <label htmlFor="category-popup-search-input" className='relative w-full max-w-sm'>
                    <input
                        className="w-full pl-3 pr-10 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder={t('category.searchPlaceholder')}
                        id="category-popup-search-input"
                        type="text"
                        autoFocus
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <IoSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </label>
            </div>

            {/* Grille des catégories */}
            {/* Utiliser flex flex-wrap justify-center gap-2 */}
            <div className="flex flex-wrap justify-center gap-2">
                {isLoading && Array.from({ length: 8 }).map((_, i) => <CategoryItemSkeletonMini key={`skel-pop-${i}`} />)}

                {isError && <p className='text-red-500 text-sm w-full text-center'>{t('category.fetchFailed')}</p>}

                {!isLoading && !isError && filteredList.length === 0 && (
                    <div className="w-full flex flex-col items-center text-center text-gray-500 py-6">
                        <div className="w-32 h-32 bg-contain bg-center bg-no-repeat mb-4" style={{ backgroundImage: getImg('/res/empty/search.png') }}></div>
                        {t('common.noResults')}
                    </div>
                )}

                {!isLoading && !isError && filteredList.map((c) => (
                    <CategoryItemMini
                        key={c.id}
                        category={c}
                        onClick={onSelected} // Passer le callback directement
                        openCategory={!onSelected} // N'ouvre pas de lien si onSelected est fourni
                    />
                ))}
            </div>
        </div>
    );
}