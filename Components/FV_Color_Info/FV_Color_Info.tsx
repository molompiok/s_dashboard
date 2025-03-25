import { useRef, useState } from 'react';
import './FV_Color_Info.css'
import { FeatureInterface, ValueInterface } from '../../Interfaces/Interfaces';
import { IoChevronBack, IoClose, IoCloudUploadOutline, IoPencil } from 'react-icons/io5';
import { getImg } from '../Utils/StringFormater';
import { useStore } from '../../pages/stores/StoreStore';
import { RiImageEditFill } from 'react-icons/ri';
import { Comfirm } from '../Confirm/Confirm';
import { Colors } from '../Utils/constants';


export { ColorInfo , ColorValue }
function ColorInfo({ value, feature, onChange, onCancel }: { feature: Partial<FeatureInterface>, onCancel?: () => void, value: ValueInterface, onChange: (value: ValueInterface) => void }) {

  const [v, setValue] = useState(value);

  const textRef = useRef<HTMLInputElement>(null);
  const [textError, setTextError] = useState('');
  const [keyError, setKeyError] = useState('');

  const { currentStore } = useStore()

  function isValidValue(showError?: boolean) {
    let _v = true;
    if (!v.text || v.text.length < 3) {
      showError && setTextError('Le nom de la variante doit contenir au moins 3 carateres')
      showError && textRef.current?.focus()
      _v = false
    }
    if (!v.key) {
      showError && setKeyError('Vous devez choisir une couleur')
      _v = false
    }
    return v
  }
  const is_text_error = isValidValue()
  const icon = v.icon?.[0];

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
          className={"editor " + (textError ? 'error' : '')}
          placeholder="Nom de la variante"
          id="feature-info-text-input"
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
              continue_selling: true
            }));
          }}
        />
        <span style={{ fontSize: '0.9em' }}>Non, cette  option n'influence pas le stock .</span>
      </label>
      <h3 style={{ whiteSpace: 'nowrap', opacity: v.decreases_stock ? 1 : 0.5 }}>Peut-on commander même sans stock ?</h3>
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


function ColorValue({ value, onRemove, feature, onClick }: { onClick?: () => void, feature: Partial<FeatureInterface>, onRemove?: () => void, value: ValueInterface }) {

  return <div className="value-color  no-selectable " onClick={(e) => {
    e.preventDefault()
    onClick?.()
  }}>
    <div className="delete" onClick={(e) => {
      e.preventDefault()
      e.stopPropagation()
      onRemove?.()
    }}><IoClose /></div>
    <div className="color" style={{background:`${value.key}`}}></div>
    <span className={'ellipsis text ' + (value.text ? '' : ' empty')}>{value.text}</span>
  </div>
}
