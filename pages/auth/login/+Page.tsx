// pages/auth/+Page.tsx
// Page de connexion simplifiée avec uniquement Google

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    useGetMe,
    queryClient,
    useApi,
} from '../../../api/ReactSublymusApi';
import { useAuthStore } from '../../../api/stores/AuthStore';
import logger from '../../../api/Logger';
import { ApiError } from '../../../api/SublymusApi';
import { IoLogoGoogle } from 'react-icons/io5';
import logoUrl from '../../../renderer/logo.png';
import { usePageContext } from '../../../renderer/usePageContext';
import { useMyLocation } from '../../../Hooks/useRepalceState';

export { Page };

function Page() {
    const { t } = useTranslation();
    const { urlParsed } = usePageContext();

    const [apiError, setApiError] = useState<string | null>(null);
    const [isProcessingToken, setIsProcessingToken] = useState(false);

    const { nextPage } = useMyLocation();
    const api = useApi();
    const { setUser: setGlobalUser, setToken: setGlobalToken } = useAuthStore();
    const getMeMutation = useGetMe({ backend_target: 'server', enabled: false });

    // Traitement du token social login
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const token = urlParsed.search['token'];

            if (token) {
                logger.info("Token found in URL. Processing social login...");
                setIsProcessingToken(true);
                setApiError(null);
                setGlobalToken(token);

                queryClient.invalidateQueries({ queryKey: ['me'] });
                getMeMutation.refetch()
                    .then(({ data }) => {
                        if (data) {
                            logger.info("User data fetched successfully after social login", data.user);
                            setGlobalUser(data.user);
                            window.location.hash = '';
                            setTimeout(() => nextPage('/'), 100);
                        } else {
                            throw new Error("No user data returned from getMe");
                        }
                    })
                    .catch((error: ApiError | Error) => {
                        logger.error("Failed to fetch user after social login", error);
                        setApiError(t('auth.socialLoginTokenError'));
                        setGlobalToken(undefined);
                        setGlobalUser(undefined);
                        window.location.hash = '';
                    })
                    .finally(() => {
                        setIsProcessingToken(false);
                    });
            }
        }
    }, [setGlobalToken, setGlobalUser, t, getMeMutation, urlParsed.search, nextPage]);

    const handleSocialLogin = (provider: 'google') => {
        const redirectSuccess = `${window.location.origin}${window.location.pathname}`;
        const redirectError = `${window.location.origin}/auth/auth-notice`;

        const socialAuthUrl = api.authServer.socialAuthBackendSource({ provider, redirectError, redirectSuccess });
        
        window.location.href = socialAuthUrl;
    };


    if (isProcessingToken || urlParsed.search['token']) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-sky-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900">
                <div className="text-center p-8">
                    <svg className="animate-spin h-12 w-12 text-teal-600 dark:text-teal-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-slate-600 dark:text-slate-300 text-lg">{t('auth.processingSocialLogin')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-sky-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900 px-4 py-12">
            {/* Arrière-plan décoratif */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/4 -left-1/4 w-full h-full rounded-full bg-teal-300/30 dark:bg-teal-700/20 filter blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-1/4 -right-1/4 w-3/4 h-3/4 rounded-full bg-sky-300/30 dark:bg-sky-700/20 filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-1/3 right-0 w-1/2 h-1/2 rounded-full bg-purple-300/20 dark:bg-purple-700/10 filter blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
            </div>

            {/* Carte principale */}
            <div className="relative w-full max-w-md">
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl p-8 sm:p-10 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50">
                    {/* Logo et titre */}
                    <div className="text-center mb-8">
                        <img 
                            src={logoUrl} 
                            alt="Sublymus" 
                            className="h-16 w-16 mx-auto mb-6 opacity-90" 
                        />
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                            {t('auth.welcomeTitle', 'Bienvenue')}
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                            {t('auth.welcomeSubtitle', 'Connectez-vous pour accéder à votre tableau de bord')}
                        </p>
                    </div>

                    {/* Message d'erreur */}
                    {apiError && (
                        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-700 dark:text-red-300 text-center">{apiError}</p>
                        </div>
                    )}

                    {/* Bouton Google */}
                    <button
                        onClick={() => handleSocialLogin('google')}
                        disabled={isProcessingToken}
                        type="button"
                        className="group w-full flex items-center justify-center gap-4 px-6 py-4 bg-white dark:bg-slate-700/50 border-2 border-slate-300 dark:border-slate-600 rounded-xl hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        <IoLogoGoogle className="h-6 w-6 text-red-500 flex-shrink-0" />
                        <span className="text-slate-700 dark:text-slate-200 font-semibold text-base">
                            {t('auth.googleButton', 'Continuer avec Google')}
                        </span>
                    </button>

                    {/* Note de sécurité */}
                    <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
                        {t('auth.secureLogin', 'Connexion sécurisée via Google')}
                    </p>
                </div>
            </div>
        </div>
    );
}