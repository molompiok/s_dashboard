// src/api/ReactSublymusApi.tsx
import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useMutation, UseQueryResult, UseMutationResult, InvalidateQueryFilters } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { SublymusApi, ApiError } from './SublymusApi'; // Importer la classe et l'erreur
import { useAuthStore } from '../pages/login/AuthStore'; // Pour le token
import { useStore } from '../pages/stores/StoreStore'; // Pour l'URL du store
import type {
    ListType, ProductInterface, CategoryInterface, UserInterface, StoreInterface,
    CommandInterface, CommentInterface, DetailInterface, Inventory, Role, Favorite,
    FilterType, CommandFilterType, UserFilterType, /* ... autres types ... */
    GlobalSearchType, StatsData, StatParamType, EventStatus, TypeJsonRole, OrderStatus, FeatureInterface, ValueInterface // Ajout OrderStatus etc.
} from '../Interfaces/Interfaces'; // Adapter le chemin
import logger from '@adonisjs/core/services/logger'; // Pour les logs dans les hooks
import { t } from '#utils/functions'; // Assurez-vous que l'import est correct

// --- Client TanStack Query (inchangé) ---
const queryClient = new QueryClient({ /* ... options ... */ });

// --- Contexte API (inchangé) ---
interface SublymusApiContextType { api: SublymusApi | null; }
const SublymusApiContext = createContext<SublymusApiContextType>({ api: null });

// --- Provider API (inchangé) ---
interface SublymusApiProviderProps { children: ReactNode; }
export const SublymusApiProvider: React.FC<SublymusApiProviderProps> = ({ children }) => { /* ... inchangé ... */ };

// --- Hook useApi (inchangé) ---
export const useApi = (): SublymusApi => { /* ... inchangé ... */ };

// --- Hooks Personnalisés basés sur TanStack Query ---

// ========================
// == Authentification ==
// ========================

// Hook pour le Login
export const useLogin = (): UseMutationResult<
    { message: string, user: UserInterface, token: string, expires_at: string }, // Type retour succès
    ApiError, // Type erreur
    { email: string; password: string } // Type variables mutation (credentials)
> => {
    const api = useApi();
    // Inutile d'invalider le cache ici, mais on pourrait vouloir rafraîchir 'me' implicitement
    return useMutation<
        { message: string, user: UserInterface, token: string, expires_at: string },
        ApiError,
        { email: string; password: string }
    >({
        mutationFn: (credentials) => api.login(credentials),
        onSuccess: (data) => {
             queryClient.setQueryData(['me'], { user: data.user }); // Mettre à jour le cache 'me' directement
             logger.info("Login successful via mutation", { userId: data.user.id });
             // Potentiellement mettre à jour le store Zustand ici aussi
             useAuthStore.setState({ user: data.user }); // Exemple
        },
        onError: (error) => { logger.error({ error }, "Login failed via mutation"); }
    });
};

// Hook pour l'Inscription
export const useRegister = (): UseMutationResult<
    { message: string, user_id: string },
    ApiError,
    { full_name: string; email: string; password: string; password_confirmation: string }
> => {
    const api = useApi();
    return useMutation<
        { message: string, user_id: string },
        ApiError,
        { full_name: string; email: string; password: string; password_confirmation: string }
    >({
        mutationFn: (data) => api.register(data),
        onSuccess: (data) => { logger.info("Registration successful via mutation", { userId: data.user_id }); },
        onError: (error) => { logger.error({ error }, "Registration failed via mutation"); }
    });
};

// Hook pour vérifier l'email (c'est une action GET mais déclenchée comme une mutation)
export const useVerifyEmail = (): UseMutationResult<{ message: string }, ApiError, string> => {
    const api = useApi();
    return useMutation<{ message: string }, ApiError, string>({ // string = token
        mutationFn: (token) => api.verifyEmail(token),
        onSuccess: (data) => {
             logger.info("Email verified via mutation", data);
             // Rafraîchir potentiellement les données utilisateur 'me'
             queryClient.invalidateQueries({ queryKey: ['me'] } as InvalidateQueryFilters);
        },
        onError: (error) => { logger.error({ error }, "Email verification failed via mutation"); }
    });
};

// Hook pour renvoyer l'email de vérification
export const useResendVerificationEmail = (): UseMutationResult<{ message: string }, ApiError, string> => {
    const api = useApi();
    return useMutation<{ message: string }, ApiError, string>({ // string = email
        mutationFn: (email) => api.resendVerificationEmail(email),
        onSuccess: (data) => { logger.info("Resend verification email requested via mutation", data); },
        onError: (error) => { logger.error({ error }, "Resend verification email failed via mutation"); }
    });
};

// Hook pour la déconnexion
export const useLogout = (): UseMutationResult<{ message: string }, ApiError, void> => {
    const api = useApi();
    return useMutation<{ message: string }, ApiError, void>({
        mutationFn: () => api.logout(),
        onSuccess: (data) => {
            queryClient.removeQueries({ queryKey: ['me'] }); // Vider le cache 'me'
            queryClient.clear(); // Optionnel: Vider tout le cache TanStack au logout
            logger.info("Logout successful via mutation", data);
             // Vider le store Zustand
             useAuthStore.setState({ user: undefined }); // Exemple
        },
         onError: (error) => { logger.error({ error }, "Logout failed via mutation"); }
    });
};

// Hook pour la déconnexion de tous les appareils
export const useLogoutAllDevices = (): UseMutationResult<{ message: string }, ApiError, void> => {
    const api = useApi();
    return useMutation<{ message: string }, ApiError, void>({
        mutationFn: () => api.logoutAllDevices(),
         onSuccess: (data) => {
             // Agit comme un logout normal côté client
             queryClient.removeQueries({ queryKey: ['me'] });
             queryClient.clear();
             logger.info("Logout All Devices successful via mutation", data);
             useAuthStore.setState({ user: undefined });
        },
         onError: (error) => { logger.error({ error }, "Logout All Devices failed via mutation"); }
    });
};

