// src/api/SublymusApi.ts

import { OrderStatus } from '../Components/Utils/constants'; // Ajuster chemin si besoin
import type {
    ListType, ProductInterface, CategoryInterface, UserInterface, StoreInterface,
    CommandInterface, CommentInterface, DetailInterface, Inventory, Role, FavoriteInteraface,
    FilterType, CommandFilterType, UserFilterType, GlobalSearchType, StatsData,
    StatParamType, EventStatus, FeatureInterface, TypeJsonRole, ValueInterface
} from '../Interfaces/Interfaces'; // Adapter le chemin

export {StatParamType, UserFilterType,CommandFilterType,Inventory}
import logger from './Logger';
type RequestOptions = {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: HeadersInit;
    body?: any; // Peut être un objet, FormData, etc.
    params?: Record<string, any>; // Pour les query parameters
    isFormData?: boolean;
};
// --- Types Génériques & Erreur (Inchangés) ---
export type ApiSuccessResponse<T, Key extends string = 'data'> = {
    message?: string;
    error?: never;
    status?: number;
} & {
    [K in Key]?: T;
};
export type ApiErrorResponse = { message: string; data?: never; error: string | object | null; status: number; }
export type ApiResponse<T, K extends string = 'data'> = ApiSuccessResponse<T, K> | ApiErrorResponse;

export class ApiError extends Error {
    status: number;
    body: any;
    constructor(message: string, status: number, body: any = null) {
        super(message); this.name = 'ApiError'; this.status = status; this.body = body;
    }
}
export type BuildFormDataForFeaturesValuesParam = { product_id: string, currentFeatures: Partial<FeatureInterface>[], initialFeatures: Partial<FeatureInterface>[] }

// --- Types Spécifiques aux Endpoints ---

// Auth
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
export type CreateCategoryResponse = { message: string, category: CategoryInterface };
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
export type CreateDetailResponse = { message: string, detail: DetailInterface };
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
// Commentaires
export type CreateCommentParams = { order_item_id: string, title: string, description?: string, rating: number }; // Données texte
export type CreateCommentResponse = { message: string, comment: CommentInterface };
export type GetCommentForOrderItemParams = { order_item_id: string };
export type GetCommentForOrderItemResponse = CommentInterface | null;
export type GetCommentsParams = { order_by?: string, page?: number, limit?: number, comment_id?: string, product_id?: string, with_users?: boolean };
export type GetCommentsResponse = ListType<CommentInterface>;
export type UpdateCommentResponse = { message: string, comment: CommentInterface };
export type DeleteCommentResponse = MessageResponse;

// Favoris
export type AddFavoriteParams = { product_id: string };
export type AddFavoriteResponse = any; // L'API retourne { favorite_id, product_name }
export type GetFavoritesParams = { page?: number, limit?: number, order_by?: string, favorite_id?: string, label?: string, product_id?: string };
export type GetFavoritesResponse = ListType<FavoriteInteraface & { product: ProductInterface }>;
export type UpdateFavoriteResponse = FavoriteInteraface; // L'API retourne le favori mis à jour
export type DeleteFavoriteResponse = { message: string, isDeleted: boolean };




// ==============================
// == Namespace UserProfile    ==
// == (Adresses & Téléphones)  ==
// ==============================
// 2 - Définir types Params/Response spécifiques
export type DeleteAddressParams = { address_id: string };
export type DeletePhoneParams = { phone_id: string };
export type AddressType = any; // Placeholder
export type PhoneType = any; // Placeholder


// --- Interface pour UserAddress ---
// Basée sur le modèle UserAddress.ts
export interface UserAddressInterface {
    id: string;
    user_id: string;
    name: string;           // Label/Nom de l'adresse (ex: 'Maison', 'Bureau')
    longitude: number;
    latitude: number;
    created_at: string;     // Format ISO String
    updated_at: string;     // Format ISO String
}

// --- Interface pour UserPhone ---
// Basée sur le modèle UserPhone.ts
export interface UserPhoneInterface {
    id: string;
    user_id: string;
    phone_number: string;   // Numéro brut (ex: '07xxxxxxxx')
    format: string | null;  // Format international suggéré (ex: '+225 07 XX XX XX XX')
    country_code: string | null; // Code pays (ex: 'ci', 'fr', 'us') ou code indicatif ('ci_225'?)
    created_at: string;     // Format ISO String
    updated_at: string;     // Format ISO String
}

// --- Mise à jour des types Params/Response pour UserProfileApiNamespace ---
// (Rappel des types définis dans la réponse précédente, maintenant avec les interfaces)

export type CreateAddressParams = { data: Omit<UserAddressInterface, 'id' | 'user_id' | 'created_at' | 'updated_at'> };
export type AddressResponse = { message?: string, address: UserAddressInterface }; // Type retour précis
export type GetAddressesParams = { id?: string }; // ID spécifique
export type GetAddressesResponse = UserAddressInterface[]; // Retourne un tableau d'adresses
export type UpdateAddressParams = { data: Partial<Omit<UserAddressInterface, 'id' | 'user_id' | 'created_at' | 'updated_at'>>, address_id: string };
// DeleteAddressResponse est null (204)

export type CreatePhoneParams = { data: Omit<UserPhoneInterface, 'id' | 'user_id' | 'created_at' | 'updated_at'> };
export type PhoneResponse = { message?: string, phone: UserPhoneInterface }; // Type retour précis
export type GetPhonesParams = { id?: string }; // ID spécifique
export type GetPhonesResponse = UserPhoneInterface[]; // Retourne un tableau de numéros
export type UpdatePhoneParams = { data: Partial<Omit<UserPhoneInterface, 'id' | 'user_id' | 'created_at' | 'updated_at'>>, phone_id: string };
// DeletePhoneResponse est null (204)


