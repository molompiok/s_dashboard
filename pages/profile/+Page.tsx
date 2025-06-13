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

export { Page };

type ProfileFormState = { full_name?: string; avatarFile?: File | null; };
type PasswordFormState = { current_password?: string; password?: string; password_confirmation?: string; };

// 🎨 Styles de base pour les inputs et labels
const labelStyle = "block text-sm font-medium text-gray-700 dark:text-gray-300";
const inputStyle = "pl-4 block w-full rounded-lg shadow-sm border-gray-300 focus:border-teal-500 focus:ring-teal-500 dark:bg-gray-800/50 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-500 sm:text-sm h-10 transition-colors";
const inputErrorStyle = "border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500";
const primaryButtonStyle = "inline-flex justify-center rounded-lg border border-transparent bg-teal-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

function Page() {
    const { t, i18n } = useTranslation();
    const { openChild } = useChildViewer();
    const { setUser, setToken } = useAuthStore();
    const { setCurrentStore } = useGlobalStore();

    // ... (Logique des hooks et états inchangée, elle est déjà bonne)
    const { data: meData, isLoading: isLoadingMe, isError: isMeError, error: meError } = useGetMe({ enabled: !!useAuthStore.getState().getToken() });
    const currentUser = meData?.user;
    const [profileForm, setProfileForm] = useState<ProfileFormState>({});
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [profileErrors, setProfileErrors] = useState<{ [key: string]: string }>({});
    const profileFileInputRef = useRef<HTMLInputElement>(null);
    const [passwordForm, setPasswordForm] = useState<PasswordFormState>({});
    const [passwordErrors, setPasswordErrors] = useState<{ [key: string]: string }>({});
    const [selectedLocale, setSelectedLocale] = useState(i18n.language);
    const [apiError, setApiError] = useState<string | null>(null);
    const updateUserMutation = useUpdateUser();
    const logoutAllMutation = useLogoutAllDevices();
    const deleteAccountMutation = useDeleteAccount();

    useEffect(() => {
        if (currentUser) {
            setProfileForm({ full_name: currentUser.full_name ?? '' });
            setAvatarPreview(null);
            setProfileErrors({});
            setSelectedLocale(currentUser.locale ?? i18n.language);
        }
    }, [currentUser, i18n.language]);

    const profileHasChanges = useMemo(() => {
        if (!currentUser) return false;
        return (profileForm.full_name !== (currentUser.full_name ?? '')) || !!profileForm.avatarFile;
    }, [profileForm, currentUser]);

    // ... (Logique des handlers inchangée)
    const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { setProfileForm(prev => ({ ...prev, [e.target.name]: e.target.value })); setProfileErrors(prev => ({ ...prev, [e.target.name]: '' })); };
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (avatarPreview) URL.revokeObjectURL(avatarPreview); const file = e.target.files?.[0]; if (file) { setProfileForm(prev => ({ ...prev, avatarFile: file })); setAvatarPreview(URL.createObjectURL(file)); } e.target.value = ''; };
    const handleProfileSave = () => { /* ... */ };
    const handlePasswordChange = (e: React.FormEvent<HTMLFormElement>) => { /* ... */ };
    const handleLogoutAll = () => { /* ... */ };
    const handleDeleteAccount = () => { /* ... */ };
    const handleLocaleChange = (event: React.ChangeEvent<HTMLSelectElement>) => { /* ... */ };

    if (isLoadingMe || !currentUser) {
        return <ProfilePageSkeleton />;
    }

    // 2. État d'Erreur Critique (Erreur API ou Utilisateur non trouvé)
    // Si la requête `useGetMe` échoue ou ne renvoie pas d'utilisateur,
    // c'est que la session est probablement invalide. On ne peut pas continuer.
    if (isMeError ) {
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
    if (currentUser.status === 'BANNED') {
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
                            <div className="relative w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden ring-2 ring-offset-2 ring-teal-500/50 dark:ring-offset-gray-900">
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