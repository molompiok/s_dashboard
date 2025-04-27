
// src/api/SublymusApi.ts (ou chemin 
import { EDITED_DATA, NEW_ID_START, OrderStatus } from '../Components/Utils/constants';
import type {
    ListType, ProductInterface, CategoryInterface, UserInterface, StoreInterface,
    CommandInterface, CommentInterface, DetailInterface, Inventory, Role, FavoriteInteraface,
    FilterType, CommandFilterType, UserFilterType, /* ... autres types d'input/output ... */
    GlobalSearchType, StatsData, StatParamType, EventStatus,
    FeatureInterface,
    TypeJsonRole,
    ValueInterface
} from '../Interfaces/Interfaces'; // Adapter le chemin

export type CreateProductParams = { product: Partial<ProductInterface>, views: (string | Blob)[] };
export type BuildFormDataForFeaturesValuesParam = { product_id: string, currentFeatures: Partial<FeatureInterface>[], initialFeatures: Partial<FeatureInterface>[] }
import logger from './Logger';

// Type pour les options de requête internes
type RequestOptions = {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: HeadersInit;
    body?: any; // Peut être un objet, FormData, etc.
    params?: Record<string, any>; // Pour les query parameters
    isFormData?: boolean;
};

// Erreur API personnalisée
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

export class SublymusApi {
    private apiUrl: string;
    private getAuthToken: () => string | null;
    private t: (target: string, data?: any) => string;
    constructor(apiUrl: string, getAuthToken: () => string | null, t: (target: string, data?: any) => string) {
        if (!apiUrl) {
            throw new Error(t('api.apiUrlRequired'));
        }
        this.t = t;
        this.apiUrl = apiUrl.replace(/\/$/, ''); // Supprimer le slash final si présent
        this.getAuthToken = getAuthToken;
        logger.info(`SublymusApi initialized with URL: ${this.apiUrl}`);
    }

    private async _request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const {
            method = 'GET',
            headers = {},
            body = null,
            params = null,
            isFormData = false
        } = options;


        const token = this.getAuthToken();
        const requestHeaders = new Headers(headers);

        // Ajouter le token d'authentification si disponible
        if (token) {
            requestHeaders.set('Authorization', `Bearer ${token}`);
        }

        // Définir Content-Type sauf si c'est FormData (le navigateur le fait)
        if (!isFormData && body) {
            requestHeaders.set('Content-Type', 'application/json');
        }
        requestHeaders.set('Accept', 'application/json'); // Toujours attendre du JSON

        // Construire l'URL avec les query parameters si présents
        let url = `${this.apiUrl}${endpoint}`;
        if (params) {
            const searchParams = new URLSearchParams();
            for (const key in params) {
                if (params[key] !== undefined && params[key] !== null) {
                    // Gérer les tableaux pour les query params (ex: ?stats=a&stats=b)
                    if (Array.isArray(params[key])) {
                        params[key].forEach((value: string) => searchParams.append(key, value));
                    } else {
                        searchParams.set(key, String(params[key]));
                    }
                }
            }
            const queryString = searchParams.toString();
            if (queryString) {
                url += `?${queryString}`;
            }
        }

        // Préparer le corps de la requête
        let requestBody: BodyInit | null = null;
        if (body) {
            if (isFormData) {
                requestBody = body as FormData; // Assumer que c'est déjà un FormData
            } else {
                requestBody = JSON.stringify(body);
            }
        }

        console.log(`API Request: ${method} ${url}`, requestBody, options);

        try {
            const response = await fetch(url, {
                method,
                headers: requestHeaders,
                body: requestBody,
            });

            // Gérer les réponses sans contenu (ex: 204 No Content pour DELETE)
            if (response.status === 204) {
                logger.debug(`API Response: ${response.status} ${response.statusText}`);
                return null as T; // Retourner null ou une indication de succès vide
            }

            // Tenter de parser le JSON, même pour les erreurs (peut contenir des détails)
            let responseBody: any = null;
            try {
                // Vérifier si la réponse est bien du JSON avant de parser
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    responseBody = await response.json();


                } else {
                    // Si pas JSON, lire comme texte (pour debug)
                    responseBody = await response.text();
                    logger.warn({ status: response.status, url, nonJsonBody: responseBody }, "API response was not JSON");
                }
            } catch (jsonError) {
                // Si le parsing échoue même pour une réponse OK, c'est une erreur serveur
                if (response.ok) {
                    logger.error({ status: response.status, url, error: jsonError }, "Failed to parse JSON response for OK status");
                    throw new ApiError(this.t('api.parseError'), response.status);
                }
                // Garder responseBody à null si le parsing échoue sur une erreur HTTP
            }

