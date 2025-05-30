// pages/users/collaborators/+Page.tsx

import { useState } from 'react';
import { BreadcrumbItem, Topbar } from '../../../Components/TopBar/TopBar';
import { useTranslation } from 'react-i18next';
import { useGetCollaborators, useCreateCollaborator } from '../../../api/ReactSublymusApi'; // Importer hooks
import { UserInterface, Role as RoleInterface, TypeJsonRole } from '../../../api/Interfaces/Interfaces'; // Importer Role interface
import { CollaboratorItemRow } from '../../../Components/CollaboratorList/CollaboratorItemRow'; // Nouveau composant
import { CommandItemSkeleton } from '../../../Components/CommandItem/CommandItem'; // Nouveau skeleton
import { AddCollaboratorPopup } from '../../../Components/CollaboratorList/AddCollaboratorPopup'; // Nouveau popup
import { PermissionsPopup } from '../../../Components/CollaboratorList/PermissionsPopup'; // Nouveau popup
import { useChildViewer } from '../../../Components/ChildViewer/useChildViewer'; // Hook popup
import { IoAddSharp } from 'react-icons/io5';
import { PageNotFound } from '../../../Components/PageNotFound/PageNotFound'; // Pour Not Found / Erreur
import { ChildViewer } from '../../../Components/ChildViewer/ChildViewer';
import { Pagination } from '../../../Components/Pagination/Pagination';
import { buttonStyle } from '../../../Components/Button/Style';

export { Page };

function Page() {
    const { t } = useTranslation();
    const { openChild } = useChildViewer();

    // --- État ---
    // Pagination/Filtre (si nécessaire plus tard)
    const [filter, setFilter] = useState<{ page?: number, limit?: number }>({ page: 1, limit: 20 });

    // --- Récupération Données ---
    const { data: collaboratorsData, isLoading, isError, error, refetch } = useGetCollaborators(
        filter,
        // { enabled: true } // Activé par défaut
    );
    const collaborators = collaboratorsData?.list ?? [];
    const meta = collaboratorsData?.meta;

    // --- Handlers ---
    const handleOpenAddPopup = () => {
        openChild(
            <ChildViewer title={t('collaborator.addPopupTitle')}>
                <AddCollaboratorPopup
                    onSuccess={() => {
                        // Invalidation gérée par le hook useCreateCollaborator
                        openChild(null);
                        // Afficher toast?
                    }}
                    onCancel={() => openChild(null)}
                />
            </ChildViewer>,
            { background: 'rgba(51, 65, 85, 0.7)', blur: 3 }
        );
    };

    const handleOpenPermissionsPopup = (collaboratorRole: RoleInterface & { user: UserInterface }) => {
        openChild(
            <ChildViewer title={t('collaborator.permissionsPopupTitle', { name: collaboratorRole.user.full_name })}>
                <PermissionsPopup
                    collaboratorRole={collaboratorRole}
                    onSuccess={() => {
                        // Invalidation gérée par le hook useUpdateCollaboratorPermissions
                        openChild(null);
                    }}
                    onCancel={() => openChild(null)}
                />
            </ChildViewer>,
            { background: 'rgba(51, 65, 85, 0.7)', blur: 3 }
        );
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { name: t('navigation.home'), url: '/' },
        { name: t('navigation.users'), url: '/users' }, // Page parente
        { name: t('navigation.collaborators') }, // Page actuelle
    ];

    // Le handler delete sera probablement dans CollaboratorItemRow

    // --- Rendu ---
    if (isError && error?.status === 403) {
        return <PageNotFound title={t('unauthorized_action')} description={t('collaborator.ownerOnly')} />; // Message spécifique si 403
    }
    if (isError) {
        return <div className="p-6 text-center text-red-500">{error?.message || t('error_occurred')}</div>;
    }


    return (
        <div className="collaborator-list pb-[200px] w-full min-h-screen flex flex-col">
            <Topbar back={true} title={t('collaborator.pageTitle')} breadcrumbs={breadcrumbs} />
            <main className="w-full max-w-5xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">

                {/* En-tête: Titre et Bouton Ajouter */}
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-semibold text-gray-900">{t('collaborator.listTitle')}</h1>
                    <button
                        onClick={handleOpenAddPopup}
                        className={buttonStyle}
                    >
                        <IoAddSharp size={20} />
                        {t('collaborator.addButton')}
                    </button>
                </div>
                {/* Liste des Collaborateurs */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="flex flex-col">
                        {/* Entêtes de tableau (optionnel, ou géré dans Row) */}
                        {/* ... */}

                        {/* Liste */}
                        {isLoading && (
                            Array.from({ length: 3 }).map((_, i) => <CommandItemSkeleton key={`skel-${i}`} />)
                        )}
                        {!isLoading && collaborators.length === 0 && (
                            <p className="text-sm text-gray-500 text-center p-6">{t('collaborator.noCollaborators')}</p>
                        )}
                        {!isLoading && collaborators.map((collabRole) => (
                            <CollaboratorItemRow
                                key={collabRole.id}
                                collaboratorRole={collabRole}
                                onEditPermissions={() => handleOpenPermissionsPopup(collabRole)}
                            // onDelete sera géré dans CollaboratorItemRow avec useRemoveCollaborator
                            />
                        ))}
                    </div>
                </div>
                {/* TODO: Ajouter Pagination si meta existe et lastPage > 1 */}
                {meta && meta.total > meta.per_page && (
                    <Pagination
                        currentPage={meta.current_page}
                        lastPage={meta.last_page}
                        total={meta.total}
                        perPage={meta.per_page}
                        onPageChange={(newPage) => setFilter(prev => ({ ...prev, page: newPage }))}
                    />
                )}
            </main>
        </div>
    );
}