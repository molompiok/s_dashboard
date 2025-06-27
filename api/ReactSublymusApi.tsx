//api/ReactSublymusApi.tsx

import React, { createContext, useContext, useMemo, ReactNode } from 'react';

import {
    QueryClient, QueryClientProvider, useQuery, useMutation,
    UseQueryResult, UseMutationResult, InvalidateQueryFilters, QueryKey
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import {
    SublymusApi, ApiError,
    // Importer TOUS les types Params/Response nécessaires depuis SublymusApi.ts
    LoginParams, LoginResponse, RegisterParams, RegisterResponse,
    VerifyEmailParams, ResendVerificationParams, UpdateUserParams, UpdateUserResponse,
    GetMeResponse, MessageResponse, DeleteResponse,
    GetProductListParams, GetProductListResponse, GetProductParams, GetProductResponse,
    CreateProductParams, CreateProductResponse, UpdateProductParams, UpdateProductResponse,
    DeleteProductResponse, MultipleUpdateFeaturesValuesParams, MultipleUpdateFeaturesValuesResponse,
    GetCategoriesParams, GetCategoriesResponse, GetCategoryResponse, CreateCategoryParams, CreateCategoryResponse,
    UpdateCategoryParams, UpdateCategoryResponse, DeleteCategoryParams, DeleteCategoryResponse,
    GetSubCategoriesParams, GetSubCategoriesResponse, GetCategoryFiltersParams, GetCategoryFiltersResponse,
    GetFeaturesParams, GetFeaturesResponse, GetFeatureParams, GetFeatureResponse, GetFeaturesWithValuesParams, GetFeaturesWithValuesResponse,
    GetValuesParams, GetValuesResponse, GetValueResponse, CreateValueParams, CreateValueResponse,
    UpdateValueParams, UpdateValueResponse, DeleteValueParams, DeleteValueResponse,
    GetDetailListParams, GetDetailListResponse, GetDetailParams, GetDetailResponse,
    CreateDetailParams, CreateDetailResponse, UpdateDetailParams, UpdateDetailResponse,
    DeleteDetailParams, DeleteDetailResponse,
    CreateOrderParams, CreateOrderResponse, GetMyOrdersParams, GetMyOrdersResponse,
    GetAllOrdersResponse, GetOrderParams, GetOrderResponse, UpdateOrderStatusParams, UpdateOrderStatusResponse,
    DeleteOrderParams, DeleteOrderResponse, CommandFilterType,
    UpdateCartParams, UpdateCartResponse, ViewCartResponse, MergeCartResponse,
    CreateCommentParams, CreateCommentResponse, GetCommentForOrderItemParams, GetCommentForOrderItemResponse,
    GetCommentsParams, GetCommentsResponse, UpdateCommentParams, UpdateCommentResponse, DeleteCommentParams, DeleteCommentResponse,
    AddFavoriteParams, AddFavoriteResponse, GetFavoritesParams, GetFavoritesResponse, UpdateFavoriteParams, UpdateFavoriteResponse, DeleteFavoriteParams, DeleteFavoriteResponse,
    CreateAddressParams, AddressResponse, GetAddressesParams, GetAddressesResponse, UpdateAddressParams, DeleteAddressParams,
    CreatePhoneParams, PhoneResponse, GetPhonesParams, GetPhonesResponse, UpdatePhoneParams, DeletePhoneParams,
    UserFilterType, GetUsersResponse,
    GetCollaboratorsParams, GetCollaboratorsResponse, CreateCollaboratorParams, CreateCollaboratorResponse, UpdateCollaboratorParams, UpdateCollaboratorResponse, DeleteCollaboratorParams, RemoveCollaboratorResponse, // Utiliser CollaboratorType
    GetInventoriesParams, GetInventoriesResponse, GetInventoryResponse, CreateInventoryParams, InventoryResponse, UpdateInventoryParams, DeleteInventoryParams, DeleteInventoryResponse, Inventory, // Utiliser Inventory
    StatParamType, GetStatsResponse,
    GlobalSearchParams, GlobalSearchResponse,
    ScaleResponse,
    FilesObjectType,
    GetStoresParams,
    GetStoresResponse,
    GetStoreResponse,
    CreateStoreResponse,
    CreateStoreParams,
    UpdateStoreParams,
    UpdateStoreResponse,
    DeleteStoreResponse,
    DeleteStoreParams,
    ChangeThemeParams,
    ChangeThemeResponse,
    UpdateStoreStatusResponse,
    UpdateStoreStatusParams,
    StoreActionResponse,
    StoreActionParams,
    ManageDomainResponse,
    ManageDomainParams,
    AvailableNameResponse,
    GetThemesResponse,
    GetThemesParams,
    GetThemeResponse,
    GetUserStatsParams,
    GetUserStatsResponse,
    GetCategoryParams
} from './SublymusApi'; // Importer la classe et l'erreur, et TOUS les types
import { useAuthStore } from './stores/AuthStore'; // Pour le token
import { useGlobalStore } from './stores/StoreStore'; // Pour l'URL du store
import logger from './Logger';
import { BaseStatsParams, CommentInterface, FeatureInterface, ForgotPasswordParams, KpiStatsResponse, ListContextSubscriptionsParams, ListContextSubscriptionsResponse, ListUserDevicesResponse, OrderStatsIncludeOptions, OrderStatsResponse, RegisterDeviceResponse, RemoveDeviceParams, RemoveDeviceResponse, ReorderProductFaqsParams, ReorderProductFaqsResponse, ResetPasswordParams, SetupAccountParams, SetupAccountResponse, SubscribeToContextResponse, UnsubscribeFromContextParams, UnsubscribeFromContextResponse, UpdateDeviceStatusParams, UpdateDeviceStatusResponse, VisitStatsIncludeOptions, VisitStatsResponse } from './Interfaces/Interfaces';
import { useTranslation } from 'react-i18next';
import { usePageContext } from '../renderer/usePageContext';
import {
    CreateProductFaqParams, CreateProductFaqResponse,
    ListProductFaqsParams, ListProductFaqsResponse,
    GetProductFaqParams, GetProductFaqResponse,
    UpdateProductFaqParams, UpdateProductFaqResponse,
    DeleteProductFaqParams, DeleteProductFaqResponse,
    ProductFaqInterface, 

    CreateProductCharacteristicParams, CreateProductCharacteristicResponse,
    ListProductCharacteristicsParams, ListProductCharacteristicsResponse,
    GetProductCharacteristicParams, GetProductCharacteristicResponse,
    UpdateProductCharacteristicParams, UpdateProductCharacteristicResponse,
    DeleteProductCharacteristicParams, DeleteProductCharacteristicResponse,
    ProductCharacteristicInterface 
} from  './Interfaces/Interfaces'
import { RegisterDevicePayload, SubscribeToContextPayload, UserBrowserSubscriptionInterface, UserNotificationContextSubscriptionInterface } from './stores/NotificationManager';

async function waitHere(millis: number) {
    await new Promise((rev) => setTimeout(() => rev(0), millis))
}

// --- Client TanStack Query (inchangé) ---
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
                // Ne pas réessayer pour les erreurs 4xx (sauf 429 - Too Many Requests)
                if (error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 429) {
                    return false;
                }
                // Réessayer 3 fois pour les autres erreurs
                return failureCount < 3;
            }
        },
    },
});

// --- Contexte API (inchangé) ---
interface SublymusApiContextType {
    api: SublymusApi | null;
}
const SublymusApiContext = createContext<SublymusApiContextType>({ api: null });

// Provider pour l'API et TanStack Query
interface SublymusApiProviderProps {
    children: ReactNode;
    handleUnauthorized?: (action?: string, token?: string) => void
    mainServerUrl?: string,
    storeApiUrl?: string,
    getAuthToken: () => string | undefined | null
}

export const SublymusApiProvider: React.FC<SublymusApiProviderProps> = ({ handleUnauthorized, children, storeApiUrl, getAuthToken, mainServerUrl }) => {
    const { t } = useTranslation();
    const api = useMemo(() => {

        // Server URL est toujours requis

        // if (!storeApiUrl) {
        //     logger.error("SublymusApiProvider: storeApiUrl prop is missing!");
        //     return null;
        // }

        return new SublymusApi({
            handleUnauthorized(action, token) {
             
            },
            getAuthToken,
            serverUrl: mainServerUrl,
            storeApiUrl: storeApiUrl,
            t
        });
    }, [storeApiUrl, mainServerUrl]);

    return (
        <QueryClientProvider client={queryClient}>
            <SublymusApiContext.Provider value={{ api }}>
                {children}
            </SublymusApiContext.Provider>
            {/* <ReactQueryDevtools initialIsOpen={false} /> */}
        </QueryClientProvider>
    );
};

const waitFor = (async (fn: Promise<any>, time = 2000): Promise<any> => {
    await waitHere(time)
    const res = await fn;
    return res
})


// --- Hook useApi (inchangé) ---
export const useApi = (): SublymusApi => {
    const context = useContext(SublymusApiContext);

    const { t } = useTranslation();
    if (!context || !context.api) {
        const { currentStore } = useGlobalStore.getState();
        if (!currentStore?.api_url) {
            throw new Error(t('api.contextError.noStoreUrl'));
        }
        throw new Error(t('api.contextError.providerMissing'));
    }
    return context.api;
};

// --- Hooks Personnalisés par Namespace ---

// ========================
// == Thèmes ==
// ========================

// Hook pour récupérer la liste des thèmes disponibles
export const useGetThemes = (params: GetThemesParams = {}, options: { enabled?: boolean } = {}): UseQueryResult<GetThemesResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetThemesResponse, ApiError>({
        queryKey: ['themes', params], // Clé de query pour la liste des thèmes
        queryFn: () => api.theme.getList(params),
        enabled: options.enabled !== undefined ? options.enabled : true,
        staleTime: 0 * 60 * 1000, // Cache long pour la liste des thèmes (1 heure)
    });
};

// Hook pour récupérer les détails d'un thème spécifique
export const useGetThemeById = (themeId: string | undefined, options: { enabled?: boolean } = {}): UseQueryResult<GetThemeResponse | null, ApiError> => {
    const api = useApi();
    return useQuery<GetThemeResponse | null, ApiError>({
        queryKey: ['themeDetails', themeId], // Clé spécifique au détail
        queryFn: () => themeId ? api.theme.getOne({ theme_id: themeId }) : Promise.resolve(null),
        enabled: !!themeId && (options.enabled !== undefined ? options.enabled : true),
        staleTime: 0 * 60 * 1000, // Cache "infini" pour les détails d'un thème (ils changent rarement)
    });
};

// Hook pour activer un thème pour un store (Mutation)
// Utilise la méthode api.store.changeTheme via l'alias api.theme.activateForStore
export const useActivateThemeForStore = (): UseMutationResult<ChangeThemeResponse, ApiError, ChangeThemeParams> => {
    const api = useApi();
    return useMutation<ChangeThemeResponse, ApiError, ChangeThemeParams>({
        mutationFn: (params) => waitFor(api.theme.activateForStore(params), 2000), // ou api.store.changeTheme(params)
        onSuccess: (data, variables) => {
            // Invalider les détails du store pour refléter le nouveau thème actif
            queryClient.invalidateQueries({ queryKey: ['storeDetails', variables.store_id] } as InvalidateQueryFilters);
            // Peut-être invalider la liste des stores si elle affiche le thème actif?
            // queryClient.invalidateQueries({ queryKey: ['stores'] } as InvalidateQueryFilters);
            logger.info("Theme activated for store via mutation", { storeId: variables.store_id, newThemeId: variables.themeId });
            // Afficher toast succès?
        },
        onError: (error) => { logger.error({ error }, "Failed to activate theme for store via mutation"); }
    });
};


// ==================================
// == Hooks pour Namespace STORE ==
// ==================================

// Hook pour récupérer la liste des stores de l'utilisateur (appelle s_server)
export const useGetStoreList = (params: GetStoresParams = {}, options: { enabled?: boolean } = {}): UseQueryResult<GetStoresResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetStoresResponse, ApiError>({
        queryKey: ['stores', params], // Clé pour la liste des stores
        queryFn: () => api.store.getList(params),
        enabled: options.enabled !== undefined ? options.enabled : true,
    });
};

// Hook pour récupérer UN store par ID (appelle s_server)
export const useGetStore = (storeId: string | undefined, options: { enabled?: boolean } = {}): UseQueryResult<GetStoreResponse | null, ApiError> => {
    const api = useApi();
    return useQuery<GetStoreResponse | null, ApiError>({
        queryKey: ['storeDetails', storeId], // Clé spécifique au détail
        queryFn: () => storeId ? api.store.getOne({ store_id: storeId }) : Promise.resolve(null),
        enabled: !!storeId && (options.enabled !== undefined ? options.enabled : true),
        staleTime: 0 * 60 * 1000, // Cache plus long pour les détails d'un store
    });
};

