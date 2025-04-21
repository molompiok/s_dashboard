//pages/users/clients/ClientStore.ts
import { create } from "zustand";
import { combine } from "zustand/middleware";
import { ListType, UserFilterType, UserInterface } from "../../../Interfaces/Interfaces";
import { useAuthStore } from "../../login/AuthStore";

export { useClientStore }
const useClientStore = create(combine({
    clients: undefined as ListType<UserInterface> | undefined,
}, (set, get) => ({

    async fetchClients(filter: UserFilterType) {
        try {
            const h = useAuthStore.getState().getHeaders()
            if (!h) return;

            const searchParams = new URLSearchParams({});
            for (const [k, v] of Object.entries(filter)) {
                if (k=='status'){
                    if(Array.isArray(v)){
                        v.forEach(a=> searchParams.append('status', a));
                    }
                }
                else{
                    (v?? undefined) && searchParams.append( k , v.toString() );
                }
            }
        
            searchParams.append('role','client');
            const response = await fetch(`${h.store.url}/get_users/?${searchParams}`, {
                headers: h?.headers
            })
            const clients = await response.json();
            // console.log({clients});
            if (!clients?.list) return
            set(() => ({ clients: clients }));
            return clients as ListType<UserInterface> | undefined
        } catch (error) {
            console.log(error);
        }
    },
    async deleteClient({ client_id }: { client_id: string }) {
        const h = useAuthStore.getState().getHeaders();
        if (!h) return
        if(!client_id) return console.error('client_id required');
        const response = await fetch(`${h.store.url}/delete_client/${client_id}`, {
            method: 'DELETE',
            headers: h.headers
        });
        const json = await response.json();
        console.log(json);
        if (json?.isDeleted) {
            set(({ clients }) => ({ clients: clients && { ...clients, list: clients.list.filter(c => c.id !== client_id) } }))
        }
        return json?.isDeleted;
    }
}
)));