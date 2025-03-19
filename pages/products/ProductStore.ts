import { create } from "zustand";
import { combine } from "zustand/middleware";
import { useAuthStore } from "../login/AuthStore";
import { Api_host, Server_Host } from "../../renderer/+config";
import { ProductInterface, ListType } from "../../Interfaces/Interfaces";
import { useStore } from "../stores/StoreStore";


export { useProductStore }

const useProductStore = create(combine({
    products: undefined as ListType<ProductInterface> | undefined,
}, (set, get) => ({
    async setProductBy({slug,product_id}:{slug?:string,product_id?:string}) {
        if (!product_id&&!slug) return;
        const ps = get().products;
        const localProduct = ps?.list.find((p) => p.id == product_id||p.slug == slug);
        if (localProduct) {
            return localProduct
        } else {
            const list  = await useProductStore.getState().fetchProducts({product_id,slug}) ;
            return  list?.list[0];
        }
    },
    async createProduct(data: Partial<ProductInterface>) {
        try {

            const h = useAuthStore.getState().getHeaders()
            if(!h) return

            const store = useStore.getState().currentStore;
            if(!store) return
            
            const host = store?.url||`http://172.0.0.1:3333/${store?.name||''}`
    
            const form = new FormData();
            console.log(data);

            // Object.keys(data).forEach((k) => {
            //     if (k == 'icon') {
            //         const i = data['']?.[0];
            //         i && form.append(k, JSON.stringify(['icon_0']));
            //         i && form.append('icon_0', i);
            //     } 
            //     else {
            //         const i = (data as any)[k];
            //         i && form.append(k, i.toString());
            //     };
            // })
            const requestOptions = {
                method: "POST",
                body: form,
                headers: h.headers,
            };

            const response = await fetch(`${Server_Host}/create_store`, requestOptions)
            const product = await response.json();
            return product
        } catch (error) {
            console.log(error);

            return error
        }
    },
    async fetchProducts(filter: Partial<{
        product_id: string,
        slug: string,
        order_by: string,
        page: number,
        limit: number,
        no_save: boolean
    }>) {
        const h = useAuthStore.getState().getHeaders()
        console.log({h});
        
        if(!h) return
        const searchParams = new URLSearchParams({});
        for (const key in filter) {
            const value = (filter as any)[key];
            value && searchParams.set(key, value);
        }
        console.log(`${h.store.url}/get_products/?${searchParams}`);
        
        const response = await fetch(`${h.store.url}/get_products/?${searchParams}`, {
            headers: h?.headers
        })
        console.log({response});
        const products = await response.json();
        console.log({products});
        if (!products?.list) return
        if (!filter.no_save) set(() => ({ products }))
        return products as ListType<ProductInterface> | undefined
    }
})));