// Hook pour créer un store (appelle s_server)
export const useCreateStore = (): UseMutationResult<CreateStoreResponse, ApiError, CreateStoreParams> => {
    const api = useApi();
    return useMutation<CreateStoreResponse, ApiError, CreateStoreParams>({
        mutationFn: (data) => api.store.create(data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['stores'] } as InvalidateQueryFilters); // Rafraîchir la liste
            logger.info("Store created via mutation", data.store);
            // Mettre à jour le store courant si c'est le premier? Logique applicative.
        },
        onError: (error) => { logger.error({ error }, "Failed to create store via mutation"); }
    });
};

// Hook pour mettre à jour un store (appelle s_server)
export const useUpdateStore = (): UseMutationResult<UpdateStoreResponse, ApiError, UpdateStoreParams> => {
    const api = useApi();
    return useMutation<UpdateStoreResponse, ApiError, UpdateStoreParams>({
        mutationFn: (params) => api.store.update(params),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['stores'] } as InvalidateQueryFilters); // Invalider la liste
            queryClient.invalidateQueries({ queryKey: ['storeDetails', variables.store_id] } as InvalidateQueryFilters); // Invalider le détail
            logger.info("Store updated via mutation", data.store);
            // Mettre à jour le store courant dans Zustand si c'est lui qui a été modifié
            const currentStore = useGlobalStore.getState().currentStore;
            if (currentStore?.id === variables.store_id) {
                useGlobalStore.getState().setCurrentStore(data.store);
            }
        },
        onError: (error) => { logger.error({ error }, "Failed to update store via mutation"); }
    });
};

// Hook pour supprimer un store (appelle s_server)
export const useDeleteStore = (): UseMutationResult<DeleteStoreResponse, ApiError, DeleteStoreParams> => {
    const api = useApi();
    return useMutation<DeleteStoreResponse, ApiError, DeleteStoreParams>({
        mutationFn: (params) => api.store.delete(params),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['stores'] } as InvalidateQueryFilters); // Invalider la liste
            queryClient.removeQueries({ queryKey: ['storeDetails', variables.store_id] }); // Supprimer le détail du cache
            logger.info("Store deleted via mutation", { storeId: variables.store_id });
            // Si le store supprimé était le store courant, le désélectionner
            const currentStore = useGlobalStore.getState().currentStore;
            if (currentStore?.id === variables.store_id) {
                useGlobalStore.getState().setCurrentStore(undefined);
                localStorage.removeItem('current_store');
            }
        },
        onError: (error) => { logger.error({ error }, "Failed to delete store via mutation"); }
    });
};

// Hook pour changer le thème d'un store (appelle s_server)
export const useChangeTheme = (): UseMutationResult<ChangeThemeResponse, ApiError, ChangeThemeParams> => {
    const api = useApi();
    return useMutation<ChangeThemeResponse, ApiError, ChangeThemeParams>({
        mutationFn: (params) => api.store.changeTheme(params),
        onSuccess: (data, variables) => {
            // Invalider les détails du store pour refléter le nouveau thème
            queryClient.invalidateQueries({ queryKey: ['storeDetails', variables.store_id] } as InvalidateQueryFilters);
            logger.info("Store theme changed via mutation", { storeId: variables.store_id, newThemeId: data.store.current_theme_id });
            // Mettre à jour le store courant dans Zustand si nécessaire
        },
        onError: (error) => { logger.error({ error }, "Failed to change store theme via mutation"); }
    });
};

// Hook pour mettre à jour le statut (actif/inactif) d'un store (appelle s_server)
export const useUpdateStoreStatus = (): UseMutationResult<UpdateStoreStatusResponse, ApiError, UpdateStoreStatusParams> => {
    const api = useApi();
    return useMutation<UpdateStoreStatusResponse, ApiError, UpdateStoreStatusParams>({
        mutationFn: (params) => api.store.updateStatus(params),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['stores'] } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: ['storeDetails', variables.store_id] } as InvalidateQueryFilters);
            logger.info("Store status updated via mutation", { storeId: variables.store_id, isActive: data.store.is_active });
            // Mettre à jour le store courant dans Zustand si nécessaire
        },
        onError: (error) => { logger.error({ error }, "Failed to update store status via mutation"); }
    });
};

// Hooks pour Start/Stop/Restart (appellent s_server, retournent juste un message)
export const useStartStore = (): UseMutationResult<StoreActionResponse, ApiError, StoreActionParams> => {
    const api = useApi();
    return useMutation<StoreActionResponse, ApiError, StoreActionParams>({
        mutationFn: (params) => (async () => {
            const res = await api.store.start(params)
            await waitHere(3000)
            return res
        })(),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['stores'] } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: ['storeDetails', variables.store_id] } as InvalidateQueryFilters);
            logger.info("Store start requested via mutation", { storeId: variables.store_id, store: data.store });
        },
        onError: (error) => { logger.error({ error }, "Failed to request store start via mutation"); }
    });
};
export const useStopStore = (): UseMutationResult<StoreActionResponse, ApiError, StoreActionParams> => {
    const api = useApi();
    return useMutation<StoreActionResponse, ApiError, StoreActionParams>({
        mutationFn: (params) => (async () => {
            await waitHere(3000)
            return await api.store.stop(params)
        })(),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['stores'] } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: ['storeDetails', variables.store_id] } as InvalidateQueryFilters);
            logger.info("Store start requested via mutation", { storeId: variables.store_id, store: data.store });
        },
        onError: (error) => { logger.error({ error }, "Failed to request store start via mutation"); }
    });
};
export const useRestartStore = (): UseMutationResult<StoreActionResponse, ApiError, StoreActionParams> => {
    const api = useApi();
    return useMutation<StoreActionResponse, ApiError, StoreActionParams>({
        mutationFn: (params) => api.store.restart(params),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['stores'] } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: ['storeDetails', variables.store_id] } as InvalidateQueryFilters);
            logger.info("Store start requested via mutation", { storeId: variables.store_id, store: data.store });
        },
        onError: (error) => { logger.error({ error }, "Failed to request store start via mutation"); }
    });
};

// Hook pour gérer les domaines (exemple ajout)
export const useAddStoreDomain = (): UseMutationResult<ManageDomainResponse, ApiError, ManageDomainParams> => {
    const api = useApi();
    return useMutation<ManageDomainResponse, ApiError, ManageDomainParams>({
        mutationFn: (params) => api.store.addDomain(params),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['storeDetails', variables.store_id] } as InvalidateQueryFilters);
            logger.info("Store domain added via mutation", { storeId: variables.store_id, domain: variables.domainName });
        },
        onError: (error) => { logger.error({ error }, "Failed to add store domain via mutation"); }
    });
};
// Ajouter useRemoveStoreDomain si nécessaire

// Hook pour vérifier la disponibilité d'un nom (appelle s_server)
export const useCheckStoreNameAvailability = (name: string | undefined, options: { enabled?: boolean } = {}): UseQueryResult<AvailableNameResponse, ApiError> => {
    const api = useApi();
    return useQuery<AvailableNameResponse, ApiError>({
        queryKey: ['storeNameAvailable', name],
        queryFn: () => name ? api.store.checkAvailableName({ name }) : Promise.resolve({ is_available_name: false }), // Ne fetch que si nom fourni
        enabled: !!name && (options.enabled !== undefined ? options.enabled : true),
        staleTime: 1 * 60 * 1000, // Cache court
        refetchOnWindowFocus: false,
    });
};

// Clés de Query communes pour Auth
const AUTH_QUERY_KEYS = {
    me: ['me'] as const,
};



// ========================
// == Authentification SERVER ==
// ========================


// Hook pour finaliser la création de compte collaborateur

// ========================
// == Authentification API ==
// ========================

const getAuthBackend = (api: SublymusApi, target?: 'api' | 'server') => {
    return api[target == 'api' ? 'authApi' : 'authServer']
}


// Hook pour demander la réinitialisation du mot de passe
export const useRequestPasswordReset = (options?: { backend_target?: 'api' | 'server' }): UseMutationResult<MessageResponse, ApiError, ForgotPasswordParams> => {
    const api = useApi();
    return useMutation<MessageResponse, ApiError, ForgotPasswordParams>({
        mutationFn: (params) => getAuthBackend(api, options?.backend_target).forgotPassword(params), // Assumer que la méthode existe dans api.authApi
        // Pas de onSuccess/onError générique ici, géré dans le composant
    });
};

export const useResetPassword = (options?: { backend_target?: 'api' | 'server' }): UseMutationResult<MessageResponse, ApiError, ResetPasswordParams> => {
    const api = useApi();
    return useMutation<MessageResponse, ApiError, ResetPasswordParams>({
        mutationFn: (params) => getAuthBackend(api, options?.backend_target).resetPassword(params), // Assumer que la méthode existe dans api.authApi
        // Pas de onSuccess/onError générique ici, géré dans le composant
    });
};


export const useLogin = (options?: { backend_target?: 'api' | 'server' }): UseMutationResult<LoginResponse, ApiError, LoginParams> => {
    const api = useApi();
    return useMutation<LoginResponse, ApiError, LoginParams>({
        mutationFn: (credentials) => getAuthBackend(api, options?.backend_target).login(credentials),
        onSuccess: (data) => {
            queryClient.setQueryData(AUTH_QUERY_KEYS.me, { user: data.user });
            logger.info("Login successful via mutation", { userId: data.user.id });
            useAuthStore.setState({ user: data.user });
        },
        onError: (error) => { logger.error({ error }, "Login failed via mutation"); }
    });
};

export const useRegister = (options?: { backend_target?: 'api' | 'server' }): UseMutationResult<RegisterResponse, ApiError, RegisterParams> => {
    const api = useApi();
    return useMutation<RegisterResponse, ApiError, RegisterParams>({
        mutationFn: (data) => getAuthBackend(api, options?.backend_target).register(data),
        onSuccess: (data) => { logger.info("Registration successful via mutation", { userId: data.user_id }); },
        onError: (error) => { logger.error({ error }, "Registration failed via mutation"); }
    });
};

export const useVerifyEmail = (options?: { backend_target?: 'api' | 'server' }): UseMutationResult<MessageResponse, ApiError, VerifyEmailParams> => {
    const api = useApi();
    return useMutation<MessageResponse, ApiError, VerifyEmailParams>({
        mutationFn: (params) => getAuthBackend(api, options?.backend_target).verifyEmail(params),
        onSuccess: (data) => {
            logger.info("Email verified via mutation", data);
            queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.me });
        },
        onError: (error) => { logger.error({ error }, "Email verification failed via mutation"); }
    });
};

export const useResendVerificationEmail = (options?: { backend_target?: 'api' | 'server' }): UseMutationResult<MessageResponse, ApiError, ResendVerificationParams> => {
    const api = useApi();
    return useMutation<MessageResponse, ApiError, ResendVerificationParams>({
        mutationFn: (params) => getAuthBackend(api, options?.backend_target).resendVerificationEmail(params),
        onSuccess: (data) => { logger.info("Resend verification email requested via mutation", data); },
        onError: (error) => { logger.error({ error }, "Resend verification email failed via mutation"); }
    });
};

export const useLogout = (options?: { backend_target?: 'api' | 'server' }): UseMutationResult<MessageResponse, ApiError, void> => {
    const api = useApi();
    return useMutation<MessageResponse, ApiError, void>({
        mutationFn: () => getAuthBackend(api, options?.backend_target).logout(),
        onSuccess: (data) => {
            queryClient.removeQueries({ queryKey: AUTH_QUERY_KEYS.me });
            queryClient.clear(); // Vider tout le cache
            logger.info("Logout successful via mutation", data);
            useAuthStore.setState({ user: undefined });
        },
        onError: (error) => {
            // Même en cas d'erreur (ex: token déjà invalide), on nettoie côté client
            queryClient.removeQueries({ queryKey: AUTH_QUERY_KEYS.me });
            queryClient.clear();
            useAuthStore.setState({ user: undefined });
            logger.error({ error }, "Logout failed via mutation, client state cleared anyway.");
        }
    });
};

export const useLogoutAllDevices = (options?: { backend_target?: 'api' | 'server' }): UseMutationResult<MessageResponse, ApiError, void> => {
    const api = useApi();
    const logoutMutation = useLogout(options); // Utiliser pour le nettoyage client
    return useMutation<MessageResponse, ApiError, void>({
        mutationFn: () => getAuthBackend(api, options?.backend_target).logoutAllDevices(),
        onSuccess: (data) => {
            logger.info("Logout All Devices successful via mutation", data);
            logoutMutation.mutate(); // Déclencher nettoyage client
        },
        onError: (error) => {
            // Nettoyer côté client même si l'API échoue? Probablement oui.
            logoutMutation.mutate();
            logger.error({ error }, "Logout All Devices failed via mutation, client state cleared anyway.");
        }
    });
};

export const useGetMe = (options: { enabled?: boolean, backend_target?: 'api' | 'server' } = {}): UseQueryResult<GetMeResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetMeResponse, ApiError>({
        queryKey: AUTH_QUERY_KEYS.me,
        queryFn: () => getAuthBackend(api, options?.backend_target).getMe(),
        enabled: options.enabled !== undefined ? options.enabled : true,
        staleTime: 15 * 60 * 1000,
    });
};

