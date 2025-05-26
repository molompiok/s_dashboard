// Components/ThemeManager/ThemeManager.tsx

import { StoreInterface, ThemeInterface } from "../../api/Interfaces/Interfaces"; // Importer les interfaces
import { useTranslation } from "react-i18next";
import { getMedia } from "../Utils/StringFormater";
import { useGlobalStore } from "../../api/stores/StoreStore"; // Pour l'URL de base des images?
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation } from 'swiper/modules'; // Ajouter Navigation
import { IoColorPaletteOutline, IoTextOutline, IoMegaphoneOutline, IoChatbubblesOutline, IoNewspaperOutline, IoChevronForward, IoBrushOutline, IoCheckmarkCircle, IoChevronBack, IoLanguageOutline, IoGlobeOutline, IoTicketOutline, IoStorefrontOutline } from "react-icons/io5"; // Icônes pour options
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
import { useGetThemes } from "../../api/ReactSublymusApi";
import { Server_Host } from "../../renderer/+config";



// Icônes pour les options de personnalisation
const themeSectionIcons: Record<string, JSX.Element> = {
    general: <IoStorefrontOutline />,
    colors: <IoColorPaletteOutline />,
    typography: <IoTextOutline />,
    layout: <Layout className="w-8 h-8 mb-4 text-slate-600" />,
    header: <IoNewspaperOutline />, // Choisir une icône pertinente pour header
    footer: <IoNewspaperOutline />, // Choisir une icône pertinente pour footer (peut être la même?)
    plan: <IoTicketOutline />, // Icône pour la section Forfait (si on met un lien depuis ThemeManager?)
    domains: <IoGlobeOutline />, // Icône pour Domaines
    legal: <IoNewspaperOutline />, // Icône pour Légal
    regional: <IoLanguageOutline />, // Icône pour Régional
    // ... autres sections ...
};

interface ThemeManagerProps {
    store: StoreInterface; // Le store sélectionné
}

