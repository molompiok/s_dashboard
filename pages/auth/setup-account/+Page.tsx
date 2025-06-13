// pages/setup-account/+Page.tsx

import { useState, useEffect } from 'react';
import { usePageContext } from '../../../renderer/usePageContext';
import { useTranslation } from 'react-i18next';
// Importer le hook API pour finaliser le setup
import { useSetupAccount } from '../../../api/ReactSublymusApi'; // Hook à créer
import logger from '../../../api/Logger';
import { ApiError } from '../../../api/SublymusApi';
import { IoLockClosedOutline, IoCheckmarkCircleOutline, IoWarningOutline } from 'react-icons/io5';
import logoUrl from '../../../renderer/logo.png';
import { Link } from '../../../renderer/Link'; // Pour lien vers connexion après succès

// S'assurer que le hook useSetupAccount est créé dans ReactSublymusApi.tsx
// et qu'il appelle api.auth.setupAccount({ token, password, password_confirmation })

export { Page };

function Page() {
    const { t } = useTranslation();
    const { urlParsed } = usePageContext();
    const setupAccountMutation = useSetupAccount(); // ✅ Hook API

    // --- État ---
    const [token, setToken] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    // Erreurs API ou validation locale
    const [formError, setFormError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string | undefined }>({});
    // État pour affichage succès/erreur finale
    const [setupStatus, setSetupStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState<string>('');

    // Extraire le token de l'URL au montage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(urlParsed.search ?? window.location.search);
            const urlToken = params.get('token');
            if (urlToken) {
                setToken(urlToken);
                logger.info("Account setup token found in URL.");
            } else {
                logger.error("Account setup token missing from URL.");
                setSetupStatus('error');
                // Utiliser la clé de resetPassword car le problème est similaire
                setStatusMessage(t('auth.resetPassword.missingToken'));
            }
        }
    }, [urlParsed.search, t]); // Ajouter t

    // --- Validation Locale ---
    const validateForm = (): boolean => {
        const errors: { [key: string]: string | undefined } = {};
        let isValid = true;
        setFormError(null);

        if (password.length < 8) {
            errors.password = t('registerPage.validation.passwordLength');
            isValid = false;
        }
        if (password !== passwordConfirmation) {
            errors.passwordConfirmation = t('registerPage.validation.passwordMismatch');
            isValid = false;
        }
        setFieldErrors(errors);
        return isValid;
    };

    // --- Handler Soumission ---
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError(null);
        setSetupStatus('idle');

        if (!token) {
            setFormError(t('auth.resetPassword.missingToken')); // Réutiliser clé
            return;
        }
        if (!validateForm() || setupAccountMutation.isPending) return;

        setupAccountMutation.mutate(
            { token, password, password_confirmation: passwordConfirmation },
            {
                onSuccess: (data) => {
                    logger.info("Account setup successful");
                    setSetupStatus('success');
                    setStatusMessage(data.message || t('auth.setupAccount.success')); // Utiliser message API ou défaut
                    setPassword(''); // Vider champs
                    setPasswordConfirmation('');
                },
                onError: (error: ApiError) => {
                    logger.warn({ error }, "Account setup failed");
                    setSetupStatus('error');
                    // Afficher erreur API (peut être 'invalidToken' ou autre)
                    // Utiliser la clé de reset password pour token invalide
                    setStatusMessage(error.message || t('auth.setupAccount.genericError'));
                }
            }
        );
    };

    // --- Rendu ---
    // Afficher message final si succès ou erreur (token invalide initialement ou après soumission)
    if (setupStatus === 'success' || setupStatus === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-100/30 px-4 py-12">
                <div className={`w-full max-w-md text-center bg-white p-8 sm:p-10 rounded-xl shadow-lg ${setupStatus === 'error' ? 'border-2 border-red-300' : ''}`}>
                    {setupStatus === 'success' ? (
                        <IoCheckmarkCircleOutline className="mx-auto h-12 w-12 text-green-500" />
                    ) : (
                        <IoWarningOutline className="mx-auto h-12 w-12 text-red-500" />
                    )}
                    <h2 className={`mt-4 text-2xl font-bold tracking-tight ${setupStatus === 'error' ? 'text-red-800' : 'text-gray-900'}`}>
                        {setupStatus === 'success' ? t('setupAccountPage.successTitle') : t('setupAccountPage.errorTitle')}
                    </h2>
                    <p className="mt-3 text-sm text-gray-600">
                        {statusMessage} {/* Message dynamique */}
                    </p>
                    <p className="mt-6 text-sm">
                        <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
                            {t('setupAccountPage.backToLogin')}
                        </Link>
                    </p>
                </div>
            </div>
        );
    }

    // Afficher le formulaire si token présent et statut idle
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-100/30 px-4 py-12">
            <div className="w-full max-w-md space-y-6 bg-white p-8 sm:p-10 rounded-xl shadow-lg">
                {/* Logo et Titre */}
                <div className="flex flex-col items-center">
                    <img className="h-16 w-auto mb-4" src={logoUrl} alt="Sublymus Logo" />
                    <h2 className="text-2xl font-bold tracking-tight text-center text-gray-900">
                        {t('setupAccountPage.title')}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {t('setupAccountPage.subtitle')}
                    </p>
                </div>

                {/* Formulaire */}
                <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                    {/* Champ Nouveau Mot de Passe */}
                    <div className="relative">
                        <label htmlFor="password" className="sr-only">{t('resetPasswordPage.passwordLabel')}</label> {/* Réutiliser label */}
                        <IoLockClosedOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        <input id="password" name="password" type="password" autoComplete="new-password" required
                            className={`block w-full rounded-md shadow-sm sm:text-sm h-11 pl-10 pr-3 ${fieldErrors.password ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                            placeholder={t('resetPasswordPage.passwordPlaceholder')}
                            value={password} onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: undefined })); }} disabled={setupAccountMutation.isPending} autoFocus
                        />
                        {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
                    </div>

                    {/* Champ Confirmation Mot de Passe */}
                    <div className="relative">
                        <label htmlFor="password-confirmation" className="sr-only">{t('resetPasswordPage.passwordConfirmLabel')}</label> {/* Réutiliser label */}
                        <IoLockClosedOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        <input id="password-confirmation" name="password_confirmation" type="password" autoComplete="new-password" required
                            className={`block w-full rounded-md shadow-sm sm:text-sm h-11 pl-10 pr-3 ${fieldErrors.passwordConfirmation ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                            placeholder={t('resetPasswordPage.passwordConfirmPlaceholder')}
                            value={passwordConfirmation} onChange={(e) => { setPasswordConfirmation(e.target.value); setFieldErrors(p => ({ ...p, passwordConfirmation: undefined })); }} disabled={setupAccountMutation.isPending}
                        />
                        {fieldErrors.passwordConfirmation && <p className="mt-1 text-xs text-red-600">{fieldErrors.passwordConfirmation}</p>}
                    </div>

                    {/* Bouton Finaliser */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={setupAccountMutation.isPending || !token} // Désactivé si pas de token ou en cours
                            className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2.5 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70"
                        >
                            {setupAccountMutation.isPending ? (
                                <svg className="animate-spin h-5 w-5 text-white" /* ... spinner svg ... */ ></svg>
                            ) : (
                                t('setupAccountPage.setupButton')
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