// Hook pour récupérer les infos de l'utilisateur connecté ('/me')
// Le type inclut les relations chargées par l'API
type MeResponseType = { user: UserInterface & { addresses: any[], phone_numbers: any[] } };
export const useGetMe = (options: { enabled?: boolean } = {}): UseQueryResult<MeResponseType, ApiError> => {
    const api = useApi();
    return useQuery<MeResponseType, ApiError>({
        queryKey: ['me'], // Clé simple car spécifique à l'utilisateur courant
        queryFn: () => api.getMe(),
        enabled: options.enabled !== undefined ? options.enabled : true,
        staleTime: 15 * 60 * 1000, // Garder les infos user un peu plus longtemps (15 min)
    });
};

// Hook pour mettre à jour le profil utilisateur
export const useUpdateUser = (): UseMutationResult<
    { message: string, user: UserInterface },
    ApiError,
    { full_name?: string; password?: string; password_confirmation?: string }
> => {
    const api = useApi();
    return useMutation<
        { message: string, user: UserInterface },
        ApiError,
        { full_name?: string; password?: string; password_confirmation?: string }
    >({
        mutationFn: (data) => api.updateUser(data),
        onSuccess: (data) => {
            // Mettre à jour le cache 'me' avec les nouvelles données
            queryClient.setQueryData(['me'], (oldData: MeResponseType | undefined) => {
                // Attention: la réponse de updateUser ne contient pas addresses/phones
                // Il faut soit rafraîchir, soit merger prudemment
                return oldData ? { ...oldData, user: { ...oldData.user, ...data.user } } : undefined;
            });
             // Ou simplement invalider pour forcer un refetch
             // queryClient.invalidateQueries({ queryKey: ['me'] } as InvalidateQueryFilters);
             logger.info("User profile updated via mutation", data.user);
             useAuthStore.setState(state => ({ user: state.user ? { ...state.user, ...data.user } : undefined }));
        },
        onError: (error) => { logger.error({ error }, "User profile update failed via mutation"); }
    });
};

// Hook pour supprimer le compte utilisateur
export const useDeleteAccount = (): UseMutationResult<{ message: string }, ApiError, void> => {
     const api = useApi();
     // Utiliser le hook de logout pour la logique de nettoyage après succès
     const logoutMutation = useLogout();
     return useMutation<{ message: string }, ApiError, void>({
         mutationFn: () => api.deleteAccount(),
         onSuccess: (data) => {
             logger.info("Account deleted via mutation", data);
             // Déclencher la logique de logout pour nettoyer état/cache/token
             logoutMutation.mutate();
         },
         onError: (error) => { logger.error({ error }, "Account deletion failed via mutation"); }
     });
};

// ========================
// == Catégories ==
// ========================

// Hook pour récupérer les catégories
type CategoryFilterType = { // Définir un type plus précis pour le filtre si possible
    categories_id?: string[],
    search?: string,
    slug?: string,
    order_by?: string,
    page?: number,
    limit?: number,
    category_id?: string,
    with_product_count?: boolean,
};
export const useGetCategories = (filter: CategoryFilterType = {}, options: { enabled?: boolean } = {}): UseQueryResult<ListType<CategoryInterface>, ApiError> => {
    const api = useApi();
    return useQuery<ListType<CategoryInterface>, ApiError>({
        queryKey: ['categories', filter], // Clé incluant les filtres
        queryFn: () => api.getCategories(filter),
        enabled: options.enabled !== undefined ? options.enabled : true,
    });
};

// Hook pour récupérer une catégorie par ID (basé sur useGetCategories)
export const useGetCategoryById = (categoryId: string | undefined, options: { enabled?: boolean } = {}): UseQueryResult<CategoryInterface | null, ApiError> => {
    const api = useApi();
     // Utilise useQuery mais appelle l'API seulement si categoryId est défini
    return useQuery<CategoryInterface | null, ApiError>({
         queryKey: ['category', categoryId],
         queryFn: async () => {
             if (!categoryId) return null;
             // L'API getCategories renvoie une liste même pour un ID, on prend le premier
             const result = await api.getCategories({ category_id: categoryId });
             return result?.list?.[0] ?? null;
         },
         enabled: !!categoryId && (options.enabled !== undefined ? options.enabled : true), // Actif seulement si ID fourni
         staleTime: 10 * 60 * 1000, // Cache plus long pour une seule catégorie
    });
};


// Hook pour mettre à jour une catégorie
export const useUpdateCategory = (): UseMutationResult<{ message: string, category: CategoryInterface }, ApiError, FormData> => {
    const api = useApi();
    return useMutation< { message: string, category: CategoryInterface }, ApiError, FormData>({
        mutationFn: (formData) => api.updateCategory(formData),
        onSuccess: (data) => {
             // Invalider la liste ET le détail de cette catégorie
             queryClient.invalidateQueries({ queryKey: ['categories'] } as InvalidateQueryFilters);
             queryClient.invalidateQueries({ queryKey: ['category', data.category.id] } as InvalidateQueryFilters);
             logger.info("Category updated via mutation", data.category);
        },
        onError: (error) => { logger.error({ error }, "Failed to update category via mutation"); }
    });
};

// Hook pour supprimer une catégorie
export const useDeleteCategory = (): UseMutationResult<{ message: string, isDeleted: boolean }, ApiError, string> => {
    const api = useApi();
    return useMutation<{ message: string, isDeleted: boolean }, ApiError, string>({ // string = categoryId
        mutationFn: (categoryId) => api.deleteCategory(categoryId),
         onSuccess: (data, categoryId) => {
             // Invalider la liste ET le détail de cette catégorie
             queryClient.invalidateQueries({ queryKey: ['categories'] } as InvalidateQueryFilters);
             queryClient.removeQueries({ queryKey: ['category', categoryId] }); // Supprimer du cache détail
             logger.info("Category deleted via mutation", { categoryId });
        },
        onError: (error) => { logger.error({ error }, "Failed to delete category via mutation"); }
    });
};

// Hook pour récupérer les sous-catégories
export const useGetSubCategories = (parentId: string | undefined, options: { enabled?: boolean } = {}): UseQueryResult<CategoryInterface[], ApiError> => {
    const api = useApi();
    return useQuery<CategoryInterface[], ApiError>({
        queryKey: ['subCategories', parentId],
        queryFn: () => parentId ? api.getSubCategories(parentId) : Promise.resolve([]), // Ne fetch que si parentId existe
        enabled: !!parentId && (options.enabled !== undefined ? options.enabled : true),
    });
};

// Hook pour récupérer les filtres
export const useGetCategoryFilters = (slug?: string, options: { enabled?: boolean } = {}): UseQueryResult<any[], ApiError> => {
    const api = useApi();
    return useQuery<any[], ApiError>({
        queryKey: ['categoryFilters', slug ?? 'global'], // Clé différente si slug ou global
        queryFn: () => api.getCategoryFilters(slug),
         enabled: options.enabled !== undefined ? options.enabled : true,
    });
};

// ========================
// == Produits ==
// ========================

// Hook pour créer un produit
export const useCreateProduct = (): UseMutationResult<{ message: string, product: ProductInterface }, ApiError, FormData> => {
     const api = useApi();
     return useMutation< { message: string, product: ProductInterface }, ApiError, FormData>({
         mutationFn: (formData) => api.createProduct(formData),
         onSuccess: (data) => {
             // Invalider la liste des produits
             queryClient.invalidateQueries({ queryKey: ['products'] } as InvalidateQueryFilters);
             logger.info("Product created via mutation", data.product);
         },
         onError: (error) => { logger.error({ error }, "Failed to create product via mutation"); }
     });
};

// Hook pour mettre à jour un produit (infos de base)
export const useUpdateProduct = (): UseMutationResult<{ message: string, product: Partial<ProductInterface> }, ApiError, FormData> => {
    const api = useApi();
    return useMutation<{ message: string, product: Partial<ProductInterface> }, ApiError, FormData>({
        mutationFn: (formData) => api.updateProduct(formData),
         onSuccess: (data, formData) => {
             const productId = formData.get('product_id') as string;
             // Invalider la liste ET le détail de ce produit
             queryClient.invalidateQueries({ queryKey: ['products'] } as InvalidateQueryFilters);
             if (productId) {
                queryClient.invalidateQueries({ queryKey: ['product', productId] } as InvalidateQueryFilters); // Si hook getProductById existe
             }
             logger.info("Product updated via mutation", data.product);
         },
         onError: (error) => { logger.error({ error }, "Failed to update product via mutation"); }
    });
};

// Hook pour supprimer un produit
export const useDeleteProduct = (): UseMutationResult<{ message: string }, ApiError, string> => {
    const api = useApi();
    return useMutation<{ message: string }, ApiError, string>({ // string = productId
        mutationFn: (productId) => api.deleteProduct(productId),
         onSuccess: (data, productId) => {
             // Invalider la liste ET supprimer le détail du cache
             queryClient.invalidateQueries({ queryKey: ['products'] } as InvalidateQueryFilters);
             queryClient.removeQueries({ queryKey: ['product', productId] });
             logger.info("Product deleted via mutation", { productId });
         },
         onError: (error) => { logger.error({ error }, "Failed to delete product via mutation"); }
    });
};

// ==================================
// == Features & Values (Multiple) ==
// ==================================

// Hook pour la mise à jour multiple des features/values
export const useMultipleUpdateFeaturesValues = (): UseMutationResult<{ message: string, product: ProductInterface }, ApiError, FormData> => {
     const api = useApi();
     return useMutation<{ message: string, product: ProductInterface }, ApiError, FormData>({
         mutationFn: (formData) => api.multipleUpdateFeaturesValues(formData),
         onSuccess: (data, formData) => {
             const productId = formData.get('product_id') as string;
             // Invalider la liste produits ET le détail de ce produit ET les features/values
             queryClient.invalidateQueries({ queryKey: ['products'] } as InvalidateQueryFilters);
             if (productId) {
                 queryClient.invalidateQueries({ queryKey: ['product', productId] } as InvalidateQueryFilters);
                 queryClient.invalidateQueries({ queryKey: ['featuresWithValues', { product_id: productId }] } as InvalidateQueryFilters); // Si hook getFeaturesWithValues existe
             }
             logger.info("Multiple features/values updated via mutation", { productId });
         },
         onError: (error) => { logger.error({ error }, "Failed multiple features/values update via mutation"); }
     });
};

// Hook pour récupérer les features d'un produit (avec ou sans valeurs)
// Note: Adapte selon si tu préfères un hook séparé ou un booléen dans getFeatures
type FeatureFilterType = { feature_id?: string, product_id?: string };
export const useGetFeatures = (filter: FeatureFilterType = {}, options: { enabled?: boolean } = {}): UseQueryResult<ListType<FeatureInterface>, ApiError> => {
     const api = useApi();
     return useQuery<ListType<FeatureInterface>, ApiError>({
         queryKey: ['features', filter],
         queryFn: () => api.getFeatures(filter),
         enabled: options.enabled !== undefined ? options.enabled : true,
     });
};
export const useGetFeaturesWithValues = (filter: FeatureFilterType = {}, options: { enabled?: boolean } = {}): UseQueryResult<FeatureInterface[], ApiError> => {
     const api = useApi();
     return useQuery<FeatureInterface[], ApiError>({
         queryKey: ['featuresWithValues', filter],
         queryFn: () => api.getFeaturesWithValues(filter),
         enabled: options.enabled !== undefined ? options.enabled : true,
     });
};

// Ajouter useCreateFeature, useUpdateFeature, useDeleteFeature si nécessaire

// Ajouter useCreateValue, useUpdateValue, useDeleteValue si nécessaire


