// components/Stats/Modals/ProductItemSmall.tsx
import React from 'react';
import { ProductInterface } from '../../../api/Interfaces/Interfaces'; // Ajustez le chemin
import { getMedia } from '../../Utils/StringFormater'; // Ajustez le chemin
import { useTranslation } from 'react-i18next'; // i18n
import { useGlobalStore } from '../../../api/stores/StoreStore';
import { getDefaultValues } from '../../Utils/parseData';
import { NO_PICTURE } from '../../Utils/constants';

interface ProductItemSmallProps {
    product: ProductInterface;
}

const ProductItemSmall: React.FC<ProductItemSmallProps> = ({ product }) => {
    const { t } = useTranslation();

    const { currentStore } = useGlobalStore()
    const values = getDefaultValues(product)[0]
    const mainImage = values?.views?.[0] ? getMedia({ isBackground: true, source: values.views?.[0], from: 'api' }) : getMedia({ isBackground: true, source: NO_PICTURE }); // Image par défaut

    const currency = product.currency || 'FCFA'; // Utiliser devise du produit ou fallback

    return (
        <div className="product-item-small flex items-center gap-4 p-3 rounded-lg w-full bg-white"> {/* Ajouté bg-white si liste est en bg-gray */}
            {/* Image Produit */}
            <div
                className="w-12 h-12 rounded bg-cover bg-center bg-no-repeat shrink-0"
                style={{ background: mainImage }}
            ></div>
            {/* Infos principales */}
            <div className="flex-grow min-w-0 flex flex-col gap-1">
                {/* Nom */}
                <p className="text-sm font-medium text-gray-800 truncate">{product.name || t('common.unknownProduct')}</p>
                {/* Prix & Stock ou Rating (adapter selon les données dispos ou pertinentes ici) */}
                <div className="text-xs text-gray-500 flex items-center gap-2">
                    {product.price !== undefined ? (
                        <span>{product.price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} {currency}</span>
                    ) : (
                        <span>{t('common.noPrice')}</span>
                    )}
                    {/* Vous pourriez ajouter product.stock si pertinent: */}
                    {/* {product.stock !== undefined && <span>Stock: {product.stock}</span>} */}
                </div>
            </div>
            {/* Potentiel Rating ou icone, selon design souhaité */}
            {/* {product.rating !== undefined && product.comment_count > 0 && (
                 <div className="flex items-center gap-1 text-yellow-500 text-xs font-semibold">
                      <IoStar size={12} /> {product.rating.toFixed(1)} ({product.comment_count})
                 </div>
             )} */}
        </div>
    );
};

export default ProductItemSmall;