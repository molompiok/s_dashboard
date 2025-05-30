// pages/themes/market/+Page.tsx

import { useState, useMemo, useEffect } from 'react';
import { BreadcrumbItem, Topbar } from '../../../Components/TopBar/TopBar';
import { ThemeInterface } from '../../../api/Interfaces/Interfaces'; // Ajouter ThemeFilterType
import { useGetThemes, useActivateThemeForStore } from '../../../api/ReactSublymusApi'; // Hook pour lister et activer
import { useTranslation } from 'react-i18next';
import { ThemeListItem } from '../../../Components/ThemeList/ThemeListItem'; // Nouveau
import { LiveThemePreview, LiveThemePreviewSkeleton } from '../../../Components/ThemeEditor/LiveThemePreview'; // Nouveau
import { ThemeFilters } from '../../../Components/ThemeList/ThemeFilters'; // Nouveau
import logger from '../../../api/Logger';
// import { useStore } from '../stores/'; // Pour obtenir le storeId lors de l'installation
import { usePageContext } from '../../../renderer/usePageContext'; // Pour lire le storeId initial des params?
import { useGlobalStore } from '../../../api/stores/StoreStore';
import { useWindowSize } from '../../../Hooks/useWindowSize';
import { FaEdit, FaTimes } from 'react-icons/fa';
import { Menu } from 'lucide-react';
import { ThemeCard, ThemeCardSkeleton } from '../../../Components/ThemeManager/ThemeManager';
import { showErrorToast, showToast } from '../../../Components/Utils/toastNotifications';
import { useChildViewer } from '../../../Components/ChildViewer/useChildViewer';
import { ChildViewer } from '../../../Components/ChildViewer/ChildViewer';
import { StoresList } from '../../../Components/StoreList/StoresList';
import { StoreListPopup } from '../../../Components/StoreList/StoreListPopup';

export { Page };

// Type pour les filtres de thème
export interface ThemeFilterType {
    search?: string;
    tags?: string[]; // Filtrer par features/tags
    price?: 'all' | 'free' | 'premium';
    sort?: 'name_asc' | 'name_desc' | 'date_desc'; // Options de tri
    page: number,
    limit: number
    // Ajouter page/limit si pagination nécessaire pour la liste
}

