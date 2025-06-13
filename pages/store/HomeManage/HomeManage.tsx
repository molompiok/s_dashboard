import { useMemo } from 'react';
import { IoBagHandle, IoStorefront, IoFolderOpen, IoAdd, IoTrendingUp } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';
import { useGetProductList, useGetCategories } from '../../../api/ReactSublymusApi';
import { useGlobalStore } from '../../../api/stores/StoreStore';
import { navigate } from 'vike/client/router';

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
        shadow: 'dark:shadow-blue-800/50 shadow-blue-200/50',
        accent: 'bg-blue-500'
    },
    cyan: {
        text: 'text-cyan-600',
        bg: 'bg-cyan-50',
        shadow: 'dark:shadow-cyan-800/50 shadow-cyan-200/50',
        accent: 'bg-cyan-500'
    },
    emerald: {
        text: 'text-emerald-600',
        bg: 'bg-emerald-50',
        shadow: 'dark:shadow-emerald-800/50 shadow-emerald-200/50',
        accent: 'bg-emerald-500'
    },
    amber: {
        text: 'text-amber-600',
        bg: 'bg-amber-50',
        shadow: 'dark:shadow-amber-800/50 shadow-amber-200/50',
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
    const { currentStore } = useGlobalStore()
    // API calls avec optimisations
    const {
        data: productData,
        isLoading: isLoadingProducts,
        isError: isErrorProducts
    } = useGetProductList({
        limit: 1,
        is_visible:true
    });

    const {
        data: categoryData,
        isLoading: isLoadingCategories,
        isError: isErrorCategories
    } = useGetCategories({
        limit: 1,
        is_visible:true
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
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <IoTrendingUp className="min-w-5 min-h-5 text-blue-500" />
                    {t('dashboard.quickManage', { storeName: currentStore?.name?.toString() || '' })}
                </h2>
                {/* <button className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-150">
        {t('common.viewAll')}
      </button> */}
            </div>

            {/* Conteneur scrollable avec cartes */}
            <div className="w-full flex gap-4 overflow-y-hidden overflow-x-auto p-2 pb-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
                {manageCards.map(card => (
                    <ManageCard key={card.id} {...card} />
                ))}

                {/* Espaceur pour éviter que la dernière carte colle au bord */}
                <div className="min-w-4 flex-shrink-0" />
            </div>
        </div>
    );
}


function ManageCard({
    title,
    count,
    href,
    icon: Icon,
    color,
    isLoading = false,
    isError = false,
}: ManageCard) {
    const { t } = useTranslation();

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        navigate(href);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate(href);
        }
    };

    return (
        <button
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            className={`${CARD_BASE_CLASSES} ${color.shadow} ${isError ? 'opacity-60 cursor-not-allowed' : ''} bg-white dark:bg-white/5 border border-transparent dark:border-white/10`}
            tabIndex={0}
            role="button"
            aria-label={`${title} - ${count} ${t('common.items')}`}
        >
            {/* Background Pattern */}
            <div
                className={
                    `absolute inset-0 ${color.bg} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 dark:bg-white/5` // ou dark:bg-black/10 selon l'effet souhaité
                }
            />
            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
                {/* Top Section - Icon and Status */}
                <div className="flex items-start justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${color.bg} ${color.text}  transition-transform duration-200`}>
                        <Icon className="w-6 h-6" />
                    </div>

                    {isLoading && (
                        <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin" />
                    )}
                    {isError && (
                        <div className="w-4 h-4 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                            <span className="text-red-500 dark:text-red-400 text-xs">!</span>
                        </div>
                    )}
                </div>

                {/* Bottom Section - Title and Count */}
                <div className="mt-auto flex flex-col h-full space-y-1">
                    <h3 className="font-semibold text-base h-[50px] text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                        {title}
                    </h3>
                    <div className="flex mt-auto items-center justify-between">
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
            </div>
        </button>
    );
}
