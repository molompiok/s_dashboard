// Components/CollaboratorList/PermissionsPopup.tsx

import { useState, useEffect } from 'react';
import { Role as RoleInterface, TypeJsonRole, UserInterface, JsonRole } from "../../api/Interfaces/Interfaces"; // Importer Role, TypeJsonRole, UserInterface, JsonRole
import { useTranslation } from "react-i18next";
import { useUpdateCollaboratorPermissions } from "../../api/ReactSublymusApi"; // Importer la mutation
import logger from '../../api/Logger';
import { ApiError } from '../../api/SublymusApi';
import { Confirm } from '../Confirm/Confirm';
import { Switch } from '@headlessui/react'; // Utiliser Headless UI Switch pour les toggles
import { showErrorToast, showToast } from '../Utils/toastNotifications';

interface PermissionsPopupProps {
    collaboratorRole: RoleInterface & { user: UserInterface }; // Les données du collaborateur et ses permissions actuelles
    onSuccess: () => void;
    onCancel: () => void;
}

// Helper pour combiner les classes Tailwind
function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

export function PermissionsPopup({ collaboratorRole, onSuccess, onCancel }: PermissionsPopupProps) {
    const { t } = useTranslation();
    const updatePermissionsMutation = useUpdateCollaboratorPermissions();

    // Extraire les permissions actuelles et l'utilisateur
    const { user, ...currentPermissions } = collaboratorRole;
    // Exclure les clés non liées aux permissions
    const permissionKeys = Object.keys(JsonRole) as (keyof TypeJsonRole)[];

    // --- État Local ---
    // Initialiser l'état avec les permissions actuelles du collaborateur
    const [draftPermissions, setDraftPermissions] = useState<Partial<TypeJsonRole>>(
        permissionKeys.reduce((acc, key) => {
            //@ts-ignore
            acc[key] = !!currentPermissions[key]; // Assurer booléen
            return acc;
        }, {} as Partial<TypeJsonRole>)
    );
    const [apiError, setApiError] = useState<string | null>(null);

    // Détecter les changements
    const hasChanges = JSON.stringify(draftPermissions) !== JSON.stringify(
        permissionKeys.reduce((acc, key) => {
            //@ts-ignore
            acc[key] = !!currentPermissions[key];
            return acc;
        }, {} as Partial<TypeJsonRole>)
    );

    // --- Handler ---
    const handleToggleChange = (key: keyof TypeJsonRole, checked: boolean) => {
        setDraftPermissions(prev => ({ ...prev, [key]: checked }));
        if (apiError) setApiError(null); // Reset erreur au changement
    };

    const handleSaveChanges = () => {
        if (!hasChanges || updatePermissionsMutation.isPending) return;
        setApiError(null);

        updatePermissionsMutation.mutate(
            { collaborator_user_id: user.id, permissions: draftPermissions }, // Envoyer l'ID user et les permissions modifiées
            {
                onSuccess: () => {
                    logger.info(`Permissions updated for collaborator ${user.id}`);
                    onSuccess(); // Appeler callback succès
                    showToast("Permissions mises à jour avec succès"); // ✅ Toast succès
                },
                onError: (error: ApiError) => {
                    logger.error({ error }, `Failed to update permissions for collaborator ${user.id}`);
                    setApiError(error.message);
                    showErrorToast(error); // ❌ Toast erreur
                },
            }
        );
    };
    return (
        // Conteneur Popup : padding, gap, max-width
        <div className="permissions-popup p-4 sm:p-6 flex flex-col gap-5 w-full max-w-lg bg-white rounded-lg shadow-xl">
            {/* Liste des Permissions */}
            {/* Utiliser space-y-4 */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2"> {/* Scroll si trop de permissions */}
                {permissionKeys.map((permKey) => (
                    <Switch.Group key={permKey} as="div" className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                        {/* Label et Description Permission */}
                        <span className="flex flex-grow flex-col mr-4">
                            <Switch.Label as="span" className="text-sm font-medium text-gray-700 cursor-pointer" passive>
                                {t(`permissions.${permKey}`, permKey.replaceAll('_', ' '))} {/* Traduire la clé de permission */}
                            </Switch.Label>
                            {/* Ajouter une description si disponible dans i18n */}
                            <Switch.Description as="span" className="text-xs text-gray-500">
                                {t(`permissions.${permKey}_desc`, '')}
                            </Switch.Description>
                        </span>
                        {/* Toggle Switch */}
                        <Switch
                            checked={draftPermissions[permKey] ?? false}
                            onChange={(checked) => handleToggleChange(permKey, checked)}
                            className={classNames(
                                (draftPermissions[permKey] ?? false) ? 'bg-blue-600' : 'bg-gray-200',
                                'relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                            )}
                        >
                            <span aria-hidden="true" className={classNames((draftPermissions[permKey] ?? false) ? 'translate-x-5' : 'translate-x-0', 'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out')} />
                        </Switch>
                    </Switch.Group>
                ))}
            </div>

            {/* Erreur API */}
            {apiError && <p className="mt-1 text-sm text-red-600">{apiError}</p>}

            {/* Boutons */}
            <Confirm
                onCancel={onCancel}
                confirm={updatePermissionsMutation.isPending ? t('common.saving') : t('common.saveChanges')}
                onConfirm={handleSaveChanges}
                canConfirm={hasChanges && !updatePermissionsMutation.isPending}
            //  isLoading={updatePermissionsMutation.isPending}
            />
        </div>
    );
}