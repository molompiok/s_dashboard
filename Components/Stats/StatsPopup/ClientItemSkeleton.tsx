// components/Stats/Modals/ClientItemSkeleton.tsx
import React from 'react';

// Squelette simple pour un item client
export function ClientItemSkeleton() {
    return (
        <div className="client-item-skeleton flex items-center gap-4 p-3 rounded-lg bg-gray-100 w-full animate-pulse">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gray-300 shrink-0"></div>
            {/* Nom, Email/Téléphone */}
            <div className="flex-grow min-w-0 flex flex-col gap-1.5">
                <div className="h-4 w-4/5 bg-gray-300 rounded-sm"></div>
                <div className="h-3 w-3/5 bg-gray-200 rounded-sm"></div>
            </div>
            {/* Statut placeholder */}
             <div className="h-5 w-16 bg-gray-200 rounded-full shrink-0 ml-auto"></div>
        </div>
    );
}

// Optionnel : Exporter pour pouvoir l'utiliser ailleurs si besoin
// export default ClientItemSkeleton;