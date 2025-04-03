import { create } from "zustand"
import { combine } from "zustand/middleware"
import { CommandFilterType, CommandInterface, EventStatus, ListType } from "../../Interfaces/Interfaces"
import { useAuthStore } from "../login/AuthStore"



export { useCommandStore, type CommandFilterType }
const useCommandStore = create(combine({
    commands: undefined as ListType<CommandInterface> | undefined,
}, (set, get) => ({
    async getCommandById({ command_id, with_items }: { command_id?: string, with_items?: boolean }) {
        if (!command_id) return;
        const cs = get().commands;
        const localCommand = cs?.list.find((c) => c.id == command_id);
        if (localCommand) {
            return localCommand
        } else {
            const list = await useCommandStore.getState().getCommands({ command_id, with_items });
            const l = list?.list?.[0];
            return l;
        }
    },
    async updateEventStatus(event_status:Partial<EventStatus>&{user_order_id:string}) {

        const h = useAuthStore.getState().getHeaders();
        if (!h) {
            console.error('Headeur error', h);
            return;
        }
        if (!event_status.status) {
            console.error('event_status.status required',event_status);
            return;
        }

        const formData = new FormData();
        let send = false;
        ([
            'change_at',
            'status',
            'estimated_duration',
            'message',
            'user_role',
            'user_provide_change_id',
            'user_order_id'

        ]).forEach(p => {
            if ((event_status as any)[p] != undefined) {
                if (p == 'status') {
                    (event_status).status && formData.append(p,(event_status).status?.toLowerCase());
                }
                else {
                    formData.append(p, (event_status as any)[p]);
                }
                send = true
            }
        });

        try {
            const response = await fetch(`${h.store.url}/update_user_order`, {
                method: 'PUT',
                body: formData,
                headers: h.headers
            });
            const updatedCommand = await response.json() as CommandInterface | null;

            console.log({ updatedCommand });

            if (!updatedCommand?.id) return ;

            set(({ commands }) => ({ commands: commands && { ...commands, list: commands.list.map((_p) => _p.id == updatedCommand.id ? updatedCommand : _p) } }))

            return updatedCommand;
        } catch (error) {
            console.error(error);
            return
        }
    },
    async getCommands(filter: CommandFilterType) {
        const h = useAuthStore.getState().getHeaders()

        if (!h) return
        const searchParams = new URLSearchParams({});
        for (const key in filter) {
            const value = (filter as any)[key];
            if (key == 'status' && value) {
                searchParams.set(key, JSON.stringify(value))
                continue
            }
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