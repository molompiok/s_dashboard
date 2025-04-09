import React, { useState } from 'react'
import { CommentInterface, ProductInterface, StoreInterface } from '../../../../Interfaces/Interfaces'
import { motion, AnimatePresence } from 'framer-motion'
import './+Page.css'
import { IoStar, IoTrash } from 'react-icons/io5'
import { useEffect } from "react";
import { useCommentStore } from './CommentStore'
import { Topbar } from '../../../../Components/TopBar/TopBar'
import { ProductPreview } from '../../../../Components/ProductPreview/ProductPreview'
import { getTransmit, useStore } from '../../../stores/StoreStore'
import { usePageContext } from '../../../../renderer/usePageContext'
import { useProductStore } from '../../ProductStore'
import { PageNotFound } from '../../../../Components/PageNotFound/PageNotFound'
import { getImg } from '../../../../Components/Utils/StringFormater'
import { getFileType, limit } from '../../../../Components/Utils/functions'
import { useApp } from '../../../../renderer/AppStore/UseApp'
import { ConfirmDelete } from '../../../../Components/Confirm/ConfirmDelete'
import { ChildViewer } from '../../../../Components/ChildViewer/ChildViewer'

export default function Page() {
    const { comments, fetchProductComments, deleteComment } = useCommentStore();
    const { currentStore } = useStore();
    const { fetchProductBy } = useProductStore();
    const [product, setProduct] = useState<Partial<ProductInterface>>()
    const { routeParams } = usePageContext()
    const { openChild } = useApp()
    useEffect(() => {
        currentStore && fetchProductBy({ product_id: routeParams.id }).then(res => {
            if (!res?.id) return
            setProduct(res)
        })
        currentStore && fetchProductComments({ product_id: routeParams.id, with_users: true });

        if (!currentStore) return

        const transmit = getTransmit(currentStore.url)
        console.log(currentStore.id);

        const subscription = transmit?.subscription(`store/${'d3d8dfcf-b84b-49ed-976d-9889e79e6306'}/comment`)

        async function subscribe() {
            if (!subscription) return
            await subscription.create()
            subscription.onMessage<{ update: string }>((data) => {
                fetchProductComments({ product_id: routeParams.id, with_users: true })
                fetchProductBy({ product_id: routeParams.id }).then(res => {
                    if (!res?.id) return
                    setProduct(res)
                })
            })
        }

        subscribe().catch(console.error)

        return () => {
            subscription?.delete()
        }
    }, [currentStore])

    return (
        <div className="comments">
            <Topbar />
            <ProductPreview product={product || {}} />
            <h1 className="comments-title">Commentaires</h1>
            <CommentsDashboard
                comments={comments?.list || []}
                currentStore={currentStore || {}}
                onDelete={(commentId) => {
                    openChild(<ChildViewer>
                        <ConfirmDelete title='Voulez-vous vraiment supprimer ce commentaire ?' onCancel={() => {
                            openChild(null)
                        }} onDelete={() => {
                            deleteComment({ comment_id: commentId }).then(res => {
                                fetchProductBy({ product_id: routeParams.id }).then(res => {
                                    if (!res?.id) return
                                    setProduct(res)
                                })
                                fetchProductComments({ product_id: routeParams.id, with_users: true });
                                openChild(null)
                            })
                        }}>
                        </ConfirmDelete>
                    </ChildViewer>, {
                        background: '#3455'
                    })
                }}
            />
            {
                (comments?.list.length || 0) == 0 && <PageNotFound
                    image='/res/font.png'
                    description={`Les commentaires laisse par vos client sur ce produit serons lister ici. `}
                    title={`Auccun  commaitaire pour le moment`}
                    back={true}
                />
            }
        </div>
    );
}

type Props = {
    comments: CommentInterface[];
    currentStore: Partial<StoreInterface>;
    onDelete: (commentId: string) => void;
};

