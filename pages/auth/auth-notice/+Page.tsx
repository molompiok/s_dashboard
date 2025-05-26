// pages/auth/auth-notice/+Page.tsx

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IoMailOpenOutline,
  IoCheckmarkCircleOutline,
  IoShieldCheckmarkOutline, // Pour succès vérification/setup
  IoKeyOutline,             // Pour succès reset mot de passe
  IoAlertCircleOutline,     // Pour les erreurs
} from 'react-icons/io5';
import { Link } from '../../../renderer/Link';
import { usePageContext } from '../../../renderer/usePageContext';
import logoUrl from '../../../renderer/logo.png'; // Utiliser le logo

export { Page };

// Types de notices plus granulaires
export type NoticeType =
  | 'verify_email_sent'       // Après inscription, email de vérification envoyé
  | 'email_verified'          // Email vérifié avec succès
  | 'password_reset_sent'     // Email de réinitialisation de mdp envoyé
  | 'password_reset_success'  // Mot de passe réinitialisé avec succès
  | 'account_setup_success'   // Compte collaborateur configuré avec succès
  | 'generic_message'         // Message générique (succès ou info)
  | 'error_message';          // Message d'erreur générique

interface NoticeContent {
  icon: React.ReactNode;
  titleKey: string;
  messageKey: string;
  messageParams?: Record<string, string | undefined>;
  extraHintKey?: string;
  primaryAction?: {
    href: string;
    textKey: string;
    isExternal?: boolean; // Pour ouvrir dans un nouvel onglet si nécessaire
  };
  secondaryAction?: {
    href: string;
    textKey: string;
  };
  bgColorClass?: string; // Pour personnaliser le fond si besoin
  textColorClass?: string; // Pour personnaliser la couleur du texte de l'icône
}

