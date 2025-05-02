// pages/themes/preview/+Page.tsx
// Page autonome chargée dans une iframe pour la preview et l'éditeur de thème

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { usePageContext } from '../../../renderer/usePageContext'; // Pour lire les params d'URL initiaux
import { useTranslation } from 'react-i18next';
import { IoCartOutline, IoSearchOutline, IoPersonCircleOutline, IoMenu } from 'react-icons/io5';
import logoPlaceholder from './logo-placeholder.svg'; // Placeholder SVG
import productPlaceholder from './product-placeholder.png'; // Placeholder PNG
import logger from '../../../api/Logger'; // Logger

// --- Types ---
// Interface pour les paramètres de thème reçus (via URL ou postMessage)
interface ThemeSettings {
    primaryColor?: string;
    secondaryColor?: string;
    bodyFont?: string;
    headingFont?: string;
    layoutType?: 'grid' | 'list';
    showHeader?: boolean;
    showFooter?: boolean;
    // Ajouter toutes les autres options de personnalisation possibles ici
    // Exemple:
    // bannerImage?: string;
    // bannerText?: string;
    // productsPerPage?: number;
    // showCategoriesInHeader?: boolean;
}

// Type pour les messages postMessage
interface PostMessageData {
    type: 'UPDATE_THEME_SETTINGS' | 'GET_CURRENT_SETTINGS'; // Ajouter d'autres types si besoin
    payload?: any;
}

// --- Valeurs par Défaut ---
const DEFAULT_SETTINGS: ThemeSettings = {
    primaryColor: '#3B82F6', // Default blue-600
    secondaryColor: '#6B7280', // Default gray-500
    bodyFont: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
    headingFont: 'Poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"', // Exemple Poppins
    layoutType: 'grid',
    showHeader: true,
    showFooter: true,
};

// --- Fonction pour parser les paramètres (simple pour S0) ---
const parseThemeSettingsFromQuery = (searchParams: URLSearchParams): Partial<ThemeSettings> => {
    const settings: Partial<ThemeSettings> = {};
    // Exemple: Lire primaryColor depuis l'URL (préfixer avec 'setting_')
    const primaryColor = searchParams.get('setting_primaryColor');
    if (primaryColor) settings.primaryColor = `#${primaryColor}`; // Assumer format hex sans #

    const bodyFont = searchParams.get('setting_bodyFont');
    if (bodyFont) settings.bodyFont = decodeURIComponent(bodyFont);

    // Ajouter le parsing pour les autres paramètres d'URL...
    return settings;
};

