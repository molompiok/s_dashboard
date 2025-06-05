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
    FaPalette, FaFont, FaPaintBrush, FaThLarge, FaWindowMaximize, FaQuestionCircle, FaEdit, FaTimes, // Ajout FaEdit, FaTimes
    FaBullhorn,
    FaShoePrints,
    FaFilter,
    FaBoxOpen
} from 'react-icons/fa';
import { useWindowSize } from '../../../Hooks/useWindowSize';
import { debounce } from '../../../Components/Utils/functions';

export { Page };

// Types Placeholder (INCHANGÉ - gardé pour la référence)
export interface ThemeOptionDefinition { key: string; type: 'array-string' | 'color' | 'font' | 'text' | 'select' | 'toggle' | 'image'; labelKey: string; defaultValue?: any; options?: { value: string; labelKey: string }[]; section: string; descriptionKey?: string }
export interface ThemeOptionsStructure { themeId: string; themeName?: string; sections: { key: string; titleKey: string; order?: number }[]; options: ThemeOptionDefinition[]; }
export type ThemeSettingsValues = Record<string, any>;

// --- Mapping des icônes pour les sections ---
const sectionIcons: Record<string, React.ElementType> = {
    general: FaPaintBrush,
    announcementBar: FaBullhorn,
    header: FaWindowMaximize,
    footer: FaShoePrints,
    filterSide: FaFilter,
    productDisplay: FaBoxOpen,
    typography: FaFont,
    default: FaQuestionCircle
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
    const getThemeOptions = useCallback(async (id: string): Promise<ThemeOptionsStructure> => {
        return {
            themeId: id,
            themeName: "Thème Exemple Dynamique", // Nom mis à jour pour refléter les changements
            sections: [
                {
                    key: 'general',
                    titleKey: 'themeEditor.section.general',
                    order: 1
                },
                {
                    key: 'announcementBar',
                    titleKey: 'themeEditor.section.announcementBar',
                    order: 2
                },
                {
                    key: 'header',
                    titleKey: 'themeEditor.section.header',
                    order: 3
                },
                {
                    key: 'footer',
                    titleKey: 'themeEditor.section.footer',
                    order: 4
                },
                {
                    key: 'filterSide',
                    titleKey: 'themeEditor.section.filterSide', // Barre latérale de filtres
                    order: 5
                },
                {
                    key: 'productDisplay', // Options d'affichage des produits (cartes, listes)
                    titleKey: 'themeEditor.section.productDisplay',
                    order: 6
                },
                {
                    key: 'typography',
                    titleKey: 'themeEditor.section.typography',
                    order: 7
                },
                // Tu pourrais ajouter d'autres sections comme:
                // { key: 'productPage', titleKey: 'themeEditor.section.productPage', order: 8 }, // Pour la page de détail produit
                // { key: 'cartPage', titleKey: 'themeEditor.section.cartPage', order: 9 },
                // { key: 'checkoutPage', titleKey: 'themeEditor.section.checkoutPage', order: 10 },
            ],
            options: [
                // --- Section: General ---
                {
                    key: 'storeNameVisible',
                    type: 'toggle',
                    section: 'general',
                    labelKey: 'themeEditor.options.storeNameVisible',
                    defaultValue: true,
                    descriptionKey: 'themeEditor.options.storeNameVisibleDesc'
                },
                {
                    key: 'logoUrl',
                    type: 'image',
                    section: 'general',
                    labelKey: 'themeEditor.options.logoUrl',
                    defaultValue: '/res/logo-placeholder.svg',
                    descriptionKey: 'themeEditor.options.logoUrlDesc'
                },
                {
                    key: 'siteBackgroundColor', // Remplaçait l'ancien 'backgroundColor' global
                    type: 'color',
                    section: 'general',
                    labelKey: 'themeEditor.options.siteBackgroundColor',
                    defaultValue: '#FFFFFF',
                    descriptionKey: 'themeEditor.options.siteBackgroundColorDesc'
                },
                {
                    key: 'siteTextColor', // Remplaçait l'ancien 'textColor' global
                    type: 'color',
                    section: 'general',
                    labelKey: 'themeEditor.options.siteTextColor',
                    defaultValue: '#1F2937',
                    descriptionKey: 'themeEditor.options.siteTextColorDesc'
                },
                {
                    key: 'backgroundGradient', // Nouveau : pour le fond général du site
                    type: 'list', // Utilise le type 'list' comme dans ton exemple
                    section: 'general',
                    labelKey: 'themeEditor.options.backgroundGradient',
                    defaultValue: [], // Pas de gradient par défaut, ou ['#FFFFFF', '#F3F4F6'] si tu veux un défaut
                    descriptionKey: 'themeEditor.options.backgroundGradientDesc',
                    options: [ // Exemple d'options pour un sélecteur de gradient
                        { value: [], labelKey: 'themeEditor.gradient.none' }, // Permet de désactiver le gradient
                        { value: ['#FFFFFF', '#F3F4F6'], labelKey: 'themeEditor.gradient.lightGray' },
                        { value: ['#E0E7FF', '#C7D2FE'], labelKey: 'themeEditor.gradient.lightIndigo' },
                        { value: ['#FEE2E2', '#FECACA'], labelKey: 'themeEditor.gradient.lightRed' },
                    ]
                },

                // --- Section: Announcement Bar ---
                {
                    key: 'showAnnouncementBar',
                    type: 'toggle',
                    section: 'announcementBar',
                    labelKey: 'themeEditor.options.showAnnouncementBar',
                    defaultValue: true,
                    descriptionKey: 'themeEditor.options.showAnnouncementBarDesc'
                },
                {
                    key: 'announcementText',
                    type: 'text', // Un seul message texte pour commencer
                    section: 'announcementBar',
                    labelKey: 'themeEditor.options.announcementText',
                    defaultValue: 'Livraison gratuite dès 50€ d\'achat !',
                    descriptionKey: 'themeEditor.options.announcementTextDesc'
                },
                // Si tu veux une LISTE de textes défilants (plus complexe)
                {
                    key: 'announcementMessages',
                    type: 'array-string', // Tu devras créer ce type de contrôle
                    section: 'announcementBar',
                    labelKey: 'themeEditor.options.announcementMessages',
                    defaultValue: ['Bienvenue !', 'Promotions en cours...'],
                    descriptionKey: 'themeEditor.options.announcementMessagesDesc',
                    maxLength: 5
                },
                {
                    key: 'announcementTextColor',
                    type: 'color',
                    section: 'announcementBar',
                    labelKey: 'themeEditor.options.announcementTextColor',
                    defaultValue: '#ea1111',
                    descriptionKey: 'themeEditor.options.announcementTextColorDesc'
                },
                {
                    key: 'announcementBackgroundColor',
                    type: 'color',
                    section: 'announcementBar',
                    labelKey: 'themeEditor.options.announcementBackgroundColor',
                    defaultValue: '#2563EB', // Bleu par défaut
                    descriptionKey: 'themeEditor.options.announcementBackgroundColorDesc'
                },

                {
                    key: 'announcementBackgroundGradient', // Fond en dégradé pour la barre d'annonce
                    type: 'list',
                    section: 'announcementBar',
                    labelKey: 'themeEditor.options.announcementBackgroundGradient',
                    defaultValue: [], // Pas de gradient par défaut
                    descriptionKey: 'themeEditor.options.announcementBackgroundGradientDesc',
                    options: [
                        { value: [], labelKey: 'themeEditor.gradient.none' },
                        { value: ['#2563EB', '#1D4ED8'], labelKey: 'themeEditor.gradient.blue' },
                        { value: ['#F59E0B', '#D97706'], labelKey: 'themeEditor.gradient.amber' },
                        { value: ['#10B981', '#059669'], labelKey: 'themeEditor.gradient.emerald' },
                    ]
                },

                // --- Section: Header ---
                {
                    key: 'showHeader', // Conservé de l'original
                    type: 'toggle',
                    section: 'header',
                    labelKey: 'themeEditor.options.showHeader',
                    defaultValue: true,
                    descriptionKey: 'themeEditor.options.showHeaderDesc',
                },
                {
                    key: 'headerTextColor',
                    type: 'color',
                    section: 'header',
                    labelKey: 'themeEditor.options.headerTextColor',
                    defaultValue: '#1F2937', // Texte foncé par défaut
                    descriptionKey: 'themeEditor.options.headerTextColorDesc'
                },
                {
                    key: 'headerBackgroundColor', // Conservé de l'original, mais s'applique spécifiquement au header
                    type: 'color',
                    section: 'header',
                    labelKey: 'themeEditor.options.headerBackgroundColor',
                    defaultValue: '#FFFFFF', // Fond blanc par défaut
                    descriptionKey: 'themeEditor.options.headerBackgroundColorDesc' // Clé de description corrigée
                },
                // L'option 'headerAnnouncement' de l'original est maintenant gérée par 'announcementBar'
                // Tu pourrais ajouter des options pour le style des liens du header, la disposition, etc.

                // --- Section: Footer ---
                {
                    key: 'showFooter',
                    type: 'toggle',
                    section: 'footer',
                    labelKey: 'themeEditor.options.showFooter',
                    defaultValue: true,
                    descriptionKey: 'themeEditor.options.showFooterDesc'
                },
                {
                    key: 'footerTextColor',
                    type: 'color',
                    section: 'footer',
                    labelKey: 'themeEditor.options.footerTextColor',
                    defaultValue: '#6B7280', // Gris moyen pour le texte du footer
                    descriptionKey: 'themeEditor.options.footerTextColorDesc'
                },
                {
                    key: 'footerBackgroundColor',
                    type: 'color',
                    section: 'footer',
                    labelKey: 'themeEditor.options.footerBackgroundColor',
                    defaultValue: '#1F2937', // Fond sombre pour le footer
                    descriptionKey: 'themeEditor.options.footerBackgroundColorDesc'
                },
                {
                    key: 'footerFont',
                    type: 'font',
                    section: 'footer',
                    labelKey: 'themeEditor.options.footerFont',
                    defaultValue: 'Inter, sans-serif', // Police par défaut pour le footer
                    descriptionKey: 'themeEditor.options.footerFontDesc'
                },

                // --- Section: Filter Side (Barre latérale de filtres) ---
                {
                    key: 'showFilterSide',
                    type: 'toggle',
                    section: 'filterSide',
                    labelKey: 'themeEditor.options.showFilterSide',
                    defaultValue: true,
                    descriptionKey: 'themeEditor.options.showFilterSideDesc'
                },
                {
                    key: 'filterSideTextColor',
                    type: 'color',
                    section: 'filterSide',
                    labelKey: 'themeEditor.options.filterSideTextColor',
                    defaultValue: '#374151', // Texte un peu plus clair
                    descriptionKey: 'themeEditor.options.filterSideTextColorDesc'
                },
                {
                    key: 'filterSideBackgroundColor',
                    type: 'color',
                    section: 'filterSide',
                    labelKey: 'themeEditor.options.filterSideBackgroundColor',
                    defaultValue: '#F9FAFB', // Fond très clair
                    descriptionKey: 'themeEditor.options.filterSideBackgroundColorDesc'
                },
                {
                    key: 'filterSideLayout', // Disposition bento ou row
                    type: 'select',
                    section: 'filterSide',
                    labelKey: 'themeEditor.options.filterSideLayout',
                    defaultValue: 'row', // ou 'bento'
                    descriptionKey: 'themeEditor.options.filterSideLayoutDesc',
                    options: [
                        { value: 'row', labelKey: 'themeEditor.layoutOptions.row' },
                        { value: 'grid', labelKey: 'themeEditor.layoutOptions.grid' },
                        { value: 'bento', labelKey: 'themeEditor.layoutOptions.bento' },
                        { value: 'compact', labelKey: 'themeEditor.layoutOptions.compact' },
                        { value: 'horizontal-scroll', labelKey: 'themeEditor.layoutOptions.horizontalScroll' },
                        { value: 'card', labelKey: 'themeEditor.layoutOptions.card' },
                        { value: 'stacked-list', labelKey: 'themeEditor.layoutOptions.stackedList' },
                        { value: 'all', labelKey: 'themeEditor.layoutOptions.all' },
                    ]
                },

                // --- Section: Product Display (Cartes produit, listes, etc.) ---
                {
                    key: 'productCardTextColor',
                    type: 'color',
                    section: 'productDisplay',
                    labelKey: 'themeEditor.options.productCardTextColor',
                    defaultValue: '#1F2937',
                    descriptionKey: 'themeEditor.options.productCardTextColorDesc'
                },
                {
                    key: 'productAddToCartBorderColor',
                    type: 'color',
                    section: 'productDisplay',
                    labelKey: 'themeEditor.options.productAddToCartBorderColor',
                    defaultValue: '#1F2937',
                    descriptionKey: 'themeEditor.options.productAddToCartBorderColorDesc'
                },
                {
                    key: 'productAddToCartBackgroundColor',
                    type: 'color',
                    section: 'productDisplay',
                    labelKey: 'themeEditor.options.productAddToCartBackgroundColor',
                    defaultValue: '#1F2937',
                    descriptionKey: 'themeEditor.options.productAddToCartBackgroundColorDesc'
                },
                {
                    key: 'productAddToCartTextColor',
                    type: 'color',
                    section: 'productDisplay',
                    labelKey: 'themeEditor.options.productAddToCartTextColor',
                    defaultValue: '#1F2937',
                    descriptionKey: 'themeEditor.options.productAddToCartTextColorDesc'
                },
                {
                    key: 'productCardBackgroundColor',
                    type: 'color',
                    section: 'productDisplay',
                    labelKey: 'themeEditor.options.productCardBackgroundColor',
                    defaultValue: '#FFFFFF',
                    descriptionKey: 'themeEditor.options.productCardBackgroundColorDesc'
                },
                {
                    key: 'productPriceColor', // Couleur spécifique pour le prix
                    type: 'color',
                    section: 'productDisplay',
                    labelKey: 'themeEditor.options.productPriceColor',
                    defaultValue: '#2563EB', // Souvent une couleur d'accent
                    descriptionKey: 'themeEditor.options.productPriceColorDesc'
                },
                {
                    key: 'priceBeforeName',
                    type: 'toggle',
                    section: 'productDisplay',
                    labelKey: 'themeEditor.options.priceBeforeName',
                    defaultValue: false,
                    descriptionKey: 'themeEditor.options.priceBeforeNameDesc'
                },
                {
                    key: 'showRatingInList',
                    type: 'toggle',
                    section: 'productDisplay',
                    labelKey: 'themeEditor.options.showRatingInList',
                    defaultValue: true,
                    descriptionKey: 'themeEditor.options.showRatingInListDesc'
                },
                {
                    key: 'showRatingInProduct',
                    type: 'toggle',
                    section: 'productDisplay',
                    labelKey: 'themeEditor.options.showRatingInProduct',
                    defaultValue: true,
                    descriptionKey: 'themeEditor.options.showRatingInProductDesc'
                },
                {
                    key: 'reductionDisplay', // Affichage de la réduction
                    type: 'select',
                    section: 'productDisplay',
                    labelKey: 'themeEditor.options.reductionDisplay',
                    defaultValue: 'percent-reduction',
                    descriptionKey: 'themeEditor.options.reductionDisplayDesc',
                    options: [
                        { value: 'barred-price', labelKey: 'themeEditor.reductionOptions.barredPrice' },
                        { value: 'percent-reduction', labelKey: 'themeEditor.reductionOptions.percentReduction' },
                    ]
                },

                //where is favorite icon place in product display bottom-right , bottom-left , top-right , top-left
                {
                    key: 'favoriteIconPosition',
                    type: 'select',
                    section: 'productDisplay',
                    labelKey: 'themeEditor.options.favoriteIconPosition',
                    defaultValue: 'bottom-right',
                    descriptionKey: 'themeEditor.options.favoriteIconPositionDesc',
                    options: [
                        { value: 'bottom-right', labelKey: 'themeEditor.favoriteIconPositionOptions.bottomRight' },
                        { value: 'bottom-left', labelKey: 'themeEditor.favoriteIconPositionOptions.bottomLeft' },
                        { value: 'top-right', labelKey: 'themeEditor.favoriteIconPositionOptions.topRight' },
                        { value: 'top-left', labelKey: 'themeEditor.favoriteIconPositionOptions.topLeft' },
                    ]
                },
                //show info promotion
                {
                    key: 'showInfoPromotion',
                    type: 'toggle',
                    section: 'productDisplay',
                    labelKey: 'themeEditor.options.showInfoPromotion',
                    defaultValue: true,
                    descriptionKey: 'themeEditor.options.showInfoPromotionDesc',
                },
                //promotion Text eg: 20% de réduction
                {
                    key: 'promotionText',
                    type: 'text',
                    section: 'productDisplay',
                    labelKey: 'themeEditor.options.promotionText',
                    defaultValue: 'Promo',
                    descriptionKey: 'themeEditor.options.promotionTextDesc',
                },
                //promotion Text Color
                {
                    key: 'promotionTextColor',
                    type: 'color',
                    section: 'productDisplay',
                    labelKey: 'themeEditor.options.promotionTextColor',
                    defaultValue: '#1F2937',
                    descriptionKey: 'themeEditor.options.promotionTextColorDesc',
                },
                //promotion Text Background Color
                {
                    key: 'promotionTextBackgroundColor',
                    type: 'color',
                    section: 'productDisplay',
                    labelKey: 'themeEditor.options.promotionTextBackgroundColor',
                    defaultValue: '#1F2937',
                    descriptionKey: 'themeEditor.options.promotionTextBackgroundColorDesc',
                },
                //display position of promotion text
                {
                    key: 'promotionTextPosition',
                    type: 'select', 
                    section: 'productDisplay',
                    labelKey: 'themeEditor.options.promotionTextPosition',
                    defaultValue: 'top-left',
                    descriptionKey: 'themeEditor.options.promotionTextPositionDesc',
                    options: [
                        { value: 'top-left', labelKey: 'themeEditor.promotionTextPositionOptions.topLeft' },
                        { value: 'top-right', labelKey: 'themeEditor.promotionTextPositionOptions.topRight' },
                        { value: 'bottom-left', labelKey: 'themeEditor.promotionTextPositionOptions.bottomLeft' },
                        { value: 'bottom-right', labelKey: 'themeEditor.promotionTextPositionOptions.bottomRight' },
                    ]
                },
                {
                    key: 'productListView', // Déplacé de l'ancienne section 'layout'
                    type: 'select',
                    section: 'productDisplay', // Maintenant dans la section d'affichage des produits
                    labelKey: 'themeEditor.options.productListView',
                    defaultValue: 'grid',
                    descriptionKey: 'themeEditor.options.productListViewDesc',
                    // "row" | "grid" | "bento" | "compact" | "horizontal-scroll" | "card" | "stacked-list"
                    options: [
                        { value: 'grid', labelKey: 'themeEditor.layoutOptions.grid' },
                        { value: 'bento', labelKey: 'themeEditor.layoutOptions.bento' },
                        { value: 'row', labelKey: 'themeEditor.layoutOptions.row' },
                        { value: 'compact', labelKey: 'themeEditor.layoutOptions.compact' },
                        { value: 'horizontal-scroll', labelKey: 'themeEditor.layoutOptions.horizontalScroll' },
                        { value: 'card', labelKey: 'themeEditor.layoutOptions.card' },
                        { value: 'stacked-list', labelKey: 'themeEditor.layoutOptions.stackedList' },
                    ]
                },


                // --- Section: Typography (Conservée) ---
                {
                    key: 'bodyFont',
                    type: 'font',
                    section: 'typography',
                    labelKey: 'themeEditor.options.bodyFont',
                    defaultValue: 'Inter, sans-serif',
                    descriptionKey: 'themeEditor.options.bodyFontDesc'
                },
                {
                    key: 'headingFont',
                    type: 'font',
                    section: 'typography',
                    labelKey: 'themeEditor.options.headingFont',
                    defaultValue: 'Poppins, sans-serif',
                    descriptionKey: 'themeEditor.options.headingFontDesc'
                },
                {
                    key: 'baseFontSize',
                    type: 'select',
                    section: 'typography',
                    labelKey: 'themeEditor.options.baseFontSize',
                    defaultValue: '16px',
                    descriptionKey: 'themeEditor.options.baseFontSizeDesc',
                    options: [
                        { value: '14px', labelKey: 'themeEditor.fontSize.small' },
                        { value: '16px', labelKey: 'themeEditor.fontSize.medium' },
                        { value: '18px', labelKey: 'themeEditor.fontSize.large' },
                    ]
                },
            ] as ThemeOptionDefinition[] // Important: caster en ThemeOptionDefinition[]
        };
    }, []);

    const getThemeSettings = useCallback(async (sId: string, tId: string): Promise<ThemeSettingsValues> => { /* ... (votre logique inchangée) ... */ return { primaryColor: '#FF5733' }; }, []);
    const [saveThemeSettingsMutation, setS] = useState({
        isPending: false,
        mutate: (data: any, options: any) => {
            console.log("Saving settings:", data);
            setS({ ...saveThemeSettingsMutation, isPending: true });
            setTimeout(() => {
                if (Math.random() > 0.1) {
                    options.onSuccess?.(data.settings);
                    setS({ ...saveThemeSettingsMutation, isPending: false });
                } else {
                    options.onError?.(new ApiError("Save failed simulation", 500));
                }
            }, 1000);
        }
    })

    const size = useWindowSize()

    // --- Chargement Initial (INCHANGÉ) ---
    useEffect(() => {
        if (!storeId || !themeId) {
            setFetchError(t('themeEditor.error.missingParams'));
            setIsLoadingInitialData(false);
            return;
        }
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
        console.log({ key, value }, '⛔⛔⛔⛔⛔⛔');

        debounce(() => {
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
        }, 'theme-editor-save', 3000)
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
    }, [size.width, isSidebarOverlayVisible, draftSettings, themeId, storeId, option, themeOptions])

    // --- Rendu ---
    if (isLoadingInitialData) return <div className="p-6 text-center text-gray-500">{t('common.loading')}</div>;
    if (fetchError) return <div className="p-6 text-center text-red-500">{fetchError}</div>;
    if (!themeOptions) return <PageNotFound title={t('themeEditor.error.optionsNotFound')} />;

    console.log(isSidebarOverlayVisible);

    return (
        <div className="page-theme w-full h-screen flex flex-col">
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