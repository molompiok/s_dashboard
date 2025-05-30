// --- Nouveau Composant ProductSettings --- (à mettre dans son propre fichier idéalement)
import { useTranslation } from "react-i18next";
import { useWindowSize } from "../../../Hooks/useWindowSize";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Grid , Navigation, Pagination as SwiperPagination } from 'swiper/modules';
import { IoPricetagsOutline, IoDocumentTextOutline, IoMegaphoneOutline, IoStorefrontOutline, IoGitNetworkOutline, IoStatsChartOutline, IoChatbubbleEllipsesOutline, IoTrashOutline, IoChevronBack, IoChevronForward } from "react-icons/io5"; // Importer les icônes

// Importer les styles Swiper
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/grid';

// Définition des settings avec icônes et couleurs Tailwind
const SettingsConfig = [
    { name: 'price-stock', showKey: 'productSettings.priceStock', icon: <IoPricetagsOutline />, colorClasses: 'text-green-600 border-green-200 hover:bg-green-50 hover:shadow-green-100' },
    { name: 'details', showKey: 'productSettings.details', icon: <IoDocumentTextOutline />, colorClasses: 'text-gray-600 border-gray-200 hover:bg-gray-50 hover:shadow-gray-100' },
    // { name: 'promo', showKey: 'productSettings.promo', icon: <IoMegaphoneOutline />, colorClasses: 'text-orange-600 border-orange-200 hover:bg-orange-50 hover:shadow-orange-100' },
    // { name: 'inventory', showKey: 'productSettings.inventory', icon: <IoStorefrontOutline />, colorClasses: 'text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:shadow-indigo-100' },
    // { name: 'affiliation', showKey: 'productSettings.affiliation', icon: <IoGitNetworkOutline />, colorClasses: 'text-purple-600 border-purple-200 hover:bg-purple-50 hover:shadow-purple-100' },
    { name: 'show-stats', showKey: 'productSettings.stats', icon: <IoStatsChartOutline />, colorClasses: 'text-sky-600 border-sky-200 hover:bg-sky-50 hover:shadow-sky-100' },
    { name: 'comments', showKey: 'productSettings.comments', icon: <IoChatbubbleEllipsesOutline />, colorClasses: 'text-amber-600 border-amber-200 hover:bg-amber-50 hover:shadow-amber-100' },
  ];


export function ProductSettings({ onSelected }: { onSelected: (type: string) => void }) {
    const { t } = useTranslation();
    const s = useWindowSize().width;

    const n = ((s - 260) / 1200)*5.6 + 1.6  

    return (
        <div className="relative w-full group"> 

            <Swiper
                slidesPerView={n}
                grid={{ rows: s<1000?2:1, fill: 'row' }} // Remplir par ligne
                spaceBetween={16} // gap-4
                pagination={{ clickable: true}}
                modules={[Grid, Navigation, SwiperPagination]}
                navigation={{ // Activer navigation Swiper
                    nextEl: '.swiper-button-next-store', // Sélecteurs CSS personnalisés
                    prevEl: '.swiper-button-prev-store',
                }}
                className="product-settings-swiper w-full" // Retirer py-4 ici
                style={{ height: s<1000?'320px':'180px', overflow: 'visible' }} // Ajuster hauteur + overflow visible
            >
                {SettingsConfig.map(setting => (
                    <SwiperSlide key={setting.name} className="h-auto pb-8"> {/* Ajouter pb pour pagination */}
                        {/* Carte Setting */}
                        <button
                            type="button"
                            onClick={() => onSelected(setting.name)}
                            // Appliquer les classes Tailwind
                            className={`setting no-select w-full aspect-square rounded-xl p-3 flex flex-col justify-center items-center cursor-pointer transition duration-200 ease-in-out border-2 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 ${setting.colorClasses}`}
                        >
                            {/* Icône plus grande */}
                            <span className="text-4xl mb-2">{setting.icon}</span>
                            {/* Texte */}
                            <span className="name text-xs font-medium text-center">{t(setting.showKey)}</span>
                        </button>
                    </SwiperSlide>
                ))}
                {/* Ajouter une slide vide si besoin pour la grille (Swiper gère normalement) */}
            </Swiper>
            <button className="swiper-button-prev-store absolute top-1/2 left-0 transform -translate-y-1/2 z-10 p-2 bg-white/70 hover:bg-white rounded-full shadow-md text-gray-600 hover:text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0" aria-label={t('pagination.previous')}>
                             <IoChevronBack className="w-5 h-5" />
                         </button>
                          {/* Bouton Suivant */}
                         <button className="swiper-button-next-store absolute top-1/2 right-0 transform -translate-y-1/2 z-10 p-2 bg-white/70 hover:bg-white rounded-full shadow-md text-gray-600 hover:text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0" aria-label={t('pagination.next')}>
                             <IoChevronForward className="w-5 h-5" />
                         </button>
            {/* Conteneur externe pour la pagination */}
            {/* <div className="swiper-pagination-product-settings flex justify-center pt-4"></div> */}
        </div>
    )
}
