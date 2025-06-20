// pages/users/clients/@id/comments/+Page.tsx (Adapter chemin si nécessaire)

import { useEffect, useState, useMemo } from "react"; // Ajouter useMemo
import { getTransmit, useGlobalStore } from "../../../../../api/stores/StoreStore";
// import { useClientStore } from "../../ClientStore"; // Remplacé par hook API
import { CommentInterface, StoreInterface, UserInterface, ValueInterface } from "../../../../../api/Interfaces/Interfaces";
import { usePageContext } from "../../../../../renderer/usePageContext";
// import { useApp } from "../../../../../renderer/AppStore/UseApp"; // Remplacé par useChildViewer
import { useChildViewer } from "../../../../../Components/ChildViewer/useChildViewer"; // ✅ Hook popup
// import { useCommentStore } from "../../../../products/@id/comments/CommentStore"; // Remplacé par hook API
import { useGetUsers, useGetComments, useDeleteComment } from '../../../../../api/ReactSublymusApi'; // ✅ Importer hooks API
import { BreadcrumbItem, Topbar } from "../../../../../Components/TopBar/TopBar";
import { ChildViewer } from "../../../../../Components/ChildViewer/ChildViewer";
import { ConfirmDelete } from "../../../../../Components/Confirm/ConfirmDelete";
import { PageNotFound } from "../../../../../Components/PageNotFound/PageNotFound";
import { AnimatePresence, motion } from "framer-motion"; // Garder pour animation
import { IoChatbubbleEllipsesOutline, IoChevronForward, IoStar, IoTrash, IoWarningOutline } from "react-icons/io5";
import { limit } from "../../../../../Components/Utils/functions"; // Garder utilitaire
import { getMedia } from "../../../../../Components/Utils/StringFormater";
import UserPreview from "../../../../../Components/userPreview/userPreview"; // Garder composant preview
// import '../../../../products/@id/comments/+Page.css'; // ❌ Supprimer
import { getDefaultValues } from "../../../../../Components/Utils/parseData";
import { useTranslation } from "react-i18next"; // ✅ i18n
import logger from "../../../../../api/Logger";
import { queryClient } from "../../../../../api/ReactSublymusApi"; // Pour invalidation SSE
import { NO_PICTURE } from "../../../../../Components/Utils/constants";
import { DateTime } from "luxon";
import { UseMutationResult } from "@tanstack/react-query";
import { StateDisplay } from "../../../../../Components/StateDisplay/StateDisplay";

