// Components/ProductItem/ProductItemCard.tsx

import { IoPeopleSharp, IoStarHalf, IoEyeOffOutline, IoWarningOutline, IoPencil, IoTrash, IoEllipsisVertical, IoEyeOutline, IoChevronForward } from 'react-icons/io5';
import { ProductInterface } from '../../api/Interfaces/Interfaces';
import { getFileType, shortNumber } from '../Utils/functions';
import { getMedia } from '../Utils/StringFormater';
import { getDefaultValues } from '../Utils/parseData';
import { useGlobalStore } from '../../api/stores/StoreStore';
import { markdownToPlainText } from '../MarkdownViewer/MarkdownViewer';
import { useTranslation } from 'react-i18next';
import { NO_PICTURE } from '../Utils/constants';
import { useState, useEffect, useRef } from 'react'; // Ajouter useEffect
import logger from '../../api/Logger';
import { useDeleteProduct, useUpdateProduct, queryClient } from '../../api/ReactSublymusApi'; // ✅ Importer mutations
import { useChildViewer } from '../ChildViewer/useChildViewer'; // Pour confirmation delete
import { ConfirmDelete } from '../Confirm/ConfirmDelete'; // Pour confirmation delete
import { ChildViewer } from '../ChildViewer/ChildViewer'; // Pour confirmation delete
import { showErrorToast, showToast } from '../Utils/toastNotifications';
import { navigate } from 'vike/client/router';

export { ProductItemCard };

interface ProductItemCardProps {
    product: ProductInterface;
    onClick?: () => void; // Remplacé par des liens/boutons internes
}