// --- Mise à jour de GetMeResponse (pour inclure les types précis) ---
export type GetMeResponse = {
    user: UserInterface & {
        addresses?: UserAddressInterface[],
        phone_numbers?: UserPhoneInterface[]
    }
};




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
export type DeleteInventoryResponse = { message: string, isDeleted: boolean };

// Statistiques
// GetStatsParams = StatParamType (défini dans Interfaces)
export type GetStatsResponse = StatsData;

// General
export type GlobalSearchParams = { text: string };
export type GlobalSearchResponse = GlobalSearchType;

// Debug
export type ScaleResponse = { message: string, jobId: string };


// --- Types Spécifiques aux Paramètres & Réponses (Modifiés pour Update et GET) ---

// Auth (Types inchangés pour la plupart)
export type LoginParams = { email: string; password: string };
export type LoginResponse = { message?: string; user: UserInterface; token: string; expires_at: string };
export type RegisterParams = { full_name: string; email: string; password: string; password_confirmation: string };
export type RegisterResponse = { message?: string; user_id: string };
export type VerifyEmailParams = { token: string };
export type ResendVerificationParams = { email: string };
export type UpdateUserParams = { data: { full_name?: string; password?: string; password_confirmation?: string } }; // 2 - Changé
export type UpdateUserResponse = { message?: string; user: UserInterface };
// MessageResponse utilisé pour logout, logoutAll, deleteAccount, verify, resend

// Products
export type GetProductListParams = FilterType; // Type pour getList
export type GetProductListResponse = ListType<ProductInterface>;
export type GetProductParams = { product_id?: string; slug?: string; with_feature?: boolean }; // Type pour getOne
export type GetProductResponse = ProductInterface | null;
export type CreateProductParams = { product: Partial<ProductInterface>, views?: (string | Blob)[] }; // Adapté pour _buildFormData
export type CreateProductResponse = { message?: string, product: ProductInterface };
export type UpdateProductParams = { data: Partial<ProductInterface>, product_id: string }; // 2 - Changé (ID séparé)
export type UpdateProductResponse = { message?: string, product?: Partial<ProductInterface> };
export type DeleteProductResponse = MessageResponse; // Type pour delete

// Types génériques
export type MessageResponse = { message: string };
export type DeleteResponse = { message?: string, isDeleted?: boolean } | null;

// Type pour _buildFormData (optionnel)
type BuildFormDataParams = {
    data: Record<string, any>;
    files?: Record<string, (string | Blob)[]>; // Fichiers optionnels
    dataFilesFelds?: string[]; // Clés de 'data' qui contiennent des fichiers
};
// Type pour _prepareMultiple (optionnel)
type PrepareMultipleFeaturesValuesParams = {
    product_id: string;
    currentFeatures: Partial<FeatureInterface & { _request_mode?: 'new' | 'edited' | 'deleted' }>[];
    initialFeatures: Partial<FeatureInterface>[];
};

// --- Classe Principale SublymusApi ---
export class SublymusApi {
    public readonly apiUrl: string;
    public readonly getAuthToken: () => string | null;
    public readonly t: (key: string, params?: any) => string; // Ajouter params optionnel

    // --- Namespaces (déclarations) ---
    public auth: AuthApiNamespace;
    public products: ProductsApiNamespace;
    public categories: CategoriesApiNamespace;
    public features: FeaturesApiNamespace;
    public values: ValuesApiNamespace; // Ajouté
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

    constructor(apiUrl: string, getAuthToken: () => string | null, t: (key: string, params?: any) => string) {
        if (!apiUrl) throw new Error("API URL is required for initialization."); // Utiliser message brut ou clé i18n pré-initialisée?
        this.t = t;
        this.apiUrl = apiUrl.replace(/\/$/, '');
        this.getAuthToken = getAuthToken;
        logger.info(`SublymusApi initialized with URL: ${this.apiUrl}`);

        // Initialiser les namespaces
        this.auth = new AuthApiNamespace(this);
        this.products = new ProductsApiNamespace(this);
        this.categories = new CategoriesApiNamespace(this);
        this.features = new FeaturesApiNamespace(this);
        this.values = new ValuesApiNamespace(this); // Initialiser
        this.details = new DetailsApiNamespace(this);
        this.orders = new OrdersApiNamespace(this);
        this.cart = new CartApiNamespace(this);
        this.comments = new CommentsApiNamespace(this);
        this.favorites = new FavoritesApiNamespace(this);
        this.userProfile = new UserProfileApiNamespace(this);
        this.users = new UsersApiNamespace(this);
        this.roles = new RolesApiNamespace(this);
        this.inventories = new InventoriesApiNamespace(this);
        this.stats = new StatsApiNamespace(this);
        this.general = new GeneralApiNamespace(this);
        this.debug = new DebugApiNamespace(this);
    }

    // --- Méthodes Privées/Utilitaires ---
    // _request reste inchangé fonctionnellement mais utilise this.t
    public async _request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        // ... (code de _request inchangé, utilise this.t pour les erreurs génériques) ...
         const { method = 'GET', headers = {}, body = null, params = null, isFormData = false } = options;
         const token = this.getAuthToken();
         const requestHeaders = new Headers(headers);

         if (token) requestHeaders.set('Authorization', `Bearer ${token}`);
         if (!isFormData && body) requestHeaders.set('Content-Type', 'application/json');
         requestHeaders.set('Accept', 'application/json');

         let url = `${this.apiUrl}${endpoint}`; // Déjà préfixé avec /api/v1
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
         console.log(`API Request: ${method} ${url}`, requestBody );

