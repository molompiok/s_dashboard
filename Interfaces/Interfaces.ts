
export type ThemeSettingsValues = Record<string, any>;

// src/Interfaces/Interfaces.ts

// --- Types pour Stats (Nouvelle Structure) ---
export type StatsPeriod = 'day' | 'week' | 'month'; // Utiliser celui de StatsUtils?

// Paramètres communs pour les requêtes stats
export interface BaseStatsParams {
    period?: StatsPeriod;
    start_at?: string; // ISO Date string
    count?: number;
    end_at?:string,
    user_id?: string; // Filtre client
    product_id?: string; // Filtre produit
}

// Options Include pour Visites
export interface VisitStatsIncludeOptions {
    browser?: boolean;
    os?: boolean;
    device?: boolean;
    landing_page?: boolean;
    referrer?: boolean;
}

// Options Include pour Commandes
export interface OrderStatsIncludeOptions {
    status?: boolean;
    payment_status?: boolean;
    payment_method?: boolean;
    with_delivery?: boolean;
}

// Réponse pour KPIs
export interface KpiStatsResponse {
    totalRevenue: number;
    totalOrders: number;
    totalVisits: number;
    uniqueVisitors: number; // Clarifier la définition exacte (total période?)
    conversionRate: number; // En % (ex: 1.23 pour 1.23%)
    averageOrderValue: number;
    // Ajouter d'autres KPIs si besoin
}

// Réponse pour Visites Détaillées
export interface VisitStatsResultItem {
    date: string; // Format YYYY-MM-DD ou YYYY-MM
    visits: number;
    users_count: number;
    // Champs optionnels basés sur 'include'
    browser?: Record<string, number>;
    os?: Record<string, number>;
    device?: Record<string, number>;
    pageUrl?: Record<string, number>;
    referrer?: Record<string, number>;
}
export type VisitStatsResponse = VisitStatsResultItem[]; // Directement le tableau

// Réponse pour Commandes Détaillées
export interface OrderStatsResultItem {
    date: string;
    users_count: number;
    orders_count: number;
    total_price: number;
    items_count: number;
    return_delivery_price: number;
    // Champs optionnels basés sur 'include'
    status?: Record<string, number>;
    payment_status?: Record<string, number>;
    payment_method?: Record<string, number>;
    with_delivery?: Record<string, number>; // Clés 'true'/'false'?
}
export type OrderStatsResponse = OrderStatsResultItem[]; // Directement le tableau

// --- Fin Types Stats ---


// --- Types pour Auth (Reset/Setup) ---
export interface ForgotPasswordParams {
  email: string;
  callback_url: string; // URL Frontend pour le lien de reset
}

export interface ResetPasswordParams {
  token: string;
  password: string;
  password_confirmation: string;
}

export interface SetupAccountParams {
  token: string;
  password: string;
  password_confirmation: string;
}
export type SetupAccountResponse = MessageResponse; // Simple message de succès a priori

// --- Types pour Collaborateurs (Roles) ---
export interface CreateCollaboratorParams {
  email: string;
  full_name?: string; // Nom optionnel pour création
}

export const JsonRole = {
  filter_client: '',
  ban_client: '',
  filter_collaborator: '',
  ban_collaborator: '',
  create_delete_collaborator: '',
  manage_interface: '',
  filter_product: '',
  edit_product: '',
  create_delete_product: '',
  manage_scene_product: '',
  chat_client: '',
  filter_command: '',
  manage_command: '',
} as const


export type TypeJsonRole = {
  [k in keyof typeof JsonRole]: (typeof JsonRole)[k] extends '' ? boolean : string;
}

export type AnnimationType = {
  slidesGrid: number[];
  translate: number;
  realIndex: number;
  size: number
}
export type ListType<T> = {
  list: T[],
  meta: {
    total: number,
    per_page: number,
    current_page: number,
    last_page: number,
    first_page: number,
    first_page_url: string | null,
    last_page_url: string | null,
    next_page_url: string | null,
    previous_page_url: string | null
  }
}

