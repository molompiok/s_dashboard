
// Components/CategoryItem/CategoryItemSkeletonRow.tsx

export function CategoryItemSkeletonRow() {
    return (
        // Dimensions et styles similaires à CategoryItemRow
        <div className="category-item-row flex items-center gap-3 sm:gap-4 p-2.5 bg-white rounded-lg shadow-sm border border-gray-200 w-full animate-pulse">
            {/* Image Placeholder */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-gray-300 flex-shrink-0"></div>
            {/* Nom & Desc Placeholder */}
            <div className="flex-grow min-w-0 flex flex-col gap-1">
                <div className="h-5 w-3/5 bg-gray-300 rounded"></div> {/* Nom */}
                <div className="hidden md:block h-3 w-4/5 bg-gray-200 rounded"></div> {/* Desc */}
            </div>
             {/* Autres colonnes Placeholder (avec les mêmes classes 'hidden' que l'original) */}
             <div className="hidden sm:flex h-4 w-12 bg-gray-200 rounded flex-shrink-0"></div> {/* Nb Produits */}
             <div className="hidden md:flex h-4 w-8 bg-gray-200 rounded flex-shrink-0"></div> {/* Visibilité */}
             <div className="hidden lg:flex h-4 w-16 bg-gray-200 rounded flex-shrink-0"></div> {/* Date */}
             {/* Actions Placeholder */}
             <div className="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0 ml-auto sm:ml-0"></div>
        </div>
    );
}