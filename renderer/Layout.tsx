// import './Layout.css'

export { Layout };

import React, { useEffect, useState, useMemo } from 'react'; // Ajouter useState, useMemo
import logoUrl from './logo.svg';
import { PageContextProvider } from './usePageContext';
import { Link } from './Link';
import type { PageContext } from 'vike/types';
import '../Lib/i18n'; // Garder pour initialisation i18n
// import { useApp } from './AppStore/UseApp'; // Remplacé par useChildViewer
// import { StoreCreate } from '../pages/StoreCreate/StoreCreate'; // Supposé non utilisé ici directement
import { ClientCall } from '../Components/Utils/functions';
import { useHashWatcher } from '../Hooks/useHashWatcher';
import { useGlobalStore } from '../pages/stores/StoreStore'; // Gardé pour fetch initial store
import { useTranslation } from 'react-i18next'; // Pour traduction future
import { useChildViewer } from '../Components/ChildViewer/useChildViewer'; // Hook pour popup
import { IoHome, IoHomeOutline, IoStorefront, IoStorefrontOutline, IoPeople, IoPeopleOutline, IoDocumentText, IoDocumentTextOutline, IoCube, IoCubeOutline, IoLayers, IoLayersOutline } from 'react-icons/io5'; // Importer directement les icônes


// --- Styles Globaux (Peuvent aller dans index.css ou être appliqués au body via un composant global) ---
// Ces styles doivent être appliqués une seule fois au niveau racine si possible.
// Ex: dans main.tsx ou un composant RootLayout
/*
body {
  @apply bg-background text-discret-0 font-sans text-base antialiased overflow-hidden;
}
* {
  @apply p-0 m-0 box-border;
}
*/

// --- Variables CSS (à définir dans globals.css ou tailwind.config.js) ---
/*
:root {
  --background: #f8f9fa; // Exemple
  --discret-0: #1f2937; // Exemple text-gray-800
  --discret-1: #6b7280; // Exemple text-gray-500
  --primary-color: #ff9800; // Exemple orange-500
  --primary-color-rgb: 255, 152, 0; // Exemple
  // etc.
  --side-bar-width-min: 80px; // w-20
  --side-bar-width-max: 240px; // w-60
}
*/

function Layout({ children, pageContext }: { children: React.ReactNode; pageContext: PageContext }) {
  const { t } = useTranslation()
  return (
    <React.StrictMode>
      <PageContextProvider pageContext={pageContext}>
        {/* Frame Principal: flex, centré, largeur max */}
        <Frame>
          {/* Sidebar: Cachée sur mobile (inférieur à sm), largeur variable sur desktop */}
          <Sidebar>
            <Logo />
            {/* Liens de Navigation Sidebar */}
            {/* Utiliser directement les icônes importées */}
            <Link href="/" activeIcon={<IoHome className='w-5 h-5' />} defaultIcon={<IoHomeOutline className='w-5 h-5' />}>{t('navigation.home')}</Link>
            <Link href="/products" activeIcon={<IoCube className='w-5 h-5' />} defaultIcon={<IoCubeOutline className='w-5 h-5' />}>{t('navigation.products')}</Link>
            {/* Lien Catégories ajouté */}
            <Link href="/categories" activeIcon={<IoLayers className='w-5 h-5' />} defaultIcon={<IoLayersOutline className='w-5 h-5' />}>{t('navigation.categories')}</Link>
            <Link href="/users" activeIcon={<IoPeople className='w-5 h-5' />} defaultIcon={<IoPeopleOutline className='w-5 h-5' />}>{t('navigation.teams')}</Link>
            <Link href="/commands" activeIcon={<IoDocumentText className='w-5 h-5' />} defaultIcon={<IoDocumentTextOutline className='w-5 h-5' />}>{t('navigation.orders')}</Link>
            {/* Lien Inventaire ajouté */}
            <Link href="/inventory" activeIcon={<IoHome className='w-5 h-5' />} defaultIcon={<IoHomeOutline className='w-5 h-5' />}>{t('navigation.inventory')}</Link>
            <Link href="/stores" activeIcon={<IoStorefront className='w-5 h-5' />} defaultIcon={<IoStorefrontOutline className='w-5 h-5' />}>{t('navigation.stores')}</Link>
            {/* Ajouter lien Settings, Stats etc. */}
          </Sidebar>

          {/* Contenu Principal */}
          <Content>{children}</Content>

        </Frame>

        {/* Bottombar: Affichée seulement sur mobile (inférieur à sm) */}
        <Bottombar>
          <Link href="/" activeIcon={<IoHome className='w-5 h-5' />} defaultIcon={<IoHomeOutline className='w-5 h-5' />} />
          <Link href="/products" activeIcon={<IoCube className='w-5 h-5' />} defaultIcon={<IoCubeOutline className='w-5 h-5' />} />
          {/* Ajouter icône Commandes? */}
          <Link href="/commands" activeIcon={<IoDocumentText className='w-5 h-5' />} defaultIcon={<IoDocumentTextOutline className='w-5 h-5' />} />
          <Link href="/stores" activeIcon={<IoStorefront className='w-5 h-5' />} defaultIcon={<IoStorefrontOutline className='w-5 h-5' />} />
          <Link href="/users" activeIcon={<IoPeople className='w-5 h-5' />} defaultIcon={<IoPeopleOutline className='w-5 h-5' />} />
        </Bottombar>

        {/* Popup Global */}
        <OpenChild />
      </PageContextProvider>
    </React.StrictMode>
  );
}

