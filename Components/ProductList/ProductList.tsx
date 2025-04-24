// Components/ProductList/ProductList.tsx
// import './ProductList.css'; // ❌ Supprimer
// import './ProductItem.css'; // ❌ Supprimer

import { ProductItemCard } from '../ProductItem/ProductItemCard'; // Renommé/Créé
import { ProductRowItem } from '../ProductItem/ProductRowItem'; // Nouveau composant

// import { useProductStore } from '../../pages/products/ProductStore'; // Remplacé
import { useGetProducts } from '../../api/ReactSublymusApi'; // ✅ Importer hook API
import { useEffect, useState } from 'react';
import { useStore } from '../../pages/stores/StoreStore';
import { IoAppsSharp, IoListSharp, IoChevronDown, IoSearch } from 'react-icons/io5'; // Ajouter icônes toggle view
import { OrderFilterComponent, PriceFilterComponent } from '../CommandesList/CommandesList'; // Réutiliser filtres si applicable
import { CategoryInterface, FilterType, ProductInterface } from '../../Interfaces/Interfaces';
import { useTranslation } from 'react-i18next'; // ✅ i18n
import { debounce } from '../Utils/functions'; // Garder debounce


export { ProductList };

// Type pour la vue (carte ou ligne)
type ProductViewType = 'card' | 'row';

