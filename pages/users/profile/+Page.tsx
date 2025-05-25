// pages/profile/+Page.tsx (ou chemin settings/profile)

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetMe, useUpdateUser, useLogoutAllDevices, useDeleteAccount, queryClient } from '../../../api/ReactSublymusApi'; // Importer tous les hooks nécessaires
import logger from '../../../api/Logger';
import { ApiError } from '../../../api/SublymusApi';
import { IoCameraOutline, IoMailOutline, IoLockClosedOutline, IoLogOutOutline, IoTrash } from 'react-icons/io5';
import { Topbar } from '../../../Components/TopBar/TopBar';
import { PageNotFound } from '../../../Components/PageNotFound/PageNotFound';
import { ConfirmDelete } from '../../../Components/Confirm/ConfirmDelete';
import { useChildViewer } from '../../../Components/ChildViewer/useChildViewer';
import { ChildViewer } from '../../../Components/ChildViewer/ChildViewer';
import { getImg } from '../../../Components/Utils/StringFormater';
import { useGlobalStore } from '../../index/StoreStore';
import { Button } from '../../../Components/Button/Button';

export { Page };

// Type pour l'état du formulaire de profil
type ProfileFormState = {
  full_name?: string;
  avatarFile?: File | null; // Fichier pour nouvel avatar
};
// Type pour l'état du formulaire de mot de passe
type PasswordFormState = {
  current_password?: string; // Optionnel selon API
  password?: string;
  password_confirmation?: string;
};

