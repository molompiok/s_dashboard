export type AnnimationType = {
  slidesGrid: number[];
  translate: number;
  realIndex: number;
  size: number
}
export type ListType<T> = {
    list:T[],
    meta:{}
}

export interface StoreInterface {
    id:string,
    user_id:string,
    name: string,
    title: string
    description: string,
    cover_image: (string |  Blob)[],
    domaines:string[],
    logo: (string | File)[],
    disk_storage_limit_gb:number,
    url:string,
    expire_at:string,
    created_at:string,
}

export interface UserInterface {
  id: string,
  name: string,
  email: string,
  phone?: string,
  password: string,
  photos: string[],
  // roles?: Role[],
  token: string;
  created_at: string,
  // status: Status | 'NEW'
  // s_type?: string;
}

export interface CommandInterface{
    id: '1324389495',
    store_id: '',
    user_id: '',
    reference: '6fa89c0',
    delivery_status: 'encours',
    payment_status: 'no',
    payment_method: '',
    currency: '',
    total_price: '25699',
    price_delivery: '',
    price_return_delivery: '',
    with_delivery: 'true',
    phone_number_customer: '',
    format_number_customer: '',
    country_code_customer: '',
    pickup_address: '',
    pickup_date: '',
    delivery_date: '',
    delivery_address: '',
    longitude_delivery: '',
    latitude_delivery: '',
    latitude_pickup: '',
    longitude_pickup: '',
    pickup_address_name: '',
    delivery_address_name: '',
}

export interface CategoryInterface{
    id: string,
    name: string,
    description: string,
    parent_category_id?:string
    store_id: string,
    slug:string,
    view: (string|Blob)[],
    icon: (string|Blob)[],
    createdAt: string,
    updatedAt: string
}
export interface ProductInterface {
  id: string;
  store_id: string;
  category_id: string;
  name: string;
  default_feature_id: string;
  slug: string,
  description: string;
  barred_price: number;
  price: number;
  is_visible:boolean,// TODO
  currency: string;
  createdAt: Date;
  updatedAt: Date;
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
  featureId: string;
  views: (string|Blob)[]|null; 
  icon:  (string|Blob)[] | null; 
  text: string | null; 
  index: number;
  createdAt: string | Date; 
  updatedAt: string | Date; 
};

export interface FeatureInterface {
  id: string,
  product_id: string,
  name: string,
  type: string,
  icon?: (string|Blob)[],
  required: boolean,
  regex?: string,
  min?: string,
  max?: string,
  min_size?: string,
  max_size?: string,
  index?: string,
  multiple?: false,
  is_double?: false,
  default?: string,
  created_at:string,
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