export const useUpdateUser = (options?: { backend_target?: 'api' | 'server' }): UseMutationResult<UpdateUserResponse, ApiError, UpdateUserParams> => {
    const api = useApi();
    return useMutation<UpdateUserResponse, ApiError, UpdateUserParams>({
        mutationFn: (params) => waitFor(getAuthBackend(api, options?.backend_target).update(params), 1000),
        onSuccess: (data) => {
            queryClient.setQueryData<GetMeResponse>(AUTH_QUERY_KEYS.me, (oldData) =>
                oldData ? { user: { ...oldData.user, ...data.user } } : undefined
            );
            logger.info("User profile updated via mutation", data.user);
            // Mettre à jour aussi le store Zustand si utilisé
            useAuthStore.setState(state => ({ user: state.user ? { ...state.user, ...data.user } : undefined }));
        },
        onError: (error) => { logger.error({ error }, "User profile update failed via mutation"); }
    });
};

export const useDeleteAccount = (options?: { backend_target?: 'api' | 'server' }): UseMutationResult<MessageResponse, ApiError, void> => {
    const api = useApi();
    const logoutMutation = useLogout(options);
    return useMutation<MessageResponse, ApiError, void>({
        mutationFn: () => getAuthBackend(api, options?.backend_target).deleteAccount(),
        onSuccess: (data) => {
            logger.info("Account deleted via mutation", data);
            logoutMutation.mutate(); // Nettoyer après suppression
        },
        onError: (error) => { logger.error({ error }, "Account deletion failed via mutation"); }
    });
};

// Hook pour finaliser la création de compte collaborateur
export const useSetupAccount = (options?: { backend_target?: 'api' | 'server' }): UseMutationResult<SetupAccountResponse, ApiError, SetupAccountParams> => {
    const api = useApi();
    return useMutation<SetupAccountResponse, ApiError, SetupAccountParams>({
        mutationFn: (params) => getAuthBackend(api, options?.backend_target).setupAccount(params),
        // Pas de onSuccess/onError générique, géré dans la page SetupAccountPage
    });
};


// --- Fin Auth Hooks ---

// src/api/ReactSublymusApi.tsx
// ... (Imports, Setup, Auth Hooks inchangés) ...

// --- Hooks Personnalisés par Namespace ---

// ========================
// == Produits ==
// ========================

// Clés de Query communes pour Products
const PRODUCTS_QUERY_KEYS = {
    all: ['products'] as const,
    lists: (filters: GetProductListParams = {}) => [...PRODUCTS_QUERY_KEYS.all, 'list', filters] as const,
    details: (params: GetProductParams = {}) => [...PRODUCTS_QUERY_KEYS.all, 'detail', params] as const,
};

// Hook pour récupérer la LISTE des produits
export const useGetProductList = (
    filter: GetProductListParams = {},
    options: { enabled?: boolean, keepPreviousData?: boolean } = {}
): UseQueryResult<GetProductListResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetProductListResponse, ApiError>({
        queryKey: PRODUCTS_QUERY_KEYS.lists(filter),
        queryFn: () => api.products.getList(filter),
        enabled: options.enabled !== undefined ? options.enabled : true,
        // keepPreviousData: options.keepPreviousData ?? true, // Garder les données précédentes pendant le chargement de nouvelles
    });
};

// Hook pour récupérer UN produit par ID ou Slug
export const useGetProduct = (
    params: GetProductParams, // Doit contenir soit product_id soit slug
    options: { enabled?: boolean } = {}
): UseQueryResult<GetProductResponse, ApiError> => {
    const api = useApi();
    const enabled = !!(params.product_id || params.slug) && (options.enabled !== undefined ? options.enabled : true);
    return useQuery<GetProductResponse, ApiError>({
        queryKey: PRODUCTS_QUERY_KEYS.details(params),
        queryFn: () => api.products.getOne(params), // Utiliser getOne
        enabled: enabled,
        staleTime: 10 * 60 * 1000, // Cache plus long pour un détail
    });
};

// Hook pour créer un produit
export const useCreateProduct = (): UseMutationResult<CreateProductResponse, ApiError, CreateProductParams> => {
    const api = useApi();
    return useMutation<CreateProductResponse, ApiError, CreateProductParams>({
        mutationFn: (params) => api.products.create(params),
        onSuccess: (data) => {
            logger.info("Product created via mutation", data.product);
            // Invalider toutes les listes de produits après création
            queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.lists() } as InvalidateQueryFilters);
            // Pré-remplir le cache pour le nouveau produit?
            queryClient.setQueryData(PRODUCTS_QUERY_KEYS.details({ product_id: data.product.id }), data.product);
        },
        onError: (error) => { logger.error({ error }, "Failed to create product via mutation"); }
    });
};

// Hook pour mettre à jour un produit (infos de base)
export const useUpdateProduct = (): UseMutationResult<UpdateProductResponse, ApiError, UpdateProductParams> => {
    const api = useApi();
    return useMutation<UpdateProductResponse, ApiError, UpdateProductParams>({
        mutationFn: (params) => api.products.update(params),
        onSuccess: (data, variables) => {
            logger.info("Product updated via mutation", data.product);
            const productId = variables.product_id;
            // Invalider les listes
            queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.lists() } as InvalidateQueryFilters);
            // Mettre à jour le cache détail
            queryClient.setQueryData<GetProductResponse>(
                PRODUCTS_QUERY_KEYS.details({ product_id: productId }),
                (oldData) => oldData ? { ...oldData, ...(data.product ?? {}) } : undefined // Merger les nouvelles données
            );
            // Invalider aussi par slug si on l'utilise
            // queryClient.invalidateQueries({ queryKey: ['product', { slug: data.product?.slug }] });
        },
        onError: (error) => { logger.error({ error }, "Failed to update product via mutation"); }
    });
};

// Hook pour supprimer un produit
export const useDeleteProduct = (): UseMutationResult<DeleteProductResponse, ApiError, { product_id: string }> => { // string = productId
    const api = useApi();
    return useMutation<DeleteProductResponse, ApiError, { product_id: string }>({
        mutationFn: (data) => api.products.delete(data.product_id),
        onSuccess: (data, params) => {
            logger.info("Product deleted via mutation", { productId: params.product_id });
            // Invalider les listes
            queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.lists() } as InvalidateQueryFilters);
            // Supprimer le détail du cache
            queryClient.removeQueries({ queryKey: PRODUCTS_QUERY_KEYS.details({ product_id: params.product_id }) });
        },
        onError: (error) => { logger.error({ error }, "Failed to delete product via mutation"); }
    });
};

// Hook pour multipleUpdateFeaturesValues
export const useMultipleUpdateFeaturesValues = (): UseMutationResult<MultipleUpdateFeaturesValuesResponse, ApiError, MultipleUpdateFeaturesValuesParams> => {
    const api = useApi();
    return useMutation<MultipleUpdateFeaturesValuesResponse, ApiError, MultipleUpdateFeaturesValuesParams>({
        mutationFn: (params) => api.products.multipleUpdateFeaturesValues(params),
        onSuccess: (data, variables) => {
            logger.info("Multiple features/values updated via mutation", { productId: variables.product_id });
            const productId = variables.product_id;
            // Invalider les listes ET le détail complet du produit
            queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.lists() } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.details({ product_id: productId }) } as InvalidateQueryFilters);
            // Invalider aussi les features/values si requêtes dédiées existent
            queryClient.invalidateQueries({ queryKey: ['features', { product_id: productId }] } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: ['featuresWithValues', { product_id: productId }] } as InvalidateQueryFilters);

            // Mettre à jour le cache détail avec le produit retourné?
            if (data.product) {
                queryClient.setQueryData(PRODUCTS_QUERY_KEYS.details({ product_id: productId }), data.product);
            }
        },
        onError: (error) => { logger.error({ error }, "Failed multiple features/values update via mutation"); }
    });
};


// ========================
// == Catégories ==
// ========================

// Clés de Query communes pour Categories
const CATEGORIES_QUERY_KEYS = {
    all: ['categories'] as const,
    lists: (filters: GetCategoriesParams = {}) => [...CATEGORIES_QUERY_KEYS.all, 'list', filters] as const,
    details: (params: { category_id?: string; slug?: string } = {}) => [...CATEGORIES_QUERY_KEYS.all, 'detail', params] as const,
    subCategories: (parentId: string) => [...CATEGORIES_QUERY_KEYS.all, 'sub', parentId] as const,
    filters: (slug?: string) => [...CATEGORIES_QUERY_KEYS.all, 'filters', slug ?? 'global'] as const,
};

// Hook pour récupérer la LISTE des catégories
export const useGetCategories = (
    filter: GetCategoriesParams = {},
    options: { enabled?: boolean, keepPreviousData?: boolean } = {}
): UseQueryResult<GetCategoriesResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetCategoriesResponse, ApiError>({
        queryKey: CATEGORIES_QUERY_KEYS.lists(filter),
        queryFn: () => api.categories.getList(filter),
        enabled: options.enabled !== undefined ? options.enabled : true,
        // keepPreviousData: options.keepPreviousData ?? true,
    });
};

// Hook pour récupérer UNE catégorie par ID ou Slug
export const useGetCategory = (
    params: GetCategoryParams, // ID ou Slug requis
    options: { enabled?: boolean } = {}
): UseQueryResult<GetCategoryResponse, ApiError> => {
    const api = useApi();
    const enabled = !!(params.category_id || params.slug) && (options.enabled !== undefined ? options.enabled : true);
    return useQuery<GetCategoryResponse, ApiError>({
        queryKey: CATEGORIES_QUERY_KEYS.details(params),
        queryFn: () => api.categories.getOne(params),
        enabled: enabled,
        staleTime: 10 * 60 * 1000,
    });
};

// Hook pour créer une catégorie
export const useCreateCategory = (): UseMutationResult<CreateCategoryResponse, ApiError, CreateCategoryParams> => {
    const api = useApi();
    return useMutation<CreateCategoryResponse, ApiError, CreateCategoryParams>({
        mutationFn: (params) => api.categories.create(params),
        onSuccess: (data) => {
            logger.info("Category created via mutation", data.category);
            queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEYS.lists() } as InvalidateQueryFilters);
            queryClient.setQueryData(CATEGORIES_QUERY_KEYS.details({ category_id: data.category.id }), data.category);
        },
        onError: (error) => { logger.error({ error }, "Failed to create category via mutation"); }
    });
};

// Hook pour mettre à jour une catégorie
export const useUpdateCategory = (): UseMutationResult<UpdateCategoryResponse, ApiError, UpdateCategoryParams> => {
    const api = useApi();
    return useMutation<UpdateCategoryResponse, ApiError, UpdateCategoryParams>({
        mutationFn: (params) => api.categories.update(params),
        onSuccess: (data, variables) => {
            logger.info("Category updated via mutation", data.category);
            const categoryId = variables.category_id;
            queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEYS.lists() } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEYS.details({ slug: data.category.slug }) } as InvalidateQueryFilters);
            // Invalider les détails par slug et ancien slug si disponible
            queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEYS.details({ slug: data.category.slug }) } as InvalidateQueryFilters);
            if (variables.data.slug && variables.data.slug !== data.category.slug) {
                queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEYS.details({ slug: variables.data.slug }) } as InvalidateQueryFilters);
            }
            queryClient.setQueryData<GetCategoryResponse>(CATEGORIES_QUERY_KEYS.details({ category_id: categoryId }), data.category);
            // Invalider aussi par slug si le slug a pu changer
        },
        onError: (error) => { logger.error({ error }, "Failed to update category via mutation"); }
    });
};

// Hook pour supprimer une catégorie
export const useDeleteCategory = (): UseMutationResult<DeleteCategoryResponse, ApiError, DeleteCategoryParams> => {
    const api = useApi();
    return useMutation<DeleteCategoryResponse, ApiError, DeleteCategoryParams>({
        mutationFn: (params) => api.categories.delete(params),
        onSuccess: (data, variables) => {
            logger.info("Category deleted via mutation", { categoryId: variables.category_id });
            queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEYS.lists() } as InvalidateQueryFilters);
            queryClient.removeQueries({ queryKey: CATEGORIES_QUERY_KEYS.details({ category_id: variables.category_id }) });
            // TODO: Invalider les produits qui contenaient cette catégorie? Complexe.
            queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.lists() }); // Invalidation large
        },
        onError: (error) => { logger.error({ error }, "Failed to delete category via mutation"); }
    });
};

// Hook pour récupérer les sous-catégories
export const useGetSubCategories = (
    params: GetSubCategoriesParams,
    options: { enabled?: boolean } = {}
): UseQueryResult<GetSubCategoriesResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetSubCategoriesResponse, ApiError>({
        queryKey: CATEGORIES_QUERY_KEYS.subCategories(params.category_id),
        queryFn: () => api.categories.getSubCategories(params),
        enabled: !!params.category_id && (options.enabled !== undefined ? options.enabled : true),
    });
};

