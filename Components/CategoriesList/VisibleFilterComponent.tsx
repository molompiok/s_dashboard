// Components/Filters/VisibleFilterComponent.tsx

import { useTranslation } from "react-i18next";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import { JSX, useEffect, useRef } from "react"; // Ajouter useRef et useEffect pour clic extérieur

interface VisibleFilterComponentProps {
    currentVisibility: boolean | undefined; // undefined pour "Tous", true pour "Visibles", false pour "Cachées"
    setVisible: (visibility: boolean | undefined) => void;
    onClose: () => void; // Callback pour fermer le popup
    active: boolean; // Indique si ce filtre est celui qui est actif/ouvert
}

export function VisibleFilterComponent({ currentVisibility, setVisible, onClose, active }: VisibleFilterComponentProps) {
    const { t } = useTranslation();
    const popupRef = useRef<HTMLDivElement>(null); // Référence pour le popup

    // Options de visibilité
    const visibilityOptions: { value: boolean | undefined; labelKey: string; icon: JSX.Element }[] = [
        { value: undefined, labelKey: 'visibilityFilter.all', icon: <span className="w-4 h-4"></span> }, // Placeholder icon
        { value: true, labelKey: 'visibilityFilter.visible', icon: <IoEyeOutline className="w-4 h-4 text-green-500"/> },
        { value: false, labelKey: 'visibilityFilter.hidden', icon: <IoEyeOffOutline className="w-4 h-4 text-gray-500"/> },
    ];

    // Fermer au clic extérieur
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (active && popupRef.current && !popupRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        // Ajouter l'écouteur seulement si le popup est actif
        if (active) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        // Nettoyer l'écouteur
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [active, onClose]);


    return (
        // Popup positionné en absolu sous le bouton filtre parent
        // Gérer l'affichage avec les props `active`
        <div
            ref={popupRef}
            className={`absolute top-full right-0 sm:right-auto sm:left-0 mt-1 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-30 overflow-hidden transition-all duration-150 ease-out ${
                active ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none' // Animation simple
            }`}
        >
            <div className="py-1" role="menu" aria-orientation="vertical">
                {visibilityOptions.map((option) => {
                    const isSelected = currentVisibility === option.value;
                    return (
                        <button
                            key={String(option.value)} // Utiliser String pour clé unique (undefined devient "undefined")
                            type="button"
                            onClick={() => {
                                setVisible(option.value);
                                onClose(); // Fermer après sélection
                            }}
                             // Appliquer styles Tailwind pour chaque item
                             className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left ${
                                 isSelected
                                     ? 'bg-blue-50 text-blue-700 font-medium'
                                     : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                             }`}
                            role="menuitem"
                        >
                             <span className="inline-block w-4 h-4">{option.icon}</span>
                             <span>{t(option.labelKey)}</span> 
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
