import { create } from "zustand";
import { combine } from "zustand/middleware";
import { useAuthStore } from "../login/AuthStore";
import { Api_host, Server_Host } from "../../renderer/+config";
import { ProductInterface, ListType, FeatureInterface, ValueInterface, UpdateFeature, FilterType } from "../../Interfaces/Interfaces";
import { useStore } from "../stores/StoreStore";
import { EDITED_DATA, NEW_ID_START } from "../../Components/Utils/constants";
import { features } from "process";

export { useProductStore }


const useProductStore = create(combine({
    products: undefined as ListType<ProductInterface> | undefined,
}, (set, get) => ({
    async updateProduct(colleted: Partial<ProductInterface>,_product: Partial<ProductInterface>, initialFeatures?: Partial<FeatureInterface>[]) {
        let features: any[] = []
        
        if (initialFeatures && colleted.id) {
            features = (await multiple_features_values(colleted, initialFeatures))?.features||[];
            _product.features = features;
        }

        console.log('^^^^^^^^^^^^', features);
        

        const h = useAuthStore.getState().getHeaders();
        if (!h) {
            console.error('Headeur error', h);
            return _product
        }
        if (!colleted.id) {
            console.error('Product.id required', colleted);
            return _product
        }

        const formData = new FormData();
        let send = false;

        formData.append('product_id', colleted.id);

        (['name', 'description', 'stock', 'categories_id', 'is_visible', 'index', 'price', 'barred_price']).forEach(p => {
            if ((colleted as any)[p] != undefined) {
                if (p == 'categories_id') {
                    formData.append(p, Array.isArray((colleted as any)[p]) ? JSON.stringify((colleted as any)[p]) : (colleted as any)[p]);
                }
                else {
                    formData.append(p, (colleted as any)[p]);
                }
                send = true
            }
        });

        if (!send) return _product
        console.log('##############   send   ###################', colleted);
        try {
            const response = await fetch(`${h.store.url}/update_product`, {
                method: 'PUT',
                body: formData,
                headers: h.headers
            });
            const updatedProduct = await response.json() as ProductInterface | null;

            console.log({ updatedProduct });

            if (!updatedProduct?.id) return _product;
            updatedProduct.features = features;
            set(({ products }) => ({ products: products && { ...products, list: products.list.map((_p) => _p.id == updatedProduct.id ? updatedProduct : _p) } }))

            return updatedProduct;
        } catch (error) {
            console.error(error);
            return _product
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
    }: {
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
            delete data.features;
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
    async fetchProducts(filter: Partial<FilterType>) {
        const h = useAuthStore.getState().getHeaders()

        if (filter.categories_id) {
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
        const response = await fetch(`${h.store.url}/get_products/?${searchParams}`, {
            headers: h?.headers
        })
        // console.log({ response });
        const products = await response.json();
        if (!products?.list) return
        console.log({ products: products?.list });
        if (!filter.no_save) set(() => ({ products: products }))
        return products as ListType<ProductInterface> | undefined
    }
})));

async function multiple_features_values(product: Partial<ProductInterface>, initialFeatures: Partial<FeatureInterface>[]) {

    if (!product.features) return { features: initialFeatures } as Partial<ProductInterface>;
    try {
        let p_f = { features: product.features }

        let send = false;

        const delete_features_id: string[] = []
        const update_features: Partial<FeatureInterface>[] = []
        const create_features: Partial<FeatureInterface>[] = []
        const values: Record<string, Partial<{
            create_values: Partial<ValueInterface>[],
            update_values: Partial<ValueInterface>[],
            delete_values_id: string[],
        }>> = {}

        const next_f: Partial<FeatureInterface>[] = []
        for (const f of product.features) {
            if (f.id.startsWith(NEW_ID_START)) {
                create_features.push(f);
                send = true
            } else {
                next_f.push(f)
            }
        }

        for (const initial_f of initialFeatures) {
            const initial_here = (next_f || []).find(f => initial_f.id == f.id);
            if (!initial_here) {
                initial_f.id && delete_features_id.push(initial_f.id);
                send = true
                continue
            }
            if (!initial_here.id) continue
            const next_v: Partial<ValueInterface>[] = []
            for (const v of initial_here.values || []) {
                if (v.id.startsWith(NEW_ID_START)) {
                    if (!values[initial_here.id]) values[initial_here.id] = {};
                    if (!values[initial_here.id].create_values) values[initial_here.id].create_values = []
                    values[initial_here.id].create_values?.push(v);
                    send = true
                } else {
                    next_v.push(v)
                }
            }

            for (const i_v of initial_f.values || []) {
                const same_inital_value = next_v.find(_v => _v.id == i_v.id);

                if (!same_inital_value) {
                    if (!values[initial_here.id]) values[initial_here.id] = {};
                    if (!values[initial_here.id].delete_values_id) values[initial_here.id].delete_values_id = []
                    values[initial_here.id].delete_values_id?.push(i_v.id)
                    send = true
                } else if ((same_inital_value as any)[EDITED_DATA] == EDITED_DATA) {
                    if (!values[initial_here.id]) values[initial_here.id] = {};
                    if (!values[initial_here.id].update_values) values[initial_here.id].update_values = []
                    values[initial_here.id].update_values?.push(same_inital_value);
                    send = true
                }
            }
            const need_update = (initial_here as any)[EDITED_DATA] == EDITED_DATA
            if (!need_update) continue
            update_features.push(initial_here);
            send = true
        }
        const multiple_update_features = {
            delete_features_id: delete_features_id.length > 0 ? delete_features_id : undefined,
            update_features: update_features.length > 0 ? update_features : undefined,
            create_features: create_features.length > 0 ? create_features : undefined,
            values,
        }

        if (!send) return product
        console.log('avant ==> multi_update_features', { multiple_update_features, initialFeatures, product });
        /************  ENvoie a l'Api  du store    ************/



        const h = useAuthStore.getState().getHeaders();
        if (!h) {
            console.error('Headeur error', h);
            return product
        }
        if (!product.id) {
            console.error('Product.id required');
            return product
        }

        const newFiles = (newV: Partial<ValueInterface>) => {
            (['icon', 'views'] as const).forEach((a) => {

                if (!Array.isArray(newV[a])) return console.warn('newV[a] n\'est pas array', newV[a]); // Sécurisation

                (newV as any)[a] = newV[a].map((v, i) => {
                    if (typeof v === 'string') return v; // Conserver les strings

                    if (!(v instanceof Blob)) return console.warn('newV[a][' + i + '] n\'est un string ou Blob', v);; // Sécurité supplémentaire

                    if (!newV.id) {
                        console.warn(`ID manquant pour l'élément ${a}, index ${i}`);
                        return null;
                    }

                    const field = `${newV.id.replace('.','')}:${a}_${i}`;
                    formData.append(field, v);
                    return field;
                }).filter(Boolean); // Supprime les valeurs null ou undefined
            });
        }

        const formData = new FormData();
        for (const value of Object.values(multiple_update_features.values)) {
            for (const newV of value.create_values || []) {
                newFiles(newV)
            }
            for (const newV of value.update_values || []) {
                newFiles(newV)
            }
        }
        for (const feature of multiple_update_features.create_features || []) {
            for (const newV of feature.values || []) {
                newFiles(newV)
            }
        }
        console.log('##&#&#&## multi_update_features', multiple_update_features.values);
        formData.append('product_id', product.id);
        formData.append('multiple_update_features', JSON.stringify(multiple_update_features));

        const response = await fetch(`${h.store.url}/muptiple_update_features_values`, {
            method: 'post',
            body: formData,
            headers: h.headers
        });
        const res = await response.json() as ProductInterface | null
        console.log('apres ==> multi_update_features', res);

        if (res?.id) {
            console.log('==============', res);
            return res;
        } else {
            console.error(res);
            return product;
        }
    } catch (error) {
        console.error('multiple_features_values', error);
    }
    return product
}

