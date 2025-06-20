// Components/StoreList/StoresList.tsx

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination as SwiperPagination } from 'swiper/modules'; // Renommer Pagination
import { StoreInterface } from '../../api/Interfaces/Interfaces';
import { StoreItemCard, StoreItemSkeletonCard } from './StoreItemCard'; // Importer la carte et son skeleton
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';

// Importer CSS Swiper (une seule fois dans l'app)
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { useWindowSize } from '../../Hooks/useWindowSize';
import { AddStoreCard } from './AddNewStore';
import './StoresList.css'
import { useChildViewer } from '../ChildViewer/useChildViewer';
import { BigSpinner } from '../Confirm/Spinner';
import { navigate } from 'vike/client/router';
import { useGlobalStore } from '../../api/stores/StoreStore';
import { host } from '../../renderer/AppStore/Data';

interface StoresListProps {
    stores: StoreInterface[];
    isLoading: boolean;
    selectedStoreId?: string;
    onSelectStore: (store: StoreInterface) => void;
    viewAllUrl?: string; // URL optionnelle pour "Voir tout"
    newStoreRequire?: () => void
    maxSize?:number,
    maxVisible?:number,
    isFilterActive?:boolean
}

export function StoresList({isFilterActive,maxVisible=5.8, maxSize=1200,stores, isLoading, selectedStoreId, onSelectStore, viewAllUrl, newStoreRequire }: StoresListProps) {
    const { t } = useTranslation();
    const size = useWindowSize()
    const {setCurrentStore} = useGlobalStore()
    const { openChild } = useChildViewer()

    const n = size.width< maxSize ? ((size.width - 260) / maxSize) * (maxVisible-1.1) + 1.6  :maxVisible
    const onManage = (store:StoreInterface)=>{
        openChild(<BigSpinner text='Chargement des informations..' />,{background:'#3455'})
        setCurrentStore(store)
        window.location.href='/store'
        
    }
    const onVisit = (store:StoreInterface)=>{
        window.open(host+store.default_domain, '_blank', 'noopener,noreferrer');
    }
    return (
        !isLoading && isFilterActive && stores.length==0 ? (
            <div className="flex items-center justify-center h-full p-4">
                <NoResultCard
                    title="Aucune boutique trouvée"
                    message="Il semble qu'aucune boutique ne correspond à ces critères de recherche"
                />
            </div>
        ): 
        <div className="stores-list p-4 pb-6 relative w-full group overflow-hidden"> {/* Group pour afficher boutons nav au survol */}

            <Swiper
                modules={[Navigation, SwiperPagination]}
                spaceBetween={16} // gap-4
                slidesPerView={n}
                navigation={{ // Activer navigation Swiper
                    nextEl: '.swiper-button-next-store', // Sélecteurs CSS personnalisés
                    prevEl: '.swiper-button-prev-store',
                }}
                style={{ overflow: 'visible',height:'270px' }}
                pagination={{ clickable: true }} // Activer pagination simple
                className="stores-swiper pb-10 pt-3" // Ajouter pb pour pagination
            >
                {
                    (!isLoading && stores.length == 0 ) && <SwiperSlide  className="pb-1 h-full min-h-[220px]">
                            <AddStoreCard onClick={()=>newStoreRequire?.()}/>
                        </SwiperSlide>
                }
                {isLoading ? (
                    // Afficher les skeletons pendant le chargement
                    Array.from({ length: 5 }).map((_, i) => (
                        <SwiperSlide key={`skel-${i}`} className="pb-1 h-full min-h-[220px]">
                            <StoreItemSkeletonCard />
                        </SwiperSlide>
                    ))
                ) : (
                    // Afficher les stores réels
                    stores.map((store) => (
                        <SwiperSlide key={store.id} className="pb-1 h-full min-h-[270px] flex items-center justify-center">
                            <StoreItemCard
                                onManage={onManage}
                                onVisit={onVisit}
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


// components/StateDisplay/NoResultCard.tsx

import { SearchX } from 'lucide-react'; // Importe l'icône de loupe barrée

interface NoResultCardProps {
  title?: string;
  message?: string;
}

export const NoResultCard = ({
  title = "Aucun résultat", // Titre par défaut
  message = "Nous n'avons rien trouvé correspondant à votre recherche." // Message par défaut
}: NoResultCardProps) => {
  return (
    // Carte avec effet verre dépoli et bordures douces
    <div className="flex flex-col items-center justify-center text-center p-8 w-full
                   bg-white/80 dark:bg-white/5 backdrop-blur-md 
                   rounded-2xl shadow-sm border border-gray-200/80 dark:border-white/10">
      
      {/* Conteneur pour l'icône */}
      <div className="flex items-center justify-center w-16 h-16 mb-4
                     bg-gray-100 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
        <SearchX className="w-8 h-8 text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
      </div>

      {/* Titre */}
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
        {title}
      </h3>

      {/* Message descriptif */}
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
        {message}
      </p>
    </div>
  );
};