export function ThemeManager({ store }: ThemeManagerProps) {
    const { t } = useTranslation();
    const { currentStore: globalCurrentStore } = useGlobalStore(); // Pour l'URL base image? Ou utiliser store.url?
    // TODO: Remplacer par la vraie logique de récupération du thème actuel
    const currentTheme: Partial<ThemeInterface> | null = store.currentTheme || { // Données Placeholder
        id: store.current_theme_id ?? 'theme-classy-v1',
        name: 'Thème Élégant (Actuel)',
        description: 'Un thème versatile et moderne pour mettre en valeur vos produits avec classe.',
        preview_images: ['/res/theme-previews/elegant.jpg'],
        features: ['multi_category', 'responsive', 'product_zoom'],
        is_active: true // Supposons actif s'il est le current_theme_id
    };
    // TODO: Remplacer par un appel API pour les thèmes disponibles/récents
    const { data: themes, isLoading: isLoadingThemes } = useGetThemes({

    }, {
        enabled: true
    });

    const availableThemes = themes?.list || [];
    // const isLoadingThemes = false;

    console.log({ currentTheme, store });


    // Options de personnalisation (peut venir de l'API du thème plus tard)
    const customizationSections = [
        { key: 'general', titleKey: 'themeEditor.section.general' },
        { key: 'colors', titleKey: 'themeEditor.section.colors' },
        { key: 'typography', titleKey: 'themeEditor.section.typography' },
        { key: 'layout', titleKey: 'themeEditor.section.layout' },
        { key: 'header', titleKey: 'themeEditor.section.header' },
        { key: 'footer', titleKey: 'themeEditor.section.footer' },
        // Ajouter d'autres sections pertinentes de l'éditeur ici
    ];

    // --- Handlers ---
    const handleOptionClick = (optionKey: string) => {
        logger.info(`Theme option clicked: ${optionKey}`);
        const themeId = currentTheme?.id ?? store.current_theme_id; // Utiliser l'ID chargé ou celui du store
        if (themeId) {
            window.location.href = `/themes/editor?store=${store.id}&theme=${themeId}&option=${optionKey}`; // Redirection vers éditeur
        } else {
            logger.warn("Cannot navigate to theme editor: current theme ID is missing.");
            // Afficher un message d'erreur?
        }
    };

    const handleChangeThemeClick = () => {
        logger.info(`Change theme clicked for store ${store.id}`);
        // TODO: Naviguer vers la page/modale de sélection de thème
        window.location.href = `/themes/market?store=${store.id}`; // Simple redirection
    };


    if (!currentTheme) {
        // Cas où le thème actuel ne peut être chargé (ne devrait pas arriver si un thème par défaut est assigné)
        return <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg">{t('themeManager.noThemeAssigned')}</div>;
    }

    const currentThemeImage = currentTheme.preview_images?.[0] ?? NO_PICTURE;
    const currentThemeImageSrc = getMedia({ source: currentThemeImage, from: 'server' });
    return (
        // Conteneur principal
        <div className="theme-manager bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col gap-6">

            {/* Section Thème Actuel */}
            <div className="p-4 sm:p-6 border-b border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">{t('themeManager.currentThemeTitle')}</h2>
                    <button
                        onClick={handleChangeThemeClick}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                    >
                        {t('themeManager.changeThemeButton')} <IoBrushOutline className="w-4 h-4" />
                    </button>
                </div>
                {isLoadingThemes ? (
                    <div className="flex gap-4 md:gap-6 items-start animate-pulse">
                        <div className="w-1/3 lg:w-1/4 flex-shrink-0 rounded-lg aspect-video bg-gray-300"></div>
                        <div className="flex-grow flex flex-col gap-3 pt-1">
                            <div className="h-6 w-3/5 bg-gray-300 rounded"></div>
                            <div className="h-4 w-full bg-gray-200 rounded"></div>
                            <div className="h-4 w-4/6 bg-gray-200 rounded"></div>
                            <div className="h-5 w-20 bg-gray-300 rounded-full mt-1"></div>
                        </div>
                    </div>
                ) : currentTheme ? (
                    <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start">
                        <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0 rounded-lg overflow-hidden shadow border border-gray-100 aspect-video bg-gray-100">
                            <img src={currentThemeImageSrc || NO_PICTURE} alt={currentTheme.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-grow flex flex-col gap-2">
                            <h3 className="text-xl font-semibold text-gray-900">{currentTheme.name}</h3>
                            {currentTheme.description && <p className="text-sm text-gray-500 line-clamp-3">{currentTheme.description}</p>}
                            {/* Tags / Features */}
                            {currentTheme.features && currentTheme.features.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                    {currentTheme.features.map(feature => (
                                        <span key={feature} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                            {t(`themeFeatures.${feature}`, feature)}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-sm font-medium text-green-600 mt-1">
                                <IoCheckmarkCircle /> {t('themeManager.activeStatus')}
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 italic">{t('themeManager.noThemeAssigned')}</p>
                )}
            </div>

            {/* Options de Personnalisation (seulement si thème actuel chargé) */}
            {currentTheme && (
                <div className="px-4 sm:px-6 pb-4">
                    <h4 className="text-sm font-semibold text-gray-600 uppercase mb-3 tracking-wide">
                        {t('themeManager.customizeOptions')}
                    </h4>
                    {/* Utiliser grid */}
                    <div className="grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {customizationSections.map(opt => (
                            <button
                                key={opt.key}
                                onClick={() => handleOptionClick(opt.key)}
                                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg text-sm text-center text-gray-700 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 hover:border-blue-200 transition aspect-square"
                            >
                                <span className="text-2xl text-gray-500 group-hover:text-blue-600">{themeSectionIcons[opt.key]}</span>
                                <span className="font-medium text-xs text-center truncate w-full">
                                    {t(opt.titleKey)}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Section Thèmes Disponibles */}
            <div className="px-4 sm:px-6 pb-6 border-t border-gray-100 pt-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-base font-semibold text-gray-800">{t('themeManager.availableThemesTitle')}</h2>
                    <a href="/themes/market" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                        {t('common.seeAll')} <IoChevronForward />
                    </a>
                </div>
                {/* Swiper Horizontal */}
                <div className="relative group -mx-1 px-1"> {/* Padding négatif pour aligner */}
                    <Swiper
                        modules={[Navigation]}
                        spaceBetween={16}
                        slidesPerView={'auto'} // Laisser Swiper gérer
                        navigation={{
                            nextEl: '.swiper-button-next-themes-mngr',
                            prevEl: '.swiper-button-prev-themes-mngr',
                        }}
                        className="recent-themes-swiper h-48"
                    >
                        {isLoadingThemes ? (
                            Array.from({ length: 4 }).map((_, i) => <SwiperSlide key={`skel-th-${i}`} className="!w-48 sm:!w-52"><ThemeCardSkeleton /></SwiperSlide>)
                        ) : availableThemes.length === 0 ? (
                            <div className="text-sm text-gray-500 italic px-1">{t('themeManager.noOtherThemes')}</div>
                        ) : (
                            availableThemes.map((theme) => (
                                <SwiperSlide key={theme.id} className="!w-48 sm:!w-52 p-1"> {/* Largeur fixe */}
                                    <ThemeCard theme={theme} isCurrent={theme.id === currentTheme?.id} /> {/* Passer isCurrent */}
                                </SwiperSlide>
                            ))
                        )}
                    </Swiper>
                    {/* Boutons Navigation Swiper */}
                    <button className="swiper-button-prev-themes-mngr absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-3 z-10 p-2 bg-white/80 hover:bg-white rounded-full shadow-md text-gray-600 hover:text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0" aria-label={t('pagination.previous')}>
                        <IoChevronBack className="w-5 h-5" />
                    </button>
                    <button className="swiper-button-next-themes-mngr absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-3 z-10 p-2 bg-white/80 hover:bg-white rounded-full shadow-md text-gray-600 hover:text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0" aria-label={t('pagination.next')}>
                        <IoChevronForward className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Composant Interne ThemeCard (Revu pour ce contexte) ---
interface ThemeCardProps {
    theme: Partial<ThemeInterface>;
    isCurrent?: boolean; // Indiquer si c'est le thème actuel
    isSelected?: boolean,
    onClick?: () => void
}

export function ThemeCard({ theme, isCurrent = false, isSelected, onClick }: ThemeCardProps) {
    const { t } = useTranslation();
    const { currentStore: globalCurrentStore } = useGlobalStore(); // Pour URL base image
    const [imgError, setImgError] = useState(false);

    // Action au clic (Installer ou Personnaliser)
    const handleClick = () => {
        if (isCurrent) {
            // Naviguer vers l'éditeur
            window.location.href = `/themes/editor?store=${globalCurrentStore?.id}&theme=${theme.id}`;
        } else {
            // Naviguer vers la preview ou le marché avec ce thème sélectionné?
            // Ou déclencher l'installation? Pour l'instant, navigue vers preview
            window.location.href = `/themes/preview/${theme.id}?store=${globalCurrentStore?.id}`;
        }
    };

    const imageSrc = theme.preview_images?.[0] ? getMedia({ source: theme.preview_images?.[0], from: 'server' }) : NO_PICTURE;
    const isFree = theme.price === 0 || theme.is_premium === false; // Ajuster logique gratuit/premium


    return (
        <button // Rendre la carte cliquable
            type="button"
            onClick={onClick || handleClick}
            className={`theme-card w-full h-full flex flex-col bg-white rounded-lg shadow-sm border overflow-hidden transition duration-150 ${isCurrent ? 'border-blue-500 ring-1 ring-blue-400' : 'border-gray-200 hover:shadow-md hover:border-gray-300'
                }`}
        >
            <div className={`aspect-video w-full bg-gray-100 ${isCurrent ? 'relative' : ''}`}>
                {isCurrent && (
                    <span className="absolute top-1.5 left-1.5 z-10 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {t('themeManager.currentLabel')}
                    </span>
                )}
                {!imgError ? (
                    <img src={imageSrc || NO_PICTURE} alt={theme.name} loading="lazy" className="w-full h-full object-cover" onError={() => setImgError(true)} />
                ) : (
                    <img src={NO_PICTURE} alt={t('common.imageError')} className="w-full h-full object-contain p-4 opacity-50" />
                )}
            </div>
            <div className="p-2 flex flex-col flex-grow justify-between text-left">
                <div><p className='font-medium text-xs text-gray-800 truncate' title={theme.name}>{theme.name}</p></div>
                <div className="flex justify-between items-center mt-1">
                    <span className={`text-xs font-semibold ${isFree ? 'text-green-600' : 'text-blue-600'}`}>
                        {isFree ? t('themeCard.free') : `${Number(theme.price || 0).toLocaleString()} FCFA`}
                    </span>
                    {/* Afficher "Personnaliser" si courant, "Choisir" sinon */}
                    <span className="text-[11px] text-blue-600 font-medium group-hover:underline">
                        {isCurrent ? t('themeManager.customizeButton') : t('themeCard.selectButton')}
                    </span>
                </div>
            </div>
        </button>
    );
}

// --- Skeleton pour ThemeCard ---
export function ThemeCardSkeleton() {
    return (
        <div className="theme-card w-[90%] mx-auto mb-4 h-auto flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
            <div className="aspect-video w-full bg-gray-300"></div>
            <div className="p-2 flex flex-col flex-grow justify-between">
                <div><div className="h-4 w-3/4 bg-gray-300 rounded mb-2"></div></div>
                <div className="flex justify-between items-center mt-1">
                    <div className="h-4 w-12 bg-gray-200 rounded"></div>
                    <div className="h-4 w-10 bg-gray-200 rounded"></div>
                </div>
            </div>
        </div>
    );
}