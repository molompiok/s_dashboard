// pages/category/+Page.tsx (ou chemin correspondant)

import { Topbar } from '../../Components/TopBar/TopBar';
import { CategoriesToolbar } from '../../Components/CategoriesList/CategoriesToolbar'; // Nouveau
import { CategoryItemCard } from '../../Components/CategoryItem/CategoryItemCard'; // Nouveau
import { CategoryItemRow } from '../../Components/CategoryItem/CategoryItemRow'; // Nouveau
import { Pagination } from '../../Components/Pagination/Pagination'; // Nouveau (ou existant)
import { useGetCategories } from '../../api/ReactSublymusApi'; // ✅ Hook API
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CategoryFilterType } from '../../Interfaces/Interfaces'; // Assumer type FilterType adapté aux catégories
import { CategoryItemSkeletonCard } from '../../Components/CategoryItem/CategoryItemSkeletonCard'; // Nouveau
import { CategoryItemSkeletonRow } from '../../Components/CategoryItem/CategoryItemSkeletonRow'; // Nouveau
// Optionnel: Importer ProductList ou un aperçu produit
// import { ProductQuickPreview } from '../../Components/ProductList/ProductQuickPreview';

export { Page };

function Page() {
    const { t } = useTranslation();
    const [viewType, setViewType] = useState<'card' | 'row'>('card'); // Vue par défaut
    const [filter, setFilter] = useState<CategoryFilterType>({
        page: 1,
        limit: 12, // Limite par défaut pour la vue carte
        with_product_count: true, // Toujours récupérer le compte produit
        order_by: 'name_asc', // Tri par défaut
    });

    // Adapter le limit pour la vue ligne si différent
    useEffect(() => {
        setFilter(prev => ({
            ...prev,
            limit: viewType === 'card' ? 12 : 15, // Plus d'items en vue ligne
            page: 1 // Reset page quand la vue ou limite change
        }));
    }, [viewType]);


    // ✅ Récupérer les données avec React Query
    const { data: categoriesData, isLoading, isError, error: apiError } = useGetCategories(
        filter,
        // { enabled: true } // Activé par défaut
    );

    console.log(categoriesData);
    
    const categories = categoriesData?.list ?? [];
    const meta = categoriesData?.meta;

    return (
        <div className="w-full min-h-screen flex flex-col bg-gray-50">
            <Topbar back={true} />
            <main className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">

                {/* Optionnel: Aperçu rapide des produits */}
                {/* <ProductQuickPreview /> */}

                {/* Titre principal */}
                <h1 className="text-2xl font-semibold text-gray-900">{t('dashboard.categories')}</h1>

                {/* Barre d'outils Catégories */}
                <CategoriesToolbar
                    filter={filter}
                    onFilterChange={setFilter} // Passer la fonction pour mettre à jour le filtre
                    currentView={viewType}
                    onViewChange={setViewType} // Passer la fonction pour changer la vue
                    // Ajouter d'autres props si nécessaire (ex: total count)
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