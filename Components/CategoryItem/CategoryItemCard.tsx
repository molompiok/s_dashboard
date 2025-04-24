// Components/CategoryItem/CategoryItemCard.tsx

import { CategoryInterface } from "../../Interfaces/Interfaces";
import { IoPricetagsOutline, IoCalendarOutline, IoEyeOffOutline, IoPencil, IoTrash, IoEllipsisVertical } from "react-icons/io5"; // Ajouter IoCalendarOutline etc.
import { getImg } from "../Utils/StringFormater";
import { useStore } from "../../pages/stores/StoreStore";
import { useTranslation } from "react-i18next";
import { DateTime } from "luxon"; // Utiliser Luxon pour formater les dates
import { useState } from 'react';
// Importer la mutation delete si l'action est gérée ici
// import { useDeleteCategory } from "../../api/ReactSublymusApi";
import logger from '../../api/Logger';
import { NO_PICTURE } from "../Utils/constants";

export { CategoryItemCard };

interface CategoryItemCardProps {
    category: CategoryInterface;
    // Ajouter d'autres props si nécessaire (ex: onDelete callback)
}

function CategoryItemCard({ category }: CategoryItemCardProps) {
    const { t } = useTranslation();
    const { currentStore } = useStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Formater les dates
    const createdAt = DateTime.fromISO(category.created_at).setLocale(useTranslation().i18n.language).toLocaleString(DateTime.DATE_SHORT);
    // const updatedAt = DateTime.fromISO(category.updated_at).setLocale(useTranslation().i18n.language).toRelative(); // Afficher en relatif?

    // Image à afficher (Icon prioritaire sur View)
    const imageUrl = category.icon?.[0] ?? category.view?.[0] ?? NO_PICTURE;

    // TODO: Récupérer le vrai statut de visibilité si applicable aux catégories
    const isVisible = true;

    // --- Handlers ---
    const handleDelete = () => {
        // Confirmation avant suppression
        if (window.confirm(t('category.confirmDelete', { name: category.name }))) {
            // TODO: Appeler la mutation useDeleteCategory
            // deleteCategoryMutation.mutate(category.id);
            logger.warn(`Deletion for category ${category.id} not implemented yet.`);
        }
        setIsMenuOpen(false);
    };

    const handleToggleVisibility = () => {
        // TODO: Implémenter la logique de visibilité si applicable
        logger.warn(`Visibility toggle for category ${category.id} not implemented yet.`);
        setIsMenuOpen(false);
    };


    return (
        // Conteneur Carte : bg, rounded, shadow, border, flex, flex-col, overflow-hidden, group (pour menu)
        <div className="category-item-card relative group bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden transition duration-150 hover:shadow-md hover:border-blue-300">

            {/* Image (peut être cliquable) */}
            <a href={`/categories/${category.id}`} className="block aspect-[4/3] w-full bg-gray-100"> {/* Aspect ratio 4:3 */}
                <div
                    className="w-full h-full bg-cover bg-center bg-no-repeat"
                    style={{ background: getImg(imageUrl, 'cover', currentStore?.url) }}
                ></div>
                {/* Overlay Visibilité (si applicable) */}
                {!isVisible && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <IoEyeOffOutline className="text-white/70 w-8 h-8" />
                    </div>
                )}
            </a>

            {/* Contenu Texte */}
            {/* Utiliser p-3 ou p-4, flex flex-col flex-grow */}
            <div className="p-3 flex flex-col flex-grow">
                {/* Nom & Menu Actions */}
                <div className="flex justify-between items-start gap-2 mb-1">
                    <a href={`/categories/${category.id}`} className="flex-grow min-w-0">
                        <h3
                            className='font-semibold text-base text-gray-800 group-hover:text-blue-600 truncate'
                            title={category.name}
                        >
                            {category.name}
                        </h3>
                    </a>
                    {/* Menu Actions */}
                    <div className="relative flex-shrink-0">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                            className="p-1 -m-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            aria-haspopup="true" aria-expanded={isMenuOpen} title={t('common.actions')}
                        >
                            <IoEllipsisVertical />
                        </button>
                        {/* Menu déroulant */}
                        {isMenuOpen && (
                            <div
                                className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10 py-1"
                                role="menu" aria-orientation="vertical"
                                onClick={(e) => e.stopPropagation()} // Empêcher la fermeture si on clique dans le menu
                            // Ajouter un listener pour fermer si on clique ailleurs
                            >
                                <a href={`/categories/${category.id}`} role="menuitem" className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left">
                                    <IoPencil className="w-4 h-4" /> {t('common.edit')}
                                </a>
                                {/* Action Visibilité (si applicable) */}
                                {/* <button onClick={handleToggleVisibility} role="menuitem" className="...">...</button> */}
                                <button onClick={handleDelete} role="menuitem" className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 w-full text-left">
                                    <IoTrash className="w-4 h-4" /> {t('common.delete')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Description (limitée) */}
                {category.description && (
                    <p className='text-xs text-gray-500 line-clamp-2 mb-2' title={category.description}>
                        {category.description}
                    </p>
                )}

                {/* Informations Supplémentaires (en bas) */}
                {/* Utiliser mt-auto pour pousser vers le bas */}
                <div className="mt-auto flex flex-wrap justify-between items-center gap-x-3 gap-y-1 pt-2 border-t border-gray-100">
                    {/* Nombre de produits */}
                    <div className="flex items-center gap-1 text-xs text-gray-500" title={t('category.productCountTooltip')}>
                        <IoPricetagsOutline className="w-3.5 h-3.5" />
                        <span>{category.product_count ?? 0} {t('dashboard.products')}</span>
                    </div>
                    {/* Date de création */}
                    <div className="flex items-center gap-1 text-xs text-gray-400" title={t('common.createdAt')}>
                        <IoCalendarOutline className="w-3.5 h-3.5" />
                        <span>{createdAt}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Composant Skeleton correspondant ---
function CategoryItemSkeletonCard() {
    return (
        <div className="category-item-card group bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden animate-pulse">
            {/* Image Placeholder */}
            <div className="aspect-[4/3] w-full bg-gray-300"></div>
            {/* Contenu Texte Placeholder */}
            <div className="p-3 flex flex-col flex-grow">
                {/* Nom */}
                <div className="h-5 w-3/4 bg-gray-300 rounded mb-1"></div>
                {/* Description */}
                <div className="h-3 w-full bg-gray-200 rounded mb-2"></div>
                <div className="h-3 w-5/6 bg-gray-200 rounded mb-2"></div>
                {/* Infos Basses */}
                <div className="mt-auto flex justify-between items-center pt-2 border-t border-gray-100">
                    <div className="h-3 w-16 bg-gray-200 rounded"></div>
                    <div className="h-3 w-12 bg-gray-200 rounded"></div>
                </div>
            </div>
        </div>
    );
}

// Exporter le skeleton si dans un fichier séparé
// export { CategoryItemSkeletonCard };