// Components/CollaboratorList/CollaboratorItemRow.tsx

import { Role as RoleInterface, TypeJsonRole, UserInterface } from "../../api/Interfaces/Interfaces";
import { useTranslation } from "react-i18next";
import { getImg } from "../Utils/StringFormater";
import { IoMailOutline, IoPencil, IoShieldCheckmarkOutline, IoTrash } from "react-icons/io5"; // Icônes
import { useRemoveCollaborator } from "../../api/ReactSublymusApi"; // Hook suppression
import { useChildViewer } from "../ChildViewer/useChildViewer"; // Pour confirmation
import { ConfirmDelete } from "../Confirm/ConfirmDelete";
import { ChildViewer } from "../ChildViewer/ChildViewer";
import logger from "../../api/Logger";
import { showErrorToast, showToast } from "../Utils/toastNotifications";

interface CollaboratorItemRowProps {
    collaboratorRole: RoleInterface & { user: UserInterface }; // Type combiné attendu de l'API
    onEditPermissions: () => void; // Callback pour ouvrir le popup des permissions
    // onDeleteSuccess?: (userId: string) => void; // Callback optionnel
}

export function CollaboratorItemRow({ collaboratorRole, onEditPermissions }: CollaboratorItemRowProps) {
    const { t } = useTranslation();
    const { openChild } = useChildViewer();
    const deleteCollaboratorMutation = useRemoveCollaborator();

    const user = collaboratorRole.user; // Accès direct à l'objet user
    const role = collaboratorRole; // Accès à l'objet role (permissions)

    // Compter les permissions actives (exemple simple)
    const activePermissionsCount = Object.keys(role).filter(key => key !== 'id' && key !== 'user_id' && key !== 'created_at' && key !== 'updated_at' && (role as any)[key] === true).length;

    // Handler pour la suppression
    const handleDelete = () => {
        openChild(
            <ChildViewer>
                <ConfirmDelete
                    title={t('collaborator.confirmDelete', { name: user.full_name || user.email })}
                    onCancel={() => openChild(null)}
                    onDelete={() => {
                        deleteCollaboratorMutation.mutate(
                            {
                                user_id: user.id,
                            },
                            {
                                onSuccess: () => {
                                    logger.info(`Collaborator ${user.id} removed`);
                                    openChild(null);
                                    showToast("Collaborateur supprimé avec succès", 'WARNING'); // ✅ Toast succès
                                },
                                onError: (error) => {
                                    logger.error({ error }, `Failed to remove collaborator ${user.id}`);
                                    openChild(null);
                                    showErrorToast(error); // ❌ Toast erreur
                                },
                            }
                        );
                    }}
                />
            </ChildViewer>,
            { background: '#3455' }
        );
    };

    return (
        // Utiliser flex, items-center, gap, padding, border-b, hover
        <div className="collaborator-item-row flex items-center gap-3 sm:gap-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50">

            {/* Avatar/Initiales */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cover bg-center bg-gray-200 text-gray-500 font-medium text-sm flex items-center justify-center"
                style={{ backgroundImage: user.photo?.[0] ? getImg(user.photo[0]) : 'none' }}
            >
                {!user.photo?.[0] && (user.full_name?.substring(0, 2).toUpperCase() || '?')}
            </div>

            {/* Nom & Email */}
            {/* Utiliser flex-grow min-w-0 */}
            <div className="flex-grow min-w-0 flex flex-col">
                <p className='font-medium text-sm text-gray-800 truncate' title={user.full_name}>
                    {user.full_name || t('common.anonymous')}
                </p>
                <a href={`mailto:${user.email}`} className='text-xs text-gray-500 mt-0.5 flex items-center gap-1 hover:text-blue-600 w-fit' title={user.email}>
                    <IoMailOutline className="w-3 h-3" />
                    <span className="truncate">{user.email}</span>
                </a>
            </div>

            {/* Nombre de Permissions (visible sur sm+) */}
            <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500 flex-shrink-0 w-28" title={t('collaborator.activePermissionsTooltip')}>
                <IoShieldCheckmarkOutline className="w-4 h-4 text-gray-400" />
                <span>{t('collaborator.permissionsCount', { count: activePermissionsCount })}</span>
            </div>

            {/* Date d'ajout (visible sur md+) */}
            {/* <div className="hidden md:flex items-center gap-1 text-xs text-gray-500 flex-shrink-0 w-24" title={t('common.createdAt')}>
                 <span>{DateTime.fromISO(role.created_at).setLocale(t('common.locale')).toLocaleString(DateTime.DATE_SHORT)}</span>
             </div> */}

            {/* Actions */}
            {/* Utiliser flex-shrink-0 ml-auto sm:ml-0 gap-2 */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-auto sm:ml-0">
                {/* Bouton Modifier Permissions */}
                <button
                    onClick={onEditPermissions}
                    className="p-1.5 rounded text-gray-400 hover:bg-gray-100 hover:text-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    title={t('collaborator.editPermissionsButton')}
                >
                    <IoPencil className="w-4 h-4" />
                </button>
                {/* Bouton Supprimer */}
                <button
                    onClick={handleDelete}
                    disabled={deleteCollaboratorMutation.isPending}
                    className="p-1.5 rounded text-gray-400 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50"
                    title={t('common.delete')}
                >
                    <IoTrash className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

// --- Skeleton pour CollaboratorItemRow ---
export function CollaboratorListSkeleton() {
    return (
        <div className="collaborator-item-row flex items-center gap-3 sm:gap-4 px-4 py-3 border-b border-gray-100 animate-pulse">
            {/* Avatar Placeholder */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300"></div>
            {/* Nom & Email Placeholder */}
            <div className="flex-grow min-w-0 flex flex-col gap-1">
                <div className="h-5 w-2/5 bg-gray-300 rounded"></div> {/* Nom */}
                <div className="h-3 w-3/5 bg-gray-200 rounded"></div> {/* Email */}
            </div>
            {/* Permissions Placeholder */}
            <div className="hidden sm:flex h-4 w-20 bg-gray-200 rounded flex-shrink-0"></div>
            {/* Actions Placeholder */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-auto sm:ml-0">
                <div className="w-7 h-7 bg-gray-200 rounded"></div>
                <div className="w-7 h-7 bg-gray-200 rounded"></div>
            </div>
        </div>
    );
}
