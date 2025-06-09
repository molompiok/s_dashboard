// Components/ThemeManager/ThemeManager.tsx

import { StoreInterface, ThemeInterface } from "../../api/Interfaces/Interfaces";
import { useTranslation } from "react-i18next";
import { getMedia } from "../Utils/StringFormater";
import { useGlobalStore } from "../../api/stores/StoreStore";
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation } from 'swiper/modules';
import {
    Palette,
    Type,
    Newspaper,
    ChevronRight,
    Brush,
    ChevronLeft,
    Languages,
    Globe,
    Ticket,
    Store,
    Layout,
} from "lucide-react";
import logger from "../../api/Logger";

import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import { JSX, useState } from "react";
import { NO_PICTURE } from "../Utils/constants";
import { useGetThemes } from "../../api/ReactSublymusApi";
import { navigate } from "vike/client/router";
import { ClientCall } from "../Utils/functions";

// Icônes pour les options de personnalisation avec Lucide
const themeSectionIcons: Record<string, JSX.Element> = {
    general: <Store className="w-5 h-5" />,
    colors: <Palette className="w-5 h-5" />,
    typography: <Type className="w-5 h-5" />,
    layout: <Layout className="w-5 h-5" />,
    header: <Newspaper className="w-5 h-5" />,
    footer: <Newspaper className="w-5 h-5" />,
    plan: <Ticket className="w-5 h-5" />,
    domains: <Globe className="w-5 h-5" />,
    legal: <Newspaper className="w-5 h-5" />,
    regional: <Languages className="w-5 h-5" />,
};

interface ThemeManagerProps {
    store?: StoreInterface | undefined;
}

