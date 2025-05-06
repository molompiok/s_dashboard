// src/api/SublymusApi.ts

import {  OrderStatus } from '../Components/Utils/constants'; // Ajuster chemin si besoin
import type {
    ListType, ProductInterface, CategoryInterface, UserInterface, StoreInterface,
    CommandInterface, CommentInterface, DetailInterface, Inventory, Role, FavoriteInteraface,
    FilterType, CommandFilterType, UserFilterType, GlobalSearchType, StatsData,
    StatParamType, EventStatus, FeatureInterface, TypeJsonRole, ValueInterface
} from '../Interfaces/Interfaces';
import logger from './Logger'; 

// --- Types Génériques pour Réponses API ---
export type ApiSuccessResponse<T, Key extends string = 'data'> = {
    message?: string;
    error?: never;
    status?: number;
  } & {
    [K in Key]?: T;
  };

  export type BuildFormDataForFeaturesValuesParam = { product_id: string, currentFeatures: Partial<FeatureInterface>[], initialFeatures: Partial<FeatureInterface>[] }


// Type de base pour une réponse d'erreur
export type ApiErrorResponse = {
    message: string;   // Message d'erreur obligatoire
    data?: never;      // Pas de données en cas d'erreur
    error: string | object | null; // Détail de l'erreur (peut être string ou objet d'erreurs validation)
    status: number;     // Statut HTTP
}

// Type combiné pour le retour des méthodes (peut être succès ou erreur)
// Rend la gestion côté hook/composant plus simple (vérifier si 'error' existe)
export type ApiResponse<T,K extends string ='data'> = ApiSuccessResponse<T,K> | ApiErrorResponse;
// NOTE: On va plutôt utiliser ApiError pour les erreurs et T pour le succès

// --- Types Spécifiques aux Endpoints ---

// Auth
export type LoginParams = { email: string; password: string };
export type LoginResponse = { user: UserInterface, token: string, expires_at: string };
export type RegisterParams = { full_name: string; email: string; password: string; password_confirmation: string };
export type RegisterResponse = { user_id: string }; // L'API retourne juste l'ID
export type VerifyEmailParams = { token: string };
export type ResendVerificationParams = { email: string };
export type UpdateUserParams = { full_name?: string; password?: string; password_confirmation?: string };
export type UpdateUserResponse = { user: UserInterface }; // L'API retourne l'utilisateur mis à jour
export type GetMeResponse = { user: UserInterface & { addresses: any[], phone_numbers: any[] } }; // Type détaillé pour /me
// Catégories
export type GetCategoriesParams = {
    categories_id?: string[];
    search?: string;
    slug?: string;
    order_by?: string; // Utiliser CategorySortOptions si défini
    page?: number;
    limit?: number;
    category_id?: string;
    with_product_count?: boolean;
};
export type GetCategoriesResponse = ListType<CategoryInterface>; // L'API retourne une liste paginée
export type GetCategoryResponse = CategoryInterface | null; // Pour GET par ID/Slug
export type CreateCategoryParams = Partial<CategoryInterface>; // Accepte l'objet catégorie
export type CreateCategoryResponse = { message: string, category: CategoryInterface };
export type UpdateCategoryParams = Partial<CategoryInterface> & { category_id: string }; // ID requis
export type UpdateCategoryResponse = { message: string, category: CategoryInterface };
export type DeleteCategoryResponse = { message: string, isDeleted: boolean };
export type GetSubCategoriesParams = { category_id: string };
export type GetSubCategoriesResponse = CategoryInterface[];
export type GetCategoryFiltersParams = { slug?: string };
export type GetCategoryFiltersResponse = any[]; // Type à affiner

// Features & Values
export type GetFeaturesParams = { feature_id?: string, product_id?: string };
export type GetFeaturesResponse = ListType<FeatureInterface>; // L'API retourne une liste (paginate?)
export type GetFeaturesWithValuesParams = { feature_id?: string, product_id?: string };
export type GetFeaturesWithValuesResponse = FeatureInterface[]; // Retourne un tableau direct
// Types pour create/update/delete Feature si nécessaire (non implémenté car multipleUpdate est prioritaire)
export type MultipleUpdateFeaturesValuesParams = { product_id: string, currentFeatures: Partial<FeatureInterface>[], initialFeatures: Partial<FeatureInterface>[] };
export type MultipleUpdateFeaturesValuesResponse = { message: string, product?: ProductInterface }; // Retourne le produit mis à jour

// Détails Produit
export type GetDetailsParams = { product_id?: string, detail_id?: string, page?: number, limit?: number, order_by?: string };
export type GetDetailsResponse = ListType<DetailInterface>; // L'API retourne une liste paginée
export type GetDetailResponse = DetailInterface | null; // Pour GET par ID
export type CreateDetailParams = Partial<DetailInterface> & { product_id: string }; // product_id requis
export type CreateDetailResponse = { message: string, detail: DetailInterface };
export type UpdateDetailParams = Partial<DetailInterface> & { detail_id: string }; // ID requis
export type UpdateDetailResponse = { message: string, detail: DetailInterface };
export type DeleteDetailResponse = { message: string, isDeleted: boolean };

