// Components/TopBar/TopBar.tsx

import { useEffect, useState } from 'react';
import { ChildViewer } from '../ChildViewer/ChildViewer';
import { TopSearch } from '../TopSearch/TopSearch';
import { IoSearch, IoNotifications, IoChevronBack, IoChevronForward } from "react-icons/io5";
import { useChildViewer } from '../ChildViewer/useChildViewer';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../pages/auth/AuthStore';
import { Host } from '../../renderer/+config';
import { getImg } from '../Utils/StringFormater'; // ✅ Importer getImg
import { useGetAllOrders, useGetMe } from '../../api/ReactSublymusApi';
import { useGlobalStore } from '../../pages/index/StoreStore';

export { Topbar };

export interface BreadcrumbItem {
    name: string;
    url?: string;
}

interface TopbarProps {
    back?: boolean;
    search?: boolean;
    notif?: boolean;
    onBack?: () => void;
    title?: string;
    breadcrumbs?: BreadcrumbItem[];
}

function Topbar({
    back = false,
    search = true,
    notif = true, // On garde la prop, même si l'affichage est commenté
    onBack,
    title,
    breadcrumbs = []
}: TopbarProps) {
    const { t } = useTranslation();
    const { currentStore } = useGlobalStore()
    const { openChild } = useChildViewer();
    const { data } = useGetMe({ enabled: !!currentStore?.id })
    const user = data?.user

    // --- Préparer les infos utilisateur pour l'avatar ---
    const userPhotoUrl = user?.photo?.[0]; // Prend la première photo
    const userInitials = user?.full_name?.slice(0, 2).toUpperCase() || '?'; // Initiales ou '?'
    const avatarImageUrl = userPhotoUrl ? getImg(userPhotoUrl, undefined, currentStore?.url).match(/url\("?([^"]+)"?\)/)?.[1] : undefined; // Obtenir l'URL avec getImg
    const displayName = user?.full_name;

    // --- (Logique existante inchangée) ---
    const displayTitle = breadcrumbs.length === 0 ? (title || t('topbar.welcomeMessage', { name: user?.full_name?.split(' ')[0] || 'Admin' })) : null;

    const handleBackClick = () => {
        // ... (logique handleBackClick inchangée)
        if (onBack) {
            onBack();
        } else {
            if (typeof window !== 'undefined' && window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = '/';
            }
        }
    };

    const handleSearchClick = () => {
        // ... (logique handleSearchClick inchangée)
        openChild(
            <ChildViewer title={t('topbar.globalSearchTitle')}>
                <TopSearch
                    onCategorySelected={(c) => { window.location.href = `${Host}/categories/${c.id}`; }}
                    onClientSelected={(c) => { window.location.href = `${Host}/users/clients/${c.id}`; }}
                    onCommandSelected={(c) => { window.location.href = `${Host}/commands/${c.id}`; }}
                    onProductSelected={(c) => { window.location.href = `${Host}/products/${c.id}`; }}
                />
            </ChildViewer>,
            { background: 'rgba(51, 51, 68, 0.8)', blur: 3 }
        );
    };

    return (
        <div className='top-bar sticky top-0 z-40 flex items-center h-16 px-4 sm:px-6 bg-white border-b border-gray-200 w-full'>
            {back && (
                <button
                    onClick={handleBackClick}
                    className='p-2 -ml-2 mr-2 text-gray-500 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400'
                    title={t('common.back')}
                >
                    <IoChevronBack className='w-5 h-5' />
                </button>
            )}

            <div className='left flex flex-col flex-grow min-w-0 mr-4'>
                {displayTitle ? (
                    <>
                        <h3 className='text-sm text-gray-500 truncate'>{displayTitle}</h3>
                        <h2 className='text-base font-semibold text-gray-800 truncate' title={displayName}>{displayName}</h2>
                    </>
                ) : (
                    <nav aria-label="Breadcrumb">
                        <ol className="flex items-center gap-1.5 text-sm">
                            {/* ... (logique breadcrumbs inchangée) ... */}
                            {breadcrumbs.map((crumb, index) => (
                                <li key={index} className="flex items-center gap-1.5">
                                    {index > 0 && (
                                        <IoChevronForward className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                    )}
                                    {crumb.url && index < breadcrumbs.length - 1 ? (
                                        <a
                                            href={crumb.url}
                                            className="text-gray-500 hover:text-gray-700 hover:underline truncate max-w-[80px] sm:max-w-[120px] md:max-w-xs" /* Ajusté max-w */
                                        >
                                            {crumb.name}
                                        </a>
                                    ) : (
                                        <span
                                            className={`font-medium ${index === breadcrumbs.length - 1
                                                ? 'text-gray-700'
                                                : 'text-gray-500'
                                                } truncate max-w-[80px] sm:max-w-[120px] md:max-w-xs`} /* Ajusté max-w */
                                            aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined}
                                        >
                                            {crumb.name}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </nav>
                )}
            </div>

            {/* Section Droite: Recherche, Notifications (commenté) & Avatar */}
            <div className='right bg-white flex items-center gap-3 flex-shrink-0'>
                {search && (
                    <button
                        onClick={handleSearchClick}
                        className='search-icon p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400'
                        title={t('topbar.searchAction')}
                    >
                        <IoSearch className='w-5 h-5' />
                    </button>
                )}
                {/* Bouton Notifications */}
                {/* {notif && (
                    <a href="/notifications" className="notify-icon-ctn relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400" title={t('topbar.notifications')}>
                        <IoNotifications className='w-5 h-5' />
                        <span className="available absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-1 ring-white"></span>
                        <span className="sr-only">{t('topbar.viewNotifications')}</span>
                    </a>
                )} */}
                {/* --- ✅ Avatar Utilisateur --- */}
                {user && ( // Afficher seulement si l'utilisateur est chargé
                    <div className="relative">
                        <button
                            className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-200 text-gray-600 text-sm font-semibold overflow-hidden hover:ring-2 hover:ring-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                            onClick={() => {
                                window.location.href = `${Host}/users/profile`;
                            }}
                            title={displayName ? `${t('topbar.profileMenuTitle')} - ${displayName}` : t('topbar.profileMenuTitle')}
                        >
                            {avatarImageUrl ? (
                                <img
                                    src={avatarImageUrl}
                                    alt={t('topbar.userAvatarAlt', { name: displayName })}
                                    className="w-full h-full object-cover" // Assure que l'image couvre bien
                                />
                            ) : (
                                <span>{userInitials}</span> // Afficher les initiales si pas de photo
                            )}
                        </button>
                        {/* Placeholder pour un futur menu déroulant */}
                        {/* <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 hidden"> ... liens profil, logout ... </div> */}
                    </div>
                )}
                {/* --- Fin Avatar --- */}

            </div>
        </div>
    );
}