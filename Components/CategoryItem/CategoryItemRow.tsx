// Components/CategoryItem/CategoryItemRow.tsx
import { CategoryInterface } from "../../Interfaces/Interfaces";
import { IoCalendarOutline, IoChevronForward, IoEllipsisVertical, IoEyeOffOutline, IoEyeOutline, IoPencil, IoPricetagsOutline, IoTrash } from "react-icons/io5";
import { getImg } from "../Utils/StringFormater";
import { useStore } from "../../pages/stores/StoreStore";
import { useTranslation } from "react-i18next";
import { DateTime } from "luxon";
import { useState } from 'react';
import logger from '../../api/Logger';
import { limit } from "../Utils/functions";
import { NO_PICTURE } from "../Utils/constants";

export { CategoryItemRow };

interface CategoryItemRowProps {
    category: CategoryInterface;
}

function CategoryItemRow({ category }: CategoryItemRowProps) {
    const { t } = useTranslation();
    const { currentStore } = useStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // --- Gestion Image ---
    const imageUrl = category.icon?.[0] ?? category.view?.[0] ?? NO_PICTURE;
    const imageStyle = {
        background: getImg(imageUrl, 'contain', currentStore?.url), // Utiliser 'contain'
    };
    // --- Fin Gestion Image ---

    // Dates et visibilité
    const createdAt = DateTime.fromISO(category.created_at).setLocale(useTranslation().i18n.language).toLocaleString(DateTime.DATE_SHORT);
    const isVisible = category.is_visible ?? true;

    // Handlers (placeholders)
    const handleDelete = () => { /* ... */ setIsMenuOpen(false); };
    const handleToggleVisibility = () => { /* ... */ setIsMenuOpen(false); };

    return (
        <div className="category-item-row flex items-center gap-3 sm:gap-4 p-2.5 bg-white rounded-lg shadow-sm border border-transparent hover:border-gray-200 hover:shadow-sm transition duration-150 w-full group">
            {/* Image/Icône */}
            <a href={`/categories/${category.id}`} className="flex-shrink-0 block">
                <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-contain bg-center bg-no-repeat bg-gray-100" // bg-gray-100 fallback
                    style={imageStyle} // Appliquer style image
                ></div>
            </a>

            {/* Nom & Description */}
            <div className="flex-grow min-w-0 flex flex-col">
                <a href={`/categories/${category.id}`} className="group/link">
                    <h3 className='font-medium text-sm sm:text-base text-gray-800 group-hover/link:text-blue-600 truncate' title={category.name}>
                        {category.name}
                    </h3>
                </a>
                {category.description && (
                    <p className='hidden md:block text-xs text-gray-500 mt-0.5 truncate' title={category.description}>
                        {limit(category.description, 60)}
                    </p>
                )}
            </div>

            {/* Nb Produits */}
            <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500 flex-shrink-0 w-20" title={t('category.productCountTooltip')}>
                <IoPricetagsOutline className="w-3.5 h-3.5" />
                <span>{category.product_count ?? 0}</span>
            </div>

            {/* Visibilité */}
            <div className="hidden md:flex items-center justify-center flex-shrink-0 w-16">
                <span title={isVisible ? t('productList.visible') : t('productList.hidden')}>
                    {isVisible ? <IoEyeOutline className="w-4 h-4 text-green-500" /> : <IoEyeOffOutline className="w-4 h-4 text-gray-400" />}
                </span>
            </div>

            {/* Date Ajout */}
            <div className="hidden lg:flex items-center gap-1 text-xs text-gray-500 flex-shrink-0 w-24" title={t('common.createdAt')}>
                <span>{createdAt}</span>
            </div>

            {/* Actions */}
            <div className="relative flex-shrink-0 ml-auto sm:ml-0">
                <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }} className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500" aria-haspopup="true" aria-expanded={isMenuOpen} title={t('common.actions')}>
                    <IoEllipsisVertical />
                </button>
                {isMenuOpen && (<div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10 py-1" role="menu" onClick={(e) => e.stopPropagation()}>
                    <a href={`/categories/${category.id}`} role="menuitem" className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left">
                        <IoChevronForward className="w-4 h-4" /> {t('common.view')}
                    </a>
                    <a href={`/categories/${category.id}`} role="menuitem" className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left">
                        <IoPencil className="w-4 h-4" /> {t('common.edit')}
                    </a>
                    <button onClick={handleToggleVisibility} role="menuitem" className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left">
                        {isVisible ? <IoEyeOffOutline className="w-4 h-4" /> : <IoEyeOutline className="w-4 h-4" />}
                        {isVisible ? t('productList.setHidden') : t('productList.setVisible')}
                    </button>
                    <button onClick={handleDelete} role="menuitem" className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 w-full text-left">
                        <IoTrash className="w-4 h-4" /> {t('common.delete')}
                    </button>
                </div>
                )}
            </div>
        </div>
    );
}

// --- Composant Skeleton correspondant ---
export function CategoryItemSkeletonRow() {
    return (
        <div className="category-item-row flex items-center gap-3 sm:gap-4 p-2.5 bg-white rounded-lg shadow-sm border border-gray-200 w-full animate-pulse">
            {/* Image Placeholder */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-gray-300 flex-shrink-0"></div>
            {/* Nom & Desc Placeholder */}
            <div className="flex-grow min-w-0 flex flex-col gap-1">
                <div className="h-5 w-3/5 bg-gray-300 rounded"></div>
                <div className="hidden md:block h-3 w-4/5 bg-gray-200 rounded"></div>
            </div>
            {/* Autres colonnes Placeholder */}
            <div className="hidden sm:flex h-4 w-12 bg-gray-200 rounded flex-shrink-0"></div>
            <div className="hidden md:flex h-4 w-8 bg-gray-200 rounded flex-shrink-0"></div>
            <div className="hidden lg:flex h-4 w-16 bg-gray-200 rounded flex-shrink-0"></div>
            {/* Actions Placeholder */}
            <div className="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0"></div>
        </div>
    );
}

// Exporter le skeleton si dans un fichier séparé
// export { CategoryItemSkeletonRow };