// Commandes
export type CreateOrderParams = Omit<CommandInterface, 'id' | 'user_id' | 'reference' | 'status' | 'payment_status' | 'payment_method' | 'currency' | 'total_price' | 'items_count' | 'events_status' | 'created_at' | 'updated_at' | 'items' | 'user' >;
export type CreateOrderResponse = { message: string, order: CommandInterface };
export type GetMyOrdersParams = { order_by?: string; page?: number; limit?: number; };
export type GetMyOrdersResponse = ListType<CommandInterface>;
// GetAllOrdersParams = CommandFilterType (défini dans Interfaces)
export type GetAllOrdersResponse = ListType<CommandInterface>;
export type UpdateOrderStatusParams = { user_order_id: string, status: OrderStatus, message?: string, estimated_duration?: number };
export type UpdateOrderStatusResponse = { message: string, order: CommandInterface };
export type DeleteOrderResponse = { message: string, isDeleted: boolean };

// Panier
export type UpdateCartParams = { product_id: string, mode: string, value?: number, bind?: Record<string, any>, ignoreStock?: boolean };
export type UpdateCartResponse = { message: string, cart: any, updatedItem: any, total: number, action: string }; // Types 'any' à affiner si possible
export type ViewCartResponse = { cart: any, total: number }; // Types 'any' à affiner
export type MergeCartResponse = any; // Type à affiner
export type FilesObjectType = Record<string,(string|Blob)[]>
//  Products
export type GetProductsParams = FilterType;
export type GetProductsResponse = ListType<ProductInterface>;
export type CreateProductParams = {product:Partial<ProductInterface>,views:FilesObjectType}; // Accepte l'objet produit
export type CreateProductResponse = { message: string, product: ProductInterface };
export type UpdateProductParams = Partial<ProductInterface> & { product_id: string }; // ID requis
export type UpdateProductResponse = { message: string, product?: Partial<ProductInterface> };
export type DeleteProductResponse = MessageResponse; // Ou le type DeleteResponse
// Commentaires
export type CreateCommentParams = { order_item_id: string, title: string, description?: string, rating: number }; // Données texte
export type CreateCommentResponse = { message: string, comment: CommentInterface };
export type GetCommentForOrderItemParams = { order_item_id: string };
export type GetCommentForOrderItemResponse = CommentInterface | null;
export type GetCommentsParams = { order_by?: string, page?: number, limit?: number, comment_id?: string, product_id?: string, with_users?: boolean };
export type GetCommentsResponse = ListType<CommentInterface>;
export type UpdateCommentParams = { comment_id: string, title?: string, description?: string | null, rating?: number }; // Données texte
export type UpdateCommentResponse = { message: string, comment: CommentInterface };
export type DeleteCommentResponse = MessageResponse;

// Favoris
export type AddFavoriteParams = { product_id: string };
export type AddFavoriteResponse = any; // L'API retourne { favorite_id, product_name }
export type GetFavoritesParams = { page?: number, limit?: number, order_by?: string, favorite_id?: string, label?: string, product_id?: string };
export type GetFavoritesResponse = ListType<FavoriteInteraface & { product: ProductInterface }>;
export type UpdateFavoriteParams = { favorite_id: string, label: string };
export type UpdateFavoriteResponse = FavoriteInteraface; // L'API retourne le favori mis à jour
export type DeleteFavoriteResponse = { message: string, isDeleted: boolean };

// UserProfile (Adresses & Téléphones)
export type CreateAddressParams = { name: string, longitude: number, latitude: number };
export type AddressResponse = { message?: string, address: any }; // Type 'any' à affiner
export type GetAddressesParams = { id?: string };
export type GetAddressesResponse = any[]; // Type 'any' à affiner
export type UpdateAddressParams = { id: string, name?: string, longitude?: number, latitude?: number };
// DeleteAddressResponse est null (204)

export type CreatePhoneParams = { phone_number: string, format?: string, country_code?: string };
export type PhoneResponse = { message?: string, phone: any }; // Type 'any' à affiner
export type GetPhonesParams = { id?: string }; // user_id est implicite
export type GetPhonesResponse = any[]; // Type 'any' à affiner
export type UpdatePhoneParams = { id: string, phone_number?: string, format?: string, country_code?: string };
// DeletePhoneResponse est null (204)

// Users (Clients/Collaborateurs)
// GetUsersParams = UserFilterType (défini dans Interfaces)
export type GetUsersResponse = ListType<UserInterface>;

// Roles (Collaborateurs)
export type GetCollaboratorsParams = { page?: number, limit?: number };
export type GetCollaboratorsResponse = ListType<Role & { user: UserInterface }>;
export type CreateCollaboratorParams = { email: string };
export type CreateCollaboratorResponse = { message: string, role: Role & { user: UserInterface } };
export type UpdateCollaboratorParams = { collaborator_user_id: string, permissions: Partial<TypeJsonRole> };
export type UpdateCollaboratorResponse = { message: string, role: Role & { user: UserInterface } };
export type RemoveCollaboratorResponse = { message: string, isDeleted: boolean };

// Inventaires
export type GetInventoriesParams = { inventory_id?: string, page?: number, limit?: number };
export type GetInventoriesResponse = ListType<Inventory>; // Ou Inventory si ID fourni
export type InventoryResponse = { message: string, inventory: Inventory }; // Pour create/update
export type CreateInventoryParams = Partial<Inventory>;
export type UpdateInventoryParams = Partial<Inventory> &{inventory_id: string}; // L'ID sera dans l'URL
export type DeleteInventoryResponse = { message: string, isDeleted: boolean };

