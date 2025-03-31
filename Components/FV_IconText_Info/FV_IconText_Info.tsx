import { JSX, useRef, useState } from 'react';
import './FV_IconText_Info.css'
import { FeatureInterface, ValueInterface } from '../../Interfaces/Interfaces';
import { IoChevronBack, IoClose, IoCloudUploadOutline, IoPencil } from 'react-icons/io5';
import { getImg } from '../Utils/StringFormater';
import { useStore } from '../../pages/stores/StoreStore';
import { RiImageEditFill } from 'react-icons/ri';
import { Comfirm } from '../Confirm/Confirm';
import { Indicator } from '../Indicator/Indicator';
import { ValuePricing } from '../ValuePricing/ValuePricing';
import { useApp } from '../../renderer/AppStore/UseApp';
import { ChildViewer } from '../ChildViewer/ChildViewer';
import { ConfirmDelete } from '../Confirm/ConfirmDelete';


export { FV_IconText_Info, IconTextValue, TextValue }
function FV_IconText_Info({ value, feature, onChange, onCancel }: { feature: Partial<FeatureInterface>, onCancel?: () => void, value: ValueInterface, onChange: (value: ValueInterface) => void }) {

  const [v, setValue] = useState(value);

  const imageRef = useRef<HTMLLabelElement>(null);
  const textRef = useRef<HTMLInputElement>(null);
 
  const [textError, setTextError] = useState('');
  const [imageError, setImageError] = useState('');

  const { currentStore } = useStore()

  function isValidValue(showError?: boolean) {
    let _v = true;
    
    if (!v.text || v.text.length < 1) {
      showError && setTextError('Le nom de la variante doit contenir au moins 3 carateres')
      showError && textRef.current?.focus()
      _v = false
    }

    return _v
  }
  const is_text_error = isValidValue()
  console.log('is_text_error',is_text_error);
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
      <label  htmlFor="icon-text-name-input">
        <input
          className={"editor " + (textError ? 'error' : '')}
          placeholder="Nom de l'option"
          id="icon-text-name-input"
          type="text"
          ref={textRef} 
          value={v.text || ''}
          onChange={(e) => {
            const text = e.currentTarget.value;
            setValue((prev) => ({ ...prev, text:text.substring(0,16) }));
            setTextError('')
          }}
        />
      </label>
      <div className="input-message"><span className='error-message'>{textError}</span><span className='right'>{(v.text?.trim()?.length || 0)} / 16</span></div>

      <ValuePricing addToValue={(value)=>{
        setValue((current) => ({
          ...current,
          ...value
        }))
      }} value={v}/>
      
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
const { openChild } = useApp()
  return <div className="value-icon-text  no-selectable " onClick={() => {
    onClick?.()
  }}>
    <div className="delete" style={{display:onRemove?'':'none'}}  onClick={(e) => {
      e.preventDefault()
      e.stopPropagation()
      openChild(<ChildViewer>
        <ConfirmDelete title='Etez vous sur de vouloir supprimer cette option' onCancel={() => {
          
          openChild(null);
        }} onDelete={()=>{
          onRemove?.()
          openChild(null);
        }} />
      </ChildViewer>, {
        background:'#3455'
      })
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

  const { openChild } = useApp()
  return <div className="value-text  no-selectable " onClick={(e) => {
    e.preventDefault()
    onClick?.()
  }}>
    <div className="delete" style={{display:onRemove?'':'none'}} onClick={(e) => {
      e.preventDefault()
      e.stopPropagation()
      openChild(<ChildViewer>
        <ConfirmDelete title='Etez vous sur de vouloir supprimer cette option' onCancel={() => {
          openChild(null);
        }} onDelete={()=>{
          onRemove?.()
          openChild(null);
        }} />
      </ChildViewer>, {
        background:'#3455'
      })
    }}><IoClose /></div>
    <span className={'ellipsis text ' + (value.text ? '' : ' empty')}>{value.text}</span>
  </div>
}