// ========================
// == Détails Produit ==
// ========================

// Hook pour récupérer les détails d'un produit
type DetailFilterType = { product_id?: string, detail_id?: string, page?: number, limit?: number };
export const useGetDetails = (filter: DetailFilterType = {}, options: { enabled?: boolean } = {}): UseQueryResult<ListType<DetailInterface>, ApiError> => {
    const api = useApi();
    return useQuery<ListType<DetailInterface>, ApiError>({
        queryKey: ['details', filter],
        queryFn: () => api.getDetails(filter),
        enabled: options.enabled !== undefined ? options.enabled : true,
    });
};

// Hook pour créer un détail
export const useCreateDetail = (): UseMutationResult<{ message: string, detail: DetailInterface }, ApiError, FormData> => {
    const api = useApi();
    return useMutation< { message: string, detail: DetailInterface }, ApiError, FormData>({
        mutationFn: (formData) => api.createDetail(formData),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['details', { product_id: data.detail.product_id }] } as InvalidateQueryFilters);
            logger.info("Detail created via mutation", data.detail);
        },
        onError: (error) => { logger.error({ error }, "Failed to create detail via mutation"); }
    });
};

// Hook pour mettre à jour un détail
export const useUpdateDetail = (): UseMutationResult<{ message: string, detail: DetailInterface }, ApiError, { detailId: string, formData: FormData }> => {
    const api = useApi();
    return useMutation< { message: string, detail: DetailInterface }, ApiError, { detailId: string, formData: FormData }>({
        mutationFn: ({ detailId, formData }) => api.updateDetail(detailId, formData),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['details', { product_id: data.detail.product_id }] } as InvalidateQueryFilters);
             queryClient.invalidateQueries({ queryKey: ['details', { detail_id: data.detail.id }] } as InvalidateQueryFilters); // Invalider par ID aussi
            logger.info("Detail updated via mutation", data.detail);
        },
        onError: (error) => { logger.error({ error }, "Failed to update detail via mutation"); }
    });
};

// Hook pour supprimer un détail
export const useDeleteDetail = (): UseMutationResult<{ message: string, isDeleted: boolean }, ApiError, string> => {
    const api = useApi();
    return useMutation<{ message: string, isDeleted: boolean }, ApiError, string>({ // string = detailId
        mutationFn: (detailId) => api.deleteDetail(detailId),
         onSuccess: (data, detailId) => {
             // Difficile de savoir le product_id ici pour invalider la liste, on invalide toutes les listes de détails
             queryClient.invalidateQueries({ queryKey: ['details'] } as InvalidateQueryFilters);
             queryClient.removeQueries({ queryKey: ['details', { detail_id: detailId }] }); // Supprimer du cache détail
             logger.info("Detail deleted via mutation", { detailId });
        },
        onError: (error) => { logger.error({ error }, "Failed to delete detail via mutation"); }
    });
};

// --- Fin Partie 1/3 ---

// src/api/ReactSublymusApi.tsx
// ... (imports, client, context, provider, useApi, et hooks précédents inchangés) ...

// ========================
// == Commandes ==
// ========================

// Hook pour créer une commande
// Le type pour 'data' doit correspondre aux champs attendus par createOrder dans SublymusApi
type CreateOrderInput = Omit<CommandInterface, 'id' | 'user_id' | 'reference' | 'status' | 'payment_status' | 'payment_method' | 'currency' | 'total_price' | 'items_count' | 'events_status' | 'created_at' | 'updated_at' | 'items' | 'user' >;
export const useCreateOrder = (): UseMutationResult<{ message: string, order: CommandInterface }, ApiError, CreateOrderInput> => {
    const api = useApi();
    return useMutation< { message: string, order: CommandInterface }, ApiError, CreateOrderInput>({
        mutationFn: (data) => api.createOrder(data),
        onSuccess: (data) => {
            // Invalider la liste des commandes de l'utilisateur ET potentiellement la liste admin
            queryClient.invalidateQueries({ queryKey: ['myOrders'] } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: ['allOrders'] } as InvalidateQueryFilters);
            // Vider le cache du panier après succès commande
            queryClient.invalidateQueries({ queryKey: ['cart'] } as InvalidateQueryFilters);
            logger.info("Order created via mutation", data.order);
        },
        onError: (error) => { logger.error({ error }, "Failed to create order via mutation"); }
    });
};

// Hook pour récupérer les commandes de l'utilisateur connecté
type MyOrdersFilterType = { order_by?: string, page?: number, limit?: number };
export const useGetMyOrders = (filter: MyOrdersFilterType = {}, options: { enabled?: boolean } = {}): UseQueryResult<ListType<CommandInterface>, ApiError> => {
    const api = useApi();
    return useQuery<ListType<CommandInterface>, ApiError>({
        queryKey: ['myOrders', filter], // Clé spécifique pour les commandes de l'utilisateur
        queryFn: () => api.getMyOrders(filter),
        enabled: options.enabled !== undefined ? options.enabled : true,
    });
};

// Hook pour récupérer les commandes (Admin/Collab) - useGetAllOrders déjà défini précédemment

// Hook pour récupérer les détails d'UNE commande (Admin/Collab)
export const useGetOrderDetails = (orderId: string | undefined, options: { enabled?: boolean } = {}): UseQueryResult<CommandInterface | null, ApiError> => {
    const api = useApi();
    // Utilise le même endpoint que getAllOrders mais avec un ID et with_items=true
    const filter: CommandFilterType = { command_id: orderId, with_items: true };
    return useQuery<CommandInterface | null, ApiError>({
        queryKey: ['orderDetails', orderId],
        queryFn: async () => {
            if (!orderId) return null;
            const result = await api.getAllOrders(filter);
            return result?.list?.[0] ?? null;
        },
         enabled: !!orderId && (options.enabled !== undefined ? options.enabled : true),
         staleTime: 10 * 60 * 1000, // Cache plus long pour les détails
    });
};