// --- Composant OpenChild (Popup/Modal Global) ---
function OpenChild() {
  const { currentChild, alignItems, background, justifyContent, openChild, blur } = useChildViewer();
  const hash = useHashWatcher();

  // Logique useEffect inchangée
  useEffect(() => { 
    if (!currentChild && location.hash === "#openChild") {
      ClientCall(() => {
        // history.replaceState(null, "", location.pathname);
        history.back()
        openChild(null)
      });
    }
    if(location.hash !== "#openChild") {
      openChild(null)
    }
   }, [currentChild, hash]);

  // Conversion align/justify en classes Tailwind
  const flexAlignment = useMemo(() => {
    const items = alignItems === 'start' ? 'items-start' : alignItems === 'end' ? 'items-end' : 'items-center';
    const justify = justifyContent === 'left' ? 'justify-start' : justifyContent === 'right' ? 'justify-end' : justifyContent === 'space-between' ? 'justify-between' : 'justify-center';
    return `${items} ${justify}`;
  }, [alignItems, justifyContent]);


  // Rendu conditionnel Tailwind
  return (
    <div
      className={`fixed inset-0 z-[9999] flex transition-opacity duration-300 ${currentChild && hash === '#openChild' ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
    // Appliquer le flou via une classe dédiée si background transparent, sinon background le couvre
    // style={{ backdropFilter: blur ? `blur(${blur}px)` : 'none' }} // Appliquer backdrop-filter
    >
      {/* Fond semi-transparent */}
      <div
        className="absolute inset-0"
        style={{ background: background || 'rgba(0,0,0,0.4)' }} // Défaut si non fourni
        onClick={(e) => { if (e.currentTarget === e.target) openChild(null) }} // Fermer au clic sur fond
      ></div>
      {/* Contenu centré (ou aligné selon props) */}
      {/* Ajouter `relative` pour que le contenu soit au-dessus du fond */}
      <div className={`relative w-full h-full flex ${flexAlignment}`}>
        {/* Animer l'apparition du contenu */}
        <div className={`transition-transform  w-full h-full duration-300 ease-out ${currentChild && hash === '#openChild' ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          {currentChild}
        </div>
      </div>
    </div>
  );
}

// --- Composant Frame ---
function Frame({ children }: { children: React.ReactNode }) {
  const { blur } = useChildViewer();
  // Utiliser flex, max-w-6xl (ou 7xl), mx-auto
  // Appliquer le filtre blur ici
  return (
    <div
      className="flex w-full max-w-7xl mx-auto transition-filter duration-300" // Ajuster max-w
      style={{ filter: blur ? `blur(${blur}px)` : 'none' }}
    >
      {children}
    </div>
  );
}

// --- Composant Sidebar ---
function Sidebar({ children }: { children: React.ReactNode }) {
  // Utiliser hidden sm:flex, flex-col, w-20 md:w-60 (largeurs min/max), etc.
  return (
    <div
      id="sidebar"
      // Caché par défaut, visible à partir de sm
      // Largeur fixe w-20 entre sm et md, puis w-60 sur md+
      className="hidden sm:flex flex-col flex-shrink-0 w-20 md:w-48 h-screen sticky top-0 // Rendre sticky
                 px-4 py-5 // Padding
                 border-r border-gray-200 // Bordure
                 bg-white // Fond blanc
                 transition-width duration-200 ease-in-out // Transition largeur"
    >
      {children}
    </div>
  );
}

// --- Composant Bottombar ---
function Bottombar({ children }: { children: React.ReactNode }) {
  const { blur } = useChildViewer();
  // Affiché seulement sur mobile (inférieur à sm), fixe en bas
  return (
    <div
      id="bottombar"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-50 h-16 // Hauteur fixe
                 bg-white border-t border-gray-200 // Fond et bordure
                 flex items-center justify-around // Distribution des icônes
                 transition-filter duration-300"
      style={{ filter: blur ? `blur(10px)` : 'none' }} // Appliquer flou
    >
      {children}
    </div>
  );
}


// --- Composant Content ---
function Content({ children }: { children: React.ReactNode }) {
  const {getCurrentStore } = useGlobalStore();

  // Fetch initial store (logique inchangée)
  useEffect(() => {
    getCurrentStore()
  }, [getCurrentStore]); // Ajouter dépendances

  return (
    // Prend tout l'espace restant, overflow-y pour scroll vertical
    <div
      id="page-container"
      className="flex-grow w-full max-h-screen overflow-y-auto overflow-x-hidden" // flex-grow pour prendre l'espace
    >
      {/* Conteneur interne pour padding, etc. */}
      <div id="page-content" className="w-full pb-24 sm:pb-8"> {/* Moins de padding bottom sur desktop */}
        {/* <div className="corrige-le-bug-content-overflow-x" style={{ width: '1200px' }}></div> // Supprimer ce hack */}
        {children}
      </div>
    </div>
  );
}

// --- Composant Logo ---
function Logo() {
  return (
    // Ajouter padding et centrage pour la version sidebar réduite
    <div className="pt-5 pb-2.5 mb-2.5 flex justify-center md:justify-start"> {/* Ajuster padding/margin */}
      <a href="/" className="inline-block"> {/* Rendre cliquable */}
        <img src={logoUrl} height={48} width={48} alt="logo" className="h-12 w-12" /> {/* Taille fixe? */}
      </a>
    </div>
  );
}