function Page() {
  const { t } = useTranslation();
  const { urlParsed } = usePageContext();

  // Déterminer le type de notice et les paramètres
  const noticeType: NoticeType = (urlParsed.search?.['type'] as NoticeType) || 'generic_message';
  const email = urlParsed.search?.['email'];
  const messageOverride = urlParsed.search?.['message']; // Permettre un message custom via query param
  const titleOverride = urlParsed.search?.['title']; // Permettre un titre custom

  const noticeContent = useMemo((): NoticeContent => {
    const defaultIconClass = "mx-auto h-16 w-16 mb-5"; // Taille d'icône plus grande

    switch (noticeType) {
      case 'verify_email_sent': // Après une nouvelle inscription
        return {
          icon: <IoMailOpenOutline className={`${defaultIconClass} text-teal-500`} />,
          titleKey: titleOverride || 'authNotice.verify.title',
          messageKey: messageOverride || (email ? 'authNotice.verify.messageWithEmail' : 'authNotice.verify.messageGeneric'),
          messageParams: { email },
          extraHintKey: 'authNotice.verify.spamHint',
          primaryAction: { href: '/auth', textKey: 'authNotice.action.backToLogin' },
          // Optionnel: lien pour renvoyer l'email si la logique existe et que l'email est connu
          secondaryAction: email ? { href: `/auth/resend-verification?email=${encodeURIComponent(email)}`, textKey: 'authNotice.action.resendVerification' } : undefined,
        };
      case 'email_verified':
        return {
          icon: <IoShieldCheckmarkOutline className={`${defaultIconClass} text-emerald-500`} />,
          titleKey: titleOverride || 'authNotice.emailVerified.title',
          messageKey: messageOverride || 'authNotice.emailVerified.message',
          primaryAction: { href: '/auth', textKey: 'authNotice.action.proceedToLogin' },
          bgColorClass: "from-emerald-50 to-green-100/30 dark:from-emerald-900/50 dark:to-green-800/30",
        };
      case 'password_reset_sent':
        return {
          icon: <IoMailOpenOutline className={`${defaultIconClass} text-sky-500`} />,
          titleKey: titleOverride || 'authNotice.passwordResetSent.title',
          messageKey: messageOverride || (email ? 'authNotice.passwordResetSent.messageWithEmail' : 'authNotice.passwordResetSent.messageGeneric'),
          messageParams: { email },
          extraHintKey: 'authNotice.verify.spamHint', // Réutiliser
          primaryAction: { href: '/auth', textKey: 'authNotice.action.backToLogin' },
          bgColorClass: "from-sky-50 to-blue-100/30 dark:from-sky-900/50 dark:to-blue-800/30",
        };
      case 'password_reset_success':
        return {
          icon: <IoKeyOutline className={`${defaultIconClass} text-emerald-500`} />,
          titleKey: titleOverride || 'authNotice.passwordResetSuccess.title',
          messageKey: messageOverride || 'authNotice.passwordResetSuccess.message',
          primaryAction: { href: '/auth', textKey: 'authNotice.action.proceedToLogin' },
          bgColorClass: "from-emerald-50 to-green-100/30 dark:from-emerald-900/50 dark:to-green-800/30",
        };
      case 'account_setup_success':
        return {
          icon: <IoShieldCheckmarkOutline className={`${defaultIconClass} text-emerald-500`} />,
          titleKey: titleOverride || 'authNotice.accountSetupSuccess.title',
          messageKey: messageOverride || 'authNotice.accountSetupSuccess.message',
          primaryAction: { href: '/auth', textKey: 'authNotice.action.proceedToLogin' },
          bgColorClass: "from-emerald-50 to-green-100/30 dark:from-emerald-900/50 dark:to-green-800/30",
        };
      case 'error_message':
        return {
          icon: <IoAlertCircleOutline className={`${defaultIconClass} text-red-500`} />,
          titleKey: titleOverride || 'authNotice.error.title',
          messageKey: messageOverride || 'authNotice.error.defaultMessage',
          messageParams: { email }, // Au cas où l'email est pertinent pour le message d'erreur
          primaryAction: { href: '/auth', textKey: 'authNotice.action.backToLogin' },
          bgColorClass: "from-red-50 to-rose-100/30 dark:from-red-900/50 dark:to-rose-800/30",
        };
      case 'generic_message':
      default:
        return {
          icon: <IoCheckmarkCircleOutline className={`${defaultIconClass} text-teal-500`} />,
          titleKey: titleOverride || 'authNotice.generic.title',
          messageKey: messageOverride || 'authNotice.generic.message',
          primaryAction: { href: '/', textKey: 'authNotice.action.backToHome' },
        };
    }
  }, [noticeType, email, t, messageOverride, titleOverride]);

  const gradientBackground = noticeContent.bgColorClass || "from-teal-50 via-sky-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900";

  return (
    <div className={`absolute w-full h-full top-0 left-0 min-h-screen flex flex-col items-center justify-center bg-gradient-to-br ${gradientBackground} px-4 py-12 overflow-hidden`}>
       <div className="absolute inset-0 opacity-50 dark:opacity-30">
        <div className={`absolute -top-1/4 -left-1/4 w-full h-full rounded-full ${noticeType === 'error_message' ? 'bg-red-300/30 dark:bg-red-700/20' : 'bg-teal-300/30 dark:bg-teal-700/20'} filter blur-3xl animate-pulse-slow`}></div>
        <div className={`absolute -bottom-1/4 -right-1/4 w-3/4 h-3/4 rounded-full ${noticeType === 'error_message' ? 'bg-rose-300/20 dark:bg-rose-700/10' : 'bg-sky-300/30 dark:bg-sky-700/20'} filter blur-3xl animate-pulse-slower animation-delay-2000`}></div>
      </div>

      <div className="relative w-full max-w-lg text-center">
         <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-8 sm:p-10 md:p-12 rounded-xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50">
            <Link href="/" className="inline-block mb-8">
                <img className="h-12 w-auto mx-auto hover:opacity-80 transition-opacity" src={logoUrl} alt="Sublymus Logo" />
            </Link>

            {noticeContent.icon}

            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                {t(noticeContent.titleKey)}
            </h1>

            <p className="mt-3 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                {t(noticeContent.messageKey, noticeContent.messageParams)}
            </p>

            {noticeContent.extraHintKey && (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                    {t(noticeContent.extraHintKey)}
                </p>
            )}

            <div className="mt-8 space-y-4 sm:space-y-0 sm:flex sm:flex-col sm:items-center sm:gap-4">
                {noticeContent.primaryAction && (
                    <Link
                        href={noticeContent.primaryAction.href}
                        // target={noticeContent.primaryAction.isExternal ? '_blank' : undefined }
                        // rel={noticeContent.primaryAction.isExternal ? 'noopener noreferrer' : undefined}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 dark:focus:ring-offset-slate-900 transition-colors"
                    >
                        {t(noticeContent.primaryAction.textKey)}
                    </Link>
                )}
                {noticeContent.secondaryAction && (
                    <Link
                        href={noticeContent.secondaryAction.href}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-base font-medium text-teal-700 dark:text-teal-400 hover:text-teal-600 dark:hover:text-teal-300 hover:underline"
                    >
                        {t(noticeContent.secondaryAction.textKey)}
                    </Link>
                )}
            </div>
        </div>
        <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} Sublymus. {t('footer.allRightsReserved')}
        </p>
      </div>
    </div>
  );
}