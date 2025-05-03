// pages/forgot-password/+Page.tsx

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
// Importer le hook API pour demander la réinitialisation (à créer dans ReactSublymusApi)
import { useRequestPasswordReset } from '../../api/ReactSublymusApi';
import logger from '../../api/Logger';
import { ApiError } from '../../api/SublymusApi';
import { IoMailOutline, IoArrowBack } from 'react-icons/io5';
import logoUrl from '../../renderer/logo.svg';
import { Link } from '../../renderer/Link'; // Pour lien retour login
import { Host } from '../../renderer/+config';

// S'assurer que le hook useRequestPasswordReset est créé dans ReactSublymusApi.tsx
// et qu'il appelle api.auth.forgotPassword(email)

export { Page };

function Page() {
    const { t } = useTranslation();
    // Utiliser la mutation pour demander la réinitialisation
    const requestResetMutation = useRequestPasswordReset();

    const [email, setEmail] = useState('');
    // État pour afficher le message de succès/confirmation
    const [requestSent, setRequestSent] = useState(false);
    // Erreur API ou validation
    const [formError, setFormError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError(null);
        setRequestSent(false); // Reset success message on new attempt

        // Validation locale simple
        if (!email || !email.includes('@') || email.trim().length < 5) {
            setFormError(t('forgotPasswordPage.validation.emailInvalid'));
            return;
        }
        if (requestResetMutation.isPending) return;

        // Appeler la mutation
        requestResetMutation.mutate(
            {
                email:  email.trim(), 
                callback_url: `${Host}/reset-password`
            }, // Passer l'email et l'URL callback frontend
            {
                onSuccess: (data:any) => {
                    logger.info(`Password reset email request sent for ${email}`);
                    setRequestSent(true); // Afficher le message de confirmation
                },
                onError: (error: ApiError) => {
                    logger.error({ error }, `Password reset request failed for ${email}`);
                    // Afficher une erreur générique même si l'API retourne un succès générique
                    // pour ne pas révéler si l'email existe, sauf si c'est une erreur serveur claire (5xx)
                    if (error.status >= 500) {
                        setFormError(error.message || t('error_occurred'));
                    } else {
                        // Dans la plupart des cas (y compris 404 ou autre erreur métier masquée),
                        // on affiche quand même le message de succès générique pour la sécurité.
                         setRequestSent(true);
                         // Optionnel: logguer l'erreur pour debug interne sans l'afficher
                         // logger.warn("Password reset seemed to fail client-side but API might have succeeded or masked error", error);
                    }
                }
            }
        );
    };

    // Afficher le message de confirmation si la requête a été envoyée
    if (requestSent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-100/30 px-4 py-12">
                <div className="w-full max-w-md text-center bg-white p-8 sm:p-10 rounded-xl shadow-lg">
                     <IoMailOutline className="mx-auto h-12 w-12 text-blue-500" />
                     <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
                          {t('forgotPasswordPage.successTitle')} 
                     </h2>
                     <p className="mt-3 text-sm text-gray-600">
                          {t('auth.forgotPassword.emailSentConfirmation')} 
                          {' '} {/* Message générique standard */}
                          <span className="font-medium">{email}</span>.
                     </p>
                      <p className="mt-6 text-sm">
                          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 hover:underline inline-flex items-center gap-1">
                              <IoArrowBack className="w-4 h-4"/> {t('registerPage.backToLogin')} 
                          </Link>
                      </p>
                </div>
            </div>
        );
    }


    // Afficher le formulaire
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-100/30 px-4 py-12">
            <div className="w-full max-w-md space-y-6 bg-white p-8 sm:p-10 rounded-xl shadow-lg">
                {/* Logo et Titre */}
                <div className="flex flex-col items-center">
                    <img className="h-16 w-auto mb-4" src={logoUrl} alt="Sublymus Logo" />
                    <h2 className="text-2xl font-bold tracking-tight text-center text-gray-900">
                        {t('forgotPasswordPage.title')} 
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                         {t('forgotPasswordPage.subtitle')} 
                    </p>
                </div>

                {/* Formulaire */}
                <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                     {/* Affichage Erreur Globale */}
                     {formError && (
                         <div className="p-3 rounded-md bg-red-50 border border-red-200">
                             <p className="text-sm text-red-700">{formError}</p>
                         </div>
                     )}

                    {/* Champ Email */}
                    <div className="relative">
                        <label htmlFor="email-address" className="sr-only">{t('loginPage.emailLabel')}</label>
                        <IoMailOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        <input
                            id="email-address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                             className={`block w-full rounded-md shadow-sm sm:text-sm h-11 pl-10 pr-3 ${formError ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                            placeholder={t('loginPage.emailPlaceholder')}
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setFormError(null); }}
                            disabled={requestResetMutation.isPending}
                            autoFocus
                        />
                    </div>

                    {/* Bouton Envoyer */}
                    <div>
                        <button
                            type="submit"
                            disabled={requestResetMutation.isPending || !email.trim()}
                            className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2.5 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70"
                        >
                            {requestResetMutation.isPending ? (
                                <svg className="animate-spin h-5 w-5 text-white" /* ... spinner svg ... */ ></svg>
                            ) : (
                                 t('forgotPasswordPage.sendButton') 
                            )}
                        </button>
                    </div>
                </form>

                 {/* Lien Retour Login */}
                 <div className="text-sm text-center">
                     <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 hover:underline inline-flex items-center gap-1">
                          <IoArrowBack className="w-4 h-4"/> {t('registerPage.backToLogin')} 
                     </Link>
                 </div>

            </div>
        </div>
    );
}
