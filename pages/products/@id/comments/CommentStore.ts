import { create } from "zustand";
import { combine } from "zustand/middleware";
import { CommentInterface, ListType } from "../../../../Interfaces/Interfaces";
import { useAuthStore } from "../../../login/AuthStore";


export { useCommentStore }
const useCommentStore = create(combine({
    comments: undefined as ListType<CommentInterface> | undefined,
}, (set, get) => ({
    async fetchClientComments({user_id,with_products,comment_id }: {user_id?:string,with_products?:boolean,comment_id?: string }) {
        try {
            const h = useAuthStore.getState().getHeaders()
            if (!h) return;

            const searchParams = new URLSearchParams({});
            if (user_id) searchParams.append('user_id', user_id);
            if (comment_id) searchParams.append('comment_id', comment_id);
            with_products !== undefined &&  searchParams.append('with_products', 'true')
            
            const response = await fetch(`${h.store.url}/get_comments/?${searchParams}`, {
                headers: h?.headers
            })
            const comments = await response.json();
            // console.log({comments});
            if (!comments?.list) return
            set(() => ({ comments: comments }));
            return comments as ListType<CommentInterface> | undefined
        } catch (error) {
            console.log(error);
        }
    },
    async fetchProductComments({ product_id, comment_id,with_users }: {with_users?:boolean, product_id: string, comment_id?: string }) {
        try {
            const h = useAuthStore.getState().getHeaders()
            if (!h) return;

            const searchParams = new URLSearchParams({});
            if (product_id) searchParams.append('product_id', product_id);
            if (comment_id) searchParams.append('comment_id', comment_id);
            with_users !== undefined &&  searchParams.append('with_users', 'true')
            const response = await fetch(`${h.store.url}/get_comments/?${searchParams}`, {
                headers: h?.headers
            })
            const comments = await response.json();
            // console.log({comments});
            if (!comments?.list) return
            set(() => ({ comments: comments }));
            return comments as ListType<CommentInterface> | undefined
        } catch (error) {
            console.log(error);
        }
    },
    async deleteComment({ comment_id }: { comment_id: string }) {
        const h = useAuthStore.getState().getHeaders();
        if (!h) return
        if(!comment_id) return console.error('comment_id required');
        const response = await fetch(`${h.store.url}/delete_comment/${comment_id}`, {
            method: 'DELETE',
            headers: h.headers
        });
        const json = await response.json();
        console.log(json);
        if (json?.isDeleted) {
            set(({ comments }) => ({ comments: comments && { ...comments, list: comments.list.filter(c => c.id !== comment_id) } }))
        }
        return json?.isDeleted;
    }
}
)));