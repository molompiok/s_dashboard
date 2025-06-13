// Components/CollaboratorList/CollaboratorItemRow.tsx

import { Role as RoleInterface, UserInterface } from "../../api/Interfaces/Interfaces";
import { useTranslation } from "react-i18next";
import { getMedia } from "../Utils/StringFormater";
import { IoMailOutline, IoPencil, IoShieldCheckmarkOutline, IoTrash } from "react-icons/io5";
import { useRemoveCollaborator } from "../../api/ReactSublymusApi";
import { useChildViewer } from "../ChildViewer/useChildViewer";
import { ConfirmDelete } from "../Confirm/ConfirmDelete";
import { ChildViewer } from "../ChildViewer/ChildViewer";
import logger from "../../api/Logger";
import { showErrorToast, showToast } from "../Utils/toastNotifications";

interface CollaboratorItemRowProps {
    collaboratorRole: RoleInterface & { user: UserInterface };
    onEditPermissions: () => void;
}

export function CollaboratorItemRow({ collaboratorRole, onEditPermissions }: CollaboratorItemRowProps) {
    const { t } = useTranslation();
    const { openChild } = useChildViewer();
    const deleteCollaboratorMutation = useRemoveCollaborator();

    const user = collaboratorRole.user;
    const role = collaboratorRole;
    const activePermissionsCount = Object.values(role).filter(v => v === true).length;

    const handleDelete = () => {
        openChild(
            <ChildViewer>
                <ConfirmDelete
                    title={t('collaborator.confirmDelete', { name: user.full_name || user.email })}
                    onCancel={() => openChild(null)}
                    onDelete={() => {
                        deleteCollaboratorMutation.mutate({ user_id: user.id }, {
                            onSuccess: () => {
                                showToast(t('collaborator.deleteSuccess'), 'WARNING');
                                openChild(null);
                            },
                            onError: (error) => {
                                showErrorToast(error);
                                openChild(null);
                            },
                        });
                    }}
                />
            </ChildViewer>,
            { background: 'rgba(30, 41, 59, 0.7)', blur: 4 }
        );
    };

    return (
        // 🎨 Style de la ligne avec adaptation au mode nuit
        <div className="collaborator-item-row flex items-center gap-3 sm:gap-4 px-4 py-3 border-b border-gray-100 dark:border-white/10 last:border-b-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-150">

            {/* Avatar/Initiales */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cover bg-center bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium text-sm flex items-center justify-center"
                style={{ background: user.photo?.[0] ? getMedia({ isBackground: true, source: user.photo[0] }) : undefined }}
            >
                {!user.photo?.[0] && (user.full_name?.substring(0, 2).toUpperCase() || '?')}
            </div>

            {/* Nom & Email */}
            <div className="flex-grow min-w-0 flex flex-col">
                <p className='font-medium text-sm text-gray-800 dark:text-gray-100 truncate' title={user.full_name}>
                    {user.full_name || t('common.anonymous')}
                </p>
                {/* 🎨 Lien mailto avec couleur `teal` au survol */}
                <a href={`mailto:${user.email}`} className='text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5 hover:text-teal-600 dark:hover:text-teal-400 w-fit transition-colors' title={user.email}>
                    <IoMailOutline className="w-3.5 h-3.5" />
                    <span className="truncate">{user.email}</span>
                </a>
            </div>

            {/* Nombre de Permissions */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 w-28" title={t('collaborator.activePermissionsTooltip')}>
                <IoShieldCheckmarkOutline className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <span>{t('collaborator.permissionsCount', { count: activePermissionsCount })}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0 ml-auto sm:ml-0">
                {/* 🎨 Bouton Modifier avec couleur `teal` au survol */}
                <button
                    onClick={onEditPermissions}
                    className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-teal-600 dark:hover:text-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                    title={t('collaborator.editPermissionsButton')}
                >
                    <IoPencil className="w-4 h-4" />
                </button>
                {/* Bouton Supprimer */}
                <button
                    onClick={handleDelete}
                    disabled={deleteCollaboratorMutation.isPending}
                    className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-red-100/50 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 transition-all"
                    title={t('common.delete')}
                >
                    <IoTrash className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

// --- Skeleton pour CollaboratorItemRow ---
// 🎨 Skeleton adapté au mode nuit
export function CollaboratorListSkeleton() {
    return (
        <div className="collaborator-item-row flex items-center gap-3 sm:gap-4 px-4 py-3 border-b border-gray-100 dark:border-white/10 animate-pulse">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700"></div>
            <div className="flex-grow min-w-0 flex flex-col gap-2">
                <div className="h-4 w-2/5 bg-gray-300 dark:bg-gray-700 rounded"></div>
                <div className="h-3 w-3/5 bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
            <div className="hidden sm:flex h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded flex-shrink-0"></div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-auto sm:ml-0">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
            </div>
        </div>
    );
}