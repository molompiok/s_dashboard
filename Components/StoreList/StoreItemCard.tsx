// Components/StoreList/StoreItemCard.tsx

import { StoreInterface } from "../../api/Interfaces/Interfaces";
import { getMedia } from "../../Components/Utils/StringFormater";
import { IoCheckmarkCircle, IoEyeOff, IoEyeSharp, IoPauseCircle } from "react-icons/io5";
import { useTranslation } from "react-i18next";
import { NO_PICTURE } from "../../Components/Utils/constants";
import { useState } from "react";
import { Server_Host } from "../../renderer/+config";
import './StoresList.css'
interface StoreItemCardProps {
    store: StoreInterface;
    isSelected: boolean;
    onClick: () => void;
}

export function StoreItemCard({ store, isSelected, onClick }: StoreItemCardProps) {
    const { t } = useTranslation();
    const [logoError, setLogoError] = useState(false);
    const [coverError, setCoverError] = useState(false);

    const logoSrc = getMedia({source:store.logo?.[0],from:'server'});
    const coverSrc = store.cover_image?.[0] && getMedia({isBackground:true,source:store.cover_image[0], from:'server'})

    return (
        // Carte cliquable avec styles Tailwind
        <button // Utiliser bouton pour accessibilité
            type="button"
            onClick={onClick}
            className={`store-item-card w-full h-full min-h-[220px] flex flex-col rounded-xl overflow-hidden shadow-md border-2 transition-all duration-200 ease-in-out transform hover:-translate-y-1 cursor-pointer focus:outline-none ${isSelected ? 'border-blue-500 shadow-blue-300/50 scale-100' : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
                }`}
        >
            {/* Image de Couverture */}
            <div
                className="w-full h-24 sm:h-28 flex-shrink-0 bg-cover bg-center bg-gray-200 relative"
                style={{ background: coverSrc && !coverError ? coverSrc : NO_PICTURE }} // Style inline pour bg
                onError={() => !coverError && setCoverError(true)} // Gérer erreur image cover
            >
                {/* Fallback si cover ne charge pas */}
                {coverError && <div className="absolute inset-0 bg-gray-300"></div>}
                {/* Logo en superposition */}
                <div className="absolute bottom-2 left-2 w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white bg-white shadow flex items-center justify-center overflow-hidden">
                    {!logoError && logoSrc ? (
                        <img src={logoSrc} alt={`${store.name} logo`} className="w-full h-full object-contain" onError={() => setLogoError(true)} />
                    ) : (
                        // Initiales ou icône placeholder si logo absent/erreur
                        <span className="text-sm font-semibold text-gray-500">
                            {store.name?.substring(0, 2).toUpperCase()}
                        </span>
                    )}
                </div>
            </div>
            {/* Informations Texte */}
            <div className="p-3 flex flex-col flex-grow justify-between bg-white">
                <div>
                    <h3 className="font-semibold text-sm text-gray-800 truncate mb-0.5" title={store.name}>
                        {store.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2" title={store.description}>
                        {store.description || t('storesPage.noDescription')}
                    </p>
                </div>
                {/* Statut */}
                <div className={`mt-2 flex items-center gap-1 text-xs font-medium `}>
                    <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${store.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                        {store.is_active ? <IoCheckmarkCircle className="w-4 h-4" /> : <IoPauseCircle className="w-4 h-4" />}
                        <span>{store.is_active ? t('storesPage.status.active') : t('storesPage.status.inactive')} </span>
                    </div>
                    <div className={`mt-2 ml-auto flex items-center gap-1 text-xs font-medium ${store.is_running ? 'text-green-600' : 'text-gray-500'}`}>
                        <span>{store.is_running ? <IoEyeSharp className="w-4 h-4" /> : <IoEyeOff className="w-4 h-4" />}</span>
                        <span>{store.is_running ? t('common.visible') : t('common.hidden')} </span>
                    </div>
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