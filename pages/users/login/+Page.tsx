// pages/login/+Page.tsx

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
// ✅ Importer les hooks API
import { useLogin, useGetMe, queryClient, useApi } from '../../../api/ReactSublymusApi'; // Ajouter useGetMe et queryClient
// ✅ Importer le hook pour le store d'état global
import { useAuthStore } from './AuthStore';
import logger from '../../../api/Logger';
import { ApiError } from '../../../api/SublymusApi';
import { IoMailOutline, IoLockClosedOutline } from 'react-icons/io5';
import logoUrl from '../../../renderer/logo.svg';
import { Link } from '../../../renderer/Link';
import { usePageContext } from '../../../renderer/usePageContext'; // Pour lire l'URL initiale si besoin
import { useGlobalStore } from '../../../pages/stores/StoreStore'; // Importer pour handleSocialLogin
import { Server_Host } from '../../../renderer/+config';

export { Page };

function Page() {
    const { t } = useTranslation();
    const loginMutation = useLogin();
    const { setUser: setGlobalUser, setToken: setGlobalToken } = useAuthStore(); // Accéder aux actions du store
    const { currentStore } = useGlobalStore(); // Récupérer le store pour l'URL s_server
    const api = useApi(); // Pour URL serveur (bien que non strictement nécessaire ici)
    const { urlParsed } = usePageContext(); // Pour lire les query params (ex: ?error=)

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [apiError, setApiError] = useState<string | null>(null);
    const [isProcessingToken, setIsProcessingToken] = useState(false); // Nouvel état

    // --- Traitement du Fragment d'URL au chargement ---
    useEffect(() => {
        // Exécuter seulement côté client
        if (typeof window !== 'undefined') {
            const hash = window.location.hash.substring(1); // Récupérer la partie après #
            if (hash) {
                logger.info("URL fragment detected:", hash);
                const params = new URLSearchParams(hash);
                const token = params.get('token');
                const expiresAt = params.get('expires_at'); // Peut être utilisé si besoin

                if (token) {
                    logger.info("Token found in URL fragment. Processing...");
                    setIsProcessingToken(true); // Indiquer qu'on traite le token
                    setApiError(null); // Nettoyer les erreurs précédentes

                    setGlobalToken(token);

                    queryClient.fetchQuery({
                         queryKey: ['me'], // Utiliser la même clé que useGetMe
                         queryFn: () => api.auth.getMe(), // Appeler la méthode API
                         staleTime: 0 // Forcer le fetch même si cache existe
                    }).then(data => {
                         logger.info("User data fetched successfully after social login", data.user);
                         setGlobalUser(data.user);
                         setIsProcessingToken(false);
                         setTimeout(() => window.location.replace('/'), 100);
                    }).catch((error: ApiError | Error) => {
                           setApiError(t('auth.socialLoginTokenError')); // 🌍 i18n Nouvelle clé
                          setIsProcessingToken(false); // Fin du traitement (échec)
                    });

                }
            }
        }
    }, [setGlobalToken, setGlobalUser, api, t, urlParsed.search]); // Dépendances


    // --- Effet après succès mutation login email/pass (inchangé) ---
    useEffect(() => {
        if (loginMutation.isSuccess) {
             const data = loginMutation.data;
             setGlobalUser(data.user);
             setGlobalToken(data.token);
             setTimeout(() => window.location.replace('/'), 100);
        }
    }, [loginMutation.isSuccess, loginMutation.data, setGlobalUser, setGlobalToken]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
         event.preventDefault();
         setApiError(null);
         if (!email || !password || loginMutation.isPending || isProcessingToken) return; // Ne pas soumettre si traitement token en cours

         loginMutation.mutate({ email, password }, { onError: (error: ApiError) => { /* ... gestion erreur ... */ } });
    };

    const handleSocialLogin = (provider: 'google' /* | 'facebook' */) => {
        if (!currentStore?.id) {
            logger.error("Cannot initiate social login: currentStore ID is missing.");
            setApiError(t('api.contextError.noStoreUrl')); // Afficher erreur
            return;
        }
        logger.info(`Initiating social login with ${provider}`);
        // Construire l'URL s_server (avec fallback)
         const serverHost = Server_Host; // Utiliser variable d'env ou fallback
         // Construire les URLs de callback pour le frontend
         const clientSuccessUrl = `${window.location.origin}${window.location.pathname}?success`; // Retour à la page login avec ?success
         const clientErrorUrl = `${window.location.origin}${window.location.pathname}?error=${provider}`; // Retour avec ?error=provider
        // Construire l'URL de redirection vers s_server
        const redirectUrl = `${serverHost}/auth/${provider}/redirect?store_id=${currentStore.id}&client_success=${encodeURIComponent(clientSuccessUrl)}&client_error=${encodeURIComponent(clientErrorUrl)}`;

        logger.debug("Redirecting to:", redirectUrl);
        window.location.href = redirectUrl;
    };


    // --- Rendu ---
    // Afficher un loader pendant le traitement du token
    if (isProcessingToken) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                     <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" /* ... spinner svg ... */ ></svg>
                     <p className="text-gray-600">{t('auth.processingSocialLogin')}</p> 
                </div>
            </div>
        );
    }

    return (
        // --- JSX (inchangé par rapport à la version précédente, utilise maintenant loginMutation.isPending et apiError) ---
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-100/30 px-4 py-12">
            <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-xl shadow-lg">
                <div className="flex flex-col items-center">
                    <img className="h-16 w-auto mb-4" src={logoUrl} alt="Sublymus Logo" />
                    <h2 className="text-2xl font-bold tracking-tight text-center text-gray-900">
                        {t('loginPage.title')}
                    </h2>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {apiError && (
                        <div className="p-3 rounded-md bg-red-50 border border-red-200">
                            <p className="text-sm text-red-700">{apiError}</p>
                        </div>
                    )}
                    <div className="relative">
                        <label htmlFor="email-address" className="sr-only">{t('loginPage.emailLabel')}</label>
                        <IoMailOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        <input id="email-address" name="email" type="email" autoComplete="email" required
                            className={`block w-full rounded-md shadow-sm sm:text-sm h-11 pl-10 pr-3 ${apiError && !email ? 'border-red-300 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`} // Style erreur si champ vide après erreur
                            placeholder={t('loginPage.emailPlaceholder')}
                            value={email} onChange={(e) => setEmail(e.target.value)} disabled={loginMutation.isPending || isProcessingToken}
                        />
                    </div>
                    <div className="relative">
                        <label htmlFor="password" className="sr-only">{t('loginPage.passwordLabel')}</label>
                        <IoLockClosedOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        <input id="password" name="password" type="password" autoComplete="current-password" required
                            className={`block w-full rounded-md shadow-sm sm:text-sm h-11 pl-10 pr-3 ${apiError && !password ? 'border-red-300 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                            placeholder={t('loginPage.passwordPlaceholder')}
                            value={password} onChange={(e) => setPassword(e.target.value)} disabled={loginMutation.isPending || isProcessingToken}
                        />
                    </div>
                    <div className="flex items-center justify-end text-sm"> {/* Pas de remember me, juste lien mdp oublié */}
                        <a href="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
                            {t('loginPage.forgotPasswordLink')}
                        </a>
                    </div>
                    <div>
                        <button type="submit" disabled={loginMutation.isPending || isProcessingToken}
                            className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2.5 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70"
                        >
                            {loginMutation.isPending ? (
                                <svg className="animate-spin h-5 w-5 text-white" /* ... spinner svg ... */ ></svg>
                            ) : (
                                t('loginPage.loginButton')
                            )}
                        </button>
                    </div>
                </form>

                <div className="relative mt-6">
                    {/* ... séparateur ... */}
                </div>
                <div className="mt-6 grid grid-cols-1 gap-3">
                    <button  disabled={isProcessingToken}  onClick={() => handleSocialLogin('google')} type="button"
                        className="inline-flex w-full justify-center items-center gap-3 rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-500 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        <svg className="h-5 w-5" /* ... icône google svg ... */ ></svg>
                        <span>{t('loginPage.googleButton')}</span>
                    </button>
                    {/* ... autres boutons sociaux ... */}
                </div>
            </div>
        </div>
    );
}