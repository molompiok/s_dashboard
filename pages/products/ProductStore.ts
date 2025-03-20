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
    async updateProduct(product: Partial<ProductInterface>) {
        if (!product.id) return console.error('Product.id required');

        const h = useAuthStore.getState().getHeaders();
        if (!h) return

        const formData = new FormData();
        let send = false;
        // ['images', 'model_images'].forEach(p => {
        //     const d = product[p] as ImageViewerMapper | undefined
        //     if (d && Object.keys(d)) {
        //         send = true;
        //         const list: string[] = [];
        //         Object.keys(d).sort((a, b) => {
        //             return (d[a]?.index || 0) - (d[b]?.index || 0)
        //         }).forEach((k) => {
        //             list.push(k);
        //             if (d[k].isLocal) {
        //                 formData.append(k, d[k].file as Blob);
        //             }
        //         });
        //         formData.append(p, JSON.stringify(list));
        //     }
        // });
        formData.append('product_id', product.id);
        (['name', 'description', 'stock', 'category_id', 'is_visible', 'index', 'price', 'barred_price']).forEach(p => {
            if ((product as any)[p]) {
                formData.append(p, (product as any)[p]);
                send = true
            }
        });

        try {
            const response = await fetch(`${h.store.url}/update_product`, {
                method: 'PUT',
                body: formData,
                headers: h.headers
            });
            const updatedProduct = await response.json() as ProductInterface | null;
            if (!updatedProduct?.id) return;
            set(({ products }) => ({ products: products && { ...products, list: products.list.map((p) => p.id == updatedProduct.id ? updatedProduct : p) } }))
            console.log({updatedProduct});
            
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
    async fetchProductBy({ slug, product_id }: { slug?: string, product_id?: string }) {
        if (!product_id && !slug) return;
        const ps = get().products;
        const localProduct = ps?.list.find((p) => p.id == product_id || p.slug == slug);
        if (localProduct) {
            return localProduct
        } else {
            const list = await useProductStore.getState().fetchProducts({ product_id, slug });
            return list?.list[0];
        }
    },

    async createProduct(data: Partial<ProductInterface>,views:(string|Blob)[]) {
        try {

            console.log({data,views});
            
            const h = useAuthStore.getState().getHeaders()
            if (!h) return

            const form = new FormData();
            
            Object.keys(data).forEach((k) => {
                const i = (data as any)[k];
                if(k=='categories_id'){
                    i && form.append(k, JSON.stringify(i));
                }
                else{
                    i && form.append(k, i.toString());
                }
            })
            if(views){
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
            console.log({product}, 'api-response');
            
            if(!product?.id) return
            set(({ products }) => ({ products: products && { ...products, list:[product,...products.list]} }))
            return product
        } catch (error) {
            console.error(error);
            return 
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
        console.log({ h });
        filter.order_by = 'date_desc'
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
        console.log({ products });
        if (!products?.list) return
        if (!filter.no_save) set(() => ({ products }))
        return products as ListType<ProductInterface> | undefined
    }
})));

