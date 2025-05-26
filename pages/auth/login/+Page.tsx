// pages/auth/+Page.tsx
// (Anciennement pages/login/+Page.tsx)

import React, { useState, useEffect, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
    useLogin,
    useRegister, // ✅ NOUVEAU : Hook pour l'inscription
    useGetMe,
    queryClient,
    useApi,
    // useApi, // Plus besoin si on utilise getAuthBackend directement dans les hooks
} from '../../../api/ReactSublymusApi';
import { useAuthStore } from '../../../api/stores/AuthStore';
import logger from '../../../api/Logger';
import { ApiError, LoginParams, RegisterParams } from '../../../api/SublymusApi'; // Importer les types Params
import { IoMailOutline, IoLockClosedOutline, IoPersonOutline, IoLogoGoogle /*, IoLogoFacebook*/ } from 'react-icons/io5';
import logoUrl from '../../../renderer/logo.png'; // Tu pourrais vouloir un logo spécifique pour le dashboard
import { usePageContext } from '../../../renderer/usePageContext';
import { Link } from '../../../renderer/Link'; // Utiliser le composant Link de Vike
import { useMyLocation } from '../../../Hooks/useRepalceState';

export { Page };

type AuthMode = 'login' | 'register';

function Page() {
    const { t } = useTranslation();
    const { urlParsed, config, serverUrl } = usePageContext(); // serverUrl pourrait venir du contexte Vike si configuré globalement

    const [mode, setMode] = useState<AuthMode>('login'); // 'login' ou 'register'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState(''); // ✅ NOUVEAU : Pour l'inscription
    const [passwordConfirmation, setPasswordConfirmation] = useState(''); // ✅ NOUVEAU
    const [apiError, setApiError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isProcessingToken, setIsProcessingToken] = useState(false);

    const { nextPage } = useMyLocation()

    const api = useApi();

    const { setUser: setGlobalUser, setToken: setGlobalToken } = useAuthStore();

    // Utiliser les hooks avec backend_target: 'server' pour le dashboard
    const loginMutation = useLogin({ backend_target: 'server' });
    const registerMutation = useRegister({ backend_target: 'server' }); // ✅ NOUVEAU
    const getMeMutation = useGetMe({ backend_target: 'server', enabled: false }); // enabled: false initialement

    // Traitement du token social login (inchangé pour l'instant, mais redirectUrl devra être dynamique)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const token = urlParsed.search['token'];
            // const expiresAt = fragmentParams.get('expires_at'); // Tu peux aussi récupérer ça

            if (token) {
                logger.info("Token found in URL fragment. Processing social login...");
                setIsProcessingToken(true);
                setApiError(null);
                setGlobalToken(token); // Stocker le token

                // Utiliser une mutation ou un fetchQuery pour getMe
                // Ici, on peut directement appeler getMe, car le token est déjà dans le store
                // et les appels API subsequents l'utiliseront.
                // Forcer un refetch de 'me' si le token a été mis.
                queryClient.invalidateQueries({ queryKey: ['me'] });
                getMeMutation.refetch()
                    .then(({ data }) => {
                        if (data) {
                            logger.info("User data fetched successfully after social login", data.user);
                            setGlobalUser(data.user);
                            window.location.hash = ''; // Nettoyer le fragment
                            setTimeout(() => nextPage('/'), 100); // Rediriger vers le dashboard
                        } else {
                            throw new Error("No user data returned from getMe");
                        }
                    })
                    .catch((error: ApiError | Error) => {
                        logger.error("Failed to fetch user after social login", error);
                        setApiError(t('auth.socialLoginTokenError'));
                        setGlobalToken(undefined); // Révoquer le token si getMe échoue
                        setGlobalUser(undefined);
                        window.location.hash = ''; // Nettoyer le fragment
                    })
                    .finally(() => {
                        setIsProcessingToken(false);
                    });
            }
        }
    }, [setGlobalToken, setGlobalUser, t, getMeMutation]); // getMeMutation ajouté aux dépendances

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setApiError(null);
        setSuccessMessage(null);

        if (isProcessingToken || loginMutation.isPending || registerMutation.isPending) return;

        if (mode === 'login') {
            if (!email || !password) {
                setApiError(t('auth.missingFields'));
                return;
            }
            loginMutation.mutate({ email, password }, {
                onSuccess(data) {
                    setGlobalUser(data.user);
                    setGlobalToken(data.token || (data as any).jwt_token); // Prend en compte ton jwt_token
                    // expires_at est aussi dans data.expires_at
                    setTimeout(() => nextPage('/'), 100); // Rediriger vers le dashboard
                },
                onError: (error: ApiError) => {
                    setApiError(error.body?.message || error.message || t('auth.loginFailed'));
                },
            });
        } else { // mode === 'register'
            if (!fullName || !email || !password || !passwordConfirmation) {
                setApiError(t('auth.missingFields'));
                return;
            }
            if (password !== passwordConfirmation) {
                setApiError(t('auth.passwordsDoNotMatch'));
                return;
            }
            const registerPayload: RegisterParams = { full_name: fullName, email, password, password_confirmation: passwordConfirmation };
            registerMutation.mutate(registerPayload, {
                onSuccess(data) {
                    nextPage(`/auth/auth-notice?type=verify_email_sent&email=${email}`)
                    setSuccessMessage(data.message || t('auth.registerSuccessCheckEmail')); // Message invitant à vérifier email
                    setMode('login'); // Rebasculer vers login ou afficher message
                    // Ne pas connecter automatiquement, l'utilisateur doit vérifier son email.
                },
                onError: (error: ApiError) => {
                    setApiError(error.body?.message || error.message || t('auth.registerFailed'));
                },
            });
        }
    };

    const handleSocialLogin = (provider: 'google') => {
        const redirectSuccess = `${window.location.origin}${window.location.pathname}`; // Retour à cette page
        const redirectError = `${window.location.origin}/auth/auth-notice`;

        const socialAuthUrl = api.authServer.socialAuthBackendSource({ provider, redirectError, redirectSuccess });
        alert(socialAuthUrl)

        window.location.href = socialAuthUrl;
    };


    if (isProcessingToken) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-center p-8">
                    {/* Tu peux utiliser une icône de spinner SVG ici */}
                    <svg className="animate-spin h-12 w-12 text-teal-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-slate-600 dark:text-slate-300 text-lg">{t('auth.processingSocialLogin')}</p>
                </div>
            </div>
        );
    }

    const isLoading = loginMutation.isPending || registerMutation.isPending;

    return (
        <div className=" absolute top-0 left-0 w-full h-full min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 via-sky-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900 px-4 py-12 overflow-hidden">
            <div className="absolute inset-0 opacity-50 dark:opacity-30">
                {/* Arrière-plan avec des cercles comme sur l'image d'inspiration */}
                <div className="absolute -top-1/4 -left-1/4 w-full h-full rounded-full bg-teal-300/30 dark:bg-teal-700/20 filter blur-3xl animate-pulse-slow"></div>
                <div className="absolute -bottom-1/4 -right-1/4 w-3/4 h-3/4 rounded-full bg-sky-300/30 dark:bg-sky-700/20 filter blur-3xl animate-pulse-slower animation-delay-2000"></div>
                <div className="absolute top-1/3 right-0 w-1/2 h-1/2 rounded-full bg-purple-300/20 dark:bg-purple-700/10 filter blur-3xl animate-pulse-slowest animation-delay-4000"></div>
            </div>

            <div className="relative w-full max-w-md md:max-w-lg lg:max-w-full xl:w-[1000px]  flex flex-col lg:flex-row lg:items-center lg:gap-16">
                {/* Section Gauche (Illustration - visible sur desktop) */}
                <div className="hidden lg:block lg:w-1/2 xl:w-2/5 flex-shrink-0">
                    {/* Tu peux mettre une illustration SVG ou une image ici */}
                    {/* Pour l'instant, un placeholder */}
                    <div className="p-8 rounded-lg">
                        <img src={logoUrl} alt="Sublymus" className="w-20 h-20 mx-auto mb-6 opacity-80" />
                        <h1 className="text-3xl font-bold text-center text-slate-700 dark:text-slate-200 mb-3">
                            {t('auth.welcomeTitle')} {/* Bienvenue sur Sublymus */}
                        </h1>
                        <p className="text-center text-slate-500 dark:text-slate-400">
                            {t('auth.welcomeSubtitle')} {/* Gérez votre business en ligne avec facilité. */}
                        </p>
                    </div>
                </div>

                {/* Section Droite (Formulaire) */}
                <div className="w-full lg:w-1/2 xl:w-[500px] lg:ml-auto">
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50">
                        <div className="mb-6 text-center lg:hidden"> {/* Logo et titre pour mobile */}
                            <img className="h-12 w-auto mx-auto mb-3" src={logoUrl} alt="Sublymus Logo" />
                        </div>

                        <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
                            <button
                                onClick={() => setMode('login')}
                                className={`flex-1 py-3 text-sm font-medium text-center transition-colors duration-150
                  ${mode === 'login'
                                        ? 'border-b-2 border-teal-500 text-teal-600 dark:text-teal-400'
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                            >
                                {t('auth.loginTab')}
                            </button>
                            <button
                                onClick={() => setMode('register')}
                                className={`flex-1 py-3 text-sm font-medium text-center transition-colors duration-150
                  ${mode === 'register'
                                        ? 'border-b-2 border-teal-500 text-teal-600 dark:text-teal-400'
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                            >
                                {t('auth.registerTab')}
                            </button>
                        </div>

                        <h2 className="text-xl font-semibold text-center text-slate-800 dark:text-slate-100 mb-1">
                            {mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
                        </h2>
                        <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-6">
                            {mode === 'login' ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
                        </p>

                        {apiError && (
                            <div className="p-3 mb-4 rounded-md bg-red-50 dark:bg-red-800/30 border border-red-300 dark:border-red-600">
                                <p className="text-sm text-red-700 dark:text-red-300">{apiError}</p>
                            </div>
                        )}
                        {successMessage && (
                            <div className="p-3 mb-4 rounded-md bg-emerald-50 dark:bg-emerald-800/30 border border-emerald-300 dark:border-emerald-600">
                                <p className="text-sm text-emerald-700 dark:text-emerald-300">{successMessage}</p>
                            </div>
                        )}

                        <form className="space-y-5" onSubmit={handleSubmit}>
                            {mode === 'register' && (
                                <div className="relative">
                                    <IoPersonOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                                    <input id="full-name" name="full_name" type="text" autoComplete="name" required
                                        className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 py-2.5 pl-11 pr-3 text-slate-900 dark:text-slate-100 shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                                        placeholder={t('auth.fullNamePlaceholder')}
                                        value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={isLoading}
                                    />
                                </div>
                            )}
                            <div className="relative">
                                <IoMailOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                                <input id="email-address" name="email" type="email" autoComplete="email" required
                                    className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 py-2.5 pl-11 pr-3 text-slate-900 dark:text-slate-100 shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                                    placeholder={t('auth.emailPlaceholder')}
                                    value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading}
                                />
                            </div>
                            <div className="relative">
                                <IoLockClosedOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                                <input id="password" name="password" type="password"
                                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required
                                    className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 py-2.5 pl-11 pr-3 text-slate-900 dark:text-slate-100 shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                                    placeholder={t('auth.passwordPlaceholder')}
                                    value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading}
                                />
                            </div>
                            {mode === 'register' && (
                                <div className="relative">
                                    <IoLockClosedOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                                    <input id="password-confirmation" name="password_confirmation" type="password"
                                        autoComplete="new-password" required
                                        className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 py-2.5 pl-11 pr-3 text-slate-900 dark:text-slate-100 shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                                        placeholder={t('auth.passwordConfirmPlaceholder')}
                                        value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} disabled={isLoading}
                                    />
                                </div>
                            )}

                            {mode === 'login' && (
                                <div className="flex items-center justify-end text-sm">
                                    <Link href="/auth/forgot-password" // Ajuster le lien si nécessaire
                                        className="font-medium text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300 hover:underline">
                                        {t('auth.forgotPasswordLink')}
                                    </Link>
                                </div>
                            )}

                            <div>
                                <button type="submit" disabled={isLoading}
                                    className="group relative flex w-full justify-center rounded-lg border border-transparent bg-teal-600 py-2.5 px-4 text-sm font-semibold text-white shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-60 transition-colors"
                                >
                                    {isLoading ? (
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        mode === 'login' ? t('auth.loginButton') : t('auth.registerButton')
                                    )}
                                </button>
                            </div>
                        </form>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-slate-300 dark:border-slate-600" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white/80 dark:bg-slate-800/80 px-2 text-slate-500 dark:text-slate-400 backdrop-blur-md">
                                    {t('auth.orContinueWith')}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <button
                                disabled={isLoading || isProcessingToken}
                                onClick={() => handleSocialLogin('google')}
                                type="button"
                                className="inline-flex w-full justify-center items-center gap-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/30 py-2.5 px-4 text-sm font-medium text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-60 transition-colors"
                            >
                                <IoLogoGoogle className="h-5 w-5 text-red-500" />
                                <span>{t('auth.googleButton')}</span>
                            </button>
                            {/* Tu pourrais ajouter d'autres fournisseurs OAuth ici */}
                        </div>

                        {mode === 'login' && (
                            <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
                                {t('auth.noAccountPrompt')}{' '}
                                <button onClick={() => setMode('register')} className="font-medium text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300 hover:underline">
                                    {t('auth.registerNowLink')}
                                </button>
                            </p>
                        )}
                        {mode === 'register' && (
                            <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
                                {t('auth.alreadyAccountPrompt')}{' '}
                                <button onClick={() => setMode('login')} className="font-medium text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300 hover:underline">
                                    {t('auth.loginNowLink')}
                                </button>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}