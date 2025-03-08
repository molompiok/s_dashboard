import { ProductItem } from '../../../Components/ProductItem/ProductItem'
import './ProductList.css'
export {ProductList}


function ProductList() {
    

    return <div className="product-list">
        <h1>List des Produits</h1>
        <div className="list">
        {Array.from({length:12}).map((_,i)=><ProductItem key={i} product={{} as any} />)}
        </div>
    </div>
}