         try {
             const response = await fetch(url, { method, headers: requestHeaders, body: requestBody });
             if (response.status === 204) {
                 console.log(`API Response: 204 No Content`);
                 return null as T;
             }
             let responseBody: any = null;
             const contentType = response.headers.get("content-type");
             if (contentType && contentType.includes("application/json")) {
                 try { responseBody = await response.json(); }
                 catch (jsonError) {
                     if (response.ok) {
                          console.log({ status: response.status, url, error: jsonError }, "Failed to parse JSON response for OK status");
                          throw new ApiError(this.t('api.parseError'), response.status);
                     }
                 }
             } else {
                 try { responseBody = await response.text(); } catch {}
                 if (response.ok) {
                      console.log({ status: response.status, url, nonJsonBody: String(responseBody).slice(0,100) }, "API response was not JSON");
                 }
             }

             if (!response.ok) {
                 const errorMessage = responseBody?.message || this.t(`api.httpError.${response.status}`, { defaultValue: response.statusText });
                 throw new ApiError(errorMessage, response.status, responseBody);
             }
             // logger.info(responseBody) // Optionnel: logguer les succès?
             return responseBody as T;

         } catch (error) {
             if (error instanceof ApiError) throw error;
             if (error instanceof Error) {
                 console.log({ method, url, error: error.message, stack: error.stack }, "API request failed (Network/Fetch Error)");
                 throw new ApiError(this.t('api.networkError'), 0, { originalError: error.message });
             }
             console.log({ method, url, error }, "API request failed (Unknown Error)");
             throw new ApiError(this.t('api.unknownError'), 0);
         }
    }

    async _buildFormData({ data, files, dataFilesFelds = [] , distinct}: {distinct?:boolean, dataFilesFelds?: string[], files?: Record<string, (string | Blob)[]>, data: Record<string, any> }) {
        const formData = new FormData();

        for (const [key, value] of Object.entries(data)) {
            if (dataFilesFelds.includes(key)) {
                if (Array.isArray(value)) {
                    const _distinct = Math.random().toString(32).replaceAll('.','')
                    let i = 0
                    const l:string[] = []
                    for (const v of value) {
                        const d = distinct?`${_distinct}:${key}_${i++}`:`${key}_${i++}`;
                        l.push(d);
                        (v??undefined) !== undefined && formData.append(d, v);
                    }
                    formData.append(key, JSON.stringify(l));
                } else {
                    console.log(`le champs "${key}" doit contenir un tableau, (string|blob)[]`)
                }
            }else if (Array.isArray(value)) {
                for (const v of value) {
                    (v??undefined) !== undefined &&formData.append(key, v);
                }
            } else {
                (value??undefined) !== undefined && formData.append(key, value);
            }
        }
        console.log('----------->', formData);
        for (const pair of formData.entries()) {
            console.log('FormData entry:', pair[0], pair[1]);
          }
          
        if (files) {
            for (const [key, value] of Object.entries(files)) {
                if (Array.isArray(value)) {
                    const _distinct = Math.random().toString(32).replaceAll('.','')
                    let i = 0
                    const l:string[] = []
                    for (const v of value) {
                        const d = distinct?`${_distinct}:${key}_${i++}`:`${key}_${i++}`;
                        l.push(d);
                        (v??undefined) !== undefined && formData.append(d, v);
                    }
                    formData.append(key, JSON.stringify(l));
                }
            }
        }
        return formData;
    }
     async _prepareMultipleFeaturesValuesData({ currentFeatures, initialFeatures, product_id }: BuildFormDataForFeaturesValuesParam) {
             if (!currentFeatures) return null;
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
     
                //  console.log('>>>>>>>3>>>>>>>');
                 if (!send) return null;
                 return multiple_update_features;
     
             } catch (error) {
                //  console.log('>>>>>>>2>>>>>>>', error);
     
                 return null
             }
         }


    // Méthode pour construire le FormData pour multipleUpdateFeaturesValues
    async _buildFormDataForFeaturesValues(params: PrepareMultipleFeaturesValuesParams): Promise<FormData | null> {
        const multipleUpdateData = await this._prepareMultipleFeaturesValuesData(params);
        
        console.log('>>>>>>>>>>>>>>', multipleUpdateData);
        
        
        if (!multipleUpdateData) return null;

        if(!params.product_id) throw new Error('product_id is required, for Multuple update feature values ')
        const formData = new FormData();
        formData.append('product_id', params.product_id);
        // La fonction _buildFormData gère la conversion des fichiers et la MAJ de l'objet
        // Nous devons donc recréer le JSON *après* le traitement des fichiers.

        // Fonction interne pour traiter les fichiers d'une Value (similaire à celle dans _buildFormData)
        const processValueFiles = (value: Partial<ValueInterface>) => {
             if (!value.id) return;
             (['icon', 'views'] as const).forEach((fileKey) => {
                 const files = value[fileKey];
                 if (!Array.isArray(files)) return;
                 const pseudoPaths: string[] = [];
                 let fileIndex = 0;
                 files.forEach((fileOrUrl) => {
                     if ((fileOrUrl instanceof File) || (fileOrUrl instanceof Blob)) {
                         const fieldName = `${(value.id || '').replace('.', '')}:${fileKey}_${fileIndex++}`;
                         formData.append(fieldName, fileOrUrl);
                         pseudoPaths.push(fieldName);
                     } else if (typeof fileOrUrl === 'string' && fileOrUrl !== '') {
                         pseudoPaths.push(fileOrUrl);
                     }
                 });
                 // Muter l'objet `value` dans `multipleUpdateData`
                 value[fileKey] = pseudoPaths;
             });
        };

         // Parcourir les creates/updates pour trouver et traiter les fichiers DANS multipleUpdateData
         Object.values((multipleUpdateData as any).values || {}).forEach((vData: any) => {
             (vData.create_values || []).forEach(processValueFiles);
             (vData.update_values || []).forEach(processValueFiles);
         });
         ((multipleUpdateData as any).create_features || []).forEach((f: any) => {
              (f.values || []).forEach(processValueFiles);
              // Traiter aussi l'icône de la feature si elle existe et est un fichier
               if (f.icon && Array.isArray(f.icon) && f.icon[0] instanceof File) {
                    const fieldName = `${(f.id || '').replace('.', '')}:icon_0`;
                    formData.append(fieldName, f.icon[0]);
                    f.icon = [fieldName]; // Remplacer par pseudo-path
               }
         });
          ((multipleUpdateData as any).update_features || []).forEach((f: any) => {
               // Traiter aussi l'icône de la feature si elle existe et est un fichier
                if (f.icon && Array.isArray(f.icon) && f.icon[0] instanceof File) {
                     const fieldName = `${(f.id || '').replace('.', '')}:icon_0`;
                     formData.append(fieldName, f.icon[0]);
                     f.icon = [fieldName]; // Remplacer par pseudo-path
                }
          });

        // Envoyer l'objet JSON mis à jour (avec les pseudo-paths)
        formData.append('multiple_update_features', JSON.stringify(multipleUpdateData));
        return formData;
    }
} // Fin Classe SublymusApi (Partie 1)