export interface StoreFilterType {
  search?: string;            // Recherche par nom, titre, description?
  is_active?: boolean // Filtrer par statut actif/inactif
  // Ajouter d'autres filtres si l'API les supporte (ex: par date d'expiration, plan, etc.)
  page?: number;
  limit?: number;
  order_by?: 'name_asc' | 'name_desc' | 'created_at_asc' | 'created_at_desc' | 'expire_at_asc' | 'expire_at_desc'; // Options de tri possibles

  // Technique (optionnel, si utilisé par le hook)
  no_save?: boolean; // Pour compatibilité avec l'ancien code Zustand? Généralement pas nécessaire avec React Query.
}

export interface StoreSetting {
  legal_name?: string;
  legal_id?: string;
  legal_address_street?: string;
  legal_address_city?: string;
  legal_address_zip?: string;
  legal_address_country?: string; // Code ISO du pays (ex: CI, FR)
  public_email?: string;
  public_phone?: string;
  default_locale?: string; // ex: 'fr', 'en'
  currency?: string; // ex: 'XOF', 'EUR'
  timezone?: string; // ex: 'Africa/Abidjan', 'Europe/Paris'
}

// Rappel de l'interface Store (avec ajout potentiel des relations chargées)
export type StoreInterface = Partial<{
  id: string;
  user_id: string;
  name: string;
  title?: string; // Peut être null
  description?: string; // Peut être null
  slug: string;
  logo: (string | Blob)[],
  favicon: (string | Blob)[],
  cover_image: (string | Blob)[],
  domain_names?: string[];
  current_theme_id: string;
  current_api_id: string; // Corrigé depuis le modèle
  expire_at: string; // Date ISO string ou null
  disk_storage_limit_gb: number;
  is_active: boolean;
  is_running?: boolean;
  created_at: string;
  updated_at: string;
  url?: string;
  timezone?: string,
  currency?: string,
  currentApi?: ApiInterface; // Définir ApiInterface
  currentTheme?: ThemeInterface; // Définir ThemeInterface
}>

export interface ThemeOptionDefinition {
  key: string;
  type: 'color' | 'font' | 'text' | 'select' | 'toggle' | 'image' | string; // Ajouter d'autres types si besoin
  labelKey: string;
  defaultValue?: any;
  options?: { value: string; labelKey: string }[]; // Pour le type 'select'
  section: string;
  descriptionKey?: string; // Clé i18n pour l'aide/description
  // Ajouter d'autres métadonnées si nécessaire (ex: validation, conditions d'affichage)
}


export interface ToggleControlProps {
  option: ThemeOptionDefinition;
  value: boolean | undefined | null; // La valeur est booléenne
  onChange: (key: string, value: boolean) => void;
}


export interface StoreFilterType {
  search?: string;            // Recherche par nom, titre, description?
  status?: 'active' | 'inactive' | 'all'; // Filtrer par statut actif/inactif
  // Ajouter d'autres filtres si l'API les supporte (ex: par date d'expiration, plan, etc.)
  page?: number;
  limit?: number;
  order_by?: 'name_asc' | 'name_desc' | 'created_at_asc' | 'created_at_desc' | 'expire_at_asc' | 'expire_at_desc'; // Options de tri possibles

  // Technique (optionnel, si utilisé par le hook)
  no_save?: boolean; // Pour compatibilité avec l'ancien code Zustand? Généralement pas nécessaire avec React Query.
}

export interface ApiInterface {

}

export interface ThemeFilterType{
  search?: string;            
  page?: number;
  limit?: number;
  order_by?: 'name_asc' | 'name_desc' | 'created_at_asc' | 'created_at_desc' ; // Options de tri possibles
}

export interface ThemeInterface { // Ajout interface Theme basée sur modèle
  id: string;
  name: string;
  slug: string;
  description: string | null;
  preview_images: string[] | null;
  features: string[] | null;
  docker_image_name: string;
  docker_image_tag: string;
  internal_port: number;
  source_path: string | null;
  is_public: boolean;
  is_active: boolean;
  is_default: boolean;
  is_premium: boolean;
  price: number;
  creator_id: string | null;
  createdAt: string;
  updatedAt: string;
  fullImageName?: string; // Getter virtuel
}



