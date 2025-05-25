// Components/ProductItem/ProductRowItem.tsx
import { IoChevronForward, IoCopyOutline, IoEllipsisVertical, IoEyeOffOutline, IoEyeOutline, IoPencil, IoPeopleSharp, IoStarHalf, IoTrash, IoWarningOutline } from 'react-icons/io5';
import { ProductInterface, CategoryInterface } from '../../api/Interfaces/Interfaces';
import { getFileType, shortNumber, getId, limit, copyToClipboard } from '../Utils/functions';
import { getImg } from '../Utils/StringFormater';
import { getDefaultValues } from '../Utils/parseData';
import { useGlobalStore } from '../../pages/index/StoreStore';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useMemo } from 'react'; // Ajouter useEffect
import { useDeleteProduct, useUpdateProduct, queryClient } from '../../api/ReactSublymusApi'; // ✅ Importer mutations
import logger from '../../api/Logger';
import { NO_PICTURE } from '../Utils/constants';
import { useChildViewer } from '../ChildViewer/useChildViewer'; // Pour confirmation delete
import { ConfirmDelete } from '../Confirm/ConfirmDelete'; // Pour confirmation delete
import { ChildViewer } from '../ChildViewer/ChildViewer'; // Pour confirmation delete
import { showErrorToast, showToast } from '../Utils/toastNotifications';

export { ProductRowItem };

interface ProductRowItemProps {
    product: ProductInterface;
    categoriesMap?: Map<string, CategoryInterface>; // Map pour accès rapide aux noms de catégorie
}

