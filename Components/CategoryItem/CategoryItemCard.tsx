// Components/CategoryItem/CategoryItemCard.tsx

import { CategoryInterface } from "../../api/Interfaces/Interfaces";
import { IoPricetagsOutline, IoCalendarOutline, IoEyeOffOutline, IoPencil, IoTrash, IoEllipsisVertical, IoChevronForward, IoEyeOutline } from "react-icons/io5";
import { getImg } from "../Utils/StringFormater";
import { useGlobalStore } from "../../pages/index/StoreStore";
import { useTranslation } from "react-i18next";
import { DateTime } from "luxon";
import { useState, useEffect } from 'react'; // Ajouter useEffect
import logger from '../../api/Logger';
import { NO_PICTURE } from "../Utils/constants";
import { useDeleteCategory, useUpdateCategory, queryClient } from "../../api/ReactSublymusApi"; // ✅ Importer mutations
import { useChildViewer } from "../ChildViewer/useChildViewer"; // Pour confirmation delete
import { ConfirmDelete } from "../Confirm/ConfirmDelete"; // Pour confirmation delete
import { ChildViewer } from "../ChildViewer/ChildViewer"; // Pour confirmation delete
import { showErrorToast, showToast } from "../Utils/toastNotifications";


export { CategoryItemCard };

interface CategoryItemCardProps {
    category: CategoryInterface;
    // Ajouter callbacks si nécessaire
}

