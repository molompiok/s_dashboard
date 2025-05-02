// Components/ThemeList/ThemeListItem.tsx

import { ThemeInterface } from "../../Interfaces/Interfaces";
import { getImg } from "../Utils/StringFormater";
import { useTranslation } from "react-i18next";
import { NO_PICTURE } from "../Utils/constants";
import { useState } from 'react';
import { IoCheckmarkCircleSharp } from "react-icons/io5"; // Pour thème sélectionné
import { useGlobalStore } from "../../pages/stores/StoreStore";

interface ThemeListItemProps {
    theme: ThemeInterface;
    isSelected: boolean;
    onClick: () => void;
}

export function ThemeListItem({ theme, isSelected, onClick }: ThemeListItemProps) {
    const { t } = useTranslation();
    const { currentStore } = useGlobalStore();
    const [imgError, setImgError] = useState(false);

    const imageUrl = theme.preview_images?.[0] ?? NO_PICTURE;
    const imageSrc = getImg(imageUrl, undefined, currentStore?.url).match(/url\("?([^"]+)"?\)/)?.[1];
    const isFree = theme.price === 0 || theme.is_premium === false;

    return (
        // Bouton pour l'item cliquable
        <button
            type="button"
            onClick={onClick}
            className={`theme-list-item w-full flex items-center gap-3 p-2 rounded-lg border transition duration-150 ease-in-out ${
                isSelected
                    ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200' // Style sélectionné
                    : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200' // Style normal
            }`}
        >
            {/* Miniature */}
            <div className="flex-shrink-0 w-16 h-12 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                 {/* Gestion Erreur Image */}
                 {!imgError ? (
                     <img src={imageSrc || NO_PICTURE} alt={theme.name} className="w-full h-full object-cover" onError={() => setImgError(true)}/>
                  ) : (
                      <img src={NO_PICTURE} alt={t('common.imageError')} className="w-full h-full object-contain p-1 opacity-50" />
                  )}
            </div>
             {/* Infos Texte */}
            <div className="flex-grow min-w-0 text-left">
                <p className='font-medium text-sm text-gray-800 truncate' title={theme.name}>{theme.name}</p>
                <span className={`text-xs font-semibold ${isFree ? 'text-green-600' : 'text-blue-600'}`}>
                    {isFree ? t('themeCard.free') : `${Number(theme.price || 0).toLocaleString()} FCFA`}
                 </span>
            </div>
             {/* Indicateur Sélectionné */}
             {isSelected && (
                 <IoCheckmarkCircleSharp className="w-5 h-5 text-blue-600 flex-shrink-0" />
             )}
        </button>
    );
}

// --- Skeleton pour ThemeListItem ---
export function ThemeListItemSkeleton() {
    return (
        <div className="theme-list-item w-full flex items-center gap-3 p-2 rounded-lg border border-transparent animate-pulse">
            {/* Miniature Placeholder */}
            <div className="flex-shrink-0 w-16 h-12 rounded-md bg-gray-300"></div>
            {/* Infos Placeholder */}
            <div className="flex-grow min-w-0 space-y-1">
                <div className="h-4 w-3/4 bg-gray-300 rounded"></div> {/* Nom */}
                <div className="h-3 w-1/2 bg-gray-200 rounded"></div> {/* Prix */}
            </div>
        </div>
    );
}