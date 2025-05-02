import { FaEye, FaEyeSlash, FaTrashAlt } from "react-icons/fa";
type ProductVisibilityControlProps = {
    title: string;
    isVisible: boolean;
    onSetVisibility: (newVisibility: boolean) => Promise<any> | any | void; // Permissif sur le retour
    onDeleteRequired: () => void;
    isLoading?: boolean; 
    t: (key: string, options?: any) => string;
};
/**
 * Composant pour gérer la visibilité et la suppression d'un produit.
 * @param {object} props
 * @param {string} props.productId - ID du produit concerné.
 * @param {string} props.title - Titre à afficher (ex: "Visibilité du produit").
 * @param {boolean} props.isVisible - L'état de visibilité actuel du produit.
 * @param {function(string, boolean): Promise<void>} props.onSetVisibility - Fonction asynchrone appelée pour changer la visibilité (reçoit productId, newVisibility).
 * @param {function(string): void} props.onDeleteRequired - Fonction appelée lorsque la suppression est demandée (reçoit productId).
 * @param {boolean} [props.isLoading] - Optionnel: mettre à true pour désactiver les boutons pendant une opération.
 * @param {function(string): string} props.t - Fonction de traduction.
 */
export function VisibilityControl({
    title,
    isVisible,
    onSetVisibility,
    onDeleteRequired,
    isLoading = false, // Valeur par défaut pour isLoading
    t
}:ProductVisibilityControlProps) {

    const handleVisibilityToggle = async () => {
        // Inverse l'état de visibilité actuel
        await onSetVisibility(!isVisible);
    };

    const handleDeleteClick = () => {
        onDeleteRequired();
    };

    return (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            {/* Titre */}
            <span className="text-base font-medium text-gray-800">{title}</span>

            {/* Groupe de boutons */}
            <div className="flex items-center gap-3">
                {/* Bouton Visibilité */}
                <button
                    type="button"
                    onClick={handleVisibilityToggle}
                    disabled={isLoading}
                    className={`flex items-center gap-1.5 px-3 py-1.5 hover:shadow-sm rounded-md text-sm font-medium border cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed ${
                        isVisible
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50' // Style pour "Masquer" (état visible actuel)
                            : 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100 focus:ring-2 focus:ring-green-400 focus:ring-opacity-50' // Style pour "Rendre Visible" (état masqué actuel)
                    }`}
                    aria-label={isVisible ?t('productList.hidden') : t('productList.visible')}
                >
                    {isVisible ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    <span>{isVisible ?t('productList.hidden') : t('productList.visible')}</span>
                </button>

                {/* Bouton Supprimer */}
                <button
                    type="button"
                    onClick={handleDeleteClick}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 hover:shadow-sm rounded-md text-sm font-medium border transition bg-red-50 text-red-700 border-red-300 hover:bg-red-100 focus:ring-2 cursor-pointer focus:ring-red-400 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={t('common.delete')}
                >
                    <FaTrashAlt size={13} /> {/* Légèrement plus petite pour l'équilibre */}
                    <span>{t('common.delete')}</span>
                </button>
            </div>
        </div>
    );
}