export type CategorySortOptions =
  | 'name_asc'
  | 'name_desc'
  | 'created_at_desc'
  | 'created_at_asc'
  | 'product_count_desc' // Si le compte produit est disponible et triable
  | 'product_count_asc'; // Si le compte produit est disponible et triable

// Interface pour les filtres de la liste des catégories
export interface CategoryFilterType {
  // Filtres de recherche/identification
  search?: string;           // Recherche textuelle (nom, description)
  category_id?: string;      // Filtrer par un ID spécifique (pourrait être utilisé par getCategoryById mais inclus ici pour la complétude)
  slug?: string;             // Filtrer par slug spécifique
  parent_id?: string | null; // Filtrer par catégorie parente (null pour les catégories racines)

  // Filtres d'affichage
  with_product_count?: boolean; // Inclure le nombre de produits associés
  is_visible?: boolean;         // Filtrer par statut de visibilité (si applicable)

  // Tri
  order_by?: CategorySortOptions; // Option de tri

  // Pagination
  page?: number;
  limit?: number;

  // Technique (optionnel, si utilisé dans le hook useGetCategories)
  no_save?: boolean; // Pourrait indiquer de ne pas mettre à jour un store Zustand (si encore utilisé)
}
export type PeriodType = 'day' | 'week' | 'month';

export type StatParamType = Partial<{
  period: PeriodType,
  stats: ('visits_stats' | 'order_stats')[],
  product_id: string
  user_id: string,
  device: true | undefined,
  os: true | undefined,
  page_url: true | undefined,
  referrer: true | undefined,
  browser: true | undefined,
  status: true | undefined,
  payment_method: true | undefined,
  payment_status: true | undefined,
  with_delivery: true | undefined
}
>

export interface StatsData {
  visits_stats?: Array<{
    date: string;
    visits: number;
    users_count: number;
    browser?: Record<string, number>;
    os?: Record<string, number>;
    device?: Record<string, number>;
    pageUrl?: Record<string, number>;
    [key: string]: any;
  }>;

  order_stats?: Array<{
    date: string;
    users_count: number;
    orders_count: number;
    total_price: number;
    items_count: number;
    return_delivery_price: number;
    status?: Record<string, number>;
    payment_status?: Record<string, number>;
    payment_method?: Record<string, number>;
    with_delivery?: Record<string, number>;
    [key: string]: any;
  }>;
}


export interface CommentInterface {
  id: string
  user_id: string
  product_id: string
  order_item_id: string
  bind_name: Record<string, ValueInterface>
  order_id: string
  title: string
  description: string
  rating: number
  views: string[]
  created_at: string
  updated_at: string
  user?: UserInterface
  product?: ProductInterface
}

export interface DetailInterface {
  id: string,
  product_id: string,
  title?: string,
  description?: string,
  view?: (string | Blob)[],
  index: number
  type?: string,
  created_at: string
  updated_at: string
}


export type EventStatus = {
  change_at: string,
  status: string,
  estimated_duration?: number,
  message?: string,
  user_role: 'client' | 'admin' | 'owner' | 'collaborator' | 'supervisor',
  user_provide_change_id: string
}

export type FilterType = {
  order_by?: "date_desc" | "date_asc" | "price_desc" | "price_asc" | undefined;
  product_id?: string,
  slug?: string,
  categories_id?: string[],
  slug_cat?: string,
  slug_product?: string,
  page?: number,
  with_feature?: boolean,
  limit?: number,
  is_visible?: boolean,
  no_save?: boolean,
  min_price?: number | undefined,
  max_price?: number | undefined,
  search?: string
};

