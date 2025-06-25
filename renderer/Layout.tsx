//renderer/Layout.tsx
// vike-js project
export { Layout };

import './Layout.css'
import React, { useEffect, useState, useMemo } from 'react';
import logoUrl from './logo.png';
import { PageContextProvider, usePageContext } from './usePageContext';
import { Link, BottomBarLink } from './Link';
import type { PageContext } from 'vike/types';
import '../Lib/i18n';
import { ClientCall } from '../Components/Utils/functions';
import { useHashWatcher } from '../Hooks/useHashWatcher';
import { useGlobalStore } from '../api/stores/StoreStore';
import { useTranslation } from 'react-i18next';
import { useChildViewer } from '../Components/ChildViewer/useChildViewer';
import {
  IoHome, IoHomeOutline, IoStorefront, IoStorefrontOutline,
  IoPeople, IoPeopleOutline, IoDocumentText, IoDocumentTextOutline,
  IoBagHandle, IoBagHandleOutline, IoLayers, IoLayersOutline, IoBarChart,
  IoMoon, IoSunny, IoMenu, IoClose
} from 'react-icons/io5';
import { Toaster } from 'react-hot-toast';
import { useMyLocation } from '../Hooks/useRepalceState';
import { useAuthStore } from '../api/stores/AuthStore';
import { useAppZust } from './AppStore/appZust';
import { useGetMe } from '../api/ReactSublymusApi';

const urlHideSideBar = ['/auth', '/profile', '/setting', '/themes', '/settings']


function Layout({ children, pageContext }: { children: React.ReactNode; pageContext: PageContext }) {
  const { t } = useTranslation();
  const { nextPage } = useMyLocation();
  const { token, user, getToken, getUser, setUser } = useAuthStore();
  const { getCurrentStore } = useGlobalStore();
  const { sideLeft, setSideLeft } = useAppZust()
  const { data: userFetched, refetch } = useGetMe();
  useEffect(() => {
    getCurrentStore()
  }, [getCurrentStore]);

  useEffect(() => {
    const token = getToken();
    const user = getUser();

    if (!token) {
      if (window.location.pathname.startsWith('/auth')) return;
      nextPage('/auth/login');
    } else {
      setUser(user);
    }
  }, [token, user]);

  useEffect(() => {
    setUser({ ...(user || {}), ...(userFetched?.user || {}) });
  }, [userFetched]);

  const { themeMode, initDarkMode, setThemeMode } = useAppZust();

  // initDarkMode();

  useEffect(() => {
    // Fonction pour vérifier la préférence initiale du thème
    const checkTheme = () => {

      // const savedTheme = initDarkMode()

      // if (savedTheme === 'light' || savedTheme === 'dark') {
      //   document.documentElement.classList.add(savedTheme);
      //   document.body.classList.add(savedTheme);
      // } 
      // else
      {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
        document.body.classList.add(prefersDark ? 'dark' : 'light');
      }
    };

    // Vérifier le thème au montage du composant
    checkTheme();

    // Créer un listener pour les changements de thème
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e: any) => {
      setThemeMode(e.matches);
      e.matches ? document.body.classList.add('dark') : document.body.classList.remove('dark')
    };

    // Ajouter l'écouteur d'événements
    mediaQuery.addEventListener('change', handleThemeChange);

    // Nettoyer l'écouteur lors du démontage du composant
    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  // const toggleSidebar = () => {
  //   setSideLeft(!sideLeft);
  // };


  return (
    <React.StrictMode>
      <PageContextProvider pageContext={pageContext}>
        <Frame>
          {/* Mobile Header */}
          {/* <MobileHeader onToggleSidebar={toggleSidebar} isDark={isDark} onToggleDark={() => setIsDark(!isDark)} /> */}

          {/* Sidebar */}
          <Sidebar isOpen={sideLeft} onClose={() => setSideLeft(false)}>
            <Logo />
            <div className="flex-1 space-y-1 px-2 py-4">
              <Link href="/store" activeIcon={<IoHome className='w-5 h-5' />} defaultIcon={<IoHomeOutline className='w-5 h-5' />}>
                {t('navigation.home')}
              </Link>
              <Link href="/products" activeIcon={<IoBagHandle className='w-5 h-5' />} defaultIcon={<IoBagHandleOutline className='w-5 h-5' />}>
                {t('navigation.products')}
              </Link>
              <Link href="/categories" activeIcon={<IoLayers className='w-5 h-5' />} defaultIcon={<IoLayersOutline className='w-5 h-5' />}>
                {t('navigation.categories')}
              </Link>
              <Link href="/commands" activeIcon={<IoDocumentText className='w-5 h-5' />} defaultIcon={<IoDocumentTextOutline className='w-5 h-5' />}>
                {t('navigation.orders')}
              </Link>
              <Link href="/users" activeIcon={<IoPeople className='w-5 h-5' />} defaultIcon={<IoPeopleOutline className='w-5 h-5' />}>
                {t('navigation.teams')}
              </Link>
              <Link href="/stats" activeIcon={<IoBarChart className='w-5 h-5' />} defaultIcon={<IoBarChart className='w-5 h-5' />}>
                {t('navigation.stats')}
              </Link>
              <Link href="/" add={['/themes']} activeIcon={<IoStorefront className='w-5 h-5' />} defaultIcon={<IoStorefrontOutline className='w-5 h-5' />}>
                {t('navigation.stores')}
              </Link>
            </div>

            {/* Dark Mode Toggle Desktop */}
            <div className="hidden md:block px-4 py-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setThemeMode(themeMode == 'dark' ? 'light' : 'dark')}
                className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {themeMode ? <IoSunny className="w-5 h-5" /> : <IoMoon className="w-5 h-5" />}
                <span className="ml-3 hidden lg:inline">
                  {themeMode ? 'Mode Clair' : 'Mode Sombre'}
                </span>
              </button>
            </div>
          </Sidebar>

          {/* Main Content */}
          <Content>{children}</Content>

          <Toaster
            position="top-right"
            reverseOrder={false}
            toastOptions={{
              className: '',
              duration: 4000,
              style: {
                background: themeMode == 'dark' ? '#374151' : '#ffffff',
                color: themeMode == 'dark' ? '#ffffff' : '#374151',
                fontSize: '14px',
                border: themeMode == 'dark' ? '1px solid #4B5563' : '1px solid #E5E7EB',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#ffffff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#ffffff',
                },
              },
            }}
          />
        </Frame>

        {/* Bottom Navigation Mobile */}
        <Bottombar>
          <BottomBarLink href="/store" activeIcon={<IoHome className='w-5 h-5' />} defaultIcon={<IoHomeOutline className='w-5 h-5' />} />
          <BottomBarLink href="/products" add={['/categories']} activeIcon={<IoBagHandle className='w-5 h-5' />} defaultIcon={<IoBagHandleOutline className='w-5 h-5' />} />
          <BottomBarLink href="/commands" activeIcon={<IoDocumentText className='w-5 h-5' />} defaultIcon={<IoDocumentTextOutline className='w-5 h-5' />} />
          <BottomBarLink href="/users" activeIcon={<IoPeople className='w-5 h-5' />} defaultIcon={<IoPeopleOutline className='w-5 h-5' />} />
          <BottomBarLink href="/" activeIcon={<IoStorefront className='w-5 h-5' />} defaultIcon={<IoStorefrontOutline className='w-5 h-5' />} />
        </Bottombar>

        <OpenChild />
      </PageContextProvider>
    </React.StrictMode>
  );
}

