// Components/CategoryItem/CategoryItemSkeletonCard.tsx

export function CategoryItemSkeletonCard() {
    return (
        // Doit avoir les mêmes dimensions et marges que CategoryItemCard pour éviter les sauts de layout
        <div className="category-item-card group bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden animate-pulse">
            {/* Image Placeholder */}
            {/* Utiliser aspect-ratio et bg-gray-300 */}
            <div className="aspect-[4/3] w-full bg-gray-300"></div>
            {/* Contenu Texte Placeholder */}
            <div className="p-3 flex flex-col flex-grow">
                {/* Nom Placeholder */}
                <div className="h-5 w-3/4 bg-gray-300 rounded mb-2"></div> {/* mb-2 pour simuler marge nom + desc */}
                {/* Description Placeholder (2 lignes) */}
                <div className="h-3 w-full bg-gray-200 rounded mb-1"></div>
                <div className="h-3 w-5/6 bg-gray-200 rounded mb-2"></div>
                {/* Infos Basses Placeholder */}
                {/* Utiliser mt-auto pour pousser vers le bas */}
                <div className="mt-auto flex justify-between items-center pt-2 border-t border-gray-100">
                    <div className="h-3 w-16 bg-gray-200 rounded"></div> {/* Placeholder Nb Produits */}
                    <div className="h-3 w-12 bg-gray-200 rounded"></div> {/* Placeholder Date */}
                </div>
            </div>
        </div>
    );
}
