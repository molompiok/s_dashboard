//renderer/AppStore/globalActionZust.ts
import { create } from "zustand";
import { combine } from "zustand/middleware";

export { useAppZust }

const useAppZust = create(combine({
    sideLeft:false,
    sideRight:false,
}, (set, get) => ({
    setSideLeft(open:boolean){
        set(()=>({sideLeft:open}))
    }, 
    setSideRight(open:boolean){
        set(()=>({sideLeft:open}))
    }
    
})));
