// Components/TopSearch/TopSearch.tsx
// import './TopSearch.css'; // ❌ Supprimer

import 'swiper/css'; // Assurer import global
import 'swiper/css/free-mode';
import 'swiper/css/pagination'; // Si utilisé

import { useEffect, useState } from 'react';
import { CategoryInterface, CommandInterface, GlobalSearchType, ProductInterface, UserInterface } from '../../api/Interfaces/Interfaces'; // Ajouter UserInterface
// import { useGlobalStore } from '../../pages/stores/StoreStore'; // Déjà importé via useStore
// import { useApp, type GlobalSearchType } from '../../renderer/AppStore/UseApp'; // Remplacé par hook API et useChildViewer
import { useGlobalSearch } from '../../api/ReactSublymusApi'; // ✅ Importer hook API
import { CategoryItemMini } from '../CategoryItem/CategoryItemMini';
import { IoChevronForward, IoSearch } from 'react-icons/io5';
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
import { cardStyle } from '../Button/Style';
import { CommandItem } from '../CommandItem/CommandItem';
import { navigate } from 'vike/client/router';

export { TopSearch };

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
    const searchResults: GlobalSearchType = data ?? {
        products: [],
        clients: [],
        commands: [],
        categories: [],
        meta: {
            products: 0,
            clients: 0,
            commands: 0,
            categories: 0,
        }
    };
    const hasResults = searchResults.products.length > 0 || searchResults.categories.length > 0 || searchResults.clients.length > 0 || searchResults.commands.length > 0;

    // Calcul slidesPerView pour Swiper (peut être simplifié)
    const size = useWindowSize().width;
    const productSize = size < 800 ? ((size - 260) / 220) + 1.3 : 3.98;
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

    const getTotal = (key:keyof GlobalSearchType['meta'])=>{
        return searchResults.meta[key] >  searchResults[key].length && <span onClick={()=>{
            navigate(`/${key}`)
            openChild(null)
        }} className='flex items-center cursor-pointer flex-nowrap whitespace-nowrap ml-auto hover:underline text-teal-400'><span className=' text-gray-500 dark:text-white/40 mr-3'>total</span>({searchResults.meta[key]} )<IoChevronForward className='ml-3 min-w-4 h-4' /></span>
    }

    return (
        // Conteneur principal: padding, flex col, gap
        <div className="top-search p-4  pb-48 flex flex-col gap-5 w-full  h-full max-h-[80vh] overflow-y-auto rounded-lg shadow-xl"> {/* Hauteur max et scroll */}

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
                <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-white text-gray-400 w-5 h-5 pointer-events-none" />
            </div>

            {/* Indicateur de chargement ou d'erreur */}
            {isLoading && <p className="text-sm dark:text-white text-gray-500 text-center py-4">{t('common.loading')}...</p>}
            {isError && <p className="text-sm text-red-500 text-center py-4">{error?.message || t('error_occurred')}</p>}

            {/* Résultats */}
            {!isLoading && !isError && debouncedSearchTerm.length > 0 && (
                <>
                    {/* Catégories */}
                    {searchResults.categories.length > 0 && (
                        <section>
                            <h3 className="flex items-center mb-4 text-xs font-semibold uppercase dark:text-white text-gray-500 px-1">{t('topSearch.categoriesTitle')} {getTotal('categories')}</h3>
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
                            <h3 className="flex items-center mb-4 text-xs font-semibold uppercase dark:text-white text-gray-500 px-1">{t('topSearch.productsTitle')}  {getTotal('products')}</h3>
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
                            <h3 className="flex items-center mb-4 text-xs font-semibold uppercase dark:text-white  text-gray-500 px-1">{t('topSearch.clientsTitle')}  {getTotal('clients')}</h3>
                            <div className="flex flex-col gap-2">
                                {/* TODO: Créer un ClientItemSearch ou adapter ClientItemRow */}
                                {searchResults.clients.map((c) => (
                                    <button key={c.id} onClick={() => handleSelect(c, 'client')} className={'flex items-center gap-4 ' + cardStyle + ' p-2 mob:p-2 sm:p-2'}>
                                        <div className="w-12 h-12 rounded-full bg-cover bg-center bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-semibold text-sm flex items-center justify-center shrink-0"
                                            style={{
                                                background: c.photo?.[0] ? getMedia({ isBackground: true, from: 'api', source: c.photo[0] }) : '#3455'
                                            }}
                                        >
                                            {!c.photo?.[0] && (c.full_name?.substring(0, 2).toUpperCase() || '?')}
                                        </div>
                                        <span className="text-sm dark:text-white  text-gray-700 truncate">{c.full_name || c.email}</span>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Commandes */}
                    {searchResults.commands.length > 0 && (
                        <section>
                            <h3 className="flex items-center mb-4 text-xs font-semibold uppercase text-gray-500 px-1">{t('topSearch.commandsTitle')}  {getTotal('commands')}</h3>
                            <div className="flex flex-col gap-2">
                                {/* TODO: Créer un CommandItemSearch ou adapter CommandItem */}
                                {searchResults.commands.map((cmd) => (
                                    <span key={cmd.id} onClick={() => handleSelect(cmd, 'command')} >
                                        <CommandItem command={cmd} />
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                </>
            )}
            {/* Message si aucune correspondance */}
            {!hasResults && (
                <div className="text-center py-10 dark:text-white text-gray-500 ">
                    <div className="w-32 h-32 mx-auto bg-contain bg-center bg-no-repeat mb-4 opacity-70" style={{ background: getMedia({ isBackground: true, source: '/res/empty/search.png' }) }}></div>
                    {t('topSearch.noResultsFound', { term: debouncedSearchTerm })}
                </div>
            )}
        </div>
    );
}
