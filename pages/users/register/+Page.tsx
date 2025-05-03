// pages/register/+Page.tsx

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRegister } from '../../../api/ReactSublymusApi'; // ✅ Hook API
import logger from '../../../api/Logger';
import { ApiError } from '../../../api/SublymusApi';
import { IoPersonOutline, IoMailOutline, IoLockClosedOutline } from 'react-icons/io5';
import logoUrl from '../../../renderer/logo.svg';
import { Link } from '../../../renderer/Link'; // Pour lien vers connexion

export { Page };

function Page() {
    const { t } = useTranslation();
    const registerMutation = useRegister(); // ✅ Hook API

    // --- État du Formulaire ---
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    // Erreurs API ou de validation locale
    const [formError, setFormError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string | undefined }>({});
    // État pour afficher le message de succès (vérifiez email)
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    // --- Validation Locale Simple ---
    // (Vine s'en charge côté API, mais une validation front peut améliorer l'UX)
    const validateForm = (): boolean => {
        const errors: { [key: string]: string | undefined } = {};
        let isValid = true;
        setFormError(null); // Reset global error

        if (fullName.trim().length < 3) {
            errors.fullName = t('registerPage.validation.nameRequired');
            isValid = false;
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = t('registerPage.validation.emailInvalid');
            isValid = false;
        }
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
        setShowSuccessMessage(false);

        if (!validateForm() || registerMutation.isPending) return;

        registerMutation.mutate(
            { full_name: fullName.trim(), email: email.trim(), password, password_confirmation: passwordConfirmation },
            {
                onSuccess: (data) => {
                    logger.info("Registration successful", { userId: data.user_id });
                    setShowSuccessMessage(true); // Afficher le message de succès
                    // Optionnel: Vider le formulaire? Non, garder pour contexte.
                },
                onError: (error: ApiError) => {
                    logger.warn({ error }, "Registration failed");
                    if (error.status === 409) { // Conflit email existe déjà
                        setFormError(t('auth.emailConflict'));
                        setFieldErrors(prev => ({ ...prev, email: t('auth.emailConflict') })); // Marquer champ email
                    } else if (error.status === 422 && error.body?.errors) { // Erreurs validation Vine
                        // Mapper erreurs Vine aux champs locaux
                        const vineErrors = error.body.errors.reduce((acc: any, err: any) => {
                            acc[err.field.replace('_confirmation', 'Confirmation')] = err.message; // Adapter noms champs
                            return acc;
                        }, {});
                        setFieldErrors(vineErrors);
                        setFormError(t('validationFailed')); // Message global
                    }
                    else {
                        setFormError(error.message || t('auth.registerFailed'));
                    }
                }
            }
        );
    };

    // --- Rendu ---
    // Si succès, afficher message "vérifiez email" au lieu du formulaire
    if (showSuccessMessage) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-green-100/30 px-4 py-12">
                <div className="w-full max-w-md text-center bg-white p-8 sm:p-10 rounded-xl shadow-lg">
                     <IoMailOutline className="mx-auto h-12 w-12 text-green-500" />
                     <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
                          {t('registerPage.successTitle')} 
                     </h2>
                     <p className="mt-3 text-sm text-gray-600">
                         {t('registerPage.successMessage', { email: email })} 
                     </p>
                      <p className="mt-6 text-sm">
                          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
                              {t('registerPage.backToLogin')} 
                          </Link>
                           {/* Optionnel: Bouton pour renvoyer l'email */}
                           {/* <span className="mx-2 text-gray-300">|</span>
                           <Link href={`/resend-verification?email=${encodeURIComponent(email)}`} className="font-medium text-gray-500 hover:text-gray-700 hover:underline">
                               {t('registerPage.resendLink')}
                           </Link> */}
                      </p>
                </div>
            </div>
        );
    }

    // Afficher le formulaire d'inscription
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-100/30 px-4 py-12">
            <div className="w-full max-w-md space-y-6 bg-white p-8 sm:p-10 rounded-xl shadow-lg">
                {/* Logo et Titre */}
                <div className="flex flex-col items-center">
                    <img className="h-16 w-auto mb-4" src={logoUrl} alt="Sublymus Logo" />
                    <h2 className="text-2xl font-bold tracking-tight text-center text-gray-900">
                         {t('registerPage.title')} 
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                         {t('registerPage.subtitle')} {' '} 
                        <Link href="/users/login" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
                             {t('registerPage.loginLink')} 
                        </Link>
                    </p>
                </div>

                {/* Formulaire */}
                <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                     {/* Erreur API Globale */}
                     {formError && !fieldErrors.email && !fieldErrors.password && !fieldErrors.passwordConfirmation && !fieldErrors.fullName && ( // Afficher seulement si pas d'erreur spécifique
                         <div className="p-3 rounded-md bg-red-50 border border-red-200">
                             <p className="text-sm text-red-700">{formError}</p>
                         </div>
                     )}

                     {/* Champ Nom Complet */}
                     <div className="relative">
                          <label htmlFor="full-name" className="sr-only">{t('registerPage.nameLabel')}</label>
                          <IoPersonOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                          <input id="full-name" name="full_name" type="text" autoComplete="name" required
                                 className={`block w-full rounded-md shadow-sm sm:text-sm h-11 pl-10 pr-3 ${fieldErrors.fullName ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                                 placeholder={t('registerPage.namePlaceholder')} 
                                 value={fullName} onChange={(e) => { setFullName(e.target.value); setFieldErrors(p=>({...p, fullName: undefined})); }} disabled={registerMutation.isPending}
                           />
                           {fieldErrors.fullName && <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>}
                     </div>

                     {/* Champ Email */}
                     <div className="relative">
                          <label htmlFor="email-address" className="sr-only">{t('registerPage.emailLabel')}</label>
                          <IoMailOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                          <input id="email-address" name="email" type="email" autoComplete="email" required
                                  className={`block w-full rounded-md shadow-sm sm:text-sm h-11 pl-10 pr-3 ${fieldErrors.email ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                                  placeholder={t('registerPage.emailPlaceholder')} 
                                  value={email} onChange={(e) => { setEmail(e.target.value); setFieldErrors(p=>({...p, email: undefined})); }} disabled={registerMutation.isPending}
                           />
                           {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
                     </div>

                      {/* Champ Mot de Passe */}
                      <div className="relative">
                          <label htmlFor="password" className="sr-only">{t('registerPage.passwordLabel')}</label>
                          <IoLockClosedOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                          <input id="password" name="password" type="password" autoComplete="new-password" required
                                  className={`block w-full rounded-md shadow-sm sm:text-sm h-11 pl-10 pr-3 ${fieldErrors.password ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                                  placeholder={t('registerPage.passwordPlaceholder')} 
                                  value={password} onChange={(e) => { setPassword(e.target.value); setFieldErrors(p=>({...p, password: undefined})); }} disabled={registerMutation.isPending}
                          />
                          {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
                      </div>

                       {/* Champ Confirmation Mot de Passe */}
                       <div className="relative">
                           <label htmlFor="password-confirmation" className="sr-only">{t('registerPage.passwordConfirmLabel')}</label> 
                           <IoLockClosedOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                           <input id="password-confirmation" name="password_confirmation" type="password" autoComplete="new-password" required
                                   className={`block w-full rounded-md shadow-sm sm:text-sm h-11 pl-10 pr-3 ${fieldErrors.passwordConfirmation ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                                   placeholder={t('registerPage.passwordConfirmPlaceholder')} 
                                   value={passwordConfirmation} onChange={(e) => { setPasswordConfirmation(e.target.value); setFieldErrors(p=>({...p, passwordConfirmation: undefined})); }} disabled={registerMutation.isPending}
                           />
                           {fieldErrors.passwordConfirmation && <p className="mt-1 text-xs text-red-600">{fieldErrors.passwordConfirmation}</p>}
                       </div>

                    {/* Bouton Inscription */}
                    <div className="pt-2"> {/* Ajouter espace avant bouton */}
                        <button
                            type="submit"
                            disabled={registerMutation.isPending}
                            className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2.5 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70"
                        >
                             {registerMutation.isPending ? (
                                 <svg className="animate-spin h-5 w-5 text-white" /* ... spinner svg ... */ ></svg>
                             ) : (
                                 t('registerPage.registerButton') 
                             )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
