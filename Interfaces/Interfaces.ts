export type AnnimationType = {
  slidesGrid: number[];
  translate: number;
  realIndex: number;
  size: number
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
    storeId: string,
    view: string[],
    icon: string[],
    createdAt: string,
    updatedAt: string
}
export interface ProductInterface {
  id: string;
  store_id: string;
  category_id: string;
  name: string;
  description: string;
  default_feature_id: string;
  price: number;
  barred_price: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
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



export interface FeatureValueInterface {
  id: string;
  featureId: string;
  currency: string;
  views: (string|Blob)[]; 
  icon: string | null; 
  text: string | null; 
  additionalPrice: number;
  min: number | null; 
  max: number | null;
  minSize: number | null; 
  maxSize: number | null; 
  multiple: boolean;
  isDouble: boolean;
  createdAt: string | Date; 
  updatedAt: string | Date; 
};

export interface FeatureInterface {
  id: string;
  productId: string;
  name: string;
  type: string | null; 
  icon: string[];
  required: boolean;
  default: string | number | null; 
  createdAt: string | Date; 
  updatedAt: string | Date; 
  values: FeatureValueInterface[]; 
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