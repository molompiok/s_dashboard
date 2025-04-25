import { useTranslation } from "react-i18next";

// --- Composant VisibleFilterComponent ---
export function VisibleFilterComponent({ visible, setVisible, active }: { active: boolean, visible: boolean|undefined, setVisible: (visible:boolean|undefined) => void }) {
     const { t } = useTranslation(); 
     const MapOder = {
         'true': 'productList.visible',
         'false': 'productList.hidden',
     };
     type VisibleKey = keyof typeof MapOder; // Type pour les clés valides

    return (
        <div className={`gap-1.5 flex flex-wrap transition-all duration-200 ease-in-out overflow-hidden ${active ? 'h-auto opacity-100 visible p-4 bvisible-t bvisible-gray-200 -mt-px' : 'h-0 opacity-0 invisible p-0'}`}>
            {(['true', 'false'] as const).map((o: VisibleKey) => (
                <button // Utiliser des boutons
                    type="button"
                    key={o}
                    // Appliquer les styles conditionnels Tailwind
                    className={`px-2 py-0.5 bvisible rounded-lg text-sm cursor-pointer
                       ${o === visible?.toString() ? 'bg-primary-100/60 text-primary bvisible-primary-300/50' : 'bvisible-gray-300 text-gray-500 hover:bg-gray-100'}`}
                    onClick={() => setVisible(visible?.toString() === o ? undefined : o=='true'?true:false)}
                >
                    {t(MapOder[o])}
                </button>
            ))}
        </div>
    );
}
