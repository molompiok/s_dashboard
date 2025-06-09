import { useMemo } from 'react';
import { IoBagHandle, IoStorefront, IoFolderOpen, IoAdd, IoTrendingUp } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';
import { useGetProductList, useGetCategories } from '../../../api/ReactSublymusApi';
import { useGlobalStore } from '../../../api/stores/StoreStore';

// Types pour une meilleure type safety
interface ManageCard {
  id: string;
  title: string;
  count: number;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: {
    text: string;
    bg: string;
    shadow: string;
    accent: string;
  };
  isLoading?: boolean;
  isError?: boolean;
  images?: string[];
}

// Constantes de couleurs pour éviter la duplication
const CARD_COLORS = {
  blue: {
    text: 'text-blue-600',
    bg: 'bg-blue-50',
    shadow: 'shadow-blue-200/50',
    accent: 'bg-blue-500'
  },
  cyan: {
    text: 'text-cyan-600',
    bg: 'bg-cyan-50',
    shadow: 'shadow-cyan-200/50',
    accent: 'bg-cyan-500'
  },
  emerald: {
    text: 'text-emerald-600',
    bg: 'bg-emerald-50',
    shadow: 'shadow-emerald-200/50',
    accent: 'bg-emerald-500'
  },
  amber: {
    text: 'text-amber-600',
    bg: 'bg-amber-50',
    shadow: 'shadow-amber-200/50',
    accent: 'bg-amber-500'
  }
} as const;

// Classes CSS réutilisables
const CARD_BASE_CLASSES = `
  group relative w-[140px] min-w-[140px] h-[160px] rounded-2xl p-4 
  flex flex-col justify-between cursor-pointer transition-all duration-200 
  ease-in-out hover:scale-105 hover:shadow-lg active:scale-95 
  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
  bg-white border border-gray-100
`.trim();

export function HomeManage() {
    const { t } = useTranslation();
    
    // API calls avec optimisations
    const { 
        data: productData, 
        isLoading: isLoadingProducts,
        isError: isErrorProducts 
    } = useGetProductList({ 
        limit: 1 
    });
    
    const { 
        data: categoryData,
        isLoading: isLoadingCategories,
        isError: isErrorCategories 
    } = useGetCategories({ 
        limit: 1 
    });
    
    const { stores } = useGlobalStore();

    // Configuration des cartes avec mémoisation
    const manageCards: ManageCard[] = useMemo(() => [
        {
            id: 'products',
            title: t('dashboard.products'),
            count: productData?.meta?.total ?? 0,
            href: '/products',
            icon: IoBagHandle,
            color: CARD_COLORS.blue,
            isLoading: isLoadingProducts,
            isError: isErrorProducts
        },
        {
            id: 'categories',
            title: t('dashboard.categories'),
            count: categoryData?.meta?.total ?? 0,
            href: '/categories',
            icon: IoFolderOpen,
            color: CARD_COLORS.cyan,
            isLoading: isLoadingCategories,
            isError: isErrorCategories
        },
        {
            id: 'stores',
            title: t('dashboard.manageStores'),
            count: stores?.meta?.total ?? 1,
            href: '/stores',
            icon: IoStorefront,
            color: CARD_COLORS.emerald,
            isLoading: false,
            isError: false
        }
    ], [
        t,
        productData?.meta?.total,
        categoryData?.meta?.total,
        stores?.meta?.total,
        isLoadingProducts,
        isErrorProducts,
        isLoadingCategories,
        isErrorCategories
    ]);

    return (
        <div className="w-full">
            {/* Header avec titre et action */}
            <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <IoTrendingUp className="w-5 h-5 text-blue-500" />
                    {t('dashboard.quickManage')}
                </h2>
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-150">
                    {t('common.viewAll')}
                </button>
            </div>

            {/* Conteneur scrollable avec cartes */}
            <div className="w-full flex gap-4 overflow-y-hidden overflow-x-auto p-2 pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
                {manageCards.map(card => (
                    <ManageCard key={card.id} {...card} />
                ))}
                
                {/* Carte d'ajout rapide */}
                <AddNewCard />
                
                {/* Espaceur pour éviter que la dernière carte colle au bord */}
                <div className="min-w-4 flex-shrink-0" />
            </div>
        </div>
    );
}

// Composant ManageCard séparé pour une meilleure organisation
function ManageCard({ 
    title, 
    count, 
    href, 
    icon: Icon, 
    color, 
    isLoading = false, 
    isError = false,
    images = []
}: ManageCard) {
    const { t } = useTranslation();

    const handleClick = (e: React.MouseEvent) => {
        if (isError) {
            e.preventDefault();
            // Optionnel: Trigger un retry ou afficher un message
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!isError) {
                window.location.href = href;
            }
        }
    };

    return (
        <a
            href={href}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            className={`${CARD_BASE_CLASSES} ${color.shadow} ${isError ? 'opacity-60 cursor-not-allowed' : ''}`}
            tabIndex={0}
            role="button"
            aria-label={`${title} - ${count} ${t('common.items')}`}
        >
            {/* Background Pattern */}
            <div className={`absolute inset-0 ${color.bg} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />
            
            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
                {/* Top Section - Icon and Images */}
                <div className="flex items-start justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${color.bg} ${color.text} group-hover:scale-110 transition-transform duration-200`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    
                    {/* Status Indicator */}
                    {isLoading && (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                    )}
                    {isError && (
                        <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-red-500 text-xs">!</span>
                        </div>
                    )}
                </div>

                {/* Product Images Preview (si disponible) */}
                {images.length > 0 && (
                    <div className="flex -space-x-2 mb-3">
                        {images.slice(0, 3).map((url, index) => (
                            <div
                                key={index}
                                className="w-8 h-8 rounded-full bg-cover bg-center border-2 border-white shadow-sm"
                                style={{ backgroundImage: `url(${url})` }}
                            />
                        ))}
                        {images.length > 3 && (
                            <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-600">
                                +{images.length - 3}
                            </div>
                        )}
                    </div>
                )}

                {/* Bottom Section - Title and Count */}
                <div className="mt-auto space-y-1">
                    <h3 className="font-semibold text-base text-gray-800 group-hover:text-gray-900 transition-colors">
                        {title}
                    </h3>
                    <div className="flex items-center justify-between">
                        <span className={`text-2xl font-bold ${color.text} tabular-nums`}>
                            {isLoading ? '--' : count.toLocaleString()}
                        </span>
                        {!isLoading && !isError && count > 0 && (
                            <div className={`px-2 py-0.5 ${color.bg} ${color.text} rounded-full text-xs font-medium`}>
                                {t('common.active')}
                            </div>
                        )}
                    </div>
                </div>

                {/* Hover Indicator */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 ${color.accent} rounded-b-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200`} />
            </div>
        </a>
    );
}

// Composant pour la carte d'ajout rapide
function AddNewCard() {
    const { t } = useTranslation();

    return (
        <div className={`${CARD_BASE_CLASSES} border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/50`}>
            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center space-y-3">
                <div className="p-3 rounded-xl bg-gray-100 group-hover:bg-blue-100 transition-colors duration-200">
                    <IoAdd className="w-6 h-6 text-gray-500 group-hover:text-blue-500" />
                </div>
                <div>
                    <h3 className="font-medium text-gray-600 group-hover:text-blue-600 transition-colors mb-1">
                        {t('dashboard.addNew')}
                    </h3>
                    <p className="text-xs text-gray-500">
                        {t('dashboard.quickAdd')}
                    </p>
                </div>
            </div>
        </div>
    );
}
