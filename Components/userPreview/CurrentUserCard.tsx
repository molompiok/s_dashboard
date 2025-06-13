// Components/UserCards/CurrentUserCard.tsx

import { useTranslation } from "react-i18next";
import { useGetMe } from "../../api/ReactSublymusApi"; // Hook pour récupérer l'utilisateur connecté
import { getMedia } from "../Utils/StringFormater";
import { IoChevronForward, IoPersonCircleOutline } from "react-icons/io5";
import { useGlobalStore } from "../../api/stores/StoreStore";
import { navigate } from "vike/client/router";

export function CurrentUserCard() {
    const { t } = useTranslation();
    const { currentStore } = useGlobalStore()
    const { data: meData, isLoading, isError } = useGetMe(); // Récupérer données /me
    const user = meData?.user;

    // S'assurer que le chemin vers le placeholder est correct
    const avatarSrc = user?.photo?.[0] ? getMedia({ isBackground: true, source: user.photo[0], from: 'server' }) : undefined;

    // --- Rendu Skeleton ---
    if (isLoading) {
        return (
            <div className="current-user-card w-full p-4 bg-gradient-to-r from-blue-50 via-white to-blue-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-700 rounded-xl shadow-sm dark:shadow-gray-900/30 border border-blue-100 dark:border-gray-600 flex items-center justify-between gap-4 animate-pulse transition-colors duration-200">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0"></div>
                    <div className="flex-grow min-w-0 space-y-1.5">
                        <div className="h-5 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        <div className="h-3 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                </div>
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
        );
    }

    // --- Rendu Erreur ---
    if (isError || !user) {
        return (
            <div className="current-user-card w-full p-4 bg-red-50 dark:bg-red-900/20 rounded-xl shadow-sm dark:shadow-gray-900/30 border border-red-200 dark:border-red-800 text-center">
                <p className="text-sm text-red-700 dark:text-red-400">{t('profilePage.error.loadError')}</p>
            </div>
        );
    }

    const role_type = 'owner'
    // --- Rendu Normal ---
    return (
        // Utiliser un lien <a> qui englobe tout pour aller au profil
        <span 
            onClick={() => {
                navigate('/profile');
            }} 
            className="current-user-card w-full p-4 bg-gradient-to-r from-blue-50 via-white to-indigo-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-700 rounded-xl shadow-sm dark:shadow-gray-900/30 border border-blue-100 dark:border-gray-600 flex items-center justify-between gap-4 group hover:shadow-md dark:hover:shadow-gray-900/40 hover:border-blue-200 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer"
        >
            {/* Partie Gauche: Avatar + Nom/Email */}
            <div className="flex items-center gap-3 min-w-0">
                {/* Avatar */}
                <div 
                    className="w-12 h-12 rounded-full bg-cover bg-center bg-gray-200 dark:bg-gray-600 text-blue-600 dark:text-blue-400 font-medium text-xl flex items-center justify-center flex-shrink-0 ring-1 ring-blue-200 dark:ring-gray-500 ring-offset-1 dark:ring-offset-gray-800"
                    style={{ background: avatarSrc }}
                >
                    {!avatarSrc && (user.full_name?.substring(0, 1).toUpperCase() || <IoPersonCircleOutline />)}
                </div>
                {/* Nom et Email */}
                <div className="flex-grow min-w-0">
                    <p className='font-semibold text-base text-gray-800 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 truncate transition-colors duration-200' title={user.full_name}>
                        {user.full_name || t('common.anonymous')}
                        {/* Indiquer si Owner ou Collaborateur */}
                        {role_type && (
                            <span className={`ml-2 text-xs font-medium px-1.5 py-0.5 rounded-full ${
                                role_type 
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' 
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                                {t(`roles.${role_type}`)}
                            </span>
                        )}
                    </p>
                    <p className='text-sm text-gray-500 dark:text-gray-400 truncate transition-colors duration-200' title={user.email}>{user.email}</p>
                </div>
            </div>
            {/* Partie Droite: Chevron */}
            <div className="flex-shrink-0 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-200">
                <IoChevronForward className="w-6 h-6" />
            </div>
        </span>
    );
}