function ProductList({ baseFilter }: { baseFilter?: FilterType }) {
    const { t } = useTranslation(); // ✅ i18n
    // const { fetchProducts } = useProductStore(); // Supprimé
    // const [products, setProducts] = useState<ProductInterface[]>([]); // Géré par React Query
    const [filter, setFilter] = useState<FilterType>(baseFilter || {});
    const [viewType, setViewType] = useState<ProductViewType>('card'); // État pour le type de vue
    const { currentStore } = useStore();

    // ✅ Utiliser React Query pour fetch les produits
    const { data: productsData, isLoading, isError, error: apiError } = useGetProducts(
        { ...filter, with_feature: true }, // Toujours demander les features/values ?
        { enabled: !!currentStore }
    );
    const products = productsData?.list ?? [];
    const productsMeta = productsData?.meta;

    // Mettre à jour le filtre interne si baseFilter change
    useEffect(() => {
        setFilter(prev => ({ ...prev, ...baseFilter }));
    }, [baseFilter]);

    return (
        // Utiliser flex flex-col
        <div className="w-full flex flex-col">
            {/* Barre de titre, recherche, et toggle vue */}
            {/* Utiliser flex flex-wrap justify-between items-center gap-4 mb-4 */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                {/* Utiliser m-0 text-xl font-semibold */}
                <h1 className="m-0 text-xl font-semibold text-gray-800">{t('dashboard.products')}</h1>
                <div className="flex items-center gap-2 sm:gap-4 flex-wrap"> {/* Conteneur pour recherche et toggle */}
                    {/* Recherche */}
                    <label htmlFor="product-search-input" className='relative'>
                        <input
                            className="w-48 sm:w-64 pl-3 pr-10 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder={t('dashboard.searchPlaceholder')}
                            id="product-search-input"
                            type="text"
                            defaultValue={filter.search || ''} // Utiliser defaultValue + debounce
                            onChange={(e) => {
                                const search = e.target.value;
                                debounce(() => setFilter((prev) => ({ ...prev, search: search || undefined, page: 1 })), 'search-product', 400);
                            }}
                        />
                        <IoSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                    </label>
                    {/* Toggle Vue */}
                    <div className="flex items-center border border-gray-300 rounded-md p-0.5 bg-gray-100">
                        <button
                            onClick={() => setViewType('card')}
                            title={t('productList.viewCard')} // 🌍 i18n
                            className={`p-1.5 rounded ${viewType === 'card' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                            <IoAppsSharp size={18} />
                        </button>
                        <button
                            onClick={() => setViewType('row')}
                            title={t('productList.viewRow')} // 🌍 i18n
                            className={`p-1.5 rounded ${viewType === 'row' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                            <IoListSharp size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Filtres Produits */}
            <ProductsFilters filter={filter} setCollected={setFilter} />

            {/* Liste des produits (Grille ou Lignes) */}
            {isLoading && <div className="p-6 text-center text-gray-500">{t('common.loading')}</div>}
            {isError && <div className="p-6 text-center text-red-500">{apiError?.message || t('error_occurred')}</div>}

            {!isLoading && !isError && (
                <div className={`mt-6 ${ // Ajouter marge après filtres
                    viewType === 'card'
                        // Grid pour vue carte, ajuster cols selon taille écran
                        ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
                        // Flex col pour vue ligne
                        : 'flex flex-col gap-3'
                    }`}>
                    {/* Carte Ajouter Produit (toujours visible) */}
                    {viewType === 'card' && <AddProductCard />}
                    {viewType === 'row' && <AddProductRow />} {/* Version ligne du bouton ajouter */}

                    {/* Afficher les produits */}
                    {products.map((p) => (
                        viewType === 'card'
                            ? <ProductItemCard key={p.id} product={p} />
                            : <ProductRowItem categoriesMap={p.categories && new Map<string, CategoryInterface>(
                                p.categories.map((category) => [category.id, category])
                            )} key={p.id} product={p} />
                    ))}

                    {/* Message si aucun produit */}
                    {products.length === 0 && !isLoading && (
                        // Conditionner l'affichage si 'AddProduct' est le seul élément?
                        // Pour l'instant, on l'affiche toujours
                        <p className={`text-gray-500 text-center py-10 ${viewType === 'card' ? 'col-span-full' : ''}`}>
                            {t('productList.noProductsFound')}
                        </p>
                    )}
                </div>
            )}
            {/* TODO: Ajouter pagination basée sur productsMeta */}
        </div>
    );
}

// --- Composant AddProductCard ---
function AddProductCard() {
    const { t } = useTranslation(); // ✅ i18n
    return (
        // Style similaire à ProductItemCard mais avec contenu différent
        // Utiliser flex, flex-col, items-center, justify-center, gap-5, etc.
        <a href='/products/new' className="aspect-[65/100] rounded-xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 transition duration-200 cursor-pointer flex flex-col items-center justify-center text-center p-4 text-gray-500 hover:text-blue-600">
            <div className="w-24 h-24 mb-4"> {/* Ajuster taille image */}
                <img src={'/res/empty/Empty_bag.png'} alt={t('productList.addProduct')} className='w-full h-full object-contain opacity-70' />
            </div>
            {/* Utiliser text-sm, font-medium */}
            <span className="text-sm font-medium">{t('productList.addProduct')}</span>
        </a>
    );
}
// --- Composant AddProductRow ---
function AddProductRow() {
    const { t } = useTranslation();
    return (
        <a href='/products/new' className="flex items-center justify-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 transition duration-200 cursor-pointer text-gray-500 hover:text-blue-600">
            <span className="text-sm font-medium">{t('productList.addProduct')}</span>
        </a>
    );
}

// --- Composant ProductsFilters (adapté) ---
function ProductsFilters({ filter, setCollected }: { filter: FilterType, setCollected: (filter: FilterType) => any }) {
    const { t } = useTranslation(); // ✅ i18n
    const [currentFilter, setCurrentFilter] = useState('');

    const handleFilterChange = (newFilterData: Partial<FilterType>) => {
        setCollected({ ...filter, ...newFilterData, page: 1 });
    };
    const toggleFilter = (filterName: string) => {
        setCurrentFilter(current => current === filterName ? '' : filterName);
    };

    return (
        // Utiliser flex-col
        <div className="w-full flex flex-col mb-0">
            {/* Onglets */}
            <div className="w-full flex items-center p-2 gap-3 overflow-x-auto overflow-y-hidden rounded-xl scrollbar-hide border-b border-gray-200">
                {/* Bouton Ordre */}
                <div
                    onClick={() => toggleFilter('order')}
                    className={`inline-flex items-center border rounded-lg px-2 py-0.5 cursor-pointer transition duration-200 whitespace-nowrap text-sm
                          ${filter.order_by ? 'text-blue-600 bg-blue-100/60 border-blue-200' : 'text-gray-600 border-gray-300'}
                          ${currentFilter === 'order' ? '!bg-blue-100/80 !border-blue-300' : 'hover:bg-gray-100'}`}
                >
                    <span>{t('dashboard.orderFilters.order')}</span>
                    <IoChevronDown className={`ml-2 transition-transform duration-200 ${currentFilter === 'order' ? 'rotate-180' : ''}`} />
                </div>
                {/* Bouton Prix */}
                <div
                    onClick={() => toggleFilter('price')}
                    className={`inline-flex items-center border rounded-lg px-2 py-0.5 cursor-pointer transition duration-200 whitespace-nowrap text-sm
                          ${filter.min_price !== undefined || filter.max_price !== undefined ? 'text-blue-600 bg-blue-100/60 border-blue-200' : 'text-gray-600 border-gray-300'}
                          ${currentFilter === 'price' ? '!bg-blue-100/80 !border-blue-300' : 'hover:bg-gray-100'}`}
                >
                    <span>{t('dashboard.orderFilters.price')}</span>
                    <IoChevronDown className={`ml-2 transition-transform duration-200 ${currentFilter === 'price' ? 'rotate-180' : ''}`} />
                </div>
                {/* Ajouter d'autres boutons de filtre ici si nécessaire (Statut Visibilité?) */}
            </div>
            {/* Conteneur options */}
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
                {/* Ajouter d'autres composants de filtre ici */}
            </div>
        </div>
    );
}

// --- Le code pour ProductItemCard et ProductRowItem sera dans les fichiers séparés ---