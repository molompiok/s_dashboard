import { create } from "zustand";
import { combine } from "zustand/middleware";
import { useAuthStore } from "../login/AuthStore";
import { Api_host, Server_Host } from "../../renderer/+config";
import { ProductInterface, ListType, FeatureInterface, ValueInterface, UpdateFeature } from "../../Interfaces/Interfaces";
import { useStore } from "../stores/StoreStore";
import { EDITED_DATA, NEW_ID_START } from "../../Components/Utils/constants";

export { useProductStore }


const useProductStore = create(combine({
    products: undefined as ListType<ProductInterface> | undefined,
}, (set, get) => ({
    async updateProduct(product: Partial<ProductInterface>, initialFeatures?: Partial<FeatureInterface>[]) {
        let features: any[] = []
        let p: ProductInterface | undefined | void | null;

        console.log('initialFeatures ', initialFeatures, 'product.id', product.id);
        if (initialFeatures && product.id) {
            p = await multiple_features_values(product, initialFeatures);
            if (p?.features) {
                features = p.features
            }
        }

        console.log('#############  Product  ####################', p);

        const h = useAuthStore.getState().getHeaders();
        if (!h) return console.error('Headeur error', h);
        if (!product.id) return console.error('Product.id required', product);

        const formData = new FormData();
        let send = false;

        formData.append('product_id', product.id);

        (['name', 'description', 'stock', 'categories_id', 'is_visible', 'index', 'price', 'barred_price']).forEach(p => {
            if ((product as any)[p] != undefined) {
                if (p == 'categories_id') {
                    formData.append(p, Array.isArray((product as any)[p]) ? JSON.stringify((product as any)[p]) : (product as any)[p]);
                }
                else {
                    formData.append(p, (product as any)[p]);
                }
                send = true
            }
        });

        if (!send) return p
        console.log('##############   send   ###################', product);
        try {
            const response = await fetch(`${h.store.url}/update_product`, {
                method: 'PUT',
                body: formData,
                headers: h.headers
            });
            const updatedProduct = await response.json() as ProductInterface | null;

            console.log({ updatedProduct });

            if (!updatedProduct?.id) return;
            updatedProduct.features = features;
            set(({ products }) => ({ products: products && { ...products, list: products.list.map((p) => p.id == updatedProduct.id ? updatedProduct : p) } }))

            return updatedProduct;
        } catch (error) {
            console.error(error);
        }
    },
    async removeProduct(product_id: string) {
        const h = useAuthStore.getState().getHeaders();
        if (!h) return
        const response = await fetch(`${h.store.url}/delete_product/${product_id}`, {
            method: 'DELETE',
            headers: h.headers
        });
        const json = await response.json();
        return json?.isDeleted;
    },

    async fetchProductBy({
        slug,
        product_id,
    }:{
        slug?: string,
        product_id?: string
    }) {
        if (!product_id && !slug) return;
        const ps = get().products;
        const localProduct = ps?.list.find((p) => p.id == product_id || p.slug == slug);
        if (localProduct) {
            return localProduct
        } else {
            const list = await useProductStore.getState().fetchProducts({ product_id, slug });
            const l = list?.list[0];
            if (!l) return
            // set(({ products }) => ({ products: products && { ...products, list: products.list.map((p) => p.id == l.id ? l : p) } }))
            return l;
        }
    },

    async createProduct(data: Partial<ProductInterface>, views: (string | Blob)[] | null) {
        try {

            console.log({ data, views });

            const h = useAuthStore.getState().getHeaders()
            if (!h) return

            const form = new FormData();

            Object.keys(data).forEach((k) => {
                const i = (data as any)[k];
                if (k == 'categories_id') {
                    i && form.append(k, JSON.stringify(i));
                }
                else {
                    i && form.append(k, i.toString());
                }
            })
            if (views) {
                for (let i = 0; i < views.length; i++) {
                    const v = views[i];
                    v && form.append(`views_${i}`, v);
                }
            }
            const requestOptions = {
                method: "POST",
                body: form,
                headers: h.headers,
            };

            const response = await fetch(`${h.store.url}/create_product`, requestOptions)
            const product = await response.json();
            console.log({ product }, 'api-response');

            if (!product?.id) return
            set(({ products }) => ({ products: products && { ...products, list: [product, ...products.list] } }))
            return product
        } catch (error) {
            console.error(error);
            return
        }
    },
    async fetchProducts(filter: Partial<{
        product_id: string,
        slug: string,
        categories_id:string[],
        slug_cat:string,
        slug_product:string,
        order_by?: "date_desc" | "date_asc" | "price_desc" | "price_asc" | undefined,
        page: number,
        limit: number,
        no_save: boolean,
        min_price: number | undefined,
        max_price: number | undefined,
        search?:string
    }>) {
        const h = useAuthStore.getState().getHeaders()
       
        console.log(filter);
        if(filter.categories_id){
            try {
                (filter as any).categories_id = JSON.stringify(filter.categories_id)
            } catch (error) {
            }
        } 
        filter.slug_product = filter.slug_product || filter.slug;
        
        if (!h) return
        const searchParams = new URLSearchParams({});
        for (const key in filter) {
            const value = (filter as any)[key];
            value && searchParams.set(key, value);
        }
        console.log(`${h.store.url}/get_products/?${searchParams}`);

        const response = await fetch(`${h.store.url}/get_products/?${searchParams}`, {
            headers: h?.headers
        })
        console.log({ response });
        const products = await response.json();
        if (!products?.list) return
        console.log({ products:products?.list });
        if (!filter.no_save) set(() => ({ products }))
        return products as ListType<ProductInterface> | undefined
    }
})));

