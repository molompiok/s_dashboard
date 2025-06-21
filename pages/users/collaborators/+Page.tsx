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
import { IoAddSharp, IoCloudOfflineOutline, IoPeopleOutline, IoWarningOutline } from 'react-icons/io5';
import { PageNotFound } from '../../../Components/PageNotFound/PageNotFound';
import { ChildViewer } from '../../../Components/ChildViewer/ChildViewer';
import { Pagination } from '../../../Components/Pagination/Pagination';
import { buttonStyle, buttonStyleSimple } from '../../../Components/Button/Style';
import { useGlobalStore } from '../../../api/stores/StoreStore';
import { StateDisplay } from '../../../Components/StateDisplay/StateDisplay';

export { Page };

function Page() {
    const { t } = useTranslation();
    const {currentStore} = useGlobalStore()
    const { openChild } = useChildViewer();
    const [filter, setFilter] = useState<{ page?: number, limit?: number }>({ page: 1, limit: 20 });
    const { data: collaboratorsData, isLoading, isError, error } = useGetCollaborators(filter);
    const collaborators = collaboratorsData?.list ?? [];
    const meta = collaboratorsData?.meta;

    const handleOpenAddPopup = () => {
        openChild(
            <ChildViewer title={t('collaborator.addPopupTitle')}>
                <AddCollaboratorPopup onSuccess={() => ''} onCancel={() => ''} />
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
        { name: '..', url: '/' },
        { name: t('navigation.users'), url: '/users' },
        { name: t('navigation.collaborators') },
    ];

    const renderContent = () => {
        // 1. GESTION DU CHARGEMENT (avec skeleton d'items)
        if (isLoading || !currentStore) {
            return Array.from({ length: 4 }).map((_, i) => <CollaboratorListSkeleton key={`skel-${i}`} />);
        }

        // 2. GESTION DES ERREURS
        if (isError) {
            // Cas spécifique : Accès Interdit (403)
            if (error.status === 403) {
                return (
                    <div className="p-8">
                        <StateDisplay
                            variant="danger"
                            icon={IoWarningOutline}
                            title={t('unauthorized_action')}
                            description={t('collaborator.ownerOnly')}
                        />
                    </div>
                );
            }
            // Cas d'erreur générique
            return (
                <div className="p-8">
                    <StateDisplay
                        variant="danger"
                        icon={IoCloudOfflineOutline}
                        title={t('common.error.title')}
                        description={error.message || t('common.error.genericDesc')}
                    >
                        {/* On pourrait ajouter un bouton "Réessayer" ici */}
                    </StateDisplay>
                </div>
            );
        }

        // 3. GESTION DE L'ÉTAT VIDE
        if (collaborators.length === 0) {
            return (
                <div className="p-8">
                    <StateDisplay
                        variant="info"
                        icon={IoPeopleOutline}
                        title={t('collaborator.noCollaboratorsTitle')}
                        description={t('collaborator.noCollaboratorsDesc')}
                    >
                        <button onClick={undefined} className={buttonStyle}>
                            <IoAddSharp size={20} />
                            {t('collaborator.addFirstButton')}
                        </button>
                    </StateDisplay>
                </div>
            );
        }

        // 4. AFFICHAGE NORMAL DE LA LISTE
        return collaborators.map((collabRole) => (
            <CollaboratorItemRow
                key={collabRole.id}
                collaboratorRole={collabRole}
                onEditPermissions={() => ''}
            />
        ));
    };

    return (
        // 🎨 Fond global géré par root, on s'assure que le contenu textuel s'adapte
        <div className="collaborator-list pb-[200px] w-full min-h-screen flex flex-col">
            <Topbar back={true} title={t('collaborator.pageTitle')} breadcrumbs={breadcrumbs} />
            <main className="w-full max-w-5xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">

                {/* En-tête: Titre et Bouton Ajouter */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{t('collaborator.listTitle')}</h1>
                    <button onClick={handleOpenAddPopup} className={buttonStyleSimple}>
                        <IoAddSharp size={20} />
                        <span className="hidden sm:inline">{t('collaborator.addButton')}</span>
                    </button>
                </div>

                {/* 🎨 Liste des Collaborateurs avec effet verre dépoli en mode nuit */}
                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-lg shadow-sm border border-gray-200/80 dark:border-white/10 overflow-hidden">
                    <div className="flex flex-col">
                         {renderContent()}
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