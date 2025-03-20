import { create } from "zustand";
import { combine } from "zustand/middleware";
import { useAuthStore } from "../../login/AuthStore";
import { Server_Host } from "../../../renderer/+config";
import { CategoryInterface, ListType } from "../../../Interfaces/Interfaces";
import { useStore } from "../../stores/StoreStore";


export { useCategory }

const useCategory = create(combine({
    categories: undefined as ListType<CategoryInterface> | undefined,
}, (set, get) => ({

    async fetchCategoryBy({category_id,slug}:{category_id?:string,slug?:string}) {
        if (!category_id&&!slug) return;
        const cs = get().categories;
        console.log({cs});
        
        const localProduct = cs?.list.find((c) => c.id == category_id||c.slug == slug);
        console.log({localProduct});
        if (localProduct) {
            return localProduct
        } else {
            const list  = await useCategory.getState().fetchCategories({category_id,slug}) ;
            console.log({list});
            return  list?.list[0];
        }
    },
    async createCategory(data: Partial<CategoryInterface>) {
        try {

            const h = useAuthStore.getState().getHeaders()
            if(!h) return
           
            const form = new FormData();
            console.log(data);

            Object.keys(data).forEach((k) => {
                if (k == 'icon') {
                    const i = data['icon']?.[0];
                    i && form.append(k, JSON.stringify(['icon_0']));
                    i && form.append('icon_0', i);
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

            const response = await fetch(`${h.store.url}/create_store`, requestOptions)
            const category = await response.json();
            return category
        } catch (error) {
            console.log(error);

            return error
        }
    },
    async fetchCategories(filter: Partial<{
        category_id: string,
        slug: string,
        order_by: string,
        page: number,
        limit: number,
        no_save: boolean
    }>) {
        const h = useAuthStore.getState().getHeaders()
        if(!h) return;
       
        const searchParams = new URLSearchParams({});
        for (const key in filter) {
            const value = (filter as any)[key];
            value &&  searchParams.set(key, value);
        }
        console.log(`${h.store.url}/get_categories/?${searchParams}`);
        
        const response = await fetch(`${h.store.url}/get_categories/?${searchParams}`, {
            headers: h?.headers
        })
        const categories = await response.json();
        console.log({categories});
        if (!categories?.list) return
        if (!filter.no_save) set(() => ({ categories: categories }))
        return categories as ListType<CategoryInterface> | undefined
    }
})));

