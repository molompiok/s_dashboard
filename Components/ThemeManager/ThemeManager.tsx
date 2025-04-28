// Components/ThemeManager/ThemeManager.tsx

import { StoreInterface, ThemeInterface } from "../../Interfaces/Interfaces"; // Importer les interfaces
import { useTranslation } from "react-i18next";
import { getImg } from "../Utils/StringFormater";
import { useStore } from "../../pages/stores/StoreStore"; // Pour l'URL de base des images?
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation } from 'swiper/modules'; // Ajouter Navigation
import { IoColorPaletteOutline, IoTextOutline, IoMegaphoneOutline, IoChatbubblesOutline, IoNewspaperOutline, IoChevronForward, IoBrushOutline, IoCheckmarkCircle, IoChevronBack } from "react-icons/io5"; // Icônes pour options
// Importer le hook pour récupérer la liste des thèmes disponibles (si nécessaire)
// import { useGetAvailableThemes } from "../../api/ReactSublymusApi"; // Exemple
import logger from "../../api/Logger";

// Importer les styles Swiper globaux (si pas déjà fait dans Layout)
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation'; // Ajouter CSS Navigation
import { JSX, useState } from "react";
import { NO_PICTURE } from "../Utils/constants";
import { Layout } from "lucide-react";

// Données statiques pour les thèmes récents/disponibles (à remplacer par API)
const recentThemesPlaceholder: Partial<ThemeInterface>[] = [
     { id: 'theme-classy-v1', name: 'Thème Élégant', preview_images: ['/res/theme-previews/elegant.jpg'], isFree: true, is_premium: false },
     { id: 'theme-minimal-dark', name: 'Minimaliste Sombre', preview_images: ['/res/theme-previews/minimal-dark.jpg'], isFree: false, is_premium: true, price: 15000 },
     { id: 'theme-foodie', name: 'Saveurs Gourmandes', preview_images: ['/res/theme-previews/foodie.jpg'], isFree: true, is_premium: false },
     { id: 'theme-techy', name: 'Gadget Zone', preview_images: ['/res/theme-previews/techy.jpg'], isFree: false, is_premium: false, price: 5000 }, // Exemple non premium payant
];

// Icônes pour les options de personnalisation
const themeOptionIcons: Record<string, JSX.Element> = {
    color: <IoColorPaletteOutline />,
    text: <IoTextOutline />,
    disposition: <Layout className="w-5 h-5 text-slate-600" />,
    pub: <IoMegaphoneOutline />,
    faq: <IoChatbubblesOutline />,
    blog: <IoNewspaperOutline />,
};

interface ThemeManagerProps {
    store: StoreInterface; // Le store sélectionné
}

