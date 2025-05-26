// Components/CategoriesList/CategoriesList.tsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { IoAddSharp, IoArrowForward, IoClose } from "react-icons/io5";
import { CgExtensionAdd } from "react-icons/cg";
import { useGetCategories } from '../../api/ReactSublymusApi';
import { useGlobalStore } from '../../api/stores/StoreStore';
import { useTranslation } from 'react-i18next';
import { CategoryItemMini } from '../CategoryItem/CategoryItemMini';

const CATEGORY_ITEM_MIN_WIDTH = 80;
const GAP_SIZE = 8;

export { CategoriesList };

function CategoriesList({ title }: { title?: string }) {
    const { t } = useTranslation();
    const { currentStore } = useGlobalStore();
    const listRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState<number>(0);

    const { data: categoriesData, isLoading, isError } = useGetCategories(
        { limit: 20, with_product_count: true },
        { enabled: !!currentStore }
    );
    const allCategories = categoriesData?.list ?? [];
    const totalCategories = categoriesData?.meta?.total ?? allCategories.length;

    useEffect(() => {
        if (!listRef.current) return;
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                setContainerWidth(entry.contentRect.width);
            }
        });
        resizeObserver.observe(listRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    const itemsToShow = useMemo(() => {
        if (containerWidth === 0) return 5;
        const effectiveWidth = containerWidth + GAP_SIZE;
        const itemTotalWidth = CATEGORY_ITEM_MIN_WIDTH + GAP_SIZE;
        const itemsPerRow = Math.max(1, Math.floor(effectiveWidth / itemTotalWidth));
        return Math.max(0, (itemsPerRow * 2) - 2); // moins (ajouter et voir plus)
    }, [containerWidth]);

    const displayCategories = useMemo(() => allCategories.slice(0, itemsToShow), [allCategories, itemsToShow]);
    const canSeeMore = totalCategories > displayCategories.length;

    return (
        <div className="w-full flex flex-col">
            <h1 className="text-lg font-semibold text-gray-800 mb-3">
                {title || t('dashboard.categories')}
            </h1>
            <div
                className="w-full flex flex-wrap items-start gap-2 min-h-[180px]" /* gap-2 (8px), min-h pour 2 lignes approx */
                ref={listRef}
            >
                <AddCategory isNew={allCategories.length === 0} />
                {isLoading && Array.from({ length: 5 }).map((_, i) => <CategoryItemSkeleton key={`skel-${i}`} />)}
                {!isLoading && !isError && displayCategories.map((c) =>
                    <CategoryItemMini key={c.id} category={c} openCategory />
                )}
                {isError && <p className='text-red-500 text-sm'>{t('category.fetchFailed')}</p>}
                {!isLoading && !isError && canSeeMore && <SeeMoreLink />}

            </div>
        </div>
    );
}


// --- Composant interne: AddCategory ---
function AddCategory({ isNew }: { isNew: boolean }) {
    const { t } = useTranslation(); // ✅ i18n
    if (isNew) {
        return (
            // Style pleine largeur si c'est le seul élément
            // Utiliser flex, items-center, gap-6, p-4, rounded-xl, border-dashed etc.
            <a href='/categories/new' className="w-full flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 text-blue-700 hover:border-blue-400 hover:bg-blue-100 transition duration-150 cursor-pointer">
                <CgExtensionAdd className='w-12 h-12 text-blue-500 flex-shrink-0' />
                <div className='text-center sm:text-left'>
                    <p className='font-semibold'>{t('category.addNewPromptTitle')}</p>
                    <p className='text-sm'>{t('category.addNewPromptDesc')}</p>
                </div>
                {/* Optionnel: bouton explicite */}
                {/* <button className='ml-auto bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700'>
                     {t('category.addNewButton')}
                 </button> */}
            </a>
        );
    } else {
        return (
            // Petit bouton carré
            // Utiliser w-20 h-20, flex, flex-col, items-center, justify-center, etc.
            <a href='/categories/new' className="w-20 h-20 p-1.5 rounded-xl transition duration-200 ease-in-out flex flex-col items-center justify-center text-center cursor-pointer bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 border border-gray-300 hover:border-gray-400 hover:scale-105">
                <IoAddSharp className='w-8 h-8 mb-1' />
                <span className='text-xs font-medium'>{t('common.add')}</span>
            </a>
        );
    }
}

// --- Composant interne: SeeMoreLink ---
function SeeMoreLink() {
    const { t } = useTranslation(); // ✅ i18n
    return (
        // Utiliser w-20 h-20, flex, flex-col, items-center, justify-center, etc.
        <a href="/categories" className="w-20 h-20 p-1.5 rounded-xl transition duration-200 ease-in-out flex flex-col items-center justify-center text-center cursor-pointer bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border border-blue-200 hover:border-blue-300 hover:scale-105">
            <IoArrowForward className='w-8 h-8 mb-1' />
            <span className='text-xs font-medium'>{t('common.seeAll')}</span>
        </a>
    );
}

// --- Composant interne: CategoryItemSkeleton ---
function CategoryItemSkeleton() {
    return (
        <div className="w-20 h-20 p-1.5 rounded-xl bg-gray-200 animate-pulse flex flex-col items-center">
            <div className="w-full aspect-square rounded bg-gray-300 mb-1"></div>
            <div className="w-10/12 h-2 rounded bg-gray-300"></div>
        </div>
    );
}