// Statistiques
// GetStatsParams = StatParamType (défini dans Interfaces)
export type GetStatsResponse = StatsData;

// General
export type GlobalSearchParams = { text: string };
export type GlobalSearchResponse = GlobalSearchType;

// Debug
export type ScaleResponse = { message: string, jobId: string };


// Type générique pour les réponses simples avec message
export type MessageResponse = { message: string };
// Type pour réponses DELETE succès (souvent 204 ou 200 avec { isDeleted: true })
export type DeleteResponse = { message?: string, isDeleted?: boolean } | null; // null pour 204

export class ApiError extends Error {
    status: number;
    body: any; // Corps de la réponse d'erreur potentielle

    constructor(message: string, status: number, body: any = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.body = body;
    }
}
export interface SublymusApi {
    auth: AuthApiNamespace;
    products: ProductsApiNamespace;
    categories: CategoriesApiNamespace; 
    features: FeaturesApiNamespace;     
    details: DetailsApiNamespace;       
    orders: OrdersApiNamespace;         
    cart: CartApiNamespace;             
    comments: CommentsApiNamespace;     
    favorites: FavoritesApiNamespace;   
    userProfile: UserProfileApiNamespace; 
    users: UsersApiNamespace;           
    roles: RolesApiNamespace;           
    inventories: InventoriesApiNamespace; 
    stats: StatsApiNamespace;           
    general: GeneralApiNamespace;       
    debug: DebugApiNamespace;           
}
type RequestOptions = {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: HeadersInit;
    body?: any; // Peut être un objet, FormData, etc.
    params?: Record<string, any>; // Pour les query parameters
    isFormData?: boolean;
};

export class SublymusApi {
    public readonly apiUrl: string;
    public readonly getAuthToken: () => string | null;
    public readonly t: (target: string, data?: any) => string;

    constructor(apiUrl: string, getAuthToken: () => string | null, t: (target: string, data?: any) => string) {
        if (!apiUrl) {
            throw new Error(t('api.apiUrlRequired'));
        }
        this.t = t;
        this.apiUrl = apiUrl.replace(/\/$/, '');
        this.getAuthToken = getAuthToken;
        logger.info(`SublymusApi initialized with URL: ${this.apiUrl}`);

        // Initialiser les namespaces
        this.auth = new AuthApiNamespace(this);
        this.products = new ProductsApiNamespace(this);
        this.categories = new CategoriesApiNamespace(this);
        this.features = new FeaturesApiNamespace(this);
        this.details = new DetailsApiNamespace(this);
        this.orders = new OrdersApiNamespace(this);
        this.cart = new CartApiNamespace(this);
        this.comments = new CommentsApiNamespace(this);
        this.favorites = new FavoritesApiNamespace(this);
        this.userProfile = new UserProfileApiNamespace(this); // Pour adresses/téléphones
        this.users = new UsersApiNamespace(this); // Pour gestion clients/collaborateurs
        this.roles = new RolesApiNamespace(this); // Pour gestion roles/collaborateurs
        this.inventories = new InventoriesApiNamespace(this);
        this.stats = new StatsApiNamespace(this);
        this.general = new GeneralApiNamespace(this); // Pour globalSearch etc.
        this.debug = new DebugApiNamespace(this);
    }

    // Méthode de requête principale (refactorisée légèrement)
    // Accessible par les namespaces via l'instance `_api`
    public async _request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const { method = 'GET', headers = {}, body = null, params = null, isFormData = false } = options;
        const token = this.getAuthToken();
        const requestHeaders = new Headers(headers);

        if (token) requestHeaders.set('Authorization', `Bearer ${token}`);
        if (!isFormData && body) requestHeaders.set('Content-Type', 'application/json');
        requestHeaders.set('Accept', 'application/json');

