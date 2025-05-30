// Components/TopSearch/TopSearch.tsx
// import './TopSearch.css'; // ❌ Supprimer

import 'swiper/css'; // Assurer import global
import 'swiper/css/free-mode';
import 'swiper/css/pagination'; // Si utilisé

import { useEffect, useState } from 'react';
import { CategoryInterface, CommandInterface, ProductInterface, UserInterface } from '../../api/Interfaces/Interfaces'; // Ajouter UserInterface
// import { useGlobalStore } from '../../pages/stores/StoreStore'; // Déjà importé via useStore
// import { useApp, type GlobalSearchType } from '../../renderer/AppStore/UseApp'; // Remplacé par hook API et useChildViewer
import { useGlobalSearch } from '../../api/ReactSublymusApi'; // ✅ Importer hook API
import { CategoryItemMini } from '../CategoryItem/CategoryItemMini';
import { IoSearch } from 'react-icons/io5';
import { getMedia } from '../Utils/StringFormater';
import { ProductItemCard } from '../ProductItem/ProductItemCard';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import { useWindowSize } from '../../Hooks/useWindowSize';
import { useChildViewer } from '../ChildViewer/useChildViewer';
import { useTranslation } from 'react-i18next'; // ✅ i18n
import { debounce } from '../Utils/functions'; // Garder debounce
import logger from '../../api/Logger';
import { useGlobalStore } from '../../api/stores/StoreStore';
// Importer potentiellement CommandItem ou ClientItem pour afficher commandes/clients
// import { CommandItem } from '../CommandesList/CommandItem';
// import { ClientItem } from '../ClientList/ClientItem'; // Supposons qu'il existe

// Type pour la réponse de la recherche globale
type GlobalSearchType = {
    products: ProductInterface[];
    clients: UserInterface[]; // Utiliser UserInterface
    commands: CommandInterface[];
    categories: CategoryInterface[];
};

export { TopSearch };

// Props pour callbacks de sélection
interface TopSearchProps {
    onClientSelected?: (client: UserInterface) => void;
    onProductSelected?: (product: ProductInterface) => void;
    onCategorySelected?: (category: CategoryInterface) => void;
    onCommandSelected?: (command: CommandInterface) => void;
}

