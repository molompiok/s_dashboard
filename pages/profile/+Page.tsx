// pages/profile/+Page.tsx

import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetMe, useUpdateUser, useLogoutAllDevices, useDeleteAccount, queryClient } from '../../api/ReactSublymusApi';
import logger from '../../api/Logger';
import { ApiError } from '../../api/SublymusApi';
import { IoCameraOutline, IoMailOutline, IoLockClosedOutline, IoLogOutOutline, IoTrash, IoWarningOutline, IoLogInOutline } from 'react-icons/io5';
import { Topbar } from '../../Components/TopBar/TopBar';
import { PageNotFound } from '../../Components/PageNotFound/PageNotFound';
import { ConfirmDelete } from '../../Components/Confirm/ConfirmDelete';
import { useChildViewer } from '../../Components/ChildViewer/useChildViewer';
import { ChildViewer } from '../../Components/ChildViewer/ChildViewer';
import { getMedia } from '../../Components/Utils/StringFormater';
import { useGlobalStore } from '../../api/stores/StoreStore';
import { Button } from '../../Components/Button/Button';
import { showErrorToast, showToast } from '../../Components/Utils/toastNotifications';
import { useAuthStore } from '../../api/stores/AuthStore';
import { navigate } from 'vike/client/router';
import { StateDisplay } from '../../Components/StateDisplay/StateDisplay';
import { buttonStyle } from '../../Components/Button/Style';
import { validateFileSize } from '../../Components/Utils/fileValidation';
import { FileSizeErrorPopup } from '../../Components/FileSizeErrorPopup/FileSizeErrorPopup';

export { Page };

type ProfileFormState = { full_name?: string; avatarFile?: File | null; };
type PasswordFormState = { current_password?: string; password?: string; password_confirmation?: string; };

