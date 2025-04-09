import { JSX, useRef, useState } from 'react';
import './FeatureInfo.css'
import { FeatureInterface } from '../../Interfaces/Interfaces';
import { FeatureTypes } from '../FeatureTypes/FeatureTypes';
import { IoChevronBack, IoPencil } from 'react-icons/io5';
import { Comfirm } from '../Confirm/Confirm';

const MapFeatureTypeParams: Record<string, Partial<FeatureInterface>> = {
    icon_text: {
      type: 'icon_text',
      icon: [],
    },
    icon: {
      type: 'icon',
      icon: [],
    },
    text: {
      type: 'text',
    },
    color: {
      type: 'color',
    },
    date: {
      type: 'date'
    },
    date_double: {
      type: 'date_double'
    },
    slide: {
      type: 'slide'
    },
    slide_double: {
      type: 'slide_double'
    },
    input: {
      type: 'input'
    },
  }


export { FeatureInfo }
function FeatureInfo({ feature, onChange, onCancel }: { onCancel?: () => void, feature: FeatureInterface, onChange: (feature: FeatureInterface) => void }) {

  const [f, setFeature] = useState({...feature});

  const nameRef = useRef<HTMLInputElement>(null);
  const [nameError, setNameError] = useState('');

  

  function isValidFeature(showError?: boolean) {
    let v = true;
    if (!f.name || f.name.length < 3) {
      showError && setNameError('Le nom de la variante doit contenir au moins 3 carateres')
      showError && nameRef.current?.focus()
      v = false
    }
    return v
  }
  // Fonction pour gérer le changement des cases à cocher
  const handleCheckboxChange = (key: keyof FeatureInterface) => {
    setFeature((prev) => {
      const updatedFeature = { ...prev, [key]: !prev[key] };
      return updatedFeature;
    });
  };
  const is_name_error = isValidFeature()

  f.type = f.type || 'icon_text'
  
  return (
    <div className="feature-info">
      <h3 style={{ display: 'flex', flexWrap: 'wrap', marginTop: '12px' }}>Choisez l'affichage de la variante</h3>
      <FeatureTypes className='list open' active={f.type} onSelected={(type) => {
        setFeature((prev) => ({
          ...prev,
          ...MapFeatureTypeParams[type]
        }));
      }} />
      <h3>Nom de la Variante <IoPencil /></h3>
      <label htmlFor="feature-info-name-input">
        <input
          className={"editor " + (nameError ? 'error' : '')}
          placeholder="Nom de la variante"
          id="feature-info-name-input"
          type="text"
          value={f.name}
          onChange={(e) => {
            const name = e.currentTarget.value;
            setFeature((prev) => ({ ...prev, name }));
            setNameError('')
          }}
          onKeyUp={(e) => {
            if (e.code == 'Enter') {
              if (!isValidFeature(true)) return
              onChange?.(f)
            }
          }}
        />
      </label>
      <div className="input-message"><span className='error-message'>{nameError}</span><span className='right'>{(f.name?.trim()?.length || 0)} / 256</span></div>
      <h3 style={{ whiteSpace: 'nowrap' }}>La Variante est-elle <span className={`check-text no-selectable prompt ${f.required ? 'ok' : ''}`} onClick={() => handleCheckboxChange("required")} >requise</span> ?</h3>
      <label>
        <input
          type="checkbox"
          style={{ scale: 1.3, marginRight: '12px' }}
          checked={f.required}
          onChange={() => handleCheckboxChange("required")}
        />
        <span style={{ fontSize: '0.9em' }}> Oui, cette variante est obligatoire pour passer commande. Le client doit choisir cette variante avant d'ajouter le produit au panier</span>
      </label>
      <Comfirm canConfirm={(!!(f.name && f.type))} onCancel={onCancel} confirm='Ok' onConfirm={() => {
        if (!isValidFeature(true)) return
        onChange?.(f)
      }} />
    </div>
  );
}


