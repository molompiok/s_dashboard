import { create } from "zustand";
import { combine } from "zustand/middleware";
import { useAuthStore } from "../login/AuthStore";
import { Server_Host } from "../../renderer/+config";
import { ListType, StoreInterface } from "../../Interfaces/Interfaces";


export { useStore }

const useStore = create(combine({
    stores: undefined as ListType<StoreInterface> | undefined,
    currentStore:undefined as StoreInterface|undefined
}, (set, get) => ({
    async setCurrentStore(currentStore:StoreInterface|undefined){
        if(currentStore)localStorage.setItem('current_store',JSON.stringify(currentStore));
        else localStorage.removeItem('current_store');
        set(()=>({currentStore}));
    },
    async getCurrentStore(){
        let c = get().currentStore;
        if(!c) {
            try {
                const a = localStorage.getItem('current_store');
                c = a && JSON.parse(a);
            } catch (error) {}
        }
        if(!c) {
            const l = await useStore.getState().fetchOwnerStores({})
            c = l?.list[0];
        }
        return c
    },
    // async setStoreById(d) {
    //     if (!d.product_id) return;
    //     const ps = get().products;
    //     const p1 = ps?.list.find((p) => p.id == d.product_id);
    //     if (p1) {
    //         get().selectStore(p1)
    //         set(() => ({ featuresCollector: p1?.featuresCollector }))
    //         // showStoreWorld(set, p1);
    //     } else {
    //         const store = useRegisterStore.getState().store;
    //         if (!store) return;
    //         const query: any = {};
    //         query.product_id = d.product_id;
    //         query.is_features_required = true;
    //         query.store_id = store.id;
    //         query.by_product_category = !ps?.list[0] // TODO la recher n'est pas optimise, le produit peut ne pas se trouver dans la list, a cause de limit et page
    //         const searchParams = new URLSearchParams({});
    //         for (const key in query) {
    //             const value = query[key];
    //             (value != undefined) && searchParams.set(key, value);
    //         }
    //         const response = await fetch(`${Host}/get_products/?${searchParams.toString()}`);
    //         const ps2 = (await response.json()) as ListType<StoreScenus>
    //         if (!ps2.list) return
    //         const p2 = ps2.list.find(p => p.id == d.product_id) || ps2.list[0];
    //         set(() => ({ products: ps ? { ...ps, list: [...(ps2.list.filter(p => !ps.list.find(_p => _p.id == p.id))), ...ps.list] } : ps2, product: p2, featuresCollector: p2?.featuresCollector }))
    //         get().selectStore(p2)

    //     }
    // },
    async available_name(name: string) {
        try {
            const h = useAuthStore.getState().getHeaders();
            if (!h) return;

            const requestOptions = {
                method: "GET",
                headers: h.headers,
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

            const h = useAuthStore.getState().getHeaders();
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
                headers: h.headers,
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
            value && searchParams.set(key, value);
        }
        const response = await fetch(`${Server_Host}/get_stores/?${searchParams}`, {
            headers: h?.headers
        })
        const json = await response.json() as ListType<StoreInterface>
        if (!json?.list) return
        if (!filter.no_save) set(() => ({ stores: json }))
        return json
    }
})));

