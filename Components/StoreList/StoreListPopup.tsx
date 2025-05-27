// Components/StoreList/StoreListPopup.tsx

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
import { StoresList } from './StoresList';
import { useGetStoreList } from '../../api/ReactSublymusApi';
import { navigate } from 'vike/client/router';
import { useChildViewer } from '../ChildViewer/useChildViewer';
import { StoreCreationEditionWizard } from '../../pages/index/StoreCreationWizard';

interface StoreListPopupProps {
    onSelectStore: (store: StoreInterface) => void;
}

export function StoreListPopup({ onSelectStore }: StoreListPopupProps) {
    const { data: storesData, isLoading: isLoadingList } = useGetStoreList();
    const { openChild } = useChildViewer()
    return (
        <div className="relative fl w-full group p-4"> {/* Group pour afficher boutons nav au survol */}
            <StoresList 
            maxSize = {800}
            maxVisible = {4}
            isLoading={isLoadingList} 
            onSelectStore={onSelectStore} 
            newStoreRequire={()=>{
               openChild(<StoreCreationEditionWizard onSaveSuccess={(collected, mode) => {
                     console.log('collected', mode, collected);
                     openChild(null)
                   }} onCancel={() => {
                     openChild(null)
                   }} initialStoreData={undefined} />,
                     {
                       background: 'oklch(96.7% 0.003 264.542)'
                     })
            }}
            stores={storesData?.list||[]}  />
        </div>
    );
}