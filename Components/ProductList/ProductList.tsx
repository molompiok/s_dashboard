// Components/ProductList/ProductList.tsx
import { AnimatePresence, motion } from 'framer-motion';
import { ProductItemCard } from '../ProductItem/ProductItemCard';
import { ProductRowItem } from '../ProductItem/ProductRowItem';

import { useGetProductList } from '../../api/ReactSublymusApi';
import { useEffect, useState } from 'react';
import { useGlobalStore } from '../../pages/stores/StoreStore';
import { IoAppsSharp, IoListSharp, IoChevronDown, IoSearch } from 'react-icons/io5';
import { OrderFilterComponent, PriceFilterComponent } from '../CommandesList/CommandesList';
import { CategoryInterface, FilterType, ProductInterface } from '../../Interfaces/Interfaces';
import { useTranslation } from 'react-i18next';
import { ClientCall, debounce } from '../Utils/functions';
import { ProductItemSkeletonCard } from '../ProductItem/ProductItemCard';
import { ProductItemSkeletonRow } from '../ProductItem/ProductRowItem';
import { Pagination } from '../Pagination/Pagination';
import { VisibleFilterComponent } from './VisibleFilter';


export { ProductList };

type ProductViewType = 'card' | 'row';

function ProductList({ baseFilter, title, addTo }: { title?: string, addTo?: { category_id: string, text: string } | null, baseFilter?: FilterType }) {
    const { t } = useTranslation();
    const [filter, setFilter] = useState<FilterType>(baseFilter || {});
    const [viewType, setViewType] = useState<ProductViewType>(ClientCall(function () { return localStorage.getItem('product:view_type') }) as any || 'card');
    const { currentStore } = useGlobalStore();

    const { data: productsData, isLoading, isError, error: apiError } = useGetProductList(
        { ...filter, with_feature: true, },
        { enabled: !!currentStore }
    );
    const products = productsData?.list ?? [];
    const meta = productsData?.meta;


    useEffect(() => {
        localStorage.setItem('product:view_type', viewType)
    }, [viewType])

    return (
        <div className="w-full flex flex-col  mt-2">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                <h1 className="m-0 text-xl font-semibold text-gray-800">{title || t('dashboard.products')}</h1>
                <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                    <label htmlFor="product-search-input" className='relative'>
                        <input
                            className="w-48 sm:w-64 pl-3 pr-10 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder={t('dashboard.searchPlaceholder')}
                            id="product-search-input"
                            type="text"
                            defaultValue={filter.search || ''}
                            onChange={(e) => {
                                const search = e.target.value;
                                debounce(() => setFilter((prev) => ({ ...prev, search: search || undefined, page: 1 })), 'search-product', 400);
                            }}
                        />
                        <IoSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                    </label>
                    <div className="flex items-center border border-gray-300 rounded-md p-0.5 bg-gray-100">
                        <button
                            onClick={() => { setViewType('card') }}
                            title={t('productList.viewCard')}
                            className={`p-1.5 rounded ${viewType === 'card' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                            <IoAppsSharp size={18} />
                        </button>
                        <button
                            onClick={() => setViewType('row')}
                            title={t('productList.viewRow')}
                            className={`p-1.5 rounded ${viewType === 'row' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                            <IoListSharp size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <ProductsFilters filter={filter} setCollected={setFilter} />

            {isError && <div className="p-6 text-center text-red-500">{apiError?.message || t('error_occurred')}</div>}

            {!isError && (
                <div className={`mt-6 ${viewType === 'card'
                    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4'
                    : 'flex flex-col gap-3'
                    }`}>
                    {viewType === 'card' && addTo !== null && <AddProductCard addTo={addTo} />}
                    {viewType === 'row' && addTo !== null && <AddProductRow addTo={addTo} />}
                    {isLoading && (
                        viewType === 'card'
                            ? Array.from({ length: 5 }).map((_, i) => <ProductItemSkeletonCard />)
                            : Array.from({ length: 5 }).map((_, i) => <ProductItemSkeletonRow />)
                    )}
                    <AnimatePresence>
                        {products.map((p) => (
                            viewType === 'card' ? (
                                <ProductItemCard key={p.id} product={p} />
                            ) : <ProductRowItem key={p.id}
                                categoriesMap={
                                    p.categories &&
                                    new Map<string, CategoryInterface>(
                                        p.categories.map((category) => [category.id, category])
                                    )
                                }
                                product={p}
                            />
                        ))}

                        {products.length === 0 && !isLoading && (
                            <motion.p
                                key="no-products"
                                className={`text-gray-500 text-center py-10 ${viewType === 'card' ? 'col-span-full' : ''}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {t('productList.noProductsFound')}
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {meta && meta.total > meta.per_page && (
                <Pagination
                    currentPage={meta.current_page}
                    lastPage={meta.last_page}
                    total={meta.total}
                    perPage={meta.per_page}
                    onPageChange={(newPage) => setFilter(prev => ({ ...prev, page: newPage }))}
                />
            )}
        </div>
    );
}

function AddProductCard({ addTo }: { addTo?: { category_id: string, text: string } | null }) {
    const { t } = useTranslation();
    return (
        <a href={`/products/new${addTo?.category_id ? '?catrgory_id=' + addTo.category_id : ''}`} className=" rounded-xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 transition duration-200 cursor-pointer flex flex-col items-center justify-center text-center p-4 text-gray-500 hover:text-blue-600">
            <div className="w-24 h-24 mb-4">
                <img src={'/res/empty/Empty_bag.png'} alt={t('productList.addProduct')} className='w-full h-full object-contain opacity-70' />
            </div>
            <span className="text-sm font-medium">{addTo?.text || t('productList.addProduct')}</span>
        </a>
    );
}
function AddProductRow({ addTo }: { addTo?: { category_id: string, text: string } | null }) {
    const { t } = useTranslation();
    return (
        <a href={`/products/new${addTo?.category_id ? '?catrgory_id=' + addTo.category_id : ''}`} className="flex items-center justify-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 transition duration-200 cursor-pointer text-gray-500 hover:text-blue-600">
            <span className="text-sm font-medium">{addTo?.text || t('productList.addProduct')}</span>
        </a>
    );
}

function ProductsFilters({ filter, setCollected }: { filter: FilterType, setCollected: (filter: FilterType) => any }) {
    const { t } = useTranslation();
    const [currentFilter, setCurrentFilter] = useState('');

    const handleFilterChange = (newFilterData: Partial<FilterType>) => {
        setCollected({ ...filter, ...newFilterData, page: 1 });
    };
    const toggleFilter = (filterName: string) => {
        setCurrentFilter(current => current === filterName ? '' : filterName);
    };


    return (
        <div className="w-full flex flex-col mb-0">
            <div className="w-full flex items-center p-2 gap-3 overflow-x-auto overflow-y-hidden rounded-xl scrollbar-hide border-b border-gray-200">
                <div
                    onClick={() => toggleFilter('order')}
                    className={`inline-flex items-center border rounded-lg px-2 py-0.5 cursor-pointer transition duration-200 whitespace-nowrap text-sm
                          ${filter.order_by ? 'text-blue-600 bg-blue-100/60 border-blue-200' : 'text-gray-600 border-gray-300'}
                          ${currentFilter === 'order' ? '!bg-blue-100/80 !border-blue-300' : 'hover:bg-gray-100'}`}
                >
                    <span>{t('dashboard.orderFilters.order')}</span>
                    <IoChevronDown className={`ml-2 transition-transform duration-200 ${currentFilter === 'order' ? 'rotate-180' : ''}`} />
                </div>
                <div
                    onClick={() => toggleFilter('price')}
                    className={`inline-flex items-center border rounded-lg px-2 py-0.5 cursor-pointer transition duration-200 whitespace-nowrap text-sm
                          ${filter.min_price !== undefined || filter.max_price !== undefined ? 'text-blue-600 bg-blue-100/60 border-blue-200' : 'text-gray-600 border-gray-300'}
                          ${currentFilter === 'price' ? '!bg-blue-100/80 !border-blue-300' : 'hover:bg-gray-100'}`}
                >
                    <span>{t('dashboard.orderFilters.price')}</span>
                    <IoChevronDown className={`ml-2 transition-transform duration-200 ${currentFilter === 'price' ? 'rotate-180' : ''}`} />
                </div>
                <div
                    onClick={() => toggleFilter('is_visible')}
                    className={`inline-flex items-center border rounded-lg px-2 py-0.5 cursor-pointer transition duration-200 whitespace-nowrap text-sm
                          ${filter.is_visible !== undefined ? 'text-blue-600 bg-blue-100/60 border-blue-200' : 'text-gray-600 border-gray-300'}
                          ${currentFilter === 'is_visible' ? '!bg-blue-100/80 !border-blue-300' : 'hover:bg-gray-100'}`}
                >
                    <span>{t('common.visible')}</span>
                    <IoChevronDown className={`ml-2 transition-transform duration-200 ${currentFilter === 'is_visible' ? 'rotate-180' : ''}`} />
                </div>
            </div>
            <div className="mt-2">
                <OrderFilterComponent active={currentFilter == 'order'} order={filter.order_by == 'price_asc' ? 'total_price_asc' : filter.order_by == 'price_desc' ? 'total_price_desc' : filter.order_by} setOrder={(order_by) => {
                    setCollected({
                        ...filter,
                        order_by: order_by == 'total_price_asc' ? 'price_asc' : order_by == 'total_price_desc' ? 'price_desc' : order_by,
                    })
                }} />
                <PriceFilterComponent
                    active={currentFilter === 'price'}
                    prices={[filter.min_price, filter.max_price]}
                    setPrice={(prices) => handleFilterChange({ min_price: prices?.[0], max_price: prices?.[1] })} />
                <VisibleFilterComponent
                    active={currentFilter == 'is_visible'}
                    visible={filter.is_visible}
                    setVisible={(visibility) => {
                        setCollected({
                            ...filter,
                            is_visible: visibility,
                        })
                    }} />
            </div>
        </div>
    );
}
