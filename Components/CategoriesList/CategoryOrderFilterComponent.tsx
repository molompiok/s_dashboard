// Components/CategoriesList/CategoryOrderFilterComponent.tsx

import { useTranslation } from "react-i18next";
import { CategorySortOptions } from "../../api/Interfaces/Interfaces"; // Importer le type de tri catégorie
import { useEffect, useRef } from "react";

interface CategoryOrderFilterComponentProps {
    currentOrder: CategorySortOptions | undefined;
    setOrder: (order: CategorySortOptions | undefined) => void;
    onClose: () => void; // Callback pour fermer le popup
    active: boolean; // Indique si ce filtre est celui qui est actif/ouvert
}

// Définir les options de tri pour les catégories
const categorySortOptions: { value: CategorySortOptions; labelKey: string }[] = [
    { value: 'name_asc', labelKey: 'category.sortOptions.name_asc' },
    { value: 'name_desc', labelKey: 'category.sortOptions.name_desc' },
    { value: 'created_at_desc', labelKey: 'category.sortOptions.created_at_desc' },
    { value: 'created_at_asc', labelKey: 'category.sortOptions.created_at_asc' },
    { value: 'product_count_desc', labelKey: 'category.sortOptions.product_count_desc' },
    { value: 'product_count_asc', labelKey: 'category.sortOptions.product_count_asc' },
];


export function CategoryOrderFilterComponent({ currentOrder, setOrder, onClose, active }: CategoryOrderFilterComponentProps) {
    const { t } = useTranslation();
    const popupRef = useRef<HTMLDivElement>(null);

    // Fermer au clic extérieur (similaire à VisibleFilterComponent)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (active && popupRef.current && !popupRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        if (active) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [active, onClose]);

    return (
        // Popup positionné en absolu
        <div
            ref={popupRef}
            // Styles Tailwind similaires à VisibleFilterComponent pour position/visibilité/animation
            className={`absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-30 overflow-hidden transition-all duration-150 ease-out ${active ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                }`}
        >
            <div className="py-1" role="menu" aria-orientation="vertical">
                {categorySortOptions.map((option) => {
                    const isSelected = currentOrder === option.value;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                // Permettre de désélectionner pour revenir au tri par défaut? Non, sélectionne toujours une option.
                                setOrder(option.value);
                                onClose(); // Fermer après sélection
                            }}
                            // Styles Tailwind pour chaque item
                            className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left ${isSelected
                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                            role="menuitem"
                        >
                            {/* Texte de l'option traduit */}
                            <span>{t(option.labelKey)}</span>
                            {/* Indicateur Sélectionné (optionnel) */}
                            {/* {isSelected && <IoCheckmark className="ml-auto w-4 h-4 text-blue-600"/>} */}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}