// ==================================
// == Namespace pour Auth ==
// ==================================
class AuthApiNamespace {
    private _api: SublymusApi;
    constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

    // 1 - Adapter les URLs
    login(params: LoginParams): Promise<LoginResponse> {
        return this._api._request('/api/v1/auth/login', { method: 'POST', body: params });
    }
    register(params: RegisterParams): Promise<RegisterResponse> {
        return this._api._request('/api/v1/auth/register', { method: 'POST', body: params });
    }
    verifyEmail(params: VerifyEmailParams): Promise<MessageResponse> {
        return this._api._request('/api/v1/auth/verify-email', { method: 'GET', params });
    }
    resendVerificationEmail(params: ResendVerificationParams): Promise<MessageResponse> {
        return this._api._request('/api/v1/auth/resend-verification', { method: 'POST', body: params });
    }
    logout(): Promise<MessageResponse> {
        return this._api._request('/api/v1/auth/logout', { method: 'POST' });
    }
    logoutAllDevices(): Promise<MessageResponse> {
        // Garder l'ancien nom de méthode mais appeler la nouvelle route
        return this._api._request('/api/v1/auth/logout-all', { method: 'POST' });
    }
    getMe(): Promise<GetMeResponse> {
        return this._api._request('/api/v1/auth/me', { method: 'GET' });
    }
    update(params: UpdateUserParams): Promise<UpdateUserResponse> { // 2 - Type Params modifié
        // Utiliser la méthode PUT sur /me
        return this._api._request('/api/v1/auth/me', { method: 'PUT', body: params.data });
    }
    deleteAccount(): Promise<MessageResponse> {
        // Utiliser la méthode DELETE sur /me
        return this._api._request('/api/v1/auth/me', { method: 'DELETE' });
    }
    // handleSocialCallbackInternal reste non exposé publiquement
}

// ========================
// == Namespace Products ==
// ========================
class ProductsApiNamespace {
    private _api: SublymusApi;
    constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

    // 3 - Séparation getList / getOne
    getList(params: GetProductListParams): Promise<GetProductListResponse> {
        return this._api._request('/api/v1/products', { method: 'GET', params });
    }
    async getOne(params: GetProductParams): Promise<GetProductResponse> {
        // Utiliser getList avec les bons filtres et prendre le premier élément
        const filter: GetProductListParams = {
            product_id: params.product_id,
            slug: params.slug,
            with_feature: params.with_feature,
            limit: 1 // Limiter à 1
        };
        const result = await this.getList(filter);
        return result?.list?.[0] ?? null;
    }

    async create(params: CreateProductParams): Promise<CreateProductResponse> {
          // _buildFormData gère déjà la structure { product, views }
         const formData = await this._api._buildFormData({data: params.product,files:{views:params.views||[]}, dataFilesFelds: ['views']}); // Assumer 'views' est la clé pour les fichiers
         return this._api._request('/api/v1/products', { method: 'POST', body: formData, isFormData: true });
    }

    async update(params: UpdateProductParams): Promise<UpdateProductResponse> { // 2 - Type Params modifié
        const { product_id, data } = params;
        if (!product_id) throw new Error("Product ID is required for update.");
         const formData = await this._api._buildFormData({ data: data }); // Ajouter product_id au corps si API l'attend là
         // Appel PUT sur /api/v1/products/:id (l'API doit lire l'ID de l'URL)
         // Ici, l'ancien contrôleur attendait product_id dans le body, on garde ça pour l'instant
         return this._api._request(`/api/v1/products/${product_id}`, { method: 'PUT', body: formData, isFormData: true });
        //   return this._api._request(`/api/v1/products/${product_id}`, { method: 'PUT', body: data }); // TEMP: Envoyer JSON si pas de fichiers pour l'instant
    }

    async delete(productId: string): Promise<DeleteProductResponse> {
         return this._api._request(`/api/v1/products/${productId}`, { method: 'DELETE' });
    }

    // Méthode pour multipleUpdateFeaturesValues
     async multipleUpdateFeaturesValues(params: { product_id: string, currentFeatures: Partial<FeatureInterface>[], initialFeatures: Partial<FeatureInterface>[] }): Promise<MultipleUpdateFeaturesValuesResponse> {
        const formData = await this._api._buildFormDataForFeaturesValues(params);
        if (!formData) return Promise.reject(new ApiError(this._api.t('feature.multipleUpdateFailed'), 400));
          return this._api._request('/api/v1/features/multiple-updates', { method: 'POST', body: formData, isFormData: true });
    }
}
// --- Fin Partie 1/3 ---

