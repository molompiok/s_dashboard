import { getDefaultValues } from "../Utils/parseData";
import { ProductInterface } from "../../Interfaces/Interfaces";
import { useGlobalStore } from "../../pages/stores/StoreStore";
import { getImg } from "../Utils/StringFormater";
import { getFileType, limit, shortNumber } from "../Utils/functions";
import { markdownToPlainText } from "../MarkdownViewer/MarkdownViewer";
import { IoPeopleSharp, IoPricetag, IoStarHalf } from "react-icons/io5";

import './ProductPreview.css';
import { useState } from "react";
import { NO_PICTURE } from "../Utils/constants";
import { useTranslation } from "react-i18next";


export { ProductPreview }

function ProductPreview({ product }: { product: Partial<ProductInterface> }) {
  const { currentStore } = useGlobalStore()
  const values = getDefaultValues(product);
  const view = values[0]?.views?.[0];
  const [imgError, setImgError] = useState(false);

  const defaultValues = getDefaultValues(product);
  const defaultView = defaultValues[0]?.views?.[0] || NO_PICTURE;
  const src = getImg(defaultView, undefined, currentStore?.url).match(/url\("?([^"]+)"?\)/)?.[1];
  const fileType = getFileType(defaultView);
  const { t } = useTranslation()

  console.log({ product, defaultValues, imgError, defaultView, src, fileType });


  return <a href={`/products/${product.id}`} className="product-preview">
    <div className="icon-80 view">
      {!imgError ? (
        fileType === 'image' ? (<img src={src || NO_PICTURE} alt={product.name} loading="lazy" className="w-full h-full object-cover block" onError={() => setImgError(true)} />)
          : fileType === 'video' ? (<video muted autoPlay loop playsInline className="w-full h-full object-cover block" src={src || ''} onError={() => setImgError(true)} />)
            : (<img src={NO_PICTURE} alt="Placeholder" className="w-full h-full object-contain block p-2 opacity-50" />)
      ) : (
        <img src={NO_PICTURE} alt={t('common.imageError')} className="w-full h-full object-contain block p-2 opacity-50" />
      )}
    </div>
    <div className="product-info">
      <h2 className='ellipsis'>{limit(product?.name, 56)}</h2>
      <span>{limit(markdownToPlainText(product?.description || ''), 56)}</span>
    </div>
    <div className="right">
      <h3 className="price"><IoPricetag />{product.price?.toLocaleString('fr')} {product.currency}</h3>
      <div className="rating">
        <span>
          <IoStarHalf />
          {product.rating || 0}
        </span>
        <span style={{ whiteSpace: 'nowrap' }}><IoPeopleSharp />
          {shortNumber(product.comment_count || 0)}</span>
      </div>
    </div>
  </a>
}