function CategoryItemCard({ category }: CategoryItemCardProps) {
    const { t } = useTranslation();
    const { currentStore } = useGlobalStore();
    const { openChild } = useChildViewer(); // ✅ Hook pour popup
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [imgError, setImgError] = useState(false);
    // Utiliser l'état local pour la visibilité
    const [isVisible, setIsVisible] = useState(category.is_visible ?? true);

    // Synchroniser isVisible si la prop category change
    useEffect(() => {
        setIsVisible(category.is_visible ?? true);
    }, [category.is_visible]);

    // ✅ Initialiser les mutations
    const deleteCategoryMutation = useDeleteCategory();
    const updateCategoryMutation = useUpdateCategory();

    const createdAt = DateTime.fromISO(category.created_at).setLocale(useTranslation().i18n.language).toLocaleString(DateTime.DATE_SHORT);
    const imageUrl = category.icon?.[0] ?? category.view?.[0] ?? NO_PICTURE;
    const src = getImg(imageUrl, undefined, currentStore?.url).match(/url\("?([^"]+)"?\)/)?.[1];

    // --- Handlers ---
    const handleDelete = () => {
        setIsMenuOpen(false);
        openChild(
            <ChildViewer>
                <ConfirmDelete
                    title={t('category.confirmDelete', { name: category.name })}
                    onCancel={() => openChild(null)}
                    onDelete={() => {
                        deleteCategoryMutation.mutate({
                            category_id: category.id
                        }, {
                            onSuccess: () => {
                                showToast('La catégorie a bien été supprimée', 'WARNING')
                                logger.info(`Category ${category.id} deleted`); openChild(null);
                            },
                            onError: (error) => {
                                showErrorToast(error);
                                logger.error({ error }, `Failed to delete category ${category.id}`); openChild(null);
                            }
                        });
                    }}
                />
            </ChildViewer>,
            { background: '#3455' }
        );
    };

    const handleToggleVisibility = () => {
        const newVisibility = !isVisible;
        setIsMenuOpen(false);
        setIsVisible(newVisibility); // Optimistic UI update

        updateCategoryMutation.mutate({
            category_id: category.id,
            data: {
                is_visible: newVisibility
            }
        }, {
            onSuccess: () => {
                logger.info(`Category ${category.id} visibility updated to ${newVisibility}`);
                newVisibility
                    ? showToast('La category est maintenant visible par vos client')
                    : showToast('La category n\'est plus visible par vos client', 'CANCEL');
            },
            onError: (error) => {
                logger.error({ error }, `Failed to update visibility for product ${category.id}`);
                setIsVisible(!newVisibility); // Revert UI
                showErrorToast(error);
            }
        });
    };

    return (
        // Appliquer les styles Tailwind pour la carte
        <div className="category-item-card relative group bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col transition duration-150 hover:shadow-md hover:border-blue-300">
            {/* Image Cliquable */}
            <a href={`/categories/${category.id}`} className="block aspect-[4/3] w-full bg-gray-100 relative">
                {/* Gestion Erreur Image */}
                {!imgError ? (
                    <img
                        src={src || NO_PICTURE}
                        alt={category.name}
                        loading="lazy"
                        className="w-full h-full object-cover block"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <img
                        src={NO_PICTURE}
                        alt={t('common.imageError')}
                        className="w-full h-full object-contain block opacity-50 p-4"
                    />
                )}
                {/* Overlay Visibilité */}
                {!isVisible && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center" title={t('productList.hidden')}>
                        <IoEyeOffOutline className="text-white/70 w-8 h-8" />
                    </div>
                )}
            </a>
            {/* Contenu Texte */}
            <div className="p-3 flex flex-col flex-grow">
                {/* Nom & Menu Actions */}
                <div className="flex justify-between items-start gap-2 mb-1">
                    {/* Lien Nom */}
                    <a href={`/categories/${category.id}`} className="flex-grow min-w-0">
                        <h3 className='font-semibold text-base text-gray-800 group-hover:text-blue-600 truncate' title={category.name}>
                            {category.name}
                        </h3>
                    </a>
                    {/* Menu Actions */}
                    <div className="relative flex-shrink-0">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                            className="p-1 -m-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            aria-haspopup="true" aria-expanded={isMenuOpen} title={t('common.actions')}
                            disabled={deleteCategoryMutation.isPending || updateCategoryMutation.isPending}
                        >
                            <IoEllipsisVertical />
                        </button>
                        {/* Menu déroulant */}
                        {isMenuOpen && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20 py-1" role="menu" onClick={(e) => e.stopPropagation()}>
                                {/* Lien Voir */}
                                <a href={`/categories/${category.id}`} role="menuitem" className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left">
                                    <IoChevronForward className="w-4 h-4" /> {t('common.view')}
                                </a>
                                {/* Action Visibilité */}
                                <button onClick={handleToggleVisibility} role="menuitem" className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left disabled:opacity-50" disabled={updateCategoryMutation.isPending}>
                                    {isVisible ? <IoEyeOffOutline className="w-4 h-4" /> : <IoEyeOutline className="w-4 h-4" />}
                                    {isVisible ? t('productList.setHidden') : t('productList.setVisible')}
                                </button>
                                {/* Action Supprimer */}
                                <button onClick={handleDelete} role="menuitem" className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 w-full text-left disabled:opacity-50" disabled={deleteCategoryMutation.isPending}>
                                    <IoTrash className="w-4 h-4" /> {t('common.delete')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                {/* Description */}
                {category.description && (
                    <p className='text-xs text-gray-500 line-clamp-2 mb-2' title={category.description}>
                        {category.description}
                    </p>
                )}
                {/* Infos Basses */}
                <div className="mt-auto flex flex-wrap justify-between items-center gap-x-3 gap-y-1 pt-2 border-t border-gray-100">
                    {/* Nb Produits */}
                    <div className="flex items-center gap-1 text-xs text-gray-500" title={t('category.productCountTooltip')}>
                        <IoPricetagsOutline className="w-3.5 h-3.5" />
                        <span>{category.product_count ?? 0} {t('dashboard.products')}</span>
                    </div>
                    {/* Date Création */}
                    <div className="flex items-center gap-1 text-xs text-gray-400" title={t('common.createdAt')}>
                        <IoCalendarOutline className="w-3.5 h-3.5" />
                        <span>{createdAt}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function CategoryItemSkeletonCard() {
    return (
        <div className="category-item-card group bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden animate-pulse">
            <div className="aspect-[4/3] w-full bg-gray-300"></div>
            <div className="p-3 flex flex-col flex-grow">
                <div className="h-5 w-3/4 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 w-full bg-gray-200 rounded mb-1"></div>
                <div className="h-3 w-5/6 bg-gray-200 rounded mb-2"></div>
                <div className="mt-auto flex justify-between items-center pt-2 border-t border-gray-100">
                    <div className="h-3 w-16 bg-gray-200 rounded"></div>
                    <div className="h-3 w-12 bg-gray-200 rounded"></div>
                </div>
            </div>
        </div>
    );
}