export type CommandFilterType = Partial<{
  command_id: string,
  user_id: string,
  order_by?: "date_desc" | "date_asc" | "total_price_desc" | "total_price_asc" | undefined,
  page: number,
  product_id: string,
  limit: number,
  no_save: boolean,
  status: string[],
  min_price: number | undefined,
  max_price: number | undefined,
  min_date: string | undefined,
  max_date: string | undefined,
  with_items: boolean,
  search?: string
}>
export type UserFilterType = Partial<{
  // role:'client'|'collaborator'|'admin'|'team',
  with_client_role: boolean,
  with_client_stats: boolean,
  with_adresses: boolean,
  with_phones: boolean,
  user_id: string,
  order_by?: "date_desc" | "date_asc" | "full_name_desc" | "full_name_asc" | undefined,
  page: number,
  limit: number,
  no_save: boolean,
  status: string[],
  min_date: string | undefined,
  max_date: string | undefined,
  with_addresses: boolean,
  with_avg_rating: boolean,
  with_comments_count: boolean,
  with_products_bought: boolean,
  with_orders_count: boolean,
  with_total_spent: boolean,
  with_last_visit: boolean,
  search?: string
}>

export type UpdateValue = {
  update: Partial<ValueInterface>[],
  create: Partial<ValueInterface>[],
  delete: string[],
}

export type UpdateFeature = {
  update: Partial<FeatureInterface>[],
  create: Partial<FeatureInterface>[],
  delete: string[],
}


export interface ResetPasswordParams {
  token: string;
  password: string;
  password_confirmation: string;
}

export interface ForgotPasswordParams {
  email: string;
  callback_url: string; 
}

export type MessageResponse = { message: string }; 

export interface VisiteInterface {
  user_id: string
  created_at?: string
  is_month: boolean
  is_authenticate?: boolean // si tu veux le passer temporairement côté front / debug
}

export interface UserInterface {
  id: string,
  full_name: string,
  email: string,
  user_phones?: UserPhoneInterface[],
  user_addresses?: UserAddressInterface[]
  password: string,
  photo?: (string|Blob)[] | null,
  locale:string
  roles?: Role[],
  token: string;
  created_at: string,
  status: 'BANNED' | 'PREMIUM' | 'NEW' | 'CLIENT'
  s_type?: string;
  stats?: UserStats
}

export interface UserAddressInterface {
  id: string;
  user_id: string;
  name: string;           // Label/Nom de l'adresse (ex: 'Maison', 'Bureau')
  longitude: number;
  latitude: number;
  created_at: string;     // Format ISO String
  updated_at: string;     // Format ISO String
}

export interface UserPhoneInterface {
  id: string;
  user_id: string;
  phone_number: string;   // Numéro brut (ex: '07xxxxxxxx')
  format: string | null;  // Format international suggéré (ex: '+225 07 XX XX XX XX')
  country_code: string | null; // Code pays (ex: 'ci', 'fr', 'us') ou code indicatif ('ci_225'?)
  created_at: string;     // Format ISO String
  updated_at: string;     // Format ISO String
}
interface UserStats {
  avgRating?: number,
  commentsCount?: number,
  productsBought?: number,
  totalSpent?: number,
  ordersCount?: number,
  lastVisit?: string | null
}

export interface Role {
  id: string,
  //...
}

export interface CommandItemInterface {
  bind: Record<string, string>
  bind_name: Record<string, ValueInterface>
  created_at: string
  currency: string
  id: string
  order_id: string
  price_unit: number
  product_id: string
  quantity: number
  status: string
  store_id: string
  updated_at: string
  product?: ProductInterface,
}

export interface CommandInterface {
  id: string,
  store_id: string,
  user_id: string,
  reference: string,
  delivery_status: string,
  payment_status: string,
  payment_method: string,
  currency: string,
  total_price: number,
  price_return_delivery: number,
  with_delivery: boolean,
  phone_number: string,
  formatted_phone_number: string,
  country_code: string,
  delivery_price: number,
  events_status: EventStatus[]
  items_count: number,

  delivery_latitude: string,
  delivery_address: string,
  delivery_address_name: string,
  delivery_longitude: string,

  pickup_address: string,
  pickup_date: string,
  pickup_address_name: string,
  delivery_date: string,

  pickup_latitude: string,
  pickup_longitude: string,

  status: string,