// --- Mobile Header Component ---
function MobileHeader({ onToggleSidebar, isDark, onToggleDark }: {
  onToggleSidebar: () => void;
  isDark: boolean;
  onToggleDark: () => void;
}) {
  const { urlPathname } = usePageContext();
  const showHeader = !(
    urlPathname === '/' || urlHideSideBar.find((u) => urlPathname.startsWith(u))
  );

  if (!showHeader) return null;

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-full px-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <IoMenu className="w-6 h-6" />
        </button>

        <div className="flex items-center">
          <img src={logoUrl} height={32} width={32} alt="logo" className="h-8 w-8" />
          <span className="ml-2 text-lg font-bold text-gray-900 dark:text-white">Sublymus</span>
        </div>

        <button
          onClick={onToggleDark}
          className="p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {isDark ? <IoSunny className="w-5 h-5" /> : <IoMoon className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}

// --- OpenChild Component ---
function OpenChild() {
  const { currentChild, alignItems, background, className, justifyContent, openChild, blur } = useChildViewer();
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
        className={`absolute inset-0 ${className}`}
        style={{ background: background || (className.includes('bg-') ? undefined : 'rgba(0,0,0,0.4)') }} // Défaut si non fourni
        onClick={(e) => { if (e.currentTarget === e.target) openChild(null) }} // Fermer au clic sur fond
      ></div>
      {/* Contenu centré (ou aligné selon props) */}
      {/* Ajouter `relative` pour que le contenu soit au-dessus du fond */}
      <div className={`relative w-full h-full flex ${flexAlignment}`}>
        {/* Animer l'apparition du contenu */}
        <div onClick={(e) => { if (e.currentTarget === e.target) openChild(null) }}
          className={`flex items-stretch transition-transform  min-w-full h-full duration-300 ease-out ${currentChild && hash === '#openChild' ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          {currentChild}
        </div>
      </div>
    </div>
  );
}
// --- Frame Component ---
function Frame({ children }: { children: React.ReactNode }) {
  const { blur } = useChildViewer();

  return (
    <div className="frame overflow-hidden h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated Background Elements */}
      <div className="frame-background fixed inset-0 overflow-hidden pointer-events-none">
        {/* Primary Gradient Orb */}
        <div
          className="absolute -top-1/4 -left-1/4 w-96 h-96 rounded-full opacity-30 dark:opacity-20"
          style={{
            background: 'linear-gradient(45deg, #10B981, #059669)',
            filter: 'blur(80px)',
            animation: 'float 8s ease-in-out infinite',
          }}
        />

        {/* Secondary Gradient Orb */}
        <div
          className="absolute -bottom-1/4 -right-1/4 w-80 h-80 rounded-full opacity-25 dark:opacity-15"
          style={{
            background: 'linear-gradient(45deg, #3B82F6, #8B5CF6)',
            filter: 'blur(80px)',
            animation: 'float 12s ease-in-out infinite reverse',
            animationDelay: '2s',
          }}
        />

        {/* Tertiary Accent Orb */}
        <div
          className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full opacity-20 dark:opacity-10"
          style={{
            background: 'linear-gradient(45deg, #06B6D4, #10B981)',
            filter: 'blur(60px)',
            animation: 'float 16s ease-in-out infinite',
            animationDelay: '4s',
          }}
        />
      </div>
      <div
        className="frame-child flex w-full transition-all duration-300 relative min-h-screen"
        style={{ filter: blur ? `blur(${blur}px)` : 'none' }}
      >


        {children}
      </div>
    </div>
  );
}

// --- Sidebar Component ---
function Sidebar({ children, isOpen, onClose }: {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { urlPathname } = usePageContext();
  const showSidebar = !(
    urlPathname === '/' || urlHideSideBar.find((u) => urlPathname.includes(u))
  );

  if (!showSidebar) return null;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed md:static inset-y-0 left-0 z-50 md:z-auto
          flex flex-col flex-shrink-0 
          w-72 md:w-20 lg:w-64 h-screen
          bg-white/95 dark:bg-gray-900/95 backdrop-blur-md
          border-r border-gray-200 dark:border-gray-700
          shadow-xl md:shadow-none
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Mobile Close Button */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <img src={logoUrl} height={32} width={32} alt="logo" className="h-8 w-8" />
            <span className="ml-2 text-lg font-bold text-gray-900 dark:text-white">Sublymus</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <IoClose className="w-6 h-6" />
          </button>
        </div>

        {children}
      </div>
    </>
  );
}

// --- Bottombar Component ---
function Bottombar({ children }: { children: React.ReactNode }) {
  const { blur } = useChildViewer();
  const { urlPathname } = usePageContext();
  const showBottombar = !(
    urlPathname === '/' || urlHideSideBar.find((u) => urlPathname.includes(u))
  );

  if (!showBottombar) return null;

  return (
    <div
      className={`
        md:hidden fixed bottom-0 left-0 right-0 z-50 h-20
        bg-white/95 dark:bg-gray-900/95 backdrop-blur-md
        border-t border-gray-200 dark:border-gray-700
        flex items-center justify-around
        shadow-lg
        transition-all duration-300
        ${blur ? 'blur-sm' : ''}
      `}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        filter: blur ? `blur(${blur}px)` : 'none'
      }}
    >
      {children}
    </div>
  );
}

// --- Content Component ---
function Content({ children }: { children: React.ReactNode }) {
  const { urlPathname } = usePageContext();
  const hasSidebar = !(
    urlPathname === '/' || urlHideSideBar.find((u) => urlPathname.includes(u))
  );

  return (
    <div className={`
      flex-grow w-full h-screen overflow-x-hidden overflow-y-auto
      ${hasSidebar ? 'md:pt-0 pb-20 md:pb-0' : ''}
    `}>
      <div className="w-full h-full ">
        {children}
      </div>
    </div>
  );
}

// --- Logo Component ---
function Logo() {
  return (
    <div className="hidden md:flex items-center justify-center lg:justify-start p-4 border-b border-gray-200 dark:border-gray-700">
      <a href="/" className="flex items-center group">
        <div className="relative">
          <img
            src={logoUrl}
            height={40}
            width={40}
            alt="logo"
            className="h-10 w-10 rounded-lg shadow-md group-hover:shadow-lg transition-shadow"
          />
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-emerald-400/20 to-blue-500/20 group-hover:opacity-100 opacity-0 transition-opacity" />
        </div>
        <div className="hidden lg:block ml-3">
          <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent">
            Sublymus
          </span>
          <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">Dashboard</p>
        </div>
      </a>
    </div>
  );
}