        let url = `${this.apiUrl}${endpoint}`;
        if (params) {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                 if (value !== undefined && value !== null) {
                     if (Array.isArray(value)) value.forEach(v => searchParams.append(key, String(v)));
                     else searchParams.set(key, String(value));
                 }
            });
            const queryString = searchParams.toString();
            if (queryString) url += `?${queryString}`;
        }

        const requestBody = body ? (isFormData ? (body as FormData) : JSON.stringify(body)) : null;
        logger.debug(`API Request: ${method} ${url}`, requestBody instanceof FormData ? '(FormData)' : requestBody);

        try {
            const response = await fetch(url, { method, headers: requestHeaders, body: requestBody });
            if (response.status === 204) {
                logger.debug(`API Response: 204 No Content`);
                return null as T;
            }
            let responseBody: any = null;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                try {
                    responseBody = await response.json();
                } catch (jsonError) {
                    if (response.ok) {
                         logger.error({ status: response.status, url, error: jsonError }, "Failed to parse JSON response for OK status");
                         throw new ApiError(this.t('api.parseError'), response.status);
                    }
                    // Ignorer l'erreur de parsing JSON si le statut HTTP est déjà une erreur
                }
            } else {
                // Essayer de lire comme texte pour le log si ce n'est pas JSON
                try { responseBody = await response.text(); } catch {}
                if (response.ok) { // Ne loguer comme warning que si status OK mais pas JSON
                     logger.warn({ status: response.status, url, nonJsonBody: String(responseBody).slice(0,100) }, "API response was not JSON");
                }
            }

            if (!response.ok) {
                const errorMessage = responseBody?.message || this.t(`api.httpError.${response.status}`, { defaultValue: response.statusText });
                throw new ApiError(errorMessage, response.status, responseBody);
            }
            
            logger.info(responseBody)
            return responseBody as T;

        } catch (error) {
            if (error instanceof ApiError) throw error;
            if (error instanceof Error) {
                logger.error({ method, url, error: error.message, stack: error.stack }, "API request failed (Network/Fetch Error)");
                throw new ApiError(this.t('api.networkError'), 0, { originalError: error.message });
            }
            logger.error({ method, url, error }, "API request failed (Unknown Error)");
            throw new ApiError(this.t('api.unknownError'), 0);
        }
    }

    public async _buildFormData({ data, files, dataFilesFelds = [] }: { dataFilesFelds?: string[], files?: Record<string, (string | Blob)[]>, data: Record<string, any> }) {
        const formData = new FormData();

        for (const [key, value] of Object.entries(data)) {
            if (dataFilesFelds.includes(key)) {
                if (Array.isArray(value)) {
                    const distinct = Math.random().toString(32)
                    let i = 0
                    for (const v of value) {
                        v && formData.append(`${distinct}:${key}_${i++}`, v);
                    }
                } else {
                    logger.warn(`le champs "${key}" doit contenir un tableau, (string|blob)[]`)
                }
            }
            if (Array.isArray(value)) {
                for (const v of value) {
                    formData.append(key, v);
                }
            } else {
                formData.append(key, value);
            }
        }

        if (files) {
            for (const [key, value] of Object.entries(files)) {
                if (Array.isArray(value)) {
                    const distinct = Math.random().toString(32)
                    let i = 0
                    for (const v of value) {
                        v && formData.append(`${distinct}:${key}_${i++}`, v);
                    }
                }
            }
        }
        return formData;
    }
   public  async _prepareMultipleFeaturesValuesData({ currentFeatures, initialFeatures, product_id }: BuildFormDataForFeaturesValuesParam) {
            if (!currentFeatures) return console.log('>>>>>>1>>>>>>>>') ?? null;
            try {
    
                let send = false;
    
                const delete_features_id: string[] = []
                const update_features: Partial<FeatureInterface>[] = []
                const create_features: Partial<FeatureInterface>[] = []
                const values: Record<string, Partial<{
                    create_values: Partial<ValueInterface>[],
                    update_values: Partial<ValueInterface>[],
                    delete_values_id: string[],
                }>> = {}
    
                const next_f: Partial<FeatureInterface>[] = []
                for (const f of currentFeatures) {
                    if (!f.id) continue
                    if (f._request_mode == 'new') {
                        create_features.push(f);
                        send = true
                    } else {
                        next_f.push(f)
                    }
                }
    
    
                for (const initial_f of initialFeatures) {
                    const current_f = (next_f || []).find(f => initial_f.id == f.id);
                    if (!current_f) {
                        initial_f.id && delete_features_id.push(initial_f.id);
                        send = true
                        continue
                    }
                    if (!current_f.id) continue
                    const next_v: Partial<ValueInterface>[] = []
                    for (const v of current_f.values || []) {
                        if (v._request_mode == 'new') {
                            if (!values[current_f.id]) values[current_f.id] = {};
                            if (!values[current_f.id].create_values) values[current_f.id].create_values = []
                            values[current_f.id].create_values?.push(v);
                            send = true
                        } else {
                            next_v.push(v)
                        }
                    }
                    console.log(currentFeatures, next_v);
                    for (const i_v of initial_f.values || []) {
                        const current_v = next_v.find(_v => _v.id == i_v.id);
                        console.log({ f_if: current_f.id, current_v, v_id: i_v.id });
    
                        if (!current_v) {
                            if (!values[current_f.id]) values[current_f.id] = {};
                            if (!values[current_f.id].delete_values_id) values[current_f.id].delete_values_id = []
                            values[current_f.id].delete_values_id?.push(i_v.id)
                            send = true
                        } else if (current_v._request_mode == 'edited') {
                            if (!values[current_f.id]) values[current_f.id] = {};
                            if (!values[current_f.id].update_values) values[current_f.id].update_values = []
                            values[current_f.id].update_values?.push(current_v);
                            send = true
                        }
                    }
                    const need_update = current_f._request_mode == 'edited'
                    if (!need_update) continue
                    update_features.push(current_f);
                    send = true
                }
                const multiple_update_features = {
                    delete_features_id: delete_features_id.length > 0 ? delete_features_id : undefined,
                    update_features: update_features.length > 0 ? update_features : undefined,
                    create_features: create_features.length > 0 ? create_features : undefined,
                    values,
                }
    
                console.log('>>>>>>>3>>>>>>>');
                if (!send) return null;
                return multiple_update_features;
    
            } catch (error) {
                console.log('>>>>>>>2>>>>>>>', error);
    
                return null
            }
        }
    // Méthode pour construire le FormData pour multipleUpdateFeaturesValues
     async _buildFormDataForFeaturesValues(data: { product_id: string, currentFeatures: Partial<FeatureInterface>[], initialFeatures: Partial<FeatureInterface>[] }): Promise<FormData | null> {
        const multipleUpdateData = this._prepareMultipleFeaturesValuesData(data);
        if (!multipleUpdateData) return null;

        const formData = new FormData();
        formData.append('product_id', data.product_id);
        formData.append('multiple_update_features', JSON.stringify(multipleUpdateData));

         // Fonction interne pour ajouter les fichiers des Values au FormData
         const processValueFiles = (value: Partial<ValueInterface>) => {
            if (!value.id) return; // Nécessite un ID pour nommage unique
             (['icon', 'views'] as const).forEach((fileKey) => {
                 const files = value[fileKey];
                 if (!Array.isArray(files)) return;

                 const pseudoPaths: string[] = [];
                 let fileIndex = 0;
                 files.forEach((fileOrUrl) => {
                      if ((fileOrUrl instanceof File) || (fileOrUrl instanceof Blob)) {
                           // C'est un nouveau fichier à uploader
                           const fieldName = `${(value.id||Math.random().toString(32)).replace('.', '')}:${fileKey}_${fileIndex++}`; // Nom unique
                           formData.append(fieldName, fileOrUrl);
                           pseudoPaths.push(fieldName); // Ajouter le pseudo-path pour le JSON
                      } else if (typeof fileOrUrl === 'string') {
                           // C'est une URL existante, la garder
                           pseudoPaths.push(fileOrUrl);
                      }
                 });
                 // Mettre à jour la propriété de la valeur avec les pseudo-chemins/URLs
                  // Attention: Mute l'objet original dans multipleUpdateData!
                value[fileKey] = pseudoPaths;
             });
         };

        // Parcourir les creates/updates pour trouver et traiter les fichiers
        Object.values((multipleUpdateData as any).values).forEach((vData: any) => {
             (vData.create_values || []).forEach(processValueFiles);
             (vData.update_values || []).forEach(processValueFiles);
        });
        ((multipleUpdateData as any).create_features || []).forEach((f: any) => {
             (f.values || []).forEach(processValueFiles);
        });

         // Mettre à jour le JSON stringifié dans FormData après traitement des fichiers
         formData.set('multiple_update_features', JSON.stringify(multipleUpdateData));

        return formData;
    }
    
    // --- Définition des Namespaces ---
    public auth: AuthApiNamespace;
    public products: ProductsApiNamespace;
    public categories: CategoriesApiNamespace;
    public features: FeaturesApiNamespace;
    public details: DetailsApiNamespace;
    public orders: OrdersApiNamespace;
    public cart: CartApiNamespace;
    public comments: CommentsApiNamespace;
    public favorites: FavoritesApiNamespace;
    public userProfile: UserProfileApiNamespace;
    public users: UsersApiNamespace;
    public roles: RolesApiNamespace;
    public inventories: InventoriesApiNamespace;
    public stats: StatsApiNamespace;
    public general: GeneralApiNamespace;
    public debug: DebugApiNamespace;

} // Fin classe SublymusApi


