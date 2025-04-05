import { getDefaultValues } from "../Utils/parseData";
import { ProductInterface } from "../../Interfaces/Interfaces";
import { useStore } from "../../pages/stores/StoreStore";
import { getImg } from "../Utils/StringFormater";
import { limit, shortNumber } from "../Utils/functions";
import { markdownToPlainText } from "../MarkdownViewer/MarkdownViewer";
import { IoPeopleSharp, IoPricetag, IoStarHalf } from "react-icons/io5";

import './ProductPreview.css';


export {ProductPreview}

function ProductPreview({ product }: { product: Partial<ProductInterface> }) {
  const { currentStore } = useStore()
  const values = getDefaultValues(product);
  const view = values[0]?.views?.[0];

  return <a href={`/products/${product.id}`} className="product-preview">
    <div className="icon-80 view" style={{
      background:
        view ? getImg(
          view,
          undefined, currentStore?.url
        ) : getImg('/res/empty/empty-image.jpg', '160%')
    }}></div>
    <div className="product-info">
      <h2 className='ellipsis'>{limit(product?.name, 56)}</h2>
      <span>{limit(markdownToPlainText(product?.description || ''), 56)}</span>
    </div>
    <div className="right">
      <h3 className="price"><IoPricetag />1 000 000 000 {product.currency}</h3>
      <div className="rating">
        <span>
          <IoStarHalf />
          {4.5}
        </span>
        <span style={{ whiteSpace: 'nowrap' }}><IoPeopleSharp />
          {shortNumber(12345)}</span>
      </div>
    </div>
  </a>
}