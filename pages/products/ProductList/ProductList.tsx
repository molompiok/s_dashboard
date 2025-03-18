
import { IoAddSharp } from 'react-icons/io5';
import { ProductItem } from '../../../Components/ProductItem/ProductItem'
import './ProductList.css'
import { FaBoxOpen, FaPlusCircle } from "react-icons/fa";
import { getImg } from '../../../Components/Utils/StringFormater';
export { ProductList }


function ProductList() {
    const products = Array.from({ length: 0 });

    return <div className="product-list">
        <h1>List des Produits</h1>
        <div className="list">
        <AddProduct/>
            {
                products.map((_, i) => <ProductItem key={i} product={{} as any} />)
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