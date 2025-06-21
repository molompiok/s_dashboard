// pages/users/collaborators/@id/+Page.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageContext } from '../../../../renderer/usePageContext';
import {
    useGetCollaborators, // Pourrait être utilisé pour trouver le collaborateur dans le cache
    useUpdateCollaboratorPermissions,
    useRemoveCollaborator,
    // On pourrait avoir besoin d'un hook `useGetUser` si on veut des infos plus détaillées
} from '../../../../api/ReactSublymusApi';
import { Role, TypeJsonRole, UserInterface } from '../../../../api/Interfaces/Interfaces';
import { Topbar, BreadcrumbItem } from '../../../../Components/TopBar/TopBar';
import { StateDisplay } from '../../../../Components/StateDisplay/StateDisplay';
import { ConfirmDelete } from '../../../../Components/Confirm/ConfirmDelete';
import { useChildViewer } from '../../../../Components/ChildViewer/useChildViewer';
import { ChildViewer } from '../../../../Components/ChildViewer/ChildViewer';
import { showErrorToast, showToast } from '../../../../Components/Utils/toastNotifications';
import { limit } from '../../../../Components/Utils/functions';
import { IoShieldCheckmarkOutline, IoTrendingUpOutline, IoWarningOutline, IoTrash } from 'react-icons/io5';
import { navigate } from 'vike/client/router';
import UserPreview from '../../../../Components/userPreview/userPreview';
import { PermissionToggle } from '../../../../Components/CollaboratorList/PermissionToggle';

export { Page };

// Définir la structure des permissions pour l'UI
const permissionGroups: { titleKey: string; permissions: { key: keyof TypeJsonRole; labelKey: string; descKey: string; }[] }[] = [
    {
        titleKey: 'permissions.group.clients',
        permissions: [
            { key: 'filter_client', labelKey: 'permissions.filter_client.label', descKey: 'permissions.filter_client.desc' },
            { key: 'ban_client', labelKey: 'permissions.ban_client.label', descKey: 'permissions.ban_client.desc' },
        ],
    },
    {
        titleKey: 'permissions.group.collaborators',
        permissions: [
            { key: 'filter_collaborator', labelKey: 'permissions.filter_collaborator.label', descKey: 'permissions.filter_collaborator.desc' },
            { key: 'ban_collaborator', labelKey: 'permissions.ban_collaborator.label', descKey: 'permissions.ban_collaborator.desc' },
            { key: 'create_delete_collaborator', labelKey: 'permissions.create_delete_collaborator.label', descKey: 'permissions.create_delete_collaborator.desc' },
        ],
    },
    {
        titleKey: 'permissions.group.products',
        permissions: [
            { key: 'filter_product', labelKey: 'permissions.filter_product.label', descKey: 'permissions.filter_product.desc' },
            { key: 'edit_product', labelKey: 'permissions.edit_product.label', descKey: 'permissions.edit_product.desc' },
            { key: 'create_delete_product', labelKey: 'permissions.create_delete_product.label', descKey: 'permissions.create_delete_product.desc' },
            { key: 'manage_scene_product', labelKey: 'permissions.manage_scene_product.label', descKey: 'permissions.manage_scene_product.desc' },
        ],
    },
    {
        titleKey: 'permissions.group.orders',
        permissions: [
            { key: 'filter_command', labelKey: 'permissions.filter_command.label', descKey: 'permissions.filter_command.desc' },
            { key: 'manage_command', labelKey: 'permissions.manage_command.label', descKey: 'permissions.manage_command.desc' },
        ],
    },
    {
        titleKey: 'permissions.group.appearance',
        permissions: [
            { key: 'manage_interface', labelKey: 'permissions.manage_interface.label', descKey: 'permissions.manage_interface.desc' },
        ],
    },
     {
        titleKey: 'permissions.group.communication',
        permissions: [
            { key: 'chat_client', labelKey: 'permissions.chat_client.label', descKey: 'permissions.chat_client.desc' },
        ],
    },
];

