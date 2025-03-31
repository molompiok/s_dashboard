import { create } from "zustand"
import { combine } from "zustand/middleware"
import { CommandInterface, ListType } from "../../Interfaces/Interfaces"
import { useAuthStore } from "../login/AuthStore"

type CommandFilterType = Partial<{
    command_id: string,
    user_id: string,
    order_by?: "date_desc" | "date_asc" | "price_desc" | "price_asc" | undefined,
    page: number,
    product_id: string,
    limit: number,
    no_save: boolean,
    status: string,
    min_price: number | undefined,
    max_price: number | undefined,
    min_date: number | undefined,
    max_date: number | undefined,
    search?: string
}>

export { useCommandStore, type CommandFilterType }
const useCommandStore = create(combine({
    commands: undefined as ListType<CommandInterface> | undefined,
}, (set, get) => ({
    async getCommandById({command_id}:{command_id?:string}){
        if (!command_id) return;
        const cs = get().commands;
        const localCommand = cs?.list.find((c) => c.id == command_id);
        if (localCommand) {
            return localCommand
        } else {
            const list = await useCommandStore.getState().getCommands({ command_id });
            const l = list?.list?.[0];
            return l;
        }
    },
    async getCommands(filter: CommandFilterType) {
        const h = useAuthStore.getState().getHeaders()

        if (!h) return
        const searchParams = new URLSearchParams({});
        for (const key in filter) {
            const value = (filter as any)[key];
            value != undefined && searchParams.set(key, value);
        }
        console.log('searchParams', searchParams);

        const response = await fetch(`${h.store.url}/get_users_orders/?${searchParams}`, {
            headers: h?.headers
        })
        // console.log({ response });
        const commands = await response.json();
        console.log('commands', commands);
        if (!commands?.list) return
        console.log({ commands: commands?.list });
        if (!filter.no_save) set(() => ({ commands: commands }))
        return commands as ListType<CommandInterface> | undefined
    }
})))