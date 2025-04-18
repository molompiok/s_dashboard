export type AnnimationType = {
  slidesGrid: number[];
  translate: number;
  realIndex: number;
  size: number
}
export type ListType<T> = {
  list: T[],
  meta: {}
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
  user_id: string,
  order_by?: "date_desc" | "date_asc" | "full_name_desc" | "full_name_asc" | undefined,
  page: number,
  limit: number,
  no_save: boolean,
  status: string[],
  min_date: string | undefined,
  max_date: string | undefined,
  with_addresses: boolean,
  with_phones: boolean,
  with_avg_rating:boolean,
  with_comments_count:boolean,
  with_products_bought:boolean,
  with_orders_count:boolean,
  with_total_spent:boolean,
  with_last_visit:boolean,
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

export interface VisiteInterface {
  user_id: string
  created_at?: string
  is_month: boolean
  is_authenticate?: boolean // si tu veux le passer temporairement côté front / debug
}

export interface StoreInterface {
  id: string,
  user_id: string,
  name: string,
  title: string
  description: string,
  cover_image: (string | Blob)[],
  domaines: string[],
  logo: (string | File)[],
  disk_storage_limit_gb: number,
  url: string,
  expire_at: string,
  created_at: string,
}

export interface UserInterface {
  id: string,
  full_name: string,
  email: string,
  phone?: string,
  password: string,
  photo?: string[] | null,
  roles?: Role[],
  token: string;
  created_at: string,
  status: 'BANNED' | 'PREMIUM' | 'NEW' | 'CLIENT'
  s_type?: string;
  stats?: UserStats
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
  name: string,
  access: 'store' | 'system' | 'none',
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
  with_delivery: string,
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
  parent_category_id?: string
  store_id: string,
  slug: string,
  product_count?: number
  view: (string | Blob)[],
  icon: (string | Blob)[],
  created_at: string,
  updated_at: string
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
  is_visible: boolean,// TODO
  currency: string;
  created_at: Date;
  updated_at: Date;
  features?: FeatureInterface[]
};

export interface ProductFavoriteInterface {
  id: string;
  store_id: string;
  category_id: string | null;
  name: string;
  default_feature_id: string;
  description: string;
  barred_price: number | null;
  price: number;
  currency: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  label: string;
  product_id: string;
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
  created_at: string | Date;
  updated_at: string | Date;
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
  default?: string,
  created_at: string,
  updated_at: string,
  values?: ValueInterface[];
};

export interface FeaturesResponseInterface {
  features: FeatureInterface[]; // Tableau de Feature
};
export interface GroupFeatureInterface {
  id: string,
  product_id: string,
  stock: number,
  bind: object,
  created_at: string,
  updated_at: string
}


export interface MetaPaginationInterface {
  "total": number,
  "perPage": number,
  "currentPage": number,
  "lastPage": number,
  "firstPage": number,
  "firstPageUrl": string,
  "lastPageUrl": string,
  "nextPageUrl": null,
  "previousPageUrl": null
}
type ProductPick = 'barred_price' | 'description' | 'name' | 'id' | 'price' | 'currency' | 'default_feature_id';

export type ProductClientInterface = Pick<ProductInterface, ProductPick> 