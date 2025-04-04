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
            min_price: filter.min_price||baseFilter?.min_price,
            max_price: filter.max_price||baseFilter?.max_price,
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
            <label htmlFor="product-search-input" className='label-icon-right'>
                <input
                    className={"editor "}
                    placeholder="Nom, description, #id"
                    id="product-search-input"
                    type="text"
                    value={filter.search || ''}
                    onChange={(e) => {
                        const search = e.currentTarget.value;
                        s.isUpdated = true;
                        setFilter((prev) => ({ ...prev, search }));
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
            <div className={`order-filter ${currentFilter == 'order' ? 'active' : ''} ${filter.order_by ? 'collected' : ''}`} onClick={() => {
                setCurrentFilter(currentFilter == 'order' ? '' : 'order');
            }}><span>Ordre</span> <IoChevronDown /></div>
            <div className={`price-filter ${currentFilter == 'price' ? 'active' : ''} ${filter.min_price||filter.max_price ? 'collected' : ''}`} onClick={() => {
                setCurrentFilter(currentFilter == 'price' ? '' : 'price');
            }}><span>Prix</span> <IoChevronDown /></div>

        </div>
        <div className="chose">
            <OrderFilterComponent active={currentFilter == 'order'} order={filter.order_by} setOrder={(order_by) => {
                setCollected({
                    ...filter,
                    order_by,
                })
            }} />
            <PriceFilterComponent active={currentFilter == 'price'} prices={[filter.min_price,filter.max_price]} setPrice={(prices) => {
                setCollected({
                    ...filter,
                    min_price: prices?.[0],
                    max_price: prices?.[1]
                })
            }} />
        </div>
    </div>
}