            console.log(responseBody);

            if (!response.ok) {
                // Utiliser le message du corps si disponible, sinon un message générique
                const errorMessage = responseBody?.message || this.t(`api.httpError.${response.status}`, { defaultValue: response.statusText });
                throw new ApiError(errorMessage, response.status, responseBody);
            }

            return responseBody as T;

        } catch (error) {
            // Gérer les erreurs réseau ou les erreurs déjà lancées (ApiError)
            if (error instanceof ApiError) {
                logger.warn({ method, url, status: error.status, message: error.message, body: error.body }, "API request failed (ApiError)");
                throw error; // Relancer l'erreur ApiError
            } else if (error instanceof Error) {
                logger.error({ method, url, error: error.message, stack: error.stack }, "API request failed (Network/Fetch Error)");
                // 🌍 i18n
                throw new ApiError(this.t('api.networkError'), 0, { originalError: error.message }); // Status 0 pour erreur réseau
            } else {
                logger.error({ method, url, error }, "API request failed (Unknown Error)");
                throw new ApiError(this.t('api.unknownError'), 0);
            }
        }
    }

    // --- Méthodes par Endpoint ---

    // == Authentification ==
    async login(credentials: { email: string; password: string }): Promise<{ user: UserInterface, token: string, expires_at: string }> {
        return this._request('/api/auth/login', { method: 'POST', body: credentials });
    }

    async register(data: { full_name: string; email: string; password: string; password_confirmation: string }): Promise<{ user_id: string }> {
        return this._request('/api/auth/register', { method: 'POST', body: data });
    }

    async verifyEmail(token: string): Promise<{ message: string }> {
        return this._request('/api/auth/verify-email', { method: 'GET', params: { token } });
    }

    async resendVerificationEmail(email: string): Promise<{ message: string }> {
        return this._request('/api/auth/resend-verification', { method: 'POST', body: { email } });
    }

    async logout(): Promise<{ message: string }> {
        // Le token est ajouté automatiquement par _request
        return this._request('/api/auth/logout', { method: 'POST' });
    }

    async logoutAllDevices(): Promise<{ message: string }> {
        return this._request('/api/auth/logout_all_devices', { method: 'POST' });
    }

    async getMe(): Promise<{ user: UserInterface & { addresses: any[], phone_numbers: any[] } }> {
        // Le middleware Auth garantit que l'utilisateur est chargé
        return this._request('/api/auth/me', { method: 'GET' });
    }

    async updateUser(data: { full_name?: string; password?: string; password_confirmation?: string }): Promise<{ user: UserInterface }> {
        return this._request('/api/auth/me', { method: 'PUT', body: data });
    }

    async deleteAccount(): Promise<{ message: string }> {
        return this._request('/api/auth/me', { method: 'DELETE' });
    }

    // == Produits ==
    async getProducts(filter: FilterType): Promise<ListType<ProductInterface>> {
        return this._request('/get_products', { method: 'GET', params: filter });
    }

    async createProduct({ product, views }: CreateProductParams): Promise<{ message: string, product: ProductInterface }> {
        const formData = await this.buildFormData({
            data: product,
            files: { views }
        })
        return this._request('/create_product', { method: 'POST', body: formData, isFormData: true });
    }

    async updateProduct(product: Partial<ProductInterface> & { product_id?: string }): Promise<{ message: string, product?: Partial<ProductInterface> }> {
        delete product.features
        product.product_id = product.product_id || product.id;
        if (!product.product_id) return {
            message: 'Error product.id or product.product_id is required before send to server'
        }
        const formData = await this.buildFormData({
            data: product
        })
        return this._request('/update_product', { method: 'PUT', body: formData, isFormData: true });
    }

    async deleteProduct(productId: string): Promise<{ message: string }> {
        return this._request(`/delete_product/${productId}`, { method: 'DELETE' });
    }

    // == Catégories ==
    async getCategories(filter: any): Promise<ListType<CategoryInterface>> { // Adapter type filter
        return this._request('/get_categories', { method: 'GET', params: filter });
    }

    async createCategory(formData: FormData): Promise<{ message: string, category: CategoryInterface }> {
        return this._request('/create_category', { method: 'POST', body: formData, isFormData: true });
    }

    async updateCategory(formData: FormData): Promise<{ message: string, category: CategoryInterface }> {
        // L'ID catégorie doit être dans le FormData (ex: 'category_id')
        return this._request('/update_category', { method: 'PUT', body: formData, isFormData: true });
    }

    async deleteCategory(categoryId: string): Promise<{ message: string, isDeleted: boolean }> {
        return this._request(`/delete_category/${categoryId}`, { method: 'DELETE' });
    }

    async getSubCategories(parentId: string): Promise<CategoryInterface[]> {
        return this._request('/get_sub_categories', { method: 'GET', params: { category_id: parentId } });
    }

    async getCategoryFilters(slug?: string): Promise<any[]> {
        return this._request('/get_filters', { method: 'GET', params: { slug } });
    }


    // == Features & Values (simplifié, multiple_update est clé) ==
    async getFeatures(filter: { feature_id?: string, product_id?: string }): Promise<ListType<FeatureInterface>> {
        return this._request('/get_features', { method: 'GET', params: filter });
    }
    async getFeaturesWithValues(filter: { feature_id?: string, product_id?: string }): Promise<FeatureInterface[]> {
        return this._request('/get_features_with_values', { method: 'GET', params: filter });
    }


    // create_feature, update_feature, delete_feature sont moins utilisés directement si multiple_update fonctionne bien
    async multipleUpdateFeaturesValues(data: BuildFormDataForFeaturesValuesParam): Promise<{ message: string, product?: ProductInterface }> {
        const formData = await this.buildFormDataForFeaturesValues(data);
        if (!formData) {
            return {
                message: 'Error avant l\'envoie de la requette, '
            }
        }
        return this._request('/muptiple_update_features_values', { method: 'POST', body: formData, isFormData: true });
    }

    // Ajouter create/update/delete Value si nécessaire

    // == Détails Produit ==
    async getDetails(filter: { product_id?: string, detail_id?: string, page?: number, limit?: number }): Promise<ListType<DetailInterface>> {
        return this._request('/get_details', { method: 'GET', params: filter });
    }
    async createDetail(formData: FormData): Promise<{ message: string, detail: DetailInterface }> {
        return this._request('/create_detail', { method: 'POST', body: formData, isFormData: true });
    }
    async updateDetail(detailId: string, formData: FormData): Promise<{ message: string, detail: DetailInterface }> {
        // Mettre l'ID dans le body FormData ou l'ajouter à l'URL ? Ici on suppose body
        formData.append('id', detailId); // S'assurer que l'ID est bien envoyé
        return this._request('/update_detail', { method: 'PUT', body: formData, isFormData: true });
    }
    async deleteDetail(detailId: string): Promise<{ message: string, isDeleted: boolean }> {
        return this._request(`/delete_detail/${detailId}`, { method: 'DELETE' });
    }

    // == Commandes ==
    async createOrder(data: any): Promise<{ message: string, order: CommandInterface }> {
        return this._request('/create_user_order', { method: 'POST', body: data });
    }
    async getMyOrders(filter: any): Promise<ListType<CommandInterface>> { // Type pour filter
        return this._request('/get_orders', { method: 'GET', params: filter });
    }
    async getAllOrders(filter: CommandFilterType): Promise<ListType<CommandInterface>> {
        return this._request('/get_users_orders', { method: 'GET', params: filter });
    }
    async updateOrderStatus(data: { user_order_id: string, status: OrderStatus, message?: string, estimated_duration?: number }): Promise<{ message: string, order: CommandInterface }> {
        return this._request('/update_user_order', { method: 'PUT', body: data });
    }
    async deleteOrder(orderId: string): Promise<{ message: string, isDeleted: boolean }> {
        return this._request(`/delete_user_order/${orderId}`, { method: 'DELETE' });
    }


    // == Panier ==
    async updateCart(data: { product_id: string, mode: string, value?: number, bind?: Record<string, any>, ignoreStock?: boolean }): Promise<any> { // Adapter type retour
        return this._request('/update_cart', { method: 'POST', body: data });
    }
    async viewCart(): Promise<{ cart: any, total: number }> { // Adapter type retour
        return this._request('/view_cart', { method: 'GET' });
    }
    async mergeCartOnLogin(): Promise<any> { // Adapter type retour
        return this._request('/merge_cart_on_login', { method: 'POST' });
    }

    // == Commentaires ==
    async createComment(formData: FormData): Promise<{ message: string, comment: CommentInterface }> {
        return this._request('/create_comment', { method: 'POST', body: formData, isFormData: true });
    }
    async getCommentForOrderItem(orderItemId: string): Promise<CommentInterface | null> {
        return this._request('/get_comment', { method: 'GET', params: { order_item_id: orderItemId } });
    }
    async getComments(filter: any): Promise<ListType<CommentInterface>> { // Adapter type filter
        return this._request('/get_comments', { method: 'GET', params: filter });
    }
    async updateComment(formData: FormData): Promise<{ message: string, comment: CommentInterface }> {
        // comment_id doit être dans le FormData
        return this._request('/update_comment', { method: 'PUT', body: formData, isFormData: true });
    }
    async deleteComment(commentId: string): Promise<{ message: string }> {
        return this._request(`/delete_comment/${commentId}`, { method: 'DELETE' });
    }


    // == Favoris ==
    async addFavorite(productId: string): Promise<any> { // Adapter type retour
        return this._request('/create_favorite', { method: 'POST', body: { product_id: productId } });
    }
    async getFavorites(filter: any): Promise<ListType<FavoriteInteraface & { product: ProductInterface }>> { // Type filter et retour
        return this._request('/get_favorites', { method: 'GET', params: filter });
    }
    async updateFavorite(favoriteId: string, label: string): Promise<FavoriteInteraface> {
        return this._request('/update_favorites', { method: 'PUT', body: { favorite_id: favoriteId, label } });
    }
    async removeFavorite(favoriteId: string): Promise<{ message: string, isDeleted: boolean }> {
        return this._request(`/delete_favorite/${favoriteId}`, { method: 'DELETE' });
    }

    // == Adresses & Téléphones User ==
    async createUserAddress(data: { name: string, longitude: number, latitude: number }): Promise<{ message: string, address: any }> { // Type retour
        return this._request('/create_user_address', { method: 'POST', body: data });
    }
    async getUserAddresses(addressId?: string): Promise<any[]> { // Type retour
        return this._request('/get_user_address', { method: 'GET', params: { id: addressId } });
    }
    async updateUserAddress(data: { id: string, name?: string, longitude?: number, latitude?: number }): Promise<{ message: string, address: any }> { // Type retour
        return this._request('/update_user_address', { method: 'PUT', body: data });
    }
    async deleteUserAddress(addressId: string): Promise<null> { // Retourne 204
        return this._request(`/delete_user_address/${addressId}`, { method: 'DELETE' });
    }
    // Ajouter méthodes pour UserPhones de manière similaire

    // == Clients (Users) ==
    async getUsers(filter: UserFilterType): Promise<ListType<UserInterface>> {
        return this._request('/get_users', { method: 'GET', params: filter });
    }
    // Ajouter deleteClient si nécessaire (appelle /delete_account ou une route admin?)

    // == Collaborateurs (Roles) ==
    async getCollaborators(filter: { page?: number, limit?: number }): Promise<ListType<Role & { user: UserInterface }>> {
        return this._request('/list_role', { method: 'GET', params: filter });
    }
    async createCollaborator(email: string): Promise<{ message: string, role: Role & { user: UserInterface } }> {
        return this._request('/create_collaborator', { method: 'POST', body: { email } }); // Ajuster selon API final (POST vs GET)
    }
    async updateCollaboratorPermissions(userId: string, permissions: Partial<TypeJsonRole>): Promise<{ message: string, role: Role & { user: UserInterface } }> {
        return this._request('/add_remove_permission', { method: 'POST', body: { collaborator_user_id: userId, permissions } });
    }
    async removeCollaborator(userId: string): Promise<{ message: string, isDeleted: boolean }> {
        return this._request(`/remove_collaborator/${userId}`, { method: 'DELETE' });
    }

    // == Inventaires ==
    async getInventories(filter: { inventory_id?: string, page?: number, limit?: number }): Promise<ListType<Inventory>> {
        return this._request('/api/inventories', { method: 'GET', params: filter });
    }
    async createInventory(formData: FormData): Promise<{ message: string, inventory: Inventory }> {
        return this._request('/api/inventories', { method: 'POST', body: formData, isFormData: true });
    }
    async updateInventory(inventoryId: string, formData: FormData): Promise<{ message: string, inventory: Inventory }> {
        // Assumer que l'ID est dans l'URL et non dans FormData pour PUT
        return this._request(`/api/inventories/${inventoryId}`, { method: 'PUT', body: formData, isFormData: true });
    }
    async deleteInventory(inventoryId: string): Promise<{ message: string, isDeleted: boolean }> {
        return this._request(`/api/inventories/${inventoryId}`, { method: 'DELETE' });
    }

    // == Statistiques ==
    async getStats(params: StatParamType): Promise<StatsData> {
        return this._request('/stats', { method: 'GET', params });
    }

    // == Recherche Globale ==
    async globalSearch(text: string): Promise<GlobalSearchType> {
        return this._request('/global_search', { method: 'GET', params: { text } });
    }

    // == Debug ==
    async requestScaleUp(): Promise<{ message: string, jobId: string }> {
        return this._request('/api/debug/request-scale-up', { method: 'GET' });
    }
    async requestScaleDown(): Promise<{ message: string, jobId: string }> {
        return this._request('/api/debug/request-scale-down', { method: 'GET' });
    }

    // --- Helpers potentiels ---
    async buildFormData({ data, files, dataFilesFelds = [] }: { dataFilesFelds?: string[], files?: Record<string, (string | Blob)[]>, data: Record<string, any> }) {
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
    async prepareMultipleFeaturesValues({ currentFeatures, initialFeatures, product_id }: BuildFormDataForFeaturesValuesParam) {
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
    async buildFormDataForFeaturesValues({ currentFeatures, initialFeatures, product_id }: BuildFormDataForFeaturesValuesParam) {

        const multiple_update_features = await this.prepareMultipleFeaturesValues({ currentFeatures, initialFeatures, product_id })
        if (!multiple_update_features) return null;

        console.log('avant ==> multi_update_features', { multiple_update_features, initialFeatures, currentFeatures });
        /************  ENvoie a l'Api  du store    ************/
        try {

            const newFiles = (newV: Partial<ValueInterface>) => {
                (['icon', 'views'] as const).forEach((a) => {

                    if (!Array.isArray(newV[a])) return console.warn('newV[a] n\'est pas array', newV[a]); // Sécurisation

                    (newV as any)[a] = newV[a].map((v, i) => {
                        if (typeof v === 'string') return v; // Conserver les strings

                        if (!(v instanceof Blob)) return console.warn('newV[a][' + i + '] n\'est un string ou Blob', v);; // Sécurité supplémentaire

                        if (!newV.id) {
                            console.warn(`ID manquant pour l'élément ${a}, index ${i}`);
                            return null;
                        }

                        const field = `${newV.id.replace('.', '')}:${a}_${i}`;
                        formData.append(field, v);
                        return field;
                    }).filter(Boolean); // Supprime les valeurs null ou undefined
                });
            }

            const formData = new FormData();
            for (const value of Object.values(multiple_update_features.values)) {
                for (const newV of value.create_values || []) {
                    newFiles(newV)
                }
                for (const newV of value.update_values || []) {
                    newFiles(newV)
                }
            }
            for (const feature of multiple_update_features.create_features || []) {
                for (const newV of feature.values || []) {
                    newFiles(newV)
                }
            }
            formData.append('product_id', product_id);
            formData.append('multiple_update_features', JSON.stringify(multiple_update_features));
            return formData;
        } catch (error) {
            console.error('multiple_features_values', error);
        }
        return null
    }
} // Fin classe SublymusApi