// 🎨 Styles de base pour les inputs et labels
const labelStyle = "block text-sm font-medium text-gray-700 dark:text-gray-300";
const inputStyle = "pl-4 block w-full rounded-lg shadow-sm border-gray-300 focus:border-teal-500 focus:ring-teal-500 dark:bg-gray-800/50 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-500 sm:text-sm h-10 transition-colors";
const inputErrorStyle = "border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500";
const primaryButtonStyle = buttonStyle
function Page() {
    const { t, i18n } = useTranslation();
    const { openChild } = useChildViewer();
    const { setUser, setToken } = useAuthStore();
    
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
            // Valider la taille du fichier
            const validation = validateFileSize(file);
            if (!validation.isValid && validation.error) {
                openChild(
                    <FileSizeErrorPopup
                        fileName={validation.error.fileName}
                        fileSize={validation.error.fileSize}
                        fileType={validation.error.fileType}
                    />,
                    { background: 'rgba(0, 0, 0, 0.7)', blur: 4 }
                );
                e.target.value = '';
                return;
            }
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
                setUser(data.user)
                showToast("Profil mis à jour avec succès", "SUCCESS")
                queryClient.invalidateQueries({ queryKey: ['me'] }); // Forcer rafraîchissement

            },
            onError: (error: ApiError) => {
                logger.error({ error }, "Profile update failed");
                setApiError(error.message);
                showErrorToast(error)
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
            onSuccess: (data) => {
                logger.info("Password changed successfully");
                setPasswordForm({}); // Vider le formulaire mdp
                setUser(data.user)
                showToast("Profil mis à jour avec succès", "SUCCESS")
            },
            onError: (error: ApiError) => {
                logger.error({ error }, "Password change failed");
                setApiError(error.message);
                showErrorToast(error)
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
                                setUser(undefined)
                                setToken(undefined)
                                openChild(null); // Fermer après succès
                                showToast("Déconnexion de tous les appareils réussie", "SUCCESS")
                            },
                            onError: (error: ApiError) => {
                                logger.error({ error }, "Logout all devices failed.");
                                setApiError(error.message); // Afficher erreur sur la page principale?
                                openChild(null); // Fermer même en cas d'erreur?
                                showErrorToast(error)
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
                                showToast("Compte supprimé définitivement", "SUCCESS")
                                window.location.href = `https://sublymus.com`
                            },
                            onError: (error: ApiError) => {
                                logger.error({ error }, "Account deletion failed.");
                                setApiError(error.message);
                                openChild(null);
                                showErrorToast(error)
                            }
                        });
                    }}
                />
            </ChildViewer>,
            { background: '#3455', blur: 3 } // Fond rouge pour danger
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
            onSuccess: (data) => {
                setUser(data.user)
                showToast("Profil mis à jour avec succès", "SUCCESS")
                logger.info(`User locale preference updated to ${newLocale}`);
                queryClient.invalidateQueries({ queryKey: ['me'] }); // Recharger 'me' pour confirmer
            },
            onError: (error) => {
                logger.error({ error }, "Failed to save user locale preference.");
                showErrorToast(error)
                i18n.changeLanguage(currentUser?.locale ?? 'fr'); // Revenir à l'ancienne langue?
            }
        });
    };


    
    // 2. État d'Erreur Critique (Erreur API ou Utilisateur non trouvé)
    // Si la requête `useGetMe` échoue ou ne renvoie pas d'utilisateur,
    // c'est que la session est probablement invalide. On ne peut pas continuer.
    if (isMeError) {
        // Déterminer le message d'erreur le plus pertinent
        const title = t('auth.authenticationFailed');
        const description = meError?.status === 401
            ? t('auth.sessionExpired')
            : (meError?.message || t('auth.cannotLoadProfile'));

        return (
            <div className="w-full min-h-screen flex flex-col">
                <Topbar back={true} title={t('profilePage.title')} />
                <main className="flex-grow flex items-center justify-center p-4">
                    <StateDisplay
                        variant="danger"
                        icon={IoLogInOutline} // Une icône qui suggère l'action de se connecter
                        title={title}
                        description={description}
                    >
                        {/* Le Call-to-Action est de retourner à la page de connexion */}
                        <a
                            href="/auth/login"
                            className={primaryButtonStyle}
                        >
                            {t('auth.goToLogin')}
                        </a>
                    </StateDisplay>
                </main>
            </div>
        );
    }

    // 3. Cas particulier (non géré par l'API mais possible) : Compte Banni/Désactivé
    // Si votre API renvoie un utilisateur avec un statut 'BANNED' ou 'INACTIVE',
    // vous pouvez le gérer ici comme une erreur d'accès.
    if (currentUser?.status === 'BANNED') {
        return (
            <div className="w-full min-h-screen flex flex-col">
                <Topbar back={true} title={t('profilePage.title')} />
                <main className="flex-grow flex items-center justify-center p-4">
                    <StateDisplay
                        variant="warning"
                        icon={IoWarningOutline}
                        title={t('auth.accountBannedTitle')}
                        description={t('auth.accountBannedDesc')}
                    >
                        {/* Le CTA pourrait être de contacter le support */}
                        <a href="/contact" className={primaryButtonStyle}>
                            {t('common.contactSupport')}
                        </a>
                    </StateDisplay>
                </main>
            </div>
        )
    }

    if (isLoadingMe || !currentUser) {
        return <ProfilePageSkeleton />;
    }

    const avatarUrl = avatarPreview ?? (currentUser.photo?.[0] ? getMedia({ source: currentUser.photo[0], from: 'server' }) : null);

    return (
        <div className="profil-page pb-[200px] w-full min-h-screen flex flex-col">
            <Topbar back={true} title={t('profilePage.title')} />
            <main className="w-full max-w-3xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-8">

                {/* 🎨 Section Profil avec effet verre dépoli */}
                <section className="bg-white/80 dark:bg-white/5 backdrop-blur-lg rounded-lg shadow-sm border border-gray-200/80 dark:border-white/10">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200/50 dark:border-white/10">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">{t('profilePage.profile.title')}</h3>
                    </div>
                    <div className="px-4 py-5 sm:p-6 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="relative min-w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden ring-2 ring-offset-2 ring-teal-500/50 dark:ring-offset-gray-900">
                                {avatarUrl ? <img src={avatarUrl} alt={t('profilePage.profile.avatarAlt')} className="w-full h-full object-cover" /> : <span className="text-2xl font-semibold text-gray-500 dark:text-gray-400">{currentUser.full_name?.substring(0, 2).toUpperCase() || '?'}</span>}
                                <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                                    <IoCameraOutline size={24} />
                                </label>
                                <input ref={profileFileInputRef} id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                            </div>
                            <button type="button" onClick={() => profileFileInputRef.current?.click()} className="text-sm text-teal-600 dark:text-teal-400 hover:underline">{t('profilePage.profile.changeAvatar')}</button>
                        </div>
                        <div>
                            <label className={labelStyle}>{t('profilePage.profile.emailLabel')}</label>
                            <div className="mt-1 flex items-center gap-2">
                                <IoMailOutline className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                <span className="text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800/60 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700">{currentUser.email}</span>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="profile-full-name" className={labelStyle}>{t('profilePage.profile.nameLabel')}</label>
                            <input type="text" name="full_name" id="profile-full-name" value={profileForm.full_name || ''} onChange={handleProfileInputChange} className={`pl-4 mt-1 md:w-2/3 ${inputStyle} ${profileErrors.full_name ? inputErrorStyle : ''}`} />
                            {profileErrors.full_name && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{profileErrors.full_name}</p>}
                        </div>
                    </div>
                    <div className="px-4 py-3 sm:px-6 bg-gray-50/80 dark:bg-black/10 text-right rounded-b-lg border-t border-gray-200/50 dark:border-white/10">
                        <button type="button" onClick={handleProfileSave} disabled={!profileHasChanges || updateUserMutation.isPending} className={primaryButtonStyle}>
                            {updateUserMutation.isPending ? t('common.saving') : profileHasChanges ? t('common.saveChanges') : t('product.noChangesToSave')}
                        </button>
                    </div>
                </section>

                {/* 🎨 Section Préférences */}
                <section className="bg-white/80 dark:bg-white/5 backdrop-blur-lg rounded-lg shadow-sm border border-gray-200/80 dark:border-white/10">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200/50 dark:border-white/10">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">{t('profilePage.prefs.title')}</h3>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                        <label htmlFor="profile-locale" className={labelStyle}>{t('profilePage.prefs.languageLabel')}</label>
                        <select id="profile-locale" name="locale" value={selectedLocale} onChange={handleLocaleChange} className={` pl-4 mt-1 md:w-1/2 cursor-pointer dark:[color-scheme:dark] ${inputStyle}`}>
                            {['fr', 'en'].map(lang => (<option key={lang} value={lang}>{t(`languages.${lang}`, lang)}</option>))}
                        </select>
                    </div>
                </section>

                {/* 🎨 Section Sécurité */}
                <section className="bg-white/80 dark:bg-white/5 backdrop-blur-lg rounded-lg shadow-sm border border-gray-200/80 dark:border-white/10">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200/50 dark:border-white/10">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">{t('profilePage.security.title')}</h3>
                    </div>
                    <div className="px-4 py-5 sm:p-6 space-y-8">
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <h4 className="text-base font-medium text-gray-800 dark:text-gray-200">{t('profilePage.security.changePasswordTitle')}</h4>
                            <div>
                                <label htmlFor="current-password" className="sr-only">{t('registerPage.validation.currentPasswordRequired')}</label>
                                <input id="current-password" name="current_password" type="password" required placeholder={t('registerPage.validation.currentPasswordRequired')} value={passwordForm.current_password || ''} onChange={(e) => setPasswordForm(p => ({ ...p, current_password: e.target.value }))} className={`${inputStyle} ${passwordErrors.current_password ? inputErrorStyle : ''}`} />
                                {passwordErrors.current_password && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{passwordErrors.current_password}</p>}
                            </div>
                            <div>
                                <label htmlFor="new-password" className="sr-only">{t('resetPasswordPage.passwordLabel')}</label>
                                <input id="new-password" name="password" type="password" required placeholder={t('resetPasswordPage.passwordPlaceholder')} value={passwordForm.password || ''} onChange={(e) => setPasswordForm(p => ({ ...p, password: e.target.value }))} className={`${inputStyle} ${passwordErrors.password ? inputErrorStyle : ''}`} />
                                {passwordErrors.password && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{passwordErrors.password}</p>}
                            </div>
                            <div>
                                <label htmlFor="password-confirmation" className="sr-only">{t('resetPasswordPage.passwordConfirmLabel')}</label>
                                <input id="password-confirmation" name="password_confirmation" type="password" required placeholder={t('resetPasswordPage.passwordConfirmPlaceholder')} value={passwordForm.password_confirmation || ''} onChange={(e) => setPasswordForm(p => ({ ...p, password_confirmation: e.target.value }))} className={`${inputStyle} ${passwordErrors.password_confirmation ? inputErrorStyle : ''}`} />
                                {passwordErrors.password_confirmation && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{passwordErrors.password_confirmation}</p>}
                            </div>
                            <div className="text-right">
                                <button type="submit" disabled={updateUserMutation.isPending} className={primaryButtonStyle}>{t('profilePage.security.changePasswordButton')}</button>
                            </div>
                        </form>

                        <div className="pt-6 border-t border-gray-200/50 dark:border-white/10">
                            <h4 className="text-base font-medium text-gray-800 dark:text-gray-200">{t('profilePage.security.logoutAllTitle')}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-3">{t('profilePage.security.logoutAllDesc')}</p>
                            <Button title={t('profilePage.security.logoutAllButton')} icon={<IoLogOutOutline className='w-5 h-5' />} onClick={handleLogoutAll} className="!bg-amber-500/10 !text-amber-700 hover:!bg-amber-500/20 dark:!bg-amber-500/10 dark:!text-amber-300 dark:hover:!bg-amber-500/20" style={{ width: 'fit-content' }} />
                        </div>
                    </div>

                    {/* 🎨 Zone de Danger avec styles adaptés */}
                    <div className="px-4 py-5 sm:px-6 rounded-b-lg bg-red-500/5 dark:bg-red-900/10 border-t border-red-500/10 dark:border-red-500/20">
                        <h4 className="text-base font-medium text-red-800 dark:text-red-300">{t('profilePage.security.deleteAccountTitle')}</h4>
                        <p className="text-sm text-red-700 dark:text-red-400 mt-1 mb-3">{t('profilePage.security.deleteAccountWarning')}</p>
                        <Button title={t('profilePage.security.deleteAccountConfirmTitle')} icon={<IoTrash className='w-5 h-5' />} onClick={handleDeleteAccount} className="!bg-red-600 !text-white hover:!bg-red-700" style={{ width: 'fit-content' }} />
                    </div>
                </section>
            </main>
        </div>
    );
}

