//pages/stores/StoreStore.ts
import { create } from "zustand";
import { combine } from "zustand/middleware";
import { useAuthStore } from "../login/AuthStore";
import { Api_host, Server_Host } from "../../renderer/+config";
import { ListType, StoreInterface } from "../../Interfaces/Interfaces";

import { Transmit } from '@adonisjs/transmit-client'
import { ClientCall } from "../../Components/Utils/functions";

export { useGlobalStore, getTransmit }

let transmit: Transmit | null = null;
let baseUrl = ''
function getTransmit(url: string): Transmit | null {
    if (baseUrl == url && transmit) return transmit;
    transmit?.close();
    baseUrl = url;
    if (!url) return null
    console.log(url);

    transmit = new Transmit({
        baseUrl: url,
        uidGenerator() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                const r = (Math.random() * 16) | 0
                const v = c === 'x' ? r : (r & 0x3) | 0x8
                return v.toString(16)
            })
        }
    })

    return transmit
}
const useGlobalStore = create(combine({
    _current: undefined  as StoreInterface |undefined,
    stores: undefined as ListType<StoreInterface> | undefined,
    currentStore : {
        "id": "77b0d648-3c44-4e7a-8711-fef08a72605a",
        "user_id": "a25e2381-a634-4eea-a8ed-aa60ba37a61b",
        "name": "ladona5",
        "title": "Boutique ladona pour vous la donner",
        "description": "Tres bonne drescription ici Boutique ladona pour vous la donner",
        "slug": "ladona5",
        "logo": [],
        url: 'http://172.25.72.235:3334',
        "cover_image": [],
        "domain_names": [],
        "current_theme_id": "caf39884-da4f-4cbb-ba23-45907f07d6c2",
        "current_api_id": "1a23931c-7209-4c4f-8b40-64884b004956",
        "expire_at": "2025-05-02T15:18:52.073+00:00",
        "disk_storage_limit_gb": 1,
        "is_active": false,
        currency: 'cfa',
        "created_at": "2025-04-18T15:18:52.119+00:00",
        "updated_at": "2025-04-18T15:18:52.120+00:00",
        "currentApi": {
            "id": "1a23931c-7209-4c4f-8b40-64884b004956",
            "name": "API HELLO WORLD",
            "slug": "api-hello-world",
            "description": null,
            "docker_image_name": "busybox",
            "docker_image_tag": "latest",
            "internal_port": 3334,
            "source_path": "/home/opus-ub/s_api",
            "is_default": true,
            "created_at": "2025-04-17T10:51:35.188+00:00",
            "updated_at": "2025-04-17T15:06:38.132+00:00"
        },
        "currentTheme": {
            "id": "caf39884-da4f-4cbb-ba23-45907f07d6c2",
            "creator_id": null,
            "name": "La belle a 2",
            "slug": "la-belle-a-2-1",
            "description": "Description mise à jour ! Supporte maintenant les widgets.",
            "preview_images": [],
            "docker_image_name": "hello-world",
            "docker_image_tag": "latest",
            "internal_port": 3334,
            "source_path": null,
            "is_public": false,
            "is_active": true,
            "is_default": true,
            "is_premium": false,
            "price": null,
            "created_at": "2025-04-17T11:08:12.160+00:00",
            "updated_at": "2025-04-17T11:09:54.329+00:00"
        }
     } as StoreInterface |undefined,
}, (set, get) => ({
    async testSSE() {
        if (!useGlobalStore.getState().currentStore?.url) {
            console.log('-------useGlobalStore .getState().currentStore?.url----', useGlobalStore.getState().currentStore);
            return
        }
        const response = await fetch(`${useGlobalStore.getState().currentStore?.url}/test_sse`)

    },
    async setCurrentStore(currentStore: StoreInterface | undefined) {
        currentStore && (currentStore.url = Api_host)
        set(() => ({currentStore:currentStore }));
        if (currentStore)
            localStorage.setItem('current_store', JSON.stringify(currentStore));
        else {
            localStorage.removeItem('current_store');
            return;
        }
    },
    async getCurrentStore() {
        let c = get().currentStore;
        if (!c) {
            try {
                const a = localStorage.getItem('current_store');
                c = a && JSON.parse(a);
                console.log(c);
                
            } catch (error) { }
        }
        if (!c) {
            // const l = await useGlobalStore.getState().fetchOwnerStores({})
            // c = l?.list[0];
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
        try {
            const response = await fetch(`${Server_Host}/stores/?${searchParams}`, {
                headers: h?.headers
            })
            const json = await response.json() as ListType<StoreInterface>
            if (!json?.list) return
            json.list.forEach(s => s.url = s?.url || Api_host)
            if (!filter.no_save) set(() => ({ stores: json }))
            return json
        } catch (error) {
            return { list: [], meta: {} }
        }
    }
})));

