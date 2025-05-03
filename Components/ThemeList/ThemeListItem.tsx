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
    className?: string
}

export function ThemeListItem({ className, theme, isSelected, onClick }: ThemeListItemProps) {
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
            className={`theme-list-item ${className} w-full flex flex-col items-center gap-3 p-2 rounded-lg border transition duration-150 ease-in-out ${isSelected
                ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200' // Style sélectionné
                : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200' // Style normal
                }`}
        >
            {/* Miniature */}
            <div className="relative flex-shrink-0 w-full h-20 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                {/* Gestion Erreur Image */}
                {!imgError ? (
                    <img src={imageSrc || NO_PICTURE} alt={theme.name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
                ) : (
                    <img src={NO_PICTURE} alt={t('common.imageError')} className="w-full h-full object-contain p-1 opacity-50" />
                )}

                <div className="absolute bottom-0 right-0">
                    {isSelected && (
                        <IoCheckmarkCircleSharp className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    )}
                    <span className={`text-xs font-semibold ${isFree ? 'text-green-600' : 'text-blue-600'}`}>
                        {isFree ? t('themeCard.free') : `${Number(theme.price || 0).toLocaleString()} FCFA`}
                    </span>
                </div>
            </div>
            {/* Infos Texte */}
            <div className="flex flex-col items-center gap-2">
                <p className='font-medium text-sm text-gray-800 truncate' title={theme.name}>{theme.name}</p>

            </div>
        </button>
    );
}