  items?: CommandItemInterface[]
  user?: UserInterface
  created_at: string
}

export interface CategoryInterface {
  id: string,
  name: string,
  description: string,
  parent_category_id?: string | null
  store_id: string,
  slug: string,
  product_count?: number
  view: (string | Blob)[],
  icon: (string | Blob)[],
  created_at: string,
  updated_at: string
  is_visible?: boolean
}

export interface ProductInterface {
  id: string;
  store_id: string;
  categories_id: string[];
  name: string;
  default_feature_id: string;
  slug: string,
  description: string;
  barred_price: number;
  price: number;
  rating: number,
  comment_count: number,
  stock?: number | null
  is_visible: boolean,// TODO
  currency: string;
  created_at: Date;
  updated_at: Date;
  features?: FeatureInterface[]
  categories?: CategoryInterface[]
};


export interface ValueInterface {
  id: string;
  feature_id: string;
  views?: (string | Blob)[] | null;
  icon?: (string | Blob)[] | null;
  text?: string | null;
  key?: string | null;
  stock?: number | null
  additional_price?: number | null
  decreases_stock?: boolean,
  continue_selling?: boolean
  index: number;
  created_at?: string | Date;
  updated_at?: string | Date;
  _request_mode?: 'edited' | 'new'
};

export interface FeatureInterface {
  id: string,
  product_id: string,
  name: string,
  type: string,
  icon?: (string | Blob)[],
  required: boolean,
  regex?: string,
  min?: number,
  max?: number,
  min_size?: number,
  max_size?: number,
  index?: number,
  multiple?: false,
  is_double?: false,
  default?: string | null,
  is_default: boolean,
  created_at: string,
  updated_at: string,
  values?: ValueInterface[];
  _request_mode?: 'edited' | 'new'
};
// src/Interfaces/Interfaces.ts (ou un fichier similaire)

// --- Interface pour FavoriteInteraface ---
// Basée sur le modèle FavoriteInteraface.ts et les données retournées par get_favorites
export interface FavoriteInteraface {
  id: string;
  user_id: string;
  label: string; // Le label/tag donné par l'utilisateur
  product_id: string;
  created_at: string; // Format ISO String
  updated_at: string; // Format ISO String
  product?: ProductInterface;
}

// --- Interface pour Inventory ---
// Basée sur le modèle Inventory.ts
export interface Inventory {
  id: string;
  address_name: string; // Nom du point de vente/stock
  views: (string|Blob)[];       // URLs des images (retournées par l'API après upload)
  email: string | null;  // Email de contact (peut être null)
  latitude: number;      // Coordonnée géographique
  longitude: number;     // Coordonnée géographique
  created_at: string;    // Format ISO String
  updated_at: string;    // Format ISO String

  // --- Relations potentielles (non incluses par défaut dans le contrôleur actuel) ---
  // phones?: InventoryPhone[];   // Si on ajoute la relation dans le modèle/contrôleur
  // socials?: InventorySocial[]; // Si on ajoute la relation dans le modèle/contrôleur
}

// --- Interfaces pour les relations d'Inventory (si nécessaires) ---
export interface InventoryPhone {
  id: string;
  inventory_id: string;
  phone_number: string;
  format: string | null;
  country_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventorySocial {
  id: string;
  inventory_id: string;
  name: string;          // Nom du réseau social (ex: 'Facebook', 'Instagram')
  icon: string[] | null; // Icône (URL)
  url: string;           // URL du profil social
  created_at: string;
  updated_at: string;
}


// --- Interface pour GlobalSearchType ---
// Basée sur la structure de retour de GlobaleServicesController.global_search
export interface GlobalSearchType {
  // Note: L'API retourne un objet unique ou un tableau selon la recherche (#id ou texte).
  // L'implémentation de l'API normalise maintenant pour toujours retourner des tableaux.
  products: ProductInterface[];
  categories: CategoryInterface[];
  clients: UserInterface[];       // Résultats de recherche pour les utilisateurs (clients)
  commands: CommandInterface[];   // Résultats de recherche pour les commandes
}