// src/api/SublymusApi.ts
// ... (Imports, Types, Classe SublymusApi, Constructeur, _request, _buildFormData, _prepare..., _buildFormDataForFeatures, Namespaces Auth & Products) ...


// ===========================
// == Namespace Catégories ==
// ===========================
// 2 - Définir types Params/Response spécifiques pour Update/Create
export type CreateCategoryParams = { data: Partial<CategoryInterface> }; // Fichiers gérés par _buildFormData
export type UpdateCategoryParams = { data: Partial<CategoryInterface>, category_id: string };
export type DeleteCategoryParams = { category_id: string };

class CategoriesApiNamespace {
    private _api: SublymusApi;
    constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

    // 3 - Séparation getList / getOne
    getList(params?: GetCategoriesParams): Promise<GetCategoriesResponse> { // Rendre params optionnel
         return this._api._request<GetCategoriesResponse>('/api/v1/categories', { method: 'GET', params });
    }
    async getOne(params: { category_id?: string; slug?: string; with_product_count?: boolean }): Promise<GetCategoryResponse> {
        // Utilise getList avec limit: 1
         const filter: GetCategoriesParams = { ...params, limit: 1 };
         const result = await this.getList(filter);
         return result?.list?.[0] ?? null;
    }

    async create(params: CreateCategoryParams): Promise<CreateCategoryResponse> {
          const formData = await this._api._buildFormData({ data: params.data, dataFilesFelds: ['view', 'icon'] });
         return this._api._request('/api/v1/categories', { method: 'POST', body: formData, isFormData: true });
    }

    async update(params: UpdateCategoryParams): Promise<UpdateCategoryResponse> { // 2 - Type Params modifié
         // 1 - Adapter URL (utilise ID dans l'URL)
         const { category_id, data } = params;
         const formData = await this._api._buildFormData({ data, dataFilesFelds: ['view', 'icon'] });
         return this._api._request(`/api/v1/categories/${category_id}`, { method: 'PUT', body: formData, isFormData: true });
    }

    async delete(params: DeleteCategoryParams): Promise<DeleteCategoryResponse> { // 2 - Type Params modifié
          const { category_id } = params;
         return this._api._request(`/api/v1/categories/${category_id}`, { method: 'DELETE' });
    }

    getSubCategories(params: GetSubCategoriesParams): Promise<GetSubCategoriesResponse> {
          return this._api._request('/api/v1/categories/sub-categories', { method: 'GET', params });
    }

    getFilters(params: GetCategoryFiltersParams): Promise<GetCategoryFiltersResponse> {
          return this._api._request('/api/v1/categories/filters', { method: 'GET', params });
    }
}

// ======================================
// == Namespace Features (Simplifié) ==
// ======================================
// 3 - Séparation GetList / GetOne implicite par les params
export type GetFeatureParams = GetFeaturesParams; // Peut contenir feature_id pour un seul
export type GetFeatureResponse = FeatureInterface | null; // Si feature_id est utilisé

class FeaturesApiNamespace {
    private _api: SublymusApi;
    constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

    // 3 - getList (sans ID)
    getList(params: Omit<GetFeaturesParams, 'feature_id'> = {}): Promise<GetFeaturesResponse> { // Exclure feature_id
          return this._api._request('/api/v1/features', { method: 'GET', params });
    }

    // 3 - getOne (avec ID)
    async getOne(params: { feature_id: string }): Promise<GetFeatureResponse> {
         // Utilise getList avec limit=1
         const result = await this.getList({ ...params, limit: 1 } as any); // Cast 'any' pour passer limit
         return result?.list?.[0] ?? null;
    }

    // 3 - getListWithValues
    getListWithValues(params: GetFeaturesWithValuesParams = {}): Promise<GetFeaturesWithValuesResponse> {
          return this._api._request('/api/v1/features/with-values', { method: 'GET', params });
    }
    // 3 - getOneWithValues (si besoin)
     async getOneWithValues(params: { feature_id: string }): Promise<FeatureInterface | null> {
          const result = await this.getListWithValues({ ...params, limit: 1 } as any);
          return result?.[0] ?? null; // Retourne un tableau, prendre le premier
     }

}

// ======================================
// == Namespace Values (Feature Options) ==
// ======================================
// 2 - Définir types Params/Response spécifiques
export type GetValuesParams = { feature_id?: string; value_id?: string; text?: string; page?: number; limit?: number; };
export type GetValueResponse = ValueInterface | null;
export type GetValuesResponse = ListType<ValueInterface>;
export type CreateValueParams = { data: Partial<ValueInterface> & { feature_id: string } }; // feature_id requis
export type CreateValueResponse = { message?: string; value: ValueInterface }; // Ajouter message?
export type UpdateValueParams = { data: Partial<ValueInterface>, value_id: string };
export type UpdateValueResponse = { message?: string; value: ValueInterface };
export type DeleteValueParams = { value_id: string };
export type DeleteValueResponse = DeleteResponse; // Retourne 204

class ValuesApiNamespace {
     private _api: SublymusApi;
     constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

      // 3 - Séparation getList / getOne
      getList(params: Omit<GetValuesParams, 'value_id'> = {}): Promise<GetValuesResponse> {
           return this._api._request('/api/v1/values', { method: 'GET', params });
      }
      async getOne(params: { value_id: string }): Promise<GetValueResponse> {
          // Utilise getList avec limit=1
          const result = await this.getList({ ...params, limit: 1 } as any);
          return result?.list?.[0] ?? null;
      }

      async create(params: CreateValueParams): Promise<CreateValueResponse> {
              const formData = await this._api._buildFormData({ data: params.data, dataFilesFelds: ['icon', 'views'] });
           return this._api._request('/api/v1/values', { method: 'POST', body: formData, isFormData: true });
      }

