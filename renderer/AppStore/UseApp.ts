//renderer/AppStore/UseApp.ts
import React, { JSX, StyleHTMLAttributes } from "react";
import { create } from "zustand";
import { combine } from "zustand/middleware";
import { useAuthStore } from "../../pages/users/login/AuthStore";
import { CategoryInterface, CommandInterface, PeriodType, ProductInterface, StatParamType, StatsData, VisiteInterface } from "../../Interfaces/Interfaces";


export { useApp }
interface ClientInterface {

}

export type GlobalSearchType = {
    products: ProductInterface[],
    clients: ClientInterface[],
    commands: CommandInterface[],
    categories: CategoryInterface[],
}
const useApp = create(combine({
    userStats: undefined as undefined | UserStatsResult
}, (set, get) => ({
    async gobalSearch({ text }: { text?: string }) {
        const h = useAuthStore.getState().getHeaders()

        const def = {
            products: [],
            clients: [],
            commands: [],
            categories: [],
        }
        if (!h) return def
        const searchParams = new URLSearchParams({});
        searchParams.set('text', text || '');

        const response = await fetch(`${h.store.url}/global_search?${searchParams}`, {
            headers: h?.headers
        });
        const search = await response.json();
        if (!search?.products) return def

        return search as GlobalSearchType;
    },
    async fetchStats({ user_id, product_id, period, stats }: StatParamType) {
        const h = useAuthStore.getState().getHeaders()
        if (!h) return {}

        const searchParams = new URLSearchParams({});
        user_id && searchParams.set('user_id', user_id);
        period && searchParams.set('period', period);
        product_id && searchParams.set('product_id', product_id)

        if (stats) {
            stats?.forEach(s => {
                searchParams.append('stats', s);
            });
        }

        const response = await fetch(`${h.store.url}/stats?${searchParams}`, {
            headers: h?.headers
        });

        const _stats = await response.json();
        return _stats as StatsData || {};
    },
    async fetchUsersStats(filter: UserStatsFilterType) {
        const h = useAuthStore.getState().getHeaders()
        if (!h) return {}

        const searchParams = new URLSearchParams({});

        for (const [k, v] of Object.entries(filter)) {
            (v ?? undefined) != undefined && searchParams.append(k, v);
        }

        const response = await fetch(`${h.store.url}/get_users_stats?${searchParams}`, {
            headers: h?.headers
        });

        const _stats = await response.json();
        if (!_stats?.stats) return
        set(() => ({
            userStats: _stats.stats
        }))
        return _stats.stats as StatsData;
    }
})));

export interface UserStatsResult {
    activeUsers: number;
    totalClients: number;
    onlineClients: number;
    averageSatisfaction: number;
    ratedUsersCount: number;
}

export interface UserStatsFilterType {
    with_active_users?: boolean;
    with_total_clients?: boolean;
    with_online_clients?: boolean;
    with_satisfied_clients?: boolean;
} 