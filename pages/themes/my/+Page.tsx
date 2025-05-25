// pages/themes/my/+Page.tsx

import { useState, useEffect, useMemo } from 'react'; // Ajouter useMemo
import { Topbar } from '../../../Components/TopBar/TopBar';
import { ThemeInterface, StoreInterface } from '../../../api/Interfaces/Interfaces';
// Importer les hooks API nécessaires
import { /*useGetMyThemes,*/ useActivateThemeForStore, useGetStoreList } from '../../../api/ReactSublymusApi'; // Ajouter useGetStores
import { useTranslation } from 'react-i18next';
import logger from '../../../api/Logger';
// Remplacer ThemeCard et ThemeCardSkeleton par les versions spécifiques à cette page
// import { ThemeCard } from '../../../Components/ThemeManager/ThemeManager';
// import { ThemeCardSkeleton } from '../../../Components/ThemeManager/ThemeManager';
import { useChildViewer } from '../../../Components/ChildViewer/useChildViewer'; // Pour le popup de sélection de store
import { ChildViewer } from '../../../Components/ChildViewer/ChildViewer'; // Pour le popup
import { NO_PICTURE } from '../../../Components/Utils/constants';
import { getImg } from '../../../Components/Utils/StringFormater';
import { ApiError } from '../../../api/SublymusApi'; // Importer ApiError pour le typing de la mutation

// --- Hook API Placeholder (à créer dans ReactSublymusApi.tsx) ---
// Simule la récupération des thèmes "possédés" par l'utilisateur
// Devrait appeler un endpoint spécifique sur s_server ou s_api
// AJOUT: Marquer que la fonction est un hook React Query valide
import { useQuery } from '@tanstack/react-query';
import { useGlobalStore } from '../../index/StoreStore';

const useGetMyThemes = (options: { enabled?: boolean } = {}) => {
    // Vrai hook (exemple simplifié)
    return useQuery<{ list: Partial<ThemeInterface>[] }, ApiError>({
        queryKey: ['myThemes'],
        queryFn: async () => {
            // TODO: Remplacer par l'appel api.theme.getMyThemes() quand il existera
            await new Promise(resolve => setTimeout(resolve, 500)); // Simuler délai réseau
            // Simuler des données
            const data: { list: Partial<ThemeInterface>[] } = {
                list: [
                    { id: 'theme-classy-v1', name: 'Thème Élégant', preview_images: ['/res/theme-previews/elegant.jpg'], is_premium: false, price: 0, },
                    { id: 'theme-minimal-dark', name: 'Minimaliste Sombre', preview_images: ['/res/theme-previews/minimal-dark.jpg'], is_premium: true, price: 15000, },
                    { id: 'theme-foodie', name: 'Saveurs Gourmandes', preview_images: ['/res/theme-previews/foodie.jpg'], is_premium: false, price: 0 }, // Non installé
                ]
            };
            return data;
        },
        enabled: options.enabled,
        staleTime: 5 * 60 * 1000, // Cache 5 min pour "mes thèmes"
    });
};
// --- Fin Placeholder ---

export { Page };

