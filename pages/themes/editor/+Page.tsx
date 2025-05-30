// pages/theme/editor/+Page.tsx (Adapter chemin)

import { useState, useEffect, useCallback } from 'react';
import { usePageContext } from '../../../renderer/usePageContext';
import { Topbar } from '../../../Components/TopBar/TopBar';
import { useTranslation } from 'react-i18next';
import logger from '../../../api/Logger';
import { PageNotFound } from '../../../Components/PageNotFound/PageNotFound';
import { EditorSidebar } from '../../../Components/ThemeEditor/EditorSidebar';
import { ApiError } from '../../../api/SublymusApi';
import { LiveThemePreview } from '../../../Components/ThemeEditor/LiveThemePreview';

// --- Importer les icônes nécessaires ---
import {
    FaPalette, FaFont, FaPaintBrush, FaThLarge, FaWindowMaximize, FaQuestionCircle, FaEdit, FaTimes // Ajout FaEdit, FaTimes
} from 'react-icons/fa';
import { useWindowSize } from '../../../Hooks/useWindowSize';
import { debounce } from '../../../Components/Utils/functions';

export { Page };

// Types Placeholder (INCHANGÉ - gardé pour la référence)
export interface ThemeOptionDefinition { key: string; type: 'color' | 'font' | 'text' | 'select' | 'toggle' | 'image'; labelKey: string; defaultValue?: any; options?: { value: string; labelKey: string }[]; section: string; descriptionKey?: string }
export interface ThemeOptionsStructure { themeId: string; themeName?: string; sections: { key: string; titleKey: string; order?: number }[]; options: ThemeOptionDefinition[]; }
export type ThemeSettingsValues = Record<string, any>;

// --- Mapping des icônes pour les sections ---
const sectionIcons: Record<string, React.ElementType> = {
    general: FaPaintBrush,       // Icône pour 'general'
    colors: FaPalette,           // Icône pour 'colors'
    typography: FaFont,          // Icône pour 'typography'
    layout: FaThLarge,           // Icône pour 'layout'
    header: FaWindowMaximize,    // Icône pour 'header'
    // Ajoutez d'autres sections ici...
    default: FaQuestionCircle    // Icône par défaut si aucune correspondance
};


