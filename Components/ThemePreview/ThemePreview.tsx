// Components/ThemePreview/ThemePreview.tsx

import { useState, useRef, useEffect } from 'react';
import { ThemeInterface } from "../../api/Interfaces/Interfaces";
import { useTranslation } from "react-i18next";
import logger from '../../api/Logger';
import { IoExpandOutline, IoPhonePortraitOutline, IoTabletPortraitOutline, IoTvOutline, IoCheckmarkCircleSharp } from "react-icons/io5";
import ClipLoader from "react-spinners/ClipLoader"; // Utiliser un spinner pour le chargement de l'iframe

// Installer react-spinners: npm install react-spinners

interface ThemePreviewProps {
    theme: ThemeInterface; // Le thème sélectionné à prévisualiser
    onInstall: () => void; // Callback pour l'installation
    isInstalling: boolean; // Indique si l'installation est en cours
    // Props optionnelles pour maximiser/minimiser (si géré ici)
    // isMaximized?: boolean;
    // onMaximizeToggle?: () => void;
}

type PreviewDevice = 'mobile' | 'tablet' | 'desktop';

export function ThemePreview({ theme, onInstall, isInstalling }: ThemePreviewProps) {
    const { t } = useTranslation();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isLoadingIframe, setIsLoadingIframe] = useState(true); // État de chargement de l'iframe
    const [deviceView, setDeviceView] = useState<PreviewDevice>('desktop'); // Vue responsive

    // URL de la preview (à définir - utiliser theme.preview_url ou construire)
    // Pour S0, on utilise un placeholder ou localhost
    const previewUrl = `http://localhost:3005/themes/preview?themeId=${theme.slug || theme.id}`; // Exemple

    // Reset loading state when theme changes
    useEffect(() => {
        setIsLoadingIframe(true);
        // Reset scroll de l'iframe si possible quand l'URL change
        // iframeRef.current?.contentWindow?.scrollTo(0, 0);
    }, [previewUrl]);

    const handleIframeLoad = () => {
        setIsLoadingIframe(false);
        logger.debug(`Iframe loaded for theme: ${theme.name}`);
    };

    // Classes Tailwind pour la largeur de l'iframe selon le device
    const getIframeWidthClass = (): string => {
        switch (deviceView) {
            case 'mobile': return 'w-[375px] max-w-full'; // iPhone X approx.
            case 'tablet': return 'w-[768px] max-w-full'; // iPad portrait approx.
            case 'desktop':
            default: return 'w-full';
        }
    };

    return (
        // Conteneur principal: flex flex-col h-full
        <div className="theme-preview flex flex-col h-full w-full bg-gray-200 relative overflow-hidden">

            {/* Barre d'outils de la Preview */}
            <div className="flex-shrink-0 bg-white border-b border-gray-300 px-3 py-2 flex items-center justify-between gap-4 shadow-sm z-10">
                {/* Titre du Thème */}
                <div className='min-w-0'>
                    <h3 className="text-sm font-semibold text-gray-800 truncate" title={theme.name}>{theme.name}</h3>
                    {/* Ajouter tags ou créateur ici si pertinent */}
                </div>

                {/* Contrôles Responsive & Maximize */}
                <div className='flex items-center gap-1 sm:gap-2'>
                    {/* Boutons Responsive */}
                    <div className="flex items-center border border-gray-300 rounded-md p-0.5 bg-gray-100">
                        <button
                            onClick={() => setDeviceView('mobile')}
                            title={t('themePreview.viewMobile')}
                            className={`p-1 sm:p-1.5 rounded ${deviceView === 'mobile' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                        > <IoPhonePortraitOutline size={16} /> </button>
                        <button
                            onClick={() => setDeviceView('tablet')}
                            title={t('themePreview.viewTablet')}
                            className={`p-1 sm:p-1.5 rounded ${deviceView === 'tablet' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                        > <IoTabletPortraitOutline size={16} /> </button>
                        <button
                            onClick={() => setDeviceView('desktop')}
                            title={t('themePreview.viewDesktop')}
                            className={`p-1 sm:p-1.5 rounded ${deviceView === 'desktop' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                        > <IoTvOutline size={16} /> </button>
                    </div>
                    {/* Bouton Maximiser (optionnel) */}
                    {/* <button onClick={onMaximizeToggle} title={isMaximized ? "Réduire" : "Agrandir"} className="..."> <IoExpandOutline /> </button> */}
                </div>

                {/* Bouton Installer */}
                <button
                    onClick={onInstall}
                    disabled={isInstalling}
                    className="inline-flex items-center justify-center h-9 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
                >
                    {isInstalling ? (
                        <>
                            <ClipLoader size={16} color="#ffffff" className="mr-2" />
                            {t('themeMarket.installingButton')}
                        </>
                    ) : (
                        t('themeMarket.installButton')
                    )}
                </button>
            </div>

            {/* Conteneur Iframe */}
            {/* Utiliser flex-grow pour prendre l'espace, overflow-auto pour scroll interne */}
            <div className="flex-grow overflow-auto flex justify-center items-start pt-4 sm:pt-6 bg-gray-300/50"> {/* Centre l'iframe */}
                {/* Indicateur Chargement Iframe */}
                {isLoadingIframe && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200/50 z-10">
                        <ClipLoader size={40} color="#4A90E2" />
                    </div>
                )}
                {/* Iframe */}
                <iframe
                    ref={iframeRef}
                    src={previewUrl}
                    title={t('themePreview.previewTitle', { name: theme.name })}
                    // Appliquer largeur dynamique et transition
                    className={`bg-white shadow-lg transition-all duration-300 ease-in-out ${getIframeWidthClass()} ${isLoadingIframe ? 'opacity-0' : 'opacity-100'}`}
                    // Hauteur basée sur le conteneur (ex: calc(100% - qqc) ou via CSS parent)
                    style={{ height: 'calc(100% - 2rem)' }} // Exemple pour laisser de la marge
                    onLoad={handleIframeLoad}
                    onError={() => setIsLoadingIframe(false)} // Marquer comme chargé même en cas d'erreur iframe
                    sandbox="allow-scripts allow-same-origin" // Sandbox pour sécurité (ajuster si besoin)
                ></iframe>
            </div>

        </div>
    );
}
