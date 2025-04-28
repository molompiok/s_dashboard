
// --- Composant ViewMore (Lightbox/Swiper pour images commentaire) ---
import SwiperCore from 'swiper'; // Importer SwiperCore
import { Navigation, Pagination as SwiperPagination, Thumbs } from 'swiper/modules'; // Importer modules
import { Swiper, SwiperSlide } from 'swiper/react'; // Importer composants Swiper

// Importer les CSS Swiper (à faire une seule fois dans l'app)
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { IoClose } from 'react-icons/io5';

// Initialiser les modules Swiper utilisés
SwiperCore.use([Navigation, SwiperPagination, Thumbs]);

interface ViewMoreProps {
    views: string[]; // Tableau d'URLs complètes
    initialIndex?: number;
    onClose: () => void;
}

export function ViewMore({ views, initialIndex = 0, onClose }: ViewMoreProps) {
    const { t } = useTranslation();
    const [thumbsSwiper, setThumbsSwiper] = useState<SwiperCore | null>(null);
    const [activeIndex, setActiveIndex] = useState(initialIndex);

    // Fermer avec la touche Echap
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
           if (event.key === 'Escape') {
              onClose();
           }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        // Conteneur pleine page avec fond sombre
        <div className="fixed inset-0 z-[10000] bg-black/80 flex flex-col items-center justify-center p-4" onClick={onClose}>
            {/* Bouton Fermer */}
             <button
                 onClick={onClose}
                 className="absolute top-4 right-4 text-white/70 hover:text-white z-20 bg-black/30 rounded-full p-2"
                 aria-label={t('common.close')} 
             >
                <IoClose size={24} />
             </button>

            {/* Swiper Principal */}
             {/* Utiliser h-[70vh] ou similaire pour limiter hauteur */}
             <div className="w-full max-w-4xl h-[70vh] mb-4" onClick={(e) => e.stopPropagation()}> {/* Empêcher fermeture au clic sur swiper */}
                <Swiper
                    modules={[Navigation, SwiperPagination, Thumbs]}
                    spaceBetween={10}
                    navigation={true}
                    pagination={{ clickable: true }}
                    thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }} // Lier au swiper des miniatures
                    className="h-full w-full view-more-swiper" // Assurer hauteur 100%
                    initialSlide={initialIndex}
                    onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)} // Suivre l'index actif
                >
                    {views.map((url, index) => (
                        <SwiperSlide key={index} className="flex items-center justify-center">
                             {/* Utiliser object-contain */}
                            <img src={url} alt={`${t('comment.viewAlt')} ${index + 1}`} className="max-w-full max-h-full object-contain" />
                        </SwiperSlide>
                    ))}
                </Swiper>
             </div>

            {/* Swiper Miniatures */}
             {/* Utiliser h-20 ou h-24 */}
             <div className="w-full max-w-xl h-20" onClick={(e) => e.stopPropagation()}>
                <Swiper
                    modules={[Thumbs]}
                    onSwiper={setThumbsSwiper}
                    spaceBetween={10}
                    slidesPerView={'auto'} // Nombre de slides visible auto
                    watchSlidesProgress={true}
                     className="h-full w-full view-more-thumbs-swiper"
                 >
                     {views.map((url, index) => (
                         <SwiperSlide key={index} className={`!w-20 h-full opacity-60 cursor-pointer rounded overflow-hidden border-2 ${activeIndex === index ? 'border-white opacity-100' : 'border-transparent'}`}> {/* Style miniature */}
                             <img src={url} alt={`${t('comment.thumbAlt')} ${index + 1}`} className="w-full h-full object-cover" />
                         </SwiperSlide>
                     ))}
                 </Swiper>
             </div>
        </div>
    );
}