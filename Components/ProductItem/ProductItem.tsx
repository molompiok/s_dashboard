import { IoPeopleSharp, IoStarHalf } from 'react-icons/io5';
import { ProductInterface } from '../../Interfaces/Interfaces'
import { getFileType, shortNumber } from '../Utils/functions';
import './ProductItem.css'
import { getImg } from '../Utils/StringFormater';
import { getDefaultValues } from '../Utils/parseData';
import { useStore } from '../../pages/stores/StoreStore';
import { markdownToPlainText } from '../MarkdownViewer/MarkdownViewer';
export { ProductItem }
function ProductItem({ product, onClick, openProduct =true}: { openProduct?:boolean,onClick?: () => void, product: ProductInterface }) {

    const { currentStore } = useStore()
    const rating = 2.5
    const n = 1342
    const values = getDefaultValues(product);
    const v = values[0]?.views?.[0];
    return <a href={openProduct?`/products/${product.id}`:undefined} className="product-item" onClick={onClick}>
        <div className="views">
            {(getFileType(v) == 'image' ?
                <div className="view" style={{
                    width: '100%',
                    height: '100%',
                    background: getImg(
                        typeof v == 'string' ? v
                            :v===undefined?'/res/empty/empty-image.jpg' : URL.createObjectURL(v),
                        undefined, typeof v == 'string' ?
                        currentStore?.url : undefined
                    )
                }}></div>
                : <video muted={true} autoPlay loop className="view" src={
                    typeof v == 'string' ? `${currentStore?.url}${v.startsWith('/') ? v : '/' + v}`:v===undefined?'/res/empty/empty-image.jpg' : URL.createObjectURL(v)} />
            )
            }
        </div>
        <div className="infos">
            <h2 className='ellipsis'>{product.price}</h2>
            <h3>{product.name}</h3>
            <p>{markdownToPlainText(product.description)}</p>
            <div className="rating">
                <span>
                    <IoStarHalf />
                    {product.rating}
                </span>
                <span style={{ whiteSpace: 'nowrap' }}><IoPeopleSharp />
                    {shortNumber(product.comment_count)}</span>
            </div>
        </div>
    </a>
}
//TODO pouir les images transparentres, demie card pour les info est l'image en haut 
/*

* * * * * * * * *
*  - - - - - -  *
*  -         -  *
*  -         -  *
* *-* * * * *-  *
*  - - - - - -  *
*      info     *
*               *
*               *
* * * * * * * * *



*/