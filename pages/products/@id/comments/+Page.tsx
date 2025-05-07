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
import { getTransmit, useGlobalStore } from '../../../stores/StoreStore';
import { usePageContext } from '../../../../renderer/usePageContext';
import { PageNotFound } from '../../../../Components/PageNotFound/PageNotFound';
import { getImg } from '../../../../Components/Utils/StringFormater';
import { getFileType, limit } from '../../../../Components/Utils/functions';
// import { useApp } from '../../../../renderer/AppStore/UseApp'; // Remplacé
import { useChildViewer } from '../../../../Components/ChildViewer/useChildViewer'; // ✅ Hook popup
import { ConfirmDelete } from '../../../../Components/Confirm/ConfirmDelete';
import { ChildViewer } from '../../../../Components/ChildViewer/ChildViewer';
import { useGetProductList, useGetComments, useDeleteComment, queryClient } from '../../../../api/ReactSublymusApi'; // ✅ Importer hooks API
import { useTranslation } from 'react-i18next'; // ✅ i18n
import logger from '../../../../api/Logger';

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
// Optionnel: importer les plugins
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

import { UseMutationResult } from '@tanstack/react-query';

export default function Page() {
    const { t } = useTranslation(); // ✅ i18n
    // const { comments, fetchProductComments, deleteComment } = useCommentStore(); // Remplacé
    const { currentStore } = useGlobalStore();
    // const { fetchProductBy } = useProductStore(); // Remplacé
    // const [product, setProduct] = useState<Partial<ProductInterface>>(); // Géré par React Query
    const { routeParams } = usePageContext();
    const { openChild } = useChildViewer();
    const productId = routeParams?.['id'];

    // ✅ Récupérer Produit
    const { data: productData, isLoading: isLoadingProduct,isError,error } = useGetProductList(
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
        const channel = `store/${'9b1192a3-0727-43a4-861b-05775bf2fd0d'/* TODO currentStore.id*/}/comment`; // Écouter tous les events commentaires du store
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

    const [isPageLoading, setIsPageLoading] = useState(true);
    useEffect(() => {
        setIsPageLoading(false)
    }, []);
    // --- Rendu ---
    if (isPageLoading) return <PageSkeleton />
    const isLoading = isLoadingProduct || isLoadingComments;
    if (isLoading && !product) return <PageSkeleton />
    if (isError) return <PageNotFound title={t('product.notFound')} description={error?.message} />;
    if (!product) return <PageSkeleton />

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

function ViewMore({ imagesUrls }: { imagesUrls: string[] }) {
    const { openChild } = useChildViewer()
    const [photoIndex, setPhotoIndex] = useState(0);
    const { currentStore } = useGlobalStore()
    const images = imagesUrls.map(i => ({ src: i.startsWith('/') ? currentStore?.url + i : i }))

    return <Lightbox
        open={true}
        close={() => openChild(null)}
        index={photoIndex}
        slides={images}
        plugins={[Thumbnails, Zoom]} // Ajouter les plugins
        on={{ view: ({ index }: any) => setPhotoIndex(index) }} // Synchroniser l'index
    />
}

export const CommentsDashboard = ({ comments, currentStore, onDelete }: CommentsDashboardProps) => {
    const [expandedComments, setExpandedComments] = useState(new Set())

    const { openChild } = useChildViewer()
    const toggleDescription = (commentId: string) => {
        setExpandedComments((prev) => {
            const newSet = new Set(prev)
            newSet.has(commentId) ? newSet.delete(commentId) : newSet.add(commentId)
            return newSet
        })
    }


    const getDescriptionPreview = (description: string) => {
        const maxLength = 100
        return description.length <= maxLength
            ? description
            : description.substring(0, maxLength) + '...'
    }


    return (
        <>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4 p-4 auto-rows-[minmax(100px,_auto)]">
                <AnimatePresence>
                    {comments.map((comment) => {
                        const isExpanded = expandedComments.has(comment.id)
                        const needsSeeMore = comment.description.length > 100

                        return (
                            <motion.div
                                key={comment.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                style={{ gridRow: `span ${Math.ceil(comment.description.length / 200) + 1}` }}
                                className="relative bg-white rounded-md p-4 shadow flex flex-col gap-2"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    {comment.user?.photo?.[0] ? (
                                        <div
                                            style={{ background: getImg(comment.user.photo[0], undefined, currentStore.url) }}
                                            className="w-10 h-10 rounded-full object-cover"
                                        ></div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold">
                                            {comment.user?.full_name.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                    <span className="font-medium">{comment.user?.full_name}</span>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <h2 className="text-lg font-semibold">{comment.title}</h2>
                                    <p className="leading-relaxed">
                                        {isExpanded ? comment.description : getDescriptionPreview(comment.description)}
                                    </p>

                                    {needsSeeMore && (
                                        <button
                                            className="text-blue-600 text-sm hover:underline self-start"
                                            onClick={() => toggleDescription(comment.id)}
                                        >
                                            {isExpanded ? 'Voir moins' : 'Voir plus'}
                                        </button>
                                    )}

                                    <div className="flex gap-1 text-yellow-400">
                                        {Array.from({ length: comment.rating }).map((_, i) => (
                                            <IoStar key={i} className="w-4 h-4" />
                                        ))}
                                    </div>

                                    <div className="flex gap-2 mt-2">
                                        {comment.views.map((url, i) => (
                                            <img
                                                key={i}
                                                src={currentStore.url + url}
                                                alt={`view-${i}`}
                                                className="w-14 h-14 object-cover rounded"
                                                onClick={() => {
                                                    openChild(<ViewMore imagesUrls={comment.views || []} />, { background: '#3455' })
                                                }}
                                            />
                                        ))}
                                    </div>

                                    <ul className="list-none p-0 mt-2">
                                        {Object.entries(comment.bind_name).map(([key, value]) => (
                                            <li key={key} className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-700">{limit(key?.split(':')[0])}</span>
                                                {value.icon?.[0] ? (
                                                    <span className="w-4 h-4 bg-center bg-cover" style={{ backgroundImage: `url(${getImg(value.icon?.[0])})` }}></span>
                                                ) : value.key && (!key?.split(':')[1] || key?.split(':')[1] === 'color') ? (
                                                    <span
                                                        className="w-4 h-4 rounded-full border"
                                                        style={{ background: value.key }}
                                                    ></span>
                                                ) : null}
                                                <span className="text-sm text-gray-600">
                                                    {limit(typeof value === 'string' ? value : value.text || value.key, 16)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    <p className="text-xs text-gray-500 mt-1">
                                        Créé le {new Date(comment.created_at).toLocaleString()}
                                    </p>
                                </div>

                                <button
                                    onClick={() => onDelete(comment.id)}
                                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                    title="Supprimer le commentaire"
                                >
                                    <IoTrash className="w-5 h-5" />
                                </button>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>
        </>
    )
}

function PageSkeleton() {
    return (
        <div className="page-detail w-full flex flex-col bg-gray-100 min-h-screen animate-pulse">
            {/* Topbar */}
            <div className="w-full h-16 bg-gray-200 flex items-center px-4">
                <div className="h-8 w-8 bg-gray-300 rounded-full" />
                <div className="ml-4 h-6 w-1/3 bg-gray-300 rounded" />
            </div>

            <main className="w-full max-w-4xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
                {/* Aperçu Produit */}
                <div className="mb-6">
                    <div className="w-full h-64 bg-gray-200 rounded-lg" />
                </div>

                {/* Section Ajout Détail */}
                <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-40 bg-gray-300 rounded" />
                        <div className="h-5 w-16 bg-gray-300 rounded" />
                    </div>
                    <div className="h-10 w-32 bg-gray-300 rounded-md" />
                </div>

                {/* Liste des Détails */}
                <div className="details flex flex-col gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col gap-4"
                        >
                            <div className="h-6 w-3/4 bg-gray-300 rounded" />
                            <div className="h-4 w-full bg-gray-300 rounded" />
                            <div className="h-4 w-5/6 bg-gray-300 rounded" />
                            <div className="flex gap-2">
                                <div className="h-8 w-8 bg-gray-300 rounded-full" />
                                <div className="h-8 w-8 bg-gray-300 rounded-full" />
                                <div className="h-8 w-8 bg-gray-300 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}