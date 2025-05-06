// components/Stats/Modals/ProductItemSkeleton.tsx
import React from 'react';

// Squelette simple pour un item produit dans une liste compacte (modal)
export function ProductItemSkeleton() {
    return (
        <div className="product-item-skeleton flex items-center gap-4 p-3 rounded-lg bg-gray-100 w-full animate-pulse">
            {/* Image/Placeholder */}
            <div className="w-10 h-10 rounded bg-gray-300 shrink-0"></div>
            {/* Nom, Prix */}
            <div className="flex-grow min-w-0 flex flex-col gap-1.5">
                <div className="h-4 w-3/5 bg-gray-300 rounded-sm"></div> {/* Nom */}
                <div className="h-3 w-2/5 bg-gray-200 rounded-sm mt-1"></div> {/* Prix/Info courte */}
            </div>
            {/* Placeholder */}
             <div className="h-4 w-12 bg-gray-200 rounded shrink-0 ml-auto"></div> {/* Par ex: Stock ou Rating */}
        </div>
    );
}