import { IoAdd, IoPencil } from 'react-icons/io5'
import './+Page.css'
import { CategoryItem } from '../../../Components/CategoryItem/CategoryItem'
import { CommandeList } from '../../../Components/CommandesList/CommandesList'
import { useEffect, useState } from 'react'
import { Topbar } from '../../../Components/TopBar/TopBar'
import { SwiperProducts } from '../../../Components/Swipers/SwiperProducts'
import { images as imgs } from "./images";
import { HoriszontalSwiper } from '../../../Components/Swipers/HoriszontalSwiper'
import { ProductInterface, ValueInterface } from '../../../Interfaces/Interfaces'
import { NEW_VIEW } from '../../../Components/Utils/constants'
import { ClientCall } from '../../../Components/Utils/functions'
import { usePageContext } from '../../../renderer/usePageContext'
import { useStore } from '../../stores/StoreStore'
import { useProductStore } from '../ProductStore'
import { getDefaultValues } from '../../../Components/Utils/parseData'
import { useApp } from '../../../renderer/AppStore/UseApp'
import { ChildViewer } from '../../../Components/ChildViewer/ChildViewer'
import { CategoriesPopup } from '../../../Components/CategoriesPopup/CategoriesPopup'
import { FaRedo } from 'react-icons/fa'


//TODO add markdon dans la description du produit?
// TODO correcteur d'ortograph
export function Page() {

  const [collected, setCollected] = useState<Partial<ProductInterface>>({});
  const [values, setValues] = useState<ValueInterface[]>([] as any);
  const [index, setindex] = useState(0);
  const {setProductBy} = useProductStore()   
  const {currentStore} = useStore()

  const { openChild } = useApp()
  
  const clearValues = () => {
    return [...values].map(val => ({ ...val, views: (val.views || []).filter(view => view != NEW_VIEW) })).filter(val => val.views && val.views.length > 0);
  }

  const { routeParams } = usePageContext()

  useEffect(()=>{
    setProductBy({product_id:routeParams.id}).then(res=>{
      if(!res?.id) return;
      setCollected(res);
      setValues(getDefaultValues(res)||[])
    })
  },[currentStore]);

  useEffect(() => {
    const vs = clearValues();
    setValues(vs)
  }, [index])

  return <div className="product">
    <Topbar back={true} />
    <div className="views no-selectable">
      <SwiperProducts views={values[index]?.views || []} setViews={(localViews) => {

        if (values[index] == undefined) {
          values[index] = {
            views: localViews
          } as any as ValueInterface
        } else {
          values[index].views = localViews;
        }
        const vs = clearValues();
        setValues(vs)
      }} />
    </div>
    <div className="image-manager no-selectable">
      <HoriszontalSwiper values={clearValues() as any} onActiveIndexChange={(_index) => {
        setindex(_index)
      }} onDeleteValue={() => {
        setValues([
          ...values.slice(0, index),
          ...values.slice(index + 1)
        ])
      }} forward={() => {
        const nextValue = values[index + 1];
        if (!nextValue || (nextValue.views.length == 0) || (nextValue.views.length == 1 && nextValue.views[0] == NEW_VIEW)) return false;
        const currentvalue = values[index];
        setValues(values.map((v, i) => i == index ? nextValue : i == index + 1 ? currentvalue : v));
        return true;
      }} goBack={() => {
        const lastValue = values[index - 1];
        if (!lastValue || (lastValue.views.length == 0) || (lastValue.views.length == 1 && lastValue.views[0] == NEW_VIEW)) return false;
        const currentvalue = values[index];
        setValues(values.map((v, i) => i == index ? lastValue : i == index - 1 ? currentvalue : v));
        return true;
      }} />
    </div>

    <label htmlFor='input-product-name'>Nom du Produit <IoPencil /></label>
    <input type="text" id={'input-product-name'} value={collected.name || ''} placeholder="Ajoutez un nom de produit" onChange={(e) => {
      const name = e.currentTarget.value
      setCollected({
        ...collected,
        ['name']: name.substring(0, 52),
      })
    }} onKeyUp={(e) => {
      if (e.code == 'Enter') {
        const p = document.querySelector('#input-product-description') as HTMLTextAreaElement | null;
        p && p.focus()
      }
    }} onKeyDown={(e) => {
      if (e.code == 'Tab') {
        e.stopPropagation();
        e.preventDefault();
        const p = document.querySelector('#input-product-description') as HTMLTextAreaElement | null;
        p && p.focus()
      }
    }} />
    <label htmlFor='input-product-description'>Description <IoPencil /></label>
    <textarea id="input-product-description" placeholder='Ajoutez la description du produit' cols={10} rows={1} ref={ref => {
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
      autoResizeTextarea(ref);
    }} value={collected.description} onChange={(e) => {
      const description = e.currentTarget.value
      setCollected({
        ...collected,
        ['description']: description.substring(0, 512),
      })
    }} onKeyDown={(e) => {
      if (e.code == 'Tab') {
        e.stopPropagation();
        e.preventDefault();
        const p = document.querySelector('#input-product-price') as HTMLTextAreaElement | null;
        p && p.focus();
      }
    }}></textarea>
  
    <label htmlFor='input-product-price'>Prix <IoPencil /></label>
    <div className='price-ctn'>
      <input type="number" id={'input-product-price'}
        value={collected.price || ''}
        placeholder="Prix du produit"
        onChange={(e) => {
          const price = e.currentTarget.value
          setCollected({
            ...collected,
            ['price']: Number.parseInt(price),
          })
        }} />
      <div className="currency">{'FCFA'}</div>
    </div>
    <h3>Category Parent</h3>
    <div className='category-ctn'>
      <div className={`icon ${collected.category_id ? 'replace' : 'add'}`} onClick={()=>{
        openChild(<ChildViewer title='List des categories'>
          <CategoriesPopup onSelected={(c)=>{
              setCollected({
                ...collected,
                category_id:c.id
              })
          }}/>
      </ChildViewer>, { blur: 10 })
      }}>
        {collected.category_id ?<FaRedo/>:<IoAdd />}
        <span>{collected.category_id ?'remplacez':'ajoutez'}</span>
      </div>
      {
        collected.category_id && <CategoryItem openCategory key={collected.category_id} category_id={collected.category_id} />
      }
    </div>
    {/* <h3>Options du Produits</h3> */}
    {
      routeParams.id !=='new' && <CommandeList product_id={undefined} />}
  </div>
}
// TODO ajouter peference d'affichage des values des produits. dans la feature preference:'select'|'vertical-list' ..etc
// TODO values.key => 3d.action(key)
