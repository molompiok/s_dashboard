import { IoAdd, IoChevronBack, IoChevronDown, IoChevronForward, IoClose, IoCloudUploadSharp, IoEllipsisHorizontal, IoLayers, IoMegaphoneOutline, IoPencil, IoPricetagsSharp, IoTrash } from 'react-icons/io5'
import './+Page.css'
import { CategoryItem } from '../../../Components/CategoryItem/CategoryItem'
import { CommandeList } from '../../../Components/CommandesList/CommandesList'
import { useEffect, useRef, useState } from 'react'
import { Topbar } from '../../../Components/TopBar/TopBar'
import { SwiperProducts } from '../../../Components/SwiperProducts/SwiperProducts'
import { FeatureInterface, ProductInterface, UpdateFeature, ValueInterface } from '../../../Interfaces/Interfaces'
import { EDITED_DATA, NEW_ID_START, NEW_VIEW } from '../../../Components/Utils/constants'
import { ClientCall } from '../../../Components/Utils/functions'
import { usePageContext } from '../../../renderer/usePageContext'
import { useStore } from '../../stores/StoreStore'
import { useProductStore } from '../ProductStore'
import { getDefaultValues, IsFeaturesHere } from '../../../Components/Utils/parseData'
import { useApp } from '../../../renderer/AppStore/UseApp'
import { ChildViewer } from '../../../Components/ChildViewer/ChildViewer'
import { CategoriesPopup } from '../../../Components/CategoriesPopup/CategoriesPopup'
import { ConfirmDelete } from '../../../Components/Confirm/ConfirmDelete'
import { useMyLocation } from '../../../Hooks/useRepalceState'
import { Button } from '../../../Components/Button/Button'
import { SaveButton } from '../../../Components/SaveButton/SaveButton'
import { Indicator } from '../../../Components/Indicator/Indicator'
import { getImg } from '../../../Components/Utils/StringFormater'

import { Separator } from '../../../Components/Separator/Separator'
import { Feature, Value } from '../../../Components/Feature/Feature'
import { FeatureInfo } from '../../../Components/FeatureInfo/FeatureInfo'
import { MarkdownEditor2 } from '../../../Components/MackdownEditor/MarkdownEditor'
import { HoriszontalSwiper } from '../../../Components/HorizontalSwiper/HorizontalSwiper'


function getNewFeature() {
  return {
    id: NEW_ID_START + ClientCall(Math.random, 0).toString(),
    created_at: '',
    name: '',
    product_id: '',
    required: false,
    type: '',
    updated_at: '',
    default: '',
    icon: [],
    index: 1,
    is_double: false,
    max: 0,
    max_size: 0,
    min: 0,
    min_size: 0,
    multiple: false,
    regex: '',
    values: []
  } satisfies FeatureInterface
}


const FEATURE_LIMIT = 20