// Hook pour récupérer les filtres
export const useGetCategoryFilters = (
    params: GetCategoryFiltersParams = {},
    options: { enabled?: boolean } = {}
): UseQueryResult<GetCategoryFiltersResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetCategoryFiltersResponse, ApiError>({
        queryKey: CATEGORIES_QUERY_KEYS.filters(params.slug),
        queryFn: () => api.categories.getFilters(params),
        enabled: options.enabled !== undefined ? options.enabled : true,
    });
};

// ======================================
// == Features & Values ==
// ======================================

// Clés de Query communes
const FEATURES_QUERY_KEYS = {
    all: ['features'] as const,
    lists: (filters: GetFeaturesParams = {}) => [...FEATURES_QUERY_KEYS.all, 'list', filters] as const,
    details: (params: GetFeatureParams = {}) => [...FEATURES_QUERY_KEYS.all, 'detail', params] as const,
    withValues: (filters: GetFeaturesWithValuesParams = {}) => [...FEATURES_QUERY_KEYS.all, 'withValues', filters] as const,
};
const VALUES_QUERY_KEYS = {
    all: ['values'] as const,
    lists: (filters: GetValuesParams = {}) => [...VALUES_QUERY_KEYS.all, 'list', filters] as const,
    details: (params: { value_id: string }) => [...VALUES_QUERY_KEYS.all, 'detail', params] as const,
};


// Hook pour récupérer les features (sans valeurs)
export const useGetFeatures = (
    filter: Omit<GetFeaturesParams, 'feature_id'> = {}, // Exclure feature_id pour liste
    options: { enabled?: boolean } = {}
): UseQueryResult<GetFeaturesResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetFeaturesResponse, ApiError>({
        queryKey: FEATURES_QUERY_KEYS.lists(filter),
        queryFn: () => api.features.getList(filter),
        enabled: options.enabled !== undefined ? options.enabled : true,
    });
};
// Hook pour récupérer UNE feature (sans valeurs)
export const useGetFeature = (
    params: { feature_id: string },
    options: { enabled?: boolean } = {}
): UseQueryResult<GetFeatureResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetFeatureResponse, ApiError>({
        queryKey: FEATURES_QUERY_KEYS.details(params),
        queryFn: () => api.features.getOne(params),
        enabled: !!params.feature_id && (options.enabled !== undefined ? options.enabled : true),
    });
};

// Hook pour récupérer les features AVEC valeurs
export const useGetFeaturesWithValues = (
    filter: GetFeaturesWithValuesParams = {},
    options: { enabled?: boolean } = {}
): UseQueryResult<GetFeaturesWithValuesResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetFeaturesWithValuesResponse, ApiError>({
        queryKey: FEATURES_QUERY_KEYS.withValues(filter),
        queryFn: () => api.features.getListWithValues(filter),
        enabled: options.enabled !== undefined ? options.enabled : true,
    });
};
// Hook pour récupérer UNE feature AVEC valeurs
export const useGetFeatureWithValues = (
    params: { feature_id: string },
    options: { enabled?: boolean } = {}
): UseQueryResult<FeatureInterface | null, ApiError> => {
    const api = useApi();
    return useQuery<FeatureInterface | null, ApiError>({
        queryKey: FEATURES_QUERY_KEYS.withValues(params), // Utiliser la même clé que la liste pour MAJ cache
        queryFn: async () => {
            const result = await api.features.getListWithValues({ ...params, limit: 1 } as any);
            return result?.[0] ?? null;
        },
        enabled: !!params.feature_id && (options.enabled !== undefined ? options.enabled : true),
    });
};


// Hook pour créer une valeur (Value)
export const useCreateValue = (): UseMutationResult<CreateValueResponse, ApiError, CreateValueParams> => {
    const api = useApi();
    return useMutation<CreateValueResponse, ApiError, CreateValueParams>({
        mutationFn: (params) => api.values.create(params), // L'API gère le FormData
        onSuccess: (data, variables) => {
            logger.info("Value created via mutation", data.value);
            // Invalider la liste des valeurs pour cette feature ET les features avec valeurs du produit
            queryClient.invalidateQueries({ queryKey: VALUES_QUERY_KEYS.lists({ feature_id: variables.data.feature_id }) } as InvalidateQueryFilters);
            // Idéalement on connait le product_id ici pour invalider plus précisément
            // queryClient.invalidateQueries({ queryKey: FEATURES_QUERY_KEYS.withValues({ product_id: productId }) });
            // Invalidation large pour l'instant:
            queryClient.invalidateQueries({ queryKey: FEATURES_QUERY_KEYS.withValues() } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.details() } as InvalidateQueryFilters); // Invalider produit détail aussi
        },
        onError: (error) => { logger.error({ error }, "Failed to create value via mutation"); }
    });
};

// Hook pour mettre à jour une valeur (Value)
export const useUpdateValue = (): UseMutationResult<UpdateValueResponse, ApiError, UpdateValueParams> => {
    const api = useApi();
    return useMutation<UpdateValueResponse, ApiError, UpdateValueParams>({
        mutationFn: (params) => api.values.update(params), // L'API gère le FormData
        onSuccess: (data, variables) => {
            logger.info("Value updated via mutation", data.value);
            const valueId = variables.value_id;
            const featureId = data.value.feature_id; // Feature ID depuis la réponse
            // Invalider la liste des valeurs pour cette feature, le détail de cette valeur et les features avec valeurs
            queryClient.invalidateQueries({ queryKey: VALUES_QUERY_KEYS.lists({ feature_id: featureId }) } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: VALUES_QUERY_KEYS.details({ value_id: valueId }) } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: FEATURES_QUERY_KEYS.withValues() } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.details() } as InvalidateQueryFilters);
        },
        onError: (error) => { logger.error({ error }, "Failed to update value via mutation"); }
    });
};

// Hook pour supprimer une valeur (Value)
export const useDeleteValue = (): UseMutationResult<DeleteValueResponse, ApiError, DeleteValueParams> => {
    const api = useApi();
    // Garder trace de la feature parente pour invalidation
    let parentFeatureId: string | undefined;
    return useMutation<DeleteValueResponse, ApiError, DeleteValueParams>({
        onMutate: async (variables) => {
            // Essayer de récupérer la valeur du cache pour obtenir featureId
            const cachedValue = queryClient.getQueryData<GetValueResponse>(VALUES_QUERY_KEYS.details({ value_id: variables.value_id }));
            parentFeatureId = cachedValue?.feature_id;
        },
        mutationFn: (params) => api.values.delete(params),
        onSuccess: (data, variables) => {
            logger.info("Value deleted via mutation", { valueId: variables.value_id });
            const valueId = variables.value_id;
            // Invalider les listes et supprimer le détail du cache
            if (parentFeatureId) {
                queryClient.invalidateQueries({ queryKey: VALUES_QUERY_KEYS.lists({ feature_id: parentFeatureId }) } as InvalidateQueryFilters);
            } else {
                queryClient.invalidateQueries({ queryKey: VALUES_QUERY_KEYS.lists() } as InvalidateQueryFilters); // Fallback large
            }
            queryClient.removeQueries({ queryKey: VALUES_QUERY_KEYS.details({ value_id: valueId }) });
            queryClient.invalidateQueries({ queryKey: FEATURES_QUERY_KEYS.withValues() } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.details() } as InvalidateQueryFilters);
            parentFeatureId = undefined; // Reset
        },
        onError: (error) => { logger.error({ error }, "Failed to delete value via mutation"); parentFeatureId = undefined; }
    });
};


// ================================
// == Détails Produit ==
// ================================

// Clés de Query communes
const DETAILS_QUERY_KEYS = {
    all: ['details'] as const,
    lists: (filters: GetDetailListParams = {}) => [...DETAILS_QUERY_KEYS.all, 'list', filters] as const,
    details: (params: GetDetailParams) => [...DETAILS_QUERY_KEYS.all, 'detail', params] as const,
};

// Hook pour récupérer la LISTE des détails d'un produit
export const useGetDetailList = (
    filter: GetDetailListParams, // product_id est généralement requis ici
    options: { enabled?: boolean } = {}
): UseQueryResult<GetDetailListResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetDetailListResponse, ApiError>({
        queryKey: DETAILS_QUERY_KEYS.lists(filter),
        queryFn: () => api.details.getList(filter),
        enabled: !!filter.product_id && (options.enabled !== undefined ? options.enabled : true), // Activer si product_id
    });
};

// Hook pour récupérer UN détail par ID
export const useGetDetail = (
    params: GetDetailParams, // detail_id requis
    options: { enabled?: boolean } = {}
): UseQueryResult<GetDetailResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetDetailResponse, ApiError>({
        queryKey: DETAILS_QUERY_KEYS.details(params),
        queryFn: () => api.details.getOne(params),
        enabled: !!params.detail_id && (options.enabled !== undefined ? options.enabled : true),
    });
};


// Hook pour créer un détail
export const useCreateDetail = (): UseMutationResult<CreateDetailResponse, ApiError, CreateDetailParams> => {
    const api = useApi();
    return useMutation<CreateDetailResponse, ApiError, CreateDetailParams>({
        mutationFn: (params) => api.details.create(params), // L'API gère FormData
        onSuccess: (data, variables) => {
            logger.info("Detail created via mutation", data.detail);
            // Invalider la liste des détails pour ce produit
            queryClient.invalidateQueries({ queryKey: DETAILS_QUERY_KEYS.lists({ product_id: variables.data.product_id }) } as InvalidateQueryFilters);
        },
        onError: (error) => { logger.error({ error }, "Failed to create detail via mutation"); }
    });
};

// Hook pour mettre à jour un détail
export const useUpdateDetail = (): UseMutationResult<UpdateDetailResponse, ApiError, UpdateDetailParams> => {
    const api = useApi();
    return useMutation<UpdateDetailResponse, ApiError, UpdateDetailParams>({
        mutationFn: (params) => api.details.update(params), // L'API gère FormData
        onSuccess: (data, variables) => {
            logger.info("Detail updated via mutation", data.detail);
            const detailId = variables.detail_id;
            const productId = data.detail.product_id; // Récupérer productId depuis réponse
            // Invalider la liste ET le détail
            queryClient.invalidateQueries({ queryKey: DETAILS_QUERY_KEYS.lists({ product_id: productId }) } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: DETAILS_QUERY_KEYS.details({ detail_id: detailId }) } as InvalidateQueryFilters);
        },
        onError: (error) => { logger.error({ error }, "Failed to update detail via mutation"); }
    });
};

// Hook pour supprimer un détail
export const useDeleteDetail = (): UseMutationResult<DeleteDetailResponse, ApiError, DeleteDetailParams> => {
    const api = useApi();
    // Garder trace du produit parent pour invalidation
    let parentProductId: string | undefined;
    return useMutation<DeleteDetailResponse, ApiError, DeleteDetailParams>({
        onMutate: async (variables) => {
            const cachedDetail = queryClient.getQueryData<GetDetailResponse>(DETAILS_QUERY_KEYS.details({ detail_id: variables.detail_id }));
            parentProductId = cachedDetail?.product_id;
        },
        mutationFn: (params) => api.details.delete(params),
        onSuccess: (data, variables) => {
            logger.info("Detail deleted via mutation", { detailId: variables.detail_id });
            const detailId = variables.detail_id;
            // Invalider la liste et supprimer le détail du cache
            if (parentProductId) {
                queryClient.invalidateQueries({ queryKey: DETAILS_QUERY_KEYS.lists({ product_id: parentProductId }) } as InvalidateQueryFilters);
            } else {
                queryClient.invalidateQueries({ queryKey: DETAILS_QUERY_KEYS.lists() } as InvalidateQueryFilters); // Fallback large
            }
            queryClient.removeQueries({ queryKey: DETAILS_QUERY_KEYS.details({ detail_id: detailId }) });
            parentProductId = undefined;
        },
        onError: (error) => { logger.error({ error }, "Failed to delete detail via mutation"); parentProductId = undefined; }
    });
};


// ==================================
// == Hooks pour ProductFaqs       ==
// ==================================

// Clés de Query communes pour ProductFaqs
const PRODUCT_FAQS_QUERY_KEYS = {
    all: (productId: string) => ['productFaqs', productId] as const, // Toutes les FAQs pour un produit
    lists: (params: ListProductFaqsParams) => [...PRODUCT_FAQS_QUERY_KEYS.all(params.product_id), 'list', params] as const,
    details: (faqId: string) => ['productFaqDetails', faqId] as const, // Détail d'une FAQ spécifique
};

/**
 * Hook pour créer une FAQ pour un produit.
 */
export const useCreateProductFaq = (): UseMutationResult<CreateProductFaqResponse, ApiError, CreateProductFaqParams> => {
    const api = useApi();
    return useMutation<CreateProductFaqResponse, ApiError, CreateProductFaqParams>({
        mutationFn: (params) => api.productFaqs.create(params),
        onSuccess: (data, variables) => {
            logger.info("ProductFaq created via mutation", data.faq);
            // Invalider la liste des FAQs pour ce produit
            queryClient.invalidateQueries({ queryKey: PRODUCT_FAQS_QUERY_KEYS.lists({ product_id: variables.data.product_id }) } as InvalidateQueryFilters);
            // Potentiellement invalider le cache du produit si le produit contient une liste de ses FAQs
            queryClient.invalidateQueries({ queryKey: ['productDetails', variables.data.product_id] } as InvalidateQueryFilters); // Ou PRODUCTS_QUERY_KEYS.details
        },
        onError: (error) => { logger.error({ error }, "Failed to create ProductFaq via mutation"); }
    });
};

