import { ProductItem } from '../../../Components/ProductItem/ProductItem'
import './ProductList.css'
import { getImg } from '../../../Components/Utils/StringFormater';
import { useProductStore } from '../ProductStore';
import { useEffect } from 'react';
import { useStore } from '../../stores/StoreStore';
export { ProductList }


function ProductList() {
    const {products, fetchProducts} = useProductStore()
    const {currentStore} = useStore()
    useEffect(()=>{
        fetchProducts({})
    },[currentStore]);
    return <div className="product-list">
        <h1>List des Produits</h1>
        <div className="list">
        <AddProduct/>
            {
                products?.list.map((p, i) => <ProductItem key={i} product={p} />)
            }
        </div>
    </div>
}


function AddProduct() {

    return <a href='/products/new' className="add-product column-center product-item">
            <div className="empty" style={{background:getImg('/res/empty/Empty_bag.png')}}></div>

        <button>Ajoutez un produit</button>
    </a>
}