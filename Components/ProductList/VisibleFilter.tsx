import { useTranslation } from "react-i18next";
import { FilterPanelWrapper } from "../CommandesList/CommandesList";

// --- Composant VisibleFilterComponent ---
export function VisibleFilterComponent({ visible, setVisible, active }: { active: boolean, visible: boolean | undefined, setVisible: (visible: boolean | undefined) => void }) {
    const { t } = useTranslation();
    const MapOder = {
        'true': 'productList.visible',
        'false': 'productList.hidden',
    };
    type VisibleKey = keyof typeof MapOder; // Type pour les clés valides

    return (
        <FilterPanelWrapper active={active}>
            <div className={`gap-1.5 flex flex-wrap transition-all duration-200 ease-in-out overflow-hidden ${active ? 'h-auto opacity-100 visible p-4 bvisible-t bvisible-gray-200 -mt-px' : 'h-0 opacity-0 invisible p-0'}`}>
                {(['true', 'false'] as const).map((o: VisibleKey) => (
                    <button // Utiliser des boutons
                        type="button"
                        key={o}
                        // Appliquer les styles conditionnels Tailwind
                        className={`  rounded-lg text-sm cursor-pointer px-3 py-1.5 border  font-medium transition-colors
                       ${o === visible?.toString()
                                ? 'bg-teal-600 text-white border-teal-600'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        onClick={() => setVisible(visible?.toString() === o ? undefined : o == 'true' ? true : false)}
                    >
                        {t(MapOder[o])}
                    </button>
                ))}
            </div>
        </FilterPanelWrapper>
    );
}
