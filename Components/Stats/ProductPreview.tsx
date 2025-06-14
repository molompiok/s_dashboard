// components/Stats/ProductPreview.tsx
import React from 'react';
import { ProductInterface } from '../../api/Interfaces/Interfaces';
import { useTranslation } from 'react-i18next';
import { getMedia } from '../Utils/StringFormater';
import { Star, Tag, Eye, DollarSign } from 'lucide-react';
import { getDefaultValues } from '../Utils/parseData';
import { NO_PICTURE } from '../Utils/constants';

interface ProductPreviewProps {
    product: ProductInterface | undefined; // Can be undefined
    isLoading: boolean; // To handle loading state
}

// 🎨 Sous-composant pour un élément de statistique
const StatItem: React.FC<{ icon: React.ElementType; children: React.ReactNode; colorClass?: string }> = ({ icon: Icon, children, colorClass = 'text-gray-500 dark:text-gray-400' }) => (
    <div className="flex items-center gap-2 text-sm">
        <Icon className={`w-4 h-4 flex-shrink-0 ${colorClass}`} />
        <span className="text-gray-700 dark:text-gray-300">{children}</span>
    </div>
);

// 🎨 Skeleton pour la prévisualisation du produit
const ProductPreviewSkeleton: React.FC = () => (
    <div className="bg-white/80 dark:bg-white/5 backdrop-blur-lg p-6 rounded-lg shadow-sm border border-gray-200/80 dark:border-white/10 mb-6 animate-pulse">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
            <div className="w-28 h-28 rounded-lg bg-gray-300 dark:bg-gray-700 flex-shrink-0"></div>
            <div className="flex flex-col gap-4 flex-grow min-w-0 w-full">
                <div className="h-7 w-3/4 bg-gray-300 dark:bg-gray-700 rounded-md"></div>
                <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded-md"></div>
                <div className="h-10 w-1/3 bg-gray-200 dark:bg-gray-800 rounded-md mt-2"></div>
                <div className="h-10 w-1/4 bg-gray-300 dark:bg-gray-700 rounded-lg mt-4 self-center lg:self-start"></div>
            </div>
        </div>
    </div>
);


const ProductPreview: React.FC<ProductPreviewProps> = ({ product, isLoading }) => {
    const { t } = useTranslation();

    // 🎨 Gérer les états de chargement et vide
    if (isLoading) {
        return <ProductPreviewSkeleton />;
    }

    if (!product) {
        return (
            <div className="flex items-center justify-center text-center h-full min-h-[250px] bg-white/80 dark:bg-white/5 backdrop-blur-lg p-6 rounded-lg shadow-sm border border-dashed border-gray-300 dark:border-white/10 mb-6">
                <p className="text-gray-500 dark:text-gray-400">{t('stats.selectProductPrompt')}</p>
            </div>
        );
    }

    const values = getDefaultValues(product)[0];
    const mainImage = values?.views?.[0] ? getMedia({ isBackground: true, source: values.views?.[0], from: 'api' }) : getMedia({ isBackground: true, source: NO_PICTURE });

    const formatCurrency = (value: number | null | undefined, currency: string = 'EUR'): string => {
        if (value === undefined || value === null) return '-';
        return Number(value).toLocaleString(t('common.locale'), { style: 'currency', currency });
    };

    return (
        // 🎨 Conteneur principal avec effet verre dépoli
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-lg p-6 rounded-lg shadow-sm border border-gray-200/80 dark:border-white/10 mb-6">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
                {/* Image Produit */}
                <div className="flex-shrink-0">
                    <div
                        className="w-28 h-28 rounded-lg bg-cover bg-center border border-gray-200/50 dark:border-gray-700/50 shadow-md"
                        style={{ backgroundImage: mainImage }}
                    ></div>
                </div>

                {/* Infos Produit */}
                <div className="flex flex-col gap-3 flex-grow min-w-0 text-center lg:text-left w-full">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate" title={product.name}>
                        {product.name || t('common.unknownProduct')}
                    </h2>

                    {/* Catégories & Stats */}
                    <div className="flex flex-wrap justify-center lg:justify-start items-center gap-x-4 gap-y-2">
                        {product.categories && product.categories.length > 0 && (
                            <StatItem icon={Tag}>
                                {product.categories.map(cat => cat.name).join(', ')}
                            </StatItem>
                        )}
                        <StatItem icon={Star} colorClass="text-amber-500 dark:text-amber-400">
                            {product.rating?.toFixed(1) ?? '-'} / 5 ({product.comment_count ?? 0})
                        </StatItem>
                        {product.is_visible !== undefined && (
                            <StatItem icon={Eye} colorClass={product.is_visible ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}>
                                {product.is_visible ? t('common.visible') : t('product.hidden')}
                            </StatItem>
                        )}
                    </div>
                    
                    {/* Prix */}
                    <div className="flex items-baseline justify-center lg:justify-start gap-2 mt-1">
                        <span className="text-2xl font-extrabold text-teal-600 dark:text-teal-400">
                            {formatCurrency(product.price, product.currency)}
                        </span>
                        {product.barred_price && product.barred_price > product.price && (
                            <span className="text-base text-gray-500 dark:text-gray-500 line-through">
                                {formatCurrency(product.barred_price, product.currency)}
                            </span>
                        )}
                    </div>

                    {/* Description courte */}
                    {product.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-3">
                            {product.description}
                        </p>
                    )}

                    {/* Lien vers la page détail produit */}
                    <div className="mt-4 text-center lg:text-left">
                        <a href={`/products/${product.id}`} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-teal-500 transition-colors">
                            {t('product.viewDetails')}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductPreview;