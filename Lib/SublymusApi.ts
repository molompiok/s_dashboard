// src/api/SublymusApi.ts (ou chemin similaire)
import { t } from '#utils/functions'; // Assumons que t() est accessible globalement ou importé
import type {
    ListType, ProductInterface, CategoryInterface, UserInterface, StoreInterface,
    CommandInterface, CommentInterface, DetailInterface, Inventory, Role, Favorite,
    FilterType, CommandFilterType, UserFilterType, /* ... autres types d'input/output ... */
    GlobalSearchType, StatsData, StatParamType, EventStatus
} from '../Interfaces/Interfaces'; // Adapter le chemin

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

    constructor(apiUrl: string, getAuthToken: () => string | null) {
        if (!apiUrl) {
            throw new Error(t('api.apiUrlRequired'));
        }
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

        logger.debug(`API Request: ${method} ${url}`); // Log avant l'appel

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
                     throw new ApiError(t('api.parseError'), response.status);
                }
                // Garder responseBody à null si le parsing échoue sur une erreur HTTP
            }

            logger.debug(`API Response: ${response.status} ${response.statusText}`, responseBody ? { bodySlice: JSON.stringify(responseBody).slice(0, 100) } : {});

            if (!response.ok) {
                // Utiliser le message du corps si disponible, sinon un message générique
                const errorMessage = responseBody?.message || t(`api.httpError.${response.status}`, { defaultValue: response.statusText });
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
                 throw new ApiError(t('api.networkError'), 0, { originalError: error.message }); // Status 0 pour erreur réseau
            } else {
                 logger.error({ method, url, error }, "API request failed (Unknown Error)");
                 throw new ApiError(t('api.unknownError'), 0);
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

    async createProduct(formData: FormData): Promise<{ message: string, product: ProductInterface }> {
        return this._request('/create_product', { method: 'POST', body: formData, isFormData: true });
    }

    async updateProduct(formData: FormData): Promise<{ message: string, product: Partial<ProductInterface> }> {
         // L'ID produit doit être dans le FormData (ex: 'product_id')
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
     async multipleUpdateFeaturesValues(formData: FormData): Promise<{ message: string, product: ProductInterface }> {
         // product_id et multiple_update_features (JSON string) doivent être dans le FormData
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
    async getFavorites(filter: any): Promise<ListType<Favorite & { product: ProductInterface }>> { // Type filter et retour
        return this._request('/get_favorites', { method: 'GET', params: filter });
    }
    async updateFavorite(favoriteId: string, label: string): Promise<Favorite> {
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
     // buildFormData(data: Record<string, any>, fileFields: string[] = ['views', 'icon', 'logo', 'cover_image']): FormData { ... }

} // Fin classe SublymusApi

// --- Nouvelle structure pour les clés i18n ---
/*
{
  "api": {
    "apiUrlRequired": "L'URL de l'API est requise pour initialiser le client.",
    "parseError": "Erreur lors de l'analyse de la réponse de l'API.",
    "networkError": "Erreur réseau ou impossible de joindre l'API.",
    "unknownError": "Une erreur inconnue est survenue lors de la requête API.",
    "httpError": {
        "400": "Requête invalide.",
        "401": "Authentification requise.",
        "403": "Accès refusé.",
        "404": "Ressource non trouvée.",
        "422": "Données invalides fournies.",
        "500": "Erreur interne du serveur.",
        "503": "Service indisponible."
    }
  },
  // ... garder toutes les autres clés spécifiques aux modules (auth, product, category, etc.)
}
*/