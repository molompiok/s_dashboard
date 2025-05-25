// Components/InventoryManager/InventoryManager.tsx

import { useState } from 'react';
import { StoreInterface, Inventory as InventoryInterface } from "../../api/Interfaces/Interfaces"; // Utiliser InventoryInterface
import { useTranslation } from "react-i18next";
import { useGetInventories, useCreateInventory, useDeleteInventory, useUpdateInventory } from "../../api/ReactSublymusApi"; // Importer hooks API Inventaire
import logger from '../../api/Logger';
import { IoAddSharp, IoStorefrontOutline } from "react-icons/io5";
import { InventoryItemRow } from './InventoryItemRow'; // Nouveau composant
import { InventoryFormPopup } from './InventoryFromPopup'; // Nouveau composant popup
import { useChildViewer } from '../ChildViewer/useChildViewer'; // Pour ouvrir popup
import { ChildViewer } from '../ChildViewer/ChildViewer';

interface InventoryManagerProps {
  store: StoreInterface; // Store sélectionné pour filtrer les inventaires
}

export function InventoryManager({ store }: InventoryManagerProps) {
  const { t } = useTranslation();
  const { openChild } = useChildViewer();

  // --- Récupération Données ---
  const { data: inventoriesData, isLoading, isError, error } = useGetInventories(
    {},
    { enabled: !!store.id }
  );
  const inventories = inventoriesData?.list ?? []; // Utiliser data.list si paginé

  // --- Handlers ---
  const handleOpenAddPopup = () => {
    openChild(
      <ChildViewer title={t('inventory.addPopupTitle')}>
        <InventoryFormPopup
          // storeId={store.id} // Passer l'ID du store si nécessaire pour la création
          onSaveSuccess={() => {
            // L'invalidation est gérée par le hook useCreateInventory
            openChild(null);
          }}
          onCancel={() => openChild(null)}
        />
      </ChildViewer>,
      { background: 'rgba(51, 65, 85, 0.7)', blur: 3 } // Fond standard popup
    );
  };

  // Fonction pour ouvrir le popup d'édition (passée à InventoryItemRow)
  const handleOpenEditPopup = (inventory: InventoryInterface) => {
    openChild(
      <ChildViewer title={t('inventory.editPopupTitle')}>
        <InventoryFormPopup
          initialData={inventory} // Passer les données existantes
          onSaveSuccess={() => {
            openChild(null);
          }}
          onCancel={() => openChild(null)}
        />
      </ChildViewer>,
      { background: 'rgba(51, 65, 85, 0.7)', blur: 3 }
    );
  };

  console.log(inventoriesData);


  return (
    <div className="inventory-manager bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 flex flex-col gap-6 md:gap-8">

      {/* En-tête section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <IoStorefrontOutline className="min-w-5 w-5 h-5 text-gray-400" />
          {t('inventory.sectionTitle')}
        </h2>

        {/* Bouton Ajouter */}
        <button
          type="button"
          onClick={handleOpenAddPopup}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
        >
          <IoAddSharp size={18} className="-ml-1" />
          {t('inventory.addButton')}
        </button>
      </div>

      {/* Liste des inventaires */}
      <div className="inventory-list flex flex-col gap-3 sm:gap-4">
        {isLoading && (
          Array.from({ length: 3 }).map((_, i) => (
            <InventoryItemSkeletonRow key={`inv-skel-${i}`} />
          ))
        )}
        {isError && (
          <p className="text-sm text-red-500 text-center py-4">
            {error?.message || t('inventory.fetchError')}
          </p>
        )}
        {!isLoading && !isError && inventories.length === 0 && (
          <p className="text-sm text-gray-500 italic text-center py-4">
            {t('inventory.noInventories')}
          </p>
        )}
        {!isLoading && !isError && inventories.map(inventory => (
          <InventoryItemRow
            key={inventory.id}
            inventory={inventory}
            onEdit={() => handleOpenEditPopup(inventory)}
          />
        ))}
      </div>

      {/* Pagination future */}
      {/* <Pagination ... /> */}
    </div>
  );
}

// --- Skeleton pour InventoryItemRow (Nouveau) ---
function InventoryItemSkeletonRow() {
  return (
    <div className="inventory-item-row flex items-center gap-3 sm:gap-4 p-2.5 bg-gray-50 rounded-lg border border-gray-200 w-full animate-pulse">
      {/* Image Placeholder */}
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-gray-300 flex-shrink-0"></div>
      {/* Nom & Email Placeholder */}
      <div className="flex-grow min-w-0 flex flex-col gap-1">
        <div className="h-5 w-3/5 bg-gray-300 rounded"></div> {/* Nom */}
        <div className="h-3 w-4/5 bg-gray-200 rounded"></div> {/* Email */}
      </div>
      {/* Colonnes Placeholder */}
      <div className="hidden sm:flex h-4 w-24 bg-gray-200 rounded flex-shrink-0"></div> {/* Adresse? */}
      <div className="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0 ml-auto sm:ml-0"></div> {/* Actions */}
    </div>
  );
}