/**
 * Hook pour récupérer la liste des FAQs d'un produit.
 */
export const useListProductFaqs = (
    params: ListProductFaqsParams,
    options: { enabled?: boolean } = {}
): UseQueryResult<ListProductFaqsResponse, ApiError> => {
    const api = useApi();
    return useQuery<ListProductFaqsResponse, ApiError>({
        queryKey: PRODUCT_FAQS_QUERY_KEYS.lists(params),
        queryFn: () => api.productFaqs.listForProduct(params),
        enabled: !!params.product_id && (options.enabled !== undefined ? options.enabled : true),
    });
};

/**
 * Hook pour récupérer les détails d'une FAQ spécifique.
 */
export const useGetProductFaq = (
    params: GetProductFaqParams,
    options: { enabled?: boolean } = {}
): UseQueryResult<GetProductFaqResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetProductFaqResponse, ApiError>({
        queryKey: PRODUCT_FAQS_QUERY_KEYS.details(params.faqId),
        queryFn: () => api.productFaqs.getOne(params),
        enabled: !!params.faqId && (options.enabled !== undefined ? options.enabled : true),
        staleTime: 5 * 60 * 1000, // Cache un peu plus long pour les détails
    });
};

/**
 * Hook pour mettre à jour une FAQ.
 */
export const useUpdateProductFaq = (): UseMutationResult<UpdateProductFaqResponse, ApiError, UpdateProductFaqParams> => {
    const api = useApi();
    return useMutation<UpdateProductFaqResponse, ApiError, UpdateProductFaqParams>({
        mutationFn: (params) => api.productFaqs.update(params),
        onSuccess: (data, variables) => {
            logger.info("ProductFaq updated via mutation", data.faq);
            // Invalider la liste des FAQs pour ce produit et le détail de cette FAQ
            queryClient.invalidateQueries({ queryKey: PRODUCT_FAQS_QUERY_KEYS.lists({ product_id: data.faq.product_id }) } as InvalidateQueryFilters);
            queryClient.setQueryData<GetProductFaqResponse>(PRODUCT_FAQS_QUERY_KEYS.details(variables.faqId), data.faq);
             // Potentiellement invalider le cache du produit
            queryClient.invalidateQueries({ queryKey: ['productDetails', data.faq.product_id] } as InvalidateQueryFilters);
        },
        onError: (error) => { logger.error({ error }, "Failed to update ProductFaq via mutation"); }
    });
};
export const useReorderProductFaqs = (): UseMutationResult<ReorderProductFaqsResponse, ApiError, ReorderProductFaqsParams> => {
    const api = useApi();
    return useMutation<ReorderProductFaqsResponse, ApiError, ReorderProductFaqsParams>({
        mutationFn: (params) => api.productFaqs.reorder(params),
        onSuccess: (data, variables) => {
            logger.info("ProductFaqs reordered via mutation", { productId: variables.product_id, group: variables.group });
            // Invalider la liste des FAQs pour ce produit (et ce groupe si applicable)
            // pour s'assurer que le frontend récupère le nouvel ordre.
            const listParams: ListProductFaqsParams = { product_id: variables.product_id };
            if (variables.group) {
                listParams.group = variables.group;
            }
            queryClient.invalidateQueries({ queryKey: PRODUCT_FAQS_QUERY_KEYS.lists(listParams) } as InvalidateQueryFilters);
            
            // Optionnellement, mettre à jour directement le cache avec la liste retournée si la réponse la contient.
            // Cela peut éviter un re-fetch immédiat si la réponse de 'reorder' est la liste complète et ordonnée.
            // if (data.faqs && data.faqs.list) {
            //   queryClient.setQueryData(PRODUCT_FAQS_QUERY_KEYS.lists(listParams), data.faqs);
            // }

            // Invalider aussi le cache du produit si le produit est censé connaître l'ordre de ses FAQs
            queryClient.invalidateQueries({ queryKey: ['productDetails', variables.product_id] } as InvalidateQueryFilters);
        },
        onError: (error, variables) => {
            logger.error({ error, productId: variables.product_id, group: variables.group }, "Failed to reorder ProductFaqs via mutation");
        }
    });
};
/**
 * Hook pour supprimer une FAQ.
 */
export const useDeleteProductFaq = (): UseMutationResult<DeleteProductFaqResponse, ApiError, DeleteProductFaqParams> => {
    const api = useApi();
    // Pour récupérer le product_id afin d'invalider la bonne liste
    let productIdForInvalidation: string | undefined;
    return useMutation<DeleteProductFaqResponse, ApiError, DeleteProductFaqParams>({
        onMutate: async (variables) => {
            // Optionnel: annuler les requêtes en cours pour ce détail
            await queryClient.cancelQueries({ queryKey: PRODUCT_FAQS_QUERY_KEYS.details(variables.faqId) });
            // Snapshot de la valeur précédente
            const previousFaq = queryClient.getQueryData<ProductFaqInterface>(PRODUCT_FAQS_QUERY_KEYS.details(variables.faqId));
            productIdForInvalidation = previousFaq?.product_id;
            return { previousFaq };
        },
        mutationFn: (params) => api.productFaqs.delete(params),
        onSuccess: (data, variables) => {
            logger.info("ProductFaq deleted via mutation", { faqId: variables.faqId });
            if (productIdForInvalidation) {
                queryClient.invalidateQueries({ queryKey: PRODUCT_FAQS_QUERY_KEYS.lists({ product_id: productIdForInvalidation }) } as InvalidateQueryFilters);
            } else {
                 // Fallback: invalider toutes les listes de FAQ si product_id n'a pas pu être déterminé
                queryClient.invalidateQueries({ queryKey: ['productFaqs'] } as InvalidateQueryFilters);
            }
            queryClient.removeQueries({ queryKey: PRODUCT_FAQS_QUERY_KEYS.details(variables.faqId) });
             // Potentiellement invalider le cache du produit
             if (productIdForInvalidation) {
                queryClient.invalidateQueries({ queryKey: ['productDetails', productIdForInvalidation] } as InvalidateQueryFilters);
             }
        },
    });
};


// ==================================
// == Hooks pour ProductCharacteristics ==
// ==================================

// Clés de Query communes pour ProductCharacteristics
const PRODUCT_CHARACTERISTICS_QUERY_KEYS = {
    all: (productId: string) => ['productCharacteristics', productId] as const,
    lists: (params: ListProductCharacteristicsParams) => [...PRODUCT_CHARACTERISTICS_QUERY_KEYS.all(params.product_id), 'list', params] as const,
    details: (characteristicId: string) => ['productCharacteristicDetails', characteristicId] as const,
};

/**
 * Hook pour créer une caractéristique pour un produit.
 */
export const useCreateProductCharacteristic = (): UseMutationResult<CreateProductCharacteristicResponse, ApiError, CreateProductCharacteristicParams> => {
    const api = useApi();
    return useMutation<CreateProductCharacteristicResponse, ApiError, CreateProductCharacteristicParams>({
        mutationFn: (params) => api.productCharacteristics.create(params),
        onSuccess: (data, variables) => {
            logger.info("ProductCharacteristic created via mutation", data.characteristic);
            queryClient.invalidateQueries({ queryKey: PRODUCT_CHARACTERISTICS_QUERY_KEYS.lists({ product_id: variables.data.product_id }) } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: ['productDetails', variables.data.product_id] } as InvalidateQueryFilters);
        },
        onError: (error) => { logger.error({ error }, "Failed to create ProductCharacteristic via mutation"); }
    });
};

/**
 * Hook pour récupérer la liste des caractéristiques d'un produit.
 */
export const useListProductCharacteristics = (
    params: ListProductCharacteristicsParams,
    options: { enabled?: boolean } = {}
): UseQueryResult<ListProductCharacteristicsResponse, ApiError> => {
    const api = useApi();
    return useQuery<ListProductCharacteristicsResponse, ApiError>({
        queryKey: PRODUCT_CHARACTERISTICS_QUERY_KEYS.lists(params),
        queryFn: () => api.productCharacteristics.listForProduct(params),
        enabled: !!params.product_id && (options.enabled !== undefined ? options.enabled : true),
    });
};

/**
 * Hook pour récupérer les détails d'une caractéristique spécifique.
 */
export const useGetProductCharacteristic = (
    params: GetProductCharacteristicParams,
    options: { enabled?: boolean } = {}
): UseQueryResult<GetProductCharacteristicResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetProductCharacteristicResponse, ApiError>({
        queryKey: PRODUCT_CHARACTERISTICS_QUERY_KEYS.details(params.characteristicId),
        queryFn: () => api.productCharacteristics.getOne(params),
        enabled: !!params.characteristicId && (options.enabled !== undefined ? options.enabled : true),
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook pour mettre à jour une caractéristique.
 */
export const useUpdateProductCharacteristic = (): UseMutationResult<UpdateProductCharacteristicResponse, ApiError, UpdateProductCharacteristicParams> => {
    const api = useApi();
    return useMutation<UpdateProductCharacteristicResponse, ApiError, UpdateProductCharacteristicParams>({
        mutationFn: (params) => api.productCharacteristics.update(params),
        onSuccess: (data, variables) => {
            logger.info("ProductCharacteristic updated via mutation", data.characteristic);
            queryClient.invalidateQueries({ queryKey: PRODUCT_CHARACTERISTICS_QUERY_KEYS.lists({ product_id: data.characteristic.product_id }) } as InvalidateQueryFilters);
            queryClient.setQueryData<GetProductCharacteristicResponse>(PRODUCT_CHARACTERISTICS_QUERY_KEYS.details(variables.characteristicId), data.characteristic);
            queryClient.invalidateQueries({ queryKey: ['productDetails', data.characteristic.product_id] } as InvalidateQueryFilters);
        },
        onError: (error) => { logger.error({ error }, "Failed to update ProductCharacteristic via mutation"); }
    });
};

/**
 * Hook pour supprimer une caractéristique.
 */
export const useDeleteProductCharacteristic = (): UseMutationResult<DeleteProductCharacteristicResponse, ApiError, DeleteProductCharacteristicParams> => {
    const api = useApi();
    let productIdForInvalidation: string | undefined;
    return useMutation<DeleteProductCharacteristicResponse, ApiError, DeleteProductCharacteristicParams>({
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: PRODUCT_CHARACTERISTICS_QUERY_KEYS.details(variables.characteristicId) });
            const previousCharacteristic = queryClient.getQueryData<ProductCharacteristicInterface>(PRODUCT_CHARACTERISTICS_QUERY_KEYS.details(variables.characteristicId));
            productIdForInvalidation = previousCharacteristic?.product_id;
            return { previousCharacteristic };
        },
        mutationFn: (params) => api.productCharacteristics.delete(params),
        onSuccess: (data, variables) => {
            logger.info("ProductCharacteristic deleted via mutation", { characteristicId: variables.characteristicId });
            if (productIdForInvalidation) {
                queryClient.invalidateQueries({ queryKey: PRODUCT_CHARACTERISTICS_QUERY_KEYS.lists({ product_id: productIdForInvalidation }) } as InvalidateQueryFilters);
                queryClient.invalidateQueries({ queryKey: ['productDetails', productIdForInvalidation] } as InvalidateQueryFilters);
            } else {
                queryClient.invalidateQueries({ queryKey: ['productCharacteristics'] } as InvalidateQueryFilters); // Fallback
            }
            queryClient.removeQueries({ queryKey: PRODUCT_CHARACTERISTICS_QUERY_KEYS.details(variables.characteristicId) });
        }
    });
};

// --- Hooks Personnalisés par Namespace ---

// ========================
// == Commandes ==
// ========================

// Clés de Query communes pour Orders
const ORDERS_QUERY_KEYS = {
    all: ['orders'] as const,
    myLists: (filters: GetMyOrdersParams = {}) => [...ORDERS_QUERY_KEYS.all, 'myList', filters] as const,
    allLists: (filters: CommandFilterType = {}) => [...ORDERS_QUERY_KEYS.all, 'allList', filters] as const,
    details: (params: GetOrderParams) => [...ORDERS_QUERY_KEYS.all, 'detail', params] as const,
};

// Hook pour créer une commande
export const useCreateOrder = (): UseMutationResult<CreateOrderResponse, ApiError, CreateOrderParams> => {
    const api = useApi();
    return useMutation<CreateOrderResponse, ApiError, CreateOrderParams>({
        mutationFn: (params) => api.orders.create(params),
        onSuccess: (data) => {
            logger.info("Order created via mutation", data.order);
            // Invalider 'myOrders' et 'allOrders' listes, et le panier
            queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEYS.myLists() } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEYS.allLists() } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: ['cart'] } as InvalidateQueryFilters); // Clé du panier
        },
        onError: (error) => { logger.error({ error }, "Failed to create order via mutation"); }
    });
};

