import { JSX, useRef, useState } from 'react';
import './FV_IconText_Info.css'
import { FeatureInterface, ValueInterface } from '../../Interfaces/Interfaces';
import { IoChevronBack, IoClose, IoCloudUploadOutline, IoPencil } from 'react-icons/io5';
import { getImg } from '../Utils/StringFormater';
import { useStore } from '../../pages/stores/StoreStore';
import { RiImageEditFill } from 'react-icons/ri';
import { Comfirm } from '../Confirm/Confirm';
import { Indicator } from '../Indicator/Indicator';


export { FV_IconText_Info, IconTextValue, TextValue }
function FV_IconText_Info({ value, feature, onChange, onCancel }: { feature: Partial<FeatureInterface>, onCancel?: () => void, value: ValueInterface, onChange: (value: ValueInterface) => void }) {

  const [v, setValue] = useState(value);

  const imageRef = useRef<HTMLLabelElement>(null);
  const textRef = useRef<HTMLInputElement>(null);
  const additionalPriceRef = useRef<HTMLInputElement>(null);
  const stockRef = useRef<HTMLInputElement>(null);
  const [textError, setTextError] = useState('');
  const [imageError, setImageError] = useState('');
  const [additionalPriceError, setAdditionalPriceError] = useState('');
  const [stockError, setStockError] = useState('');

  const { currentStore } = useStore()

  function isValidValue(showError?: boolean) {
    let _v = true;
    if (!v.text || v.text.length < 3) {
      showError && setTextError('Le nom de la variante doit contenir au moins 3 carateres')
      showError && textRef.current?.focus()
      _v = false
    }
    return v
  }
  const is_text_error = isValidValue()
  const icon = v.icon?.[0];
  return (
    <div className="icon-text-info">
      <h3 style={{ display: 'flex', flexWrap: 'wrap', marginTop: '12px' }}>L'image de l'option (logo / icon)</h3>
      <label ref={imageRef} htmlFor='icon-text-icon-input' className={`icon-180-category view shadow ${imageError ? 'error' : ''} `} style={{
        background:
          icon ? getImg(
            typeof icon == 'string' ? icon
              : (v as any).prevIcon,
            undefined, typeof icon == 'string' ?
            currentStore?.url : undefined
          ) : getImg('/res/empty/drag-and-drop.png', '80%')
      }} >
        <input id='icon-text-icon-input' type="file" accept={'image/*'} style={{ display: 'none' }} onChange={(e) => {
          const files = e.currentTarget.files;
          console.log({ files });
          if (!files?.[0]) return
          setValue((current) => ({
            ...current,
            icon: Array.from(files),
            prevIcon: URL.createObjectURL(files[0])
          }))
          setImageError('')
        }} />
        {
          <div className="edit"><RiImageEditFill className='edit-img' /></div>
        }
        {(!v.icon || imageError) && <span> <IoCloudUploadOutline />
          choisissez l'Image</span>}
      </label>
      <h3>Nom de l'option <IoPencil /></h3>
      <label htmlFor="icon-text-name-input">
        <input
          className={"editor " + (textError ? 'error' : '')}
          placeholder="Nom de l'option"
          id="icon-text-name-input"
          type="text"
          value={v.text || ''}
          onChange={(e) => {
            const text = e.currentTarget.value;
            setValue((prev) => ({ ...prev, text }));
            setTextError('')
          }}
        />
      </label>
      <div className="input-message"><span className='error-message'>{textError}</span><span className='right'>{(v.text?.trim()?.length || 0)} / 256</span></div>

      <label className='editor' htmlFor='icon-text-additional-price-input'>Prix additionnel<IoPencil /><Indicator style={{ marginLeft: 'auto' }} title={`L'ancien prix ou le prix actuel du marcher`} description={`Ce prix sert de référence au client. Il indique au client que votre produit est en réduction`} /></label>
      <div className='price-ctn'>
        <input className={`price editor ${additionalPriceError ? 'error' : ''}`} type="number" id={'icon-text-additional-price-input'}
          value={v.additional_price || ''}
          placeholder="Prix additionnel au prix du produit"
          max={1_000_000_000}
          min={0}
          onChange={(e) => {
            const price = e.currentTarget.value
            setValue((current) => ({
              ...current,
              ['additional_price']: Number.parseInt(price),
            }))
            setAdditionalPriceError('')
          }} />
        <div className="currency">{'FCFA'}</div>
      </div>

      <h3 style={{ whiteSpace: 'nowrap' }}>Le Stock est-il limité ?</h3>
      <label>
        <input
          type="checkbox"
          style={{ scale: 1.3, marginRight: '12px' }}
          checked={v.decreases_stock}
          onChange={() => {
            setValue((current) => ({
              ...current,
              decreases_stock: true,
              stock:0,
            }));
          }}
        />
        <span style={{ fontSize: '0.9em' }}>Oui, cette  option a un stock précis.</span>
      </label>
      <br />
      <label>
        <input
          type="checkbox"
          style={{ scale: 1.3, marginRight: '12px' }}
          checked={!v.decreases_stock}
          onChange={() => {
            setValue((current) => ({
              ...current,
              decreases_stock: false,
              continue_selling: true,
              stock:undefined
            }));
          }}
        />
        <span style={{ fontSize: '0.9em' }}>Non, cette  option n'influence pas le stock .</span>
      </label>
      <div className="column" style={{opacity:v.decreases_stock? 1 : 0.5}}>
        <label className='editor' htmlFor='icon-text-stock-input'>Combien en stock ? <IoPencil /> <Indicator style={{ marginLeft: 'auto' }} title={`L'ancien prix ou le prix actuel du marcher`} description={`Ce prix sert de référence au client. Il indique au client que votre produit est en réduction`} /></label>
        <div className='price-ctn'>
          <input disabled={!v.decreases_stock} className={`price editor ${stockError ? 'error' : ''}`} type="number" id={'icon-text-stock-input'}
            value={v.stock??''}
            placeholder="Stock du produit"
            max={1_000_000_000}
            min={0}
            onChange={(e) => {
              const barred_price = e.currentTarget.value
              setValue((current) => ({
                ...current,
                ['stock']: Number.parseInt(barred_price),
              }))

              setStockError('')
            }} />
          <div className="currency">{'FCFA'}</div>
        </div>
      </div>
      <h3 style={{  opacity: v.decreases_stock ? 1 : 0.5 }}>Peut-on commander même sans stock ?</h3>
      <label style={{ opacity: v.decreases_stock ? 1 : 0.5 }}>
        <input
          type="checkbox"
          style={{ scale: 1.3, marginRight: '12px' }}
          checked={v.continue_selling}
          onChange={() => v.decreases_stock && setValue((current) => ({
            ...current,
            continue_selling: true,
          }))}
        />
        <span style={{ fontSize: '0.9em' }}>Oui, les commandes sont autorisées même si le stock est à zéro(0).</span>
      </label>
      <br />
      <label style={{ opacity: v.decreases_stock ? 1 : 0.5 }}>
        <input
          type="checkbox"
          style={{ scale: 1.3, marginRight: '12px' }}
          checked={!v.continue_selling}
          onChange={() => v.decreases_stock && setValue((current) => ({
            ...current,
            continue_selling: false,
          }))}
        />
        <span style={{ fontSize: '0.9em' }}>Non, Les clients ne peuvent pas commander si le stock est a zéro(0)</span>
      </label>
      
      <Comfirm canConfirm={!is_text_error} onCancel={onCancel} confirm='Ok' onConfirm={() => {
        if (!isValidValue(true)) return
        onChange?.(v)
      }} />
    </div>
  );
}


function IconTextValue({ value, onClick, feature, onRemove }: { onRemove?: () => void, feature: Partial<FeatureInterface>, onClick?: () => void, value: ValueInterface }) {
  const icon = value.icon?.[0];
  const { currentStore } = useStore()

  return <div className="value-icon-text  no-selectable " onClick={() => {
    onClick?.()
  }}>
    <div className="delete" style={{display:onRemove?'':'none'}}  onClick={(e) => {
      e.preventDefault()
      e.stopPropagation()
      onRemove?.()
    }}><IoClose /></div>
    {
      ((feature?.type || 'icon')?.includes('icon')) && <div className="icon-60-value" style={{
        background:
          icon ? getImg(
            typeof icon == 'string' ? icon
              : (value as any).prevIcon,
            undefined, typeof icon == 'string' ?
            currentStore?.url : undefined
          ) : getImg('/res/empty/drag-and-drop.png', '160%')
      }}>
      </div>
    }
    {feature?.type == 'icon_text' && <span className={'ellipsis text ' + (value.text ? '' : ' empty')}>{value.text}</span>}
  </div>
}

function TextValue({ value, onRemove, feature, onClick }: { onClick?: () => void, feature: Partial<FeatureInterface>, onRemove?: () => void, value: ValueInterface }) {

  return <div className="value-text  no-selectable " onClick={(e) => {
    e.preventDefault()
    onClick?.()
  }}>
    <div className="delete" style={{display:onRemove?'':'none'}} onClick={(e) => {
      e.preventDefault()
      e.stopPropagation()
      onRemove?.()
    }}><IoClose /></div>
    <span className={'ellipsis text ' + (value.text ? '' : ' empty')}>{value.text}</span>
  </div>
}