function Page() {
    const { t } = useTranslation();
    const { routeParams } = usePageContext();
    const { openChild } = useChildViewer();
    const collaboratorId = routeParams?.['id'];

    // Utiliser le hook de liste et trouver le bon collaborateur.
    // Pour une grosse application, un hook `useGetCollaborator(id)` serait plus optimisé.
    const { data: collaboratorsData, isLoading, isError, error } = useGetCollaborators();
    
    const collaboratorRole = useMemo(() => 
        collaboratorsData?.list.find(c => c.user.id === collaboratorId),
        [collaboratorsData, collaboratorId]
    );

    const [permissions, setPermissions] = useState<Partial<TypeJsonRole>>({});
    const updatePermissionsMutation = useUpdateCollaboratorPermissions();
    const removeCollaboratorMutation = useRemoveCollaborator();

    useEffect(() => {
        if (collaboratorRole) {
            // Exclure les champs non-permission (id, user_id, etc.)
            const { id, ...perms } = collaboratorRole;
            setPermissions(perms);
        }
    }, [collaboratorRole]);

    const handlePermissionChange = (key: keyof TypeJsonRole, enabled: boolean) => {
        const updatedPermissions = { ...permissions, [key]: enabled };
        setPermissions(updatedPermissions);
        
        // Appel de la mutation
        updatePermissionsMutation.mutate({ collaborator_user_id: collaboratorId!, permissions: { [key]: enabled } }, {
            onSuccess: () => showToast(t('permissions.updateSuccess')),
            onError: (err) => {
                showErrorToast(err);
                // Revenir à l'état précédent en cas d'erreur
                setPermissions(prev => ({ ...prev, [key]: !enabled }));
            }
        });
    };
    
    const handleRemoveCollaborator = () => {
        openChild(<ChildViewer><ConfirmDelete
            title={t('collaborator.confirmDelete', { name: collaboratorRole?.user.full_name })}
            onCancel={() => openChild(null)}
            onDelete={() => removeCollaboratorMutation.mutate({ user_id: collaboratorId! }, {
                onSuccess: () => {
                    showToast(t('collaborator.deleteSuccess'), 'WARNING');
                    navigate('/users/collaborators'); // Rediriger vers la liste
                },
                onError: (err) => { showErrorToast(err); openChild(null); }
            })}
        /></ChildViewer>, { background: 'rgba(220, 38, 38, 0.7)', blur: 4 });
    };

    if (isLoading) return <div />; // TODO: Skeleton pour cette page
    if (isError || !collaboratorRole) return <StateDisplay variant="danger" icon={IoWarningOutline} title="Collaborateur introuvable" description="Ce collaborateur n'existe pas ou vous n'avez pas les droits pour le voir." />;
    
    const user = collaboratorRole.user;
    const breadcrumbs: BreadcrumbItem[] = [
        { name: t('navigation.home'), url: '/' },
        { name: t('navigation.collaborators'), url: '/users/collaborators' },
        { name: limit(user.full_name, 20) }
    ];

    const sectionStyle = "bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-xl shadow-sm border border-gray-200/80 dark:border-white/10";

    return (
        <div className="w-full min-h-screen flex flex-col pb-24">
            <Topbar back title={`Profil de ${user.full_name}`} breadcrumbs={breadcrumbs} />
            <main className="w-full max-w-4xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-8">
                <UserPreview user={user} />

                {/* Section des Permissions */}
                <section className={`${sectionStyle} p-4 sm:p-6`}>
                    <div className="flex items-center gap-3 mb-4">
                        <IoShieldCheckmarkOutline className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('permissions.title')}</h2>
                    </div>
                    <div className="space-y-6">
                        {permissionGroups.map(group => (
                            <div key={group.titleKey}>
                                <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">{t(group.titleKey)}</h3>
                                <div className="divide-y divide-gray-200/80 dark:divide-white/10">
                                    {group.permissions.map(perm => (
                                        <PermissionToggle
                                            key={perm.key}
                                            label={t(perm.labelKey)}
                                            description={t(perm.descKey)}
                                            enabled={!!permissions[perm.key]}
                                            onChange={(enabled) => handlePermissionChange(perm.key, enabled)}
                                            disabled={updatePermissionsMutation.isPending}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Section Activité Récente (Suggestion) */}
                <section className={`${sectionStyle} p-4 sm:p-6`}>
                     <div className="flex items-center gap-3 mb-4">
                        <IoTrendingUpOutline className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('collaborator.activity.title')}</h2>
                    </div>
                    <StateDisplay variant='info' icon={IoTrendingUpOutline} title={t('common.comingSoon')} description={t('collaborator.activity.comingSoonDesc')} />
                </section>

                 {/* Zone de Danger */}
                 <section className={`${sectionStyle} border-red-500/20 dark:border-red-500/30 bg-red-500/5 dark:bg-red-900/10 p-4 sm:p-6`}>
                     <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">{t('common.dangerZone')}</h3>
                     <p className="mt-1 text-sm text-red-700 dark:text-red-400 mb-4">{t('collaborator.removeDesc')}</p>
                     <button onClick={handleRemoveCollaborator} disabled={removeCollaboratorMutation.isPending} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60">
                        <IoTrash /> {t('collaborator.removeButton')}
                     </button>
                </section>
            </main>
        </div>
    );
}

// --- JSON de traduction `fr.json` à ajouter ---
/*
{
  "permissions": {
    "title": "Permissions du Collaborateur",
    "updateSuccess": "Permissions mises à jour avec succès.",
    "group": {
      "clients": "Gestion des Clients",
      "products": "Gestion des Produits",
      "orders": "Gestion des Commandes"
    },
    "filter_client": { "label": "Voir les clients", "desc": "Peut accéder à la liste des clients et voir leurs détails." },
    "ban_client": { "label": "Bannir un client", "desc": "Peut changer le statut d'un client à 'Banni'." },
    "filter_product": { "label": "Voir les produits", "desc": "Peut accéder à la liste des produits." },
    "edit_product": { "label": "Modifier un produit", "desc": "Peut éditer les informations, prix et variantes d'un produit." },
    "create_delete_product": { "label": "Créer/Supprimer un produit", "desc": "Peut ajouter de nouveaux produits et en supprimer." },
    "filter_command": { "label": "Voir les commandes", "desc": "Peut accéder à la liste des commandes et voir leurs détails." },
    "manage_command": { "label": "Gérer les commandes", "desc": "Peut changer le statut d'une commande (confirmer, expédier, etc.)." }
  },
  "collaborator": {
    "confirmDelete": "Révoquer l'accès de {{name}} ?",
    "deleteSuccess": "Collaborateur révoqué avec succès.",
    "removeDesc": "Révoquer l'accès de ce collaborateur l'empêchera de se connecter à ce tableau de bord. Cette action est réversible.",
    "removeButton": "Révoquer l'accès"
  },
  "activity": {
      "title": "Activité Récente",
      "comingSoonDesc": "L'historique des actions de ce collaborateur sera bientôt disponible ici."
  },
  "common": {
      "dangerZone": "Zone de Danger",
      "comingSoon": "Bientôt disponible"
  }
}
*/