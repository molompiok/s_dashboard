// Components/ProductItem/ProductItemCard.tsx
// import './ProductItem.css'; // ❌ Supprimer

import { IoPeopleSharp, IoStarHalf, IoEyeOffOutline, IoWarningOutline } from 'react-icons/io5'; // Ajouter icônes
import { ProductInterface } from '../../Interfaces/Interfaces';
import { getFileType, shortNumber } from '../Utils/functions'; // Garder utilitaires
import { getImg } from '../Utils/StringFormater';
import { getDefaultValues } from '../Utils/parseData'; // Garder si utilisé pour image par défaut
import { useStore } from '../../pages/stores/StoreStore';
import { markdownToPlainText } from '../MarkdownViewer/MarkdownViewer';
import { useTranslation } from 'react-i18next'; // ✅ i18n
import { NO_PICTURE } from '../Utils/constants';

export { ProductItemCard };

function ProductItemCard({ product, onClick }: { onClick?: () => void, product: ProductInterface }) {
    const { t } = useTranslation(); // ✅ i18n
    const { currentStore } = useStore();

    // Simulation d'info stock (à remplacer par données réelles)
    let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = (['in_stock', 'low_stock', 'out_of_stock'] as const).at(2)||'in_stock'; // Exemple
    const isVisible = true; // Exemple

    // Obtenir l'image par défaut
    const defaultValues = getDefaultValues(product);
    const defaultView = defaultValues[0]?.views?.[0]||NO_PICTURE;
    const fileType = getFileType(defaultView);

    return (
        // Lien vers la page produit
        <a href={`/products/${product.id}`}
           // Utiliser les classes Tailwind dérivées de ProductItem.css
           className="product-item-card relative group aspect-[65/100] rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition duration-200 cursor-pointer flex flex-col bg-white"
           onClick={onClick}
        >
            {/* Conteneur Image */}
            <div className="w-full aspect-square relative flex-shrink-0 bg-gray-100">
                {fileType === 'image' ? (
                    <img
                        src={getImg(defaultView, undefined, currentStore?.url).match(/url\("?([^"]+)"?\)/)?.[1] || '/res/empty/empty-image.jpg'} // Extraire l'URL pour src
                        alt={product.name}
                        loading="lazy" // Lazy loading pour images
                        className="w-full h-full object-cover block"
                    />
                ) : fileType === 'video' ? (
                    <video
                        muted={true}
                        autoPlay
                        loop
                        playsInline // Important pour mobile
                        className="w-full h-full object-cover block"
                        src={getImg(defaultView, undefined, currentStore?.url).match(/url\("?([^"]+)"?\)/)?.[1] || ''}
                    />
                ) : (
                     <img src={getImg('/res/empty/empty-image.jpg')} alt="Placeholder" className="w-full h-full object-cover block" />
                )}
                 {/* Indicateurs (Stock, Visibilité) - Position absolue */}
                 <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {!isVisible && (
                        <span title={t('productList.hidden')} className="p-1 bg-gray-500/80 text-white rounded-full shadow">
                            <IoEyeOffOutline size={12}/>
                        </span>
                    )}
                    {stockStatus === 'low_stock' && (
                         <span title={t('productList.lowStock')} className="p-1 bg-orange-500/80 text-white rounded-full shadow">
                             <IoWarningOutline size={12}/>
                         </span>
                    )}
                     {stockStatus === 'out_of_stock' && (
                         <span title={t('productList.outOfStock')} className="p-1 bg-red-500/80 text-white rounded-full shadow">
                             <IoWarningOutline size={12}/>
                         </span>
                    )}
                 </div>
            </div>
             {/* Infos Texte */}
             {/* Utiliser px-3 pt-2 pb-3 flex flex-col flex-grow justify-between */}
            <div className="px-3 pt-2 pb-3 flex flex-col flex-grow justify-between overflow-hidden">
                <div> {/* Conteneur pour prix, nom, desc */}
                     {/* Prix */}
                     {/* Utiliser text-base font-semibold text-gray-900 */}
                     <h2 className='text-base font-semibold text-gray-900 truncate'>
                         {Number(product.price || 0).toLocaleString()} {product.currency}
                         {/* Afficher prix barré si existant */}
                         {product.barred_price && product.barred_price > product.price && (
                              <span className="ml-1.5 text-xs text-gray-400 line-through">{product.barred_price.toLocaleString()}</span>
                         )}
                    </h2>
                    {/* Nom */}
                     {/* Utiliser text-sm font-medium text-gray-700 mt-1 truncate */}
                    <h3 className='text-sm font-medium text-gray-700 mt-1 truncate' title={product.name}>{product.name}</h3>
                    {/* Description */}
                     {/* Utiliser text-xs text-gray-500 mt-0.5 h-[2.5em] line-clamp-2 */}
                     <p className='text-xs text-gray-500 mt-0.5 h-[2.5em] line-clamp-2' title={markdownToPlainText(product.description || '')}>
                         {markdownToPlainText(product.description || '')}
                    </p>
                </div>
                 {/* Rating */}
                 {/* Utiliser flex flex-wrap gap-3 mt-2 text-xs text-gray-600 */}
                 <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-600">
                     <span className="inline-flex gap-1 items-center">
                         <IoStarHalf className="text-amber-500" />
                         {/* Utiliser toFixed(1) pour une décimale */}
                         {(product.rating || 0).toFixed(1)}
                     </span>
                     <span className="inline-flex gap-1 items-center">
                         <IoPeopleSharp />
                         {/* Utiliser shortNumber */}
                         {shortNumber(product.comment_count || 0)}
                     </span>
                 </div>
            </div>
        </a>
    );
}