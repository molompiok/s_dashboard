// Components/CategoryItem/CategoryItemRow.tsx

import { CategoryInterface } from "../../api/Interfaces/Interfaces";
import { IoCalendarOutline, IoChevronForward, IoEllipsisVertical, IoEyeOffOutline, IoEyeOutline, IoPencil, IoPricetagsOutline, IoTrash } from "react-icons/io5";
import { getMedia } from "../Utils/StringFormater";
import { useGlobalStore } from "../../api/stores/StoreStore";
import { useTranslation } from "react-i18next";
import { DateTime } from "luxon";
import { useState, useEffect, useRef } from 'react'; // Ajouter useEffect
import { limit } from "../Utils/functions";
import { NO_PICTURE } from "../Utils/constants";
import { useDeleteCategory, useUpdateCategory, queryClient } from "../../api/ReactSublymusApi"; // ✅ Importer les mutations
import logger from '../../api/Logger';
import { useChildViewer } from "../ChildViewer/useChildViewer"; // Pour confirmation delete
import { ConfirmDelete } from "../Confirm/ConfirmDelete"; // Pour confirmation delete
import { ChildViewer } from "../ChildViewer/ChildViewer";
import { showErrorToast, showToast } from "../Utils/toastNotifications";
import { navigate } from "vike/client/router";

export { CategoryItemRow };

interface CategoryItemRowProps {
    category: CategoryInterface;
    // onDeleteSuccess?: (categoryId: string) => void; // Callback optionnel après succès suppression
    // onVisibilityChangeSuccess?: (category: CategoryInterface) => void; // Callback optionnel après succès MAJ visibilité
}