      async update(params: UpdateValueParams): Promise<UpdateValueResponse> { // 2 - Type Params modifié
            // 1 - Adapter URL (utilise ID dans l'URL)
           const { value_id, data } = params;
           const formData = await this._api._buildFormData({ data: { ...data, value_id }, dataFilesFelds: ['icon', 'views'] }); // Ajouter value_id au corps si API l'attend là
           return this._api._request(`/api/v1/values/${value_id}`, { method: 'PUT', body: formData, isFormData: true });
      }

      async delete(params: DeleteValueParams): Promise<DeleteValueResponse> { // 2 - Type Params modifié
               const { value_id } = params;
            return this._api._request(`/api/v1/values/${value_id}`, { method: 'DELETE' }); // Retourne 204
      }
}


// ================================
// == Namespace Détails Produit ==
// ================================
// 2 - Définir types Params/Response spécifiques
export type GetDetailParams = { detail_id: string };
export type GetDetailResponse = DetailInterface | null;
export type GetDetailListParams = { product_id?: string; page?: number; limit?: number; order_by?: string };
export type GetDetailListResponse = ListType<DetailInterface>;
export type CreateDetailParams = { data: Partial<DetailInterface> };
export type UpdateDetailParams = { data: Partial<DetailInterface>, detail_id: string };
export type DeleteDetailParams = { detail_id: string };

class DetailsApiNamespace {
     private _api: SublymusApi;
     constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

     // 3 - Séparation getList / getOne
     getList(params: GetDetailListParams): Promise<GetDetailListResponse> {
           return this._api._request<GetDetailListResponse>('/api/v1/details', { method: 'GET', params });
     }
     async getOne(params: GetDetailParams): Promise<GetDetailResponse> {
          // Utilise getList avec limit=1
          const result = await this.getList({ ...params, limit: 1 } as any);
          return result?.list?.[0] ?? null;
     }

     async create(params: CreateDetailParams): Promise<CreateDetailResponse> {
           const formData = await this._api._buildFormData({ data: params.data, dataFilesFelds: ['view'] });
         return this._api._request('/api/v1/details', { method: 'POST', body: formData, isFormData: true });
     }

     async update(params: UpdateDetailParams): Promise<UpdateDetailResponse> { // 2 - Type Params modifié
          // 1 - Adapter URL (utilise ID dans l'URL)
         const { detail_id, data } = params;
         const formData = await this._api._buildFormData({ data, dataFilesFelds: ['view'] });
         return this._api._request(`/api/v1/details/${detail_id}`, { method: 'PUT', body: formData, isFormData: true });
     }

     async delete(params: DeleteDetailParams): Promise<DeleteDetailResponse> { // 2 - Type Params modifié
            const { detail_id } = params;
         return this._api._request(`/api/v1/details/${detail_id}`, { method: 'DELETE' });
     }
}

// ========================
// == Namespace Commandes ==
// ========================
// 2 - Définir types Params/Response spécifiques
export type GetOrderParams = { order_id: string; with_items?: boolean }; // Pour getOne
export type GetOrderResponse = CommandInterface | null;
// GetMyOrdersParams, GetMyOrdersResponse, GetAllOrdersResponse, UpdateOrderStatusParams, UpdateOrderStatusResponse, DeleteOrderResponse déjà définis
export type DeleteOrderParams = { order_id: string };

class OrdersApiNamespace {
    private _api: SublymusApi;
    constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

    create(params: CreateOrderParams): Promise<CreateOrderResponse> {
        return this._api._request('/api/v1/orders', { method: 'POST', body: params });
    }

    // 3 - Séparation getList / getOne (pour les commandes de l'utilisateur)
    getMyList(params?: GetMyOrdersParams): Promise<GetMyOrdersResponse> { // Renommé, params optionnels
        return this._api._request('/api/v1/orders/my-orders', { method: 'GET', params });
    }
    // Pas de getMyOne car un user ne devrait pas accéder à une commande via ID direct? Ou alors utiliser getOne.

    // 3 - Séparation getList / getOne (pour toutes les commandes - admin)
    getList(params: CommandFilterType): Promise<GetAllOrdersResponse> {
        return this._api._request('/api/v1/orders', { method: 'GET', params });
    }
    async getOne(params: GetOrderParams): Promise<GetOrderResponse> {
         // L'API getAllOrders peut filtrer par ID, on l'utilise
        const filter: CommandFilterType = { command_id: params.order_id, with_items: params.with_items ?? true, limit: 1 };
        const result = await this.getList(filter);
        return result?.list?.[0] ?? null;
    }

    updateStatus(params: UpdateOrderStatusParams): Promise<UpdateOrderStatusResponse> { // 2 - Type Params inchangé structurellement mais nom différent
        // 1 - Adapter URL (utilise ID dans l'URL)
         const { user_order_id, ...data } = params;
         return this._api._request(`/api/v1/orders/${user_order_id}/status`, { method: 'PUT', body: data });
    }

    delete(params: DeleteOrderParams): Promise<DeleteOrderResponse> { // 2 - Type Params modifié
          const { order_id } = params;
         return this._api._request(`/api/v1/orders/${order_id}`, { method: 'DELETE' });
    }
}

// ====================
// == Namespace Panier ==
// ====================
class CartApiNamespace {
    private _api: SublymusApi;
    constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

    update(params: UpdateCartParams): Promise<UpdateCartResponse> {
         return this._api._request('/api/v1/cart/update', { method: 'POST', body: params });
    }
    view(): Promise<ViewCartResponse> {
         return this._api._request('/api/v1/cart', { method: 'GET' });
    }
    mergeOnLogin(): Promise<MergeCartResponse> {
         return this._api._request('/api/v1/cart/merge', { method: 'POST' });
    }
}

