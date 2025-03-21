import { IoAdd, IoChevronForward, IoCloudUploadSharp, IoLayers, IoMegaphoneOutline, IoPencil, IoPricetagsSharp, IoTrash } from 'react-icons/io5'
import './+Page.css'
import { CategoryItem } from '../../../Components/CategoryItem/CategoryItem'
import { CommandeList } from '../../../Components/CommandesList/CommandesList'
import { JSX, useEffect, useRef, useState } from 'react'
import { Topbar } from '../../../Components/TopBar/TopBar'
import { SwiperProducts } from '../../../Components/SwiperProducts/SwiperProducts'
import { images as imgs } from "./images";
import { HoriszontalSwiper } from '../../../Components/HorizontalSwiper/HorizontalSwiper'
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
import { ConfirmDelete } from '../../../Components/Confirm/ConfirmDelete'
import { useReplaceState } from '../../../Hooks/useRepalceState'
import { Button } from '../../../Components/Button/Button'
import { SaveButton } from '../../../Components/SaveButton/SaveButton'


//TODO add markdon dans la description du produit?
// TODO correcteur d'ortograph
export function Page() {

  const [collected, setCollected] = useState<Partial<ProductInterface>>({
    price: 23,
    name: 'product-1',
    description: 'product-1',
    barred_price: 1233,
  });
  const { fetchProductBy, updateProduct, removeProduct, createProduct } = useProductStore()
  const { currentStore } = useStore()
  const { openChild } = useApp()

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


  const [values, setValues] = useState<ValueInterface[]>([] as any);
  const [index, setindex] = useState(0);
  const [isUpdated, changeUpdated] = useState(false);
  const [loading, setLoading] = useState(false);

  const clearValues = () => {
    return [...values].map(val => ({ ...val, views: (val.views || []).filter(view => view != NEW_VIEW) })).filter(val => val.views && val.views.length > 0);
  }

  const { routeParams } = usePageContext()
  const { myLocation } = useReplaceState()
  const is_newProduct = myLocation.pathname == "/products/new";

  useEffect(() => {
    !is_newProduct && currentStore && fetchProductBy({ product_id: routeParams.id }).then(res => {
      if (!res?.id) return;
      setCollected(res);
      setValues(getDefaultValues(res) || [])
    })
  }, [currentStore, myLocation]);

  useEffect(() => {
    const vs = clearValues();
    setValues(vs)
  }, [index])


  function isAllCollected(collected: Partial<ProductInterface>, showError?: boolean) {
    if (!collected.name) return showError ? setNameError('le nom doit contenir au moin 3 carateres') : false
    if (!collected.description) return showError ? setDescriptionError('la description doit contenir au moin 3 carateres') : false
    if (collected.barred_price && (collected.barred_price < (collected.price || 0))) return showError ? setBarredError('le prix barre doit etre supperieur au prix du produit') : false
    if (!collected.price) return showError ? setPriceError('le prix du produit doit etre difinie ') : false
    return true
  }
  const is_all_collected = isAllCollected(collected);

  console.log({ myLocation });

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
        setValues(vs);
        changeUpdated(true);
      }} />
    </div>
    {!is_newProduct && <div className="image-manager no-selectable">
      <HoriszontalSwiper values={clearValues() as any} onActiveIndexChange={(_index) => {
        setindex(_index)
      }} onDeleteValue={() => {
        setValues([
          ...values.slice(0, index),
          ...values.slice(index + 1)
        ]);
        changeUpdated(true)
      }} forward={() => {
        const nextValue = values[index + 1];
        if (!nextValue || (nextValue.views.length == 0) || (nextValue.views.length == 1 && nextValue.views[0] == NEW_VIEW)) return false;
        const currentvalue = values[index];
        setValues(values.map((v, i) => i == index ? nextValue : i == index + 1 ? currentvalue : v));
        changeUpdated(true)
        return true;
      }} goBack={() => {
        const lastValue = values[index - 1];
        if (!lastValue || (lastValue.views.length == 0) || (lastValue.views.length == 1 && lastValue.views[0] == NEW_VIEW)) return false;
        const currentvalue = values[index];
        setValues(values.map((v, i) => i == index ? lastValue : i == index - 1 ? currentvalue : v));
        changeUpdated(true)
        return true;
      }} />
    </div>}

    <label className='editor' htmlFor='input-product-name'>Nom du Produit <IoPencil /></label>
    <input className='editor' type="text" id={'input-product-name'} value={collected.name || ''} placeholder="Ajoutez un nom de produit" onChange={(e) => {
      const name = e.currentTarget.value
      setCollected({
        ...collected,
        ['name']: name.substring(0, 52),
      })
      changeUpdated(true)
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
    <label className='editor' htmlFor='input-product-description'>Description <IoPencil /></label>
    <textarea className='editor' id="input-product-description" placeholder='Ajoutez la description du produit' cols={10} rows={1} ref={ref => {
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
        const p = document.querySelector('#input-product-price') as HTMLTextAreaElement | null;
        p && p.focus();
      }
    }}></textarea>
    <div className='row' style={{
      columnGap: '24px',
      justifyContent: 'flex-start',
      flexWrap: 'wrap',
    }}>
      <div className="column">
        <label className='editor' htmlFor='input-product-price'>Prix <IoPencil /></label>
        <div className='price-ctn'>
          <input className='editor' type="number" id={'input-product-price'}
            value={collected.price || ''}
            placeholder="Prix du produit"
            onChange={(e) => {
              const price = e.currentTarget.value
              setCollected({
                ...collected,
                ['price']: Number.parseInt(price),
              })
              changeUpdated(true)
            }} />
          <div className="currency">{'FCFA'}</div>
        </div>
      </div>
      <div className="column">
        <label className='editor' htmlFor='input-product-barred-price'>Prix barré <IoPencil /></label>
        <div className='price-ctn'>
          <input className='editor' type="number" id={'input-product-barred-price'}
            value={collected.barred_price || ''}
            placeholder="Prix du produit"
            onChange={(e) => {
              const barred_price = e.currentTarget.value
              setCollected({
                ...collected,
                ['barred_price']: Number.parseInt(barred_price),
              })
              changeUpdated(true)
            }} />
          <div className="currency">{'FCFA'}</div>
        </div>
      </div>
      {/* <div className="column">
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
              changeUpdated(true)
            }} />
          <div className="currency">{'FCFA'}</div>
        </div>
      </div> */}
    </div>
    <h3>Category du Produit <span>(facultatif)</span></h3>
    <div className='category-ctn'>
      <div className={`icon ${collected.category_id ? 'replace' : 'add'}`} onClick={() => {
        openChild(<ChildViewer title='List des categories'>
          <CategoriesPopup onSelected={(c) => {
            setCollected({
              ...collected,
              category_id: c.id
            })
            changeUpdated(true)
          }} />
        </ChildViewer>, { blur: 10 })
      }}>
        {collected.category_id ? <FaRedo /> : <IoAdd />}
        <span>{collected.category_id ? 'remplacez' : 'ajoutez'}</span>
      </div>
      {
        collected.category_id && <CategoryItem openCategory key={collected.category_id} category_id={collected.category_id} />
      }
    </div>
    {/* <h3>Options du Produits</h3> */}
    <div className="setting-product">
      {
        !is_newProduct && <>
          <Button title='Promo' icon={<IoPricetagsSharp />} />
          <Button title='Point de vente' icon={<IoPricetagsSharp />} />
          <Button title='Affiliation' icon={<IoPricetagsSharp />} />
          <Button title='Variantes et Stock' icon={<IoLayers />} />
          <Button title='Voir les stats' icon={<IoLayers />} />
          <Button title='Supprimer' icon={<IoTrash />} onClick={() => {
            openChild(<ChildViewer>
              <ConfirmDelete title={`Etes vous sur de vouloir suprimer le produit "${collected.name}"`} onCancel={() => {
                openChild(null);
              }} onDelete={() => {
                collected.id && removeProduct(collected.id);
                openChild(null);
              }} />
            </ChildViewer>, {
              background: '#3455',
            })
          }} />
        </>
      }
    </div>
    {
      is_newProduct ?
        <SaveButton loading={loading} effect='color' title={is_all_collected ? 'Cree le produit' : 'Ajoutez toutes informations requises'}
          required={is_all_collected}
          onClick={() => {
            
            if (loading) return console.log('onLoading');
            if (!isAllCollected(collected, true)) return console.log('informations incomplete');
            setLoading(true);
            
            createProduct({ ...collected }, values[0].views).then(res => {
              setTimeout(() => {
                setLoading(false)
                changeUpdated(false);
              }, 1000);
              if (!res?.id) return;
              setCollected(res);
              history.replaceState(null, "", `/category?id=${res.id}`);
            })

          }} /> :
        <SaveButton loading={loading} effect='color'
          title={isUpdated ? (is_all_collected ? 'Sauvegardez les modifications' : 'Certaines Informations sont Incorrectes') : 'Aucune modification'}
          required={isUpdated && is_all_collected}
          onClick={() => {

            if (!isUpdated) return console.log('aucun changement');
            if (loading) return console.log('onLoading');
            if (!isAllCollected(collected, true)) return console.log('informations incomplete');
            setLoading(true);
            
            updateProduct(collected).then(res => {
              setTimeout(() => {
                setLoading(false)
                changeUpdated(false);
              }, 1000);
              if (!res?.id) return;
              setCollected(res);
            })

          }} />
    }
    {
      !is_newProduct && <CommandeList product_id={undefined} />}
  </div>
}
// TODO ajouter peference d'affichage des values des produits. dans la feature preference:'select'|'vertical-list' ..etc
// TODO values.key => 3d.action(key)