export function ThemeManager({ store }: ThemeManagerProps) {
    const { t } = useTranslation();
    const { currentStore: globalCurrentStore } = useGlobalStore();

    const currentTheme: Partial<ThemeInterface> | null = store?.currentTheme || {
        id: store?.current_theme_id ?? 'theme-classy-v1',
        name: 'Interface Développeur',
        description: 'Thème de substitution destiné à votre équipe de développeur pour effectuer les tâches serveur depuis votre site',
        preview_images: [ClientCall(function () { return window.location.origin }, '') + '/res/empty/theme-preview-api.png'],
        features: ['multi_category', 'responsive', 'product_zoom'],
        is_active: true
    };

    const { data: themes, isLoading: isLoadingThemes } = useGetThemes({}, {
        enabled: true
    });

    const availableThemes = themes?.list || [];

    const customizationSections = [
        { key: 'general', titleKey: 'themeEditor.section.general' },
        { key: 'colors', titleKey: 'themeEditor.section.colors' },
        { key: 'typography', titleKey: 'themeEditor.section.typography' },
        { key: 'layout', titleKey: 'themeEditor.section.layout' },
        { key: 'header', titleKey: 'themeEditor.section.header' },
        { key: 'footer', titleKey: 'themeEditor.section.footer' },
    ];

    const handleOptionClick = (optionKey: string) => {
        logger.info(`Theme option clicked: ${optionKey}`);
        const themeId = currentTheme?.id ?? store?.current_theme_id;
        if (themeId) {
            navigate(`/themes/editor?store=${store?.id}&theme=${themeId}&option=${optionKey}`);
        } else {
            logger.warn("Cannot navigate to theme editor: current theme ID is missing.");
        }
    };

    const handleChangeThemeClick = () => {
        logger.info(`Change theme clicked for store ${store?.id}`);
        navigate(`/themes/market?store=${store?.id}`);
    };

    if (!currentTheme) {
        return (
            <div className="p-3 bg-yellow-500/10 dark:bg-yellow-400/5 backdrop-blur-sm text-yellow-700 dark:text-yellow-300 rounded-xl sl:rounded-2xl border border-yellow-200/30 dark:border-yellow-400/20">
                {t('themeManager.noThemeAssigned')}
            </div>
        );
    }

    const currentThemeImage = currentTheme.preview_images?.[0] ?? NO_PICTURE;
    const currentThemeImageSrc = getMedia({ source: currentThemeImage, from: 'server' });

    return (
        <div className="theme-manager bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl sl:rounded-2xl sx2:rounded-3xl p-2  sx:p-3 sx2:p-4 border border-white/20 dark:border-white/10 shadow-xl">
            {store?.id && (
                <>
                    {/* Section Thème Actuel */}
                    <div className="p-3 border-b border-white/10 dark:border-white/5">
                        <div className="flex flex-col sl:flex-row sl:justify-between sl:items-center gap-3 mb-4 sx:mb-6">
                            <h2 className="text-base sx:text-lg font-semibold text-gray-800 dark:text-gray-100">
                                {t('themeManager.currentThemeTitle')}
                            </h2>
                            <button
                                onClick={handleChangeThemeClick}
                                className="self-start sl:self-auto text-xs sx:text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:underline flex items-center gap-1.5 px-3 py-1.5 bg-green-50/50 dark:bg-green-900/20 rounded-lg backdrop-blur-sm transition-all duration-200"
                            >
                                <Brush className="w-3 h-3 sx:w-4 sx:h-4" />
                                {t('themeManager.changeThemeButton')}
                            </button>
                        </div>

                        {isLoadingThemes ? (
                            <div className="flex flex-col sx2:flex-row gap-3 sx2:gap-6 items-start animate-pulse">
                                <div className="w-full sx2:w-1/3 sx2:max-w-xs flex-shrink-0 rounded-lg aspect-video bg-gray-300/20 dark:bg-gray-600/20 backdrop-blur-sm"></div>
                                <div className="flex-grow flex flex-col gap-2 sx:gap-3 pt-1">
                                    <div className="h-5 sx:h-6 w-3/5 bg-gray-300/20 dark:bg-gray-600/20 rounded backdrop-blur-sm"></div>
                                    <div className="h-3 sx:h-4 w-full bg-gray-200/20 dark:bg-gray-700/20 rounded backdrop-blur-sm"></div>
                                    <div className="h-3 sx:h-4 w-4/6 bg-gray-200/20 dark:bg-gray-700/20 rounded backdrop-blur-sm"></div>
                                    <div className="h-4 sx:h-5 w-16 sx:w-20 bg-gray-300/20 dark:bg-gray-600/20 rounded-full mt-1 backdrop-blur-sm"></div>
                                </div>
                            </div>
                        ) : currentTheme ? (
                            <div className="flex flex-col sx2:flex-row xl:flex-col gap-3 sx2:gap-6 items-start">
                                <div className="w-full sx2:w-1/3 sx2:max-w-xs xl:w-full flex-shrink-0 rounded-lg overflow-hidden shadow-lg border border-white/20 dark:border-white/10 aspect-video bg-gray-100/20 dark:bg-gray-800/20 backdrop-blur-sm">
                                    <img
                                        src={currentThemeImageSrc || NO_PICTURE}
                                        alt={currentTheme.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-grow flex flex-col gap-2 sx:gap-3">
                                    <h3 className="text-lg sx:text-xl font-semibold text-gray-900 dark:text-gray-100">
                                        {currentTheme.name}
                                    </h3>
                                    {currentTheme.description && (
                                        <p className="text-xs sx:text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
                                            {currentTheme.description}
                                        </p>
                                    )}

                                    {/* Features/Tags */}
                                    {currentTheme.features && currentTheme.features.length > 0 && (
                                        <div className="flex flex-wrap gap-1 sx:gap-1.5 mt-1">
                                            {currentTheme.features.map(feature => (
                                                <span
                                                    key={feature}
                                                    className="text-xs bg-gray-100/20 dark:bg-gray-800/20 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full backdrop-blur-sm border border-gray-200/20 dark:border-gray-700/20"
                                                >
                                                    {t(`themeFeatures.${feature}`, feature)}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400 mt-1">
                                        <CheckCircle className="w-4 h-4" />
                                        {t('themeManager.activeStatus')}
                                    </div> */}
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                {t('themeManager.noThemeAssigned')}
                            </p>
                        )}
                    </div>

                    {/* Options de Personnalisation */}
                    {currentTheme && (
                        <div className="px-3  pb-4 sx:pb-6">
                            <h4 className="text-xs mt-6 sx:text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase mb-3 sx:mb-4 tracking-wide">
                                {t('themeManager.customizeOptions')}
                            </h4>

                            <div className="grid grid-cols-2 sl2:grid-cols-3 mob:grid-cols-4 tab:grid-cols-5 md:grid-cols-6 gap-2  xl:grid-cols-3 sx:gap-3 ">
                                {customizationSections.map(opt => (
                                    <button
                                        key={opt.key}
                                        onClick={() => handleOptionClick(opt.key)}
                                        className="group flex flex-col items-center  cursor-pointer justify-center gap-1 sx:gap-2 p-2 sx:p-3 rounded-lg text-center text-gray-700 dark:text-gray-300 bg-white/10 dark:bg-white/5 hover:bg-green-50/20 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-300 border border-green-200/50 dark:border-white/10 hover:border-green-200/50 dark:hover:border-green-400/20 backdrop-blur-sm transition-all duration-200 aspect-square"
                                    >
                                        <span className="text-gray-500 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-200">
                                            {themeSectionIcons[opt.key]}
                                        </span>
                                        <span className="font-medium text-xs text-center leading-none">
                                            {t(opt.titleKey)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Section Thèmes Disponibles */}
            <div className="px-3  pb-4 sx:pb-6 border-t border-white/10 dark:border-white/5 pt-4 sx:pt-6">
                <div className="flex flex-col sl:flex-row sl:justify-between sl:items-center gap-3 mb-4 sx:mb-6">
                    <h2 className="text-sm sx:text-base font-semibold text-gray-800 dark:text-gray-100">
                        {t('themeManager.availableThemesTitle')}
                    </h2>
                    <a
                        href="/themes/market"
                        className="self-start sl:self-auto text-xs sx:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline flex items-center gap-1 px-3 py-1.5 bg-blue-50/20 dark:bg-blue-900/20 rounded-lg backdrop-blur-sm transition-all duration-200"
                    >
                        {t('common.seeAll')}
                        <ChevronRight className="w-3 h-3 sx:w-4 sx:h-4" />
                    </a>
                </div>

                {/* Swiper Container */}
                <div className="relative group -mx-1 px-1">
                    <Swiper
                        modules={[Navigation]}
                        spaceBetween={12}
                        slidesPerView={'auto'}
                        navigation={{
                            nextEl: '.swiper-button-next-themes-mngr',
                            prevEl: '.swiper-button-prev-themes-mngr',
                        }}
                        className="recent-themes-swiper h-44 sx:h-48"
                        breakpoints={{
                            260: { spaceBetween: 8 },
                            320: { spaceBetween: 10 },
                            380: { spaceBetween: 12 },
                            420: { spaceBetween: 14 },
                            478: { spaceBetween: 16 }
                        }}
                    >
                        {isLoadingThemes ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <SwiperSlide key={`skel-th-${i}`} className="!w-36 sl:!w-40 sx:!w-44 sx2:!w-48">
                                    <ThemeCardSkeleton />
                                </SwiperSlide>
                            ))
                        ) : availableThemes.length === 0 ? (
                            <div className="text-sm text-gray-500 dark:text-gray-400 italic px-1">
                                {t('themeManager.noOtherThemes')}
                            </div>
                        ) : (
                            availableThemes.map((theme) => (
                                <SwiperSlide key={theme.id} className="!w-36 sl:!w-40 sx:!w-44 sx2:!w-48 p-1">
                                    <ThemeCard
                                        theme={theme}
                                        isCurrent={theme.id === currentTheme?.id}
                                    />
                                </SwiperSlide>
                            ))
                        )}
                    </Swiper>

                    {/* Navigation Buttons */}
                    <button
                        className="swiper-button-prev-themes-mngr absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-2 sx:-translate-x-3 z-10 p-1.5 sx:p-2 bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 rounded-full shadow-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-0 backdrop-blur-sm border border-white/20 dark:border-white/10"
                        aria-label={t('pagination.previous')}
                    >
                        <ChevronLeft className="w-4 h-4 sx:w-5 sx:h-5" />
                    </button>
                    <button
                        className="swiper-button-next-themes-mngr absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-2 sx:translate-x-3 z-10 p-1.5 sx:p-2 bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 rounded-full shadow-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-0 backdrop-blur-sm border border-white/20 dark:border-white/10"
                        aria-label={t('pagination.next')}
                    >
                        <ChevronRight className="w-4 h-4 sx:w-5 sx:h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Composant ThemeCard amélioré ---
interface ThemeCardProps {
    theme: Partial<ThemeInterface>;
    isCurrent?: boolean;
    isSelected?: boolean;
    onClick?: () => void;
}

export function ThemeCard({ theme, isCurrent = false, isSelected, onClick }: ThemeCardProps) {
    const { t } = useTranslation();
    const { currentStore: globalCurrentStore } = useGlobalStore();
    const [imgError, setImgError] = useState(false);

    const handleClick = () => {
        if (isCurrent) {
            navigate(`/themes/editor?store=${globalCurrentStore?.id}&theme=${theme.id}`);
        } else {
            navigate(`/themes/market?theme=${theme.id}`);
        }
    };

    const imageSrc = theme.preview_images?.[0] ? getMedia({ source: theme.preview_images?.[0], from: 'server' }) : NO_PICTURE;
    const isFree = theme.price === 0 || theme.is_premium === false;

    return (
        <button
            type="button"
            onClick={onClick || handleClick}
            className={`theme-card cursor-pointer w-full h-full flex flex-col bg-white/10 dark:bg-white/5 rounded-lg shadow-sm border overflow-hidden transition-all duration-200 backdrop-blur-sm group ${isSelected
                    ? 'border-green-500 dark:border-green-400 ring-1 ring-green-400/50 dark:ring-green-300/50 shadow-md'
                    : 'border-white/20 dark:border-white/10 hover:shadow-md hover:border-white/30 dark:hover:border-white/20 hover:bg-white/15 dark:hover:bg-white/10'
                }`}
        >
            <div className={`aspect-video w-full bg-gray-100/20 dark:bg-gray-800/20 backdrop-blur-sm ${isCurrent ? 'relative' : ''}`}>
                {isCurrent && (
                    <span className="absolute top-1.5 left-1.5 z-10 bg-green-600 dark:bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                        {t('themeManager.currentLabel')}
                    </span>
                )}
                {!imgError ? (
                    <img
                        src={imageSrc || NO_PICTURE}
                        alt={theme.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <img
                        src={NO_PICTURE}
                        alt={t('common.imageError')}
                        className="w-full h-full object-contain p-4 opacity-50"
                    />
                )}
            </div>

            <div className="p-2 sx:p-3 flex flex-col flex-grow justify-between text-left">
                <div>
                    <p className="font-medium text-xs sx:text-sm text-gray-800 dark:text-gray-100 truncate leading-tight" title={theme.name}>
                        {theme.name}
                    </p>
                </div>
                <div className="flex justify-between items-center mt-1.5 sx:mt-2">
                    <span className={`text-xs font-semibold ${isFree
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}>
                        {isFree ? t('themeCard.free') : `${Number(theme.price || 0).toLocaleString()} FCFA`}
                    </span>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium group-hover:underline">
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
        <div className="theme-card w-full h-full flex flex-col bg-white/10 dark:bg-white/5 rounded-lg shadow-sm border border-white/20 dark:border-white/10 overflow-hidden animate-pulse backdrop-blur-sm">
            <div className="aspect-video w-full bg-gray-300/20 dark:bg-gray-600/20 backdrop-blur-sm"></div>
            <div className="p-2 sx:p-3 flex flex-col flex-grow justify-between">
                <div>
                    <div className="h-3 sx:h-4 w-3/4 bg-gray-300/20 dark:bg-gray-600/20 rounded mb-2 backdrop-blur-sm"></div>
                </div>
                <div className="flex justify-between items-center mt-1">
                    <div className="h-3 sx:h-4 w-10 sx:w-12 bg-gray-200/20 dark:bg-gray-700/20 rounded backdrop-blur-sm"></div>
                    <div className="h-3 sx:h-4 w-8 sx:w-10 bg-gray-200/20 dark:bg-gray-700/20 rounded backdrop-blur-sm"></div>
                </div>
            </div>
        </div>
    );
}