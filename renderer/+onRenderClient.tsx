// renderer/+onRenderClient.tsx
import ReactDOM from 'react-dom/client';
import { Layout } from './Layout';
import { getPageTitle } from './getPageTitle';
import type { OnRenderClientAsync } from 'vike/types';
import i18n from '../Lib/i18n'; // ✅ Importer l'instance i18n client configurée
import { I18nextProvider } from 'react-i18next'; // ✅ Importer le Provider

let root: ReactDOM.Root;

// Fonction d'initialisation i18next client (appelée une seule fois)
let i18nInitialized = false;
async function initializeI18nClient() {
    if (i18nInitialized) return;

    // Hydrater avec les données du serveur si disponibles
    const initialStore = (window as any).__INITIAL_I18N_STORE__;
    const initialLanguage = (window as any).__INITIAL_LANGUAGE__;

    if (initialStore && initialLanguage) {
        console.log('[i18n Client] Hydrating with SSR data for language:', initialLanguage);
        // Ajouter les ressources initiales AVANT init
        i18n.addResourceBundle(initialLanguage, 'translation', initialStore[initialLanguage].translation, true, true);
         await i18n.init({ // Ou juste i18n.changeLanguage(initialLanguage) si init déjà fait ?
            lng: initialLanguage, // Utiliser la langue du serveur
            // Les autres options sont déjà dans i18n.ts
         });
    } else {
        // Si pas de données SSR (ex: navigation client pure), laisser i18next détecter
        console.log('[i18n Client] No SSR data found, initializing...');
        await i18n.init(); // Laisse le détecteur choisir
    }
    i18nInitialized = true;
}


const onRenderClient: OnRenderClientAsync = async (pageContext): ReturnType<OnRenderClientAsync> => {
    const { Page } = pageContext;

    if (!Page) throw new Error('My onRenderClient() hook expects pageContext.Page to be defined');

    // Initialiser i18next si ce n'est pas déjà fait
    await initializeI18nClient();

    const container = document.getElementById('root');
    if (!container) throw new Error('DOM element #root not found');

    const page = (
         // ✅ Envelopper avec le Provider côté client aussi
        <I18nextProvider i18n={i18n}>
            <Layout pageContext={pageContext}>
                <Page />
            </Layout>
        </I18nextProvider>
    );

    if (pageContext.isHydration) {
        // Hydrater le rendu serveur
        root = ReactDOM.hydrateRoot(container, page);
    } else {
        // Rendu client standard (si navigation client)
        if (!root) {
            root = ReactDOM.createRoot(container);
        }
        root.render(page);
    }
    document.title = getPageTitle(pageContext);
};