function Page() {
    const { t } = useTranslation();
    const { currentStore } = useGlobalStore(); // Store actuel pour l'installation
    const { urlParsed } = usePageContext();
    // Récupérer un storeId potentiel depuis l'URL pour pré-sélectionner l'installation
    const targetStoreId = urlParsed.search?.store;


    // --- État ---
    const [filter, setFilter] = useState<any>({ price: 'all', sort: 'name_asc' });
    const [selectedTheme, setSelectedTheme] = useState<ThemeInterface | null>(null);
    const [isPreviewMaximized, setIsPreviewMaximized] = useState(false); // Pour gérer l'état fullscreen de la preview
    const [isSidebarOverlayVisible, setIsSidebarOverlayVisible] = useState(true);
    const { openChild } = useChildViewer()
    const scrollDirection = useScrollDirection()


    // --- Récupération des données ---
    // Fetcher tous les thèmes publics
    const { data: themesData, isLoading, isError, error } = useGetThemes(
        { ...filter, is_public: true }, // Ajouter filtre is_public=true et potentiellement pagination/sort
        // { enabled: true } // Toujours activé
    );
    const themes = themesData?.list ?? [];

    // Sélectionner le premier thème par défaut si aucun n'est sélectionné
    useEffect(() => {
        if (!selectedTheme && themes.length > 0) {
            setSelectedTheme(themes[0]);
        }
        // Si le thème sélectionné n'est plus dans la liste (à cause des filtres), désélectionner?
        if (selectedTheme && themes.length > 0 && !themes.some(t => t.id === selectedTheme.id)) {
            setSelectedTheme(themes[0]); // Revenir au premier
        }
        // Si la liste devient vide, désélectionner
        if (themes.length === 0) {
            setSelectedTheme(null);
        }
    }, [themes, selectedTheme]);

    // --- Mutation pour installer ---
    const activateThemeMutation = useActivateThemeForStore();

    // --- Handlers ---
    const handleSelectTheme = (theme: ThemeInterface) => {
        setSelectedTheme(theme);
    };

    const handleInstallTheme = (themeToInstall: ThemeInterface) => {
       
        if (!themeToInstall.id) return;

        openChild(<ChildViewer title='Choisissez la boutique qui utilisera ce thème'>
            <StoreListPopup onSelectStore={(store) => {
                openChild(null)
                
                store.id && activateThemeMutation.mutate(
                    { store_id: store.id, themeId: themeToInstall.id },
                    {
                        onSuccess: () => {
                            logger.info(`Theme ${themeToInstall.name} successfully activated for store ${store.id}`);
                            showToast(`Thème ${themeToInstall.name} activé avec succès`); // ✅ Toast succès
                        },
                        onError: (err) => {
                            logger.error({ err }, `Failed to activate theme ${themeToInstall.id} for store ${store.id}`);
                            showErrorToast(err);
                        }
                    }
                );
            }} />
        </ChildViewer>, {
            background: '#3455'
        })


    };

    const breadcrumbs: BreadcrumbItem[] = [
        { name: t('navigation.home'), url: '/' },
        // Ajouter un lien parent si pertinent (ex: Apparence?)
        { name: t('navigation.themes') }, // Ou "Marché des Thèmes"
    ];
    const toggleSidebarOverlay = () => {
        setIsSidebarOverlayVisible(prev => !prev);
    };
    const size = useWindowSize()

    const [contentWidth, setContentWidth] = useState(0)
    useEffect(() => {
        const content = document.querySelector('#page-content')
        const rect = content?.getBoundingClientRect()
        setContentWidth(rect?.width || contentWidth);
    }, [size.width, isSidebarOverlayVisible])

    return (
        <div className="w-full min-h-screen flex flex-col ">
            <Topbar back={true} breadcrumbs={breadcrumbs} title={t('themesMarket.pageTitle')} />

            {/* Layout principal - Deux colonnes sur Desktop (md+) */}
            <div className="relative flex flex-row flex-grow overflow-hidden">

                {/* --- Backdrop pour fermer la sidebar overlay sur mobile --- */}
                {isSidebarOverlayVisible && (
                    <div
                        className="absolute inset-0 bg-black/30 z-30 lg:hidden"
                        onClick={toggleSidebarOverlay}
                        aria-hidden="true"
                    ></div>
                )}

                {/* Colonne Gauche: Filtres et Liste (scrollable) */}
                <aside className={`
  transition-transform  pb-48 duration-300 ease-in-out
  bg-white border-gray-200 overflow-y-auto h-screen
  absolute inset-y-0 left-0 z-40 w-72 shadow-lg transform
  ${isSidebarOverlayVisible ? 'translate-x-0' : '-translate-x-full'}
  lg:relative lg:inset-auto lg:z-auto lg:w-80
  lg:translate-x-0 lg:shadow-none lg:flex-shrink-0 lg:border-r
`}>
                    {/* FILTRES FIXÉS EN HAUT */}
                    {scrollDirection === 'down' && (
                        <div className='w-full h-[288px]'></div>
                    )}
                    <div
                        className={`
      sticky top-0 z-10 p-4 bg-white pt-8 shadow-md transition-all duration-300
      ${scrollDirection === 'down' ? 'opacity-0 -translate-y-full pointer-events-none h-0 overflow-hidden' : 'opacity-100 translate-y-0'}
    `}
                    >
                        <ThemeFilters filter={filter} onFilterChange={setFilter} />
                        <button
                            onClick={toggleSidebarOverlay}
                            className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 lg:hidden"
                            aria-label={t('common.close')}
                        >
                            <FaTimes size={18} />
                        </button>
                    </div>
                    {/* CONTENU SCROLLABLE */}
                    {isLoading && Array.from({ length: 8 }).map((_, i) => <ThemeCardSkeleton key={`skel-list-${i}`} />)}
                    {isError && <p className="p-4 text-sm text-red-500">{error?.message || t('error_occurred')}</p>}
                    {!isLoading && !isError && themes.length === 0 && <p className="p-4 text-sm text-gray-500">{t('themeMarket.noThemesMatch')}</p>}

                    <div className="m-8" />

                    <div className='px-4 flex flex-col gap-4'>
                        {!isLoading && !isError &&
                            themes.map((theme, i) => (
                                <ThemeCard
                                    key={theme.id + i}
                                    theme={theme}
                                    isSelected={selectedTheme?.id === theme.id}
                                    onClick={() => handleSelectTheme(theme)}
                                />
                            ))}
                    </div>


                </aside>

                {/* Colonne Droite: Preview (prend l'espace restant) */}
                {/* Utiliser flex-grow pour qu'elle prenne la place */}
                <section className="flex-grow flex flex-col bg-gray-50 relative">
                    {isLoading ? (
                        <LiveThemePreviewSkeleton />
                    ) : selectedTheme ? (
                        <LiveThemePreview
                            onInstall={() => handleInstallTheme(selectedTheme)}
                            isInstalling={activateThemeMutation.isPending}
                            avalaibleWidth={contentWidth - (size.width >= 1024 ? 330 : 0)}
                            store={{ id: currentStore?.id || '' } as any}
                            theme={selectedTheme}
                            mode='market'
                            settings={{}} // Passer les settings en cours d'édition
                        />
                    ) : (
                        // Message si aucun thème n'est sélectionné (ne devrait pas arriver si sélection par défaut)
                        <div className="flex-grow flex items-center justify-center">
                            <p className="text-gray-500">{t('themeMarket.selectThemePrompt')}</p>
                        </div>
                    )}
                </section>
                {!isSidebarOverlayVisible && <button
                    type="button"
                    onClick={toggleSidebarOverlay}
                    className={`absolute top-2 cursor-pointer left-4 z-50 p-2 bg-gray-300 hover:bg-gray-400 text-white rounded-full shadow-md hover:shadow-xl lg:hidden hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition ${isSidebarOverlayVisible ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
                    aria-label={isSidebarOverlayVisible ? t('themeEditor.closeSidebar') : t('themeEditor.openSidebar')}
                    title={isSidebarOverlayVisible ? t('themeEditor.closeSidebar') : t('themeEditor.openSidebar')}
                >
                    <Menu className="w-6 h-6" />
                </button>
                }
            </div>
        </div>
    );
}


function useScrollDirection() {
    const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up')

    useEffect(() => {
        let lastScrollTop = 0

        const handleScroll = () => {
            const scrollTop = document.querySelector('aside')?.scrollTop || 0
            if (scrollTop > lastScrollTop) {
                setScrollDirection('down')
            } else if (scrollTop < lastScrollTop) {
                setScrollDirection('up')
            }
            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop
        }

        const aside = document.querySelector('aside')
        aside?.addEventListener('scroll', handleScroll)

        return () => {
            aside?.removeEventListener('scroll', handleScroll)
        }
    }, [])

    return scrollDirection
}