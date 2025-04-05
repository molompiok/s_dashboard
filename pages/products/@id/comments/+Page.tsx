import React, { useState } from 'react'
import { CommentInterface, ProductInterface, StoreInterface } from '../../../../Interfaces/Interfaces'
import { motion, AnimatePresence } from 'framer-motion'
import './+Page.css'
import { IoStar, IoTrash } from 'react-icons/io5'

import { useEffect } from "react";
import { useCommentStore } from './CommentStore'
import { Topbar } from '../../../../Components/TopBar/TopBar'
import { ProductPreview } from '../../../../Components/ProductPreview/ProductPreview'
import { useStore } from '../../../stores/StoreStore'
import { usePageContext } from '../../../../renderer/usePageContext'
import { useProductStore } from '../../ProductStore'
import { PageNotFound } from '../../../../Components/PageNotFound/PageNotFound'
import { getImg } from '../../../../Components/Utils/StringFormater'
import { limit } from '../../../../Components/Utils/functions'

export default function Page() {
    const { comments, fetchComments, deleteComment } = useCommentStore();
    const { currentStore } = useStore();
    const { fetchProductBy } = useProductStore();
    const [product, setProduct] = useState<Partial<ProductInterface>>()
    const { routeParams } = usePageContext()

    useEffect(() => {
        currentStore && fetchProductBy({ product_id: routeParams.id }).then(res => {
            if (!res?.id) return
            setProduct(res)
        })
        currentStore && fetchComments({ product_id: routeParams.id, with_users: true });
    }, [currentStore])
    console.log(comments);

    return (
        <div className="comments">
            <Topbar />
            <ProductPreview product={product || {}} />
            <h1 className="comments-title">Commentaires</h1>
            <CommentsDashboard
                comments={comments?.list || []}
                currentStore={currentStore || {}}
                onDelete={(commentId) => deleteComment({ comment_id: commentId })}
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
    return (
        <div className="comments-grid">
            <AnimatePresence>
                {comments.map((comment) => (
                    <motion.div
                        key={comment.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="comment-card">
                            <div className="comment-user">
                                {(comment.user?.photo?.length || 0) > 0 ? (
                                    <img src={comment.user?.photo?.[0]}
                                        alt={comment.user?.full_name}
                                        className="comment-user-photos"
                                    />
                                ) :
                                    <div className="comment-user-photos comment-empty">{comment.user?.full_name.substring(0, 2).toLocaleUpperCase()}</div>
                                }
                                <span className="comment-user-name">{comment.user?.full_name}</span>
                            </div>
                            <div>
                                <h2 className="comment-title">{comment.title}</h2>
                                <p className="comment-description">{comment.description}</p>
                                <div className="comment-stars">
                                    {Array.from({ length: comment.rating }).map((_, i) => (
                                        <IoStar key={i} className="w-4 h-4 fill-yellow-400 stroke-yellow-600" />
                                    ))}
                                </div>
                                <div className="comment-views">
                                    {comment.views.map((url, i) => (
                                        <img key={i} src={currentStore.url + url} alt={`view-${i}`} />
                                    ))}
                                </div>
                                <ul className="comment-values">{
                                    Object.entries(comment.bind_name).map(([key, value]) => (
                                        <li key={key}>
                                            <span className='key'>{limit(key?.split(':')[0])}</span>
                                             : {
                                                value.icon?.[0]
                                                    ? <span className='icon-16' style={{ background: getImg(value.icon?.[0]) }}></span>
                                                    : value.key && (!key?.split(':')[1] || key?.split(':')[1] == 'color') && <span className='icon-16' style={{ border:'1px solid var(--discret-6)',borderRadius: '50px', background: value.key, minWidth:'16px' }}></span>


                                            }
                                             <span className='value'>{limit((typeof value == 'string' ? value : value.text || value.key) , 16)}</span>
                                        </li>
                                    ))
                                }</ul>
                                <p className="comment-date">
                                    Créé le {new Date(comment.created_at).toLocaleString()}
                                </p>
                            </div>

                            {currentStore === comment.user_id && (
                                <button
                                    className="comment-delete"
                                    onClick={() => onDelete(comment.id)}
                                    aria-label="Supprimer"
                                >
                                    <IoTrash className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};