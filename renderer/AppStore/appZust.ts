//renderer/AppStore/globalActionZust.ts
import { create } from "zustand";
import { combine } from "zustand/middleware";

export { useAppZust }

export const DARK_MODE_KEY = 'is_dark_mode';

const useAppZust = create(combine({
    sideLeft: false,
    sideRight: false,
    themeMode: 'light' as 'light'|'dark',
}, (set, get) => ({
    setSideLeft(open: boolean) {
        set(() => ({ sideLeft: open }))
    },
    setSideRight(open: boolean) {
        set(() => ({ sideLeft: open }))
    },
    initDarkMode() {
        if (typeof window !== 'undefined') {
            const mode = localStorage.getItem(DARK_MODE_KEY);
            const themeMode = mode=='dark'?'dark':'light'
            set(() => ({ themeMode}))
            return themeMode
        }
        return 'light'
    },
    setThemeMode(themeMode: 'light'|'dark') {
        set(() => ({themeMode}))
        if (typeof window !== 'undefined') {
            localStorage.setItem(DARK_MODE_KEY, themeMode)
            if(themeMode == 'dark'){
                document.documentElement.classList.add('dark');
                document.body.classList.add('dark');
                document.documentElement.classList.remove('light');
                document.body.classList.remove('light');
            }else{
                document.documentElement.classList.add('light');
                document.body.classList.add('light');
                document.documentElement.classList.remove('dark');     
                document.body.classList.remove('dark');     
            }
        }
    }

})));
