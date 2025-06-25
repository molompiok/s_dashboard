// Components/ThemeEditor/LiveThemePreview.tsx

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ThemeInterface, StoreInterface, ThemeSettingsValues } from "../../api/Interfaces/Interfaces"; // Importer types nécessaires
import { useTranslation } from "react-i18next";
import logger from '../../api/Logger';
import { IoExpandOutline, IoPhonePortraitOutline, IoTabletPortraitOutline, IoTvOutline, IoSyncOutline } from "react-icons/io5";
import ClipLoader from 'react-spinners/ClipLoader';
import { Check, Download, HardDrive, Save } from 'lucide-react';
import { SpinnerIcon } from '../Confirm/Spinner';
import { buttonStyle } from '../Button/Style';
import { http, isProd } from '../Utils/functions';
import { usePageContext } from '../../renderer/usePageContext';
import { useAuthStore } from '../../api/stores/AuthStore';

type PreviewDevice = 'mobile' | 'tablet' | 'desktop';

const MapCache: Record<string/*dtotre_id-theme_id*/, string | undefined/*server_preview_url*/> = {};
interface LiveThemePreviewProps {
    store: StoreInterface; // Store pour l'URL de base et contexte
    theme: ThemeInterface; // Thème pour info et ID potentiel
    settings: ThemeSettingsValues; // Les paramètres DRAFT actuels à prévisualiser
    onInstall?: () => void; // Pas pertinent pour l'éditeur
    isInstalling?: boolean; // Pas pertinent pour l'éditeur
    avalaibleWidth?: number,
    isSaving?: boolean,
    onSave?: () => void,
    mode: 'edit' | 'market'
}

