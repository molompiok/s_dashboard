// Components/UserCards/CurrentUserCard.tsx

import { useTranslation } from "react-i18next";
import { useGetMe } from "../../api/ReactSublymusApi"; // Hook pour récupérer l'utilisateur connecté
import { getImg } from "../Utils/StringFormater";
import { IoChevronForward, IoPersonCircleOutline } from "react-icons/io5";

export function CurrentUserCard() {
    const { t } = useTranslation();
    const { data: meData, isLoading, isError } = useGetMe(); // Récupérer données /me
    const user = meData?.user;

    // S'assurer que le chemin vers le placeholder est correct
    const avatarSrc = user?.photo?.[0] ? getImg(user.photo[0]).match(/url\("?([^"]+)"?\)/)?.[1] : undefined;

    // --- Rendu Skeleton ---
    if (isLoading) {
        return (
            <div className="current-user-card w-full p-4 bg-gradient-to-r from-blue-50 via-white to-blue-50 rounded-xl shadow-sm border border-blue-100 flex items-center justify-between gap-4 animate-pulse">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex-shrink-0"></div>
                    <div className="flex-grow min-w-0 space-y-1.5">
                        <div className="h-5 w-32 bg-gray-300 rounded"></div>
                        <div className="h-3 w-40 bg-gray-200 rounded"></div>
                    </div>
                </div>
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
            </div>
        );
    }

    // --- Rendu Erreur ---
    if (isError || !user) {
        return (
            <div className="current-user-card w-full p-4 bg-red-50 rounded-xl shadow-sm border border-red-200 text-center">
                <p className="text-sm text-red-700">{t('profilePage.error.loadError')}</p> 
            </div>
        );
    }

    const  role_type = 'owner'
    // --- Rendu Normal ---
    return (
        // Utiliser un lien <a> qui englobe tout pour aller au profil
        <a href="/users/profile" className="current-user-card w-full p-4 bg-gradient-to-r from-blue-50 via-white to-indigo-50 rounded-xl shadow-sm border border-blue-100 flex items-center justify-between gap-4 group hover:shadow-md hover:border-blue-200 transition duration-150 ease-in-out">
            {/* Partie Gauche: Avatar + Nom/Email */}
            <div className="flex items-center gap-3 min-w-0">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-cover bg-center bg-gray-200 text-blue-600 font-medium text-xl flex items-center justify-center flex-shrink-0 ring-1 ring-blue-200 ring-offset-1"
                    style={{ backgroundImage: avatarSrc ? `url(${avatarSrc})` : 'none' }}
                >
                    {!avatarSrc && (user.full_name?.substring(0, 1).toUpperCase() || <IoPersonCircleOutline />)}
                </div>
                {/* Nom et Email */}
                <div className="flex-grow min-w-0">
                    <p className='font-semibold text-base text-gray-800 group-hover:text-blue-700 truncate' title={user.full_name}>
                        {user.full_name || t('common.anonymous')}
                        {/* Indiquer si Owner ou Collaborateur */}
                         {role_type &&  (
                             <span className={`ml-2 text-xs font-medium px-1.5 py-0.5 rounded-full ${role_type ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
                                 {t(`roles.${role_type}`)} 
                            </span>
                         )}
                    </p>
                    <p className='text-sm text-gray-500 truncate' title={user.email}>{user.email}</p>
                </div>
            </div>
            {/* Partie Droite: Chevron */}
            <div className="flex-shrink-0 text-gray-400 group-hover:text-blue-500 transition-colors">
                <IoChevronForward className="w-6 h-6" />
            </div>
        </a>
    );
}