// ==================================
// == Namespace pour Auth ==
// ==================================
class AuthApiNamespace {
    private _api: SublymusApi;
    constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

    login(params: LoginParams): Promise<LoginResponse> {
        return this._api._request('/api/auth/login', { method: 'POST', body: params });
    }
    register(params: RegisterParams): Promise<RegisterResponse> {
        return this._api._request('/api/auth/register', { method: 'POST', body: params });
    }
    verifyEmail(params: VerifyEmailParams): Promise<MessageResponse> {
        return this._api._request('/api/auth/verify-email', { method: 'GET', params });
    }
    resendVerificationEmail(params: ResendVerificationParams): Promise<MessageResponse> {
        return this._api._request('/api/auth/resend-verification', { method: 'POST', body: params });
    }
    logout(): Promise<MessageResponse> {
        return this._api._request('/api/auth/logout', { method: 'POST' });
    }
    logoutAllDevices(): Promise<MessageResponse> {
        return this._api._request('/api/auth/logout_all_devices', { method: 'POST' });
    }
    getMe(): Promise<GetMeResponse> {
        return this._api._request('/api/auth/me', { method: 'GET' });
    }
    update(params: UpdateUserParams): Promise<UpdateUserResponse> {
        return this._api._request('/api/auth/me', { method: 'PUT', body: params });
    }
    deleteAccount(): Promise<MessageResponse> {
        return this._api._request('/api/auth/me', { method: 'DELETE' });
    }
    // Note: handleSocialCallbackInternal n'est pas exposé car appelé par le backend s_api lui-même
}

class ProductsApiNamespace {
     private _api: SublymusApi;
     constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

     async get(params: GetProductsParams): Promise<GetProductsResponse> {
         return this._api._request('/get_products', { method: 'GET', params });
     }

     async create({product,views}: CreateProductParams): Promise<CreateProductResponse> {
         const formData = await this._api._buildFormData({
            data:product, files:views
         }); // Préciser le champ fichier
         return this._api._request('/create_product', { method: 'POST', body: formData, isFormData: true });
     }

