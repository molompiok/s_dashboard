//renderer/Layout.tsx

export { Layout };

import './Layout.css'
import React, { useEffect, useState, useMemo } from 'react'; // Ajouter useState, useMemo
import logoUrl from './logo.png';
import { PageContextProvider, usePageContext } from './usePageContext';
import { Link } from './Link';
import type { PageContext } from 'vike/types';
import '../Lib/i18n'; // Garder pour initialisation i18n
// import { useApp } from './AppStore/UseApp'; // Remplacé par useChildViewer
// import { StoreCreate } from '../pages/StoreCreate/StoreCreate'; // Supposé non utilisé ici directement
import { ClientCall } from '../Components/Utils/functions';
import { useHashWatcher } from '../Hooks/useHashWatcher';
import { useGlobalStore } from '../api/stores/StoreStore'; // Gardé pour fetch initial store
import { useTranslation } from 'react-i18next'; // Pour traduction future
import { useChildViewer } from '../Components/ChildViewer/useChildViewer'; // Hook pour popup
import { IoHome, IoHomeOutline, IoStorefront, IoStorefrontOutline, IoPeople, IoPeopleOutline, IoDocumentText, IoDocumentTextOutline, IoCube, IoCubeOutline, IoLayers, IoLayersOutline } from 'react-icons/io5'; // Importer directement les icônes
import { Toaster } from 'react-hot-toast';
import { useMyLocation } from '../Hooks/useRepalceState';
import { useAuthStore } from '../api/stores/AuthStore';


function Layout({ children, pageContext }: { children: React.ReactNode; pageContext: PageContext }) {
  const { t } = useTranslation()
  const { nextPage } = useMyLocation()

  const { getToken, getUser, setUser } = useAuthStore();
  useEffect(() => {
    const token = getToken()
    const user = getUser()
    console.log({ user });

    if (!token) {
      nextPage('/auth/login') // ou replace pour ne pas garder la page dans l'historique
    } else {
      setUser(user);
    }
  }, []);

  // Si token absent, retourne null (le router va rediriger)
  const token = getToken()
  if (!token) {
    console.log('Error', token);

    // nextPage('/auth/login')
    // return <p>Loading ...</p>
  }


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
            <Link href="/commands" activeIcon={<IoDocumentText className='w-5 h-5' />} defaultIcon={<IoDocumentTextOutline className='w-5 h-5' />}>{t('navigation.orders')}</Link>
            <Link href="/users" activeIcon={<IoPeople className='w-5 h-5' />} defaultIcon={<IoPeopleOutline className='w-5 h-5' />}>{t('navigation.teams')}</Link>
            {/* Lien Inventaire ajouté */}
            {/* <Link href="/inventory" activeIcon={<IoHome className='w-5 h-5' />} defaultIcon={<IoHomeOutline className='w-5 h-5' />}>{t('navigation.inventory')}</Link> */}
            <Link href="/stores" add={['/themes']} activeIcon={<IoStorefront className='w-5 h-5' />} defaultIcon={<IoStorefrontOutline className='w-5 h-5' />}>{t('navigation.stores')}</Link>
            {/* Ajouter lien Settings, Stats etc. */}
          </Sidebar>

          {/* Contenu Principal */}
          <Content>{children}</Content>
          <Toaster
            position="top-right"
            reverseOrder={false}
            toastOptions={{
              className: '',
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                fontSize: '14px',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: 'green',
                  secondary: 'black',
                },
              },
              error: {
                duration: 5000,
              },
            }}
          />
        </Frame>

        {/* Bottombar: Affichée seulement sur mobile (inférieur à sm) */}
        <Bottombar>
          <Link href="/" activeIcon={<IoHome className='w-5 h-5' />} defaultIcon={<IoHomeOutline className='w-5 h-5' />} />
          <Link href="/products" activeIcon={<IoCube className='w-5 h-5' />} defaultIcon={<IoCubeOutline className='w-5 h-5' />} />
          <Link href="/commands" activeIcon={<IoDocumentText className='w-5 h-5' />} defaultIcon={<IoDocumentTextOutline className='w-5 h-5' />} />
          <Link href="/users" activeIcon={<IoPeople className='w-5 h-5' />} defaultIcon={<IoPeopleOutline className='w-5 h-5' />} />
          <Link href="/stores" activeIcon={<IoStorefront className='w-5 h-5' />} defaultIcon={<IoStorefrontOutline className='w-5 h-5' />} />
        </Bottombar>

        {/* <PageHelper /> */}
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
    if (location.hash !== "#openChild") {
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
      className="flex  bg-gray-100 w-full max-w-7xl mx-auto transition-filter duration-300" // Ajuster max-w
      style={{ filter: blur ? `blur(${blur}px)` : 'none' }}
    >
      {children}
    </div>
  );
}

// --- Composant Sidebar ---
function Sidebar({ children }: { children: React.ReactNode }) {

  const { urlPathname } = usePageContext()
  const openBar = !(
    urlPathname == '/' ||
    urlPathname.startsWith('/auth') ||
    urlPathname.startsWith('/profile') ||
    urlPathname.startsWith('/setting') ||
    urlPathname.startsWith('/themes')
  )
  return openBar && (
    <div
      id="sidebar"
      // Caché par défaut, visible à partir de sm
      // Largeur fixe w-20 entre sm et md, puis w-60 sur md+
      className="hidden sm:flex flex-col flex-shrink-0 w-20 md:w-48 h-screen top-0 // Rendre sticky
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
  const { urlPathname } = usePageContext()
  const openBar = !(
    urlPathname == '/' ||
    urlPathname.startsWith('/auth') ||
    urlPathname.startsWith('/profile') ||
    urlPathname.startsWith('/setting') ||
    urlPathname.startsWith('/themes')
  )
  console.log({ openBar, urlPathname });

  return openBar && (
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
  const { getCurrentStore } = useGlobalStore();

  // Fetch initial store (logique inchangée)
  useEffect(() => {
    getCurrentStore()
  }, [getCurrentStore]); // Ajouter dépendances

  return (
    // Prend tout l'espace restant, overflow-y pour scroll vertical
    <div
      id="page-container"
      className="flex-grow w-full max-h-screen overflow-x-hidden" // flex-grow pour prendre l'espace
    >
      {/* Conteneur interne pour padding, etc. */}
      <div id="page-content" className="w-full "> {/* Moins de padding bottom sur desktop */}
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