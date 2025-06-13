// pages/users/collaborators/+Page.tsx

import { useState } from 'react';
import { BreadcrumbItem, Topbar } from '../../../Components/TopBar/TopBar';
import { useTranslation } from 'react-i18next';
import { useGetCollaborators } from '../../../api/ReactSublymusApi';
import { Role as RoleInterface, UserInterface } from '../../../api/Interfaces/Interfaces';
// 🎨 Utiliser le bon composant de ligne et de skeleton
import { CollaboratorItemRow, CollaboratorListSkeleton } from '../../../Components/CollaboratorList/CollaboratorItemRow';
import { AddCollaboratorPopup } from '../../../Components/CollaboratorList/AddCollaboratorPopup';
import { PermissionsPopup } from '../../../Components/CollaboratorList/PermissionsPopup';
import { useChildViewer } from '../../../Components/ChildViewer/useChildViewer';
import { IoAddSharp } from 'react-icons/io5';
import { PageNotFound } from '../../../Components/PageNotFound/PageNotFound';
import { ChildViewer } from '../../../Components/ChildViewer/ChildViewer';
import { Pagination } from '../../../Components/Pagination/Pagination';

export { Page };

// 🎨 Définition du style du bouton principal pour utiliser `teal`
const primaryButtonStyle = "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-lg shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors dark:focus:ring-offset-gray-900";

function Page() {
    const { t } = useTranslation();
    const { openChild } = useChildViewer();
    const [filter, setFilter] = useState<{ page?: number, limit?: number }>({ page: 1, limit: 20 });
    const { data: collaboratorsData, isLoading, isError, error } = useGetCollaborators(filter);
    const collaborators = collaboratorsData?.list ?? [];
    const meta = collaboratorsData?.meta;

    const handleOpenAddPopup = () => {
        openChild(
            <ChildViewer title={t('collaborator.addPopupTitle')}>
                <AddCollaboratorPopup onSuccess={() => openChild(null)} onCancel={() => openChild(null)} />
            </ChildViewer>,
            // 🎨 Le fond du ChildViewer est déjà parfait pour un effet de flou
            { background: 'rgba(30, 41, 59, 0.7)', blur: 4 }
        );
    };

    const handleOpenPermissionsPopup = (collaboratorRole: RoleInterface & { user: UserInterface }) => {
        openChild(
            <ChildViewer title={t('collaborator.permissionsPopupTitle', { name: collaboratorRole.user.full_name })}>
                <PermissionsPopup collaboratorRole={collaboratorRole} onSuccess={() => openChild(null)} onCancel={() => openChild(null)} />
            </ChildViewer>,
            { background: 'rgba(30, 41, 59, 0.7)', blur: 4 }
        );
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { name: t('navigation.home'), url: '/' },
        { name: t('navigation.users'), url: '/users' },
        { name: t('navigation.collaborators') },
    ];

    if (isError && error?.status === 403) {
        return <PageNotFound title={t('unauthorized_action')} description={t('collaborator.ownerOnly')} />;
    }
    if (isError) {
        return <div className="p-6 text-center text-red-500">{error?.message || t('error_occurred')}</div>;
    }

    return (
        // 🎨 Fond global géré par root, on s'assure que le contenu textuel s'adapte
        <div className="collaborator-list pb-[200px] w-full min-h-screen flex flex-col">
            <Topbar back={true} title={t('collaborator.pageTitle')} breadcrumbs={breadcrumbs} />
            <main className="w-full max-w-5xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">

                {/* En-tête: Titre et Bouton Ajouter */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{t('collaborator.listTitle')}</h1>
                    <button onClick={handleOpenAddPopup} className={primaryButtonStyle}>
                        <IoAddSharp size={20} />
                        <span className="hidden sm:inline">{t('collaborator.addButton')}</span>
                    </button>
                </div>

                {/* 🎨 Liste des Collaborateurs avec effet verre dépoli en mode nuit */}
                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-lg shadow-sm border border-gray-200/80 dark:border-white/10 overflow-hidden">
                    <div className="flex flex-col">
                        {isLoading && (
                            Array.from({ length: 3 }).map((_, i) => <CollaboratorListSkeleton key={`skel-${i}`} />)
                        )}
                        {!isLoading && collaborators.length === 0 && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center p-8">{t('collaborator.noCollaborators')}</p>
                        )}
                        {!isLoading && collaborators.map((collabRole) => (
                            <CollaboratorItemRow
                                key={collabRole.id}
                                collaboratorRole={collabRole}
                                onEditPermissions={() => handleOpenPermissionsPopup(collabRole)}
                            />
                        ))}
                    </div>
                </div>

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