     async update(data: UpdateProductParams): Promise<UpdateProductResponse> {
         if (!data.product_id) throw new Error("Product ID is required for update.");
         const formData = await this._api._buildFormData({data}); 
         return this._api._request('/update_product', { method: 'PUT', body: formData, isFormData: true });
     }

     async delete(productId: string): Promise<DeleteProductResponse> {
        return this._api._request(`/delete_product/${productId}`, { method: 'DELETE' });
     }

      // Ajouter ici la méthode pour multipleUpdateFeaturesValues si elle concerne les produits
      async multipleUpdateFeaturesValues(data: { product_id: string, currentFeatures: Partial<FeatureInterface>[], initialFeatures: Partial<FeatureInterface>[] }): Promise<{ message: string, product?: ProductInterface }> {
          const formData = await this._api._buildFormDataForFeaturesValues(data);
          if(!formData) return Promise.reject(new ApiError(this._api.t('feature.multipleUpdateFailed'), 400)); // Rejeter si préparation échoue
          return this._api._request('/muptiple_update_features_values', { method: 'POST', body: formData, isFormData: true });
      }
}

// ===========================
// == Namespace Catégories ==
// ===========================
class CategoriesApiNamespace {
    private _api: SublymusApi;
    constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

    async get(params: GetCategoriesParams): Promise<GetCategoriesResponse | GetCategoryResponse> {
        // Si un ID ou un Slug est fourni, on s'attend à un seul résultat (ou null/404)
        if (params.category_id || params.slug) {
             // L'API get_categories renvoie une liste même pour un ID/slug, on adapte.
             // Ou mieux: créer un endpoint API distinct /get_category/:id ?
             // Pour l'instant, on prend le premier de la liste.
             const result = await this._api._request<GetCategoriesResponse>('/get_categories', { method: 'GET', params });
             return result?.list?.[0] ?? null; // Retourne le premier ou null
        }
        // Sinon, retourne la liste paginée
        return this._api._request<GetCategoriesResponse>('/get_categories', { method: 'GET', params });
    }

    async create(data: CreateCategoryParams): Promise<CreateCategoryResponse> {
        const formData = await this._api._buildFormData({data, dataFilesFelds:['view','icon']});
        return this._api._request('/create_category', { method: 'POST', body: formData, isFormData: true });
    }

    async update(data: UpdateCategoryParams): Promise<UpdateCategoryResponse> {
        if (!data.category_id) throw new Error("Category ID is required for update.");
        const formData = await this._api._buildFormData({data, dataFilesFelds:['view','icon']});
        return this._api._request('/update_category', { method: 'PUT', body: formData, isFormData: true });
    }

    async delete(categoryId: string): Promise<DeleteCategoryResponse> {
        // L'API actuelle retourne { isDeleted: true } dans un statut 200 OK
        return this._api._request(`/delete_category/${categoryId}`, { method: 'DELETE' });
    }

    async getSubCategories(params: GetSubCategoriesParams): Promise<GetSubCategoriesResponse> {
        return this._api._request('/get_sub_categories', { method: 'GET', params });
    }

    async getFilters(params: GetCategoryFiltersParams): Promise<GetCategoryFiltersResponse> {
        return this._api._request('/get_filters', { method: 'GET', params });
    }
}

// ======================================
// == Namespace Features (Simplifié) ==
// ======================================
// On expose principalement get et multipleUpdate
class FeaturesApiNamespace {
    private _api: SublymusApi;
    constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

    async get(params: GetFeaturesParams): Promise<GetFeaturesResponse> {
        return this._api._request('/get_features', { method: 'GET', params });
    }
    async getWithValues(params: GetFeaturesWithValuesParams): Promise<GetFeaturesWithValuesResponse> {
        return this._api._request('/get_features_with_values', { method: 'GET', params });
    }
    // multipleUpdateFeaturesValues est maintenant sous `products` car il retourne le produit
}

// ================================
// == Namespace Détails Produit ==
// ================================
class DetailsApiNamespace {
     private _api: SublymusApi;
     constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

     async get(params: GetDetailsParams): Promise<GetDetailsResponse | GetDetailResponse> {
         if (params.detail_id) {
             const result = await this._api._request<GetDetailsResponse>('/get_details', { method: 'GET', params });
             return result?.list?.[0] ?? null;
         }
         return this._api._request<GetDetailsResponse>('/get_details', { method: 'GET', params });
     }

     async create(data: CreateDetailParams): Promise<CreateDetailResponse> {
         const formData = await this._api._buildFormData({data,dataFilesFelds:['view']});
         return this._api._request('/create_detail', { method: 'POST', body: formData, isFormData: true });
     }

     async update(data: UpdateDetailParams): Promise<UpdateDetailResponse> {
         if (!data.detail_id) throw new Error("Detail ID ('id') is required for update.");
         const formData = await this._api._buildFormData({data,dataFilesFelds:['view']});
         return this._api._request(`/update_detail`, { method: 'PUT', body: formData, isFormData: true });
    }

     async delete(detailId: string): Promise<DeleteDetailResponse> {
         // L'API retourne { isDeleted: true }
         return this._api._request(`/delete_detail/${detailId}`, { method: 'DELETE' });
     }
}

// ========================
// == Namespace Commandes ==
// ========================
class OrdersApiNamespace {
    private _api: SublymusApi;
    constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

