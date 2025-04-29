// Components/InventoryManager/InventoryItemRow.tsx

import { Inventory as InventoryInterface } from "../../Interfaces/Interfaces"; // Utiliser alias
import { IoLocationOutline, IoMailOutline, IoPencil, IoTrash, IoEllipsisVertical, IoImageOutline } from "react-icons/io5"; // Ajouter icônes
import { getImg } from "../Utils/StringFormater";
import { useGlobalStore } from "../../pages/stores/StoreStore";
import { useTranslation } from "react-i18next";
import { useState } from 'react';
import logger from '../../api/Logger';
import { useDeleteInventory } from "../../api/ReactSublymusApi"; // Importer mutation delete
import { useChildViewer } from "../ChildViewer/useChildViewer";
import { ConfirmDelete } from "../Confirm/ConfirmDelete";
import { ChildViewer } from "../ChildViewer/ChildViewer";
import { NO_PICTURE } from "../Utils/constants"; // Placeholder
import { DateTime } from "luxon";

export { InventoryItemRow };

interface InventoryItemRowProps {
    inventory: InventoryInterface;
    onEdit: () => void; // Callback pour ouvrir le popup d'édition
    // onDeleteSuccess?: (inventoryId: string) => void; // Callback optionnel
}

function InventoryItemRow({ inventory, onEdit /*, onDeleteSuccess */ }: InventoryItemRowProps) {
    const { t } = useTranslation();
    const { currentStore } = useGlobalStore(); // Pour URL base image si nécessaire
    const { openChild } = useChildViewer(); // Pour confirmation
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [imgError, setImgError] = useState(false);

    // Utiliser la première image de 'views' comme miniature
    const imageUrl = inventory.views?.[0] ?? NO_PICTURE;
    const imageSrc = getImg(imageUrl, undefined, currentStore?.url).match(/url\("?([^"]+)"?\)/)?.[1];

    // Initialiser la mutation de suppression
    const deleteInventoryMutation = useDeleteInventory();

    // Handler pour la suppression
    const handleDelete = () => {
        setIsMenuOpen(false);
        openChild(
            <ChildViewer>
                <ConfirmDelete
                    title={t('inventory.confirmDelete', { name: inventory.address_name })}
                    onCancel={() => openChild(null)}
                    onDelete={() => {
                        deleteInventoryMutation.mutate({
                            inventory_id: inventory.id
                        }, {
                            onSuccess: () => {
                                logger.info(`Inventory ${inventory.id} deleted`);
                                openChild(null);
                                // L'invalidation est gérée dans le hook useDeleteInventory
                                // onDeleteSuccess?.(inventory.id);
                            },
                            onError: (error) => {
                                logger.error({ error }, `Failed to delete inventory ${inventory.id}`);
                                openChild(null);
                                // Afficher toast erreur
                            }
                        });
                    }}
                />
            </ChildViewer>,
            { background: '#3455' }
        );
    };

    return (
        // Conteneur Ligne: flex, items-center, gap, padding, bg, rounded, shadow, hover, group
        <div className="inventory-item-row flex items-center gap-3 sm:gap-4 p-2.5 bg-white rounded-lg shadow-sm border border-transparent hover:border-gray-200 hover:shadow-sm transition duration-150 w-full group relative">

            {/* Image Miniature */}
            <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                {!imgError ? (
                    <img
                        src={imageSrc || NO_PICTURE}
                        alt={inventory.address_name}
                        loading="lazy"
                        className="w-full h-full object-cover block"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                        <IoImageOutline size={24} /> {/* Icône placeholder */}
                    </div>
                )}
            </div>

            {/* Colonne Nom & Email */}
            <div className="flex-grow min-w-0 flex flex-col">
                <h3
                    className='font-medium text-sm sm:text-base text-gray-800 truncate'
                    title={inventory.address_name}
                >
                    {inventory.address_name}
                </h3>
                {inventory.email && (
                    <a href={`mailto:${inventory.email}`} className='text-xs text-gray-500 mt-0.5 flex items-center gap-1 hover:text-blue-600 w-fit' title={inventory.email}>
                        <IoMailOutline className="w-3 h-3" />
                        <span className="truncate">{inventory.email}</span>
                    </a>
                )}
                {!inventory.email && (
                    <span className='text-xs text-gray-400 italic mt-0.5'>{t('inventory.noEmail')}</span>
                )}
            </div>

            {/* Colonne Localisation (visible sur md+) */}
            <div className="hidden md:flex items-center gap-1 text-xs text-gray-500 flex-shrink-0 w-40" title={`${inventory.latitude}, ${inventory.longitude}`}>
                <IoLocationOutline className="w-3.5 h-3.5 flex-shrink-0" />
                <span className='truncate'>{inventory.latitude?.toFixed(4)}, {inventory.longitude?.toFixed(4)}</span>
            </div>

            {/* Colonne Date Ajout (visible sur lg+) */}
            <div className="hidden lg:flex items-center gap-1 text-xs text-gray-500 flex-shrink-0 w-24 text-right" title={t('common.createdAt')}>
                <span>{DateTime.fromISO(inventory.created_at).setLocale(t('common.locale')).toLocaleString(DateTime.DATE_SHORT)}</span>
            </div>


            {/* Colonne Actions */}
            <div className="relative flex-shrink-0 ml-auto sm:ml-0">
                {/* Bouton Kebab */}
                <button
                    onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                    className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    aria-haspopup="true"
                    aria-expanded={isMenuOpen}
                    title={t('common.actions')}
                    disabled={deleteInventoryMutation.isPending} // Désactiver pendant suppression
                >
                    <IoEllipsisVertical />
                </button>
                {/* Menu déroulant */}
                {isMenuOpen && (
                    <div
                        className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20 py-1" // z-20 pour être au-dessus des autres lignes
                        role="menu" aria-orientation="vertical"
                        // onClick={(e) => e.stopPropagation()} // Pas nécessaire si on ferme au clic
                        onMouseLeave={() => setIsMenuOpen(false)} // Fermer si la souris quitte le menu
                    >
                        {/* Action Modifier */}
                        <button onClick={() => { onEdit(); setIsMenuOpen(false); }} role="menuitem" className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left">
                            <IoPencil className="w-4 h-4" /> {t('common.edit')}
                        </button>
                        {/* Action Supprimer */}
                        <button onClick={handleDelete} role="menuitem" className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 w-full text-left disabled:opacity-50" disabled={deleteInventoryMutation.isPending}>
                            <IoTrash className="w-4 h-4" /> {t('common.delete')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}