// Hook pour récupérer les commandes de l'utilisateur connecté
export const useGetMyOrders = (
    filter: GetMyOrdersParams = {},
    options: { enabled?: boolean, keepPreviousData?: boolean } = {}
): UseQueryResult<GetMyOrdersResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetMyOrdersResponse, ApiError>({
        queryKey: ORDERS_QUERY_KEYS.myLists(filter),
        queryFn: () => api.orders.getMyList(filter),
        enabled: options.enabled !== undefined ? options.enabled : true,
        // keepPreviousData: options.keepPreviousData ?? true,
    });
};

// Hook pour récupérer TOUTES les commandes (Admin/Collab)
export const useGetAllOrders = (
    filter: CommandFilterType = {},
    options: { enabled?: boolean, keepPreviousData?: boolean } = {}
): UseQueryResult<GetAllOrdersResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetAllOrdersResponse, ApiError>({
        queryKey: ORDERS_QUERY_KEYS.allLists(filter),
        queryFn: () => api.orders.getList(filter),
        enabled: options.enabled !== undefined ? options.enabled : true,
        // keepPreviousData: options.keepPreviousData ?? true,
    });
};

// Hook pour récupérer les détails d'UNE commande
export const useGetOrderDetails = (
    params: GetOrderParams, // order_id requis
    options: { enabled?: boolean } = {}
): UseQueryResult<GetOrderResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetOrderResponse, ApiError>({
        queryKey: ORDERS_QUERY_KEYS.details(params),
        queryFn: () => api.orders.getOne(params),
        enabled: !!params.order_id && (options.enabled !== undefined ? options.enabled : true),
        staleTime: 5 * 60 * 1000, // Cache un peu plus long pour les détails
    });
};


// Hook pour mettre à jour le statut d'une commande
export const useUpdateOrderStatus = (): UseMutationResult<UpdateOrderStatusResponse, ApiError, UpdateOrderStatusParams> => {
    const api = useApi();
    return useMutation<UpdateOrderStatusResponse, ApiError, UpdateOrderStatusParams>({
        mutationFn: (params) => waitFor(api.orders.updateStatus(params), 3000),
        onSuccess: (data, variables) => {
            logger.info("Order status updated via mutation", data.order);
            const orderId = variables.user_order_id;
            // Invalider les listes ET le détail
            queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEYS.myLists() } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEYS.allLists() } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEYS.details({ order_id: orderId }) } as InvalidateQueryFilters);
            // Mettre à jour directement le cache détail?
            queryClient.setQueryData<GetOrderResponse>(ORDERS_QUERY_KEYS.details({ order_id: orderId }), data.order);
        },
        onError: (error) => { logger.error({ error }, "Failed to update order status via mutation"); }
    });
};

// Hook pour supprimer une commande
export const useDeleteOrder = (): UseMutationResult<DeleteOrderResponse, ApiError, DeleteOrderParams> => {
    const api = useApi();
    return useMutation<DeleteOrderResponse, ApiError, DeleteOrderParams>({
        mutationFn: (params) => api.orders.delete(params),
        onSuccess: (data, variables) => {
            logger.info("Order deleted via mutation", { orderId: variables.order_id });
            const orderId = variables.order_id;
            // Invalider les listes ET supprimer le détail du cache
            queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEYS.myLists() } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEYS.allLists() } as InvalidateQueryFilters);
            queryClient.removeQueries({ queryKey: ORDERS_QUERY_KEYS.details({ order_id: orderId }) });
        },
        onError: (error) => { logger.error({ error }, "Failed to delete order via mutation"); }
    });
};

// ====================
// == Namespace Panier ==
// ====================

// Clé de Query pour le Panier
const CART_QUERY_KEY = ['cart'] as const;

// Hook pour voir le panier
export const useViewCart = (options: { enabled?: boolean } = {}): UseQueryResult<ViewCartResponse, ApiError> => {
    const api = useApi();
    return useQuery<ViewCartResponse, ApiError>({
        queryKey: CART_QUERY_KEY,
        queryFn: () => api.cart.view(),
        enabled: options.enabled !== undefined ? options.enabled : true,
        staleTime: 1 * 60 * 1000, // Cache court
    });
};

// Hook pour mettre à jour le panier
export const useUpdateCart = (): UseMutationResult<UpdateCartResponse, ApiError, UpdateCartParams> => {
    const api = useApi();
    return useMutation<UpdateCartResponse, ApiError, UpdateCartParams>({
        mutationFn: (params) => api.cart.update(params),
        onSuccess: (data) => {
            logger.info("Cart updated via mutation", { action: data.action });
            // Mettre à jour le cache avec les données retournées
            queryClient.setQueryData<ViewCartResponse>(CART_QUERY_KEY, { cart: data.cart, total: data.total });
        },
        onError: (error) => { logger.error({ error }, "Failed to update cart via mutation"); }
    });
};

// Hook pour fusionner les paniers au login
export const useMergeCart = (): UseMutationResult<MergeCartResponse, ApiError, void> => {
    const api = useApi();
    return useMutation<MergeCartResponse, ApiError, void>({
        mutationFn: () => api.cart.mergeOnLogin(),
        onSuccess: (data) => {
            logger.info("Carts merged via mutation");
            // Mettre à jour ou invalider le cache panier
            if (data.cart) {
                queryClient.setQueryData<ViewCartResponse>(CART_QUERY_KEY, { cart: data.cart, total: data.total });
            } else {
                queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
            }
        },
        onError: (error) => { logger.error({ error }, "Failed to merge carts via mutation"); }
    });
};

// ===========================
// == Namespace Commentaires ==
// ===========================

// Clés de Query communes
const COMMENTS_QUERY_KEYS = {
    all: ['comments'] as const,
    lists: (filters: GetCommentsParams = {}) => [...COMMENTS_QUERY_KEYS.all, 'list', filters] as const,
    details: (params: { comment_id: string }) => [...COMMENTS_QUERY_KEYS.all, 'detail', params] as const,
    forItem: (params: GetCommentForOrderItemParams) => [...COMMENTS_QUERY_KEYS.all, 'forItem', params] as const,
};

// Hook pour créer un commentaire
export const useCreateComment = (): UseMutationResult<CreateCommentResponse, ApiError, { data: CreateCommentParams, files?: FilesObjectType }> => {
    const api = useApi();
    return useMutation<CreateCommentResponse, ApiError, { data: CreateCommentParams, files?: FilesObjectType }>({
        mutationFn: (params) => api.comments.create(params),
        onSuccess: (data) => {
            logger.info("Comment created via mutation", data.comment);
            // Invalider la liste des commentaires pour le produit et la query forItem
            queryClient.invalidateQueries({ queryKey: COMMENTS_QUERY_KEYS.lists({ product_id: data.comment.product_id }) } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: COMMENTS_QUERY_KEYS.forItem({ order_item_id: data.comment.order_item_id }) } as InvalidateQueryFilters);
            // Invalider aussi les stats produit (rating/count)
            queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.details({ product_id: data.comment.product_id }) } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.lists() } as InvalidateQueryFilters); // Large
        },
        onError: (error) => { logger.error({ error }, "Failed to create comment via mutation"); }
    });
};

// Hook pour récupérer le commentaire d'un order_item
export const useGetCommentForOrderItem = (
    params: GetCommentForOrderItemParams,
    options: { enabled?: boolean } = {}
): UseQueryResult<GetCommentForOrderItemResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetCommentForOrderItemResponse, ApiError>({
        queryKey: COMMENTS_QUERY_KEYS.forItem(params),
        queryFn: () => api.comments.getForOrderItem(params),
        enabled: !!params.order_item_id && (options.enabled !== undefined ? options.enabled : true),
    });
};

// Hook pour récupérer la LISTE des commentaires
export const useGetComments = (
    filter: GetCommentsParams = {},
    options: { enabled?: boolean, keepPreviousData?: boolean } = {}
): UseQueryResult<GetCommentsResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetCommentsResponse, ApiError>({
        queryKey: COMMENTS_QUERY_KEYS.lists(filter),
        queryFn: () => api.comments.getList(filter),
        enabled: options.enabled !== undefined ? options.enabled : true,
        // keepPreviousData: options.keepPreviousData ?? true,
    });
};
// Hook pour récupérer UN commentaire par ID
export const useGetComment = (
    params: { comment_id: string, with_users?: boolean },
    options: { enabled?: boolean } = {}
): UseQueryResult<CommentInterface | null, ApiError> => {
    const api = useApi();
    return useQuery<CommentInterface | null, ApiError>({
        queryKey: COMMENTS_QUERY_KEYS.details(params),
        queryFn: async () => {
            const result = await api.comments.getList(params);
            return result?.list?.[0] ?? null;
        },
        enabled: !!params.comment_id && (options.enabled !== undefined ? options.enabled : true),
    });
};


// Hook pour mettre à jour un commentaire
export const useUpdateComment = (): UseMutationResult<UpdateCommentResponse, ApiError, UpdateCommentParams> => {
    const api = useApi();
    return useMutation<UpdateCommentResponse, ApiError, UpdateCommentParams>({
        mutationFn: (params) => api.comments.update(params),
        onSuccess: (data, variables) => {
            logger.info("Comment updated via mutation", data.comment);
            const commentId = variables.comment_id;
            const orderItemId = data.comment.order_item_id;
            const productId = data.comment.product_id;
            // Invalider listes, détail, forItem
            queryClient.invalidateQueries({ queryKey: COMMENTS_QUERY_KEYS.lists({ product_id: productId }) } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: COMMENTS_QUERY_KEYS.details({ comment_id: commentId }) } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: COMMENTS_QUERY_KEYS.forItem({ order_item_id: orderItemId }) } as InvalidateQueryFilters);
            // Invalider stats produit
            queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.details({ product_id: productId }) } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.lists() } as InvalidateQueryFilters);
        },
        onError: (error) => { logger.error({ error }, "Failed to update comment via mutation"); }
    });
};

// Hook pour supprimer un commentaire
export const useDeleteComment = (): UseMutationResult<DeleteCommentResponse, ApiError, DeleteCommentParams> => {
    const api = useApi();
    let commentDataForInvalidation: CommentInterface | null = null;
    return useMutation<DeleteCommentResponse, ApiError, DeleteCommentParams>({
        onMutate: async (variables) => {
            commentDataForInvalidation = await queryClient.fetchQuery({ queryKey: COMMENTS_QUERY_KEYS.details({ comment_id: variables.comment_id }) });
        },
        mutationFn: (params) => api.comments.delete(params),
        onSuccess: (data, variables) => {
            logger.info("Comment deleted via mutation", { commentId: variables.comment_id });
            const commentId = variables.comment_id;
            const productId = commentDataForInvalidation?.product_id;
            const orderItemId = commentDataForInvalidation?.order_item_id;
            // Invalider listes, supprimer détail, forItem
            queryClient.invalidateQueries({ queryKey: COMMENTS_QUERY_KEYS.lists({ product_id: productId }) } as InvalidateQueryFilters);
            queryClient.removeQueries({ queryKey: COMMENTS_QUERY_KEYS.details({ comment_id: commentId }) });
            if (orderItemId) {
                queryClient.invalidateQueries({ queryKey: COMMENTS_QUERY_KEYS.forItem({ order_item_id: orderItemId }) } as InvalidateQueryFilters);
            }
            // Invalider stats produit
            if (productId) {
                queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.details({ product_id: productId }) } as InvalidateQueryFilters);
                queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.lists() } as InvalidateQueryFilters);
            }
            commentDataForInvalidation = null;
        },
        onError: (error) => { logger.error({ error }, "Failed to delete comment via mutation"); commentDataForInvalidation = null; }
    });
};

// =======================
// == Namespace Favoris ==
// =======================

// Clés de Query communes
const FAVORITES_QUERY_KEYS = {
    all: ['favorites'] as const,
    lists: (filters: GetFavoritesParams = {}) => [...FAVORITES_QUERY_KEYS.all, 'list', filters] as const,
    details: (params: { favorite_id: string }) => [...FAVORITES_QUERY_KEYS.all, 'detail', params] as const,
};


// Hook pour ajouter un favori
export const useAddFavorite = (): UseMutationResult<AddFavoriteResponse, ApiError, AddFavoriteParams> => {
    const api = useApi();
    return useMutation<AddFavoriteResponse, ApiError, AddFavoriteParams>({
        mutationFn: (params) => api.favorites.add(params),
        onSuccess: (data) => {
            logger.info("Favorite added via mutation", data);
            queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEYS.lists() } as InvalidateQueryFilters);
        },
        onError: (error) => { logger.error({ error }, "Failed to add favorite via mutation"); }
    });
};

// Hook pour récupérer les favoris de l'utilisateur
export const useGetFavorites = (
    filter: GetFavoritesParams = {},
    options: { enabled?: boolean } = {}
): UseQueryResult<GetFavoritesResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetFavoritesResponse, ApiError>({
        queryKey: FAVORITES_QUERY_KEYS.lists(filter),
        queryFn: () => api.favorites.getList(filter),
        enabled: options.enabled !== undefined ? options.enabled : true,
    });
};

