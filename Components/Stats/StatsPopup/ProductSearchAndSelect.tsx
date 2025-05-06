// components/Stats/Modals/ProductSearchAndSelect.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { IoSearch } from 'react-icons/io5';
import { useGetProductList } from '../../../api/ReactSublymusApi'; // Utilisez ce hook
import { ProductInterface, FilterType } from '../../../Interfaces/Interfaces'; // Utilisez ces types
import ProductItemSmall from './ProductItemSmall'; // Utilisez le composant ProductItemSmall créé ci-dessus
import { ProductItemSkeleton } from './ProductItemSkeleton'; // Utilisez le squelette créé ci-dessus
import { debounce } from '../../Utils/functions'; // Ajustez le chemin vers votre utilitaire debounce
import { useTranslation } from 'react-i18next'; 

interface ProductSearchAndSelectProps {
    // Callback appelé quand un produit est sélectionné
    onProductSelected: (product: ProductInterface | undefined) => void;
    // Callback appelé quand le modal doit être fermé
    onClose: () => void;
    // ID du produit actuellement sélectionné
    currentSelectedProductId?: string;
}

const ProductSearchAndSelect: React.FC<ProductSearchAndSelectProps> = ({
    onProductSelected,
    onClose,
    currentSelectedProductId,
}) => {
    const { t } = useTranslation();

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    // Appliquer le debounce au terme de recherche
    useEffect(() => {
        searchTerm &&  debounce(()=>
            setDebouncedSearchTerm(searchTerm), 'product-search', 400); // 400ms debounce
    }, [searchTerm]);

    // Construire le filtre pour l'API useGetProductList
     const filter: FilterType = useMemo(() => ({
         search: debouncedSearchTerm,
         with_feature:true,
         limit: 15, // Limiter les résultats
          // Ajouter d'autres filtres par défaut si pertinent (ex: only_visible=true)
     }), [debouncedSearchTerm]);

    // Appel API via React Query
     const { data: productsData, isLoading, isError, error: apiError } = useGetProductList(
         filter,
         { enabled: true } // Enabled always to allow empty search or prompt message
     );

     const products = productsData?.list ?? []; // Liste des produits trouvés

    // Handler quand un produit est cliqué dans la liste
    const handleProductClick = (product: ProductInterface) => {
        onProductSelected(product); // Appeler la callback du parent avec le produit sélectionné
        // onClose(); // Géré par onProductSelected handler logic in parent
    };

    // Indicateurs d'état
     const noResults = !isLoading && !isError && products.length === 0 && debouncedSearchTerm.length > 0;
     const inviteToSearch = !isLoading && !isError && products.length === 0 && debouncedSearchTerm.length === 0;


    return (
        <div className="product-search-select p-4 flex flex-col h-full"> {/* Conteneur principal du modal */}
             {/* Le ChildViewer parent fournit le titre et le bouton Fermer */}

            {/* Champ de recherche */}
            <div className="relative w-full mb-4 flex-shrink-0">
                 <input
                    className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder={t('stats.searchProductPlaceholder')} // 🌍 i18n
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <IoSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>

            {/* Liste des résultats / États */}
             <div className="flex-grow overflow-y-auto border-t border-gray-200 pt-4">
                 {isLoading ? (
                     // Squelettes de chargement
                     <div className="flex flex-col gap-2">
                         {Array.from({ length: filter.limit || 5 }).map((_, i) => <ProductItemSkeleton key={i} />)}
                    </div>
                 ) : isError ? (
                     // Message d'erreur
                     <div className="p-4 text-center text-red-500">
                        {t('error_occurred')} <span className='text-xs'>{apiError?.message}</span>
                    </div>
                 ) : noResults ? (
                     // Message "Aucun résultat" pour la recherche
                      <div className="p-10 text-center text-gray-500">
                           {t('stats.noProductFound')}
                       </div>
                  ) : inviteToSearch ? (
                       // Message "Inviter à rechercher" si champ vide et pas de résultats
                       <div className="p-10 text-center text-gray-500">
                          {t('stats.typeToSearchProduct')} {/* "Commencez à taper pour chercher des produits" */}
                       </div>
                 ) : (
                     // Liste des produits trouvés
                     <div className="flex flex-col gap-2">
                          {products.map(product => (
                              // L'item produit doit être cliquable et potentiellement indiquer la sélection courante
                             <div
                                 key={product.id}
                                 onClick={() => handleProductClick(product)}
                                 className={`cursor-pointer rounded-lg transition duration-100
                                     ${currentSelectedProductId === product.id ? 'bg-green-100/60 border-green-200 shadow-sm border' : 'hover:bg-gray-50'}`} // Style d'item sélectionné (vert ici?)
                              >
                                  <ProductItemSmall product={product} /> {/* Utilisez le composant ProductItemSmall */}
                              </div>
                          ))}
                     </div>
                 )}
             </div>
             {/* Pagination ou Load More si pertinent */}
        </div>
    );
};

export default ProductSearchAndSelect;