// pages/category/+Page.tsx
import { BreadcrumbItem, Topbar } from '../../Components/TopBar/TopBar';
import { CategoriesToolbar } from '../../Components/CategoriesList/CategoriesToolbar'; // Nouveau
import { CategoryItemCard, CategoryItemSkeletonCard } from '../../Components/CategoryItem/CategoryItemCard'; // Nouveau
import { CategoryItemRow, CategoryItemSkeletonRow } from '../../Components/CategoryItem/CategoryItemRow'; // Nouveau
import { Pagination } from '../../Components/Pagination/Pagination'; // Nouveau (ou existant)
import { useGetCategories } from '../../api/ReactSublymusApi'; // ✅ Hook API
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CategoryFilterType } from '../../Interfaces/Interfaces'; // Assumer type FilterType adapté aux catégories
import { ClientCall } from '../../Components/Utils/functions';

export { Page };

function Page() {
    const { t } = useTranslation();
    const [viewType, setViewType] = useState<'card' | 'row'>(ClientCall(function () { return localStorage.getItem('product:view_type') }) as any || 'card'); // Vue par défaut
    const [filter, setFilter] = useState<CategoryFilterType>({
        page: 1,
        limit: 12,
        with_product_count: true,
        order_by: 'name_asc',
    });


    useEffect(() => {
        setFilter(prev => ({
            ...prev,
            limit: viewType === 'card' ? 12 : 15,
            page: 1
        }));
        localStorage.setItem('product:view_type', viewType)
    }, [viewType]);

    const breadcrumbs: BreadcrumbItem[] = [
        { name: t('navigation.home'), url: '/' },
        { name: t('navigation.categories') }, // Dernier élément sans URL
    ];
    const { data: categoriesData, isLoading, isError, error: apiError } = useGetCategories(
        filter,
        // { enabled: true } // Activé par défaut
    );

    console.log(categoriesData);

    const categories = categoriesData?.list ?? [];
    const meta = categoriesData?.meta;

    return (
        <div className="w-full min-h-screen flex flex-col bg-gray-50">
            <Topbar back={true} breadcrumbs={breadcrumbs} />
            <main className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">

                {/* Barre d'outils Catégories */}
                <CategoriesToolbar
                    filter={filter}
                    onFilterChange={setFilter} // Passer la fonction pour mettre à jour le filtre
                    currentView={viewType}
                    onViewChange={setViewType} // Passer la fonction pour changer la vue
                />


                {/* Affichage de la liste ou des états */}
                {isLoading && (
                    // Afficher les skeletons appropriés selon la vue
                    <div className={viewType === 'card' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" : "flex flex-col gap-2"}>
                        {Array.from({ length: filter.limit ?? 10 }).map((_, i) => (
                            viewType === 'card'
                                ? <CategoryItemSkeletonCard key={`skel-card-${i}`} />
                                : <CategoryItemSkeletonRow key={`skel-row-${i}`} />
                        ))}
                    </div>
                )}

                {isError && (
                    <div className="p-6 text-center text-red-500">
                        {t('error_occurred')}: {apiError?.message}
                    </div>
                )}

                {!isLoading && !isError && categories.length === 0 && (
                    <div className="p-10 text-center text-gray-500">
                        {t('category.noCategoriesFound')}
                    </div>
                )}

                {!isLoading && !isError && categories.length > 0 && (
                    <>
                        {/* Conteneur de la liste (Grid ou Flex) */}
                        <div className={viewType === 'card' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" : "flex flex-col gap-2"}>
                            
                            {viewType === 'card' && <AddCategoryCard />}
                            
                            {viewType === 'row' && <AddCategoryRow />}

                            {categories.map((category) => (
                                viewType === 'card'
                                    ? <CategoryItemCard key={category.id} category={category} />
                                    : <CategoryItemRow key={category.id} category={category} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {meta && meta.total > meta.per_page && (
                            <Pagination
                                currentPage={meta.current_page}
                                lastPage={meta.last_page}
                                total={meta.total}
                                perPage={meta.per_page}
                                onPageChange={(newPage) => setFilter(prev => ({ ...prev, page: newPage }))}
                            />
                        )}
                    </>
                )}

            </main>
        </div>
    );
}


function AddCategoryCard({ addTo }: { addTo?: { category_id: string, text: string } | null }) {
    const { t } = useTranslation();
    return (
        <a href={`/products/new${addTo?.category_id ? '?catrgory_id=' + addTo.category_id : ''}`} className=" rounded-xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 transition duration-200 cursor-pointer flex flex-col items-center justify-center text-center p-4 text-gray-500 hover:text-blue-600">
            <div className="w-24 h-24 mb-4">
                <img src={'/res/empty/Empty_bag.png'} alt={t('category.addNewButton')} className='w-full h-full object-contain opacity-70' />
            </div>
            <span className="text-sm font-medium">{addTo?.text || t('category.addNewButton')}</span>
        </a>
    );
}
function AddCategoryRow({ addTo }: { addTo?: { category_id: string, text: string } | null }) {
    const { t } = useTranslation();
    return (
        <a href={`/products/new${addTo?.category_id ? '?catrgory_id=' + addTo.category_id : ''}`} className="flex items-center justify-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 transition duration-200 cursor-pointer text-gray-500 hover:text-blue-600">
            <span className="text-sm font-medium">{addTo?.text || t('category.addNewButton')}</span>
        </a>
    );
}