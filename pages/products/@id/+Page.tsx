import { IoAdd, IoChevronDown, IoChevronForward, IoClose, IoCloudUploadSharp, IoLayers, IoMegaphoneOutline, IoPencil, IoPricetagsSharp, IoTrash } from 'react-icons/io5'
import './+Page.css'
import { CategoryItem } from '../../../Components/CategoryItem/CategoryItem'
import { CommandeList } from '../../../Components/CommandesList/CommandesList'
import { JSX, useEffect, useRef, useState } from 'react'
import { Topbar } from '../../../Components/TopBar/TopBar'
import { SwiperProducts } from '../../../Components/SwiperProducts/SwiperProducts'
import { images as imgs } from "./images";
import { HoriszontalSwiper } from '../../../Components/HorizontalSwiper/HorizontalSwiper'
import { FeatureInterface, ProductInterface, ValueInterface } from '../../../Interfaces/Interfaces'
import { NEW_VIEW } from '../../../Components/Utils/constants'
import { ClientCall } from '../../../Components/Utils/functions'
import { usePageContext } from '../../../renderer/usePageContext'
import { useStore } from '../../stores/StoreStore'
import { useProductStore } from '../ProductStore'
import { getDefaultValues, IsFeaturesHere } from '../../../Components/Utils/parseData'
import { useApp } from '../../../renderer/AppStore/UseApp'
import { ChildViewer } from '../../../Components/ChildViewer/ChildViewer'
import { CategoriesPopup } from '../../../Components/CategoriesPopup/CategoriesPopup'
import { FaRedo } from 'react-icons/fa'
import { ConfirmDelete } from '../../../Components/Confirm/ConfirmDelete'
import { useReplaceState } from '../../../Hooks/useRepalceState'
import { Button } from '../../../Components/Button/Button'
import { SaveButton } from '../../../Components/SaveButton/SaveButton'
import { Indicator } from '../../../Components/Indicator/Indicator'
import { getImg } from '../../../Components/Utils/StringFormater'

