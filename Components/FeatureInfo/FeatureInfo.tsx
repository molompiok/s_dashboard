// Components/FeatureInfo/FeatureInfo.tsx
// import './FeatureInfo.css'; // ❌ Supprimer

import { JSX, useRef, useState, useEffect } from 'react';
import { FeatureInterface } from '../../api/Interfaces/Interfaces'; // Importer FeatureType
import { FeatureTypes } from '../FeatureTypes/FeatureTypes'; // Gardé
import { IoPencil } from 'react-icons/io5';
import { Confirm } from '../Confirm/Confirm'; // Gardé
import { useTranslation } from 'react-i18next'; // ✅ i18n
import { NEW_ID_START } from '../Utils/constants';
import { FeatureType } from '../Utils/functions';

export { FeatureInfo };

interface FeatureInfoProps {
  feature: Partial<FeatureInterface>; // Utiliser Partial car peut être nouveau
  onChange: (feature: Partial<FeatureInterface>) => void;
  onCancel?: () => void;
}

// Mapping type -> config par défaut (si différent de MapFeatureTypeParams)
const FeatureDefaults: Partial<Record<string, Partial<FeatureInterface>>> = {
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
  // date: {
  //   type: 'date'
  // },
  // date_double: {
  //   type: 'date_double'
  // },
  // slide: {
  //   type: 'slide'
  // },
  // slide_double: {
  //   type: 'slide_double'
  // },
  // input: {
  //   type: 'input'
  // },
  // file: {
  //   type: 'input'
  // },
};


