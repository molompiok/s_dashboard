import { ProductItem } from '../ProductItem/ProductItem'
import './ProductList.css'
import { getImg } from '../Utils/StringFormater';
import { useProductStore } from '../../pages/products/ProductStore';
import { useEffect, useState } from 'react';
import { useStore } from '../../pages/stores/StoreStore';
import { IoChevronDown, IoSearch } from 'react-icons/io5';
import { OrderFilterComponent, PriceFilterComponent } from '../CommandesList/CommandesList';
import { ProductInterface } from '../../Interfaces/Interfaces';
export { ProductList }

type FilterType = {
    search?: string,
    order?: "date_desc" | "date_asc" | "price_desc" | "price_asc" | undefined;
    prices?: [number | undefined, number | undefined] | undefined;
};

function ProductList({ baseFilter }: { baseFilter: Record<string, string> }) {
    const {fetchProducts } = useProductStore()
    const [products,setProducts] = useState<ProductInterface[]>([])
    const [filter, setFilter] = useState<FilterType>({})
    const { currentStore } = useStore()
    useEffect(() => {
        fetchProducts({
            ...baseFilter,
            min_price: filter.prices?.[0],
            max_price: filter.prices?.[1],
            search: filter.search,
            order_by: filter.order,
            no_save:true
        }).then(res=>{
            if(!res?.list) return 
            setProducts(res.list);
        })
    }, [currentStore, filter, baseFilter]);
    return <div className="product-list">
        <div className="top-search">
            <h1>List des Produits</h1>
            <label htmlFor="icon-text-name-input">
                <input
                    className={"editor "}
                    placeholder="Nom de l'option"
                    id="icon-text-name-input"
                    type="text"
                    value={filter.search || ''}
                    onChange={(e) => {
                        const search = e.currentTarget.value;
                        setFilter((prev) => ({ ...prev, search }));
                    }}
                />
                <IoSearch/>
            </label>
        </div>
        <ProductsFilters filter={filter} setCollected={setFilter} />
        <div className="list">
            <AddProduct />
            {
                products.map((p, i) => <ProductItem key={i} product={p} />)
            }
        </div>
    </div>
}


function AddProduct() {

    return <a href='/products/new' className="add-product column-center product-item">
        <div className="empty" style={{ background: getImg('/res/empty/Empty_bag.png') }}></div>

        <button>Ajoutez un produit</button>
    </a>
}


function ProductsFilters({ filter, setCollected }: { filter: any, setCollected: (filter: any) => any }) {

    const [currentFilter, setCurrentFilter] = useState('');

    return <div className="filters no-selectable">
        <div className="onglet">
            <div className={`order-filter ${currentFilter == 'order' ? 'active' : ''} ${filter.order ? 'filter' : ''}`} onClick={() => {
                setCurrentFilter(currentFilter == 'order' ? '' : 'order');
            }}><span>Ordre</span> <IoChevronDown /></div>
            <div className={`price-filter ${currentFilter == 'price' ? 'active' : ''} ${filter.price ? 'filter' : ''}`} onClick={() => {
                setCurrentFilter(currentFilter == 'price' ? '' : 'price');
            }}><span>Prix</span> <IoChevronDown /></div>

        </div>
        <div className="chose">
            <OrderFilterComponent active={currentFilter == 'order'} order={filter.order} setOrder={(order) => {
                setCollected({
                    ...filter,
                    order
                })
            }} />
            <PriceFilterComponent active={currentFilter == 'price'} price={filter.price} setPrice={(price) => {
                setCollected({
                    ...filter,
                    price
                })
            }} />
        </div>
    </div>
}