// Hook pour mettre à jour le statut (Admin/Collab) - useUpdateOrderStatus déjà défini précédemment

// Hook pour supprimer une commande (Admin/Collab)
export const useDeleteOrder = (): UseMutationResult<{ message: string, isDeleted: boolean }, ApiError, string> => {
    const api = useApi();
    return useMutation<{ message: string, isDeleted: boolean }, ApiError, string>({ // string = orderId
        mutationFn: (orderId) => api.deleteOrder(orderId),
         onSuccess: (data, orderId) => {
             // Invalider les listes ET supprimer le détail du cache
             queryClient.invalidateQueries({ queryKey: ['myOrders'] } as InvalidateQueryFilters);
             queryClient.invalidateQueries({ queryKey: ['allOrders'] } as InvalidateQueryFilters);
             queryClient.removeQueries({ queryKey: ['orderDetails', orderId] });
             logger.info("Order deleted via mutation", { orderId });
         },
         onError: (error) => { logger.error({ error }, "Failed to delete order via mutation"); }
    });
};

// ========================
// == Panier ==
// ========================

// Hook pour voir le panier (utilisateur connecté ou invité)
type CartResponseType = { cart: any, total: number }; // Utiliser any pour cart car la structure peut varier légèrement
export const useViewCart = (options: { enabled?: boolean } = {}): UseQueryResult<CartResponseType, ApiError> => {
    const api = useApi();
    return useQuery<CartResponseType, ApiError>({
        queryKey: ['cart'], // Clé unique pour le panier courant
        queryFn: () => api.viewCart(),
         enabled: options.enabled !== undefined ? options.enabled : true,
         staleTime: 1 * 60 * 1000, // Cache plus court pour le panier (1 min)
    });
};

// Hook pour mettre à jour le panier
type UpdateCartInput = { product_id: string, mode: string, value?: number, bind?: Record<string, any>, ignoreStock?: boolean };
type UpdateCartResponseType = { message: string, cart: any, updatedItem: any, total: number, action: string };
export const useUpdateCart = (): UseMutationResult<UpdateCartResponseType, ApiError, UpdateCartInput> => {
    const api = useApi();
    return useMutation<UpdateCartResponseType, ApiError, UpdateCartInput>({
        mutationFn: (data) => api.updateCart(data),
        onSuccess: (data) => {
            // Mettre à jour directement le cache du panier avec la nouvelle valeur
            queryClient.setQueryData(['cart'], { cart: data.cart, total: data.total });
            logger.info("Cart updated via mutation", { action: data.action });
        },
         onError: (error) => { logger.error({ error }, "Failed to update cart via mutation"); }
    });
};

// Hook pour fusionner les paniers au login
export const useMergeCart = (): UseMutationResult<any, ApiError, void> => { // Type retour à affiner
    const api = useApi();
    return useMutation<any, ApiError, void>({
        mutationFn: () => api.mergeCartOnLogin(),
         onSuccess: (data) => {
             // Mettre à jour le cache du panier avec le panier fusionné retourné par l'API
             if (data.cart) {
                 queryClient.setQueryData(['cart'], { cart: data.cart, total: data.total });
             } else {
                 // Si aucun panier retourné (ex: pas de panier invité), invalider pour re-fetch
                 queryClient.invalidateQueries({ queryKey: ['cart'] } as InvalidateQueryFilters);
             }
             logger.info("Carts merged via mutation");
        },
         onError: (error) => { logger.error({ error }, "Failed to merge carts via mutation"); }
    });
};

// ========================
// == Commentaires ==
// ========================

// Hook pour créer un commentaire
export const useCreateComment = (): UseMutationResult<{ message: string, comment: CommentInterface }, ApiError, FormData> => {
    const api = useApi();
    return useMutation< { message: string, comment: CommentInterface }, ApiError, FormData>({
        mutationFn: (formData) => api.createComment(formData),
        onSuccess: (data) => {
            // Invalider la liste des commentaires pour le produit concerné
            queryClient.invalidateQueries({ queryKey: ['comments', { product_id: data.comment.product_id }] } as InvalidateQueryFilters);
            // Invalider la query getComment pour cet orderItemId s'il existe
            queryClient.invalidateQueries({ queryKey: ['comment', data.comment.order_item_id] } as InvalidateQueryFilters);
            logger.info("Comment created via mutation", data.comment);
        },
        onError: (error) => { logger.error({ error }, "Failed to create comment via mutation"); }
    });
};

// Hook pour récupérer le commentaire d'un order_item
export const useGetCommentForOrderItem = (orderItemId: string | undefined, options: { enabled?: boolean } = {}): UseQueryResult<CommentInterface | null, ApiError> => {
     const api = useApi();
     return useQuery<CommentInterface | null, ApiError>({
         queryKey: ['comment', orderItemId],
         queryFn: () => orderItemId ? api.getCommentForOrderItem(orderItemId) : Promise.resolve(null),
         enabled: !!orderItemId && (options.enabled !== undefined ? options.enabled : true),
     });
};

// Hook pour récupérer la liste des commentaires (ex: pour un produit)
type CommentFilterType = { order_by?: string, page?: number, limit?: number, comment_id?: string, product_id?: string, with_users?: boolean };
export const useGetComments = (filter: CommentFilterType = {}, options: { enabled?: boolean } = {}): UseQueryResult<ListType<CommentInterface>, ApiError> => {
     const api = useApi();
     return useQuery<ListType<CommentInterface>, ApiError>({
         queryKey: ['comments', filter],
         queryFn: () => api.getComments(filter),
         enabled: options.enabled !== undefined ? options.enabled : true,
     });
};

