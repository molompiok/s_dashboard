import React, { JSX, StyleHTMLAttributes } from "react";
import { create } from "zustand";
import { combine } from "zustand/middleware";
import { usePageContext } from "../usePageContext";
import { ClientCall } from "../../Components/Utils/functions";
import { useAuthStore } from "../../pages/login/AuthStore";
import { CategoryInterface, CommandInterface, ProductInterface } from "../../Interfaces/Interfaces";

export { useApp }
interface ClientInterface{

}

export  type GlobalSearchType = {
    products:ProductInterface[],
    clients: ClientInterface[],
    commands: CommandInterface[],
    categories:CategoryInterface[],
}
const useApp = create(combine({
    currentChild: null as JSX.Element | null | undefined,
    alignItems: '' as 'stretch' | 'start' | 'self-start' | 'self-end' | 'flex-start' | 'flex-end' | 'end' | 'baseline' | 'center',
    justifyContent: '' as 'right' | 'left' | 'space-around' | 'space-between' | 'space-evenly' | 'unsafe' | 'center',
    background: '' as string,
    blur: 0,
    back:true,
}, (set, get) => ({
    openChild(child: JSX.Element | null | undefined, option?: Partial<ReturnType<typeof get>>&{back?:boolean}) {
        set(() => ({
            currentChild: child,
            alignItems: option?.alignItems || 'center',
            justifyContent: option?.justifyContent || 'center',
            background: option?.background || '',
            blur: option?.blur || 0,
            back:option?.back||true
        }))
        if (!child && option?.back!==false) ClientCall(history.back,0);
        if(child) location.hash = 'openChild'
    },
    async gobalSearch({text}:{text?:string}){
        const h = useAuthStore.getState().getHeaders()
       
        const def = {
            products: [],
            clients: [],
            commands: [],
            categories: [],
        }
        if (!h) return def
        const searchParams = new URLSearchParams({});
        searchParams.set('text', text||'');
        
        const response = await fetch(`${h.store.url}/global_search?${searchParams}`, {
            headers: h?.headers
        })
        console.log({ response });
        const search = await response.json();
        if (!search?.products) return def

        return search as GlobalSearchType;
    
    }
})));