function ProductItemCard({ product, onClick }: ProductItemCardProps) {
    const { t } = useTranslation();
    const { currentStore } = useGlobalStore();
    const { openChild } = useChildViewer(); // ✅ Hook pour popup
    const [imgError, setImgError] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    // Utiliser l'état local pour la visibilité
    const [isVisible, setIsVisible] = useState(product.is_visible ?? true);


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

    // Synchroniser isVisible si la prop product change
    useEffect(() => {
        setIsVisible(product.is_visible ?? true);
    }, [product.is_visible]);

    // ✅ Initialiser les mutations
    const deleteProductMutation = useDeleteProduct();
    const updateProductMutation = useUpdateProduct(); // Pour la visibilité

    // Logique pour image et stock (supposer que l'API fournit ces infos)
    const stockLevel = 50; // TODO: Remplacer par product.stock_level ou calcul
    const stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = stockLevel > 10 ? 'in_stock' : (stockLevel > 0 ? 'low_stock' : 'out_of_stock');

    const defaultValues = getDefaultValues(product);
    const defaultView = defaultValues[0]?.views?.[0] ?? NO_PICTURE;
    const fileType = getFileType(defaultView);
    const src = getMedia({ source: defaultView, from: 'api' });

    // --- Handlers ---
    const handleDelete = () => {
        setIsMenuOpen(false);
        openChild(
            <ChildViewer>
                <ConfirmDelete
                    title={t('product.confirmDelete', { name: product.name })}
                    onCancel={() => openChild(null)}
                    onDelete={() => {
                        deleteProductMutation.mutate({
                            product_id: product.id
                        }, {
                            onSuccess: () => {
                                showToast('Le Produit a bien été supprimée', 'WARNING')
                                logger.info(`Category ${product.id} deleted`); openChild(null);
                            },
                            onError: (error) => {
                                showErrorToast(error);
                                logger.error({ error }, `Failed to delete product ${product.id}`); openChild(null);
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
        setIsVisible(newVisibility); // Optimistic UI

        updateProductMutation.mutate({
            product_id: product.id,
            data: {
                is_visible: newVisibility
            }
        }, {
            onSuccess: () => {
                logger.info(`Product ${product.id} visibility updated to ${newVisibility}`);
                newVisibility
                    ? showToast('Le produit est maintenant visible par vos client')
                    : showToast('Le produit n\'est plus visible par vos client', 'CANCEL');
            },
            onError: (error) => {
                logger.error({ error }, `Failed to update visibility for product ${product.id}`);
                setIsVisible(!newVisibility); // Revert UI
                showErrorToast(error);
            }
        });
    };


    return (
        // Rendre comme un div cliquable globalement, mais les actions sont dans le menu
        <div className="product-item-card relative group aspect-[65/100] rounded-xl overflow-visible shadow-sm  hover:border-blue-200 hover:shadow-md transition duration-200 flex flex-col bg-white dark:bg-white/5 border border-transparent dark:border-white/10">
            {/* Conteneur Image (lien vers détail produit) */}
            <span onClick={() => {
                onClick ? onClick() : navigate(`/products/${product.id}`);
            }} className="block w-full overflow-hidden rounded-tr-xl  rounded-tl-xl  aspect-square relative flex-shrink-0 bg-gray-100">
                {/* Gestion Erreur Image */}
                {!imgError ? (
                    fileType === 'image' ? (
                        <img src={src || NO_PICTURE} alt={product.name} loading="lazy" className="w-full h-full object-cover block" onError={() => setImgError(true)} />
                    ) : fileType === 'video' ? (
                        <video muted autoPlay loop playsInline className="w-full h-full object-cover block" src={src || ''} onError={() => setImgError(true)} />
                    ) : (
                        <img src={NO_PICTURE} alt={product.name} loading="lazy" className="w-full h-full object-cover block bg-gray-100 dark:bg-gray-800" onError={() => setImgError(true)} />
                    )
                ) : (
                    <img src={NO_PICTURE} alt={t('common.imageError')} className="w-full h-full object-contain block p-4 opacity-50" />
                )}
                {/* Indicateurs */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 z-10"> {/* z-10 pour être au dessus de l'image */}
                    {stockStatus === 'low_stock' && (<span title={t('productList.lowStock')} className="p-1 bg-orange-500/80 text-white rounded-full shadow"><IoWarningOutline size={12} /></span>)}
                    {stockStatus === 'out_of_stock' && (<span title={t('productList.outOfStock')} className="p-1 bg-red-500/80 text-white rounded-full shadow"><IoWarningOutline size={12} /></span>)}
                </div>
                {!isVisible && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center" title={t('productList.hidden')}>
                        <IoEyeOffOutline className="text-white w-8 h-8" />
                    </div>
                )}
            </span>
            {/* Infos Texte */}
            <div className="px-3 pt-2 pb-3 flex flex-col flex-grow justify-between">
                <div>
                    <div className='relative'>
                        <h2 className='text-base font-semibold text-gray-900 dark:text-white truncate'>
                            {Number(product.price || 0).toLocaleString()} {product.currency}
                            {product.barred_price && product.barred_price > product.price && (
                                <span className="ml-1.5 text-xs text-gray-400 line-through">{product.barred_price.toLocaleString()}</span>
                            )}
                        </h2>
                        {/* Menu Kebab (apparaît au survol de la carte) */}
                        <div className="absolute top-0 right-0 z-10 ">
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }} // Empêcher le clic sur le lien parent
                                className="p-1.5 rounded-full text-gray-600 dark:text-white bg-white/70 dark:bg-gray-800/70 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                aria-haspopup="true" aria-expanded={isMenuOpen} title={t('common.actions')}
                                disabled={deleteProductMutation.isPending || updateProductMutation.isPending}
                            >
                                <IoEllipsisVertical />
                            </button>
                            {/* Menu déroulant */}
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black/10 dark:ring-white/10 py-1 z-20" 
                                role="menu"
                                ref={menuRef} 
                                onClick={(e) => e.stopPropagation()}>
                                    <a href={`/products/${product.id}/edit`} role="menuitem" className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left">
                                        <IoPencil className="w-4 h-4" /> {t('common.edit')}
                                    </a>
                                    <button onClick={(e) => {
                                        e.preventDefault()
                                        handleToggleVisibility()
                                    }} role="menuitem" className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left disabled:opacity-50" disabled={updateProductMutation.isPending}>
                                        {isVisible ? <IoEyeOffOutline className="w-4 h-4" /> : <IoEyeOutline className="w-4 h-4" />}
                                        {isVisible ? t('productList.setHidden') : t('productList.setVisible')}
                                    </button>
                                    <button onClick={(e) => {
                                        e.preventDefault()
                                        handleDelete()
                                    }} role="menuitem" className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 w-full text-left disabled:opacity-50" disabled={deleteProductMutation.isPending}>
                                        <IoTrash className="w-4 h-4" /> {t('common.delete')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <h3 className='text-sm font-medium text-gray-700 dark:text-white mt-1 truncate' title={product.name}>{product.name}</h3>
                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5 h-[2.5em] line-clamp-2' title={markdownToPlainText(product.description || '')}>
                        {markdownToPlainText(product.description || '')}
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-600 dark:text-white">
                    <span className="inline-flex gap-1 items-center">
                        <IoStarHalf className="text-amber-500 dark:text-amber-300 " />
                        {(product.rating || 0).toFixed(1)}
                    </span>
                    <span className="inline-flex gap-1  dark:text-white items-center">
                        <IoPeopleSharp />
                        {shortNumber(product.comment_count || 0)}
                    </span>
                </div>
            </div>
        </div>
    );
}


export function ProductItemSkeletonCard() {
    return (
        // Dimensions et styles similaires à ProductItemCard
        <div className="product-item-card aspect-[65/100] rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-900 animate-pulse">
            {/* Image Placeholder */}
            {/* Utiliser aspect-square et bg-gray-300 */}
            <div className="w-full aspect-square bg-gray-300 dark:bg-gray-800"></div>

            {/* Infos Texte Placeholder */}
            {/* Utiliser px-3 pt-2 pb-3 flex flex-col flex-grow justify-between */}
            <div className="px-3 pt-2 pb-3 flex flex-col flex-grow justify-between">
                <div> {/* Conteneur pour prix, nom, desc */}
                    {/* Prix Placeholder */}
                    <div className="h-5 w-1/2 bg-gray-300 dark:bg-gray-700 rounded mt-1"></div>
                    {/* Nom Placeholder */}
                    <div className="h-4 w-4/5 bg-gray-200 rounded mt-2"></div>
                    {/* Description Placeholder (2 lignes) */}
                    <div className="h-3 w-full bg-gray-200 rounded mt-1.5"></div>
                    <div className="h-3 w-5/6 bg-gray-200 rounded mt-1"></div>
                </div>
                {/* Rating Placeholder */}
                {/* Utiliser flex gap-3 mt-2 */}
                <div className="flex gap-3 mt-2">
                    <div className="h-3 w-10 bg-gray-200 rounded"></div> {/* Rating */}
                    <div className="h-3 w-10 bg-gray-200 rounded"></div> {/* Count */}
                </div>
            </div>
        </div>
    );
}