import { Separator } from '../../../Components/Separator/Separator'
import { Swiper, SwiperSlide } from 'swiper/react'
import { useWindowSize } from '../../../Hooks/useWindowSize';
import { Grid, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/grid';




const VALUE_LIMIT = 7
const FEATURE_LIMIT = 5

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

  const [nameError, setNameError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [priceError, setPriceError] = useState('');
  const [barredError, setBarredError] = useState('');


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

  const is_features_here = IsFeaturesHere(collected);

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
    let v: void | boolean = true;
    if (!collected.name || collected.name.length < 3) {
      showError && setNameError('le nom doit contenir au moin 3 carateres')
      showError && nameRef.current?.focus()
      v = false
    }
    if (!collected.description || collected.description.length < 3) {
      showError && setDescriptionError('la description doit contenir au moin 3 carateres');
      showError && descriptionRef.current?.focus()
      v = false
    }
    if (!collected.barred_price || (collected.barred_price < (collected.price || 0))) {
      showError && setBarredError('le prix barre doit etre supperieur au prix du produit');
      v = false
      barredPriceRef.current?.focus()
    }
    if (!collected.price) {
      showError && setPriceError('le prix du produit doit etre difinie ');
      v = false
      priceRef.current?.focus()
    }
    // if (!collected.values) return showError ? setViewError('cliquez sur le cadre pour ajouter une image') : false
    return v
  }
  const is_all_collected = isAllCollected(collected);


  const is_feature_max = (collected.features?.length || 0) >= FEATURE_LIMIT;

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
        if (!nextValue || (nextValue.views?.length == 0) || (nextValue.views?.length == 1 && nextValue.views?.[0] == NEW_VIEW)) return false;
        const currentvalue = values[index];
        setValues(values.map((v, i) => i == index ? nextValue : i == index + 1 ? currentvalue : v));
        changeUpdated(true)
        return true;
      }} goBack={() => {
        const lastValue = values[index - 1];
        if (!lastValue || (lastValue.views?.length == 0) || (lastValue.views?.length == 1 && lastValue.views?.[0] == NEW_VIEW)) return false;
        const currentvalue = values[index];
        setValues(values.map((v, i) => i == index ? lastValue : i == index - 1 ? currentvalue : v));
        changeUpdated(true)
        return true;
      }} />
    </div>}
    <div className="product-section-minimal" style={{ display: 'none' }}>
      <label className='editor' htmlFor='input-product-name'>Nom du Produit <IoPencil /></label>
      <input className={`editor ${nameError ? 'error' : ''}`} type="text" id={'input-product-name'} value={collected.name || ''} placeholder="Ajoutez un nom de produit" onChange={(e) => {
        const name = e.currentTarget.value
        setCollected((prev) => ({
          ...prev,
          ['name']: name.replace(/\s+/g, ' ').substring(0, 256),
        }))
        changeUpdated(true)
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
      <div className="input-message"><span className='error-message'>{nameError}</span><span className='right'>{(collected.name?.trim()?.length || 0)} / 256</span></div>
      <label className='editor' htmlFor='input-product-description'>Description <IoPencil /></label>
      <textarea className={`editor ${descriptionError ? 'error' : ''}`} id="input-product-description" placeholder='Ajoutez la description du produit' cols={10} rows={1} ref={ref => {
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
        setCollected((prev) => ({
          ...prev,
          ['description']: description.replace(/\s+/g, ' ').substring(0, 1024),
        }));
        changeUpdated(true)
        setDescriptionError('')
      }} onKeyDown={(e) => {
        if (e.code == 'Tab') {
          e.stopPropagation();
          e.preventDefault();
          const p = document.querySelector('#input-product-price') as HTMLTextAreaElement | null;
          p && p.focus();
        }
      }}></textarea>
      <div className="input-message"><span className='error-message'>{descriptionError}</span><span className='right'>{(collected.description?.trim()?.length || 0)} / 1024</span></div>
      <div className='row' style={{
        columnGap: '24px',
        justifyContent: 'flex-start',
        flexWrap: 'wrap',
      }}>
        <div className="column">
          <label className='editor' htmlFor='input-product-price'>Prix de base<IoPencil /></label>
          <div className='price-ctn'>
            <input className={`editor ${priceError ? 'error' : ''}`} type="number" id={'input-product-price'}
              value={collected.price || ''}
              placeholder="Prix du produit"
              onChange={(e) => {
                const price = e.currentTarget.value
                setCollected((prev) => ({
                  ...prev,
                  ['price']: Number.parseInt(price),
                }))
                changeUpdated(true)
                setPriceError('')
              }} />
            <div className="currency">{'FCFA'}</div>
          </div>
        </div>
        <div className="column">
          <label className='editor' htmlFor='input-product-barred-price'>Prix barré <IoPencil /> <Indicator style={{ marginLeft: 'auto' }} title={`L'ancien prix ou le prix actuel du marcher`} description={`Ce prix sert de référence au client. Il indique au client que votre produit est en réduction`} /></label>
          <div className='price-ctn'>
            <input className={`editor ${barredError ? 'error' : ''}`} type="number" id={'input-product-barred-price'}
              value={collected.barred_price || ''}
              placeholder="Prix du produit"
              onChange={(e) => {
                const barred_price = e.currentTarget.value
                setCollected((prev) => ({
                  ...prev,
                  ['barred_price']: Number.parseInt(barred_price),
                }))
                changeUpdated(true)
                setBarredError('')
              }} />
            <div className="currency">{'FCFA'}</div>
          </div>
        </div>
      </div>
      <h3>Category du Produit <span>(facultatif)</span></h3>
      <div className='category-ctn'>
        <div className={`icon ${collected.category_id ? 'replace' : 'add'}`} onClick={() => {
          openChild(<ChildViewer title='List des categories'>
            <CategoriesPopup onSelected={(c) => {
              setCollected((prev) => ({
                ...prev,
                category_id: c.id
              }))
              changeUpdated(true)
            }} />
          </ChildViewer>, { blur: 10 })
        }}>
          {collected.category_id ? <FaRedo /> : <IoAdd />}
          <span>{collected.category_id ? 'remplacez' : 'ajoutez'}</span>
        </div>
        {
          collected.category_id && <CategoryItem
            openCategory key={collected.category_id}
            category_id={collected.category_id}
            onDelete={(c) => {
              setCollected((prev) => ({
                ...prev,
                category_id: ''
              }))
              changeUpdated(true)
            }}
          />
        }
      </div>
    </div>
    <div className="product-section-feature">
      <div className="top">
        <h2>Les Variantes du Produit <b className='prompt'>( {collected.features?.length || 0} / {FEATURE_LIMIT} )</b>
          <Indicator title=''
            description={!is_feature_max ? `Vous pouvez ajoueter jusqu\'a ${FEATURE_LIMIT} variantes par produit` : `Vous avez atteint la limit ${FEATURE_LIMIT} variantes par produit`}
            className='right' />
        </h2>
        {<span className={is_feature_max ? 'max' : ''} onClick={() => {
          if (is_feature_max) return
          openChild(<ChildViewer title='Les Informations sur la variante'>
            <FeatureInfo feature={{
              id: ClientCall(Math.random, 0).toString(),
              created_at: '',
              name: '',
              product_id: '',
              required: true,
              type: '',
              updated_at: '',
              default: '',
              icon: [],
              index: '',
              is_double: false,
              max: '',
              max_size: '',
              min: '',
              min_size: '',
              multiple: false,
              regex: '',
              values: []
            }} onChange={(f) => {
              setCollected((prev) => {
                const fs = prev.features?.filter(f => f.id !== prev.default_feature_id) || [];
                return {
                  ...prev,
                  features: [...fs, f]
                }
              })
            }} />
          </ChildViewer>, {
            background: '#3455'
          })
        }}>Ajoutez</span>}
      </div>
      <Separator style={{ marginTop: '8px' }} color='#3455' />
      {
        !is_features_here && <NotVariantHere />
      }
      {
        collected.features?.map(((f, i) => (
          <Feature key={i} feature={f} setFeature={(cb) => {
            console.log(cb, cb(f));

            setCollected((prev) => ({
              ...prev,
              features: collected.features?.map(_f => _f.id == f.id ? cb(f) as any : _f)
            }))
          }} />
        )))
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
    <ListType active={collected.features?.[0].type} onSelected={(type) => {
        // setFeature((prev) => ({
        //   ...prev,
        //   ...MapFeatureTypeParams[type]
        // }));
      }} />
    <div className="setting-product">
      {
        !is_newProduct && <>
          <Button title='Promo' icon={<IoPricetagsSharp />} />
          <Button title='Point de vente' icon={<IoPricetagsSharp />} />
          <Button title='Affiliation' icon={<IoPricetagsSharp />} />
          <Button title='Variantes et Stock' icon={<IoLayers />} onClick={() => {
            window.location.assign(`/products/${collected.id}/variantes`);
          }} />
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
      !is_newProduct && <CommandeList product_id={undefined} />}
  </div>
}
// TODO ajouter peference d'affichage des values des produits. dans la feature preference:'select'|'vertical-list' ..etc
// TODO values.key => 3d.action(key)

function FeatureInfo({ feature, onChange }: { feature: FeatureInterface, onChange: (feature: FeatureInterface) => void }) {

  const [f, setFeature] = useState(feature);

  // Fonction pour gérer le changement des cases à cocher
  const handleCheckboxChange = (key: keyof FeatureInterface) => {
    setFeature((prev) => {
      const updatedFeature = { ...prev, [key]: !prev[key] };
      onChange(updatedFeature);
      return updatedFeature;
    });
  };

  return (
    <div className="feature-info">
      {/* Nom de la variante */}
      <h3>Nom de la Variante <IoPencil /></h3>
      <label htmlFor="feature-info-name-input">
        <input
          className="editor"
          placeholder="Nom de la variante"
          id="feature-info-name-input"
          type="text"
          value={f.name}
          onChange={(e) => {
            const name = e.currentTarget.value;
            if (!name) return;
            setFeature((prev) => ({ ...prev, name }));
          }}
        />
      </label>
      <h3 style={{ whiteSpace: 'nowrap' }}>La Variante est-elle <span className={`check-text no-selectable prompt ${f.required ? 'ok' : ''}`} onClick={() => handleCheckboxChange("required")} >requise</span> ?</h3>
      <label>
        <input
          type="checkbox"
          checked={f.required}
          onChange={() => handleCheckboxChange("required")}
        />
        <span style={{ fontSize: '0.9em' }}> Oui, cette variante est obligatoire pour passer commande. Le client doit choisir cette variante avant d'ajouter le produit au panier</span>
      </label>
      <h3 style={{ display: 'flex', flexWrap: 'wrap' }}>Choisez l'affichage de la variante</h3>
      <ListType className='list open' active={f.type} onSelected={(type) => {
        setFeature((prev) => ({
          ...prev,
          ...MapFeatureTypeParams[type]
        }));
      }} />
    </div>
  );
}

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

const MapFeatureTypeParams: Record<string, Partial<FeatureInterface>> = {
  icon: {
    name: '',
    required: true,
    type: 'icon',
    updated_at: '',
    default: '',
    icon: [],
  },
  text: {
    type: 'text',
  },
  icon_text: {
    type: 'icon_text',
    icon: [],
  },
  color: {
    type: 'color',
  }
}


function ListType({ className, onSelected, active }: { active?: string, onSelected: (type: string) => void, className?: string }) {

  const types = [<div key={'text'} className={` no-selectable type-option ${active == 'text' ? 'active' : ''}`} onClick={() => {
    onSelected('text')
  }}>
    <div className="preview-type" style={{ background: getImg('/res/Google__G__logo.svg.webp') }}></div>
    <div className="name">{'Text'}</div>
  </div>,
  <div key={'icon'} className={` no-selectable type-option ${active == 'icon' ? 'active' : ''}`} onClick={() => {
    onSelected('icon')
  }}>
    <div className="preview-type" style={{ background: getImg('/res/Google__G__logo.svg.webp') }}></div>
    <div className="name">{'Icon'}</div>
  </div>,
  <div key={'icon_text'} className={` no-selectable type-option ${active == 'icon_text' ? 'active' : ''}`} onClick={() => {
    onSelected('icon_text')
  }}>
    <div className="preview-type" style={{ background: getImg('/res/Google__G__logo.svg.webp') }}></div>
    <div className="name">{'Icon Text'}</div>
  </div>,
  <div key={'color'} className={` no-selectable type-option ${active == 'color' ? 'active' : ''}`} onClick={() => {
    onSelected('color')
  }}>
    <div className="preview-type" style={{ background: getImg('/res/Google__G__logo.svg.webp') }}></div>
    <div className="name">{'Couleur'}</div>
  </div>,
  <div key={'date'} className={` no-selectable type-option ${active == 'date' ? 'active' : ''}`} onClick={() => {
    onSelected('date')
  }}>
    <div className="preview-type" style={{ background: getImg('/res/Google__G__logo.svg.webp') }}></div>
    <div className="name">{'Date'}</div>
  </div>,
  <div key={'date_double'} className={` no-selectable type-option ${active == 'date_double' ? 'active' : ''}`} onClick={() => {
    onSelected('date_double')
  }}>
    <div className="preview-type" style={{ background: getImg('/res/Google__G__logo.svg.webp') }}></div>
    <div className="name">{'Interval de date'}</div>
  </div>,
  <div key={'slide'} className={` no-selectable type-option ${active == 'slide' ? 'active' : ''}`} onClick={() => {
    onSelected('slide')
  }}>
    <div className="preview-type" style={{ background: getImg('/res/Google__G__logo.svg.webp') }}></div>
    <div className="name">{'Niveau'}</div>
  </div>,
  <div key={'slide_double'} className={` no-selectable type-option ${active == 'slide_double' ? 'active' : ''}`} onClick={() => {
    onSelected('slide_double')
  }}>
    <div className="preview-type" style={{ background: getImg('/res/Google__G__logo.svg.webp') }}></div>
    <div className="name">{'Interval'}</div>
  </div>,
  <div key={'input'} className={` no-selectable type-option ${active == 'input' ? 'active' : ''}`} onClick={() => {
    onSelected('input')
  }}>
    <div className="preview-type" style={{ background: getImg('/res/Google__G__logo.svg.webp') }}></div>
    <div className="name">{'Saisie text'}</div>
  </div>];

  const s = useWindowSize().width;
  const n = s <= 580 ? (s - 260) / 220 + 0.9
    : 2;

  return <div className={`list-type ${className || ''} `}>
    <Swiper
      slidesPerView={n}
      grid={{
        rows: 2,
        fill: 'column'
      }}
      spaceBetween={30}
      pagination={{
        clickable: true,
      }}
      modules={[Grid, Pagination]}
    >
      {
        [...types].map((t, i) => (
          <SwiperSlide key={i}>
            {t}
          </SwiperSlide>
        ))
      }
    </Swiper>
    {

    }
  </div>
}

function Feature({ feature, setFeature }: { setFeature: (cb: (feature: Partial<FeatureInterface> | undefined) => Partial<FeatureInterface> | undefined) => void, feature?: Partial<FeatureInterface> }) {
  const [isTypeOpen, changeTypeOpen] = useState(false);
  const [isRequired, changeRequired] = useState(false);
  const [affectStock, setAffectStock] = useState(false)
  const id = feature?.id || 0;

  return <div className="feature">
    <div className="top">
      <label htmlFor={`feature-name-input ${id}`}>
        <input className='editor' placeholder='Nom de la variante' id={`feature-name-input ${id}`} type="text" value={feature?.name} onChange={(e) => {
          const name = e.currentTarget.value
          if (!name) return;
          setFeature((prev) => ({
            ...prev,
            name
          }))
        }} />
        <IoPencil />
      </label>
      <div className="options">
        <div className={`required no-selectable ${isRequired ? 'ok' : ''}`} onClick={() => {
          changeRequired(!isRequired)
        }}>Requis</div>
        <div className="type no-selectable" onClick={(e) => {
          if (e.currentTarget == e.target) {
            changeTypeOpen(!isTypeOpen);
          }
        }}>{feature?.type || 'Type'}<IoChevronDown style={{ marginLeft: 'auto' }} />
          <ListType className={isTypeOpen ? 'open' : ''} onSelected={(type) => {
            setFeature((prev) => ({
              ...prev,
              ...MapFeatureTypeParams[type]
            }));
            changeTypeOpen(false);
          }} />
        </div>
      </div>
    </div>
    <div className="list-values">
      {
        (feature?.values || [])?.map((v, i) => {
          return (
            <Value key={i} value={v} feature={feature as any} onRemove={() => {
              console.log('#####', v);

              setFeature((prev) => ({
                ...prev,
                values: prev?.values?.filter(_v => _v.id != v.id)
              }))
            }} />
          )
        })
      }
      {
        (feature?.values?.length || 0) < VALUE_LIMIT && <div className="add-new" onClick={() => {
          setFeature((prev) => ({
            ...prev,
            values: [...(prev?.values || []), {
              id: ClientCall(Math.random, 0).toString(),
              featureId: prev?.id || '',
              index: 0,
              text: '',
              icon: [],
              createdAt: '',
              updatedAt: '',
              views: [],
            }]
          }))
        }}>
          <IoAdd />
          <span>ajoutez ({(feature?.values?.length || 0)}/{VALUE_LIMIT})</span>
        </div>
      }
    </div>
  </div>
}



function Value({ value, feature, onRemove }: { onRemove?: () => void, value: ValueInterface, feature: Partial<FeatureInterface> }) {

  const MapValues = {
    get icon_text() {
      return <IconTextValue feature={feature} value={value} onRemove={onRemove} />
    },
    get text() {
      return <IconTextValue feature={feature} value={value} onRemove={onRemove} />
    },
    get icon() {
      return <IconTextValue feature={feature} value={value} onRemove={onRemove} />
    },
    get color() {
      return <IconTextValue feature={feature} value={value} onRemove={onRemove} />
    }
  }

  console.log(value);


  return <div className="f-value">
    {(MapValues as any)[feature?.type || 'text'] || <IconTextValue feature={feature} value={value} />}
  </div>
}

function IconTextValue({ value, onClick, feature, onRemove }: { onRemove?: () => void, feature: Partial<FeatureInterface>, onClick?: () => void, value: ValueInterface }) {
  const [collected, setCollected] = useState<ValueInterface & ({ prevIcon?: string })>(value);
  const icon = collected.icon?.[0];
  const { currentStore } = useStore()

  console.log(feature.type);

  return <div className="value-icon-text  no-selectable " onClick={() => {

  }}>
    {/* <label htmlFor='chose-category-icon' className={`icon-60-value`} style={{
      background:
        icon ? getImg(
          typeof icon == 'string' ? icon
            : collected.prevIcon,
          undefined, typeof icon == 'string' ?
          undefined: undefined
        ) : getImg('/res/empty/drag-and-drop.png', '80%')
    }}>
      <input id='chose-category-icon' type="file" accept={'image/*'} style={{ display: 'none' }} onChange={(e) => {
        const files = e.currentTarget.files;
        if (!files?.[0]) return
        setCollected((prev) => ({
          ...prev,
          icon: Array.from(files),
          prevIcon: URL.createObjectURL(files[0])
        }))
      }} />
    </label> */}
    <div className="delete" onClick={() => {
      onRemove?.()
    }}><IoClose /></div>
    {
      ((feature?.type || 'icon')?.includes('icon')) && <div className="icon-60-value" style={{
        background:
          icon ? getImg(
            typeof icon == 'string' ? icon
              : collected.prevIcon,
            undefined, typeof icon == 'string' ?
            undefined : undefined
          ) : getImg('/res/empty/drag-and-drop.png', '160%')
      }}>
      </div>
    }
    {(feature?.type == 'text' || feature?.type == 'icon_text') && <span className='ellipsis'>{value.text}</span>}
  </div>
}
function DateValue({ value, onRemove }: { onRemove?: () => void, value: ValueInterface }) {

  return <div className="date-value"></div>
}
function ColorValue({ value, onRemove }: { onRemove?: () => void, value: ValueInterface }) {

  return <div className="color-value"></div>
}
function FileValue({ value, onRemove }: { onRemove?: () => void, value: ValueInterface }) {

  return <div className="file-value"></div>
}
function InputValue({ value, onRemove }: { onRemove?: () => void, value: ValueInterface }) {

  return <div className="input-value"></div>
}
function SlideValue({ value, onRemove }: { onRemove?: () => void, value: ValueInterface }) {

  return <div className="slide-value"></div>
}