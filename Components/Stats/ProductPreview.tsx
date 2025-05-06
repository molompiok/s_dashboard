// components/Stats/ProductPreview.tsx
import React from 'react';
import { ProductInterface } from '../../Interfaces/Interfaces'; // Assurez-vous que le chemin est correct
import { useTranslation } from 'react-i18next';
import { getImg } from '../Utils/StringFormater'; // Assurez-vous que le chemin est correct
import { Star, ShoppingCart, MessageCircle, Tag, Eye } from 'lucide-react'; // Icônes Lucide
import { getDefaultValues } from '../Utils/parseData';
import { NO_PICTURE } from '../Utils/constants';
import { useGlobalStore } from '../../pages/stores/StoreStore';
import { usePageContext } from '../../renderer/usePageContext';

interface ProductPreviewProps {
    product: ProductInterface; // Doit recevoir un objet Product valide
}

const ProductPreview: React.FC<ProductPreviewProps> = ({ product }) => {
    const { t } = useTranslation();

    if (!product) return null; // Ne rien afficher si pas de produit

    usePageContext()
    const  {currentStore} = useGlobalStore()
    const values = getDefaultValues(product)[0]
    const mainImage = values?.views?.[0] ? getImg(values.views?.[0], undefined, currentStore?.url ) : getImg(NO_PICTURE) ; // Image par défaut

     // Helper pour formater le prix
     const formatCurrency = (value: number | null | undefined, currency: string = 'FCFA'): string => {
         if (value === undefined || value === null) return '-';
         return Number(value).toLocaleString(undefined, { style: 'currency', currency: currency });
     };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Image Produit */}
            <div className="flex-shrink-0">
                 <div
                      className="w-24 h-24 rounded-lg object-cover border border-gray-200 bg-gray-100 bg-cover bg-center"
                     style={{ background: mainImage }}
                 ></div>
            </div>

            {/* Infos Produit */}
            <div className="flex flex-col gap-2 flex-grow min-w-0 text-center md:text-left">
                <h2 className="text-2xl font-semibold text-gray-900 truncate">{product.name || t('common.unknownProduct')}</h2>
                 {product.categories && product.categories.length > 0 && (
                    <p className="text-sm text-gray-600 flex items-center justify-center md:justify-start gap-1">
                         <Tag className="w-4 h-4 text-gray-400" />
                         {product.categories.map(cat => cat.name).join(', ')}
                    </p>
                 )}


                {/* Prix et Stats */}
                 <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-6 gap-y-2 mt-2">
                      <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-green-600">{formatCurrency(product.price, product.currency)}</span>
                          {product.barred_price && product.barred_price > product.price && (
                               <span className="text-sm text-gray-500 line-through">{formatCurrency(product.barred_price, product.currency)}</span>
                           )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-700">
                           <Star className="w-4 h-4 text-yellow-500" />
                           <span>{product.rating?.toFixed(1) ?? '-'} / 5</span>
                      </div>

                       <div className="flex items-center gap-2 text-sm text-gray-700">
                           <MessageCircle className="w-4 h-4 text-blue-500" />
                           <span>{t('product.commentCount', { count: product.comment_count ?? 0 })}</span>
                       </div>

                        {/* Statut de visibilité/stock si applicable et disponible dans l'interface ProductInterface */}
                        {/* Exemple basé sur 'is_visible' */}
                        
                         {product.is_visible !== undefined && (
                             <div className="flex items-center gap-2 text-sm text-gray-700">
                                  <Eye className={`w-4 h-4 ${product.is_visible ? 'text-green-500' : 'text-red-500'}`} />
                                  <span>{product.is_visible ? t('product.visible') : t('product.hidden')}</span>
                             </div>
                         )}
                        
                 </div>

                {/* Description courte si disponible */}
                 {product.description && (
                     <p className="text-sm text-gray-600 mt-2 line-clamp-3"> {/* line-clamp-3 pour limiter les lignes */}
                        {product.description}
                     </p>
                 )}

                {/* Lien vers la page détail produit */}
                 <div className="mt-4 text-center md:text-left">
                     <a href={`/products/${product.id}`} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                         {t('product.viewDetails')}
                     </a>
                 </div>
            </div>
        </div>
    );
};

export default ProductPreview;