// Components/ProductItem/ProductRowItem.tsx
import { IoChevronForward, IoCopyOutline, IoEllipsisVertical, IoEyeOffOutline, IoEyeOutline, IoPencil, IoPeopleSharp, IoStarHalf, IoTrash, IoWarningOutline } from 'react-icons/io5';
import { ProductInterface, CategoryInterface } from '../../Interfaces/Interfaces';
import { getFileType, shortNumber, getId, limit, copyToClipboard } from '../Utils/functions';
import { getImg } from '../Utils/StringFormater';
import { getDefaultValues } from '../Utils/parseData';
import { useStore } from '../../pages/stores/StoreStore';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
// Importer les hooks de mutation si les actions sont faites ici
import { useDeleteProduct, useUpdateProduct } from '../../api/ReactSublymusApi'; // Exemple
import logger from '../../api/Logger';
import { NO_PICTURE } from '../Utils/constants';


export { ProductRowItem };

function ProductRowItem({ product, categoriesMap }: { product: ProductInterface, categoriesMap?: Map<string, CategoryInterface> }) {
    const { t } = useTranslation();
    const { currentStore } = useStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [copiedId, setCopiedId] = useState(false);

    // TODO: Récupérer le vrai statut de visibilité et le stock
    const isVisible = true; // Exemple
    const stockLevel = 50; // Exemple
    const stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = stockLevel > 10 ? 'in_stock' : (stockLevel > 0 ? 'low_stock' : 'out_of_stock');

    // Obtenir l'image par défaut
    const defaultValues = getDefaultValues(product);
    const defaultView = defaultValues[0]?.views?.[0]||NO_PICTURE;

    // Récupérer les noms des catégories
    const productCategories = product.categories_id
        ?.map(id => categoriesMap?.get(id)?.name)
        .filter(Boolean) as string[] ?? [];

    // --- Handlers ---
    const handleCopy = (textToCopy: string | undefined) => {
         if (!textToCopy) return;
         copyToClipboard(textToCopy, () => {
             setCopiedId(true);
             setTimeout(() => setCopiedId(false), 1500);
         });
    };

    const handleDelete = () => {
         // Afficher une confirmation avant de supprimer
         if (window.confirm(t('productList.confirmDelete', { name: product.name }))) {
            // TODO: Appeler la mutation useDeleteProduct
            // deleteProductMutation.mutate(product.id);
             logger.warn(`Deletion for product ${product.id} not implemented yet.`);
         }
         setIsMenuOpen(false); // Fermer le menu
    };

     const handleToggleVisibility = () => {
         // TODO: Appeler la mutation useUpdateProduct pour changer is_visible
         // updateProductMutation.mutate({ product_id: product.id, is_visible: !isVisible });
          logger.warn(`Visibility toggle for product ${product.id} not implemented yet.`);
         setIsMenuOpen(false); // Fermer le menu
    };


    return (
        // Conteneur ligne: flex, items-center, gap, padding, bg, rounded, shadow, hover
        <div className="product-row-item flex items-center gap-3 sm:gap-4 p-2.5 bg-white rounded-lg shadow-sm border border-transparent hover:border-gray-200 hover:shadow-sm transition duration-150 w-full">

            {/* Image Miniature */}
            <a href={`/products/${product.id}`} className="flex-shrink-0">
                <div
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-md bg-cover bg-center bg-gray-200"
                    style={{ background: getImg(defaultView, 'cover', currentStore?.url)+',#3331' }}
                ></div>
            </a>

            {/* Colonne Nom & ID */}
            {/* Utiliser flex-grow min-w-0 pour permettre le shrink et truncate */}
            <div className="flex-grow min-w-0 flex flex-col">
                <a href={`/products/${product.id}`} className="group">
                    <h3
                        className='font-medium text-sm sm:text-base text-gray-800 group-hover:text-blue-600 truncate'
                        title={product.name}
                    >
                        {product.name}
                    </h3>
                </a>
                <p
                    className='text-xs text-gray-400 mt-0.5 flex items-center gap-1 group cursor-pointer w-fit' // w-fit pour ajuster la largeur cliquable
                    title={t('common.copyId')}
                    onClick={() => handleCopy(getId(product.id))}
                >
                    ID: {getId(product.id)}
                    <IoCopyOutline className={`w-3 h-3 transition-all ${copiedId ? 'text-green-500 scale-110' : 'text-gray-400 opacity-0 group-hover:opacity-60'}`} />
                </p>
            </div>

            {/* Colonne Catégories (visible sur écrans moyens+) */}
            <div className="hidden md:flex flex-wrap gap-1 items-center flex-shrink-0 max-w-[200px]">
                {productCategories.slice(0, 2).map((catName, index) => ( // Limiter à 2 catégories
                    <span key={index} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                        {limit(catName, 15)} {/* Limiter longueur nom catégorie */}
                    </span>
                ))}
                 {productCategories.length > 2 && (
                     <span className="text-xs text-gray-400">+{productCategories.length - 2}</span>
                 )}
            </div>

             {/* Colonne Prix */}
             <div className="hidden sm:flex flex-col items-end flex-shrink-0 w-24">
                 <span className='text-sm font-medium text-gray-800'>
                     {Number(product.price || 0).toLocaleString()} {product.currency}
                 </span>
                 {product.barred_price && product.barred_price > product.price && (
                     <span className="text-xs text-gray-400 line-through">{product.barred_price.toLocaleString()}</span>
                 )}
             </div>

             {/* Colonne Stock & Visibilité */}
             <div className="hidden lg:flex items-center gap-2 flex-shrink-0 w-28">
                 {/* Visibilité */}
                 <span title={isVisible ? t('productList.visible') : t('productList.hidden')}>
                     {isVisible
                        ? <IoEyeOutline className="w-4 h-4 text-green-500" />
                        : <IoEyeOffOutline className="w-4 h-4 text-gray-400" />}
                 </span>
                  {/* Stock */}
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                       stockStatus === 'in_stock' ? 'bg-green-100 text-green-700' :
                       stockStatus === 'low_stock' ? 'bg-yellow-100 text-yellow-700' :
                       'bg-red-100 text-red-700'
                  }`}>
                      {t(`productList.stockStatus.${stockStatus}`, { count: stockLevel })} 
                  </span>
             </div>

             {/* Colonne Actions */}
             <div className="relative flex-shrink-0">
                 {/* Bouton Kebab */}
                <button
                    onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                    className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    aria-haspopup="true"
                    aria-expanded={isMenuOpen}
                    title={t('common.actions')} // 🌍 i18n
                >
                    <IoEllipsisVertical />
                </button>
                {/* Menu déroulant */}
                 {isMenuOpen && (
                     <div
                         className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10 py-1"
                         role="menu"
                         aria-orientation="vertical"
                         onClick={() => setIsMenuOpen(false)} // Fermer au clic dans le menu
                     >
                        {/* Lien Modifier */}
                        <a href={`/products/${product.id}/edit`} role="menuitem" className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left">
                             <IoPencil className="w-4 h-4" /> {t('common.edit')} 
                        </a>
                         {/* Action Visibilité */}
                         <button onClick={handleToggleVisibility} role="menuitem" className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left">
                             {isVisible ? <IoEyeOffOutline className="w-4 h-4" /> : <IoEyeOutline className="w-4 h-4" />}
                             {isVisible ? t('productList.setHidden') : t('productList.setVisible')} 
                         </button>
                          {/* Action Supprimer */}
                          <button onClick={handleDelete} role="menuitem" className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 w-full text-left">
                              <IoTrash className="w-4 h-4" /> {t('common.delete')} 
                         </button>
                         {/* Ajouter d'autres actions (Dupliquer, etc.) */}
                    </div>
                 )}
             </div>

        </div>
    );
}