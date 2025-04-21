//pages/login/AuthStore.ts
import { create } from "zustand";
import { UserInterface } from "../../Interfaces/Interfaces";
import { Api_host, Host } from "../../renderer/+config";
import { combine } from "zustand/middleware";
import { useStore } from "../stores/StoreStore";

export const useAuthStore = create(combine({
    user: undefined as UserInterface|undefined,
},(set) => ({
    async updateUser({ name, photos,user_id }:{user_id?:string,name?:string,photos?:(string|Blob)[]}) {

        const fromData = new FormData();
        if (name) fromData.append('name', name);
        if (photos?.[0]) {
            fromData.append('photos_0', photos[0]);
        } else {
            return
        }
        user_id && fromData.append('id',user_id)
        fromData.append('photos', '["photos_0"]');
        const response = await fetch(`${Host}/edit_me`, {
            method: 'POST',
            body: fromData,
        });
        const user = await response.json();

        if (!user.id) return
        set(() => ({
            user: {
                ...user,
                photos: user.photos.map((p: string) => `${Host}${p}`)
            }
        }));
        localStorage.setItem('user', JSON.stringify(user));
    },
    async disconnection() {
        const h = useAuthStore.getState().getHeaders();
        if (!h) return

        const requestOptions = {
            method: "GET",
            headers: h.headers,
        };
        await fetch(`${Host}/disconnection`, requestOptions)


        localStorage.removeItem('user');
        localStorage.removeItem('store_name');
        set(() => ({ user: undefined, store: undefined, userStore: undefined, openAuth: true }));
    },
    async getAccess() {
        window.open(
            `${Host}/google_connexion`,
            undefined,
            "popup"
        );
        const id = setInterval(() => {
            const userJson = localStorage.getItem('user');
            const user = userJson && JSON.parse(userJson);
            if (user) {
                console.log('getAccess', { token: user.token });

                set(() => ({ user: user }))
                clearInterval(id);
                useAuthStore.getState().canUseStore()
            }
        }, 100);
    },
    async canUseStore() {

        let userJson = localStorage.getItem('user');
        if (userJson) {
            const user = JSON.parse(userJson);
            const myHeaders = new Headers();
            myHeaders.append("Authorization", `Bearer ${user.token}`);
            const requestOptions = {
                method: "GET",
                headers: myHeaders,
            };

            const response = await fetch(`${Host}/can_manage_store`, requestOptions)

            let js: any
            const clear = () => {
                localStorage.removeItem('user');
                localStorage.removeItem('store');
                set(() => ({ user: undefined, userStore: undefined, store: undefined, openAuth: true }));
            }
            try {
                js = await response.json();
                if (!js.user) return clear()
            } catch (error) {
                return clear();
            }
            const _user = { ...user, ...js.user };
            set(() => ({ user: _user, userStore: js.userStore, store: js.store, openAuth: false }))
            localStorage.setItem('user', JSON.stringify(_user));
        } else {
            localStorage.removeItem('user');
            localStorage.removeItem('store');
            set(() => ({ user: undefined, userStore: undefined, store: undefined, openAuth: true }))
        }
    },
    getHeaders() {
        let user = useAuthStore.getState().user as UserInterface;
        if (!user) return
        
        const store = useStore.getState().currentStore;
        console.log({store});
        
        if(!store) return;
        store.url = store?.url||Api_host
        
        const headers = new Headers();
        headers.append("Authorization", `Bearer ${
            'oat_MQ.OEt4d1ZlWFNKZndjb0xHV2EtUkd2SXByQ01PTTRVVVp3RjkwaVJDczIzMDM0MDE5MjU'// a recuperer dynamiquement
        }`);
        return {headers ,user,store}
    }
})));
