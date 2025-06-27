// pages/products/@id/comments/+Page.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { IoStar, IoTrash, IoChatbubbleEllipsesOutline, IoWarningOutline, IoImageOutline } from 'react-icons/io5';
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

import { CommentInterface, ProductInterface, StoreInterface } from '../../../../api/Interfaces/Interfaces';
import { useGetProduct, useGetComments, useDeleteComment, queryClient } from '../../../../api/ReactSublymusApi';
import { Topbar } from '../../../../Components/TopBar/TopBar';
import { useGlobalStore, getTransmit } from '../../../../api/stores/StoreStore';
import { usePageContext } from '../../../../renderer/usePageContext';
import { getMedia } from '../../../../Components/Utils/StringFormater';
import { limit } from '../../../../Components/Utils/functions';
import { useChildViewer } from '../../../../Components/ChildViewer/useChildViewer';
import { ConfirmDelete } from '../../../../Components/Confirm/ConfirmDelete';
import { ChildViewer } from '../../../../Components/ChildViewer/ChildViewer';
import logger from '../../../../api/Logger';
import { Data } from '../../../../renderer/AppStore/Data';
import { showErrorToast, showToast } from '../../../../Components/Utils/toastNotifications';
import { StateDisplay } from '../../../../Components/StateDisplay/StateDisplay';
import { ProductPreview } from '../../../../Components/ProductPreview/ProductPreview';
import { DateTime } from 'luxon';

// 🎨 SKELETON LOADER POUR LA PAGE
const PageSkeleton = () => {
    const { t } = useTranslation();
    return (
        <div className="w-full min-h-screen flex flex-col animate-pulse">
            <div className="sticky top-0 z-20"><Topbar back title={t('common.loading')} /></div>
            <main className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
                <div className="h-44 bg-gray-200 dark:bg-white/5 rounded-lg"></div>
                <div className="h-8 w-1/3 bg-gray-200 dark:bg-white/5 rounded-md"></div>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-56 bg-gray-200 dark:bg-white/5 rounded-lg"></div>
                    ))}
                </div>
            </main>
        </div>
    );
};


export default function Page() {
    const { t } = useTranslation();
    const { currentStore } = useGlobalStore();
    const { routeParams } = usePageContext();
    const { openChild } = useChildViewer();
    const productId = routeParams?.['id'];

    const { data: product, isLoading: isLoadingProduct, isError, error } = useGetProduct(
        { product_id: productId, with_feature: true }, { enabled: !!productId }
    );

    const { data: commentsData, isLoading: isLoadingComments, refetch: refetchComments } = useGetComments(
        { product_id: productId, with_users: true, order_by: 'created_at_desc' }, { enabled: !!productId }
    );
    const comments = commentsData?.list ?? [];
    
    const deleteCommentMutation = useDeleteComment();

    // SSE (inchangé)
    useEffect(() => {
        if (!currentStore?.api_url || !productId) return;
        const transmit = getTransmit(currentStore.api_url);
        const channel = `store/${Data.apiUrl}/comment`;
        const subscription = transmit?.subscription(channel);
        async function subscribe() {
            if (!subscription) return;
            try {
                await subscription.create();
                subscription.onMessage(() => {
                    refetchComments();
                    queryClient.invalidateQueries({ queryKey: ['products', { product_id: productId }] });
                });
            } catch (err) { logger.error({ err }, "SSE subscribe failed"); }
        }
        subscribe();
        return () => { subscription?.delete(); };
    }, [currentStore, productId, refetchComments]);

    const handleDelete = (commentId: string, commentTitle?: string) => {
        openChild(<ChildViewer><ConfirmDelete
            title={t('comment.confirmDelete', { title: limit(commentTitle || t('comment.thisComment'), 20) })}
            onCancel={() => openChild(null)}
            onDelete={() => {
                deleteCommentMutation.mutate({ comment_id: commentId }, {
                    onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: ['products', { product_id: productId }] });
                        showToast(t('comment.deleteSuccess'), 'WARNING');
                        openChild(null);
                    },
                    onError: (err) => {
                        showErrorToast(err);
                        openChild(null);
                    }
                });
            }}
        /></ChildViewer>, { background: 'rgba(220, 38, 38, 0.7)', blur: 4 });
    };
    
    // 🎨 GESTION DES ÉTATS
    if (isLoadingProduct || (isLoadingComments && !comments.length)) {
        return <PageSkeleton />;
    }

    if (isError) {
        return (
            <div className="w-full min-h-screen flex flex-col">
                <Topbar back title={t('common.error.title')} />
                <main className="flex-grow flex items-center justify-center p-4">
                    <StateDisplay
                        variant="danger"
                        icon={IoWarningOutline}
                        title={error.status === 404 ? t('product.notFound') : t('common.error.title')}
                        description={error.message || t('common.error.genericDesc')}
                    >
                         <a href="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold rounded-xl">{t('product.backToList')}</a>
                    </StateDisplay>
                </main>
            </div>
        );
    }
    
    if (!product) { // Normalement couvert par isError, mais double sécurité
        return <PageSkeleton />; 
    }

    return (
        <div className="w-full min-h-screen flex flex-col">
            <Topbar back title={t('productComments.pageTitle', { name: product.name })} />
            <main className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
                <div className="mb-4">
                    <ProductPreview isLoading={isLoadingProduct} product={product} />
                </div>

                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('productComments.listTitle')}</h2>

                {comments.length > 0 ? (
                    <CommentsDashboard comments={comments} onDelete={handleDelete} />
                ) : (
                    // 🎨 État vide
                    <StateDisplay
                        variant="info"
                        icon={IoChatbubbleEllipsesOutline}
                        title={t('productComments.noCommentsTitle')}
                        description={t('productComments.noCommentsDesc')}
                    />
                )}
            </main>
        </div>
    );
}

