// pages/auth/auth-notice/+Page.tsx

import { useTranslation } from 'react-i18next';
import { IoMailOpenOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';
import { Link } from '../../../renderer/Link';
import { usePageContext } from '../../../renderer/usePageContext';
import { useMemo } from 'react';

export { Page }; 

type NoticeType = 'verify' | 'reset' | 'generic_sent'; // Types de notices possibles

function Page() {
    const { t } = useTranslation();
    const { urlParsed } = usePageContext();

    // Déterminer le type de notice et l'email (si fourni)
    const noticeType: NoticeType = urlParsed.search?.['type'] as NoticeType ?? 'generic_sent';
    const email = urlParsed.search?.['email']; // Email optionnel

    // Déterminer le contenu basé sur le type
    const noticeContent = useMemo(() => {
        switch (noticeType) {
            case 'verify':
                return {
                    icon: <IoMailOpenOutline className="mx-auto h-12 w-12 text-green-500" />,
                    titleKey: 'verifyNoticePage.title',
                    messageKey: email ? 'verifyNoticePage.messageWithEmail' : 'verifyNoticePage.messageGeneric',
                    messageParams: { email },
                    extraHintKey: 'verifyNoticePage.spamHint',
                    resendLink: email ? `/resend-verification?email=${encodeURIComponent(email)}` : '/resend-verification',
                    resendLinkKey: 'verifyNoticePage.resendLink'
                };
            case 'reset':
                return {
                    icon: <IoMailOpenOutline className="mx-auto h-12 w-12 text-blue-500" />,
                    titleKey: 'forgotPasswordPage.successTitle',
                    messageKey: 'auth.forgotPassword.emailSentConfirmation', // Message générique toujours
                    messageParams: { email }, // Passer l'email même si non affiché dans msg générique
                    extraHintKey: 'verifyNoticePage.spamHint', // Réutiliser spamHint
                    resendLink: undefined, // Pas de lien renvoyer pour reset mdp
                    resendLinkKey: undefined
                };
            case 'generic_sent': // Fallback
            default:
                return {
                    icon: <IoCheckmarkCircleOutline className="mx-auto h-12 w-12 text-green-500" />,
                    titleKey: 'authNotice.genericSentTitle', // Nouvelle clé
                    messageKey: 'authNotice.genericSentMessage', // Nouvelle clé
                    messageParams: {},
                    extraHintKey: undefined,
                    resendLink: undefined,
                    resendLinkKey: undefined
                };
        }
    }, [noticeType, email, t]);


    return (
        // Utiliser un fond différent selon le type? Pour l'instant, gardons simple.
        <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-100/30 px-4 py-12`}>
            <div className="w-full max-w-md text-center bg-white p-8 sm:p-10 rounded-xl shadow-lg">
                {/* Icône Dynamique */}
                {noticeContent.icon}
                {/* Titre Dynamique */}
                <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
                    {t(noticeContent.titleKey)}
                </h2>
                {/* Message Dynamique */}
                <p className="mt-3 text-base text-gray-600">
                    {t(noticeContent.messageKey, noticeContent.messageParams)}
                </p>
                {/* Aide Spam (si définie) */}
                {noticeContent.extraHintKey && (
                    <p className="mt-2 text-sm text-gray-500">
                        {t(noticeContent.extraHintKey)}
                    </p>
                )}
                {/* Liens */}
                <div className={`mt-6 text-sm ${noticeContent.resendLink ? 'space-x-4' : ''}`}> {/* Ajouter espace seulement si 2 liens */}
                    <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
                        {t('registerPage.backToLogin')}
                    </Link>
                    {/* Lien Renvoyer (si défini) */}
                    {noticeContent.resendLink && noticeContent.resendLinkKey && (
                        <>
                            <span className="text-gray-300">|</span>
                            <Link href={noticeContent.resendLink} className="font-medium text-gray-500 hover:text-gray-700 hover:underline">
                                {t(noticeContent.resendLinkKey)}
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