    async create(params: CreateOrderParams): Promise<CreateOrderResponse> {
        // Pas de FormData ici a priori
        return this._api._request('/create_user_order', { method: 'POST', body: params });
    }

    // Commandes de l'utilisateur connecté
    async getMyOrders(params: GetMyOrdersParams): Promise<GetMyOrdersResponse> {
        return this._api._request('/get_orders', { method: 'GET', params });
    }

    // Toutes les commandes (admin)
    async getAll(params: CommandFilterType): Promise<GetAllOrdersResponse> {
        return this._api._request('/get_users_orders', { method: 'GET', params });
    }

     // Récupérer UNE commande spécifique (admin), retourne une liste avec 1 élément
     async getOne(orderId: string): Promise<CommandInterface | null> {
         const params: CommandFilterType = { command_id: orderId, with_items: true };
         const result = await this._api._request<GetAllOrdersResponse>('/get_users_orders', { method: 'GET', params });
         return result?.list?.[0] ?? null;
     }

    async updateStatus(params: UpdateOrderStatusParams): Promise<UpdateOrderStatusResponse> {
        return this._api._request('/update_user_order', { method: 'PUT', body: params });
    }

    async delete(orderId: string): Promise<DeleteOrderResponse> {
        // L'API retourne { isDeleted: true }
        return this._api._request(`/delete_user_order/${orderId}`, { method: 'DELETE' });
    }
}


// ====================
// == Namespace Panier ==
// ====================
class CartApiNamespace {
    private _api: SublymusApi;
    constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

    async update(params: UpdateCartParams): Promise<UpdateCartResponse> {
        return this._api._request('/update_cart', { method: 'POST', body: params });
    }
    async view(): Promise<ViewCartResponse> {
        return this._api._request('/view_cart', { method: 'GET' });
    }
    async mergeOnLogin(): Promise<MergeCartResponse> {
        return this._api._request('/merge_cart_on_login', { method: 'POST' });
    }
}



// ===========================
// == Namespace Commentaires ==
// ===========================
class CommentsApiNamespace {
    private _api: SublymusApi;
    constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

    async create(data: CreateCommentParams, files?: { views?: File[] }): Promise<CreateCommentResponse> {
        const formData = await this._api._buildFormData({data, dataFilesFelds:['views']});
        return this._api._request('/create_comment', { method: 'POST', body: formData, isFormData: true });
    }

    async getForOrderItem(params: GetCommentForOrderItemParams): Promise<GetCommentForOrderItemResponse> {
        return this._api._request('/get_comment', { method: 'GET', params });
    }

    async getList(params: GetCommentsParams): Promise<GetCommentsResponse | CommentInterface | null> { // Gérer retour unique si comment_id
        if (params.comment_id) {
             const result = await this._api._request<GetCommentsResponse>('/get_comments', { method: 'GET', params });
             return result?.list?.[0] ?? null; // L'API get_comments retourne une liste même pour un ID
        }
        return this._api._request('/get_comments', { method: 'GET', params });
    }

    async update(data: UpdateCommentParams, files?: { views?: File[] }): Promise<UpdateCommentResponse> {
        if (!data.comment_id) throw new Error("Comment ID is required for update.");
         const formData = await this._api._buildFormData({data,dataFilesFelds:['views']}); // Ajouter comment_id au FormData
        return this._api._request('/update_comment', { method: 'PUT', body: formData, isFormData: true });
    }

    async delete(commentId: string): Promise<DeleteCommentResponse> {
         // L'API retourne { message: '...' } sur succès 200 OK
         return this._api._request(`/delete_comment/${commentId}`, { method: 'DELETE' });
    }
}

// =======================
// == Namespace Favoris ==
// =======================
class FavoritesApiNamespace {
     private _api: SublymusApi;
     constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

     async add(params: AddFavoriteParams): Promise<AddFavoriteResponse> {
         return this._api._request('/create_favorite', { method: 'POST', body: params });
     }

     async get(params: GetFavoritesParams): Promise<GetFavoritesResponse | (Favorite & { product: ProductInterface }) | null > { // Gérer retour unique si ID
        if (params.favorite_id) {
            const result = await this._api._request<GetFavoritesResponse>('/get_favorites', { method: 'GET', params });
            return result?.list?.[0] ?? null; // API retourne une liste
        }
        return this._api._request('/get_favorites', { method: 'GET', params });
    }

     async update(params: UpdateFavoriteParams): Promise<UpdateFavoriteResponse> {
         return this._api._request('/update_favorites', { method: 'PUT', body: params });
     }

     async remove(favoriteId: string): Promise<DeleteFavoriteResponse> {
         // API retourne { isDeleted: true } sur succès 200 OK
         return this._api._request(`/delete_favorite/${favoriteId}`, { method: 'DELETE' });
     }
}

// ==============================
// == Namespace UserProfile    ==
// == (Adresses & Téléphones)  ==
// ==============================
class UserProfileApiNamespace {
    private _api: SublymusApi;
    constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