export function LiveThemePreview({ onSave, mode, isSaving, store, theme, settings, avalaibleWidth, onInstall, isInstalling }: LiveThemePreviewProps) {
    const { t } = useTranslation();
    const { serverUrl } = usePageContext()
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isLoadingIframe, setIsLoadingIframe] = useState(true);
    const [deviceView, setDeviceView] = useState<PreviewDevice>('mobile');
    // État pour suivre si l'iframe est prête à recevoir des postMessages
    const [isIframeReady, setIsIframeReady] = useState(false);
    // Clé pour forcer le re-rendu de l'iframe si postMessage n'est pas fiable
    const [iframeKey, setIframeKey] = useState(Date.now());

    const {getToken} = useAuthStore()
    const [previewUrl, setPreviewUrl] = useState('');

    console.log('-----------serverUrl-------->>>', serverUrl);
    
    useEffect(() => {
        let server_preview_url = MapCache[`${store.id}-${theme.id}`]
        if (!server_preview_url) {
            (async () => {
                try {
                    const requestHeaders = new Headers({});
                    const token = getToken()
                    if (token) requestHeaders.set('Authorization', `Bearer ${token}`);
                    requestHeaders.set('Content-Type', 'application/json');
                    requestHeaders.set('Accept', 'application/json');

                    const response = await fetch(`${http}server.${serverUrl}/v1/me/stores/${store.id}/theme-preview-sessions`, {
                        method: 'POST',
                        body: JSON.stringify({ theme_id: theme.id }),
                        headers:requestHeaders
                    })
                    const res = await response.json()
                    setPreviewUrl(res.preview_url||`${http}server.${serverUrl}`)
                } catch (error) {
                    setPreviewUrl(`${http}server.${serverUrl}`)
                }
            })()
            return
        }
        setPreviewUrl(server_preview_url)
    }, [store.id, theme.id])





    // --- Communication PostMessage ---
    // Fonction pour envoyer les settings à l'iframe
    const sendSettingsToIframe = useCallback(() => {
        if (iframeRef.current?.contentWindow && isIframeReady) {
            logger.debug("Sending settings via postMessage to preview iframe", settings);
            iframeRef.current.contentWindow.postMessage(
                { type: 'UPDATE_THEME_SETTINGS', payload: settings },
                '*' // TODO: Restreindre l'origine à l'URL de preview pour la sécurité
            );
        } else {
            logger.warn("Iframe not ready or not available to receive postMessage settings.");
            // Fallback: Recharger l'iframe en changeant la clé (si postMessage échoue souvent)
            // setIsLoadingIframe(true);
            // setIframeKey(Date.now());
        }
    }, [settings, isIframeReady]); // Dépend des settings et de l'état ready

    // Envoyer les settings quand ils changent ET que l'iframe est prête
    useEffect(() => {
        sendSettingsToIframe();
    }, [settings, sendSettingsToIframe]); // Déclenché par changement de settings

    // --- Gestion Iframe ---
    const handleIframeLoad = () => {
        setIsLoadingIframe(false);
        setIsIframeReady(true); // Marquer comme prête APRÈS le premier chargement
        logger.debug("Preview Iframe loaded and ready.");
        // Envoyer les settings une fois l'iframe chargée initialement
        // Le useEffect ci-dessus s'en chargera car isIframeReady change
    };

    const handleIframeError = () => {
        setIsLoadingIframe(false);
        setIsIframeReady(false); // Ne pas marquer comme prête en cas d'erreur
        logger.error("Preview Iframe failed to load.");
    }

    // Marquer comme non prête et chargeant si l'URL change
    useEffect(() => {
        setIsLoadingIframe(true);
        setIsIframeReady(false);
    }, [previewUrl]);

    // --- Classes Tailwind pour l'iframe ---
    const iframeWidthClass = useMemo((): string => {
        switch (deviceView) {
            case 'mobile': return 'w-[375px] max-w-full shadow-xl border-8 border-gray-800 rounded-[2.5rem]'; // Style téléphone
            case 'tablet': return 'w-[768px] max-w-full shadow-xl border-8 border-gray-800 rounded-[1.5rem]'; // Style tablette
            case 'desktop':
            default: return 'w-full shadow-lg border border-gray-300'; // Simple bordure desktop
        }
    }, [deviceView]);

    const iframeHeightClass = useMemo((): string => {
        switch (deviceView) {
            case 'mobile': return 'h-[680px] max-h-[80vh]'; // Hauteur iPhone approx
            case 'tablet': return 'h-[1024px] max-h-[80vh]'; // Hauteur iPad approx
            case 'desktop':
            default: return 'h-full'; // Prend la hauteur dispo
        }
    }, [deviceView]);

    return (
        // Conteneur principal: flex flex-col h-full
        <div className="live-theme-preview flex flex-col h-full w-full bg-gray-200 relative overflow-hidden">

            {/* Barre d'outils */}
            <div style={{ width: avalaibleWidth }} className="flex-shrink-0 bg-white border-b border-gray-300 px-3 py-2 flex items-center justify-between gap-4 shadow-sm z-10">
                {/* Titre (peut être caché ou simplifié) */}
                <div className='w-24'></div>

                {/* Contrôles Responsive & Reload */}
                <div className='flex items-center gap-1 sm:gap-2 mx-auto md:mx-0'> {/* Centré sur mobile */}
                    <div className="flex items-center border border-gray-300 rounded-md p-0.5 bg-gray-100">
                        {/* Boutons Mobile/Tablet/Desktop */}
                        <button onClick={() => setDeviceView('mobile')} title={t('themePreview.viewMobile')} className={`p-1 sm:p-1.5 rounded ${deviceView === 'mobile' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}> <IoPhonePortraitOutline size={16} /> </button>
                        <button onClick={() => setDeviceView('tablet')} title={t('themePreview.viewTablet')} className={`p-1 sm:p-1.5 rounded ${deviceView === 'tablet' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}> <IoTabletPortraitOutline size={16} /> </button>
                        <button onClick={() => setDeviceView('desktop')} title={t('themePreview.viewDesktop')} className={`p-1 sm:p-1.5 rounded ${deviceView === 'desktop' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}> <IoTvOutline size={16} /> </button>
                    </div>
                    {/* Bouton Reload Iframe */}
                    <button
                        onClick={() => { setIsLoadingIframe(true); setIsIframeReady(false); setIframeKey(Date.now()); }}
                        title={t('themeEditor.reloadPreview')}
                        className="p-1.5 sm:p-2 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    >
                        <IoSyncOutline size={16} />
                    </button>
                </div>

                {
                    mode == 'edit'
                        ? isSaving
                            ? <span
                                className="flex w-4 max-w-4 items-center flex-row gap-4"
                            >
                                <SpinnerIcon />
                            </span>
                            : <button onClick={onSave} className="p-2 rounded-md hover:bg-gray-100 transition-colors">
                                <div className="flex items-center gap-1 text-green-600">
                                    <Save className="w-4 h-4" />
                                    <Check className="w-4 h-4" />
                                </div>
                            </button>
                        : <button
                            disabled={isInstalling || isLoadingIframe}
                            onClick={onInstall}
                            className={`
        flex items-center gap-4 px-4 py-2 rounded-2xl transition
        ${isInstalling || isLoadingIframe
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                                    : buttonStyle
                                }
    `}
                        >
                            {isInstalling ? <SpinnerIcon /> : <Download className="w-4.5 h-4.5" />}
                            <span className='hidden mob:inline'>
                                {isInstalling
                                    ? t('themeMarket.installingButton')
                                    : t('themeMarket.installButton')
                                }
                            </span>
                        </button>
                }
            </div>

            {/* Conteneur Iframe */}
            <div className="flex-grow overflow-auto flex justify-center items-center  p-1 min-w-[480px]:p-2  relative bg-gradient-to-br from-gray-200 to-gray-300"> {/* Fond différent */}
                {/* Indicateur Chargement */}
                {isLoadingIframe && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200/60 backdrop-blur-sm z-10">
                        <ClipLoader size={40} color="#3B82F6" /> {/* Spinner bleu */}
                    </div>
                )}
                {/* Iframe avec taille et transition */}
                <iframe
                    key={iframeKey} // Changer la clé force le rechargement complet
                    ref={iframeRef}
                    src={previewUrl}
                    style={deviceView == 'desktop' ? {
                        width: '1072px',
                        height: '800px',
                        transform: `scale(${avalaibleWidth ? avalaibleWidth / 1080 : 0.5})`, /* 1080 * 0.5 = 540 (vue sur mobile) */
                        transformOrigin: ' top left',
                        border: 'none',
                    } : undefined}
                    title={t('themePreview.previewTitle', { name: 'Demo Theme' })}
                    className={`bg-white overflow-hidden transition-all duration-300 ease-in-out border-gray-400 ${iframeWidthClass} ${iframeHeightClass} ${isLoadingIframe ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-top-navigation-by-user-activation"
                ></iframe>
            </div>
        </div >
    );
}

// --- Skeleton (si besoin, similaire à ThemePreviewSkeleton) ---
export function LiveThemePreviewSkeleton() {
    const { t } = useTranslation();
    return (
        <div className="theme-preview flex flex-col h-full w-full bg-gray-200 animate-pulse">
            {/* Toolbar Placeholder */}
            <div className="flex-shrink-0 bg-white border-b border-gray-300 px-3 py-2 flex items-center justify-between gap-4 shadow-sm h-14">
                <div className="h-5 w-32 bg-gray-300 rounded"></div> {/* Titre */}
                <div className="flex items-center gap-2">
                    <div className="h-8 w-24 bg-gray-200 rounded-md"></div> {/* Responsive */}
                    <div className="h-9 w-28 bg-gray-300 rounded-md"></div> {/* Installer */}
                </div>
            </div>
            {/* Iframe Placeholder */}
            <div className="flex-grow overflow-auto flex justify-center items-center pt-6 bg-gray-300/50">
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                    {t('common.loading')}...
                </div>
            </div>
        </div>
    );
}

