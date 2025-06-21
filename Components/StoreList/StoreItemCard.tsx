// Components/StoreList/StoreItemCard.tsx

import { StoreInterface } from "../../api/Interfaces/Interfaces";
import { getMedia } from "../../Components/Utils/StringFormater";
import { IoCheckmarkCircle, IoEyeOff, IoEyeSharp, IoPauseCircle } from "react-icons/io5";
import { useTranslation } from "react-i18next";
import { NO_PICTURE } from "../../Components/Utils/constants";
import { useEffect, useState } from "react";
import { CheckCircle, Globe, PauseCircle, Settings, Users2Icon } from "lucide-react";
import { useAuthStore } from "../../api/stores/AuthStore";
interface StoreItemCardProps {
    store: StoreInterface;
    isSelected: boolean;
    onClick: () => void;
    onManage?(store: StoreInterface): void,
    onVisit?(store: StoreInterface): void
}

export function StoreItemCard({ onManage, onVisit, store, isSelected, onClick }: StoreItemCardProps) {
    const { t } = useTranslation();
    const [logoError, setLogoError] = useState(false);
    const [coverError, setCoverError] = useState(false);

    const { user , getUser } = useAuthStore()

    useEffect(()=>{
        getUser()
    },[])
    const logoSrc = getMedia({ source: store.logo?.[0], from: 'server' });
    const coverSrc = store.cover_image?.[0] && getMedia({ isBackground: true, source: store.cover_image[0], from: 'server' })

    return (
        // Carte cliquable avec styles Tailwind
        <button
            type="button"
            onClick={onClick}
            className={`relaitve store-item-card w-full min-h-[220px] flex flex-col rounded-xl overflow-hidden shadow-md border-2 transition-all duration-200 ease-in-out transform hover:-translate-y-1 cursor-pointer focus:outline-none 
        ${isSelected
                    ? 'border-sky-300 shadow-blue-300/50 dark:shadow-blue-900/50 scale-100 dark:border-gray-800'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-lg dark:border-gray-800 dark:hover:border-gray-500 dark:hover:shadow-xl'
                }`}
        >
            {
                store.user_id !== user?.id && <span className={`absolute z-1 right-0  inline-flex items-center gap-1 sx:gap-1.5 px-2 sx:px-3 py-1 rounded-full text-xs sx:text-sm font-medium backdrop-blur-sm ${store.is_active
                    ? 'bg-purple-500/20 dark:bg-purple-400/20 text-purple-700 dark:text-purple-300 border border-purple-300/30'
                    : 'bg-gray-500/20 dark:bg-gray-400/20 text-gray-600 dark:text-gray-400 border border-gray-300/30'
                    }`}>
                    <Users2Icon className="w-4 h-4 sx:w-4 sx:h-4" /> Collaboration
                </span>
            }
            {/* Image de Couverture */}
            <div
                className="w-full h-24 sm:h-28 flex-shrink-0 bg-cover bg-center bg-gray-200 dark:bg-gray-800 relative"
                style={{ background: coverSrc && !coverError ? coverSrc : NO_PICTURE }}
                onError={() => !coverError && setCoverError(true)}
            >
                {coverError && <div className="absolute inset-0 bg-gray-300 dark:bg-gray-700"></div>}
                <div className="absolute bottom-2 left-2 w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white dark:border-gray-800 bg-white dark:bg-gray-900 shadow flex items-center justify-center overflow-hidden">
                    {!logoError && logoSrc ? (
                        <img
                            src={logoSrc}
                            alt={`${store.name} logo`}
                            className="w-full h-full object-contain"
                            onError={() => setLogoError(true)}
                        />
                    ) : (
                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-300">
                            {store.name?.substring(0, 2).toUpperCase()}
                        </span>
                    )}
                </div>
            </div>

            {/* Informations Texte */}
            <div className="p-3 flex flex-col flex-grow justify-between  bg-white/10 dark:bg-white/5 backdrop-blur-md  border border-white/20 dark:border-white/10">
                <div className="h-[54px]">
                    <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate mb-0.5" title={store.name}>
                        {store.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2" title={store.description}>
                        {store.description || t('storesPage.noDescription')}
                    </p>
                </div>

                {/* Statut */}
                <div className="mt-2 flex items-center gap-1 text-xs font-medium">
                    <div className={`${store.is_active ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'} flex items-center gap-1`}>
                        {store.is_active ? <IoCheckmarkCircle className="w-4 h-4" /> : <IoPauseCircle className="w-4 h-4" />}
                        <span>{store.is_active ? t('storesPage.status.active') : t('storesPage.status.inactive')}</span>
                    </div>
                    <div className={`${store.is_running ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'} ml-auto flex items-center gap-1`}>
                        {store.is_running ? <IoEyeSharp className="w-4 h-4" /> : <IoEyeOff className="w-4 h-4" />}
                        <span>{store.is_running ? t('common.visible') : t('common.hidden')}</span>
                    </div>
                </div>

                {/* Boutons */}
                <div
                    style={{ height: `${isSelected ? 32 : 0}px`, transition: '300ms', overflow: 'hidden' }}
                    className="manage-buttons mt-3 overflow-hidden w-full flex justify-between gap-2"
                >
                    <button
                        className="flex shadow-md gap-2 items-center w-full justify-center
                bg-gray-500/10 dark:bg-gray-700/20 border border-gray-400/20 dark:border-gray-700 rounded-lg
                text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-500/20 dark:hover:bg-gray-700 transition"
                        onClick={() => onManage?.(store)}
                    >
                        <Settings className="w-4 h-4" />
                        Gérer
                    </button>

                    <button
                        className="flex shadow-md gap-2 items-center w-full justify-center
                bg-gray-500/10 dark:bg-gray-700/20 border border-gray-400/20 dark:border-gray-700 rounded-lg
                text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-500/20 dark:hover:bg-gray-700 transition"
                        onClick={() => onVisit?.(store)}
                    >
                        <Globe className="w-4 h-4" />
                        Visiter
                    </button>
                </div>
            </div>
        </button>
    );
}

// --- Skeleton Card ---
export function StoreItemSkeletonCard() {
    return (
        <div className="store-item-card w-48 h-full flex flex-col rounded-xl overflow-hidden shadow-sm border-2 border-gray-200 animate-pulse">
            {/* Cover Placeholder */}
            <div className="w-48 h-24 sm:h-28 flex-shrink-0 bg-gray-300 relative">
                {/* Logo Placeholder */}
                <div className="absolute bottom-2 left-2 w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white bg-gray-200 shadow"></div>
            </div>
            {/* Infos Placeholder */}
            <div className="p-3 flex flex-col flex-grow justify-between bg-white">
                <div>
                    <div className="h-4 w-3/4 bg-gray-300 rounded mb-1.5"></div>
                    <div className="h-3 w-full bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 w-5/6 bg-gray-200 rounded"></div>
                </div>
                <div className="h-4 w-16 bg-gray-200 rounded mt-2"></div> {/* Statut */}
            </div>
        </div>
    );
}