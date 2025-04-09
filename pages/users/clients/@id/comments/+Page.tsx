import { useEffect, useState } from "react";
import { getTransmit, useStore } from "../../../../stores/StoreStore";
import { useClientStore } from "../../ClientStore";
import { CommentInterface, StoreInterface, UserInterface } from "../../../../../Interfaces/Interfaces";
import { usePageContext } from "../../../../../renderer/usePageContext";
import { useApp } from "../../../../../renderer/AppStore/UseApp";
import { useCommentStore } from "../../../../products/@id/comments/CommentStore";
import { Topbar } from "../../../../../Components/TopBar/TopBar";
import { ChildViewer } from "../../../../../Components/ChildViewer/ChildViewer";
import { ConfirmDelete } from "../../../../../Components/Confirm/ConfirmDelete";
import { PageNotFound } from "../../../../../Components/PageNotFound/PageNotFound";
import { AnimatePresence, motion } from "framer-motion";
import { IoChevronForward, IoStar, IoTrash } from "react-icons/io5";
import { limit } from "../../../../../Components/Utils/functions";
import { getImg } from "../../../../../Components/Utils/StringFormater";
import UserPreview from "../../../../../Components/userPreview/userPreview";
import '../../../../products/@id/comments/+Page.css'
import { getDefaultValues } from "../../../../../Components/Utils/parseData";
export default function Page() {
    const { comments, fetchClientComments, deleteComment } = useCommentStore();
    const { currentStore } = useStore();
    const { fetchClients } = useClientStore(); // Remplacé useProductStore par useUserStore
    const [user, setUser] = useState<Partial<UserInterface>>(); // Changé ProductInterface en UserInterface
    const { routeParams } = usePageContext();
    const { openChild } = useApp();

    useEffect(() => {
        currentStore && fetchClients({ user_id: routeParams.id }).then(res => {
            if (!res?.list[0]) return;
            setUser(res.list[0]);
        });
        currentStore && fetchClientComments({ user_id: routeParams.id, with_products: true });

        if (!currentStore) return;

        const transmit = getTransmit(currentStore.url);
        const subscription = transmit?.subscription(`store/${currentStore.id}/user/${routeParams.id}/comment`);

        async function subscribe() {
            if (!subscription) return;
            await subscription.create();
            subscription.onMessage<{ update: string }>((data) => {
                fetchClientComments({ user_id: routeParams.id, with_products: true });
                fetchClients({ user_id: routeParams.id }).then(res => {
                    if (!res?.list[0]) return;
                    setUser(res.list[0]);
                });
            });
        }

        subscribe().catch(console.error);

        return () => {
            subscription?.delete();
        };
    }, [currentStore]);


    console.log(comments);

    return (
        <div className="comments">
            <Topbar />
            <UserPreview user={user || {}} /> {/* Remplacé ProductPreview par UserPreview */}
            <h1 className="comments-title">Commentaires de l'utilisateur</h1>
            <CommentsDashboard
                comments={comments?.list || []}
                currentStore={currentStore || {}}
                onDelete={(commentId) => {
                    openChild(<ChildViewer>
                        <ConfirmDelete
                            title='Voulez-vous vraiment supprimer ce commentaire ?'
                            onCancel={() => openChild(null)}
                            onDelete={() => {
                                deleteComment({ comment_id: commentId }).then(res => {
                                    fetchClients({ user_id: routeParams.id }).then(res => {
                                        if (!res?.list[0]) return;
                                        setUser(res.list[0]);
                                    });
                                    fetchClientComments({ user_id: routeParams.id, with_products: true });
                                    openChild(null);
                                });
                            }}
                        />
                    </ChildViewer>, {
                        background: '#3455'
                    });
                }}
            />
            {(comments?.list.length || 0) === 0 && <PageNotFound
                image='/res/font.png'
                description="Les commentaires laissés par cet utilisateur seront listés ici."
                title="Aucun commentaire pour le moment"
                back={true}
            />}
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
                    const v = comment?.product && getDefaultValues(comment?.product)?.[0];

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
                            <div className="comment-user" >
                                {v?.views?.[0] ? (
                                    <img
                                        src={v.views[0].toString().startsWith('/') ? (currentStore?.url || '') + v.views[0] : v.views[0].toString()}
                                        alt={comment.user?.full_name}
                                        className="comment-user-photos product"
                                    />
                                ) : (
                                    <div className="comment-user-photos comment-empty">
                                        {comment.product?.name.substring(0, 2).toLocaleUpperCase()}
                                    </div>
                                )}
                                <span className="comment-user-name">{comment.product?.name}</span>
                                <div className="open-item" onClick={() => {
                                    window.location.assign(`/products/${comment.product?.id}`)
                                }}> ouvrir <IoChevronForward/></div>
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
                                        <img
                                            key={i}
                                            src={currentStore.url + url}
                                            alt={`view-${i}`}
                                            onClick={() => {
                                                // openChild(<ViewMore
                                                //     views={[...comment.views]}
                                                //     onClose={() => openChild(null)}
                                                // />, {
                                                //     background: '#0009'
                                                // });
                                            }}
                                        />
                                    ))}
                                </div>
                                <ul className="comment-values">
                                    {Object.entries(comment.bind_name).map(([key, value]) => (
                                        <li key={key}>
                                            <span className='key'>{limit(key?.split(':')[0])}</span>
                                            : {
                                                value.icon?.[0]
                                                    ? <span className='icon-16' style={{ background: getImg(value.icon?.[0]) }}></span>
                                                    : value.key && (!key?.split(':')[1] || key?.split(':')[1] === 'color') &&
                                                    <span className='icon-16' style={{
                                                        border: '1px solid var(--discret-6)',
                                                        borderRadius: '50px',
                                                        background: value.key,
                                                        minWidth: '16px'
                                                    }}></span>
                                            }
                                            <span className='value'>
                                                {limit((typeof value === 'string' ? value : value.text || value.key), 16)}
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