// Hook pour mettre à jour un favori (label)
export const useUpdateFavorite = (): UseMutationResult<UpdateFavoriteResponse, ApiError, UpdateFavoriteParams> => {
    const api = useApi();
    return useMutation<UpdateFavoriteResponse, ApiError, UpdateFavoriteParams>({
        mutationFn: (params) => api.favorites.update(params),
        onSuccess: (data, variables) => {
            logger.info("Favorite updated via mutation", data);
            queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEYS.lists() } as InvalidateQueryFilters);
            // Mettre à jour le cache détail si nécessaire
            queryClient.setQueryData<UpdateFavoriteResponse | null>(FAVORITES_QUERY_KEYS.details({ favorite_id: variables.favorite_id }), (old: any) => old ? { ...old, ...data } : undefined);
        },
        onError: (error) => { logger.error({ error }, "Failed to update favorite via mutation"); }
    });
};

// Hook pour supprimer un favori
export const useRemoveFavorite = (): UseMutationResult<DeleteFavoriteResponse, ApiError, DeleteFavoriteParams> => {
    const api = useApi();
    return useMutation<DeleteFavoriteResponse, ApiError, DeleteFavoriteParams>({
        mutationFn: (params) => api.favorites.remove(params),
        onSuccess: (data, variables) => {
            logger.info("Favorite removed via mutation", { favoriteId: variables.favorite_id });
            queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEYS.lists() } as InvalidateQueryFilters);
            queryClient.removeQueries({ queryKey: FAVORITES_QUERY_KEYS.details({ favorite_id: variables.favorite_id }) });
        },
        onError: (error) => { logger.error({ error }, "Failed to remove favorite via mutation"); }
    });
};

// ==============================
// == Namespace UserProfile ==
// ==============================

// Clés de Query communes
const USER_PROFILE_QUERY_KEYS = {
    addresses: (filters: GetAddressesParams = {}) => ['userAddresses', filters] as const,
    phones: (filters: GetPhonesParams = {}) => ['userPhones', filters] as const,
};

// Adresses
export const useCreateUserAddress = (): UseMutationResult<AddressResponse, ApiError, CreateAddressParams> => {
    const api = useApi();
    return useMutation<AddressResponse, ApiError, CreateAddressParams>({
        mutationFn: (params) => api.userProfile.createAddress(params),
        onSuccess: (data) => {
            logger.info("User address created via mutation", data.address);
            queryClient.invalidateQueries({ queryKey: USER_PROFILE_QUERY_KEYS.addresses() } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.me } as InvalidateQueryFilters); // 'me' contient les adresses
        },
        onError: (error) => { logger.error({ error }, "Failed to create user address via mutation"); }
    });
};

export const useGetUserAddresses = (
    options: { enabled?: boolean } = {}
): UseQueryResult<GetAddressesResponse, ApiError> => {
    const api = useApi();
    // Ce hook récupère la liste complète pour l'utilisateur authentifié
    return useQuery<GetAddressesResponse, ApiError>({
        queryKey: USER_PROFILE_QUERY_KEYS.addresses(),
        queryFn: () => api.userProfile.getAddressList(), // Pas de filtre ici
        enabled: options.enabled !== undefined ? options.enabled : true,
    });
};

export const useUpdateUserAddress = (): UseMutationResult<AddressResponse, ApiError, UpdateAddressParams> => {
    const api = useApi();
    return useMutation<AddressResponse, ApiError, UpdateAddressParams>({
        mutationFn: (params) => api.userProfile.updateAddress(params),
        onSuccess: (data, variables) => {
            logger.info("User address updated via mutation", data.address);
            queryClient.invalidateQueries({ queryKey: USER_PROFILE_QUERY_KEYS.addresses() } as InvalidateQueryFilters);
            // Mettre à jour le cache pour cette adresse spécifique si un hook getOne existe
            // queryClient.setQueryData(USER_PROFILE_QUERY_KEYS.addresses({ id: variables.address_id }), data.address);
            queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.me } as InvalidateQueryFilters);
        },
        onError: (error) => { logger.error({ error }, "Failed to update user address via mutation"); }
    });
};

export const useDeleteUserAddress = (): UseMutationResult<DeleteResponse, ApiError, DeleteAddressParams> => {
    const api = useApi();
    return useMutation<DeleteResponse, ApiError, DeleteAddressParams>({
        mutationFn: (params) => api.userProfile.deleteAddress(params),
        onSuccess: (data, variables) => {
            logger.info("User address deleted via mutation", { addressId: variables.address_id });
            queryClient.invalidateQueries({ queryKey: USER_PROFILE_QUERY_KEYS.addresses() } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.me } as InvalidateQueryFilters);
        },
        onError: (error) => { logger.error({ error }, "Failed to delete user address via mutation"); }
    });
};

// Téléphones (similaire à Adresses)
export const useCreateUserPhone = (): UseMutationResult<PhoneResponse, ApiError, CreatePhoneParams> => {
    const api = useApi();
    return useMutation<PhoneResponse, ApiError, CreatePhoneParams>({
        mutationFn: (params) => api.userProfile.createPhone(params),
        onSuccess: (data) => {
            logger.info("User phone created via mutation", data.phone);
            queryClient.invalidateQueries({ queryKey: USER_PROFILE_QUERY_KEYS.phones() } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.me } as InvalidateQueryFilters);
        },
        onError: (error) => { logger.error({ error }, "Failed to create user phone via mutation"); }
    });
};

export const useGetUserPhones = (
    options: { enabled?: boolean } = {}
): UseQueryResult<GetPhonesResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetPhonesResponse, ApiError>({
        queryKey: USER_PROFILE_QUERY_KEYS.phones(),
        queryFn: () => api.userProfile.getPhoneList(),
        enabled: options.enabled !== undefined ? options.enabled : true,
    });
};

export const useUpdateUserPhone = (): UseMutationResult<PhoneResponse, ApiError, UpdatePhoneParams> => {
    const api = useApi();
    return useMutation<PhoneResponse, ApiError, UpdatePhoneParams>({
        mutationFn: (params) => api.userProfile.updatePhone(params),
        onSuccess: (data, variables) => {
            logger.info("User phone updated via mutation", data.phone);
            queryClient.invalidateQueries({ queryKey: USER_PROFILE_QUERY_KEYS.phones() } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.me } as InvalidateQueryFilters);
        },
        onError: (error) => { logger.error({ error }, "Failed to update user phone via mutation"); }
    });
};

export const useDeleteUserPhone = (): UseMutationResult<DeleteResponse, ApiError, DeletePhoneParams> => {
    const api = useApi();
    return useMutation<DeleteResponse, ApiError, DeletePhoneParams>({
        mutationFn: (params) => api.userProfile.deletePhone(params),
        onSuccess: (data, variables) => {
            logger.info("User phone deleted via mutation", { phoneId: variables.phone_id });
            queryClient.invalidateQueries({ queryKey: USER_PROFILE_QUERY_KEYS.phones() } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.me } as InvalidateQueryFilters);
        },
        onError: (error) => { logger.error({ error }, "Failed to delete user phone via mutation"); }
    });
};


// ==============================
// == Namespace Users (Admin)  ==
// ==============================

// Clés de Query communes
const USERS_QUERY_KEYS = {
    all: ['users'] as const,
    lists: (filters: UserFilterType = {}) => [...USERS_QUERY_KEYS.all, 'list', filters] as const,
    details: (params: { user_id: string }) => [...USERS_QUERY_KEYS.all, 'detail', params] as const, // Si on ajoute un getOne
};

// Hook pour récupérer la LISTE des utilisateurs (Admin/Collab)
export const useGetUsers = (
    filter: UserFilterType = {},
    options: { enabled?: boolean, keepPreviousData?: boolean } = {}
): UseQueryResult<GetUsersResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetUsersResponse, ApiError>({
        queryKey: USERS_QUERY_KEYS.lists(filter),
        queryFn: () => api.users.getList(filter),
        enabled: options.enabled !== undefined ? options.enabled : true,
        // keepPreviousData: options.keepPreviousData ?? true,
    });
};
// Ajouter useGetUser si un endpoint getOne est créé
export const useGetUserStats = (
    params: GetUserStatsParams = {},
    options: { enabled?: boolean; refetchInterval?: number | false } = {}
): UseQueryResult<GetUserStatsResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetUserStatsResponse, ApiError>({
        queryKey: ['userStats', params], // Clé de query pour les stats users
        queryFn: () => api.users.getUserStats(params),
        enabled: options.enabled !== undefined ? options.enabled : true,
        staleTime: 5 * 60 * 1000, // Cache de 5 minutes pour les stats
        refetchInterval: options.refetchInterval, // Permettre un refetch périodique si besoin
    });
};

// ===========================
// == Namespace Statistiques ==
// ===========================

// Clé de Query
const STATS_QUERY_KEY = (params: StatParamType = {}) => ['stats', params] as const;
export const useGetKpis = (
    params: BaseStatsParams = {},
    options: { enabled?: boolean; refetchInterval?: number | false } = {}
): UseQueryResult<KpiStatsResponse, ApiError> => {
    const api = useApi();
    return useQuery<KpiStatsResponse, ApiError>({
        queryKey: ['stats', 'kpi', params], // Clé spécifique KPI
        queryFn: () => api.stats.getKpis(params),
        enabled: options.enabled !== undefined ? options.enabled : true,
        staleTime: 5 * 60 * 1000, // Cache 5 min
        refetchInterval: options.refetchInterval,
    });
};

// Hook pour récupérer les stats de visites détaillées
type VisitDetailsParams = BaseStatsParams & { include?: VisitStatsIncludeOptions };
export const useGetVisitDetails = (
    params: VisitDetailsParams = {},
    options: { enabled?: boolean; refetchInterval?: number | false } = {}
): UseQueryResult<VisitStatsResponse, ApiError> => {
    const api = useApi();
    return useQuery<VisitStatsResponse, ApiError>({
        queryKey: ['stats', 'visits', params], // Clé spécifique visites
        queryFn: () => api.stats.getVisitDetails(params),
        enabled: options.enabled !== undefined ? options.enabled : true,
        staleTime: 5 * 60 * 1000,
        refetchInterval: options.refetchInterval,
    });
};

// Hook pour récupérer les stats de commandes détaillées
type OrderDetailsParams = BaseStatsParams & { include?: OrderStatsIncludeOptions };
export const useGetOrderDetailsStats = ( // Renommer pour éviter conflit avec useGetOrderDetails(id)
    params: OrderDetailsParams = {},
    options: { enabled?: boolean; refetchInterval?: number | false } = {}
): UseQueryResult<OrderStatsResponse, ApiError> => {
    const api = useApi();
    return useQuery<OrderStatsResponse, ApiError>({
        queryKey: ['stats', 'orders', params], // Clé spécifique commandes
        queryFn: () => api.stats.getOrderDetails(params),
        enabled: options.enabled !== undefined ? options.enabled : true,
        staleTime: 5 * 60 * 1000,
        refetchInterval: options.refetchInterval,
    });
};

// ==============================
// == Namespace Roles (Admin)  ==
// ==============================

// Clés de Query communes
const ROLES_QUERY_KEYS = {
    all: ['roles'] as const,
    collaborators: (filters: GetCollaboratorsParams = {}) => [...ROLES_QUERY_KEYS.all, 'collaborators', filters] as const,
};

// Hook pour récupérer la liste des collaborateurs
export const useGetCollaborators = (
    filter: GetCollaboratorsParams = {},
    options: { enabled?: boolean, keepPreviousData?: boolean } = {}
): UseQueryResult<GetCollaboratorsResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetCollaboratorsResponse, ApiError>({
        queryKey: ROLES_QUERY_KEYS.collaborators(filter),
        queryFn: () => api.roles.getCollaborators(filter),
        enabled: options.enabled !== undefined ? options.enabled : true,
        // keepPreviousData: options.keepPreviousData ?? true,
    });
};

// Hook pour créer un collaborateur
export const useCreateCollaborator = (): UseMutationResult<CreateCollaboratorResponse, ApiError, CreateCollaboratorParams> => {
    const api = useApi();
    return useMutation<CreateCollaboratorResponse, ApiError, CreateCollaboratorParams>({
        mutationFn: (params) => api.roles.createCollaborator(params),
        onSuccess: (data) => {
            logger.info("Collaborator created via mutation", data.role);
            queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEYS.collaborators() } as InvalidateQueryFilters);
            // Invalider aussi la liste des users généraux?
            queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.lists() } as InvalidateQueryFilters);
        },
        onError: (error) => { logger.error({ error }, "Failed to create collaborator via mutation"); }
    });
};

