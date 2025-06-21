// Components/CollaboratorList/PermissionsPopup.tsx

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Role as RoleInterface, TypeJsonRole, UserInterface } from "../../api/Interfaces/Interfaces";
import { useUpdateCollaboratorPermissions } from "../../api/ReactSublymusApi";
import { Confirm } from '../Confirm/Confirm';
import { showErrorToast, showToast } from '../Utils/toastNotifications';
import { PermissionToggle } from './PermissionToggle'; // ✅ On réutilise notre super composant

interface PermissionsPopupProps {
    collaboratorRole: RoleInterface & { user: UserInterface };
    onSuccess: () => void;
    onCancel: () => void;
}

// Réutiliser la même structure de groupes que sur la page de profil
// (Vous pouvez aussi l'importer si vous la mettez dans un fichier partagé)
const permissionGroupsForPopup: { 
  titleKey: string; 
  permissions: { key: keyof TypeJsonRole }[] 
}[] = [
    { titleKey: 'permissions.group.clients', permissions: [{ key: 'filter_client' }, { key: 'ban_client' }] },
    { titleKey: 'permissions.group.collaborators', permissions: [{ key: 'filter_collaborator' }, { key: 'ban_collaborator' }, { key: 'create_delete_collaborator' }] },
    { titleKey: 'permissions.group.products', permissions: [{ key: 'filter_product' }, { key: 'edit_product' }, { key: 'create_delete_product' }, { key: 'manage_scene_product' }] },
    { titleKey: 'permissions.group.orders', permissions: [{ key: 'filter_command' }, { key: 'manage_command' }] },
    { titleKey: 'permissions.group.appearance', permissions: [{ key: 'manage_interface' }] },
    { titleKey: 'permissions.group.communication', permissions: [{ key: 'chat_client' }] },
];

export function PermissionsPopup({ collaboratorRole, onSuccess, onCancel }: PermissionsPopupProps) {
    const { t } = useTranslation();
    const updatePermissionsMutation = useUpdateCollaboratorPermissions();

    // Extraire les permissions initiales
    const initialPermissions = permissionGroupsForPopup
        .flatMap(g => g.permissions)
        .reduce((acc, perm) => {
            //@ts-ignore
            acc[perm.key] = !!collaboratorRole[perm.key];
            return acc;
        }, {} as Partial<TypeJsonRole>);

    const [draftPermissions, setDraftPermissions] = useState(initialPermissions);

    // Détecter les changements pour activer le bouton de sauvegarde
    const hasChanges = JSON.stringify(draftPermissions) !== JSON.stringify(initialPermissions);

    const handleToggleChange = (key: keyof TypeJsonRole, checked: boolean) => {
        setDraftPermissions(prev => ({ ...prev, [key]: checked }));
    };

    const handleSaveChanges = () => {
        if (!hasChanges) return;
        updatePermissionsMutation.mutate(
            { collaborator_user_id: collaboratorRole.user.id, permissions: draftPermissions },
            {
                onSuccess: () => {
                    showToast(t('permissions.updateSuccess'));
                    onSuccess();
                },
                onError: (error) => showErrorToast(error),
            }
        );
    };

    return (
        <div className="permissions-popup p-4 sm:p-6 flex flex-col gap-5 text-gray-800 dark:text-gray-100">
            {/* Liste scrollable des permissions */}
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                {permissionGroupsForPopup.map(group => (
                    <div key={group.titleKey}>
                        <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">{t(group.titleKey)}</h3>
                        <div className="divide-y divide-gray-200/80 dark:divide-white/10 rounded-lg border border-gray-200/80 dark:border-white/10 p-1">
                            {group.permissions.map(({ key }) => (
                                <PermissionToggle
                                    key={key}
                                    label={t(`permissions.${key}.label`)}
                                    description={t(`permissions.${key}.desc`)}
                                    enabled={draftPermissions[key] ?? false}
                                    onChange={(enabled) => handleToggleChange(key, enabled)}
                                    disabled={updatePermissionsMutation.isPending}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Boutons de confirmation */}
            <div className="pt-4 border-t border-gray-200/80 dark:border-white/10">
                 <Confirm
                    onCancel={onCancel}
                    confirm={t('common.saveChanges')}
                    onConfirm={handleSaveChanges}
                    canConfirm={hasChanges && !updatePermissionsMutation.isPending}
                    isLoading={updatePermissionsMutation.isPending}
                />
            </div>
        </div>
    );
}