function CategoryItemRow({ category /*, onDeleteSuccess, onVisibilityChangeSuccess */ }: CategoryItemRowProps) {
    const { t } = useTranslation();
    const { openChild } = useChildViewer(); // ✅ Hook pour popup
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [imgError, setImgError] = useState(false);
    // Utiliser l'état local pour refléter immédiatement le changement de visibilité
    const [isVisible, setIsVisible] = useState(category.is_visible ?? true);
     const menuRef = useRef<HTMLDivElement>(null);
     // Fermer au clic extérieur
        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (isMenuOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
                    setIsMenuOpen(false);
                }
            };
            // Ajouter l'écouteur seulement si le popup est actif
            if (isMenuOpen) {
                document.addEventListener('mousedown', handleClickOutside);
            } else {
                document.removeEventListener('mousedown', handleClickOutside);
            }
            // Nettoyer l'écouteur
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }, [isMenuOpen]);
    // Synchroniser isVisible si la prop category change de l'extérieur
    useEffect(() => {
        setIsVisible(category.is_visible ?? true);
    }, [category.is_visible]);

    // ✅ Initialiser les mutations
    const deleteCategoryMutation = useDeleteCategory();
    const updateCategoryMutation = useUpdateCategory(); // On utilise updateCategory pour changer is_visible

    const createdAt = DateTime.fromISO(category.created_at).setLocale(useTranslation().i18n.language).toLocaleString(DateTime.DATE_SHORT);
    const imageUrl = category.icon?.[0] ?? category.view?.[0] ?? NO_PICTURE;
    const src = getMedia({ isBackground: true, source: imageUrl, from: 'api' }).match(/url\("?([^"]+)"?\)/)?.[1];

    // --- Handlers ---
    const handleDelete = () => {
        setIsMenuOpen(false); // Fermer le menu
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
                                logger.info(`Category ${category.id} deleted`);
                                openChild(null);
                                showToast('La catégorie a bien été supprimée', 'WARNING')
                            },
                            onError: (error) => {
                                logger.error({ error }, `Failed to delete category ${category.id}`);
                                openChild(null);
                                showErrorToast(error);
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
        setIsMenuOpen(false); // Fermer le menu
        setIsVisible(newVisibility);

        updateCategoryMutation.mutate({
            data: {
                is_visible: newVisibility
            },
            category_id: category.id
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
        // Appliquer les styles Tailwind comme précédemment
        <div className="category-item-row flex items-center gap-3 sm:gap-4 p-2.5 dark:text-white rounded-lg shadow-sm border w-full group relative hover:border-blue-200 hover:shadow-md transition duration-200 bg-white dark:bg-white/5  border-transparent dark:border-white/10"> {/* Ajouter relative */}

            {/* Image/Icône */}
            {/* Utiliser un lien pour l'image et le nom */}
            <a onClick={() => {
                navigate(`/categories/${category.id}`);
            }} className="flex-shrink-0 block w-12 h-12 sm:w-16 sm:h-16 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                {/* Gestion Erreur Image */}
                {!imgError ? (
                    <img
                        src={src || NO_PICTURE} // Utiliser NO_PICTURE comme fallback final
                        alt={category.name}
                        loading="lazy"
                        className="w-full h-full object-contain block" // Utiliser object-contain pour icônes
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <img // Image de remplacement en cas d'erreur
                        src={NO_PICTURE}
                        alt={t('common.imageError')} // 🌍 i18n
                        className="w-full h-full object-contain block opacity-50"
                    />
                )}
            </a>

            {/* Nom & Description */}
            <div className="flex-grow min-w-0 flex flex-col">
                <a href={`/categories/${category.id}`} className="group/link">
                    <h3 className='font-medium text-sm sm:text-base text-gray-800 dark:text-white group-hover/link:text-blue-600 truncate' title={category.name}>
                        {category.name}
                    </h3>
                </a>
                {category.description && (
                    <p className=' text-xs text-gray-500 dark:text-white/80 mt-0.5 truncate' title={category.description}>
                        {limit(category.description, 60)}
                    </p>
                )}
            </div>

            {/* Nombre Produits */}
            <div className="hidden sl2:flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-white/80 flex-shrink-0 w-20" title={t('category.productCountTooltip')}>
                <IoPricetagsOutline className="w-3.5 h-3.5" />
                <span>{category.product_count ?? 0}</span>
            </div>

            {/* Visibilité */}
            <div className="hidden mob:flex items-center justify-center flex-shrink-0 w-16">
                {/* Utiliser un bouton pour l'action de toggle */}
                <button onClick={handleToggleVisibility} title={isVisible ? t('productList.setHidden') : t('productList.setVisible')} className="p-1 rounded-full hover:bg-gray-100">
                    {isVisible ? <IoEyeOutline className="w-4 h-4 text-green-500" /> : <IoEyeOffOutline className="w-4 h-4 text-gray-400" />}
                </button>
            </div>

            {/* Date Ajout */}
            <div className="hidden lg:flex items-center gap-1 text-xs text-gray-500 dark:text-white/80 flex-shrink-0 w-24" title={t('common.createdAt')}>
                <span>{createdAt}</span>
            </div>

            {/* Actions Menu */}
            <div className="relative flex-shrink-0 ml-auto sm:ml-0">
                {/* Bouton Kebab */}
                <button
                    onClick={(e) => { e.stopPropagation();e.preventDefault() ;setIsMenuOpen(!isMenuOpen); }}
                    className="p-1.5 rounded-full text-gray-400 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-600 dark:hover:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    aria-haspopup="true" aria-expanded={isMenuOpen} title={t('common.actions')}
                    disabled={deleteCategoryMutation.isPending || updateCategoryMutation.isPending} // Désactiver si action en cours
                >
                    <IoEllipsisVertical />
                </button>
                {/* Menu déroulant */}
                {isMenuOpen && (
                    <div ref={menuRef}
                        className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20 py-1" // Augmenter z-index
                        role="menu" aria-orientation="vertical"
                    // Ajouter un listener pour fermer le menu au clic extérieur
                    onClick={(e) => e.stopPropagation()} // Garder, mais il faut un listener global
                    >
                        {/* Lien Voir (garder <a>) */}
                        <a href={`/categories/${category.id}`} role="menuitem" className="flex items-center gap-2 px-3 py-1.5 text-sm dark:text-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left">
                            <IoChevronForward className="w-4 h-4" /> {t('common.view')}
                        </a>
                        {/* Action Visibilité (utiliser <button>) */}
                        <button onClick={handleToggleVisibility} role="menuitem" className="flex items-center gap-2 px-3 py-1.5 text-sm dark:text-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left disabled:opacity-50" disabled={updateCategoryMutation.isPending}>
                            {isVisible ? <IoEyeOffOutline className="w-4 h-4" /> : <IoEyeOutline className="w-4 h-4" />}
                            {isVisible ? t('productList.setHidden') : t('productList.setVisible')}
                        </button>
                        {/* Action Supprimer (utiliser <button>) */}
                        <button onClick={handleDelete} role="menuitem" className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 w-full text-left disabled:opacity-50" disabled={deleteCategoryMutation.isPending}>
                            <IoTrash className="w-4 h-4" /> {t('common.delete')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
export function CategoryItemSkeletonRow() {
    return (
        <div className="product-item-row flex items-center gap-3 sm:gap-4 p-2.5 bg-white rounded-lg shadow-sm border border-gray-200 w-full animate-pulse dark:border-gray-700 dark:bg-gray-900/50">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-md bg-gray-300 dark:bg-gray-700 flex-shrink-0"></div>
            <div className="flex-grow min-w-0 flex flex-col gap-1">
                <div className="h-5 w-3/5 bg-gray-300 dark:bg-gray-700 rounded"></div> {/* Nom */}
                <div className="h-3 w-2/5 bg-gray-200 dark:bg-gray-600 rounded"></div> {/* ID */}
            </div>
            <div className="hidden md:flex h-4 w-20 bg-gray-200 dark:bg-gray-500 rounded flex-shrink-0"></div>
            <div className="hidden sm:flex h-5 w-16 bg-gray-200 dark:bg-gray-500 rounded flex-shrink-0"></div>
            <div className="hidden lg:flex h-5 w-20 bg-gray-200 dark:bg-gray-500 rounded flex-shrink-0"></div>
            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-500 rounded-full flex-shrink-0 ml-auto sm:ml-0"></div>
        </div>
    )
}