export default function Page() {
    const { t } = useTranslation(); // ✅ i18n
    // const { comments, fetchClientComments, deleteComment } = useCommentStore(); // Remplacé
    const { currentStore } = useGlobalStore();
    // const { fetchClients } = useClientStore(); // Remplacé
    // const [user, setUser] = useState<Partial<UserInterface>>(); // Géré par React Query
    const { routeParams } = usePageContext();
    const { openChild } = useChildViewer();
    const userId = routeParams?.['id'];

    // ✅ Utiliser React Query pour l'utilisateur
    const { data: userData, isLoading: isLoadingUser, isError: isUserError, error: userError } = useGetUsers(
        { user_id: userId, with_client_stats: true }, // Demander les stats ici
        { enabled: !!userId }
    );
    const user = userData?.list?.[0];

    // ✅ Utiliser React Query pour les commentaires
    const { data: commentsData, isLoading: isLoadingComments, isError: isCommentsError, error: commentsError, refetch: refetchComments } = useGetComments(
        { user_id: userId, with_products: true, order_by: 'created_at_desc' }, // Trier par défaut
        { enabled: !!userId }
    );
    const comments = commentsData?.list ?? [];

    // ✅ Utiliser la mutation pour supprimer
    const deleteCommentMutation = useDeleteComment();

    // --- Logique SSE (inchangée mais utilise refetchComments) ---
    useEffect(() => {
        if (!currentStore?.api_url || !userId) return;
        const transmit = getTransmit(currentStore.api_url);
        const channel = `store/${currentStore.id}/user/${userId}/comment`; // Écouter les changements de CE user
        logger.info(`Subscribing to SSE channel for user comments: ${channel}`);
        const subscription = transmit?.subscription(channel);
        async function subscribe() {
            if (!subscription) return;
            try {
                await subscription.create();
                subscription.onMessage<{ event: string, id: string }>(() => { // Recevoir l'event
                    logger.info(`Received SSE update for user ${userId} comments. Refetching...`);
                    // Invalider ou refetch directement
                    refetchComments();
                    // Rafraichir aussi les données user si les stats ont pu changer
                    queryClient.invalidateQueries({ queryKey: ['users', { user_id: userId }] });
                });
            } catch (err) {
                logger.error({ channel, userId, error: err }, "Failed to subscribe to user comment SSE channel");
            }
        }
        subscribe();
        return () => {
            logger.info(`Unsubscribing from SSE channel: ${channel}`);
            subscription?.delete();
        };
    }, [currentStore?.id, currentStore?.api_url, userId, refetchComments]); // Ajouter refetchComments

    // --- Handler Suppression ---
    const handleDelete = (commentId: string, commentTitle?: string) => {
        openChild(<ChildViewer>
            <ConfirmDelete
                title={t('comment.confirmDelete', { title: limit(commentTitle || t('comment.thisComment'), 20) })}
                onCancel={() => openChild(null)}
                onDelete={() => {
                    deleteCommentMutation.mutate({
                        comment_id: commentId
                    }, {
                        onSuccess: () => {
                            logger.info(`Comment ${commentId} deleted by admin/owner`);
                            // Invalidation gérée par le hook useDeleteComment, mais on peut forcer refetch ici
                            // refetchComments(); // Optionnel si invalidation hook fonctionne
                            // Rafraîchir stats user
                            queryClient.invalidateQueries({ queryKey: ['users', { user_id: userId }] });
                            openChild(null);
                        },
                        onError: (error: any) => {
                            logger.error({ error }, `Failed to delete comment ${commentId}`);
                            openChild(null);
                            // Afficher toast erreur
                        }
                    });
                }}
            />
        </ChildViewer>, { background: '#3455' });
    };

     const breadcrumbs: BreadcrumbItem[] = useMemo(() => {
        const crumbs: BreadcrumbItem[] = [
            { name: '..', url: '/users/clients' },
        ];

        // 3. Lien vers le détail du client actuel (si l'utilisateur est chargé)
        if (user) {
            crumbs.push({ 
                name: limit(user.full_name || t('common.anonymous'), 20), // Nom du client, tronqué
                url: `/users/clients/${userId}` // Lien vers sa page de détail
            });
             // 4. Page actuelle (sans lien)
            crumbs.push({ name: t('usersPage.stats.rated') });
        } else if (isLoadingUser) {
            // Afficher "Chargement..." pendant que les données arrivent
            crumbs.push({ name: t('common.loading') });
        } else {
             // Afficher "Erreur" si l'utilisateur n'a pas pu être chargé
            crumbs.push({ name: t('common.error.title') });
        }

        return crumbs;
    }, [t, user, userId, isLoadingUser]);


    // 1. État de Chargement : On attend que l'utilisateur soit chargé.
    if (isLoadingUser || !currentStore) {
        return <UserCommentsPageSkeleton />;
    }

    // 2. État d'Erreur sur l'utilisateur : C'est une erreur bloquante.
    if (isUserError || !user) {
        const isNotFound = userError?.status === 404 || !user;
        const title = isNotFound ? t('clientDetail.notFoundTitle') : t('common.error.title');
        const description = isNotFound ? t('clientDetail.notFoundDesc') : (userError?.message || t('common.error.genericDesc'));

        return (
            <div className="w-full min-h-screen flex flex-col">
                <Topbar back title={title} breadcrumbs={breadcrumbs}/>
                <main className="flex-grow flex items-center justify-center p-4">
                    <StateDisplay variant="danger" icon={IoWarningOutline} title={title} description={description}>
                        <a href={`/users/clients`} className="...">{t('clientDetail.backToList')}</a>
                    </StateDisplay>
                </main>
            </div>
        );
    }

    // Si on arrive ici, on a un utilisateur valide. On peut maintenant gérer les commentaires.
    return (
        <div className="user-comments-detail w-full pb-[200px] flex flex-col min-h-screen">
            <Topbar back title={t('userComments.pageTitle', { name: user.full_name || '' })} breadcrumbs={breadcrumbs}/>
            <main className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
                <UserPreview user={user} />

                <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{t('userComments.listTitle')}</h1>

                {/* On gère l'erreur et l'état vide des commentaires ici */}
                {isLoadingComments ? (
                    // On peut afficher un spinner ou un mini-skeleton pour la grille de commentaires
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4 animate-pulse">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-48 bg-gray-200 dark:bg-white/5 rounded-lg"></div>
                        ))}
                    </div>
                ) : isCommentsError ? (
                    // Erreur sur les commentaires, mais on affiche quand même les infos utilisateur
                    <StateDisplay variant="warning" icon={IoWarningOutline} title={t('common.error.title')} description={t('userComments.errorLoadingComments')} />
                ) : comments.length === 0 ? (
                    // Aucun commentaire trouvé
                    <StateDisplay variant="info" icon={IoChatbubbleEllipsesOutline} title={t('userComments.noCommentsTitle')} description={t('userComments.noCommentsDesc')} />
                ) : (
                    // Affichage normal des commentaires
                    <CommentsDashboard
                        deleteCommentMutation={deleteCommentMutation}
                        comments={comments}
                        currentStore={currentStore || {}}
                        onDelete={handleDelete}
                    />
                )}
            </main>
        </div>
    );
}
// --- Composant CommentsDashboard (Bentō Layout) ---
type Props = {
    comments: CommentInterface[];
    deleteCommentMutation: UseMutationResult<any, any, any>
    currentStore: Partial<StoreInterface>; // Peut être partiel pendant chargement
    onDelete: (commentId: string) => void;
};