    // Adresses
    async createAddress(params: CreateAddressParams): Promise<AddressResponse> {
        return this._api._request('/create_user_address', { method: 'POST', body: params });
    }
    async getAddresses(params?: GetAddressesParams): Promise<GetAddressesResponse> { // Param ID optionnel
        return this._api._request('/get_user_address', { method: 'GET', params });
    }
    async updateAddress(params: UpdateAddressParams): Promise<AddressResponse> {
        return this._api._request('/update_user_address', { method: 'PUT', body: params });
    }
    async deleteAddress(addressId: string): Promise<DeleteResponse> { // Retourne 204
        return this._api._request(`/delete_user_address/${addressId}`, { method: 'DELETE' });
    }

    // Téléphones (Méthodes à implémenter dans le contrôleur backend d'abord)
    async createPhone(params: CreatePhoneParams): Promise<PhoneResponse> {
        return this._api._request('/create_user_phone', { method: 'POST', body: params });
    }
    async getPhones(params?: GetPhonesParams): Promise<GetPhonesResponse> {
        return this._api._request('/get_user_phones', { method: 'GET', params }); // Endpoint à créer
    }
    async updatePhone(params: UpdatePhoneParams): Promise<PhoneResponse> {
        return this._api._request('/update_user_phone', { method: 'PUT', body: params });
    }
    async deletePhone(phoneId: string): Promise<DeleteResponse> { // Retourne 204
        return this._api._request(`/delete_user_phone/${phoneId}`, { method: 'DELETE' });
    }
}

// ==============================
// == Namespace Users (Admin)  ==
// ==============================
class UsersApiNamespace {
    private _api: SublymusApi;
    constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

    async get(params: UserFilterType): Promise<GetUsersResponse> {
        return this._api._request('/get_users', { method: 'GET', params });
    }
    // Ajouter deleteUser si route admin existe
}

// ==============================
// == Namespace Roles (Admin)  ==
// ==============================
class RolesApiNamespace {
    private _api: SublymusApi;
    constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

    async getCollaborators(params: GetCollaboratorsParams): Promise<GetCollaboratorsResponse> {
        return this._api._request('/list_role', { method: 'GET', params });
    }
    async createCollaborator(params: CreateCollaboratorParams): Promise<CreateCollaboratorResponse> {
        return this._api._request('/api/inventories', { method: 'POST', body: params }); // Changer en POST si API modifiée
    }
    async updatePermissions(params: UpdateCollaboratorParams): Promise<UpdateCollaboratorResponse> {
        return this._api._request('/add_remove_permission', { method: 'POST', body: params });
    }
    async removeCollaborator(userId: string): Promise<RemoveCollaboratorResponse> {
        return this._api._request(`/remove_collaborator/${userId}`, { method: 'DELETE' });
    }
}

// ========================
// == Namespace Inventaires ==
// ========================
class InventoriesApiNamespace {
    private _api: SublymusApi;
    constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

     async get(params: GetInventoriesParams): Promise<GetInventoriesResponse | Inventory | null> { // Gérer retour unique
        if (params.inventory_id) {
             const result = await this._api._request<GetInventoriesResponse>('/api/inventories', { method: 'GET', params });
             return result?.list?.[0] ?? null;
        }
        return this._api._request<GetInventoriesResponse>('/api/inventories', { method: 'GET', params });
     }
     async create(data: CreateInventoryParams): Promise<InventoryResponse> {
         const formData = await this._api._buildFormData({data, dataFilesFelds:['views']});
         return this._api._request('/api/inventories', { method: 'POST', body: formData, isFormData: true });
     }
     async update(data: UpdateInventoryParams): Promise<InventoryResponse> {
        if(!data.inventory_id) throw new Error("Inventory ID ('id') is required for update.");
         const formData = await this._api._buildFormData({data,dataFilesFelds:['views']});
         return this._api._request(`/api/inventories/${data.inventory_id}`, { method: 'PUT', body: formData, isFormData: true });
     }
     async delete(inventoryId: string): Promise<DeleteInventoryResponse> {
         return this._api._request(`/api/inventories/${inventoryId}`, { method: 'DELETE' });
     }
}

// ===========================
// == Namespace Statistiques ==
// ===========================
class StatsApiNamespace {
    private _api: SublymusApi;
    constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

    async get(params: StatParamType): Promise<GetStatsResponse> {
        return this._api._request('/api/v1/stats', { method: 'GET', params });
    }
     // Ajouter getVisits si route spécifique
     async getVisits(params: { period?: string, user_id?: string }): Promise<any> {
        return this._api._request('/api/v1/stats/summary', { method: 'GET', params });
     }
}

// =========================
// == Namespace General   ==
// =========================
class GeneralApiNamespace {
    private _api: SublymusApi;
    constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

    async globalSearch(params: GlobalSearchParams): Promise<GlobalSearchResponse> {
        return this._api._request('/api/v1/global/search', { method: 'GET', params });
    }
    // async importStore(data: { products?: any[], categories?: any[] }): Promise<any> { ... }
    // async exportStore(): Promise<{ products: any[], categories: any[] }> { ... }
}

// ======================
// == Namespace Debug  ==
// ======================
class DebugApiNamespace {
    private _api: SublymusApi;
    constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

    async requestScaleUp(): Promise<ScaleResponse> {
        return this._api._request('/api/v1/debug/scale-up', { method: 'GET' });
    }
    async requestScaleDown(): Promise<ScaleResponse> {
        return this._api._request('/api/v1/debug/scale-down', { method: 'GET' });
    }
}

// --- Fin de la classe et des namespaces ---