// Components/TopBar/TopBar.tsx

import { useEffect, useState } from 'react';
import { ChildViewer } from '../ChildViewer/ChildViewer'; // Gardé
import { TopSearch } from '../TopSearch/TopSearch'; // Gardé
import { IoSearch, IoNotifications, IoChevronBack, IoChevronForward } from "react-icons/io5"; // Ajouter IoChevronForward pour breadcrumb
import { useChildViewer } from '../ChildViewer/useChildViewer'; // Utiliser le hook
import { useTranslation } from 'react-i18next'; // ✅ i18n
import { useAuthStore } from '../../pages/login/AuthStore'; // Pour afficher le nom de l'utilisateur
import { Host } from '../../renderer/+config';

export { Topbar };

// Interface pour les miettes de pain (breadcrumbs)
export interface BreadcrumbItem {
    name: string; // Texte affiché
    url?: string; // URL cliquable (optionnel pour le dernier élément)
}

interface TopbarProps {
    back?: boolean;        // Afficher le bouton retour
    search?: boolean;      // Afficher l'icône de recherche
    notif?: boolean;       // Afficher l'icône de notification
    onBack?: () => void;   // Callback pour le bouton retour
    title?: string;        // Titre principal (sera remplacé/caché par breadcrumbs si fourni)
    breadcrumbs?: BreadcrumbItem[]; // Tableau pour les miettes de pain
}

function Topbar({
    back = false, // Afficher retour par défaut si non spécifié? Non, masqué par défaut.
    search = true, // Afficher recherche par défaut
    notif = true, // Afficher notif par défaut
    onBack,
    title,
    breadcrumbs = [] // Tableau vide par défaut
}: TopbarProps) {
    const { t } = useTranslation(); // ✅ i18n
    const { openChild } = useChildViewer();
    const { user } = useAuthStore(); // Récupérer l'utilisateur connecté

    // Déterminer le titre à afficher (Breadcrumbs ou Titre simple)
    const displayTitle = breadcrumbs.length === 0 ? (title || t('topbar.welcomeMessage', { name: user?.full_name?.split(' ')[0] || 'Admin' })) : null;

    // Calculer le nom d'utilisateur à afficher
    const displayName = user?.full_name;
    const handleBackClick = () => {
        if (onBack) {
            onBack();
        } else {
            // Utiliser history API de manière plus sûre
            if (typeof window !== 'undefined' && window.history.length > 1) {
                window.history.back();
            } else {
                // Fallback si pas d'historique (ex: ouverture dans nouvel onglet)
                window.location.href = '/'; // Rediriger vers l'accueil
            }
        }
    };

    const handleSearchClick = () => {
        openChild(
            <ChildViewer title={t('topbar.globalSearchTitle')}>
                <TopSearch
                    onCategorySelected={(c) => {
                        window.location.href = `${Host}/categories/${c.id}`;
                    }}
                    onClientSelected={(c) => {
                        window.location.href = `${Host}/users/clients/${c.id}`;
                    }}
                    onCommandSelected={(c) => {
                        window.location.href = `${Host}/commands/${c.id}`;
                    }}
                    onProductSelected={(c) => {
                        window.location.href = `${Host}/products/${c.id}`;
                    }}
                />
            </ChildViewer>,
            { background: 'rgba(51, 51, 68, 0.8)', blur: 3 } // Fond plus sombre et flou
        );
    };

    return (
        // Utiliser flex, items-center, h-16, px-4 ou 6, bg-white, border-b
        <div className='top-bar sticky top-0 z-40 flex items-center h-16 px-4 sm:px-6 bg-white border-b border-gray-200 w-full'>
            {/* Bouton Retour (si activé) */}
            {/* Utiliser -ml-* pour compenser padding parent si besoin */}
            {back && (
                <button
                    onClick={handleBackClick}
                    className='p-2 -ml-2 mr-2 text-gray-500 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400'
                    title={t('common.back')} // 🌍 i18n
                >
                    <IoChevronBack className='w-5 h-5' />
                </button>
            )}

            {/* Section Gauche: Titre ou Breadcrumbs */}
            <div className='left flex flex-col flex-grow min-w-0 mr-4'> {/* flex-grow et min-w-0 pour truncate */}
                {/* Afficher soit le titre simple soit les breadcrumbs */}
                {displayTitle ? (
                    <>
                        <h3 className='text-sm text-gray-500 truncate'>{displayTitle}</h3>
                        <h2 className='text-base font-semibold text-gray-800 truncate' title={displayName}>{displayName}</h2>
                    </>
                ) : (
                    <nav aria-label="Breadcrumb">
                        <ol className="flex items-center gap-1.5 text-sm">
                            {breadcrumbs.map((crumb, index) => (
                                <li key={index} className="flex items-center gap-1.5">
                                    {index > 0 && (
                                        <IoChevronForward className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                    )}
                                    {crumb.url && index < breadcrumbs.length - 1 ? (
                                        <a
                                            href={crumb.url}
                                            className="text-gray-500 hover:text-gray-700 hover:underline truncate max-w-[80px] overflow-hidden text-ellipsis whitespace-nowrap"
                                        >
                                            {crumb.name}
                                        </a>
                                    ) : (
                                        <span
                                            className={`font-medium ${index === breadcrumbs.length - 1
                                                ? 'text-gray-700'
                                                : 'text-gray-500'
                                                } truncate max-w-[80px] overflow-hidden text-ellipsis whitespace-nowrap`}
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

            {/* Section Droite: Recherche & Notifications */}
            {/* Utiliser flex, items-center, gap-2 ou 3 */}
            <div className='right bg-white flex items-center gap-3 flex-shrink-0'>
                {/* Bouton Recherche */}
                {search && (
                    <button
                        onClick={handleSearchClick}
                        className='search-icon p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400'
                        title={t('topbar.searchAction')} // 🌍 i18n
                    >
                        <IoSearch className='w-5 h-5' />
                    </button>
                )}
                {/* Bouton Notifications */}
                {notif && (
                    // Utiliser un bouton si cliquable pour ouvrir un dropdown, sinon <a>
                    <a href="/notifications" className="notify-icon-ctn relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400" title={t('topbar.notifications')}>
                        <IoNotifications className='w-5 h-5' />
                        {/* Indicateur de notification (à rendre conditionnel) */}
                        <span className="available absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-1 ring-white"></span>
                        {/* Ajouter sr-only pour accessibilité */}
                        <span className="sr-only">{t('topbar.viewNotifications')}</span>
                    </a>
                )}
                {/* Ajouter Avatar Utilisateur / Menu Profil ici? */}

            </div>
        </div>
    );
}