export function ThemeManager({ store }: ThemeManagerProps) {
    const { t } = useTranslation();
    const { currentStore: globalCurrentStore } = useStore(); // Pour l'URL base image? Ou utiliser store.url?
    // TODO: Remplacer par la vraie logique de récupération du thème actuel
    const currentTheme: Partial<ThemeInterface> | null = { // Données Placeholder
        id: store.current_theme_id ?? 'theme-classy-v1',
        name: 'Thème Élégant (Actuel)',
        description: 'Un thème versatile et moderne pour mettre en valeur vos produits avec classe.',
        preview_images: ['/res/theme-previews/elegant.jpg'],
        features: ['multi_category', 'responsive', 'product_zoom'],
        is_active: true // Supposons actif s'il est le current_theme_id
    };
     // TODO: Remplacer par un appel API pour les thèmes disponibles/récents
     // const { data: availableThemes, isLoading: isLoadingThemes } = useGetAvailableThemes();
     const availableThemes = recentThemesPlaceholder;
     const isLoadingThemes = false;


    // Options de personnalisation (peut venir de l'API du thème plus tard)
    const customizationOptions = [
        { key: 'color', labelKey: 'themeOptions.color', icon: themeOptionIcons.color },
        { key: 'text', labelKey: 'themeOptions.text', icon: themeOptionIcons.text },
        { key: 'disposition', labelKey: 'themeOptions.layout', icon: themeOptionIcons.disposition },
        { key: 'pub', labelKey: 'themeOptions.ads', icon: themeOptionIcons.pub },
        { key: 'faq', labelKey: 'themeOptions.faq', icon: themeOptionIcons.faq },
        { key: 'blog', labelKey: 'themeOptions.blog', icon: themeOptionIcons.blog },
    ];

    const handleOptionClick = (optionKey: string) => {
         logger.info(`Theme option clicked: ${optionKey}`);
          // TODO: Naviguer vers l'éditeur de thème avec l'option sélectionnée
          // Ex: navigate(`/theme/editor?store=${store.id}&option=${optionKey}`)
          window.location.href = `/theme/editor?store=${store.id}&option=${optionKey}`; // Simple redirection pour l'instant
    };

    const handleChangeThemeClick = () => {
         logger.info(`Change theme clicked for store ${store.id}`);
         // TODO: Naviguer vers la page/modale de sélection de thème
          window.location.href = `/theme/market?store=${store.id}`; // Simple redirection
    };


    if (!currentTheme) {
        // Cas où le thème actuel ne peut être chargé (ne devrait pas arriver si un thème par défaut est assigné)
        return <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg">{t('themeManager.noThemeAssigned')}</div>; 
    }

    const currentThemeImage = currentTheme.preview_images?.[0] ?? NO_PICTURE;
    const currentThemeImageSrc = getImg(currentThemeImage, undefined, globalCurrentStore?.url).match(/url\("?([^"]+)"?\)/)?.[1];

    return (
         // Conteneur principal: fond blanc, rounded, shadow, border, padding, flex col
         <div className="theme-manager bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 flex flex-col gap-6">

             {/* Section Thème Actuel */}
             <div>
                 <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('themeManager.currentThemeTitle')}</h2> 
                 {/* Utiliser flex pour image et infos */}
                 <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start">
                     {/* Image Preview */}
                      <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0 rounded-lg overflow-hidden shadow-md border border-gray-100 aspect-video bg-gray-100"> {/* Aspect video */}
                          <img src={currentThemeImageSrc || NO_PICTURE} alt={currentTheme.name} className="w-full h-full object-cover" />
                      </div>
                     {/* Infos et Options */}
                     <div className="flex-grow flex flex-col gap-3">
                         {/* Nom et Bouton Changer */}
                          <div className="flex justify-between items-baseline gap-4">
                              <h3 className="text-xl font-semibold text-gray-900">{currentTheme.name}</h3>
                              <button
                                  onClick={handleChangeThemeClick}
                                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex-shrink-0"
                              >
                                  {t('themeManager.changeThemeButton')} 
                              </button>
                          </div>
                          {/* Description */}
                          {currentTheme.description && <p className="text-sm text-gray-500 line-clamp-2">{currentTheme.description}</p>}
                          {/* Tags / Features */}
                          {currentTheme.features && currentTheme.features.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                  {currentTheme.features.map(feature => (
                                       <span key={feature} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                          {t(`themeFeatures.${feature}`, feature)} 
                                      </span>
                                  ))}
                              </div>
                          )}
                           {/* Statut */}
                           <div className="flex items-center gap-2 text-sm font-medium text-green-600 mt-1">
                                <IoCheckmarkCircle /> {t('themeManager.activeStatus')} 
                           </div>
                           {/* Options de Personnalisation */}
                           <div className="mt-2 pt-3 border-t border-gray-100">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('themeManager.customizeOptions')}</h4> 
                                 {/* Utiliser grid pour les options */}
                                 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                     {customizationOptions.map(opt => (
                                         <button
                                             key={opt.key}
                                             onClick={() => handleOptionClick(opt.key)}
                                              className="flex items-center gap-2 p-2 rounded-md text-sm text-gray-700 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 transition"
                                         >
                                             <span className="text-lg">{opt.icon}</span>
                                             <span>{t(opt.labelKey)}</span> 
                                        </button>
                                     ))}
                                 </div>
                           </div>
                     </div>
                 </div>
             </div>

            {/* Section Thèmes Récents/Disponibles */}
             <div className="pt-6 border-t border-gray-100">
                 <div className="flex justify-between items-center mb-4">
                     <h2 className="text-lg font-semibold text-gray-800">{t('themeManager.availableThemesTitle')}</h2> 
                      <a href="/theme/market" className="text-sm text-blue-600 hover:underline">{t('common.seeAll')}</a> 
                 </div>
                  {/* Utiliser Swiper pour la liste horizontale */}
                 <div className="relative group"> {/* Pour boutons nav Swiper */}
                    <Swiper
                        modules={[Navigation]} // Ajouter FreeMode si besoin
                        spaceBetween={16} // gap-4
                         slidesPerView={'auto'} // S'adapte au contenu
                         navigation={{
                            nextEl: '.swiper-button-next-themes',
                            prevEl: '.swiper-button-prev-themes',
                        }}
                        className="recent-themes-swiper -mx-1 px-1" // Padding négatif pour aligner avec bord
                    >
                         {isLoadingThemes ? (
                              Array.from({ length: 4 }).map((_, i) => <SwiperSlide key={`skel-th-${i}`} className="!w-52"><ThemeCardSkeleton /></SwiperSlide>)
                         ) : availableThemes.length === 0 ? (
                             <div className="text-sm text-gray-500 italic px-1">{t('themeManager.noOtherThemes')}</div> 
                         ) : (
                              availableThemes.map((theme) => (
                                   <SwiperSlide key={theme.id} className="!w-52"> {/* Largeur fixe pour les cartes thème */}
                                       <ThemeCard theme={theme} />
                                   </SwiperSlide>
                              ))
                         )}
                    </Swiper>
                     {/* Boutons Navigation Swiper */}
                     <button className="swiper-button-prev-themes absolute top-1/2 left-0 transform -translate-y-1/2 z-10 p-2 bg-white/70 hover:bg-white rounded-full shadow-md text-gray-600 hover:text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0" aria-label={t('pagination.previous')}>
                         <IoChevronBack className="w-5 h-5" />
                     </button>
                     <button className="swiper-button-next-themes absolute top-1/2 right-0 transform -translate-y-1/2 z-10 p-2 bg-white/70 hover:bg-white rounded-full shadow-md text-gray-600 hover:text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0" aria-label={t('pagination.next')}>
                         <IoChevronForward className="w-5 h-5" />
                     </button>
                 </div>
             </div>

        </div>
    );
}