// --- Composant Page ---
export function Page() {
    const { t, i18n } = useTranslation(); // i18n pour formater les dates si besoin
    const { urlParsed } = usePageContext();

    // État pour les settings appliqués à la preview
    const [settings, setSettings] = useState<ThemeSettings>(DEFAULT_SETTINGS);
    // État pour savoir si la page est prête à recevoir des postMessages
    const [isReadyForMessages, setIsReadyForMessages] = useState(false);

    // --- Initialisation et Écoute PostMessage ---
    useEffect(() => {
        // 1. Parser les settings initiaux depuis l'URL (si présents)
        const initialSettingsFromQuery = parseThemeSettingsFromQuery(new URLSearchParams(urlParsed.search));
        setSettings(prev => ({ ...DEFAULT_SETTINGS, ...prev, ...initialSettingsFromQuery })); // Fusionner avec défauts

        // 2. Mettre en place l'écouteur postMessage
        const handleMessage = (event: MessageEvent<PostMessageData>) => {
            // TODO: Vérifier event.origin pour la sécurité !
            // if (event.origin !== 'URL_DU_DASHBOARD') return;

            const { type, payload } = event.data;

            if (type === 'UPDATE_THEME_SETTINGS' && payload) {
                logger.debug("Received settings update via postMessage", payload);
                // Mettre à jour l'état local avec les nouvelles valeurs reçues
                setSettings(prev => ({ ...prev, ...payload }));
            } else if (type === 'GET_CURRENT_SETTINGS') {
                // Renvoyer les settings actuels si demandés par le parent
                event.source?.postMessage({ type: 'CURRENT_SETTINGS', payload: settings }, event.origin as any);
            }
        };

        window.addEventListener('message', handleMessage);
        logger.debug("Preview page ready and listening for postMessages.");
        setIsReadyForMessages(true); // Marquer comme prêt

        // 3. Informer le parent que l'iframe est prête (optionnel)
        window.parent.postMessage({ type: 'PREVIEW_IFRAME_READY' }, '*'); // Envoyer au parent

        // Nettoyage de l'écouteur
        return () => {
            window.removeEventListener('message', handleMessage);
            setIsReadyForMessages(false);
        };
    }, [urlParsed.search]); // Relire l'URL si elle change (peu probable dans iframe fixe)


    // --- Application dynamique des styles ---
    const bodyStyle: React.CSSProperties = useMemo(() => ({
        fontFamily: settings.bodyFont ?? DEFAULT_SETTINGS.bodyFont,
        // Appliquer d'autres styles globaux si nécessaire
        // '--theme-primary-color': settings.primaryColor, // Exemple variable CSS
    }), [settings.bodyFont]);

    const primaryColorStyle = useMemo(() => ({
        color: settings.primaryColor ?? DEFAULT_SETTINGS.primaryColor,
    }), [settings.primaryColor]);

    const primaryBackgroundStyle = useMemo(() => ({
        backgroundColor: settings.primaryColor ?? DEFAULT_SETTINGS.primaryColor,
    }), [settings.primaryColor]);

    const headingStyle: React.CSSProperties = useMemo(() => ({
        fontFamily: settings.headingFont ?? DEFAULT_SETTINGS.headingFont,
    }), [settings.headingFont]);


    // --- Données Placeholder (inchangées) ---
    const storeName = urlParsed.search?.storeName || t('themePreview.defaultStoreName');
    const categories = useMemo(() => [
        { id: '1', name: t('themePreview.category1') }, { id: '2', name: t('themePreview.category2') },
        { id: '3', name: t('themePreview.category3') }, { id: '4', name: t('themePreview.category4') },
    ], [t]);
    const products = useMemo(() => Array.from({ length: 8 }).map((_, i) => ({
        id: `prod-${i}`, name: `${t('themePreview.productName')} ${i + 1}`,
        price: Math.floor(Math.random() * 10000) + 5000, currency: 'FCFA',
        imageUrl: productPlaceholder, description: t('themePreview.productDescription'),
    })), [t]);


    // --- Rendu ---
    // Utiliser `settings` pour conditionner l'affichage et appliquer les styles
    return (
        // Ajouter une classe pour identifier la page preview si besoin
        <div className="theme-preview-page font-sans antialiased" style={bodyStyle}> {/* Appliquer la police body */}

            {/* Header */}
            {/* Header (Conditionnel) */}
            {settings.showHeader && (
                <header className="sticky top-0 z-20 bg-white shadow-sm">
                    <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            {/* Logo & Nom */}
                            <div className="flex-shrink-0 flex items-center gap-2">
                                <img className="h-8 w-auto" src={logoPlaceholder} alt="Logo" />
                                <span className="font-bold text-lg text-gray-800">{storeName}</span>
                            </div>
                            {/* Navigation (Placeholder) */}
                            <div className="hidden sm:flex sm:space-x-6">
                                {categories.slice(0, 4).map(cat => (
                                    <a key={cat.id} href="#" className="text-sm font-medium text-gray-500 hover:text-gray-900">{cat.name}</a>
                                ))}
                            </div>
                            {/* Icônes Droite */}
                            <div className="flex items-center gap-3">
                                <button className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"><IoSearchOutline size={20} /></button>
                                <button className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 relative">
                                    <IoCartOutline size={22} />
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">3</span>
                                </button>
                                <button className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"><IoPersonCircleOutline size={24} /></button>
                                {/* Menu Mobile */}
                                <button className="sm:hidden p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"><IoMenu size={24} /></button>
                            </div>
                        </div>
                    </nav>
                </header>
            )}

            {/* Contenu Principal */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Bannière Héro */}
                <div style={{
                    backgroundImage: `linear-gradient(to right, ${settings.secondaryColor}50, ${settings.secondaryColor}20)`,
                }}
                    className={` rounded-lg p-8 md:p-12 mb-8 flex items-center`}>
                    <div className='w-2/3'>
                        {/* Appliquer police et couleur heading */}
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2" style={{ ...headingStyle, ...primaryColorStyle }}>{t('themePreview.heroTitle')}</h1>
                        <p className="text-base md:text-lg text-gray-600">{t('themePreview.heroSubtitle')}</p>
                        {/* Appliquer couleur primaire au bouton */}
                        <button style={{
                            backgroundImage: `linear-gradient(to right, ${settings.primaryColor}80, ${settings.primaryColor}80)`,
                        }} className="mt-4 px-5 py-2 rounded-md text-white font-medium shadow hover:opacity-90">{t('themePreview.heroButton')}</button>
                    </div>
                </div>

                {/* Section Catégories */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('themePreview.categoriesTitle')}</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {categories.map(cat => (
                            <a key={cat.id} href="#" className="block group aspect-video rounded-lg overflow-hidden relative shadow hover:shadow-md transition bg-gray-200">
                                {/* Placeholder image catégorie */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                <span className="absolute bottom-2 left-2 text-sm font-medium text-white">{cat.name}</span>
                            </a>
                        ))}
                    </div>
                </section>

                {/* Section Produits */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4" style={headingStyle}>{t('themePreview.productsTitle')}</h2>
                    <div className={`grid gap-4 ${settings.layoutType === 'list' ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
                        {products.map(product => (
                            // Product Card Placeholder
                            <a key={product.id} href="#" className={`block group rounded-lg overflow-hidden shadow border border-gray-100 ${settings.layoutType === 'list' ? 'flex gap-4 p-3 items-center' : ''}`}>
                                <div style={{background:`${settings.secondaryColor}10`}} className={` ${settings.layoutType === 'list' ? 'w-20 h-20 flex-shrink-0 rounded' : 'w-full aspect-square'}`}>
                                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                </div>
                                <div className={settings.layoutType === 'list' ? 'flex-grow' : 'p-3'}>
                                    <h3 className={`font-medium text-sm truncate ${settings.layoutType === 'list' ? 'text-gray-800' : 'text-gray-700'}`} style={headingStyle}>{product.name}</h3>
                                    <p className={`font-semibold mt-1 ${settings.layoutType === 'list' ? 'text-base' : 'text-sm'}`} style={primaryColorStyle}>{product.price.toLocaleString()} {product.currency}</p>
                                </div>
                            </a>
                        ))}
                    </div>
                </section>
            </main>

            {/* Footer */}
            {settings.showFooter && (
                <footer className="bg-gray-800 text-gray-400 text-sm mt-12 py-8">
                    <footer className="bg-gray-800 text-gray-400 text-sm mt-12 py-8">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                            <div>
                                <h4 className="font-semibold text-gray-200 mb-2">{storeName}</h4>
                                <p className="text-xs">{t('themePreview.footerAbout')}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-200 mb-2">{t('themePreview.footerLinks')}</h4>
                                <ul className="space-y-1 text-xs">
                                    <li><a href="#" className="hover:text-white">Accueil</a></li>
                                    <li><a href="#" className="hover:text-white">Produits</a></li>
                                    <li><a href="#" className="hover:text-white">Contact</a></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-200 mb-2">{t('themePreview.footerContact')}</h4>
                                <address className="text-xs not-italic space-y-1">
                                    <p>123 Rue Sublymus</p>
                                    <p>Abidjan, Côte d'Ivoire</p>
                                    <p>info@maboutique.com</p>
                                </address>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-200 mb-2">{t('themePreview.footerSocial')}</h4>
                                {/* Ajouter icônes sociales */}
                            </div>
                        </div>
                        <div className="text-center text-xs text-gray-500 mt-8 pt-4 border-t border-gray-700">
                            © {new Date().getFullYear()} {storeName}. {t('themePreview.footerRights')}
                        </div>
                    </footer>
                </footer>
            )}
        </div>
    );
}