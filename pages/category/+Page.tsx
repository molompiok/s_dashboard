import { IoApps, IoBagHandle, IoCart, IoPencil } from 'react-icons/io5'
import './Page.css'
import { Indicator } from '../../Components/Indicator/Indicator'
import { ProductList } from '../products/ProductList/ProductList'
import { Topbar } from '../../Components/TopBar/TopBar'
import { Image_1 } from '../../Components/Utils/constants'
import { useData } from '../../renderer/useData'
import type { Data } from './+data'
import { getImg } from '../../Components/Utils/StringFormater'
import { usePageContext } from '../../renderer/usePageContext'
import { Api_host } from '../../renderer/+config'
import { useEffect, useRef, useState } from 'react'
import { CategoryInterface } from '../../Interfaces/Interfaces'
import { useStore } from '../stores/StoreStore'
import { useCategory } from '../products/CategoriesList/CategoryStore'
import { CategoriesList } from '../products/CategoriesList/CategoriesList'

export { Page }

function Page() {

  const nameRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const barredPriceRef = useRef<HTMLDivElement>(null);
  const stockPriceRef = useRef<HTMLDivElement>(null);
  const categoryPriceRef = useRef<HTMLDivElement>(null);

  const [nameError, setNameError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [priceError, setPriceError] = useState('');
  const [barredError, setBarredError] = useState('');
  const [stockError, setStockError] = useState('');
  const [categoryError, setCategoryError] = useState('');


  const { category, logoUrl } = useData<Data>()
  const [collected, setCollected] = useState<Partial<CategoryInterface>>(category || {})
  const { currentStore } = useStore();
  const { fetchCategoryBy } = useCategory()
  const [categorie, setCategory] = useState<CategoryInterface | undefined>()
  const { urlParsed } = usePageContext()
  const is_newCategory = urlParsed.search['id'] == 'new'
  console.log({ is_newCategory }, urlParsed.search);

  const [isUpdated, changeUpdated] = useState(false);

  useEffect(() => {
    !is_newCategory && fetchCategoryBy({ category_id: urlParsed.search['id'] })
  }, [currentStore]);

  const v = collected?.view?.[0];
  const icon = collected?.icon?.[0];
  console.log({ collected }, category);

  return (
    <div className="category">
      <Topbar back={true} />
      <div className="column">
        <div className="cover-image shadow" style={{
          background: v ? getImg(
            typeof v == 'string' ? v
              : URL.createObjectURL(v),
            undefined, typeof v == 'string' ?
            currentStore?.url : undefined
          ) : getImg('/res/empty/drag-and-drop.png', '60%')
        }}></div>
        {/* <span>ajoutez une image de couverture</span> */}
        <div className="top">
          <div className="column shadow">
            <div className="view" style={{
              background:
                icon ? getImg(
                  typeof icon == 'string' ? icon
                    : URL.createObjectURL(icon),
                  undefined, typeof icon == 'string' ?
                  currentStore?.url : undefined
                ) : getImg('/res/empty/drag-and-drop.png', '120%')
            }} ></div>
            {/* <span>ajouter une icon</span> */}
          </div>
          {!is_newCategory && <div className="stats">
            <h3>Donnee de Performance</h3>
            <h2 className='stats-category'><IoBagHandle /> Produits <span>{0}</span></h2>
            <h2 className='stats-command'><IoCart /> Command <span>{0}</span></h2>
            <h2 className='stats-categories'><IoApps /> Sous Categorie <span>{5}</span></h2>
          </div>}
        </div>
      </div>
      <label className='editor' htmlFor='input-category-name'>Nom de la categorie <IoPencil /></label>
      <input className='editor' type="text" id={'input-category-name'} value={collected.name || ''} placeholder="Ajoutez un nom de produit" onChange={(e) => {
        const name = e.currentTarget.value
        setCollected({
          ...collected,
          ['name']: name.substring(0, 52),
        })
        changeUpdated(true)
      }} onKeyUp={(e) => {
        if (e.code == 'Enter') {
          const p = document.querySelector('#input-category-description') as HTMLTextAreaElement | null;
          p && p.focus()
        }
      }} onKeyDown={(e) => {
        if (e.code == 'Tab') {
          e.stopPropagation();
          e.preventDefault();
          const p = document.querySelector('#input-category-description') as HTMLTextAreaElement | null;
          p && p.focus()
        }
      }} />
      <label className='editor' htmlFor='input-category-description'>Description <IoPencil /></label>
      <textarea className='editor' id="input-category-description" placeholder='Ajoutez la description du produit' cols={10} rows={1} ref={ref => {
        if (!ref) return
        if ((ref as any).init) return
        (ref as any).init = 'init';
        function autoResizeTextarea(ref: HTMLTextAreaElement) {
          ref.style.height = 'auto';
          if (ref.scrollHeight > 300) {
            ref.style.overflowY = 'auto';
            ref.style.overflowX = 'hidden';
          } else {
            ref.style.overflowY = 'hidden';
            ref.style.overflowX = 'hidden';
          }
          ref.style.height = ref.scrollHeight + 'px';
        }
        window.addEventListener('resize', function () {
          autoResizeTextarea(ref);
        })
        ref.addEventListener('input', function () {
          autoResizeTextarea(ref);
        });
        setTimeout(() => {
          autoResizeTextarea(ref);
        }, 200);
      }} value={collected.description} onChange={(e) => {
        const description = e.currentTarget.value
        setCollected({
          ...collected,
          ['description']: description.substring(0, 512),
        });
        changeUpdated(true)
      }} onKeyDown={(e) => {
        if (e.code == 'Tab') {
          e.stopPropagation();
          e.preventDefault();
          const p = document.querySelector('#input-category-price') as HTMLTextAreaElement | null;
          p && p.focus();
        }
      }}></textarea>
      <CategoriesList title={'Liste des Sous Categories'}/>
      {!is_newCategory && <ProductList />}
    </div>
  )
}