// Hook pour mettre à jour un commentaire
export const useUpdateComment = (): UseMutationResult<{ message: string, comment: CommentInterface }, ApiError, FormData> => {
    const api = useApi();
    return useMutation< { message: string, comment: CommentInterface }, ApiError, FormData>({
        mutationFn: (formData) => api.updateComment(formData),
         onSuccess: (data, formData) => {
             const commentId = formData.get('comment_id') as string;
             // Invalider les listes et le détail
             queryClient.invalidateQueries({ queryKey: ['comments'] } as InvalidateQueryFilters); // Invalider toutes les listes par simplicité
             if (commentId) {
                 queryClient.invalidateQueries({ queryKey: ['comment', commentId] } as InvalidateQueryFilters); // Si getCommentById existe
                 queryClient.invalidateQueries({ queryKey: ['comment', data.comment.order_item_id] } as InvalidateQueryFilters); // Invalider par orderItemId
             }
             logger.info("Comment updated via mutation", data.comment);
        },
        onError: (error) => { logger.error({ error }, "Failed to update comment via mutation"); }
    });
};

// Hook pour supprimer un commentaire
export const useDeleteComment = (): UseMutationResult<{ message: string }, ApiError, string> => {
    const api = useApi();
    // Gardons une référence à l'ancien commentaire pour l'invalidation après suppression
    let deletedCommentData: CommentInterface | null = null;
    return useMutation<{ message: string }, ApiError, string>({ // string = commentId
         onMutate: async (commentId) => {
             // Essayer de récupérer les données du commentaire avant suppression
             try {
                deletedCommentData = await queryClient.fetchQuery<CommentInterface | null>({ queryKey: ['comment', commentId]});
             } catch {
                 // Ignorer si le commentaire n'était pas dans le cache
             }
         },
        mutationFn: (commentId) => api.deleteComment(commentId),
         onSuccess: (data, commentId) => {
             // Invalider les listes
             queryClient.invalidateQueries({ queryKey: ['comments'] } as InvalidateQueryFilters);
             // Supprimer le détail du cache
             queryClient.removeQueries({ queryKey: ['comment', commentId] });
             if (deletedCommentData?.order_item_id) {
                 queryClient.removeQueries({ queryKey: ['comment', deletedCommentData.order_item_id] });
             }
             logger.info("Comment deleted via mutation", { commentId });
         },
         onError: (error) => { logger.error({ error }, "Failed to delete comment via mutation"); },
         onSettled: () => { deletedCommentData = null; } // Nettoyer
    });
};

// ========================
// == Favoris ==
// ========================
type FavoriteWithProduct = Favorite & { product: ProductInterface };

// Hook pour ajouter un favori
export const useAddFavorite = (): UseMutationResult<any, ApiError, string> => { // string = productId
    const api = useApi();
    return useMutation<any, ApiError, string>({
        mutationFn: (productId) => api.addFavorite(productId),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['favorites'] } as InvalidateQueryFilters);
            logger.info("Favorite added via mutation", data);
        },
        onError: (error) => { logger.error({ error }, "Failed to add favorite via mutation"); }
    });
};

// Hook pour récupérer les favoris de l'utilisateur
type FavoriteFilterType = { page?: number, limit?: number, order_by?: string, label?: string, product_id?: string };
export const useGetFavorites = (filter: FavoriteFilterType = {}, options: { enabled?: boolean } = {}): UseQueryResult<ListType<FavoriteWithProduct>, ApiError> => {
    const api = useApi();
    return useQuery<ListType<FavoriteWithProduct>, ApiError>({
        queryKey: ['favorites', filter],
        queryFn: () => api.getFavorites(filter),
        enabled: options.enabled !== undefined ? options.enabled : true,
    });
};

// Hook pour mettre à jour un favori (le label)
export const useUpdateFavorite = (): UseMutationResult<Favorite, ApiError, { favoriteId: string, label: string }> => {
    const api = useApi();
    return useMutation<Favorite, ApiError, { favoriteId: string, label: string }>({
        mutationFn: ({ favoriteId, label }) => api.updateFavorite(favoriteId, label),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['favorites'] } as InvalidateQueryFilters);
            logger.info("Favorite updated via mutation", data);
        },
         onError: (error) => { logger.error({ error }, "Failed to update favorite via mutation"); }
    });
};

// Hook pour supprimer un favori
export const useRemoveFavorite = (): UseMutationResult<{ message: string, isDeleted: boolean }, ApiError, string> => {
    const api = useApi();
    return useMutation<{ message: string, isDeleted: boolean }, ApiError, string>({ // string = favoriteId
        mutationFn: (favoriteId) => api.removeFavorite(favoriteId),
         onSuccess: (data, favoriteId) => {
             queryClient.invalidateQueries({ queryKey: ['favorites'] } as InvalidateQueryFilters);
             logger.info("Favorite removed via mutation", { favoriteId });
         },
         onError: (error) => { logger.error({ error }, "Failed to remove favorite via mutation"); }
    });
};


// --- Fin Partie 2/3 ---

// src/api/ReactSublymusApi.tsx
// ... (imports, client, context, provider, useApi, et hooks précédents inchangés) ...

// ==============================
// == Adresses Utilisateur ==
// ==============================
type AddressType = any; // Utiliser le vrai type UserAddressInterface si disponible

// Hook pour créer une adresse
type CreateAddressInput = { name: string, longitude: number, latitude: number };
export const useCreateUserAddress = (): UseMutationResult<{ message: string, address: AddressType }, ApiError, CreateAddressInput> => {
    const api = useApi();
    return useMutation< { message: string, address: AddressType }, ApiError, CreateAddressInput>({
        mutationFn: (data) => api.createUserAddress(data),
        onSuccess: (data) => {
            // Invalider la liste des adresses de l'utilisateur ('me' ou une query dédiée)
            queryClient.invalidateQueries({ queryKey: ['userAddresses'] } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: ['me'] } as InvalidateQueryFilters); // 'me' contient les adresses
            logger.info("User address created via mutation", data.address);
        },
        onError: (error) => { logger.error({ error }, "Failed to create user address via mutation"); }
    });
};