// ===========================
// == Namespace Commentaires ==
// ===========================
// 2 - Définir types Params/Response spécifiques
export type UpdateCommentParams = { data: Partial<CommentInterface>, comment_id: string }; // Ne contient pas les fichiers
export type DeleteCommentParams = { comment_id: string };

class CommentsApiNamespace {
    private _api: SublymusApi;
    constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

    async create(params: { data: CreateCommentParams, files?: { views?: File[] } }): Promise<CreateCommentResponse> {
        const formData = await this._api._buildFormData({ data: params.data, files: params.files, dataFilesFelds: ['views'] });
        return this._api._request('/api/v1/comments', { method: 'POST', body: formData, isFormData: true });
    }

    // 3 - Séparation getList / getOne
    getList(params: GetCommentsParams): Promise<GetCommentsResponse> {
         // S'assurer que comment_id n'est pas passé ici
         const { comment_id, ...restParams } = params;
         if(comment_id) console.log("Use getOne to fetch comment by ID");
        return this._api._request('/api/v1/comments', { method: 'GET', params: restParams });
    }
    async getOne(params: { comment_id: string, with_users?: boolean }): Promise<CommentInterface | null> {
        // Utilise getList avec l'ID
         const result = await this.getList(params); // L'API get_comments gère déjà comment_id
         return result?.list?.[0] ?? null;
    }

    // 3 - getForOrderItem reste une méthode spécifique
    getForOrderItem(params: GetCommentForOrderItemParams): Promise<GetCommentForOrderItemResponse> {
         return this._api._request('/api/v1/comments/for-item', { method: 'GET', params });
    }

    async update(params: UpdateCommentParams, files?: { views?: File[] }): Promise<UpdateCommentResponse> { // 2 - Type Params modifié
        // 1 - Adapter URL (utilise ID dans l'URL)
         const { comment_id, data } = params;
         const formData = await this._api._buildFormData({ data: { ...data, comment_id }, files, dataFilesFelds: ['views'] });
         return this._api._request(`/api/v1/comments/${comment_id}`, { method: 'PUT', body: formData, isFormData: true });
    }

    async delete(params: DeleteCommentParams): Promise<DeleteCommentResponse> { // 2 - Type Params modifié
          const { comment_id } = params;
         return this._api._request(`/api/v1/comments/${comment_id}`, { method: 'DELETE' });
    }
}

// =======================
// == Namespace Favoris ==
// =======================
// 2 - Définir types Params/Response spécifiques
export type UpdateFavoriteParams = { data: { label: string }, favorite_id: string };
export type DeleteFavoriteParams = { favorite_id: string };

class FavoritesApiNamespace {
     private _api: SublymusApi;
     constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

     add(params: AddFavoriteParams): Promise<AddFavoriteResponse> {
           return this._api._request('/api/v1/favorites', { method: 'POST', body: params });
     }

     // 3 - Séparation getList / getOne
     getList(params?: Omit<GetFavoritesParams, 'favorite_id'>): Promise<GetFavoritesResponse> { // Rendre params optionnel
         return this._api._request('/api/v1/favorites', { method: 'GET', params });
     }
     async getOne(params: { favorite_id: string }): Promise<FavoriteInteraface & { product: ProductInterface } | null> {
        // Utilise getList avec limit=1
        const result = await this.getList({ ...params, limit: 1 } as any);
        return result?.list?.[0] ?? null;
     }

     update(params: UpdateFavoriteParams): Promise<UpdateFavoriteResponse> { // 2 - Type Params modifié
        // 1 - Adapter URL (utilise ID dans l'URL)
         const { favorite_id, data } = params;
         return this._api._request(`/api/v1/favorites/${favorite_id}`, { method: 'PUT', body: data }); // L'API attendait favorite_id dans body aussi, on l'enlève
     }

     remove(params: DeleteFavoriteParams): Promise<DeleteFavoriteResponse> { // 2 - Type Params modifié
         const { favorite_id } = params;
         return this._api._request(`/api/v1/favorites/${favorite_id}`, { method: 'DELETE' });
     }
}


class UserProfileApiNamespace {
    private _api: SublymusApi;
    constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

    // Adresses
    createAddress(params: CreateAddressParams): Promise<AddressResponse> {
         return this._api._request('/api/v1/user-addresses', { method: 'POST', body: params });
    }
    // 3 - Séparation getList / getOne
    getAddressList(params?: Omit<GetAddressesParams, 'id'>): Promise<GetAddressesResponse> {
         return this._api._request('/api/v1/user-addresses', { method: 'GET', params });
    }
     async getAddress(params: { id: string }): Promise<AddressType | null> {
          const result = await this.getAddressList(params);
          return result?.[0] ?? null; // L'API retourne un tableau
     }

    updateAddress(params: UpdateAddressParams): Promise<AddressResponse> { // 2 - Type Params modifié
          const { address_id, data } = params;
         return this._api._request(`/api/v1/user-addresses/${address_id}`, { method: 'PUT', body: data });
    }
    deleteAddress(params: DeleteAddressParams): Promise<DeleteResponse> { // 2 - Type Params modifié
          const { address_id } = params;
         return this._api._request(`/api/v1/user-addresses/${address_id}`, { method: 'DELETE' });
    }

    // Téléphones
    createPhone(params: CreatePhoneParams): Promise<PhoneResponse> {
          return this._api._request('/api/v1/user-phones', { method: 'POST', body: params.data });
    }
     // 3 - Séparation getList / getOne
     getPhoneList(params?: Omit<GetPhonesParams, 'id'>): Promise<GetPhonesResponse> {
           return this._api._request('/api/v1/user-phones', { method: 'GET', params });
     }
      async getPhone(params: { id: string }): Promise<PhoneType | null> {
          const result = await this.getPhoneList(params);
          return result?.[0] ?? null;
      }

