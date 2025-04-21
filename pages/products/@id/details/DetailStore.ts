//pages/products/@id/details/DetailStore.ts
import { create } from "zustand";
import { combine } from "zustand/middleware";
import { DetailInterface, ListType } from "../../../../Interfaces/Interfaces";
import { useAuthStore } from "../../../login/AuthStore";


export { useDetailStore }
const useDetailStore = create(combine({
    details: undefined as ListType<DetailInterface> | undefined,
}, (set, get) => ({
    async updateDetail(collected: Partial<DetailInterface> & { id: string },with_list:boolean) {
        if (!collected.id) return console.error('Details.id required');

        const h = useAuthStore.getState().getHeaders();
        if (!h) return

        const formData = new FormData();
        
        Object.keys(collected).forEach((k) => {
            const i = (collected as any)[k];
            if (k == 'view') {
                if (Array.isArray(i)) {
                    if (typeof i[0] == 'string') {
                        formData.append('view', JSON.stringify(i));
                    } else {
                        formData.append('view_0', i[0]);
                        formData.append('view', JSON.stringify(['view_0']));
                    }
                }
            }
            else {
                i != undefined && formData.append(k, i.toString());
            }
        })
        // formData.append('detail_id', collected.id);
        // formData.append('with_list', with_list ? 'true' : 'false');
        try {
            const response = await fetch(`${h.store.url}/update_detail`, {
                method: 'PUT',
                body: formData,
                headers: h.headers
            });
            const detail = await response.json() as DetailInterface | null;
            if (!detail?.id) return;
            set(({ details }) => ({ details: details && { ...details, list: details.list.map((p) => p.id == detail.id ? detail : p) } }))
            console.log({ detail });

            return detail;
        } catch (error) {
            console.error(error);
        }

        return undefined
    },
    async createDetail(colleted: Partial<DetailInterface>) {
        try {

            console.log({ colleted });
            if(!colleted.product_id) return console.error('product_id required');
            const h = useAuthStore.getState().getHeaders()
            if (!h) return

            const form = new FormData();

            Object.keys(colleted).forEach((k) => {
                const i = (colleted as any)[k];
                if (k == 'view') {
                    if (Array.isArray(i)) {
                        i && form.append('view_0', i[0]);
                    }
                }
                else {
                    i && form.append(k, i.toString());
                }
            })

            const requestOptions = {
                method: "POST",
                body: form,
                headers: h.headers,
            };

            const response = await fetch(`${h.store.url}/create_detail`, requestOptions)
            const detail = await response.json() as DetailInterface | undefined;
            console.log({ detail });
            if (!detail?.id) return
            set(({ details }) => ({ details: details && { ...details, list: [detail, ...details.list] } }))
            return detail
        } catch (error) {
            console.error(error);
            return
        }
    },
    async fetchDetails({ product_id, detail_id }: { product_id: string, detail_id?: string }) {
        try {
            const h = useAuthStore.getState().getHeaders()
            if (!h) return;

            const searchParams = new URLSearchParams({});
            if (product_id) searchParams.append('product_id', product_id);
            if (detail_id) searchParams.append('detail_id', detail_id);
            const response = await fetch(`${h.store.url}/get_details/?${searchParams}`, {
                headers: h?.headers
            })
            const details = await response.json();
            // console.log({details});
            if (!details?.list) return
            set(() => ({ details: details }));
            return details as ListType<DetailInterface> | undefined
        } catch (error) {
            console.log(error);
        }
    },
    async deleteDetail({ detail_id }: { detail_id: string }) {
        const h = useAuthStore.getState().getHeaders();
        if (!h) return
        if(!detail_id) return console.error('detail_id required');
        const response = await fetch(`${h.store.url}/delete_detail/${detail_id}`, {
            method: 'DELETE',
            headers: h.headers
        });
        const json = await response.json();
        console.log(json);
        if (json?.isDeleted) {
            set(({ details }) => ({ details: details && { ...details, list: details.list.filter(c => c.id !== detail_id) } }))
        }
        return json?.isDeleted;
    }
}
)));