// Hook pour récupérer les adresses de l'utilisateur
export const useGetUserAddresses = (options: { enabled?: boolean } = {}): UseQueryResult<AddressType[], ApiError> => {
    const api = useApi();
    return useQuery<AddressType[], ApiError>({
        queryKey: ['userAddresses'], // Clé spécifique pour les adresses de l'user courant
        queryFn: () => api.getUserAddresses(), // Sans ID, retourne toutes les adresses de l'user auth
        enabled: options.enabled !== undefined ? options.enabled : true,
    });
};

// Hook pour récupérer UNE adresse de l'utilisateur par ID
export const useGetUserAddressById = (addressId: string | undefined, options: { enabled?: boolean } = {}): UseQueryResult<AddressType | null, ApiError> => {
    const api = useApi();
    return useQuery<AddressType | null, ApiError>({
        queryKey: ['userAddress', addressId],
        queryFn: async () => {
             if (!addressId) return null;
             // getUserAddresses renvoie un tableau, même pour un ID, prendre le premier
             const addresses = await api.getUserAddresses(addressId);
             return addresses?.[0] ?? null;
        },
         enabled: !!addressId && (options.enabled !== undefined ? options.enabled : true),
    });
};


// Hook pour mettre à jour une adresse
type UpdateAddressInput = { id: string, name?: string, longitude?: number, latitude?: number };
export const useUpdateUserAddress = (): UseMutationResult<{ message: string, address: AddressType }, ApiError, UpdateAddressInput> => {
    const api = useApi();
    return useMutation< { message: string, address: AddressType }, ApiError, UpdateAddressInput>({
        mutationFn: (data) => api.updateUserAddress(data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['userAddresses'] } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: ['userAddress', data.address.id] } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: ['me'] } as InvalidateQueryFilters);
            logger.info("User address updated via mutation", data.address);
        },
        onError: (error) => { logger.error({ error }, "Failed to update user address via mutation"); }
    });
};

// Hook pour supprimer une adresse
export const useDeleteUserAddress = (): UseMutationResult<null, ApiError, string> => {
    const api = useApi();
    return useMutation<null, ApiError, string>({ // string = addressId
        mutationFn: (addressId) => api.deleteUserAddress(addressId),
        onSuccess: (data, addressId) => {
             queryClient.invalidateQueries({ queryKey: ['userAddresses'] } as InvalidateQueryFilters);
             queryClient.removeQueries({ queryKey: ['userAddress', addressId] });
             queryClient.invalidateQueries({ queryKey: ['me'] } as InvalidateQueryFilters);
             logger.info("User address deleted via mutation", { addressId });
        },
        onError: (error) => { logger.error({ error }, "Failed to delete user address via mutation"); }
    });
};

// ==============================
// == Téléphones Utilisateur == (Ajouter les méthodes dans SublymusApi d'abord si nécessaire)
// ==============================
// type PhoneType = any; // Vrai type UserPhoneInterface
// type CreatePhoneInput = { phone_number: string, format?: string, country_code?: string };
// type UpdatePhoneInput = { id: string, phone_number?: string, format?: string, country_code?: string };

// export const useCreateUserPhone = (): UseMutationResult<{ message: string, phone: PhoneType }, ApiError, CreatePhoneInput> => { ... }
// export const useGetUserPhones = (options?) => useQuery(...)
// export const useUpdateUserPhone = (): UseMutationResult<{ message: string, phone: PhoneType }, ApiError, UpdatePhoneInput> => { ... }
// export const useDeleteUserPhone = (): UseMutationResult<null, ApiError, string> => { ... }

// ========================
// == Clients (Users) ==
// ========================

// Hook pour récupérer la liste des utilisateurs (clients/collaborateurs)
export const useGetUsers = (filter: UserFilterType = {}, options: { enabled?: boolean } = {}): UseQueryResult<ListType<UserInterface>, ApiError> => {
    const api = useApi();
    return useQuery<ListType<UserInterface>, ApiError>({
        queryKey: ['users', filter],
        queryFn: () => api.getUsers(filter),
        enabled: options.enabled !== undefined ? options.enabled : true,
    });
};

// Ajouter useDeleteUser si une route admin existe pour cela (différent de deleteAccount)

// ========================
// == Collaborateurs (Roles) ==
// ========================
type CollaboratorType = Role & { user: UserInterface }; // Type combiné

// Hook pour récupérer la liste des collaborateurs
type CollaboratorFilterType = { page?: number, limit?: number };
export const useGetCollaborators = (filter: CollaboratorFilterType = {}, options: { enabled?: boolean } = {}): UseQueryResult<ListType<CollaboratorType>, ApiError> => {
    const api = useApi();
    return useQuery<ListType<CollaboratorType>, ApiError>({
        queryKey: ['collaborators', filter],
        queryFn: () => api.getCollaborators(filter),
        enabled: options.enabled !== undefined ? options.enabled : true,
    });
};

// Hook pour créer un collaborateur
export const useCreateCollaborator = (): UseMutationResult<{ message: string, role: CollaboratorType }, ApiError, string> => { // string = email
    const api = useApi();
    return useMutation< { message: string, role: CollaboratorType }, ApiError, string>({
        mutationFn: (email) => api.createCollaborator(email),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['collaborators'] } as InvalidateQueryFilters);
            logger.info("Collaborator created via mutation", data.role);
        },
        onError: (error) => { logger.error({ error }, "Failed to create collaborator via mutation"); }
    });
};

// Hook pour mettre à jour les permissions d'un collaborateur
type UpdatePermsInput = { userId: string, permissions: Partial<TypeJsonRole> };
export const useUpdateCollaboratorPermissions = (): UseMutationResult<{ message: string, role: CollaboratorType }, ApiError, UpdatePermsInput> => {
    const api = useApi();
    return useMutation< { message: string, role: CollaboratorType }, ApiError, UpdatePermsInput>({
        mutationFn: ({ userId, permissions }) => api.updateCollaboratorPermissions(userId, permissions),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['collaborators'] } as InvalidateQueryFilters);
            logger.info("Collaborator permissions updated via mutation", data.role);
        },
        onError: (error) => { logger.error({ error }, "Failed to update collaborator permissions via mutation"); }
    });
};

