import React, { useEffect, useRef, useState, useMemo } from 'react';
import { IoAddSharp, IoArrowForward, IoClose } from "react-icons/io5";
import { CgExtensionAdd } from "react-icons/cg";
import { useApi, useGetCategories } from '../../api/ReactSublymusApi';
import { useGlobalStore } from '../../api/stores/StoreStore';
import { useTranslation } from 'react-i18next';
import { CategoryItemMini } from '../CategoryItem/CategoryItemMini';
import { CategoryInterface, ListType } from '../../api/Interfaces/Interfaces';

const CATEGORY_ITEM_MIN_WIDTH = 80;
const GAP_SIZE = 8;

export { CategoriesList };

function CategoriesList({ title }: { title?: string }) {
    const { t } = useTranslation();
    const { currentStore } = useGlobalStore();
    const listRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState<number>(0);
    const [list, setList] = useState<ListType<CategoryInterface>>()
    const api = useApi();

    const { data: categoriesData, isLoading, isError, error: apiError } = useGetCategories(
        {with_product_count:true}
    );
    const allCategories = list?.list || categoriesData?.list || [];
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

    useEffect(() => {
        try {
            api.categories.getList({ with_product_count: true }).then(d => {
                setList(d)
            }).catch(() => {});
        } catch (error) {}
    }, []);

    const itemsToShow = useMemo(() => {
        if (containerWidth === 0) return 5;
        const effectiveWidth = containerWidth + GAP_SIZE;
        const itemTotalWidth = CATEGORY_ITEM_MIN_WIDTH + GAP_SIZE;
        const itemsPerRow = Math.max(1, Math.floor(effectiveWidth / itemTotalWidth));
        return Math.max(0, (itemsPerRow * 2) - 2); // moins (ajouter et voir plus)
    }, [containerWidth]);


    const displayCategories = allCategories.slice(0, itemsToShow);
    const canSeeMore = totalCategories > displayCategories.length;

    const lineCount = displayCategories.length / ((itemsToShow) / 2);
    return (
        <div className="w-full flex flex-col">
            <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                {title || t('dashboard.categories')}
            </h1>
            <div
                className={`w-full flex flex-wrap items-start gap-2 min-h-[${lineCount > 1 ? 180 : 90}px]`}
                ref={listRef}
            >
                {currentStore && !isLoading && <AddCategory isNew={allCategories.length === 0} /> }
                {isLoading && Array.from({ length: 5 }).map((_, i) => <CategoryItemSkeleton key={`skel-${i}`} />)}
                {!isLoading && !isError && displayCategories.map((c) =>
                    <CategoryItemMini key={c.id+Date.now()} category={{...c}} openCategory />
                )}
                {isError && <p className='text-red-500 dark:text-red-400 text-sm'>{t('category.fetchFailed')}</p>}
                {!isLoading && !isError && canSeeMore && <SeeMoreLink />}
            </div>
        </div>
    );
}

// --- Composant interne: AddCategory ---
function AddCategory({ isNew }: { isNew: boolean }) {
    const { t } = useTranslation();
    if (isNew) {
        return (
            <a
                href='/categories/new'
                className="w-full flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 rounded-xl border-2 border-dashed border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/10 text-teal-700 dark:text-teal-300 hover:border-teal-400 dark:hover:border-teal-600 hover:bg-teal-100 dark:hover:bg-teal-800/70 transition duration-150 cursor-pointer"
            >
                <CgExtensionAdd className='w-12 h-12 text-teal-500 dark:text-teal-400 flex-shrink-0' />
                <div className='text-center sm:text-left'>
                    <p className='font-semibold'>{t('category.addNewPromptTitle')}</p>
                    <p className='text-sm text-gray-700 dark:text-gray-300'>{t('category.addNewPromptDesc')}</p>
                </div>
            </a>
        );
    } else {
        return (
            <a
                href='/categories/new'
                className="w-20 h-20 p-1.5 rounded-xl transition duration-200 ease-in-out flex flex-col items-center justify-center text-center cursor-pointer bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover.scale-105"
            >
                <IoAddSharp className='w-8 h-8 mb-1' />
                <span className='text-xs font-medium'>{t('common.add')}</span>
            </a>
        );
    }
}

// --- Composant interne: SeeMoreLink ---
function SeeMoreLink() {
    const { t } = useTranslation();
    return (
        <a
            href="/categories"
            className="w-20 h-20 p-1.5 rounded-xl transition duration-200 ease-in-out flex flex-col items-center justify-center text-center cursor-pointer bg-teal-50 dark:bg-teal-900/50 text-teal-600 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-800/70 hover:text-teal-700 dark:hover:text-teal-400 border border-teal-200 dark:border-teal-700 hover:border-teal-300 dark:hover:border-teal-600 hover:scale-105"
        >
            <IoArrowForward className='w-8 h-8 mb-1' />
            <span className='text-xs font-medium'>{t('common.seeAll')}</span>
        </a>
    );
}

// --- Composant interne: CategoryItemSkeleton ---
function CategoryItemSkeleton() {
    return (
        <div className="w-20 h-20 p-1.5 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse flex flex-col items-center">
            <div className="w-full aspect-square rounded bg-gray-300 dark:bg-gray-600 mb-1"></div>
            <div className="w-10/12 h-2 rounded bg-gray-300 dark:bg-gray-600"></div>
        </div>
    );
}