function Page() {
  const { t, i18n } = useTranslation();
  const { openChild } = useChildViewer();
  const { currentStore } = useGlobalStore()

  // --- Récupération Données Utilisateur ---
  const { data: meData, isLoading: isLoadingMe, isError: isMeError, error: meError } = useGetMe({
    // Activer seulement si on pense être connecté (vérifier token?)
    // enabled: !!useAuthStore.getState().token
  });
  const currentUser = meData?.user; // L'objet User complet avec adresses/téléphones

  // --- États Locaux ---
  // Profil
  const [profileForm, setProfileForm] = useState<ProfileFormState>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [profileErrors, setProfileErrors] = useState<{ [key: string]: string }>({});
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  // Mot de passe
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({});
  const [passwordErrors, setPasswordErrors] = useState<{ [key: string]: string }>({});
  // Langue
  const [selectedLocale, setSelectedLocale] = useState(i18n.language);
  // Erreurs API générales
  const [apiError, setApiError] = useState<string | null>(null);

  // --- Mutations ---
  const updateUserMutation = useUpdateUser();
  const logoutAllMutation = useLogoutAllDevices();
  const deleteAccountMutation = useDeleteAccount();
  const isLoadingMutation = updateUserMutation.isPending || logoutAllMutation.isPending || deleteAccountMutation.isPending;

  // Initialiser le formulaire profil quand les données user arrivent
  useEffect(() => {
    if (currentUser) {
      setProfileForm({ full_name: currentUser.full_name ?? '' });
      setAvatarPreview(null); // Reset preview
      setProfileErrors({});
      // Initialiser la langue sélectionnée
      setSelectedLocale(currentUser.locale ?? i18n.language);
    }
  }, [currentUser, i18n.language]);

  // --- Détection Changements Profil ---
  const profileHasChanges = useMemo(() => {
    if (!currentUser) return false;
    return (profileForm.full_name !== (currentUser.full_name ?? '')) || !!profileForm.avatarFile;
  }, [profileForm, currentUser]);

  // --- Handlers Profil ---
  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
    setProfileErrors(prev => ({ ...prev, [name]: '' }));
    setApiError(null);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (avatarPreview) URL.revokeObjectURL(avatarPreview); // Nettoyer ancienne preview locale

    if (file) {
      // TODO: Validation taille/type image avatar
      setProfileForm(prev => ({ ...prev, avatarFile: file }));
      setAvatarPreview(URL.createObjectURL(file));
      setProfileErrors(prev => ({ ...prev, avatarFile: '' }));
      setApiError(null);
    } else {
      setProfileForm(prev => ({ ...prev, avatarFile: null }));
      setAvatarPreview(null);
    }
    e.target.value = ''; // Reset input
  };

  const handleProfileSave = () => {
    setProfileErrors({});
    setApiError(null);
    if (!profileHasChanges || updateUserMutation.isPending) return;

    // Validation locale
    if (!profileForm.full_name || profileForm.full_name.trim().length < 3) {
      setProfileErrors({ full_name: t('registerPage.validation.nameRequired') });
      return;
    }

    let dataChanged: any = {};

    if (profileForm.full_name !== (currentUser?.full_name ?? '')) {
      dataChanged.full_name = profileForm.full_name;
    }
    if (profileForm.avatarFile) {
      dataChanged.photo = [profileForm.avatarFile]; // Juste pour indiquer qu'il y a un fichier
    }

    // Si rien n'a changé (ne devrait pas arriver si bouton activé)
    if (Object.keys(dataChanged).length === 0) return;

    // Appeler la mutation updateUser qui gère FormData
    updateUserMutation.mutate({
      data: dataChanged
    }, {
      onSuccess: (data) => {
        logger.info("Profile updated successfully", data.user);
        // Reset : Vider le fichier et la preview locale
        setProfileForm(prev => ({ ...prev, avatarFile: null }));
        setAvatarPreview(null);
        // Mettre à jour l'original implicitement via invalidation cache 'me' par le hook
        queryClient.invalidateQueries({ queryKey: ['me'] }); // Forcer rafraîchissement
        // Afficher toast succès?
      },
      onError: (error: ApiError) => {
        logger.error({ error }, "Profile update failed");
        setApiError(error.message);
      }
    });
  };

  // --- Handlers Sécurité ---
  const handlePasswordChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordErrors({});
    setApiError(null);
    if (updateUserMutation.isPending) return;

    const { password, password_confirmation, current_password } = passwordForm;
    let errors: { [key: string]: string } = {};
    let isValid = true;

    // Ajouter validation mot de passe actuel si nécessaire/possible
    if (!current_password) {
      errors.current_password = t('registerPage.validation.currentPasswordRequired'); isValid = false;
    }

    if (!password || password.length < 8) {
      errors.password = t('registerPage.validation.passwordLength'); isValid = false;
    }
    if (password !== password_confirmation) {
      errors.password_confirmation = t('registerPage.validation.passwordMismatch'); isValid = false;
    }
    setPasswordErrors(errors);
    if (!isValid) return;

    updateUserMutation.mutate({
      data: passwordForm
    }, {
      onSuccess: () => {
        logger.info("Password changed successfully");
        setPasswordForm({}); // Vider le formulaire mdp
        // Afficher toast succès?
      },
      onError: (error: ApiError) => {
        logger.error({ error }, "Password change failed");
        setApiError(error.message);
        // Afficher toast erreur?
      }
    });
  };

  const handleLogoutAll = () => {
    if (logoutAllMutation.isPending) return;
    openChild(
      <ChildViewer title={t('profilePage.security.logoutAllConfirmTitle')}>
        <ConfirmDelete // Utiliser ConfirmDelete pour avoir une structure titre/description
          // Ne pas afficher le titre interne de ConfirmDelete si ChildViewer a déjà un titre
          title={t('profilePage.security.logoutAllConfirmTitle')} // Redondant si ChildViewer a un titre
          description={t('profilePage.security.logoutAllConfirmDesc')} // Ajout Description
          confirmText={t('profilePage.security.logoutAllButton')} // Texte du bouton Confirmer
          cancelText={t('common.cancel')} // Texte du bouton Annuler
          isDanger={false} // Pas une action destructive "rouge"
          isLoading={logoutAllMutation.isPending} // Passer état chargement
          onCancel={() => openChild(null)}
          onDelete={() => { // Utiliser onDelete comme callback de confirmation
            logoutAllMutation.mutate(undefined, {
              onSuccess: () => {
                logger.info("Logout from all devices successful.");
                openChild(null); // Fermer après succès
                // Afficher toast succès?
              },
              onError: (error: ApiError) => {
                logger.error({ error }, "Logout all devices failed.");
                setApiError(error.message); // Afficher erreur sur la page principale?
                openChild(null); // Fermer même en cas d'erreur?
                // Afficher toast erreur?
              }
            });
          }}
        />
      </ChildViewer>,
      { background: '#3455', blur: 3 } // Fond rouge pour danger
    );

  };

  const handleDeleteAccount = () => {
    if (deleteAccountMutation.isPending) return;
    openChild(
      <ChildViewer>
        <ConfirmDelete
          title={t('profilePage.security.deleteAccountConfirmTitle')}
          warningText={t('profilePage.security.deleteAccountWarning')}
          // Ajouter confirmation par email/mdp si besoin de sécurité accrue
          onCancel={() => openChild(null)}
          onDelete={() => {
            deleteAccountMutation.mutate(undefined, { // Pas d'argument
              onSuccess: () => {
                logger.info("Account deletion requested successfully.");
                // La déconnexion et redirection est gérée par le hook useDeleteAccount
              },
              onError: (error: ApiError) => {
                logger.error({ error }, "Account deletion failed.");
                setApiError(error.message);
                openChild(null);
              }
            });
          }}
        />
      </ChildViewer>,
      { background: 'rgba(220, 38, 38, 0.7)', blur: 3 } // Fond rouge pour danger
    );
  };

  // --- Handler Préférences ---
  const handleLocaleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = event.target.value;
    setSelectedLocale(newLocale);
    i18n.changeLanguage(newLocale); // Changer langue UI
    localStorage.setItem('user_locale_pref', newLocale); // Sauver dans localStorage pour persistance

    // Appeler l'API pour sauvegarder la préférence (utiliser updateUser)
    const formData = new FormData();
    formData.append('locale', newLocale);
    updateUserMutation.mutate({
      data: {
        locale: newLocale
      }
    }, {
      onSuccess: () => {
        logger.info(`User locale preference updated to ${newLocale}`);
        queryClient.invalidateQueries({ queryKey: ['me'] }); // Recharger 'me' pour confirmer
      },
      onError: (error) => {
        logger.error({ error }, "Failed to save user locale preference.");
        // Revertir le changement local? Ou juste afficher erreur?
        i18n.changeLanguage(currentUser?.locale ?? 'fr'); // Revenir à l'ancienne langue?
      }
    });
  };


  // --- Rendu ---
  if (isLoadingMe) return <div className="p-6 text-center text-gray-500">{t('common.loading')}</div>;
  if (isMeError) return <div className="p-6 text-center text-red-500">{meError?.message || t('error_occurred')}</div>;
  if (!currentUser) return <PageNotFound title={t('auth.notAuthenticated')} />;


  // URL Avatar
  const avatarUrl = avatarPreview ?? (currentUser.photo?.[0] ? getImg(currentUser.photo[0], undefined, currentStore?.url).match(/url\("?([^"]+)"?\)/)?.[1] : null);

  return (
    <div className="w-full pb-48 min-h-screen flex flex-col bg-gray-100">
      <Topbar back={true} title={t('profilePage.title')} />
      <main className="w-full max-w-3xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-8">

        {/* Section Profil */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-100">
            <h3 className="text-lg leading-6 font-medium text-gray-900">{t('profilePage.profile.title')}</h3>
          </div>
          <div className="px-4 py-5 sm:p-6 space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden ring-2 ring-offset-2 ring-blue-200">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={t('profilePage.profile.avatarAlt')} className="w-full h-full object-cover" />
                ) : (
                  // Initiales
                  <span className="text-2xl font-semibold text-gray-500">{currentUser.full_name?.substring(0, 2).toUpperCase() || '?'}</span>
                )}
                <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                  <IoCameraOutline size={24} />
                </label>
                <input ref={profileFileInputRef} id="avatar-upload" name="avatarFile" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <button type="button" onClick={() => profileFileInputRef.current?.click()} className="text-sm text-blue-600 hover:underline">{t('profilePage.profile.changeAvatar')}</button>
            </div>
            {/* Email (Lecture seule) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('profilePage.profile.emailLabel')}</label>
              <div className="mt-1 flex items-center gap-2">
                <IoMailOutline className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">{currentUser.email}</span>
              </div>
            </div>
            {/* Nom Complet */}
            <div>
              <label htmlFor="profile-full-name" className="block text-sm font-medium text-gray-700">{t('profilePage.profile.nameLabel')}</label>
              <input type="text" name="full_name" id="profile-full-name" value={profileForm.full_name || ''} onChange={handleProfileInputChange}
                className={`mt-1 px-4 block w-full md:w-2/3 rounded-md shadow-sm sm:text-sm h-10 ${profileErrors.full_name ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`} />
              {profileErrors.full_name && <p className="mt-1 text-xs text-red-600">{profileErrors.full_name}</p>}
            </div>
            {/* Erreur API Profil */}
            {profileErrors.api && <p className="mt-1 text-sm text-red-600">{profileErrors.api}</p>}
          </div>
          {/* Pied de page Profil */}
          <div className="px-4 py-3 sm:px-6 bg-gray-50 text-right rounded-b-lg">
            <button type="button" onClick={handleProfileSave} disabled={!profileHasChanges || updateUserMutation.isPending}
              className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateUserMutation.isPending && updateUserMutation.variables?.data.full_name !== undefined ? t('common.saving') : t('common.saveChanges')}
            </button>
          </div>
        </section>

        {/* Section Adresses/Téléphones (Liens Simples) */}
        {/* <section className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">{t('profilePage.contact.title')}</h3>
            <div className="mt-4 space-y-3">
              <Link href="/settings/addresses" className="flex items-center justify-between text-sm text-blue-600 hover:text-blue-800 p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition">
                <span className="flex items-center gap-2"><IoLocationOutline /> {t('profilePage.contact.manageAddresses')}</span>
                <IoChevronForward />
              </Link>
              <Link href="/settings/phones" className="flex items-center justify-between text-sm text-blue-600 hover:text-blue-800 p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition">
                <span className="flex items-center gap-2"><IoCallOutline /> {t('profilePage.contact.managePhones')}</span>
                <IoChevronForward />
              </Link>
            </div>
          </div>
        </section> */}

        {/* Section Préférences */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-100">
            <h3 className="text-lg leading-6 font-medium text-gray-900">{t('profilePage.prefs.title')}</h3>
          </div>
          <div className="px-4 py-5 sm:p-6 space-y-6">
            {/* Langue */}
            <div>
              <label htmlFor="profile-locale" className="block text-sm font-medium text-gray-700">{t('profilePage.prefs.languageLabel')}</label>
              <select id="profile-locale" name="locale" value={selectedLocale} onChange={handleLocaleChange}
                className="mt-1 block w-full md:w-1/2 rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm h-10 cursor-pointer">
                {/*i18n.languages*/['fr'].map(lang => (
                  <option key={lang} value={lang}>{t(`languages.${lang}`, lang)}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Section Sécurité */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-100">
            <h3 className="text-lg leading-6 font-medium text-gray-900">{t('profilePage.security.title')}</h3>
          </div>
          <div className="px-4 py-5 sm:p-6 space-y-6">
            {/* Changement Mot de Passe */}
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <h4 className="text-base font-medium text-gray-800">{t('profilePage.security.changePasswordTitle')}</h4>
              {/*  mot de passe actuel  */}
              <div className="relative">
                <label htmlFor="new-password" className="sr-only">{t('resetPasswordPage.passwordLabel')}</label>
                <IoLockClosedOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input id="new-password" name="password" type="password" required autoComplete="new-password"
                  className={`block w-full rounded-md shadow-sm sm:text-sm h-10 pl-10 pr-3 ${passwordErrors.password ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                  placeholder={t('resetPasswordPage.passwordPlaceholder')}
                  value={passwordForm.current_password || ''} onChange={(e) => { setPasswordForm(p => ({ ...p, current_password: e.target.value })); setPasswordErrors(p => ({ ...p, password: '' })); }} disabled={updateUserMutation.isPending}
                />
                {passwordErrors.current_password && <p className="mt-1 text-xs text-red-600">{passwordErrors.current_password}</p>}
              </div>
              {/* Nouveau Mot de Passe */}
              <div className="relative">
                <label htmlFor="new-password" className="sr-only">{t('resetPasswordPage.passwordLabel')}</label>
                <IoLockClosedOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input id="new-password" name="password" type="password" required autoComplete="new-password"
                  className={`block w-full rounded-md shadow-sm sm:text-sm h-10 pl-10 pr-3 ${passwordErrors.password ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                  placeholder={t('resetPasswordPage.passwordPlaceholder')}
                  value={passwordForm.password || ''} onChange={(e) => { setPasswordForm(p => ({ ...p, password: e.target.value })); setPasswordErrors(p => ({ ...p, password: '' })); }} disabled={updateUserMutation.isPending}
                />
                {passwordErrors.password && <p className="mt-1 text-xs text-red-600">{passwordErrors.password}</p>}
              </div>
              {/* Confirmation Mot de Passe */}
              <div className="relative">
                <label htmlFor="password-confirmation" className="sr-only">{t('resetPasswordPage.passwordConfirmLabel')}</label>
                <IoLockClosedOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input id="password-confirmation" name="password_confirmation" type="password" required autoComplete="new-password"
                  className={`block w-full rounded-md shadow-sm sm:text-sm h-10 pl-10 pr-3 ${passwordErrors.password_confirmation ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                  placeholder={t('resetPasswordPage.passwordConfirmPlaceholder')}
                  value={passwordForm.password_confirmation || ''} onChange={(e) => { setPasswordForm(p => ({ ...p, password_confirmation: e.target.value })); setPasswordErrors(p => ({ ...p, password_confirmation: '' })); }} disabled={updateUserMutation.isPending}
                />
                {passwordErrors.password_confirmation && <p className="mt-1 text-xs text-red-600">{passwordErrors.password_confirmation}</p>}
              </div>
              {/* Erreur API Mdp */}
              {passwordErrors.api && <p className="mt-1 text-sm text-red-600">{passwordErrors.api}</p>}
              {/* Bouton Sauvegarder MDP */}
              <div className="text-right">
                <button type="submit" disabled={updateUserMutation.isPending}
                  className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateUserMutation.isPending && updateUserMutation.variables?.data.password ? t('common.saving') : t('profilePage.security.changePasswordButton')}
                </button>
              </div>
            </form>

            {/* Déconnexion Autres Appareils */}
            <div className="pt-6 border-t border-gray-100">
              <h4 className="text-base font-medium text-gray-800">{t('profilePage.security.logoutAllTitle')}</h4>
              <p className="text-sm text-gray-500 mt-1 mb-3">{t('profilePage.security.logoutAllDesc')}</p>
              <Button
                title={t('profilePage.security.logoutAllButton')}
                icon={<IoLogOutOutline className='w-5 h-5' />}
                onClick={handleLogoutAll}
                // loading={logoutAllMutation.isPending} // Ajouter prop loading à Button
                className="!bg-yellow-50 !text-yellow-700 hover:!bg-yellow-100" // Style avertissement
                style={{ width: 'fit-content' }}
              />
            </div>

            {/* Suppression Compte (Zone Danger) */}
            <div className="pt-6 border-t border-red-200 bg-red-50 -mx-4 -mb-5 sm:-mx-6 sm:-mb-6 px-4 pb-5 sm:px-6 rounded-b-lg">
              <h4 className="text-base font-medium text-red-800">{t('profilePage.security.deleteAccountTitle')}</h4>
              <p className="text-sm text-red-700 mt-1 mb-3">{t('profilePage.security.deleteAccountWarning')}</p>
              <Button
                title={t('profilePage.security.deleteAccountConfirmTitle')}
                icon={<IoTrash className='w-5 h-5' />}
                onClick={handleDeleteAccount}
                // loading={deleteAccountMutation.isPending}
                className="!bg-red-600 !text-white hover:!bg-red-700" // Style Danger
                style={{ width: 'fit-content' }}
              />
            </div>
          </div>
          {/* Pas de pied de page save ici */}
        </section>

      </main>
    </div>
  );
}