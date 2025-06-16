// Components/FV_Color_Info/FV_Color_Info.tsx
// import './FV_Color_Info.css'; // ❌ Supprimer

import { useRef, useState, useEffect } from 'react';
import { FeatureInterface, ValueInterface } from '../../api/Interfaces/Interfaces';
import { IoClose, IoPencil } from 'react-icons/io5';
import { Confirm } from '../Confirm/Confirm'; // Gardé
import { Colors } from '../Utils/constants'; // Gardé
import { ValuePricing } from '../ValuePricing/ValuePricing'; // Gardé
import { useTranslation } from 'react-i18next'; // ✅ i18n
import { ChildViewer } from '../ChildViewer/ChildViewer'; // Pour popup delete
import { ConfirmDelete } from '../Confirm/ConfirmDelete'; // Pour popup delete
import { useChildViewer } from '../ChildViewer/useChildViewer';

export { ColorInfo, ColorValue };

interface ColorInfoProps {
    value: ValueInterface;
    feature: Partial<FeatureInterface>;
    onChange: (value: ValueInterface) => void;
    onCancel?: () => void;
}

function ColorInfo({ value: initialValue, feature, onChange, onCancel }: ColorInfoProps) {
    const { t } = useTranslation(); // ✅ i18n
    // État local
    const [v, setValue] = useState<ValueInterface>(initialValue);
    // Erreurs locales
    const textRef = useRef<HTMLInputElement>(null);
    const [textError, setTextError] = useState('');
    const [keyError, setKeyError] = useState(''); // Pour la couleur hex

    // Mettre à jour état local
    useEffect(() => {
        setValue(initialValue);
        setTextError('');
        setKeyError('');
    }, [initialValue]);

    // Validation locale
    const validateValue = (): boolean => {
        let isValid = true;
        const errors = { text: '', key: '' };
        if (!v.text || v.text.trim().length < 1) {
            errors.text = t('value.validation.textRequired');
            textRef.current?.focus();
            isValid = false;
        }
        if (!v.key || !/^#[0-9A-Fa-f]{6}$/i.test(v.key)) {
            errors.key = t('value.validation.colorKeyRequired'); // Nouvelle clé
            isValid = false;
        }
        setTextError(errors.text);
        setKeyError(errors.key);
        return isValid;
    };

    // Handlers
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setValue(prev => ({ ...prev, [name]: value.substring(0, 32) }));
        if (name === 'text') setTextError('');
    };

    const handleColorSelect = (hex: string, name: string) => {
        setValue(prev => ({ ...prev, key: hex, text: name || prev.text })); // Pré-remplir text si vide
        setKeyError('');
        if (!textError && (!v.text || v.text.trim().length < 1)) {
            setTextError(''); // Ne pas mettre d'erreur texte si on vient de sélectionner une couleur
        }
    };

    const handlePricingChange = (pricingData: Partial<ValueInterface>) => {
        setValue(prev => ({ ...prev, ...pricingData }));
    };

    const handleConfirm = () => {
        if (validateValue()) {
            onChange(v);
        }
    };


    return (
        // Utiliser flex flex-col gap-4 ou 5, padding
        <div className="color-info p-4 sm:p-6 flex flex-col gap-5">
            <div>
                <h3 className="block text-sm font-medium text-gray-700 mb-2">{t('value.selectColorLabel')}</h3>
                {/* Utiliser overflow-x-auto pour le scroll horizontal */}
                <div className="scroll overflow-x-auto p-2 pb-6 -mb-2"> {/* Padding négatif pour compenser scrollbar */}
                    {/* Utiliser flex gap-1.5 */}
                    <div className="colors flex flex-nowrap gap-1.5">
                        {Colors.map((c, groupIndex) => (
                            // Utiliser flex flex-col gap-1.5
                            <div key={groupIndex} className="group-color flex flex-col gap-1.5 flex-shrink-0">
                                {c.variants.map((variant) => (
                                    // Utiliser w-6 h-6 rounded-full border cursor-pointer hover:scale-110 transition
                                    <button
                                        type="button"
                                        key={variant.hex}
                                        className={`w-6 h-6 rounded-full border border-gray-300 cursor-pointer hover:scale-110 transition-transform duration-100 ${v.key === variant.hex ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`} // Indicateur sélection
                                        style={{ backgroundColor: variant.hex }}
                                        onClick={() => handleColorSelect(variant.hex, variant.name)}
                                        title={variant.name} // Tooltip avec nom couleur
                                    ></button>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
                {keyError && <p className="mt-1 text-xs text-red-600">{keyError}</p>}
            </div>

            {/* Nom de la couleur */}
            <div>
                <label className='text-sm font-medium text-gray-700 mb-1 flex justify-between items-center' htmlFor="feature-info-text-input">
                    <span>{t('value.colorNameLabel')} <IoPencil className="inline-block ml-1 w-3 h-3 text-gray-400" /></span>
                    <span className={`text-xs ${(v.text?.trim()?.length || 0) > 32 ? 'text-red-600' : 'text-gray-400'}`}>
                        {(v.text?.trim()?.length || 0)} / 32
                    </span>
                </label>
                {/* Input avec preview couleur */}
                <div className="relative">
                    {v.key && <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-gray-300 pointer-events-none" style={{ background: v.key }}></div>}
                    <input
                        ref={textRef}
                        id="feature-info-text-input"
                        name="text" // Important
                        className={`block w-full rounded-md shadow-sm sm:text-sm h-10 ${v.key ? 'pl-9' : 'pl-3'} pr-3 ${textError ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                        placeholder={t('value.colorNamePlaceholder')}
                        type="text"
                        value={v.text || ''}
                        onChange={handleInputChange}
                    />
                </div>
                {textError && <p className="mt-1 text-xs text-red-600">{textError}</p>}
            </div>

            {/* Prix et Stock */}
            <ValuePricing value={v} addToValue={handlePricingChange} />

            {/* Confirmation */}
            <Confirm
                cancel={t('common.cancel')}
                canConfirm={!textError && !keyError}
                onCancel={onCancel}
                confirm={t('common.ok')}
                onConfirm={handleConfirm} />
        </div>
    );
}

// --- Composant de Rendu Value Color ---
function ColorValue({ value, feature, onRemove, onClick }: { onClick?: () => void; onRemove?: () => void; value: ValueInterface; feature: Partial<FeatureInterface> }) {
    const { openChild } = useChildViewer();
    const { t } = useTranslation();

    return (
        // Utiliser flex, flex-col, items-center, gap, padding, rounded, border, hover, relative
        <div
            onClick={onClick}
            className="value-color relative flex flex-col items-center gap-1 p-1.5 rounded-lg border border-gray-200 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition group w-20" // Taille fixe comme Mini
            title={value.text || t('value.editOption')}
        >
            {/* Bouton Supprimer */}
            {onRemove && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        openChild(<ChildViewer>
                            <ConfirmDelete title={t('value.confirmDelete', { name: value.text || 'cette couleur' })} onCancel={() => openChild(null)} onDelete={() => { onRemove(); openChild(null); }} />
                        </ChildViewer>, { background: '#3455' });
                    }}
                    className="absolute -top-2 -right-2 z-10 w-6 h-6 flex items-center justify-center  rounded-full shadow bg-gray-200 text-gray-500 hover:bg-gray-300 "
                    title={t('common.delete')}
                >
                    <IoClose size={14} />
                </button>
            )}
            {/* Pastille de couleur */}
            <div
                className="color w-8 h-8 rounded-full border border-gray-300 shadow-inner"
                style={{ backgroundColor: value.key ?? '#ffffff' }} // Afficher la couleur
            ></div>
            {/* Texte */}
            <span className={`w-full text-xs text-center truncate ${value.text ? 'text-gray-700' : 'text-gray-400 italic'}`} title={value.text || t('value.emptyText')}>
                {value.text || `(${t('value.emptyText')})`}
            </span>
        </div>
    );
}