const SkeletonSection = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-white/80 dark:bg-white/5 backdrop-blur-lg rounded-lg shadow-sm border border-gray-200/80 dark:border-white/10">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200/50 dark:border-white/10">
            <div className="h-6 w-1/3 bg-gray-300 dark:bg-gray-700 rounded-md"></div>
        </div>
        <div className="px-4 py-5 sm:p-6 space-y-6">
            {children}
        </div>
    </div>
);

export function ProfilePageSkeleton() {
    return (
        <div className="w-full min-h-screen flex flex-col animate-pulse">
            <Topbar back={true} title="..." />
            <main className="w-full max-w-3xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-8">
                {/* Skeleton Profil */}
                <SkeletonSection>
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                        <div className="h-5 w-1/4 bg-gray-200 dark:bg-gray-600 rounded-md"></div>
                    </div>
                    <div className="h-5 w-1/2 bg-gray-200 dark:bg-gray-600 rounded-md"></div>
                    <div className="h-10 w-2/3 bg-gray-200 dark:bg-gray-600 rounded-md"></div>
                </SkeletonSection>

                {/* Skeleton Préférences */}
                <SkeletonSection>
                    <div className="h-5 w-1/2 bg-gray-200 dark:bg-gray-600 rounded-md"></div>
                    <div className="h-10 w-1/2 bg-gray-200 dark:bg-gray-600 rounded-md"></div>
                </SkeletonSection>

                {/* Skeleton Sécurité */}
                <SkeletonSection>
                    <div className="h-5 w-1/2 bg-gray-200 dark:bg-gray-600 rounded-md"></div>
                    <div className="h-10 w-full bg-gray-200 dark:bg-gray-600 rounded-md"></div>
                    <div className="h-10 w-full bg-gray-200 dark:bg-gray-600 rounded-md"></div>
                </SkeletonSection>
            </main>
        </div>
    );
}