function Page() {
    const { t } = useTranslation();
    const { openChild } = useChildViewer();

    // --- Récupération des Thèmes Possédés/Installés ---
    const { data: myThemesData, isLoading, isError, error } = useGetMyThemes({ enabled: true }); // Activer le fetch
    const myThemes = myThemesData?.list ?? [];

    // --- Handlers (inchangés) ---
    const handleCustomize = (theme: Partial<ThemeInterface>) => {
        openChild(
            <ChildViewer title={t('myThemes.selectStoreToCustomize', { themeName: theme.name })}>
                <StoreSelectorPopup actionType="customize" themeToApply={theme}
                    onStoreSelected={(storeId) => {
                        openChild(null);
                        window.location.href = `/theme/editor?store=${storeId}&theme=${theme.id}`;
                    }}
                    onCancel={() => openChild(null)} />
            </ChildViewer>, { background: 'rgba(51, 65, 85, 0.7)', blur: 3 }
        );
    };
    const handleInstall = (theme: Partial<ThemeInterface>) => {
        openChild(
            <ChildViewer title={t('myThemes.selectStoreToInstall', { themeName: theme.name })}>
                <StoreSelectorPopup actionType="install" themeToApply={theme}
                    // Passer les IDs des stores où c'est déjà installé
                    filterStoreIds={(theme as any).installed_on ?? []}
                    onStoreSelected={(storeId) => { openChild(null); /* Action après install gérée dans popup */ }}
                    onCancel={() => openChild(null)} />
            </ChildViewer>, { background: 'rgba(51, 65, 85, 0.7)', blur: 3 }
        );
    };

    return (
        // Utiliser les classes Tailwind pour le layout principal
        <div className="w-full min-h-screen flex flex-col bg-gray-100">
            <Topbar back={true} title={t('myThemes.pageTitle')} />
            <main className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 flex-grow">
                {/* Titre optionnel si Topbar ne l'a pas */}
                {/* <h1 className="text-2xl font-semibold text-gray-900 mb-6">{t('myThemes.pageTitle')}</h1> */}

                {isLoading && (
                    // Grille de Skeletons
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => <MyThemeCardSkeleton key={`skel-my-${i}`} />)}
                    </div>
                )}
                {isError && <div className="p-6 text-center text-red-500">{error?.message || t('error_occurred')}</div>}

                {!isLoading && !isError && myThemes.length === 0 && (
                    // Message si aucun thème
                    <div className="text-center py-16 px-6 bg-white rounded-lg shadow-sm border border-gray-200">
                        <img src="/res/empty/themes.svg" alt={t('myThemes.noThemesYet')} className="mx-auto h-24 mb-4 opacity-70" />
                        <p className="mb-4 text-lg text-gray-600">{t('myThemes.noThemesYet')}</p>
                        <a href="/themes/market" className="text-blue-600 hover:underline font-medium">
                            {t('myThemes.discoverThemesLink')}
                        </a>
                    </div>
                )}

                {!isLoading && !isError && myThemes.length > 0 && (
                    // Grille des thèmes possédés
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {myThemes.map(theme => (
                            <MyThemeCard
                                key={theme.id}
                                theme={theme}
                                onCustomize={() => handleCustomize(theme)}
                                onInstall={() => handleInstall(theme)}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}


// --- Composant MyThemeCard --- (Styles Tailwind appliqués)
interface MyThemeCardProps {
    theme: Partial<ThemeInterface & { installed_on?: string[] }>; // Ajouter installed_on
    onCustomize: () => void;
    onInstall: () => void;
}

function MyThemeCard({ theme, onCustomize, onInstall }: MyThemeCardProps) {
    const { t } = useTranslation();
    const { currentStore: globalCurrentStore } = useGlobalStore();
    const [imgError, setImgError] = useState(false);

    const imageUrl = theme.preview_images?.[0] ?? NO_PICTURE;
    const imageSrc = getImg(imageUrl, undefined, globalCurrentStore?.url).match(/url\("?([^"]+)"?\)/)?.[1];
    const installedCount = theme.installed_on?.length ?? 0;

    return (
        <div className="my-theme-card flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-full transition duration-150 hover:shadow-md">
            {/* Image */}
            <div className="aspect-video w-full bg-gray-100 border-b border-gray-100">
                {!imgError ? (
                    <img src={imageSrc || NO_PICTURE} alt={theme.name} loading="lazy" className="w-full h-full object-cover" onError={() => setImgError(true)} />
                ) : (
                    <img src={NO_PICTURE} alt={t('common.imageError')} className="w-full h-full object-contain p-4 opacity-50" />
                )}
            </div>
            {/* Infos & Actions */}
            <div className="p-3 flex flex-col flex-grow">
                <h3 className='font-semibold text-sm sm:text-base text-gray-800 truncate mb-1' title={theme.name}>{theme.name}</h3>
                {/* Indicateur Installation */}
                <p className={`text-xs mb-2 ${installedCount > 0 ? 'text-green-600' : 'text-gray-400 italic'}`}>
                    {installedCount > 0
                        ? t('myThemes.installedOn', { count: installedCount })
                        : t('myThemes.notInstalled')
                    }
                </p>
                {/* Boutons d'action */}
                <div className="mt-auto pt-3 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
                    <button
                        type="button"
                        onClick={onCustomize}
                        disabled={installedCount === 0}
                        className="flex-1 inline-flex justify-center items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t('myThemes.customizeButton')}
                    </button>
                    <button
                        type="button"
                        onClick={onInstall}
                        className="flex-1 inline-flex justify-center items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    >
                        {t('myThemes.installButton')}
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Composant StoreSelectorPopup --- (Styles Tailwind appliqués)
interface StoreSelectorPopupProps {
    actionType: 'customize' | 'install';
    themeToApply: Partial<ThemeInterface>;
    onStoreSelected: (storeId: string) => void;
    onCancel: () => void;
    filterStoreIds?: string[];
}

function StoreSelectorPopup({ actionType, themeToApply, onStoreSelected, onCancel, filterStoreIds = [] }: StoreSelectorPopupProps) {
    const { t } = useTranslation();
    const { data: storesData, isLoading } = useGetStoreList(); // Hook API pour lister les stores
    const allStores = storesData?.list ?? [];

    const availableStores = useMemo(() => {
        if (actionType === 'install') {
            return allStores.filter(store => !filterStoreIds.includes(store.id || ''));
        }
        return allStores;
    }, [allStores, actionType, filterStoreIds]);

    const activateThemeMutation = useActivateThemeForStore();

    const handleSelect = (storeId: string) => {
        if (actionType === 'install') {
            if (!themeToApply.id) return;
            activateThemeMutation.mutate(
                { store_id: storeId, themeId: themeToApply.id },
                {
                    onSuccess: () => {
                        logger.info(`Theme ${themeToApply.id} activated for store ${storeId}`);
                        onStoreSelected(storeId);
                    },
                    onError: (error) => { logger.error({ error }, `Failed to activate theme ${themeToApply.id} for store ${storeId}`); }
                }
            );
        } else {
            onStoreSelected(storeId);
        }
    };

    return (
        // Styles Tailwind pour popup
        <div className="store-selector-popup p-4 sm:p-6 bg-white rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
                {actionType === 'install' ? t('myThemes.selectStoreToInstallTitle') : t('myThemes.selectStoreToCustomizeTitle')}
            </h3>

            {isLoading && <div className="text-center p-4 text-gray-500">{t('common.loading')}...</div>}

            {!isLoading && availableStores.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                    {actionType === 'install' ? t('myThemes.noStoresAvailableForInstall') : t('myThemes.noStoresFoundForCustomize')}
                </p>
            )}

            {!isLoading && availableStores.length > 0 && (
                // Liste scrollable
                <ul className="max-h-60 overflow-y-auto space-y-1 -mx-1 px-1">
                    {availableStores.map(store => (
                        <li key={store.id}>
                            <button
                                type="button"
                                onClick={() => handleSelect(store.id || '')}
                                disabled={activateThemeMutation.isPending && activateThemeMutation.variables?.store_id === store.id}
                                // Styles Tailwind pour chaque ligne de store
                                className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 text-left disabled:opacity-50"
                            >
                                {/* Logo/Initiales */}
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-xs font-medium text-gray-500" style={{ backgroundImage: getImg(store.logo?.[0], undefined, store.url) }}>
                                    {!store.logo?.[0] && store.name?.substring(0, 2).toUpperCase()}
                                </div>
                                {/* Nom */}
                                <span className="text-sm text-gray-800 truncate">{store.name}</span>
                                {/* Indicateur de chargement */}
                                {activateThemeMutation.isPending && activateThemeMutation.variables?.store_id === store.id && (
                                    <svg className="animate-spin h-4 w-4 text-blue-600 ml-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {/* Bouton Annuler */}
            <button onClick={onCancel} className="mt-6 w-full text-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                {t('common.cancel')}
            </button>
            {/* Erreur API */}
            {activateThemeMutation.isError && (<p className="text-red-600 text-sm mt-3 text-center">{activateThemeMutation.error.message}</p>)}
        </div>
    );
}


// --- Composant MyThemeCardSkeleton --- (Similaire à ThemeCardSkeleton)
function MyThemeCardSkeleton() {
    return (
        <div className="my-theme-card flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-full animate-pulse">
            <div className="aspect-video w-full bg-gray-300"></div>
            <div className="p-3 flex flex-col flex-grow">
                <div className="h-5 w-3/4 bg-gray-300 rounded mb-2"></div> {/* Nom */}
                <div className="h-3 w-1/2 bg-gray-200 rounded mb-3"></div> {/* Install count */}
                <div className="mt-auto pt-3 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
                    <div className="h-8 w-full bg-gray-200 rounded-md"></div> {/* Bouton Customize */}
                    <div className="h-8 w-full bg-gray-200 rounded-md"></div> {/* Bouton Install */}
                </div>
            </div>
        </div>
    );
}