async function multiple_features_values(product: Partial<ProductInterface>, initialFeatures: Partial<FeatureInterface>[]) {

    try {

        initialFeatures = initialFeatures.filter(f => f.id !== product.default_feature_id);
        product.features = product.features?.filter(f => f.id !== product.default_feature_id);

        const delete_features_id: string[] = []
        const update_features: Partial<FeatureInterface>[] = []
        const create_features: Partial<FeatureInterface>[] = []
        const values: Record<string, {
            create_values: Partial<ValueInterface>[],
            update_values: Partial<ValueInterface>[],
            delete_values_id: string[],
        }> = {}

        const next_f: Partial<FeatureInterface>[] = []
        for (const f of product.features || []) {
            if (f.id.startsWith(NEW_ID_START)) {
                create_features.push(f);
            } else {
                next_f.push(f)
            }
        }

        for (const initial_f of initialFeatures) {
            const initial_here = (next_f || []).find(f => initial_f.id == f.id);
            if (!initial_here) {
                initial_f.id && delete_features_id.push(initial_f.id);
                continue
            }
            initial_here.id && (values[initial_here.id] = {
                create_values: [],
                update_values: [],
                delete_values_id: [],
            });
            const next_v: Partial<ValueInterface>[] = []
            for (const v of initial_here.values || []) {
                if (v.id.startsWith(NEW_ID_START)) {
                    initial_here.id && values[initial_here.id].create_values.push(v);
                } else {
                    next_v.push(v)
                }
            }

            for (const i_v of initial_f.values || []) {
                const same_inital_value = next_v.find(_v => _v.id == i_v.id);
                console.log({ same_inital_value, initial_f, i_v });

                if (!same_inital_value) {
                    initial_here.id && values[initial_here.id].delete_values_id.push(i_v.id)
                } else if ((same_inital_value as any)[EDITED_DATA] == EDITED_DATA) {
                    initial_here.id && values[initial_here.id].update_values.push(same_inital_value);
                }
            }
            const need_update = (initial_here as any)[EDITED_DATA] == EDITED_DATA
            if (!need_update) continue
            update_features.push(initial_here);

        }
        const multiple_update_features = {
            delete_features_id,
            update_features,
            create_features,
            values,
        }

        console.log('avant ==> multi_update_features', multiple_update_features);
        /************  ENvoie a l'Api  du store    ************/


        const h = useAuthStore.getState().getHeaders();
        if (!h) return console.error('Headeur error', h);
        if (!product.id) return console.error('Product.id required');
        const formData = new FormData();
        formData.append('product_id', product.id);
        formData.append('multiple_update_features', JSON.stringify(multiple_update_features));

        try {
            const response = await fetch(`${h.store.url}/muptiple_update_features_values`, {
                method: 'post',
                body: formData,
                headers: h.headers
            });
            const res = await response.json() as ProductInterface | null
            console.log('apres ==> multi_update_features', res);

            if (res?.id) {
                return res;
            } else {
                console.error(res);
            }
        } catch (error) {
            console.error('multiple_features_values', error);
        }
    } catch (error) {

    }
}

