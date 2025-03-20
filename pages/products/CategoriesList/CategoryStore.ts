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
    async updateProduct(category:Partial<CategoryInterface>) {
        

        return {}  as CategoryInterface
    },
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

            console.log({data});
            
            const h = useAuthStore.getState().getHeaders()
            if (!h) return

            const form = new FormData();
            
            Object.keys(data).forEach((k) => {
                const i = (data as any)[k];
                if(k=='icon'){
                    if(Array.isArray(i)){
                        i && form.append('icon_0', i[0]);
                    }
                }
                else if(k=='view'){
                    if(Array.isArray(i)){
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

            const response = await fetch(`${h.store.url}/create_category`, requestOptions)
            const category = await response.json() as CategoryInterface | undefined;
            console.log({category}, 'api-response');
            
            if(!category?.id) return
            set(({ categories }) => ({ categories: categories && { ...categories, list:[category,...categories.list]} }))
            return category
        } catch (error) {
            console.error(error);
            return
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

