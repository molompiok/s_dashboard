import { ProductItem } from '../ProductItem/ProductItem'
import './ProductList.css'
import { getImg } from '../Utils/StringFormater';
import { useProductStore } from '../../pages/products/ProductStore';
import { useEffect, useState } from 'react';
import { useStore } from '../../pages/stores/StoreStore';
import { IoChevronDown, IoSearch } from 'react-icons/io5';
import { OrderFilterComponent, PriceFilterComponent } from '../CommandesList/CommandesList';
import { FilterType, ProductInterface } from '../../Interfaces/Interfaces';
export { ProductList }


function ProductList({ baseFilter }: { baseFilter?: FilterType}) {
    const {fetchProducts } = useProductStore()
    const [products,setProducts] = useState<ProductInterface[]>([])
    const [filter, setFilter] = useState<FilterType>({})
    const { currentStore } = useStore()
    
    const [s] = useState({
        isUpdated:true
    });
    useEffect(() => {
        s.isUpdated && fetchProducts({
            ...baseFilter,
            min_price: filter.prices?.[0]||baseFilter?.prices?.[0],
            max_price: filter.prices?.[1]||baseFilter?.prices?.[1],
            search: filter.search||baseFilter?.search,
            order_by: filter.order_by||baseFilter?.order_by,
            no_save:true,
            
        }).then(res=>{
            if(!res?.list) return 
            s.isUpdated = false;
            setProducts(res.list);
        });
    }, [currentStore, filter, baseFilter]);
    return <div className="product-list">
        <div className="product-top-search">
            <h1>List des Produits</h1>
            <label htmlFor="icon-text-name-input" className='label-icon-right'>
                <input
                    className={"editor "}
                    placeholder="Nom de l'option"
                    id="icon-text-name-input"
                    type="text"
                    value={filter.search || ''}
                    onChange={(e) => {
                        const search = e.currentTarget.value;
                        setFilter((prev) => ({ ...prev, search }));
                        s.isUpdated = true;
                    }}
                />
                <IoSearch/>
            </label>
        </div>
        <ProductsFilters filter={filter} setCollected={(f)=>{
            s.isUpdated = true;
            setFilter(f);
        }} />
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


function ProductsFilters({ filter, setCollected }: { filter: FilterType, setCollected: (filter: FilterType) => any }) {

    const [currentFilter, setCurrentFilter] = useState('');

    return <div className="filters no-selectable">
        <div className="onglet">
            <div className={`order-filter ${currentFilter == 'order' ? 'active' : ''} ${filter.order_by ? 'filter' : ''}`} onClick={() => {
                setCurrentFilter(currentFilter == 'order' ? '' : 'order');
            }}><span>Ordre</span> <IoChevronDown /></div>
            <div className={`price-filter ${currentFilter == 'price' ? 'active' : ''} ${filter.prices?.[0]||filter.prices?.[1] ? 'filter' : ''}`} onClick={() => {
                setCurrentFilter(currentFilter == 'price' ? '' : 'price');
            }}><span>Prix</span> <IoChevronDown /></div>

        </div>
        <div className="chose">
            <OrderFilterComponent active={currentFilter == 'order'} order={filter.order_by} setOrder={(order_by) => {
                setCollected({
                    ...filter,
                    order_by
                })
            }} />
            <PriceFilterComponent active={currentFilter == 'price'} prices={filter.prices} setPrice={(prices) => {
                setCollected({
                    ...filter,
                    prices
                })
            }} />
        </div>
    </div>
}