function TopSearch({ onClientSelected, onProductSelected, onCategorySelected, onCommandSelected }: TopSearchProps) {
    const { t } = useTranslation(); // ✅ i18n
    // const { gobalSearch } = useApp(); // Remplacé
    const { openChild } = useChildViewer();
    const { currentStore } = useGlobalStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    // Debounce la recherche
    useEffect(() => {
        debounce(() => setDebouncedSearchTerm(searchTerm), 'top-search', 400);
    }, [searchTerm]);

    // ✅ Utiliser React Query pour la recherche globale
    const { data, isLoading, isError, error } = useGlobalSearch(
        {
            text: debouncedSearchTerm
        }, // Utiliser le terme débauncé
        { enabled: !!currentStore && debouncedSearchTerm.length > 0 } // Activer seulement si store et terme existent
    );

    // Extraire les résultats
    const searchResults: GlobalSearchType = data ?? { products: [], clients: [], commands: [], categories: [] };
    const hasResults = searchResults.products.length > 0 || searchResults.categories.length > 0 || searchResults.clients.length > 0 || searchResults.commands.length > 0;

    // Calcul slidesPerView pour Swiper (peut être simplifié)
    const size = useWindowSize().width;
    const productSize = size < 800 ? ((size - 260) / (700 - 260)) * 1.8 + 1 : 3.3;
    const categorySize = size < 800 ? ((size - 260) / (700 - 260)) * 4 + 2.2 : 6.4;


    // --- Handlers pour sélection ---
    const handleSelect = (item: ProductInterface | CategoryInterface | UserInterface | CommandInterface, type: 'product' | 'category' | 'client' | 'command') => {
        logger.info(`Selected item from TopSearch: ${type}`, item);
        openChild(null); // Fermer le popup
        switch (type) {
            case 'product': onProductSelected?.(item as ProductInterface); break;
            case 'category': onCategorySelected?.(item as CategoryInterface); break;
            case 'client': onClientSelected?.(item as UserInterface); break;
            case 'command': onCommandSelected?.(item as CommandInterface); break;
        }
    };

    return (
        // Conteneur principal: padding, flex col, gap
        <div className="top-search p-4  pb-48 flex flex-col gap-5 w-full  h-full max-h-[80vh] overflow-y-auto bg-white rounded-lg shadow-xl"> {/* Hauteur max et scroll */}

            {/* Barre de Recherche */}
            <div className="relative w-full">
                <label htmlFor="top-search-input" className="sr-only">{t('topbar.searchAction')}</label>
                <input
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                    placeholder={t('topSearch.placeholder')} // 🌍 i18n
                    id="top-search-input"
                    type="text"
                    autoFocus
                    ref={ref => ref?.focus()}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>

            {/* Indicateur de chargement ou d'erreur */}
            {isLoading && <p className="text-sm text-gray-500 text-center py-4">{t('common.loading')}...</p>}
            {isError && <p className="text-sm text-red-500 text-center py-4">{error?.message || t('error_occurred')}</p>}

            {/* Résultats */}
            {!isLoading && !isError && debouncedSearchTerm.length > 0 && (
                <>
                    {/* Catégories */}
                    {searchResults.categories.length > 0 && (
                        <section>
                            <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2 px-1">{t('topSearch.categoriesTitle')}</h3>
                            <Swiper
                                modules={[FreeMode]}
                                slidesPerView={categorySize}
                                spaceBetween={10}
                                freeMode={true}
                                style={{ overflow: 'visible' }}
                                className="top-search-swiper mx-1 px-1"
                            >
                                {searchResults.categories.map((c) => (
                                    <SwiperSlide key={c.id}>
                                        <CategoryItemMini category={c} onClick={() => handleSelect(c, 'category')} openCategory />
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </section>
                    )}

                    {/* Produits */}
                    {searchResults.products.length > 0 && (
                        <section>
                            <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2 px-1">{t('topSearch.productsTitle')}</h3>
                            <Swiper
                                style={{ overflow: 'visible' }}
                                modules={[FreeMode]} slidesPerView={productSize} spaceBetween={10} freeMode={true} className="top-search-swiper -mx-1 px-1"
                            >
                                {searchResults.products.map((p) => (
                                    <SwiperSlide key={p.id} className="!h-auto"> {/* Permettre hauteur auto */}
                                        <ProductItemCard product={p} onClick={() => handleSelect(p, 'product')} />
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </section>
                    )}

                    {/* Clients */}
                    {searchResults.clients.length > 0 && (
                        <section>
                            <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2 px-1">{t('topSearch.clientsTitle')}</h3>
                            <div className="flex flex-col gap-2">
                                {/* TODO: Créer un ClientItemSearch ou adapter ClientItemRow */}
                                {searchResults.clients.map((c) => (
                                    <button key={c.id} onClick={() => handleSelect(c, 'client')} className="text-left p-2 rounded hover:bg-gray-100 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-200 flex-shrink-0"></div> {/* Placeholder avatar */}
                                        <span className="text-sm text-gray-700 truncate">{c.full_name || c.email}</span>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Commandes */}
                    {searchResults.commands.length > 0 && (
                        <section>
                            <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2 px-1">{t('topSearch.commandsTitle')}</h3>
                            <div className="flex flex-col gap-2">
                                {/* TODO: Créer un CommandItemSearch ou adapter CommandItem */}
                                {searchResults.commands.map((cmd) => (
                                    <button key={cmd.id} onClick={() => handleSelect(cmd, 'command')} className="text-left p-2 rounded hover:bg-gray-100 text-sm text-gray-700">
                                        #{cmd.reference ?? cmd.id.substring(0, 8)} - {cmd.user?.full_name} ({cmd.total_price} {cmd.currency})
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                </>
            )}
            {/* Message si aucune correspondance */}
            {!hasResults && (
                <div className="text-center py-10 text-gray-500">
                    <div className="w-32 h-32 mx-auto bg-contain bg-center bg-no-repeat mb-4 opacity-70" style={{ background: getMedia({ isBackground: true, source: '/res/empty/search.png' }) }}></div>
                    {t('topSearch.noResultsFound', { term: debouncedSearchTerm })}
                </div>
            )}
        </div>
    );
}