    updatePhone(params: UpdatePhoneParams): Promise<PhoneResponse> { // 2 - Type Params modifié
           const { phone_id, data } = params;
         return this._api._request(`/api/v1/user-phones/${phone_id}`, { method: 'PUT', body: data });
    }
    deletePhone(params: DeletePhoneParams): Promise<DeleteResponse> { // 2 - Type Params modifié
           const { phone_id } = params;
         return this._api._request(`/api/v1/user-phones/${phone_id}`, { method: 'DELETE' });
    }
}

// ==============================
// == Namespace Users (Admin)  ==
// ==============================
class UsersApiNamespace {
    private _api: SublymusApi;
    constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

    // 3 - getList (getOne n'est pas défini dans le contrôleur pour l'instant)
    getList(params: UserFilterType): Promise<GetUsersResponse> {
         return this._api._request('/api/v1/users', { method: 'GET', params });
    }
    // Ajouter delete si l'API le permet
}

// ==============================
// == Namespace Roles (Admin)  ==
// ==============================
// 2 - Types Params
export type DeleteCollaboratorParams = { user_id: string };

class RolesApiNamespace {
    private _api: SublymusApi;
    constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

    // 3 - getList (pas de getOne pour les roles/collaborateurs)
    getCollaborators(params: GetCollaboratorsParams): Promise<GetCollaboratorsResponse> {
         return this._api._request('/api/v1/roles/collaborators', { method: 'GET', params });
    }
    createCollaborator(params: CreateCollaboratorParams): Promise<CreateCollaboratorResponse> {
         return this._api._request('/api/v1/roles/collaborators', { method: 'POST', body: params }); // POST est plus standard
    }
    updatePermissions(params: UpdateCollaboratorParams): Promise<UpdateCollaboratorResponse> {
         return this._api._request('/api/v1/roles/collaborators/permissions', { method: 'POST', body: params });
    }
    removeCollaborator(params: DeleteCollaboratorParams): Promise<RemoveCollaboratorResponse> { // 2 - Type Params modifié
           const { user_id } = params;
         return this._api._request(`/api/v1/roles/collaborators/${user_id}`, { method: 'DELETE' });
    }
}

// ========================
// == Namespace Inventaires ==
// ========================
// 2 - Types Params
export type CreateInventoryParams = { data: Partial<Inventory> };
export type UpdateInventoryParams = { data: Partial<Inventory>, inventory_id: string };
export type DeleteInventoryParams = { inventory_id: string };
export type GetInventoryResponse = Inventory | null;


class InventoriesApiNamespace {
    private _api: SublymusApi;
    constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

    // 3 - Séparation getList / getOne
     getList(params?: Omit<GetInventoriesParams, 'inventory_id'>): Promise<GetInventoriesResponse> { // Rendre params optionnel
           return this._api._request<GetInventoriesResponse>('/api/v1/inventories', { method: 'GET', params });
     }
      async getOne(params: { inventory_id: string }): Promise<GetInventoryResponse> {
           // Utilise l'endpoint /:id
               return this._api._request<Inventory>(`/api/v1/inventories/${params.inventory_id}`, { method: 'GET' });
           // Gérer le cas 404 avec un try/catch si _request ne le fait pas déjà
      }

     async create(params: CreateInventoryParams): Promise<InventoryResponse> {
            const formData = await this._api._buildFormData({ data: params.data, dataFilesFelds: ['views'] });
          return this._api._request('/api/v1/inventories', { method: 'POST', body: formData, isFormData: true });
     }
     async update(params: UpdateInventoryParams): Promise<InventoryResponse> { // 2 - Type Params modifié
            const { inventory_id, data } = params;
          const formData = await this._api._buildFormData({ data: { ...data, inventory_id }, dataFilesFelds: ['views'] });
          return this._api._request(`/api/v1/inventories/${inventory_id}`, { method: 'PUT', body: formData, isFormData: true });
     }
     async delete(params: DeleteInventoryParams): Promise<DeleteInventoryResponse> { // 2 - Type Params modifié
             const { inventory_id } = params;
          return this._api._request(`/api/v1/inventories/${inventory_id}`, { method: 'DELETE' });
     }
}

// ===========================
// == Namespace Statistiques ==
// ===========================
class StatsApiNamespace {
    private _api: SublymusApi;
    constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

    get(params: StatParamType): Promise<GetStatsResponse> {
         return this._api._request('/api/v1/stats', { method: 'GET', params });
    }
     getVisitsSummary(params: { period?: string, user_id?: string }): Promise<any> { // Type retour à affiner
        return this._api._request('/api/v1/stats/summary', { method: 'GET', params });
     }
     // Ajouter trackVisit si nécessaire (POST /api/v1/stats/track)
}

// =========================
// == Namespace General   ==
// =========================
class GeneralApiNamespace {
    private _api: SublymusApi;
    constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

    globalSearch(params: GlobalSearchParams): Promise<GlobalSearchResponse> {
         return this._api._request('/api/v1/global/search', { method: 'GET', params });
    }
    // Implémenter import/export si nécessaire
}

// ======================
// == Namespace Debug  ==
// ======================
class DebugApiNamespace {
    private _api: SublymusApi;
    constructor(apiInstance: SublymusApi) { this._api = apiInstance; }

    requestScaleUp(): Promise<ScaleResponse> {
         return this._api._request('/api/v1/debug/scale-up', { method: 'GET' });
    }
    requestScaleDown(): Promise<ScaleResponse> {
         return this._api._request('/api/v1/debug/scale-down', { method: 'GET' });
    }
}

// --- Fin de la classe et des namespaces --- 