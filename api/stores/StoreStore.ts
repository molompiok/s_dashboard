//pages/stores/StoreStore.ts
import { create } from "zustand";
import { combine } from "zustand/middleware";
import { ListType, StoreInterface } from "../Interfaces/Interfaces";

import { Transmit } from '@adonisjs/transmit-client'
import { Data } from "../../renderer/AppStore/Data";

export { useGlobalStore, getTransmit }

let transmit: Transmit | null = null;
let baseUrl = ''
function getTransmit(url: string): Transmit | null {
    if (baseUrl == url && transmit) return transmit;
    transmit?.close();
    baseUrl = url;
    if (!url) return null
    console.log(url);

    const host = (process.env.NODE_ENV == 'production' ? 'https://' : 'http://');
    url = (!url.startsWith('http') ? host : '') + url
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
    _current: undefined as StoreInterface | undefined,
    stores: undefined as ListType<StoreInterface> | undefined,
    currentStore: undefined as StoreInterface | undefined,
}, (set, get) => ({
    async testSSE() {
        if (!useGlobalStore.getState().currentStore?.url) {
            console.log('-------useGlobalStore .getState().currentStore?.url----', useGlobalStore.getState().currentStore);
            return
        }
        const response = await fetch(`${useGlobalStore.getState().currentStore?.url}/test_sse`)

    },
    setCurrentStore(currentStore: StoreInterface | undefined) {
        Data.apiUrl =  currentStore?.api_url
        set(() => ({ currentStore: currentStore }));
        if (currentStore)
            localStorage.setItem('current_store', JSON.stringify(currentStore));
        else {
            localStorage.removeItem('current_store');
            return;
        }
    },
    getCurrentStore() {
        let c = get().currentStore;
        if (c) return c
        try {
            const a = localStorage.getItem('current_store');
            c = a && JSON.parse(a);
           console.log(c);
            set(() => ({ currentStore: c }));
            return c
        } catch (error) { }
        return 
    },
})));

