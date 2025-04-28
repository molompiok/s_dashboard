// pages/products/@id/comments/+Page.tsx

import React, { useState, useEffect, useMemo } from 'react'; // Ajouter useMemo
import { CommentInterface, ProductInterface, StoreInterface, ValueInterface } from '../../../../Interfaces/Interfaces'; // Ajouter ValueInterface
import { motion, AnimatePresence } from 'framer-motion';
// import './+Page.css'; // ❌ Supprimer
import { IoChevronForward, IoStar, IoTrash } from 'react-icons/io5';
// import { useCommentStore } from './CommentStore'; // Remplacé
// import { useProductStore } from '../../ProductStore'; // Remplacé
import { Topbar } from '../../../../Components/TopBar/TopBar';
import { ProductPreview } from '../../../../Components/ProductPreview/ProductPreview';
import { getTransmit, useStore } from '../../../stores/StoreStore';
import { usePageContext } from '../../../../renderer/usePageContext';
import { PageNotFound } from '../../../../Components/PageNotFound/PageNotFound';
import { getImg } from '../../../../Components/Utils/StringFormater';
import { getFileType, limit } from '../../../../Components/Utils/functions';
// import { useApp } from '../../../../renderer/AppStore/UseApp'; // Remplacé
import { useChildViewer } from '../../../../Components/ChildViewer/useChildViewer'; // ✅ Hook popup
import { ConfirmDelete } from '../../../../Components/Confirm/ConfirmDelete';
import { ChildViewer } from '../../../../Components/ChildViewer/ChildViewer';
import { ViewMore } from '../../../../Components/Views/ViewMore'; // ✅ Importer ViewMore
import { useGetProductList, useGetComments, useDeleteComment, queryClient } from '../../../../api/ReactSublymusApi'; // ✅ Importer hooks API
import { useTranslation } from 'react-i18next'; // ✅ i18n
import logger from '../../../../api/Logger';
import { getDefaultValues } from '../../../../Components/Utils/parseData';
import { NO_PICTURE } from '../../../../Components/Utils/constants';
import { DateTime } from 'luxon'; // Pour formater date
import { UseMutationResult } from '@tanstack/react-query';

export default function Page() {
    const { t } = useTranslation(); // ✅ i18n
    // const { comments, fetchProductComments, deleteComment } = useCommentStore(); // Remplacé
    const { currentStore } = useStore();
    // const { fetchProductBy } = useProductStore(); // Remplacé
    // const [product, setProduct] = useState<Partial<ProductInterface>>(); // Géré par React Query
    const { routeParams } = usePageContext();
    const { openChild } = useChildViewer();
    const productId = routeParams?.['id'];

    // ✅ Récupérer Produit
    const { data: productData, isLoading: isLoadingProduct } = useGetProductList(
        { product_id: productId, with_feature: true }, // Charger features/values pour image
        { enabled: !!productId }
    );
    const product = productData?.list?.[0];

    // ✅ Récupérer Commentaires
    const { data: commentsData, isLoading: isLoadingComments, refetch: refetchComments } = useGetComments(
        { product_id: productId, with_users: true, order_by: 'created_at_desc' },
        { enabled: !!productId }
    );
    const comments = commentsData?.list ?? [];

    // ✅ Mutation Suppression
    const deleteCommentMutation = useDeleteComment();

    // --- Logique SSE ---
    useEffect(() => {
        if (!currentStore?.url || !productId) return;
        const transmit = getTransmit(currentStore.url);
        const channel = `store/${currentStore.id}/comment`; // Écouter tous les events commentaires du store
        logger.info(`Subscribing to SSE channel for comments: ${channel}`);
        const subscription = transmit?.subscription(channel);
        async function subscribe() {
            if (!subscription) return;
            try {
                await subscription.create();
                // Filtrer côté client si l'event concerne ce produit? Ou simplement refetch?
                subscription.onMessage<{ event: string, id: string }>(() => {
                    logger.info(`Received SSE comment event for store. Refetching comments for product ${productId}...`);
                    // Invalider ou refetch directement
                    refetchComments();
                    // Rafraîchir aussi les données produit (rating, count)
                    queryClient.invalidateQueries({ queryKey: ['products', { product_id: productId }] });
                });
            } catch (err) {
                logger.error({ channel, productId, error: err }, "Failed to subscribe to comment SSE channel");
            }
        }
        subscribe();
        return () => {
            logger.info(`Unsubscribing from SSE channel: ${channel}`);
            subscription?.delete();
        };
    }, [currentStore?.id, currentStore?.url, productId, refetchComments]);

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
                            // Invalidation/Refetch géré par le hook useDeleteComment
                            // Rafraîchir données produit
                            queryClient.invalidateQueries({ queryKey: ['products', { product_id: productId }] });
                            openChild(null);
                        },
                        onError: (error) => {
                            logger.error({ error }, `Failed to delete comment ${commentId}`);
                            openChild(null);
                        }
                    });
                }}
            />
        </ChildViewer>, { background: '#3455' });
    };

    // --- Rendu ---
    const isLoading = isLoadingProduct || isLoadingComments;
    if (isLoading) return <div className="p-6 text-center text-gray-500">{t('common.loading')}</div>;
    if (!product) return <PageNotFound title={t('product.notFound')} />; // Si produit non trouvé

    return (
        // Utiliser flex flex-col bg-gray-100 min-h-screen
        <div className="comments w-full flex flex-col min-h-screen bg-gray-100">
            <Topbar back title={t('productComments.pageTitle', { name: product.name })} />
            <main className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
                {/* Aperçu Produit */}
                <div className="mb-6">
                    <ProductPreview product={product || {}} />
                </div>

                {/* Titre Section Commentaires */}
                <h1 className="text-xl font-semibold text-gray-800">{t('productComments.listTitle')}</h1>

                {/* Grille Commentaires */}
                <CommentsDashboard
                    deleteCommentMutation={deleteCommentMutation}
                    comments={comments}
                    currentStore={currentStore || {}}
                    onDelete={handleDelete} // Passer le handler
                />
                {/* Message si aucun commentaire */}
                {!isLoadingComments && comments.length === 0 && (
                    <PageNotFound
                        image='/res/empty/comments.png'
                        description={t('productComments.noCommentsDesc')}
                        title={t('productComments.noCommentsTitle')}
                        back={false}
                    />
                )}
            </main>
        </div>
    );
}