// --- Composant Interne ThemeCard ---
interface ThemeCardProps {
    theme: Partial<ThemeInterface>;
}

function ThemeCard({ theme }: ThemeCardProps) {
    const { t } = useTranslation();
    const { currentStore: globalCurrentStore } = useStore(); // Pour URL base image
    const [imgError, setImgError] = useState(false);

    const imageUrl = theme.preview_images?.[0] ?? NO_PICTURE;
    const imageSrc = getImg(imageUrl, undefined, globalCurrentStore?.url).match(/url\("?([^"]+)"?\)/)?.[1];
    const isFree = theme.price === 0 || theme.isFree;

    return (
         // Utiliser flex flex-col, bg, rounded, shadow, border, overflow-hidden, h-full
        <div className="theme-card flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-full transition duration-150 hover:shadow-md hover:border-gray-300">
            {/* Image Preview */}
            <div className="aspect-video w-full bg-gray-100"> {/* Ratio 16:9 */}
                 {/* Gestion Erreur Image */}
                 {!imgError ? (
                     <img src={imageSrc || NO_PICTURE} alt={theme.name} loading="lazy" className="w-full h-full object-cover" onError={() => setImgError(true)}/>
                  ) : (
                      <img src={NO_PICTURE} alt={t('common.imageError')} className="w-full h-full object-contain p-4 opacity-50" />
                  )}
            </div>
            {/* Infos */}
            <div className="p-3 flex flex-col flex-grow justify-between">
                 <div>
                     <p className='font-medium text-sm text-gray-800 truncate mb-1' title={theme.name}>{theme.name}</p>
                      {/* Ajouter description courte si disponible */}
                 </div>
                 {/* Prix / Gratuit */}
                 <div className="flex justify-between items-center mt-2">
                      <span className={`text-sm font-semibold ${isFree ? 'text-green-600' : 'text-blue-600'}`}>
                          {isFree ? t('themeCard.free') : `${Number(theme.price || 0).toLocaleString()} FCFA`} 
                      </span>
                      {/* Bouton Sélectionner/Aperçu */}
                      <button className="text-xs text-blue-600 hover:underline">{t('themeCard.selectButton')}</button> 
                 </div>
            </div>
        </div>
    );
}

// --- Skeleton pour ThemeCard ---
function ThemeCardSkeleton() {
    return (
        <div className="theme-card flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-full animate-pulse">
             {/* Image Placeholder */}
            <div className="aspect-video w-full bg-gray-300"></div>
             {/* Infos Placeholder */}
            <div className="p-3 flex flex-col flex-grow justify-between">
                 <div>
                    <div className="h-4 w-3/4 bg-gray-300 rounded mb-2"></div> {/* Nom */}
                 </div>
                 <div className="flex justify-between items-center mt-2">
                      <div className="h-4 w-16 bg-gray-200 rounded"></div> {/* Prix */}
                      <div className="h-4 w-12 bg-gray-200 rounded"></div> {/* Bouton */}
                 </div>
            </div>
        </div>
    );
}