// --- Composant CommentsDashboard ---
const CommentsDashboard = ({ comments, onDelete }: { comments: CommentInterface[], onDelete: (id: string, title?: string) => void }) => {
    return (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
            <AnimatePresence>
                {comments.map((comment) => (
                    <CommentCard key={comment.id} comment={comment} onDelete={onDelete} />
                ))}
            </AnimatePresence>
        </div>
    );
};

// --- Composant CommentCard ---
const CommentCard = ({ comment, onDelete }: { comment: CommentInterface, onDelete: (id: string, title?: string) => void }) => {
    const { t } = useTranslation();
    const { openChild } = useChildViewer();
    const [isExpanded, setIsExpanded] = useState(false);
    const hasLongDesc = (comment.description?.length || 0) > 100;

    const openLightbox = (index: number) => {
        openChild(<Lightbox
            open={true} close={() => openChild(null)}
            slides={comment.views.map(url => ({ src: getMedia({ source: url, from: 'api' }) }))}
            index={index}
            plugins={[Thumbnails, Zoom]}
        />, { background: 'rgba(0,0,0,0.8)', blur: 4 });
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            // 🎨 Design de la carte avec glassmorphism
            className="relative bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-lg shadow-sm border border-gray-200/80 dark:border-white/10 p-4 flex flex-col gap-3"
        >
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cover bg-center bg-gray-200 dark:bg-gray-700 text-gray-500 font-semibold text-sm flex items-center justify-center shrink-0" style={{ background: getMedia({ isBackground: true, source: comment.user?.photo?.[0], from: 'api' }) }}>
                    {!comment.user?.photo?.[0] && (comment.user?.full_name?.substring(0, 2).toUpperCase() || '?')}
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">{comment.user?.full_name || t('common.anonymous')}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{DateTime.fromISO(comment.created_at).toRelative({ locale: t('common.locale') })}</span>
                </div>
                <div className="ml-auto flex items-center gap-1 text-amber-500 dark:text-amber-400">
                    <IoStar className="w-4 h-4" />
                    <span className="text-sm font-bold">{comment.rating}</span>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{comment.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {isExpanded ? comment.description : limit(comment.description || '', 100)}
                </p>
                {hasLongDesc && (
                    <button className="text-teal-600 dark:text-teal-400 text-sm hover:underline self-start" onClick={() => setIsExpanded(!isExpanded)}>
                        {t(isExpanded ? 'common.seeLess' : 'common.seeMore')}
                    </button>
                )}
            </div>

            {comment.views && comment.views.length > 0 && (
                <div className="flex gap-2 mt-1 flex-wrap">
                    {comment.views.map((url, i) => (
                        <div key={i} className="w-14 h-14 rounded-md overflow-hidden cursor-pointer" onClick={() => openLightbox(i)}>
                            <img src={getMedia({ source: url, from: 'api' })} alt={`view-${i}`} className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
            )}
            
            <button onClick={() => onDelete(comment.id, comment.title)} className="absolute top-2 right-2 p-1.5 rounded-full text-gray-400 hover:bg-red-100/50 hover:text-red-600 dark:hover:bg-red-900/40 dark:hover:text-red-500 transition-colors" title={t('common.delete')}>
                <IoTrash className="w-4 h-4" />
            </button>
        </motion.div>
    );
};