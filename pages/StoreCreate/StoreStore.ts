import React, { JSX, StyleHTMLAttributes } from "react";
import { create } from "zustand";
import { combine } from "zustand/middleware";
import { ClientCall } from "../../Components/Utils/functions";
import { useAuthStore } from "../login/AuthStore";
import { Host } from "../../renderer/+config";

type ListType<T> = {
    list:T,
    meta:{}
}

interface StoreInterface {
    id:string,
    user_id:string,
    name: string,
    title: string
    description: string,
    image: (string | File)[],
    cover_image: (string | File)[],
    domaines:string[],
    logo: (string | File)[],
    disk_storage_limit_gb:number,
    expire_at:string,
    created_at:string,
}
export { useStore }

const useStore = create(combine({
    stores: undefined as  StoreInterface|undefined
}, (set, get) => ({
   
   async fetchOwnerStores(filter:{
        store_id:string, 
        name:string, 
        order_by:string, 
        page: number, 
        limit: number,
    }){
        const h = useAuthStore.getState().getHeaders()
        const searchParams = new URLSearchParams({});
            for (const key in filter) {
                const value = (filter as any)[key];
                searchParams.set(key, value);
            }
        const response = await  fetch(`${Host}/get_owner_stores/?${searchParams}`,{
            headers:h?.headers
        })
        const json = await response.json();
        if(!json?.list) return 
    //    if(!no_save) set(()=>({stores:json}))
        return json
    }
})));