// Hook pour mettre à jour les permissions
export const useUpdateCollaboratorPermissions = (): UseMutationResult<UpdateCollaboratorResponse, ApiError, UpdateCollaboratorParams> => {
    const api = useApi();
    return useMutation<UpdateCollaboratorResponse, ApiError, UpdateCollaboratorParams>({
        mutationFn: (params) => api.roles.updatePermissions(params),
        onSuccess: (data, variables) => {
            logger.info("Collaborator permissions updated via mutation", data.role);
            // Invalider la liste des collaborateurs
            queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEYS.collaborators() } as InvalidateQueryFilters);
            // Mettre à jour le cache pour cet item spécifique? Non, l'invalidation suffit.
        },
        onError: (error) => { logger.error({ error }, "Failed to update collaborator permissions via mutation"); }
    });
};

// Hook pour supprimer un collaborateur
export const useRemoveCollaborator = (): UseMutationResult<RemoveCollaboratorResponse, ApiError, DeleteCollaboratorParams> => {
    const api = useApi();
    return useMutation<RemoveCollaboratorResponse, ApiError, DeleteCollaboratorParams>({
        mutationFn: (params) => api.roles.removeCollaborator(params),
        onSuccess: (data, variables) => {
            logger.info("Collaborator removed via mutation", { userId: variables.user_id });
            queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEYS.collaborators() } as InvalidateQueryFilters);
            // Invalider aussi la liste des users généraux?
            queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.lists() } as InvalidateQueryFilters);
        },
        onError: (error) => { logger.error({ error }, "Failed to remove collaborator via mutation"); }
    });
};


// ========================
// == Namespace Inventaires ==
// ========================

// Clés de Query communes
const INVENTORIES_QUERY_KEYS = {
    all: ['inventories'] as const,
    lists: (filters: GetInventoriesParams = {}) => [...INVENTORIES_QUERY_KEYS.all, 'list', filters] as const,
    details: (params: { inventory_id: string }) => [...INVENTORIES_QUERY_KEYS.all, 'detail', params] as const,
};

// Hook pour récupérer la LISTE des inventaires
export const useGetInventories = (
    filter: Omit<GetInventoriesParams, 'inventory_id'> = {}, // Exclure ID pour la liste
    options: { enabled?: boolean, keepPreviousData?: boolean } = {}
): UseQueryResult<GetInventoriesResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetInventoriesResponse, ApiError>({
        queryKey: INVENTORIES_QUERY_KEYS.lists(filter),
        queryFn: () => api.inventories.getList(filter),
        enabled: options.enabled !== undefined ? options.enabled : true,
        // keepPreviousData: options.keepPreviousData ?? true,
    });
};

// Hook pour récupérer UN inventaire par ID
export const useGetInventory = (
    params: { inventory_id: string },
    options: { enabled?: boolean } = {}
): UseQueryResult<GetInventoryResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetInventoryResponse, ApiError>({
        queryKey: INVENTORIES_QUERY_KEYS.details(params),
        queryFn: () => api.inventories.getOne(params),
        enabled: !!params.inventory_id && (options.enabled !== undefined ? options.enabled : true),
    });
};

// Hook pour créer un inventaire
export const useCreateInventory = (): UseMutationResult<InventoryResponse, ApiError, CreateInventoryParams> => {
    const api = useApi();
    return useMutation<InventoryResponse, ApiError, CreateInventoryParams>({
        mutationFn: (params) => api.inventories.create(params),
        onSuccess: (data) => {
            logger.info("Inventory created via mutation", data.inventory);
            queryClient.invalidateQueries({ queryKey: INVENTORIES_QUERY_KEYS.lists() } as InvalidateQueryFilters);
        },
        onError: (error) => { logger.error({ error }, "Failed to create inventory via mutation"); }
    });
};

// Hook pour mettre à jour un inventaire
export const useUpdateInventory = (): UseMutationResult<InventoryResponse, ApiError, UpdateInventoryParams> => {
    const api = useApi();
    return useMutation<InventoryResponse, ApiError, UpdateInventoryParams>({
        mutationFn: (params) => api.inventories.update(params),
        onSuccess: (data, variables) => {
            logger.info("Inventory updated via mutation", data.inventory);
            const inventoryId = variables.inventory_id;
            queryClient.invalidateQueries({ queryKey: INVENTORIES_QUERY_KEYS.lists() } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: INVENTORIES_QUERY_KEYS.details({ inventory_id: inventoryId }) } as InvalidateQueryFilters);
            queryClient.setQueryData<GetInventoryResponse>(INVENTORIES_QUERY_KEYS.details({ inventory_id: inventoryId }), data.inventory);
        },
        onError: (error) => { logger.error({ error }, "Failed to update inventory via mutation"); }
    });
};

// Hook pour supprimer un inventaire
export const useDeleteInventory = (): UseMutationResult<DeleteInventoryResponse, ApiError, DeleteInventoryParams> => {
    const api = useApi();
    return useMutation<DeleteInventoryResponse, ApiError, DeleteInventoryParams>({
        mutationFn: (params) => api.inventories.delete(params),
        onSuccess: (data, variables) => {
            logger.info("Inventory deleted via mutation", { inventoryId: variables.inventory_id });
            queryClient.invalidateQueries({ queryKey: INVENTORIES_QUERY_KEYS.lists() } as InvalidateQueryFilters);
            queryClient.removeQueries({ queryKey: INVENTORIES_QUERY_KEYS.details({ inventory_id: variables.inventory_id }) });
        },
        onError: (error) => { logger.error({ error }, "Failed to delete inventory via mutation"); }
    });
};

// =========================
// == Namespace General   ==
// =========================

// Clé de Query
const GLOBAL_SEARCH_QUERY_KEY = (params: GlobalSearchParams) => ['globalSearch', params] as const;

export const useGlobalSearch = (
    params: GlobalSearchParams,
    options: { enabled?: boolean } = {}
): UseQueryResult<GlobalSearchResponse, ApiError> => {
    const api = useApi();
    return useQuery<GlobalSearchResponse, ApiError>({
        queryKey: GLOBAL_SEARCH_QUERY_KEY(params),
        queryFn: () => api.general.globalSearch(params),
        enabled: !!params.text && (options.enabled !== undefined ? options.enabled : true), // Activer seulement si texte
        staleTime: 1 * 60 * 1000, // Cache court
    });
};


// ==================================
// == Hooks pour Notifications     ==
// ==================================

const NOTIFICATIONS_QUERY_KEYS = {
    devices: ['notificationDevices'] as const, // Liste des appareils de l'utilisateur
    deviceDetails: (deviceId: string) => [...NOTIFICATIONS_QUERY_KEYS.devices, deviceId] as const,
    contextSubscriptions: (params?: ListContextSubscriptionsParams) => ['notificationContextSubscriptions', params || {}] as const,
    contextSubscriptionDetails: (subId: string) => [...NOTIFICATIONS_QUERY_KEYS.contextSubscriptions(), subId] as const,
};

/**
 * Hook pour enregistrer ou mettre à jour un appareil pour les notifications.
 */
export const useRegisterDevice = (): UseMutationResult<RegisterDeviceResponse, ApiError, RegisterDevicePayload> => {
    const api = useApi();
    return useMutation<RegisterDeviceResponse, ApiError, RegisterDevicePayload>({
        mutationFn: (payload) => api.notifications.registerDevice(payload),
        onSuccess: (data) => {
            logger.info("Device registered/updated for notifications successfully", data.device);
            // Invalider la liste des appareils pour la rafraîchir
            queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEYS.devices } as InvalidateQueryFilters);
        },
        onError: (error) => {
            logger.error({ error }, "Failed to register/update device for notifications");
        }
    });
};

/**
 * Hook pour lister les appareils enregistrés de l'utilisateur.
 */
export const useListUserDevices = (
    options: { enabled?: boolean } = {}
): UseQueryResult<ListUserDevicesResponse, ApiError> => {
    const api = useApi();
    return useQuery<ListUserDevicesResponse, ApiError>({
        queryKey: NOTIFICATIONS_QUERY_KEYS.devices,
        queryFn: () => api.notifications.listDevices(),
        enabled: options.enabled !== undefined ? options.enabled : true,
        staleTime: 5 * 60 * 1000, // Les appareils changent moins fréquemment
    });
};

/**
 * Hook pour mettre à jour le statut (actif/inactif) d'un appareil.
 */
export const useUpdateDeviceStatus = (): UseMutationResult<UpdateDeviceStatusResponse, ApiError, UpdateDeviceStatusParams> => {
    const api = useApi();
    return useMutation<UpdateDeviceStatusResponse, ApiError, UpdateDeviceStatusParams>({
        mutationFn: (params) => api.notifications.updateDeviceStatus(params),
        onSuccess: (data, variables) => {
            logger.info("Device notification status updated", data.device);
            // Mettre à jour le cache de la liste des appareils
            queryClient.setQueryData<UserBrowserSubscriptionInterface[]>(NOTIFICATIONS_QUERY_KEYS.devices, (oldData) =>
                oldData?.map(device => device.id === variables.deviceId ? data.device : device) || []
            );
        },
        onError: (error) => {
            logger.error({ error }, "Failed to update device status");
        }
    });
};

/**
 * Hook pour supprimer un appareil enregistré.
 */
export const useRemoveDevice = (): UseMutationResult<RemoveDeviceResponse, ApiError, RemoveDeviceParams> => {
    const api = useApi();
    return useMutation<RemoveDeviceResponse, ApiError, RemoveDeviceParams>({
        mutationFn: (params) => api.notifications.removeDevice(params),
        onSuccess: (data, variables) => {
            logger.info("Device removed from notifications", { deviceId: variables.deviceId });
            // Mettre à jour le cache de la liste des appareils
            queryClient.setQueryData<UserBrowserSubscriptionInterface[]>(NOTIFICATIONS_QUERY_KEYS.devices, (oldData) =>
                oldData?.filter(device => device.id !== variables.deviceId) || []
            );
        },
        onError: (error) => {
            logger.error({ error }, "Failed to remove device");
        }
    });
};

/**
 * Hook pour s'abonner à un contexte de notification.
 */
export const useSubscribeToContext = (): UseMutationResult<SubscribeToContextResponse, ApiError, SubscribeToContextPayload> => {
    const api = useApi();
    return useMutation<SubscribeToContextResponse, ApiError, SubscribeToContextPayload>({
        mutationFn: (payload) => api.notifications.subscribeToContext(payload),
        onSuccess: (data) => {
            logger.info("Subscribed to notification context", data.subscription);
            queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEYS.contextSubscriptions() }as InvalidateQueryFilters);
        },
        onError: (error) => {
            logger.error({ error }, "Failed to subscribe to notification context");
        }
    });
};

/**
 * Hook pour lister les abonnements aux contextes de l'utilisateur.
 */
export const useListContextSubscriptions = (
    params: ListContextSubscriptionsParams = {},
    options: { enabled?: boolean } = {}
): UseQueryResult<ListContextSubscriptionsResponse, ApiError> => {
    const api = useApi();
    return useQuery<ListContextSubscriptionsResponse, ApiError>({
        queryKey: NOTIFICATIONS_QUERY_KEYS.contextSubscriptions(params),
        queryFn: () => api.notifications.listContextSubscriptions(params),
        enabled: options.enabled !== undefined ? options.enabled : true,
    });
};

/**
 * Hook pour se désabonner d'un contexte de notification.
 */
export const useUnsubscribeFromContext = (): UseMutationResult<UnsubscribeFromContextResponse, ApiError, UnsubscribeFromContextParams> => {
    const api = useApi();
    return useMutation<UnsubscribeFromContextResponse, ApiError, UnsubscribeFromContextParams>({
        mutationFn: (params) => api.notifications.unsubscribeFromContext(params),
        onSuccess: (data, variables) => {
            logger.info("Unsubscribed from notification context", { subscriptionId: variables.subscriptionId });
            // Mettre à jour le cache de la liste des contextes
            queryClient.setQueryData<UserNotificationContextSubscriptionInterface[]>(
                NOTIFICATIONS_QUERY_KEYS.contextSubscriptions(), // Clé de base de la liste
                (oldData) => oldData?.filter(sub => sub.id !== variables.subscriptionId) || []
            );
        },
        onError: (error) => {
            logger.error({ error }, "Failed to unsubscribe from notification context");
        }
    });
};


// ======================
// == Namespace Debug  ==
// ======================

export const useRequestScaleUp = (): UseMutationResult<ScaleResponse, ApiError, void> => {
    const api = useApi();
    return useMutation<ScaleResponse, ApiError, void>({
        mutationFn: () => api.debug.requestScaleUp(),
        onSuccess: (data) => { logger.info("Scale Up requested via mutation", data); },
        onError: (error) => { logger.error({ error }, "Scale Up request failed via mutation"); }
    });
};

export const useRequestScaleDown = (): UseMutationResult<ScaleResponse, ApiError, void> => {
    const api = useApi();
    return useMutation<ScaleResponse, ApiError, void>({
        mutationFn: () => api.debug.requestScaleDown(),
        onSuccess: (data) => { logger.info("Scale Down requested via mutation", data); },
        onError: (error) => { logger.error({ error }, "Scale Down request failed via mutation"); }
    });
};

// --- Fin ReactSublymusApi.tsx ---