function ProductRowItem({ product, categoriesMap }: ProductRowItemProps) {
    const { t } = useTranslation();
    const { currentStore } = useGlobalStore();
    const { openChild } = useChildViewer(); // ✅ Hook pour popup
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [copiedId, setCopiedId] = useState(false);
    const [imgError, setImgError] = useState(false);
    // Utiliser l'état local pour la visibilité
    const [isVisible, setIsVisible] = useState(product.is_visible ?? true);

    // Synchroniser isVisible si la prop product change
    useEffect(() => {
        setIsVisible(product.is_visible ?? true);
    }, [product.is_visible]);

    // ✅ Initialiser les mutations
    const deleteProductMutation = useDeleteProduct();
    const updateProductMutation = useUpdateProduct(); // Pour la visibilité

    // Logique pour image et stock (utiliser les données réelles de product)
    // TODO: Ajouter la logique pour récupérer/calculer le stock total du produit
    const stockLevel = 50; // Placeholder, remplacer par product.total_stock ou calcul
    const stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = stockLevel > 10 ? 'in_stock' : (stockLevel > 0 ? 'low_stock' : 'out_of_stock');

    const defaultValues = getDefaultValues(product);
    const defaultView = defaultValues[0]?.views?.[0] || NO_PICTURE;
    const src = getImg(defaultView, undefined, currentStore?.url).match(/url\("?([^"]+)"?\)/)?.[1];
    const fileType = getFileType(defaultView);

    // Récupérer les noms des catégories depuis la Map fournie
    const productCategories = useMemo(() => // Mémoriser le résultat
        product.categories_id
            ?.map(id => categoriesMap?.get(id)?.name)
            .filter(Boolean) as string[] ?? []
        , [product.categories_id, categoriesMap]);

    // --- Handlers ---
    const handleCopy = (textToCopy: string | undefined) => {
        if (!textToCopy) return;
        copyToClipboard(textToCopy, () => {
            setCopiedId(true);
            setTimeout(() => setCopiedId(false), 1500);
        });
    };

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
        // Appliquer les styles Tailwind comme précédemment
        <div className="product-row-item flex items-center gap-3 sm:gap-4 p-2.5 bg-white rounded-lg shadow-sm border border-transparent hover:border-gray-200 hover:shadow-sm transition duration-150 w-full group relative"> {/* Ajouter relative */}

            {/* Image */}
            <a href={`/products/${product.id}`} className="flex-shrink-0 block w-12 h-12 sm:w-16 sm:h-16 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                {/* Gestion Erreur Image */}
                {!imgError ? (
                    fileType === 'image' ? (<img src={src || NO_PICTURE} alt={product.name} loading="lazy" className="w-full h-full object-cover block" onError={() => setImgError(true)} />)
                        : fileType === 'video' ? (<video muted autoPlay loop playsInline className="w-full h-full object-cover block" src={src || ''} onError={() => setImgError(true)} />)
                            : (<img src={NO_PICTURE} alt="Placeholder" className="w-full h-full object-contain block p-2 opacity-50" />)
                ) : (
                    <img src={NO_PICTURE} alt={t('common.imageError')} className="w-full h-full object-contain block p-2 opacity-50" />
                )}
            </a>

            {/* Nom & ID */}
            <div className="flex-grow min-w-0 flex flex-col">
                <a href={`/products/${product.id}`} className="group/link">
                    <h3 className='font-medium text-sm sm:text-base text-gray-800 group-hover/link:text-blue-600 truncate' title={product.name}>
                        {product.name}
                    </h3>
                </a>
                <p className='text-xs text-gray-400 mt-0.5 flex items-center gap-1 group cursor-pointer w-fit' title={t('common.copyId')} onClick={() => handleCopy(getId(product.id))}>
                    ID: {getId(product.id)}
                    <IoCopyOutline className={`w-3 h-3 transition-all ${copiedId ? 'text-green-500 scale-110' : 'text-gray-400 opacity-0 group-hover:opacity-60'}`} />
                </p>
                {/* Rating (peut être mis ici sur petit écran) */}
                <div className="flex min-[500px]:hidden w-auto flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-gray-600">
                    <span className="inline-flex gap-1 items-center"><IoStarHalf className="text-amber-500" />{(product.rating || 0).toFixed(1)}</span>
                    <span className="inline-flex gap-1 items-center"><IoPeopleSharp />{shortNumber(product.comment_count || 0)}</span>
                    <button onClick={handleToggleVisibility} title={isVisible ? t('productList.setHidden') : t('productList.setVisible')} className="p-1 sx:hidden rounded-full hover:bg-gray-100">
                        {isVisible ? <IoEyeOutline className="w-4 h-4 text-green-500" /> : <IoEyeOffOutline className="w-4 h-4 text-gray-400" />}
                    </button>
                </div>
            </div>

            {/* Catégories (md+) */}
            {/* <div className="hidden md:flex flex-wrap gap-1 items-center flex-shrink-0 max-w-[150px] lg:max-w-[200px]">
                {productCategories.slice(0, 2).map((catName, index) => (
                    <span key={index} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded whitespace-nowrap">
                        {limit(catName, 15)}
                    </span>
                ))}
                {productCategories.length > 2 && (<span className="text-xs text-gray-400">+{productCategories.length - 2}</span>)}
            </div> */}

            {/* Rating (caché en dessous de 500px) */}
            <div className="hidden min-[500px]:flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-gray-600">
                <span className="inline-flex gap-1 items-center"><IoStarHalf className="text-amber-500" />{(product.rating || 0).toFixed(1)}</span>
                <span className="inline-flex gap-1 items-center"><IoPeopleSharp />{shortNumber(product.comment_count || 0)}</span>
            </div>

            {/* Prix (sm+) */}
            <div className="hidden sx:flex flex-col items-end flex-shrink-0 w-24">
                <span className='text-sm font-medium text-gray-800'>{Number(product.price || 0).toLocaleString()} {product.currency}</span>
                {product.barred_price && product.barred_price > product.price && (<span className="text-xs text-gray-400 line-through">{product.barred_price.toLocaleString()}</span>)}
            </div>

            {/* Stock & Visibilité (lg+) */}
            <div className="hidden ml-4 lg:flex items-center justify-end gap-2 flex-shrink-0 w-32 text-right"> {/* justify-end */}
                {/* Stock */}
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded whitespace-nowrap ${stockStatus === 'in_stock' ? 'bg-green-100 text-green-700' :
                    stockStatus === 'low_stock' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                    }`} title={t(`productList.stockStatus.${stockStatus}`, { count: stockLevel })}>
                    {stockStatus === 'in_stock' ? t('productList.inStock') : stockStatus === 'low_stock' ? t('productList.lowStockShort', { count: stockLevel }) : t('productList.outOfStock')}
                </span>
            </div>
            {/* Visibilité */}
            <button onClick={handleToggleVisibility} title={isVisible ? t('productList.setHidden') : t('productList.setVisible')} className="p-1 rounded-full hidden sx:flex hover:bg-gray-100">
                {isVisible ? <IoEyeOutline className="w-4 h-4 text-green-500" /> : <IoEyeOffOutline className="w-4 h-4 text-gray-400" />}
            </button>

            {/* Actions Menu */}
            <div className="relative flex-shrink-0 ml-auto sm:ml-0">
                <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }} className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500" aria-haspopup="true" aria-expanded={isMenuOpen} title={t('common.actions')} disabled={deleteProductMutation.isPending || updateProductMutation.isPending}>
                    <IoEllipsisVertical />
                </button>
                {isMenuOpen && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20 py-1" role="menu" onClick={(e) => e.stopPropagation()}>
                        {/* Lien Modifier */}
                        <a href={`/products/${product.id}`} role="menuitem" className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left">
                            <IoPencil className="w-4 h-4" /> {t('common.edit')}
                        </a>
                        {/* Action Visibilité */}
                        <button onClick={handleToggleVisibility} role="menuitem" className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left disabled:opacity-50" disabled={updateProductMutation.isPending}>
                            {isVisible ? <IoEyeOffOutline className="w-4 h-4" /> : <IoEyeOutline className="w-4 h-4" />}
                            {isVisible ? t('productList.setHidden') : t('productList.setVisible')}
                        </button>
                        {/* Action Supprimer */}
                        <button onClick={handleDelete} role="menuitem" className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 w-full text-left disabled:opacity-50" disabled={deleteProductMutation.isPending}>
                            <IoTrash className="w-4 h-4" /> {t('common.delete')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}


export function ProductItemSkeletonRow() {
    return (
        // Dimensions et styles similaires à ProductItemRow
        <div className="product-item-row flex items-center gap-3 sm:gap-4 p-2.5 bg-white rounded-lg shadow-sm border border-gray-200 w-full animate-pulse">

            {/* Image Placeholder */}
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-md bg-gray-300 flex-shrink-0"></div>

            {/* Nom & ID Placeholder */}
            <div className="flex-grow min-w-0 flex flex-col gap-1">
                <div className="h-5 w-3/5 bg-gray-300 rounded"></div> {/* Nom */}
                <div className="h-3 w-2/5 bg-gray-200 rounded"></div> {/* ID */}
            </div>

            {/* Catégories Placeholder (visible sur md+) */}
            <div className="hidden md:flex h-4 w-20 bg-gray-200 rounded flex-shrink-0"></div>

            {/* Prix Placeholder (visible sur sm+) */}
            <div className="hidden sm:flex h-5 w-16 bg-gray-200 rounded flex-shrink-0"></div>

            {/* Stock & Visibilité Placeholder (visible sur lg+) */}
            <div className="hidden lg:flex h-5 w-20 bg-gray-200 rounded flex-shrink-0"></div>

            {/* Actions Placeholder */}
            <div className="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0 ml-auto sm:ml-0"></div>
        </div>
    );
}