//TODO add markdon dans la description du produit?
// TODO correcteur d'ortograph
export function Page() {


  const { fetchProducts, updateProduct, removeProduct, createProduct } = useProductStore()
  const { currentStore } = useStore()
  const { openChild } = useApp()

  const nameRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const barredPriceRef = useRef<HTMLDivElement>(null);

  const [nameError, setNameError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [priceError, setPriceError] = useState('');
  const [barredError, setBarredError] = useState('');


  const [values, setValues] = useState<ValueInterface[]>([] as any);
  const [index, setindex] = useState(0);
  const [isUpdated, changeUpdated] = useState('' as '' | 'auto-save' | 'change');
  const [loading, setLoading] = useState(false);

  const clearValues = () => {
    return [...values].map(val => ({ ...val, views: (val.views || []).filter(view => view != NEW_VIEW) })).filter(val => val.views && val.views.length > 0);
  }

  const { routeParams } = usePageContext()
  const { myLocation } = useMyLocation()
  const is_newProduct = myLocation.pathname == "/products/new";

  const [collected, setCollected] = useState<Partial<ProductInterface>>({});
  const [product, setProduct] = useState<Partial<ProductInterface>>({});

  const is_features_here = IsFeaturesHere(product);

  const [s] = useState({
    init: false,
    features: undefined as Partial<FeatureInterface>[] | undefined,
  })
  function resetProduct(product_id: string, thread = false) {
    !s.init && fetchProducts({ product_id }).then(res => {
      const p = res?.list[0]
      if (!p?.id) return;
      s.init = true;
      s.features = p.features || [];
      setProduct({ ...p, features: (p.features || []).filter(f => f.id !== p.default_feature_id) });
      setCollected({})
      setValues(getDefaultValues(p) || [])
      !thread && changeUpdated('');
    });
  }
  useEffect(() => {
    !is_newProduct && currentStore && !s.init && resetProduct(routeParams.id)
  }, [currentStore, myLocation]);

  useEffect(() => {
    const vs = clearValues();
    setValues(vs)
  }, [index])

  function isAllProduct(product: Partial<ProductInterface>, showError?: boolean) {
    let v: void | boolean = true;
    if (!product.name || product.name.length < 3) {
      showError && setNameError('le nom doit contenir au moin 3 carateres')
      showError && nameRef.current?.focus()
      v = false
    }
    if (!product.description || product.description.length < 3) {
      showError && setDescriptionError('la description doit contenir au moin 3 carateres');
      showError && descriptionRef.current?.focus()
      v = false
    }
    if (!product.barred_price || (product.barred_price <= (product.price || 0))) {
      showError && setBarredError('le prix barre doit etre supperieur au prix du produit');
      v = false
      barredPriceRef.current?.focus()
    }
    if (!product.price) {
      showError && setPriceError('le prix du produit doit etre difinie ');
      v = false
      priceRef.current?.focus()
    } else {
      if ((product.barred_price || 0) <= product.price) {
        !barredError && setBarredError('le prix du produit doit etre difinie ');
        v = false
      } else {
        barredError && setBarredError('');
      }
    }

    // if (!product.values) return showError ? setViewError('cliquez sur le cadre pour ajouter une image') : false
    return v
  }
  const openFeatureOption = (f: FeatureInterface | undefined, metod: 'add' | 'replace') => {
    openChild(<ChildViewer title='Les Informations sur la variante'>
      <FeatureInfo feature={f || (getNewFeature())} onChange={(f) => {
        const fs = product.features || [];
        (f as any)[EDITED_DATA] = EDITED_DATA
        const l = metod == 'add' ? [...fs, f] : fs.map(_f => (_f == f || _f.id == f.id) ? f : _f);

        setCollected((current) => ({
          ...current,
          features: l,
        }))
        setProduct((current) => ({
          ...current,
          features: l,
        }))
        
        openChild(null)
        changeUpdated('auto-save')
      }} onCancel={() => {
        openChild(null)

      }} />
    </ChildViewer>, {
      background: '#3455'
    })
  }
  const saveRequired = async (product: Partial<ProductInterface>, thread = false) => {
    if (!isUpdated) return console.log('aucun changement');
    if (loading) return console.log('onLoading');
    if (!isAllProduct(product, true)) return console.log('informations incomplete');

    setLoading(true);
    try {
      product.description = (product.description || '')
      collected.id = product.id
      const res = await updateProduct(collected, s.features || [])
      setTimeout(() => {
        setLoading(false)
        console.log('SaveButton ', res);
        if (!res?.id) return;
        res.description = (res.description || '');
        resetProduct(res.id, thread)
        console.log('resetProduct  ', res);
      }, 1000);
    } catch (error) { }
  }

  useEffect(() => {
    isUpdated == 'auto-save' && saveRequired(collected)
  }, [collected, isUpdated])
 

  const is_all_product = isAllProduct(product);
  const is_feature_max = (product.features?.length || 0) >= FEATURE_LIMIT;

  console.log(product, collected);


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
        // changeUpdated('auto-save');
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
        changeUpdated('auto-save')
      }} forward={() => {
        const nextValue = values[index + 1];
        if (!nextValue || (nextValue.views?.length == 0) || (nextValue.views?.length == 1 && nextValue.views?.[0] == NEW_VIEW)) return false;
        const currentvalue = values[index];
        setValues(values.map((v, i) => i == index ? nextValue : i == index + 1 ? currentvalue : v));
        return true;
      }} goBack={() => {
        const lastValue = values[index - 1];
        if (!lastValue || (lastValue.views?.length == 0) || (lastValue.views?.length == 1 && lastValue.views?.[0] == NEW_VIEW)) return false;
        const currentvalue = values[index];
        setValues(values.map((v, i) => i == index ? lastValue : i == index - 1 ? currentvalue : v));
        return true;
      }} />
    </div>}
    <div className="product-section-minimal">
      <label className='editor' htmlFor='input-product-name'>Nom du Produit <IoPencil /></label>
      <input className={`editor ${nameError ? 'error' : ''}`} type="text" id={'input-product-name'} value={product.name || ''} placeholder="Ajoutez un nom de produit" onChange={(e) => {
        const name = e.currentTarget.value
        setCollected((current) => ({
          ...current,
          ['name']: name.replace(/\s+/g, ' ').substring(0, 256),
        }))
        setProduct((current) => ({
          ...current,
          ['name']: name.replace(/\s+/g, ' ').substring(0, 256),
        }))
        
        changeUpdated('auto-save')
        setNameError('')
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
      <div className="input-message"><span className='error-message'>{nameError}</span><span className='right'>{(product.name?.trim()?.length || 0)} / 256</span></div>
      <label className='editor' htmlFor='input-product-description'>Description <IoPencil /></label>

      {s.init && <MarkdownEditor2 value={product.description || ''} setValue={(value) => {
        setCollected((current) => ({
          ...current,
          description: value
        }));
        setProduct((current) => ({
          ...current,
          description: value
        }));
        changeUpdated('auto-save')
      }} />}
      <div className="input-message"><span className='error-message'>{descriptionError}</span><span className='right'>{(product.description?.trim()?.length || 0)} / 1024</span></div>
      <div className='row' style={{
        columnGap: '24px',
        justifyContent: 'flex-start',
        flexWrap: 'wrap',
      }}>
        <div className="column">
          <label className='editor' htmlFor='input-product-price'>Prix de base<IoPencil /></label>
          <div className='price-ctn'>
            <input className={`price  editor ${priceError ? 'error' : ''}`} type="number" id={'input-product-price'}
              value={product.price || ''}
              placeholder="Prix du produit"
              max={1_000_000_000}
              min={0}
              onChange={(e) => {
                const price = e.currentTarget.value
                setCollected((current) => ({
                  ...current,
                  ['price']: Number.parseInt(price),
                }))
                setProduct((current) => ({
                  ...current,
                  ['price']: Number.parseInt(price),
                }))
                
                changeUpdated('auto-save')
                setPriceError('')
              }} />
            <div className="currency">{'FCFA'}</div>
          </div>
        </div>
        <div className="column">
          <label className='editor' htmlFor='input-product-barred-price'>Prix barré <IoPencil /> <Indicator style={{ marginLeft: 'auto' }} title={`L'ancien prix ou le prix actuel du marcher`} description={`Ce prix sert de référence au client. Il indique au client que votre produit est en réduction`} /></label>
          <div className='price-ctn'>
            <input className={`price editor ${barredError ? 'error' : ''}`} type="number" id={'input-product-barred-price'}
              value={product.barred_price || ''}
              placeholder="Prix barré"
              max={1_000_000_000}
              min={0}
              onChange={(e) => {
                const barred_price = e.currentTarget.value
                setCollected((current) => ({
                  ...current,
                  ['barred_price']: Number.parseInt(barred_price),
                }))
                setProduct((current) => ({
                  ...current,
                  ['barred_price']: Number.parseInt(barred_price),
                }))
                
                changeUpdated('auto-save')
                setBarredError('')
              }} />
            <div className="currency">{'FCFA'}</div>
          </div>
        </div>
      </div>
      <h3>Category du Produit <span>(facultatif)</span></h3>
      <div className='category-ctn'>
        <div className={`icon add`} onClick={() => {
          openChild(<ChildViewer title='List des categories'>
            <CategoriesPopup onSelected={(c) => {
              setCollected((current) => ({
                ...current,
                categories_id: [c.id, ...(current.categories_id || [])]
              }))
              setProduct((current) => ({
                ...current,
                categories_id: [c.id, ...(current.categories_id || [])]
              }))
              
              changeUpdated('auto-save')
            }} />
          </ChildViewer>, { background: '#3345' })
        }}>
          <IoAdd />
          <span>ajoutez</span>
        </div>
        {
          product.categories_id?.map(c => (
            <CategoryItem
              key={c}
              openCategory
              category_id={c}
              onDelete={(d_c) => {
                setCollected((current) => ({
                  ...current,
                  categories_id: current.categories_id?.filter(_c => d_c.id !== _c)
                }))
                setProduct((current) => ({
                  ...current,
                  categories_id: current.categories_id?.filter(_c => d_c.id !== _c)
                }))
                
                changeUpdated('auto-save')
              }}
            />
          ))
        }
      </div>
    </div>
    <div className="product-section-feature">
      <div className="top">
        <h2 style={{ flexWrap: 'wrap' }}> Les Variantes du Produit <b className='prompt'>( {product.features?.length || 0} / {FEATURE_LIMIT} )</b>
          <Indicator title=''
            description={!is_feature_max ? `Vous pouvez ajoueter jusqu\'a ${FEATURE_LIMIT} variantes par produit` : `Vous avez atteint la limit ${FEATURE_LIMIT} variantes par produit`}
          />
        </h2>
        {<span className={is_feature_max ? 'max' : ''} onClick={() => {
          if (is_feature_max) return
          openFeatureOption(undefined, 'add')
        }}>Ajoutez</span>}
      </div>
      <Separator style={{ marginTop: '8px' }} color='#3455' />
      {
        !is_features_here && <NotVariantHere />
      }
      {
        product.features?.map(((f, i) => (
          <Feature key={i} feature={f} setFeature={(cb) => {
            setCollected((current) => ({
              ...current,
              features: product.features?.map(_f => _f.id == f.id ? cb(f) as any : _f)
            }))
            setProduct((current) => ({
              ...current,
              features: product.features?.map(_f => _f.id == f.id ? cb(f) as any : _f)
            }))
            
            changeUpdated('auto-save')
          }} onOpenRequired={(f) => {
            openFeatureOption(f as any, 'replace')
          }} onDelete={() => {
            setCollected((current) => ({
              ...current,
              features: product.features?.filter(_f => _f.id !== f.id)
            }))
            setProduct((current) => ({
              ...current,
              features: product.features?.filter(_f => _f.id !== f.id)
            }))
            
            changeUpdated('auto-save')
          }} />
        )))
      }
    </div>

    {
      is_newProduct ?
        <SaveButton loading={loading} effect='color' title={is_all_product ? 'Cree le produit' : 'Ajoutez toutes informations requises'}
          required={is_all_product}
          onClick={() => {

            if (loading) return console.log('onLoading');
            if (!isAllProduct(product, true)) return console.log('informations incomplete');
            setLoading(true);

            createProduct({ ...product }, values[0]?.views || []).then(res => {
              setTimeout(() => {
                setLoading(false)
                changeUpdated('')
              }, 1000);
              if (!res?.id) return;
              setProduct(res);
              setCollected({})
              history.replaceState(null, "", `/category?id=${res.id}`);
            })
          }} /> :
        <SaveButton loading={loading} effect='color'
          title={isUpdated ? (is_all_product ? 'Sauvegardez les modifications' : 'Certaines Informations sont Incorrectes') : 'Aucune modification'}
          required={!!isUpdated && is_all_product}
          onClick={() => saveRequired(product)} />
    }

    <div className="setting-product">
      {
        !is_newProduct && <>
          <Button title='Prix et stock avanceé' icon={<IoPricetagsSharp />} onClick={() => {
            (async () => {
              await saveRequired(product)
              window.location.assign(`/products/${product.id}/prix-stock`)
            })()
          }
          } />
          <Button title='Promo' icon={<IoPricetagsSharp />} />
          <Button title='Point de vente' icon={<IoPricetagsSharp />} />
          <Button title='Affiliation' icon={<IoPricetagsSharp />} />
          <Button title='Voir les stats' icon={<IoLayers />} />
          <Button title='Supprimer' icon={<IoTrash />} onClick={() => {
            openChild(<ChildViewer>
              <ConfirmDelete title={`Etes vous sur de vouloir suprimer le produit "${product.name}"`} onCancel={() => {
                openChild(null);
              }} onDelete={() => {
                product.id && removeProduct(product.id);
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
      !is_newProduct && <CommandeList product_id={undefined} />}
  </div>
}
// TODO ajouter peference d'affichage des values des produits. dans la feature preference:'select'|'vertical-list' ..etc
// TODO values.key => 3d.action(key)

{/* Variante requise */ }

// {/* Stock limité */}
// <h3>Le Stock est-il limité ?</h3>
// <label>
//   <input 
//     type="checkbox" 
//     checked={f.limited_Stock} 
//     onChange={() => handleCheckboxChange("limitedStock")} 
//   />
//   <span>Oui, cette variante a un stock précis.</span>
// </label>
// <p className="explanation">⚠️ Si activé, le produit sera **indisponible** une fois le stock écoulé.</p>

{/* Commander sans stock */ }
// <h3>Peut-on commander même sans stock ?</h3>
// <label>
//   <input 
//     type="checkbox" 
//     checked={f.canOrderWithoutStock} 
//     onChange={() => handleCheckboxChange("canOrderWithoutStock")} 
//   />
//   <span>Oui, les commandes sont autorisées même si le stock est à zéro.</span>
// </label>
// <p className="explanation">⚠️ Si activé, les clients peuvent commander même en **rupture de stock**, ce qui peut générer des délais.</p>


function NotVariantHere() {

  return <div className="not-feature-here">
    <div className="exemple" style={{ background: getImg('/res/font.png') }}></div>
    <p>Ajoutez une variant a ce produit s'il en a</p>
    <a href="/demo/variants"> Voir Video Demo <IoChevronForward /></a>
  </div>
}




