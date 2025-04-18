import { create } from "zustand";
import { combine } from "zustand/middleware";
import { useAuthStore } from "../login/AuthStore";
import { CategoryInterface, ListType } from "../../Interfaces/Interfaces";


export { useCategory }

const useCategory = create(combine({
    categories: undefined as ListType<CategoryInterface> | undefined,
}, (set, get) => ({
    async removeCategory(category_id:string){
        const h = useAuthStore.getState().getHeaders();
        if (!h) return
        const response = await fetch(`${h.store.url}/delete_category/${category_id}`, {
            method: 'DELETE',
            headers: h.headers
        });
        const json = await response.json();
        console.log(json);
        if(json?.isDeleted){
            set(({ categories }) => ({ categories: categories && { ...categories, list: categories.list.filter(c=>c.id !== category_id)} }))
        }
        return json?.isDeleted;
    },
    async updateCategory(category:Partial<CategoryInterface>) {
        if (!category.id) return console.error('Categories.id required');
        
                const h = useAuthStore.getState().getHeaders();
                if (!h) return
        
                const formData = new FormData();
                let send = false;
                Object.keys(category).forEach((k) => {
                    const i = (category as any)[k];
                    if(k=='icon'){
                        if(Array.isArray(i)){
                            if(typeof i[0] == 'string'){
                                formData.append('icon', JSON.stringify(i));    
                            }else{
                                formData.append('icon_0', i[0]);
                                formData.append('icon', JSON.stringify(['icon_0']));
                            }
                        }
                    }
                    else if(k=='view'){
                        if(Array.isArray(i)){
                            if(typeof i[0] == 'string'){
                                formData.append('view', JSON.stringify(i));    
                            }else{
                                formData.append('view_0', i[0]);
                                formData.append('view', JSON.stringify(['view_0']));
                            }
                        }
                    }
                    else {
                        i!=undefined && formData.append(k, i.toString());
                    }
                })
                formData.append('category_id', category.id);
                
        
                try {
                    const response = await fetch(`${h.store.url}/update_category`, {
                        method: 'PUT',
                        body: formData,
                        headers: h.headers
                    });
                    const updatedCategory = await response.json() as CategoryInterface | null;
                    if (!updatedCategory?.id) return;
                    set(({ categories }) => ({ categories: categories && { ...categories, list: categories.list.map((p) => p.id == updatedCategory.id ? updatedCategory : p) } }))
                    console.log({updatedCategory});
                    
                    return updatedCategory;
                } catch (error) {
                    console.error(error);
                }

        return {}  as CategoryInterface
    },
    async fetchCategoryBy({slug,with_product_count,category_id}:{category_id:string,with_product_count?:boolean,categories_id?:string[],slug?:string}) {
        if (!category_id && !slug) return;
        const cs = get().categories;
        // console.log({cs});
        
        const localCategory = cs?.list.find( (c) => c.id == category_id)
        if (localCategory) {
            return localCategory
        } else {
            const list  = await useCategory.getState().fetchCategories({category_id,slug,with_product_count}) ;
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
            // console.log({category}, 'api-response');
            
            if(!category?.id) return
            set(({ categories }) => ({ categories: categories && { ...categories, list:[category,...categories.list]} }))
            return category
        } catch (error) {
            console.error(error);
            return
        }
    },
    async fetchCategories(filter: Partial<{
        categories_id: string[],
        slug: string,
        order_by: string,
        page: number,
        limit: number,
        no_save: boolean,
        with_product_count?:boolean,
        category_id:string,
    }>) {
        try {
            const h = useAuthStore.getState().getHeaders()
        if(!h) return;
       
        const searchParams = new URLSearchParams({});
        for (const key in filter) {
            const value = (filter as any)[key];
            if(key == 'categories_id'){
                if(value!=undefined) continue;
                if(Array.isArray(value)){
                    searchParams.set(key, JSON.stringify(value)); 
                }else{
                    searchParams.set(key, value);
                }
            }else if(key == 'with_product_count'){
                value && searchParams.set(key,'true');
            }else{
                value!=undefined &&  searchParams.set(key, value);
            }
        }
        // console.log(`${h.store.url}/get_categories/?${searchParams}`);
        
        const response = await fetch(`${h.store.url}/get_categories/?${searchParams}`, {
            headers: h?.headers
        })
        const categories = await response.json();
        // console.log({categories});
        if (!categories?.list) return
        if (!filter.no_save) set(() => ({ categories: categories }))
        return categories as ListType<CategoryInterface> | undefined
        } catch (error) {
            console.log(error);
            
        }
    }
})));