const CommentsDashboard: React.FC<Props> = ({ comments, currentStore, onDelete }) => {
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

    const { openChild } = useApp()
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

    return (
        <div className="comments-bento">
            <AnimatePresence>
                {comments.map((comment) => {
                    const isExpanded = expandedComments.has(comment.id);
                    const needsSeeMore = comment.description.length > 100;

                    return (
                        <motion.div
                            key={comment.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="comment-card"
                            style={{
                                gridRow: `span ${Math.ceil(comment.description.length / 200) + 1}`
                            }}
                        >
                            <div className="comment-user">
                                {(comment.user?.photo?.length || 0) > 0 ? (
                                    <img src={comment.user?.photo?.[0]}
                                        alt={comment.user?.full_name}
                                        className="comment-user-photos"
                                    />
                                ) :
                                    <div className="comment-user-photos comment-empty">
                                        {comment.user?.full_name.substring(0, 2).toLocaleUpperCase()}
                                    </div>
                                }
                                <span className="comment-user-name">{comment.user?.full_name}</span>
                            </div>
                            <div className="comment-content">
                                <h2 className="comment-title">{comment.title}</h2>
                                <p className="comment-description">
                                    {isExpanded ? comment.description : getDescriptionPreview(comment.description)}
                                </p>
                                {needsSeeMore && (
                                    <button
                                        className="see-more-btn"
                                        onClick={() => toggleDescription(comment.id)}
                                    >
                                        {isExpanded ? 'Voir moins' : 'Voir plus'}
                                    </button>
                                )}
                                <div className="comment-stars">
                                    {Array.from({ length: comment.rating }).map((_, i) => (
                                        <IoStar key={i} className="w-4 h-4 fill-yellow-400 stroke-yellow-600" />
                                    ))}
                                </div>
                                <div className="comment-views">
                                    {comment.views.map((url, i) => (
                                        <img key={i} src={currentStore.url + url} alt={`view-${i}`} onClick={() => {
                                            openChild(<ViewMore views={[...comment.views, ...comment.views, ...comment.views, ...comment.views]} onClose={() => {
                                                openChild(null);
                                            }} />, {
                                                background: '#0009'
                                            })
                                        }} />
                                    ))}
                                </div>
                                <ul className="comment-values">
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
                                <p className="comment-date">
                                    Créé le {new Date(comment.created_at).toLocaleString()}
                                </p>
                            </div>
                            <button
                                className="comment-delete"
                                onClick={() => onDelete(comment.id)}
                                aria-label="Supprimer le commentaire"
                                title="Supprimer le commentaire"
                            >
                                <IoTrash className="w-5 h-5" />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};

import { FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';

interface ViewMoreProps {
    views: (string | Blob)[];
    onClose: () => void;
}

function ViewMore({ views, onClose }: ViewMoreProps) {
    const { currentStore } = useStore();
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (currentIndex >= views.length) {
            setCurrentIndex(views.length - 1 || 0);
        }
    }, [views.length, currentIndex]);


    const nextMedia = () => setCurrentIndex((prev) =>
        Math.min(prev + 1, views.length - 1)
    );

    const prevMedia = () => setCurrentIndex((prev) =>
        Math.max(prev - 1, 0)
    );

    const mediaVariants = {
        enter: { opacity: 0, x: 50 },
        center: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -50 }
    };

    const buttonVariants = {
        hover: { scale: 1.1 },
        tap: { scale: 0.95 }
    };

    return (
        <div className="view-more" style={{ position: 'relative', width: '100%', height: '100%' }}
            onClick={(e) => {
                if (e.target == e.currentTarget) {
                    onClose()
                }
            }}>
            {/* Counter and Close Button */}
            <div style={{
                position: 'absolute',
                top: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                background: 'rgba(0,0,0,0.7)',
                padding: '5px 15px',
                borderRadius: '20px',
                color: 'white'
            }} onClick={(e) => {
                if (e.target == e.currentTarget) {
                    onClose()
                }
            }}>
                <span>{views.length > 0 ? `${currentIndex + 1} / ${views.length}` : '0 / 0'}</span>
                <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        padding: '5px'
                    }}
                >
                    <FaTimes />
                </motion.button>
            </div>

            {/* Main View */}
            <div className="main-view" style={{
                width: '100%',
                height: '80vh',
                position: 'relative',
                overflow: 'hidden'
            }} onClick={(e) => {
                if (e.target == e.currentTarget) {
                    onClose()
                }
            }}>
                <AnimatePresence mode="wait" >
                    {views.length > 0 && (
                        <motion.div
                            key={currentIndex}
                            variants={mediaVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.3 }}
                            style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                            onClick={(e) => {
                                if (e.target == e.currentTarget) {
                                    onClose()
                                }
                            }}
                        >
                            {getFileType(views[currentIndex]) === 'image' ? (
                                <div
                                    style={{
                                        width: '90%',
                                        height: '90%',
                                        background: getImg(
                                            typeof views[currentIndex] === 'string'
                                                ? views[currentIndex]
                                                : URL.createObjectURL(views[currentIndex]),
                                            undefined,
                                            typeof views[currentIndex] === 'string'
                                                ? currentStore?.url
                                                : undefined
                                        ),
                                        backgroundSize: 'contain',
                                        backgroundPosition: 'center',
                                        backgroundRepeat: 'no-repeat'
                                    }}
                                />
                            ) : (
                                <video
                                    loop
                                    autoPlay
                                    muted
                                    style={{ maxWidth: '90%', maxHeight: '90%' }}
                                    src={
                                        typeof views[currentIndex] === 'string'
                                            ? `${currentStore?.url}${views[currentIndex].startsWith('/') ? views[currentIndex] : '/' + views[currentIndex]}`
                                            : URL.createObjectURL(views[currentIndex])
                                    }
                                />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Navigation Arrows */}
                {views.length > 1 && (
                    <>
                        <motion.button
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            onClick={prevMedia}
                            disabled={currentIndex === 0}
                            style={{
                                position: 'absolute',
                                left: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'rgba(0,0,0,0.5)',
                                border: 'none',
                                color: 'white',
                                padding: '10px',
                                cursor: 'pointer',
                                zIndex: 10
                            }}
                        >
                            <FaChevronLeft />
                        </motion.button>
                        <motion.button
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            onClick={nextMedia}
                            disabled={currentIndex === views.length - 1}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'rgba(0,0,0,0.5)',
                                border: 'none',
                                color: 'white',
                                padding: '10px',
                                cursor: 'pointer',
                                zIndex: 10
                            }}
                        >
                            <FaChevronRight />
                        </motion.button>
                    </>
                )}
            </div>

            {/* Thumbnail List */}
            {views.length > 1 && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '10px',
                    overflowX: 'auto',
                }}>
                    {views.map((item, index) => (
                        <motion.div
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                width: '80px',
                                height: '80px',
                                cursor: 'pointer',
                                borderRadius: '8px',
                                border: currentIndex === index ? '2px solid blue' : '1px solid gray',
                                flexShrink: 0,
                                overflow: 'hidden'
                            }}
                        >
                            {getFileType(item) === 'image' ? (
                                <div
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        background: getImg(
                                            typeof item === 'string'
                                                ? item
                                                : URL.createObjectURL(item),
                                            undefined,
                                            typeof item === 'string'
                                                ? currentStore?.url
                                                : undefined
                                        ),
                                    }}
                                />
                            ) : (
                                <video
                                    muted
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    src={
                                        typeof item === 'string'
                                            ? `${currentStore?.url}${item.startsWith('/') ? item : '/' + item}`
                                            : URL.createObjectURL(item)
                                    }
                                />
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
