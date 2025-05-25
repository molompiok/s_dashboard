// Components/Settings/DangerZoneSection.tsx

import { useState } from 'react';
import { StoreInterface } from "../../api/Interfaces/Interfaces";
import { useTranslation } from "react-i18next";
import { useDeleteStore } from "../../api/ReactSublymusApi"; // Importer la mutation delete
import logger from '../../api/Logger';
import { ApiError } from '../../api/SublymusApi';
import { IoTrash } from "react-icons/io5";

interface DangerZoneSectionProps {
    store: StoreInterface;
}

export function DangerZoneSection({ store }: DangerZoneSectionProps) {
    const { t } = useTranslation();
    const deleteStoreMutation = useDeleteStore();
    const [confirmName, setConfirmName] = useState('');
    const [apiError, setApiError] = useState<string | null>(null);

    const isLoading = deleteStoreMutation.isPending;
    // Le nom de la boutique doit être tapé correctement pour confirmer
    const canDelete = confirmName === store.name;

    const handleDelete = () => {
        if (!canDelete || isLoading) return;
        setApiError(null); // Reset error

        store.id && deleteStoreMutation.mutate(
            { store_id: store.id },
            {
                onSuccess: () => {
                    logger.info(`Store ${store.id} deletion requested.`);
                    // La redirection ou la mise à jour de la liste sera gérée
                    // par le callback onSuccess du hook useDeleteStore si nécessaire,
                    // ou par le composant parent qui observe le changement.
                    // Pour l'instant, on pourrait juste afficher un message.
                    alert(t('dangerZone.deleteSuccessMessage')); // Alert simple
                    // Ou idéalement, rediriger l'utilisateur vers la liste des stores
                    window.location.href = '/stores';
                },
                onError: (error: ApiError) => {
                    logger.error({ error }, `Failed to delete store ${store.id}`);
                    setApiError(error.message);
                    // Afficher toast erreur?
                }
            }
        );
    };

    return (
        // Conteneur Section : Styles Tailwind pour la zone de danger
        <div className="bg-red-50 rounded-lg border border-red-300 shadow-sm">
            {/* En-tête */}
            <div className="px-4 py-5 sm:px-6 border-b border-red-200">
                <h3 className="text-lg leading-6 font-medium text-red-900">{t('settingsPage.sidebar.danger')}</h3>
                <p className="mt-1 max-w-2xl text-sm text-red-700">{t('dangerZone.description')}</p>
            </div>

            {/* Contenu */}
            <div className="px-4 py-5 sm:p-6 space-y-4">
                <h4 className="text-base font-medium text-red-800">{t('dangerZone.deleteStoreTitle')}</h4>
                <p className="text-sm text-red-700">{t('dangerZone.deleteWarning')}</p>
                <div>
                    <label htmlFor="confirm-store-name" className="block text-sm font-medium text-red-900">
                        {t('dangerZone.confirmLabel', { name: store.name })}
                    </label>
                    <input
                        type="text"
                        name="confirm-store-name"
                        id="confirm-store-name"
                        value={confirmName}
                        onChange={(e) => setConfirmName(e.target.value)}
                        className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm h-10 ${!canDelete && confirmName.length > 0 ? 'border-red-400 ring-red-400 focus:border-red-500 focus:ring-red-500' : 'border-red-300 focus:border-red-500 focus:ring-red-500'} `}
                        placeholder={store.name}
                    />
                </div>
                {/* Erreur API */}
                {apiError && <p className="mt-1 text-sm text-red-800 font-semibold">{apiError}</p>}

                {/* Bouton Supprimer */}
                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={!canDelete || isLoading}
                    className="w-full inline-flex justify-center items-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            {t('common.deleting')}
                        </>
                    ) : (
                        <>
                            <IoTrash className="-ml-1 mr-2 h-5 w-5" />
                            {t('dangerZone.deleteButtonConfirm')}
                        </>
                    )}
                </button>
            </div>
            {/* Pas de pied de page Enregistrer ici */}
        </div>
    );
}