// Components/StoreList/StoresList.tsx

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination as SwiperPagination } from 'swiper/modules'; // Renommer Pagination
import { StoreInterface } from '../../Interfaces/Interfaces';
import { StoreItemCard, StoreItemSkeletonCard } from './StoreItemCard'; // Importer la carte et son skeleton
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';

// Importer CSS Swiper (une seule fois dans l'app)
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { useWindowSize } from '../../Hooks/useWindowSize';

interface StoresListProps {
    stores: StoreInterface[];
    isLoading: boolean;
    selectedStoreId?: string;
    onSelectStore: (store: StoreInterface) => void;
    viewAllUrl?: string; // URL optionnelle pour "Voir tout"
    newStoreRequire:() => void
}

export function StoresList({ stores, isLoading, selectedStoreId, onSelectStore, viewAllUrl, newStoreRequire }: StoresListProps) {
    const { t } = useTranslation();
    const size = useWindowSize()
    
    const n = ((size.width - 260) / 1200)*4 + 1.3  

    return (
        <div className="relative w-full group"> {/* Group pour afficher boutons nav au survol */}
            
            <Swiper
                modules={[Navigation, SwiperPagination]}
                spaceBetween={16} // gap-4
                slidesPerView={n}
                navigation={{ // Activer navigation Swiper
                    nextEl: '.swiper-button-next-store', // Sélecteurs CSS personnalisés
                    prevEl: '.swiper-button-prev-store',
                }}
                style={{overflow:'visible'}}
                pagination={{ clickable: true }} // Activer pagination simple
                className="stores-swiper pb-10 overflow-visible" // Ajouter pb pour pagination
            >
                {isLoading ? (
                    // Afficher les skeletons pendant le chargement
                    Array.from({ length: 5 }).map((_, i) => (
                        <SwiperSlide key={`skel-${i}`} className="pb-1"> {/* pb pour ombre */}
                            <StoreItemSkeletonCard />
                        </SwiperSlide>
                    ))
                ) : (
                     // Afficher les stores réels
                     stores.map((store) => (
                         <SwiperSlide key={store.id} className="pb-1 h-full min-h-[220px]">
                             <StoreItemCard
                                 store={store}
                                 isSelected={store.id === selectedStoreId}
                                 onClick={() => onSelectStore(store)}
                             />
                         </SwiperSlide>
                     ))
                )}
                {/* Slide optionnelle pour "Voir tout" */}
                {viewAllUrl && !isLoading && stores.length > 0 && (
                     <SwiperSlide className="h-full flex pb-1">
                         <a href={viewAllUrl} className="flex flex-col items-center justify-center w-full h-full bg-gray-100 rounded-xl text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition border border-gray-200 hover:border-blue-300">
                             <IoChevronForward className="w-8 h-8 mb-2" />
                             <span className="text-sm font-medium">{t('storesPage.viewAllButton')}</span> 
                         </a>
                     </SwiperSlide>
                )}
            </Swiper>

             {/* Boutons de Navigation Personnalisés (apparaissent au survol du conteneur) */}
             {/* Bouton Précédent */}
             <button className="swiper-button-prev-store absolute top-1/2 left-0 transform -translate-y-1/2 z-10 p-2 bg-white/70 hover:bg-white rounded-full shadow-md text-gray-600 hover:text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0" aria-label={t('pagination.previous')}>
                 <IoChevronBack className="w-5 h-5" />
             </button>
              {/* Bouton Suivant */}
             <button className="swiper-button-next-store absolute top-1/2 right-0 transform -translate-y-1/2 z-10 p-2 bg-white/70 hover:bg-white rounded-full shadow-md text-gray-600 hover:text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0" aria-label={t('pagination.next')}>
                 <IoChevronForward className="w-5 h-5" />
             </button>
        </div>
    );
}