// Hook pour supprimer un collaborateur
export const useRemoveCollaborator = (): UseMutationResult<{ message: string, isDeleted: boolean }, ApiError, string> => {
    const api = useApi();
    return useMutation<{ message: string, isDeleted: boolean }, ApiError, string>({ // string = userId
        mutationFn: (userId) => api.removeCollaborator(userId),
         onSuccess: (data, userId) => {
             queryClient.invalidateQueries({ queryKey: ['collaborators'] } as InvalidateQueryFilters);
             logger.info("Collaborator removed via mutation", { userId });
         },
         onError: (error) => { logger.error({ error }, "Failed to remove collaborator via mutation"); }
    });
};

// ========================
// == Inventaires ==
// ========================
type InventoryType = Inventory; // Utiliser le type Inventory directement

// Hook pour récupérer les inventaires
type InventoryFilterType = { inventory_id?: string, page?: number, limit?: number };
export const useGetInventories = (filter: InventoryFilterType = {}, options: { enabled?: boolean } = {}): UseQueryResult<ListType<InventoryType> | InventoryType, ApiError> => {
    // Le type de retour dépend si un ID est fourni ou non
    const api = useApi();
    return useQuery<ListType<InventoryType> | InventoryType, ApiError>({
        queryKey: ['inventories', filter],
        queryFn: async () => {
            const result = await api.getInventories(filter);
            // Si un ID était dans le filtre et qu'on a reçu une liste, prendre le premier élément
            // Note: L'API actuelle renvoie déjà l'objet unique si ID fourni.
            return result;
        },
         enabled: options.enabled !== undefined ? options.enabled : true,
    });
};


// Hook pour créer un inventaire
export const useCreateInventory = (): UseMutationResult<{ message: string, inventory: InventoryType }, ApiError, FormData> => {
    const api = useApi();
    return useMutation< { message: string, inventory: InventoryType }, ApiError, FormData>({
        mutationFn: (formData) => api.createInventory(formData),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['inventories'] } as InvalidateQueryFilters);
            logger.info("Inventory created via mutation", data.inventory);
        },
        onError: (error) => { logger.error({ error }, "Failed to create inventory via mutation"); }
    });
};

// Hook pour mettre à jour un inventaire
export const useUpdateInventory = (): UseMutationResult<{ message: string, inventory: InventoryType }, ApiError, { inventoryId: string, formData: FormData }> => {
    const api = useApi();
    return useMutation< { message: string, inventory: InventoryType }, ApiError, { inventoryId: string, formData: FormData }>({
        mutationFn: ({ inventoryId, formData }) => api.updateInventory(inventoryId, formData),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['inventories'] } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: ['inventories', { inventory_id: variables.inventoryId }] } as InvalidateQueryFilters);
            logger.info("Inventory updated via mutation", data.inventory);
        },
        onError: (error) => { logger.error({ error }, "Failed to update inventory via mutation"); }
    });
};

// Hook pour supprimer un inventaire
export const useDeleteInventory = (): UseMutationResult<{ message: string, isDeleted: boolean }, ApiError, string> => {
    const api = useApi();
    return useMutation<{ message: string, isDeleted: boolean }, ApiError, string>({ // string = inventoryId
        mutationFn: (inventoryId) => api.deleteInventory(inventoryId),
         onSuccess: (data, inventoryId) => {
             queryClient.invalidateQueries({ queryKey: ['inventories'] } as InvalidateQueryFilters);
             queryClient.removeQueries({ queryKey: ['inventories', { inventory_id: inventoryId }] });
             logger.info("Inventory deleted via mutation", { inventoryId });
         },
         onError: (error) => { logger.error({ error }, "Failed to delete inventory via mutation"); }
    });
};

// ========================
// == Statistiques ==
// ========================

export const useGetStats = (params: StatParamType = {}, options: { enabled?: boolean } = {}): UseQueryResult<StatsData, ApiError> => {
    const api = useApi();
    return useQuery<StatsData, ApiError>({
        queryKey: ['stats', params],
        queryFn: () => api.getStats(params),
        enabled: options.enabled !== undefined ? options.enabled : true,
    });
};

// ========================
// == Recherche Globale ==
// ========================

export const useGlobalSearch = (text: string | undefined, options: { enabled?: boolean } = {}): UseQueryResult<GlobalSearchType, ApiError> => {
    const api = useApi();
    // Utiliser text comme partie de la queryKey, debounce peut être géré au niveau du composant appelant
    return useQuery<GlobalSearchType, ApiError>({
        queryKey: ['globalSearch', text],
        queryFn: () => text ? api.globalSearch(text) : Promise.resolve({ products: [], categories: [], clients: [], commands: [] }), // Ne fetch que si text existe
        enabled: !!text && (options.enabled !== undefined ? options.enabled : true),
        staleTime: 1 * 60 * 1000, // Cache court pour la recherche
    });
};

// ========================
// == Debug ==
// ========================

export const useRequestScaleUp = (): UseMutationResult<{ message: string, jobId: string }, ApiError, void> => {
    const api = useApi();
    return useMutation<{ message: string, jobId: string }, ApiError, void>({
        mutationFn: () => api.requestScaleUp(),
        onSuccess: (data) => { logger.info("Scale Up requested via mutation", data); },
        onError: (error) => { logger.error({ error }, "Scale Up request failed via mutation"); }
    });
};

export const useRequestScaleDown = (): UseMutationResult<{ message: string, jobId: string }, ApiError, void> => {
    const api = useApi();
    return useMutation<{ message: string, jobId: string }, ApiError, void>({
        mutationFn: () => api.requestScaleDown(),
         onSuccess: (data) => { logger.info("Scale Down requested via mutation", data); },
         onError: (error) => { logger.error({ error }, "Scale Down request failed via mutation"); }
    });
};


// --- Fin de ReactSublymusApi.tsx ---