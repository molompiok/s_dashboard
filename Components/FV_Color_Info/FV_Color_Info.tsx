import { useRef, useState } from 'react';
import './FV_Color_Info.css'
import { FeatureInterface, ValueInterface } from '../../Interfaces/Interfaces';
import { IoChevronBack, IoClose, IoCloudUploadOutline, IoPencil } from 'react-icons/io5';
import { getImg } from '../Utils/StringFormater';
import { useStore } from '../../pages/stores/StoreStore';
import { RiImageEditFill } from 'react-icons/ri';
import { Comfirm } from '../Confirm/Confirm';
import { Colors } from '../Utils/constants';
import { ValuePricing } from '../ValuePricing/ValuePricing';
import { ChildViewer } from '../ChildViewer/ChildViewer';
import { ConfirmDelete } from '../Confirm/ConfirmDelete';
import { useApp } from '../../renderer/AppStore/UseApp';


export { ColorInfo , ColorValue }
function ColorInfo({ value, feature, onChange, onCancel }: { feature: Partial<FeatureInterface>, onCancel?: () => void, value: ValueInterface, onChange: (value: ValueInterface) => void }) {

  const [v, setValue] = useState(value);

  const textRef = useRef<HTMLInputElement>(null);
  const [textError, setTextError] = useState('');
  const [keyError, setKeyError] = useState('');

  const { currentStore } = useStore()

  function isValidValue(showError?: boolean) {
    let _v = true;
    if (!v.text || v.text.length < 1) {
      showError && setTextError('Le nom de la variante doit contenir au moins 3 carateres')
      showError && textRef.current?.focus()
      _v = false
    }
    if (!v.key) {
      showError && setKeyError('Vous devez choisir une couleur')
      _v = false
    }
    return _v
  }
  const is_text_error = isValidValue()

  return (
    <div className="color-info">
      <h3 style={{ display: 'flex', flexWrap: 'wrap', marginTop: '12px' }}>Choisez une coleur pour cette option</h3>
      <div className="scroll">
        <div className="colors">
          {
            Colors.map(c => (
              <div key={c.name} className="group-color">
                {
                  c.variants.map((variant) => (
                    <div key={variant.hex} className="cell-color" style={{ background: variant.hex }} onClick={() => {
                      setValue((current) => ({
                        ...current,
                        key: variant.hex,
                        text: variant.name
                      }))
                    }}></div>
                  ))
                }
              </div>
            ))
          }
        </div>
      </div>
      <h3>Nom de la Couleur <IoPencil /></h3>
      <label htmlFor="feature-info-text-input">
        {v.key && <div className="color-preview" style={{background:v.key}}></div>}
        <input
          className={"editor name " + (textError ? 'error' : '')}
          placeholder="Nom de la couleur"
          id="feature-info-text-input"
          type="text"
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
      }}/>
    </div>
  );
}

function ColorValue({ value, onRemove, feature, onClick }: { onClick?: () => void, feature: Partial<FeatureInterface>, onRemove?: () => void, value: ValueInterface }) {

  const { openChild } = useApp()
  return <div className="value-color  no-selectable " onClick={(e) => {
    e.preventDefault()
    onClick?.()
  }}>
    <div className="delete"  style={{display:onRemove?'':'none'}}  onClick={(e) => {
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
    <div className="color" style={{background:`${value.key}`}}></div>
    <span className={'ellipsis text ' + (value.text ? '' : ' empty')}>{value.text}</span>
  </div>
}