const CommentsDashboard: React.FC<Props> = ({ deleteCommentMutation, comments, currentStore, onDelete }) => {
    const { t } = useTranslation(); // ✅ i18n
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

    const toggleDescription = (commentId: string) => {
        setExpandedComments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(commentId)) newSet.delete(commentId);
            else newSet.add(commentId);
            return newSet;
        });
    };

    const getDescriptionPreview = (description: string | null | undefined): string => {
        if (!description) return '';
        const maxLength = 100; // Limite preview
        if (description.length <= maxLength) return description;
        return description.substring(0, maxLength) + '...';
    };

    return (
        // Utiliser grid Tailwind avec auto-fit et minmax
        <div className="comments-bento grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
            <AnimatePresence>
                {comments.map((comment) => {
                    const isExpanded = expandedComments.has(comment.id);
                    const description = comment.description ?? ''; // Fallback si null
                    const needsSeeMore = description.length > 100;
                    // Image du produit commenté
                    const v = comment.product && getDefaultValues(comment.product)?.[0];
                    const imageUrl = v?.views?.[0] ?? comment.product?.features?.find(f => f.is_default)?.values?.[0]?.views?.[0] ?? NO_PICTURE;
                    const imageSrc = getMedia({ source: imageUrl, from: 'api' });

                    return (
                        <motion.div
                            key={comment.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            // Utiliser les classes Tailwind pour la carte
                            className="comment-card relative flex flex-col gap-2 bg-white rounded-lg p-4 shadow-sm border border-gray-200"
                        // Calcul de hauteur dynamique (complexe, peut être omis pour V1)
                        // style={{ gridRow: `span ${Math.ceil(description.length / 200) + 1}` }}
                        >
                            {/* Info Produit */}
                            <div className="comment-user flex items-center gap-2 pb-2 border-b border-gray-100">
                                {/* Image Produit */}
                                <a href={`/products/${comment.product?.id}`} className="flex-shrink-0">
                                    <img
                                        src={imageSrc || NO_PICTURE}
                                        alt={comment.product?.name || ''}
                                        className="comment-user-photos product w-10 h-10 rounded-md object-cover bg-gray-100" // Ajuster taille
                                    />
                                </a>
                                {/* Nom Produit */}
                                <span className="comment-user-name text-sm font-medium text-gray-700 truncate flex-grow" title={comment.product?.name}>
                                    {comment.product?.name || t('common.unknownProduct')}
                                </span>
                                {/* Lien Ouvrir Produit */}
                                <a href={`/products/${comment.product?.id}`} className="open-item flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline flex-shrink-0">
                                    {t('common.open')} <IoChevronForward />
                                </a>
                            </div>

                            {/* Contenu Commentaire */}
                            <div className="comment-content flex flex-col gap-2 flex-grow">
                                {/* Titre Commentaire */}
                                <h2 className="comment-title font-semibold text-base text-gray-800">{comment.title}</h2>
                                {/* Note (Étoiles) */}
                                <div className="comment-stars flex gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <IoStar key={i} className={`w-4 h-4 ${i < (comment.rating ?? 0) ? 'text-yellow-400' : 'text-gray-300'}`} />
                                    ))}
                                </div>
                                {/* Description */}
                                {description && (
                                    <p className="comment-description text-sm text-gray-600 leading-relaxed">
                                        {isExpanded ? description : getDescriptionPreview(description)}
                                    </p>
                                )}
                                {needsSeeMore && (
                                    <button
                                        className="see-more-btn text-blue-600 hover:underline text-sm self-start mt-1"
                                        onClick={() => toggleDescription(comment.id)}
                                    >
                                        {isExpanded ? t('common.seeLess') : t('common.seeMore')}
                                    </button>
                                )}
                                {/* Images du Commentaire */}
                                {comment.views && comment.views.length > 0 && (
                                    <div className="comment-views flex flex-wrap gap-2 mt-2">
                                        {comment.views.map((url, i) => (
                                            <img
                                                key={i}
                                                src={currentStore.url + url} // Assumer URL relative
                                                alt={`${t('comment.viewAlt')} ${i + 1}`} // 🌍 i18n
                                                className="w-16 h-16 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80"
                                                onClick={() => {/* TODO: Ouvrir lightbox */ }}
                                            />
                                        ))}
                                    </div>
                                )}
                                {/* Variantes (bind_name) */}
                                {comment.bind_name && typeof comment.bind_name === 'object' && Object.keys(comment.bind_name).length > 0 && (
                                    <ul className="comment-values list-none p-0 mt-2 flex flex-wrap gap-x-3 gap-y-1">
                                        {Object.entries(comment.bind_name).map(([key, value]) => {
                                            // Copié/collé de CommandProduct, adapter si besoin
                                            const [featureName] = key.split(':');
                                            const valueText = typeof value === 'string' ? value : (value as ValueInterface)?.text;
                                            if (!featureName || !valueText) return null;
                                            return (
                                                <li key={key} className="flex items-center border border-gray-200 rounded text-xs leading-none max-w-full">
                                                    <span className='bg-gray-100 text-gray-600 px-1.5 py-1 rounded-l'>{limit(featureName, 12)}</span>
                                                    <span className='text-gray-800 px-1.5 py-1 truncate rounded-r' title={valueText || undefined}>{limit(valueText, 16)}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                                {/* Date */}
                                <p className="comment-date text-xs text-gray-400 mt-auto pt-2"> {/* mt-auto pour pousser en bas */}
                                    {t('common.createdAt')}: {DateTime.fromISO(comment.created_at).setLocale(t('common.locale')).toLocaleString(DateTime.DATETIME_SHORT)}
                                </p>
                            </div>
                            {/* Bouton Supprimer */}
                            <button
                                className="comment-delete absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition disabled:opacity-50"
                                onClick={() => onDelete(comment.id)}
                                disabled={deleteCommentMutation.isPending} // Désactiver pendant suppression
                                aria-label={t('comment.deleteLabel')}
                                title={t('comment.deleteLabel')}
                            >
                                <IoTrash className="w-4 h-4" /> {/* Taille réduite */}
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};


const SkeletonCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-gray-100/80 dark:bg-white/5 rounded-xl border border-gray-200/50 dark:border-white/10 p-4 sm:p-6 ${className}`}>
        {children}
    </div>
);

export function UserCommentsPageSkeleton() {
    return (
        <div className="w-full min-h-screen flex flex-col animate-pulse">
            <Topbar back title="..." />

            <main className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
                {/* Squelette de UserPreview */}
                <SkeletonCard className="flex flex-col md:flex-row items-center md:items-start gap-6">
                    <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0"></div>
                    <div className="flex-grow w-full space-y-3">
                        <div className="h-7 w-1/2 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                        <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-600 rounded-md"></div>
                        <div className="h-4 w-2/3 bg-gray-300 dark:bg-gray-600 rounded-md"></div>
                    </div>
                </SkeletonCard>

                {/* Titre Section */}
                <div className="h-7 w-1/3 bg-gray-300 dark:bg-gray-600 rounded-lg mt-2"></div>

                {/* Squelette de la grille de commentaires */}
                <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-48 bg-gray-200 dark:bg-white/5 rounded-lg"></div>
                    ))}
                </div>
            </main>
        </div>
    );
}