function Page() {
    const { t } = useTranslation();
    const { urlParsed } = usePageContext();
    const storeId = urlParsed.search?.['store'];
    const themeId = urlParsed.search?.['theme'];
    const option = urlParsed.search?.['option'];

    // --- États ---
    const [themeOptions, setThemeOptions] = useState<ThemeOptionsStructure | null>(null);
    const [savedSettings, setSavedSettings] = useState<ThemeSettingsValues>({});
    const [draftSettings, setDraftSettings] = useState<ThemeSettingsValues>({});
    const [hasChanges, setHasChanges] = useState(false);
    const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    // --- Nouvel état pour la visibilité de la sidebar en survol (< lg) ---
    const [isSidebarOverlayVisible, setIsSidebarOverlayVisible] = useState(true);

    // --- Hooks API Placeholder (INCHANGÉ) ---
    const getThemeOptions = useCallback(async (id: string): Promise<ThemeOptionsStructure> => { /* ... (votre logique inchangée) ... */ return { themeId: id, themeName: "Thème Exemple", sections: [{ key: 'general', titleKey: 'themeEditor.section.general', order: 1 }, { key: 'colors', titleKey: 'themeEditor.section.colors', order: 2 }, { key: 'typography', titleKey: 'themeEditor.section.typography', order: 3 }, { key: 'layout', titleKey: 'themeEditor.section.layout', order: 4 }, { key: 'header', titleKey: 'themeEditor.section.header', order: 5 },], options: [{ key: 'storeNameVisible', type: 'toggle', section: 'general', labelKey: 'themeEditor.options.storeNameVisible', defaultValue: true, descriptionKey: 'themeEditor.options.storeNameVisibleDesc' }, { key: 'logoUrl', type: 'image', section: 'general', labelKey: 'themeEditor.options.logoUrl', defaultValue: '/res/logo-placeholder.svg', descriptionKey: 'themeEditor.options.logoUrlDesc' }, { key: 'primaryColor', type: 'color', section: 'colors', labelKey: 'themeEditor.options.primaryColor', defaultValue: '#2563EB', descriptionKey: 'themeEditor.options.primaryColorDesc' }, { key: 'secondaryColor', type: 'color', section: 'colors', labelKey: 'themeEditor.options.secondaryColor', defaultValue: '#6B7280', descriptionKey: 'themeEditor.options.secondaryColorDesc' }, { key: 'accentColor', type: 'color', section: 'colors', labelKey: 'themeEditor.options.accentColor', defaultValue: '#F59E0B', descriptionKey: 'themeEditor.options.accentColorDesc' }, { key: 'textColor', type: 'color', section: 'colors', labelKey: 'themeEditor.options.textColor', defaultValue: '#1F2937', descriptionKey: 'themeEditor.options.textColorDesc' }, { key: 'backgroundColor', type: 'color', section: 'colors', labelKey: 'themeEditor.options.backgroundColor', defaultValue: '#FFFFFF', descriptionKey: 'themeEditor.options.backgroundColorDesc' }, { key: 'bodyFont', type: 'font', section: 'typography', labelKey: 'themeEditor.options.bodyFont', defaultValue: 'Inter, sans-serif', descriptionKey: 'themeEditor.options.bodyFontDesc' }, { key: 'headingFont', type: 'font', section: 'typography', labelKey: 'themeEditor.options.headingFont', defaultValue: 'Poppins, sans-serif', descriptionKey: 'themeEditor.options.headingFontDesc' }, { key: 'baseFontSize', type: 'select', section: 'typography', labelKey: 'themeEditor.options.baseFontSize', defaultValue: '16px', descriptionKey: 'themeEditor.options.baseFontSizeDesc', options: [{ value: '14px', labelKey: 'themeEditor.fontSize.small' }, { value: '16px', labelKey: 'themeEditor.fontSize.medium' }, { value: '18px', labelKey: 'themeEditor.fontSize.large' },] }, { key: 'productListView', type: 'select', section: 'layout', labelKey: 'themeEditor.options.productListView', defaultValue: 'grid', descriptionKey: 'themeEditor.options.productListViewDesc', options: [{ value: 'grid', labelKey: 'themeEditor.layoutOptions.grid' }, { value: 'list', labelKey: 'themeEditor.layoutOptions.list' },] }, { key: 'showHeader', type: 'toggle', section: 'header', labelKey: 'themeEditor.options.showHeader', defaultValue: true, descriptionKey: 'themeEditor.options.showHeaderDesc', }, { key: 'headerAnnouncement', type: 'text', section: 'header', labelKey: 'themeEditor.options.headerAnnouncement', defaultValue: '', descriptionKey: 'themeEditor.options.headerAnnouncementDesc', },] as ThemeOptionDefinition[] }; }, []);
    const getThemeSettings = useCallback(async (sId: string, tId: string): Promise<ThemeSettingsValues> => { /* ... (votre logique inchangée) ... */ return { primaryColor: '#FF5733' }; }, []);
    const [saveThemeSettingsMutation, setS] = useState({ 
        isPending: false, 
        mutate: (data: any, options: any) => { 
            console.log("Saving settings:", data); 
            setS({...saveThemeSettingsMutation,isPending:true});
            setTimeout(() => { 
                if (Math.random() > 0.1){ 
                    options.onSuccess?.(data.settings); 
                    setS({...saveThemeSettingsMutation,isPending:false});
                }else {
                    options.onError?.(new ApiError("Save failed simulation", 500));
                }
            }, 1000); 
        } 
    })

    const size = useWindowSize()


    // --- Chargement Initial (INCHANGÉ) ---
    useEffect(() => {
        if (!storeId || !themeId) { /* ... (votre logique inchangée) ... */ setFetchError(t('themeEditor.error.missingParams')); setIsLoadingInitialData(false); return; }
        setIsLoadingInitialData(true); setFetchError(null);
        Promise.all([getThemeOptions(themeId), getThemeSettings(storeId, themeId)])
            .then(([optionsData, settingsData]) => {
                setThemeOptions(optionsData);
                const initialDraft: ThemeSettingsValues = {};
                (optionsData?.options ?? []).forEach(opt => { initialDraft[opt.key] = settingsData?.[opt.key] ?? opt.defaultValue; });
                setSavedSettings(settingsData ?? {});
                setDraftSettings(initialDraft); setHasChanges(false);
            }).catch(err => { logger.error({ storeId, themeId, error: err }, "Failed to load theme editor initial data"); setFetchError(err.message || t('error_occurred')); })
            .finally(() => { setIsLoadingInitialData(false); });
    }, [storeId, themeId, t, getThemeOptions, getThemeSettings]); // Ajouter les fonctions API aux dépendances

    // --- Détection Changements (INCHANGÉ) ---
    useEffect(() => {
        if (isLoadingInitialData || !themeOptions) return;
        let changed = false;
        (themeOptions?.options ?? []).forEach(opt => { if (draftSettings[opt.key] !== (savedSettings[opt.key] ?? opt.defaultValue)) { changed = true; } });
        setHasChanges(changed);
    }, [draftSettings, savedSettings, themeOptions, isLoadingInitialData]);

    // --- Handler pour les changements de la Sidebar (INCHANGÉ) ---
    const handleSettingChange = useCallback((key: string, value: any) => {
        setDraftSettings(prev => ({ ...prev, [key]: value }));
        debounce(()=>{
            saveThemeSettingsMutation.mutate({ 
                store_id: storeId, 
                theme_id: themeId, 
                settings: draftSettings 
            }, { 
                onSuccess: () => { 
                    logger.info("Theme settings saved successfully"); 
                    setSavedSettings(draftSettings); setHasChanges(false);
                }, 
                onError: (error: ApiError) => {
                    logger.error({ error }, "Failed to save theme settings"); 
                } 
            });
        },'theme-editor-save',3000)
    }, []);

    // --- Handler pour ouvrir/fermer la sidebar overlay ---
    const toggleSidebarOverlay = () => {
        setIsSidebarOverlayVisible(prev => !prev);
    };

    const [contentWidth, setContentWidth] = useState(0)
    useEffect(() => {
        const content = document.querySelector('#page-content')
        const rect = content?.getBoundingClientRect()
        setContentWidth(rect?.width || contentWidth);
    }, [size.width, isSidebarOverlayVisible,draftSettings,themeId,storeId,option,themeOptions])

    // --- Rendu ---
    if (isLoadingInitialData) return <div className="p-6 text-center text-gray-500">{t('common.loading')}</div>;
    if (fetchError) return <div className="p-6 text-center text-red-500">{fetchError}</div>;
    if (!themeOptions) return <PageNotFound title={t('themeEditor.error.optionsNotFound')} />;

    console.log(isSidebarOverlayVisible);

    return (
        <div className="w-full h-screen flex flex-col">
            <Topbar back={true} title={t('themeEditor.pageTitle', { name: themeOptions?.themeName ?? themeId })} />

            {/* Conteneur principal : Ajout de 'relative' pour positionner le bouton flottant par rapport à ce conteneur */}
            <div className="relative flex flex-row flex-grow overflow-hidden">

                {/* --- Backdrop pour fermer la sidebar overlay sur mobile --- */}
                {isSidebarOverlayVisible && (
                    <div
                        className="absolute inset-0 bg-black/30 z-30 lg:hidden"
                        onClick={toggleSidebarOverlay}
                        aria-hidden="true"
                    ></div>
                )}

                {/* --- Sidebar --- */}
                {/* Classes conditionnelles pour le responsive */}
                <aside className={`
                    transition-transform duration-300 ease-in-out
                    bg-white border-gray-200 overflow-y-auto
                    absolute inset-y-0 left-0 z-40 w-72 shadow-lg transform  /* Style Base Mobile (Overlay) */
                    ${isSidebarOverlayVisible ? 'translate-x-0' : '-translate-x-full'} /* Visibilité Mobile */
                    lg:relative lg:inset-auto lg:z-auto lg:w-80 
                    lg:translate-x-0 lg:shadow-none lg:flex-shrink-0 lg:border-r /* Overrides Desktop */
                `}>
                    {themeOptions && (
                        <EditorSidebar
                            initialOpen={option}
                            optionsStructure={themeOptions}
                            settings={draftSettings}
                            onSettingChange={handleSettingChange}
                            // Passer le mapping d'icônes défini plus haut
                            sectionIcons={sectionIcons}
                        />
                    )}
                    {/* Optionnel: Bouton fermer DANS la sidebar pour mobile */}
                    <button
                        onClick={toggleSidebarOverlay}
                        className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 lg:hidden"
                        aria-label={t('common.close')}
                    >
                        <FaTimes size={18} />
                    </button>
                </aside>

                {/* --- Preview (prend l'espace restant) --- */}
                <section className="flex-grow bg-gray-300/40 flex flex-col">
                    <LiveThemePreview
                        avalaibleWidth={contentWidth - (size.width >= 1024 ? 330 : 0)}
                        store={{ id: storeId } as any}
                        theme={{ id: themeId } as any}
                        settings={draftSettings}
                        isSaving={saveThemeSettingsMutation.isPending}
                        mode='edit'
                    />
                </section>

                {/* --- Bouton Flottant pour ouvrir/fermer la Sidebar sur Mobile --- */}
                {/* Visible seulement SOUS le breakpoint 'lg' */}
                {!isSidebarOverlayVisible && <button
                    type="button"
                    onClick={toggleSidebarOverlay}
                    className={`absolute top-2 cursor-pointer left-4 z-50 p-2 bg-gray-300 hover:bg-gray-400 text-white rounded-full shadow-md hover:shadow-xl lg:hidden hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition ${isSidebarOverlayVisible ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
                    aria-label={isSidebarOverlayVisible ? t('themeEditor.closeSidebar') : t('themeEditor.openSidebar')}
                    title={isSidebarOverlayVisible ? t('themeEditor.closeSidebar') : t('themeEditor.openSidebar')}
                >
                    <FaEdit size={20} /> {/* Ou une autre icône comme FaSlidersH */}
                </button>}

            </div>

        </div>
    );
}