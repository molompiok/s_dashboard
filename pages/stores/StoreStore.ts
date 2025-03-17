import { create } from "zustand";
import { combine } from "zustand/middleware";
import { useAuthStore } from "../login/AuthStore";
import { Server_Host } from "../../renderer/+config";
import { ListType, StoreInterface } from "../../Interfaces/Interfaces";


export { useStore }

const useStore = create(combine({
    stores: undefined as ListType<StoreInterface> | undefined
}, (set, get) => ({

    async available_name(name: string) {
        try {

            const h = useAuthStore.getState().getHeaders().headers;
            if (!h) return;

            const requestOptions = {
                method: "GET",
                headers: h,
            };

            const response = await fetch(`${Server_Host}/available_name?name=${name}`, requestOptions)
            const available = await response.json();
            return available as { is_availableble_name: boolean }
        } catch (error) {
            console.log(error);
            return
        }
    },

    async createStore(data: Partial<StoreInterface>) {
        try {

            const h = useAuthStore.getState().getHeaders().headers;
            if (!h) return;

            const form = new FormData();
            console.log(data);

            Object.keys(data).forEach((k) => {
                if (k == 'logo') {
                    const i = data['logo']?.[0];
                    i && form.append(k, JSON.stringify(['logo_0']));
                    i && form.append('logo_0', i);
                } else if (k == 'cover_image') {
                    const i = data['cover_image']?.[0];
                    i && form.append('cover_image', JSON.stringify(['cover_image_0']));
                    i && form.append('cover_image_0', i);
                }
                else {
                    const i = (data as any)[k];
                    i && form.append(k, i.toString());
                };
            })
            const requestOptions = {
                method: "POST",
                body: form,
                headers: h,
            };

            const response = await fetch(`${Server_Host}/create_store`, requestOptions)
            const store = await response.json();
            return store
        } catch (error) {
            console.log(error);

            return error
        }
    },
    async fetchOwnerStores(filter: Partial<{
        store_id: string,
        name: string,
        order_by: string,
        page: number,
        limit: number,
        no_save: boolean
    }>) {
        const h = useAuthStore.getState().getHeaders()
        const searchParams = new URLSearchParams({});
        for (const key in filter) {
            const value = (filter as any)[key];
            searchParams.set(key, value);
        }
        const response = await fetch(`${Server_Host}/get_stores/?${searchParams}`, {
            headers: h?.headers
        })
        const json = await response.json();
        if (!json?.list) return
        if (!filter.no_save) set(() => ({ stores: json }))
        return json
    }
})));