function FeatureInfo({ feature: initialFeature, onChange, onCancel }: FeatureInfoProps) {
  const { t } = useTranslation(); // ✅ i18n
  initialFeature.type = initialFeature.type || 'icon_text'
  // État local pour le formulaire
  const [f, setFeature] = useState<Partial<FeatureInterface>>(initialFeature);
  // Erreurs locales
  const nameRef = useRef<HTMLInputElement>(null);
  const [nameError, setNameError] = useState('');

  // Mettre à jour l'état local si la prop initiale change (rare, mais sécurité)
  useEffect(() => {
    setFeature(initialFeature);
  }, [initialFeature]);


  // Validation locale
  const validateFeature = (): boolean => {
    let isValid = true;
    let errors = { name: '', type: '' };
    if (!f.name || f.name.trim().length < 3) {
      errors.name = t('feature.validation.nameRequired'); // Nouvelle clé
      nameRef.current?.focus();
      isValid = false;
    }
    setNameError(errors.name); // Mettre à jour l'erreur
    return isValid;
  };

  // Handler pour les changements d'input texte
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFeature(prev => ({ ...prev, [name]: value }));
    if (name === 'name') setNameError(''); // Reset erreur nom si modifié
  };

  // Handler pour les checkboxes
  const handleCheckboxChange = (key: keyof FeatureInterface) => {
    setFeature((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Handler pour le changement de type
  const handleTypeChange = (newType: string) => {
    setFeature((prev) => ({
      // Garder les champs communs
      ...prev,
      id: prev?.id,
      name: prev?.name,
      required: prev?.required ?? false, // Garder 'required'
      // Appliquer les valeurs par défaut du nouveau type
      ...(FeatureDefaults[newType] ?? {}), // Appliquer les défauts pour ce type
      type: newType, // Appliquer le nouveau type
      // Réinitialiser les champs spécifiques à l'ancien type? Optionnel.
      // Ex: reset min/max si on passe de RANGE à TEXT
    }));
  };

  const handleConfirm = () => {
    if (validateFeature()) {
      onChange(f);
    }
  };

  return (
    // Utiliser flex flex-col gap-4 ou 6, padding
    <div className="feature-info p-4 sm:p-6 flex flex-col gap-5">
      <div>
        <h3 className="block text-sm font-medium text-gray-700 mb-2">{t('feature.selectDisplayType')}</h3>
        {/* FeatureTypes est déjà un composant Swiper */}
        <FeatureTypes active={f.type} onSelected={handleTypeChange} />
      </div>

      <div>
        <label className=' text-sm font-medium text-gray-700 mb-1 flex justify-between items-center' htmlFor="feature-info-name-input">
          <span>{t('feature.nameLabel')} <IoPencil className="inline-block ml-1 w-3 h-3 text-gray-400" /></span>
          <span className={`text-xs ${(f.name?.trim()?.length || 0) > 56 ? 'text-red-600' : 'text-gray-400'}`}>
            {(f.name?.trim()?.length || 0)} / 56
          </span>
        </label>
        <input
          ref={nameRef}
          id="feature-info-name-input"
          name="name" // Important pour handleInputChange
          className={`block px-4 py-2 w-full rounded-md shadow-sm sm:text-sm ${nameError ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
          placeholder={t('feature.namePlaceholder')}
          type="text"
          value={f.name || ''}
          onChange={handleInputChange}
          onKeyUp={(e) => e.key === 'Enter' && handleConfirm()}
        />
        {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
      </div>

      {/* Checkbox Requis */}
      {/* Utiliser flex items-center gap-2 */}
      <div className="relative flex items-start">
        <div className="flex h-6 items-center">
          <input
            id="feature-required"
            name="required"
            type="checkbox"
            className="h-4 w-4  rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            checked={f.required ?? false}
            onChange={() => handleCheckboxChange('required')}
          />
        </div>
        <div className="ml-3 text-sm leading-6">
          <label htmlFor="feature-required" className="font-medium text-gray-800 cursor-pointer">
            {t('feature.isRequiredLabel')}
          </label>
          <p className="text-gray-500 text-xs">{t('feature.isRequiredDesc')}</p>
        </div>
      </div>

      {/* Ajouter ici les champs spécifiques au type de feature si nécessaire */}
      {/* Exemple pour type INPUT: */}
      {f.type === FeatureType.INPUT && (
        <div className='flex flex-col gap-4 border-t border-gray-200 pt-4'>
          <h4 className="text-sm font-medium text-gray-500">{t('feature.specificOptions', { type: f.type })}</h4>
          {/* Min/Max Length */}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label htmlFor="feature-min-size" className='block text-xs font-medium text-gray-700 mb-1'>{t('feature.minLength')}</label>
              <input type="number" id="feature-min-size" name="min_size" value={f.min_size ?? 0} onChange={handleInputChange} className="block w-full rounded-md px-4 border-gray-300 shadow-sm sm:text-sm h-9" />
            </div>
            <div>
              <label htmlFor="feature-max-size" className='block text-xs font-medium text-gray-700 mb-1'>{t('feature.maxLength')}</label>
              <input type="number" id="feature-max-size" name="max_size" value={f.max_size ?? 0} onChange={handleInputChange} className="block w-full rounded-md px-4 border-gray-300 shadow-sm sm:text-sm h-9" />
            </div>
          </div>
          {/* Regex */}
          <div>
            <label htmlFor="feature-regex" className='block text-xs font-medium text-gray-700 mb-1'>{t('feature.regexLabel')} ({t('common.optionalField')})</label>
            <input type="text" id="feature-regex" name="regex" value={f.regex ?? ''} onChange={handleInputChange} placeholder={t('feature.regexPlaceholder')} className="block w-full rounded-md px-4 border-gray-300 shadow-sm sm:text-sm h-9" />
          </div>
        </div>
      )}
      {/* Ajouter d'autres conditions pour DATE, RANGE, etc. */}


      {/* Boutons Confirmation/Annulation */}
      <Confirm
        canConfirm={!!f.name && !!f.type} // Confirmer si nom et type sont définis
        onCancel={onCancel}
        confirm={t('common.ok')} // Utiliser OK ou Save selon contexte
        onConfirm={handleConfirm} />
    </div>
  );
}