// --- Composant CommentsDashboard ---
type CommentsDashboardProps = {
    comments: CommentInterface[];
    currentStore: Partial<StoreInterface>;
    deleteCommentMutation: UseMutationResult<any, any, any>
    onDelete: (commentId: string, commentTitle?: string) => void; // Ajouter titre pour confirmation
};

const CommentsDashboard: React.FC<CommentsDashboardProps> = ({ deleteCommentMutation, comments, currentStore, onDelete }) => {
    const { t } = useTranslation(); // ✅ i18n
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
    const { openChild } = useChildViewer(); // Pour ViewMore

    const toggleDescription = (commentId: string) => {
        setExpandedComments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(commentId)) {
                newSet.delete(commentId);
            } else {
                newSet.add(commentId);
            }
            return newSet;
        });
    };

    const getDescriptionPreview = (description: string) => {
        const maxLength = 100;
        if (description.length <= maxLength) return description;
        return description.substring(0, maxLength) + '...';
    };
    // Handler pour ouvrir le ViewMore
    const handleOpenViewMore = (imageUrls: (string | Blob)[], initialIndex: number) => {
        // Filtrer pour ne garder que les URLs valides (string)
        const validUrls = imageUrls
            .map(url => typeof url === 'string' ? (currentStore.url + url) : null) // Préfixer avec URL store si relative
            .filter(Boolean) as string[];

        if (validUrls.length === 0) return;

        openChild(<ViewMore
            views={validUrls}
            initialIndex={initialIndex}
            onClose={() => openChild(null)}
        />,
            { background: 'rgba(0,0,0,0.8)', blur: 5 } // Fond sombre pour lightbox
        );
    };


    return (
        // Utiliser Tailwind grid
        <div className="comments-bento grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
            <AnimatePresence>
                {comments.map((comment) => {
                    const isExpanded = expandedComments.has(comment.id);
                    const description = comment.description ?? '';
                    const needsSeeMore = description.length > 100;
                    const v = comment.product && getDefaultValues(comment.product)?.[0]; // Image Produit
                    const imageUrl = v?.views?.[0] ?? comment.product?.features?.find(f => f.is_default)?.values?.[0]?.views?.[0] ?? NO_PICTURE;
                    const imageSrc = getImg(imageUrl, undefined, currentStore?.url).match(/url\("?([^"]+)"?\)/)?.[1];

                    return (
                        <motion.div
                            key={comment.id} layout initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            // Styles carte Tailwind
                            className="comment-card relative flex flex-col gap-2 bg-white rounded-lg p-4 shadow-sm border border-gray-200"
                        // style={{ gridRow: `span ${...}` }} // Calcul dynamique complexe, peut être omis
                        >
                            {/* User Info */}
                            <div className="comment-user flex items-center gap-2 pb-2 border-b border-gray-100">
                                {/* User Photo */}
                                <a href={`/users/clients/${comment.user?.id}`} className="flex-shrink-0">
                                    <img src={comment.user?.photo?.[0] ?? '/res/user_placeholder.png'} // Utiliser placeholder
                                        alt={comment.user?.full_name || ''}
                                        className="comment-user-photos w-8 h-8 rounded-full object-cover bg-gray-200" />
                                </a>
                                {/* User Name */}
                                <a href={`/users/clients/${comment.user?.id}`} className="comment-user-name text-sm font-medium text-gray-700 truncate hover:text-blue-600" title={comment.user?.full_name}>
                                    {comment.user?.full_name || t('common.anonymous')}
                                </a>
                                {/* Lien Ouvrir Produit (ajouté pour contexte) */}
                                <a href={`/products/${comment.product?.id}`} className="open-item flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 ml-auto flex-shrink-0" title={t('product.viewProduct')}>
                                    <span className='hidden sm:inline'>{limit(comment.product?.name ?? '', 15)}</span> {/* Nom produit court */}
                                    <IoChevronForward />
                                </a>
                            </div>
                            {/* Contenu Commentaire */}
                            <div className="comment-content flex flex-col gap-2 flex-grow">
                                <h2 className="comment-title font-semibold text-base text-gray-800">{comment.title}</h2>
                                <div className="comment-stars flex gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (<IoStar key={i} className={`w-4 h-4 ${i < (comment.rating ?? 0) ? 'text-yellow-400' : 'text-gray-300'}`} />))}
                                </div>
                                {description && (<p className="comment-description text-sm text-gray-600 leading-relaxed">{isExpanded ? description : getDescriptionPreview(description)}</p>)}
                                {needsSeeMore && (<button className="see-more-btn text-blue-600 hover:underline text-sm self-start mt-1" onClick={() => toggleDescription(comment.id)}>{isExpanded ? t('common.seeLess') : t('common.seeMore')}</button>)}
                                {/* Images Commentaire */}
                                {comment.views && comment.views.length > 0 && (
                                    <div className="comment-views flex flex-wrap gap-2 mt-2">
                                        {comment.views.map((url, i) => (
                                            <button type="button" key={i} onClick={() => handleOpenViewMore(comment.views, i)} className="block w-14 h-14 rounded border border-gray-200 overflow-hidden hover:opacity-80">
                                                <img src={currentStore.url + url} alt={`${t('comment.viewAlt')} ${i + 1}`} className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {/* Variantes (Bind Name) */}
                                {comment.bind_name && typeof comment.bind_name === 'object' && Object.keys(comment.bind_name).length > 0 && (
                                    <ul className="comment-values list-none p-0 mt-2 flex flex-wrap gap-x-3 gap-y-1">
                                        {Object.entries(comment.bind_name).map(([key, value]) => (
                                            <li key={key}>
                                                <span className='key'>{limit(key?.split(':')[0])}</span>
                                                : {
                                                    value.icon?.[0]
                                                        ? <span className='icon-16' style={{ background: getImg(value.icon?.[0]) }}></span>
                                                        : value.key && (!key?.split(':')[1] || key?.split(':')[1] == 'color') &&
                                                        <span className='icon-16' style={{
                                                            border: '1px solid var(--discret-6)',
                                                            borderRadius: '50px',
                                                            background: value.key,
                                                            minWidth: '16px'
                                                        }}></span>
                                                }
                                                <span className='value'>
                                                    {limit((typeof value == 'string' ? value : value.text || value.key), 16)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {/* Date */}
                                <p className="comment-date text-xs text-gray-400 mt-auto pt-2">
                                    {t('common.createdAt')}: {DateTime.fromISO(comment.created_at).setLocale(t('common.locale')).toLocaleString(DateTime.DATETIME_SHORT)}
                                </p>
                            </div>
                            {/* Bouton Supprimer */}
                            <button
                                className="comment-delete absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition disabled:opacity-50"
                                onClick={() => onDelete(comment.id, comment.title)} // Passer titre pour confirmation
                                disabled={deleteCommentMutation.isPending}
                                aria-label={t('comment.deleteLabel')}
                                title={t('comment.deleteLabel')}
                            >
                                <IoTrash className="w-4 h-4" />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};
