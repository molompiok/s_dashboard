// Components/FV_IconText_Info/FV_IconText_Info.tsx
// import './FV_IconText_Info.css'; // ❌ Supprimer

import { useRef, useState, useEffect } from 'react';
import { FeatureInterface, ValueInterface } from '../../Interfaces/Interfaces';
import { IoClose, IoCloudUploadOutline, IoPencil } from 'react-icons/io5';
import { getImg } from '../Utils/StringFormater';
import { useGlobalStore } from '../../pages/stores/StoreStore';
import { RiImageEditFill } from 'react-icons/ri';
import { Confirm } from '../Confirm/Confirm'; // Gardé
import { ValuePricing } from '../ValuePricing/ValuePricing'; // Gardé
import { useTranslation } from 'react-i18next'; // ✅ i18n
import { ChildViewer } from '../ChildViewer/ChildViewer';
import { ConfirmDelete } from '../Confirm/ConfirmDelete';
import { useChildViewer } from '../ChildViewer/useChildViewer';

export { FV_IconText_Info, IconTextValue, TextValue };

interface FVInfoProps {
    value: ValueInterface;
    feature: Partial<FeatureInterface>;
    onChange: (value: ValueInterface) => void;
    onCancel?: () => void;
}

function FV_IconText_Info({ value: initialValue, feature, onChange, onCancel }: FVInfoProps) {
    const { t } = useTranslation(); // ✅ i18n
    // État local pour le formulaire de la valeur
    const [v, setValue] = useState<ValueInterface>(initialValue);
    // Preview locale pour l'icône
    const [localIconPreview, setLocalIconPreview] = useState<string | undefined>(undefined);
    // Erreurs locales
    const textRef = useRef<HTMLInputElement>(null);
    const [textError, setTextError] = useState('');
    const [imageError, setImageError] = useState(''); // Pour l'icône si requise

    // Mettre à jour l'état si la prop initiale change
    useEffect(() => {
        setValue(initialValue);
        setLocalIconPreview(undefined); // Reset preview on prop change
        setTextError('');
        setImageError('');
    }, [initialValue]);

    // Validation locale (simplifiée, la validation métier est dans checkValidValue)
    const validateValue = (): boolean => {
        let isValid = true;
        const errors = { text: '', icon: '' };
        // Le texte est presque toujours requis pour ces types
        if (!v.text || v.text.trim().length < 1) {
            errors.text = t('value.validation.textRequired'); // Nouvelle clé
            textRef.current?.focus();
            isValid = false;
        }
        // L'icône peut être requise selon le type de feature
        const needsIcon = feature.type === 'icon' || feature.type === 'icon_text';
        if (needsIcon && (!v.icon || v.icon.length === 0) && !localIconPreview) {
            errors.icon = t('value.validation.iconRequired'); // Nouvelle clé
            isValid = false;
        }
        setTextError(errors.text);
        setImageError(errors.icon);
        return isValid;
    };

    // Handlers
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setValue(prev => ({ ...prev, [name]: value.substring(0, 32) })); // Limiter longueur
        if (name === 'text') setTextError('');
    };

    const handlePricingChange = (pricingData: Partial<ValueInterface>) => {
        setValue(prev => ({ ...prev, ...pricingData }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files?.[0]) return;
        const file = files[0];
        const previewUrl = URL.createObjectURL(file);

        setValue(prev => ({ ...prev, icon: [file] })); // Stocker File object
        setLocalIconPreview(previewUrl);
        setImageError('');

        // Révoquer ancienne preview
        if (localIconPreview) {
            setTimeout(() => URL.revokeObjectURL(localIconPreview), 100);
        }
        e.target.value = ''; // Reset input
    };

    const handleConfirm = () => {
        if (validateValue()) {
            onChange(v);
        }
    };

    // URL de l'icône à afficher (preview locale ou URL serveur)
    const iconUrl = localIconPreview ?? (typeof v.icon?.[0] === 'string' ? getImg(v.icon[0], 'contain', useGlobalStore.getState().currentStore?.url) : undefined);
    const showIconPlaceholder = !iconUrl;
    const showIconUpload = feature.type === 'icon' || feature.type === 'icon_text';


    return (
        // Utiliser flex flex-col gap-4 ou 5, padding
        <div className="icon-text-info p-4 sm:p-6 flex flex-col gap-5">
            {/* Section Icône (si type le requiert) */}
            {showIconUpload && (
                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1' htmlFor='icon-text-icon-input'>
                        {t('value.iconLabel')}
                    </label>
                    <label htmlFor='icon-text-icon-input' className={`relative block w-36 h-36 rounded-lg cursor-pointer overflow-hidden group bg-gray-100 border ${imageError ? 'border-red-500' : 'border-gray-300'} hover:bg-gray-200`}>
                        <div
                            className="absolute inset-0 bg-contain bg-center bg-no-repeat"
                            style={{ background: getImg(iconUrl) }}
                        ></div>
                        {showIconPlaceholder && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-blue-500 p-2 text-center">
                                <IoCloudUploadOutline size={32} />
                                <span className="mt-1 text-xs">{t('value.selectIconPrompt')}</span>
                            </div>
                        )}
                        {!showIconPlaceholder && (
                            <div className="absolute bottom-1 right-1 p-1.5 bg-white/70 backdrop-blur-sm rounded-full shadow text-gray-600 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                <RiImageEditFill size={16} />
                            </div>
                        )}
                        <input id='icon-text-icon-input' name="icon" type="file" accept='image/*' className="sr-only" onChange={handleFileChange} />
                    </label>
                    {imageError && <p className="mt-1 text-xs text-red-600">{imageError}</p>}
                </div>
            )}

            {/* Nom de l'option */}
            {(feature.type?.includes('text')) && ( // Afficher si type contient 'text'
                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1 flex justify-between items-center' htmlFor="icon-text-name-input">
                        <span>{t('value.nameLabel')} <IoPencil className="inline-block ml-1 w-3 h-3 text-gray-400" /></span>
                        <span className={`text-xs ${(v.text?.trim()?.length || 0) > 32 ? 'text-red-600' : 'text-gray-400'}`}>
                            {(v.text?.trim()?.length || 0)} / 32
                        </span>
                    </label>
                    <input
                        ref={textRef}
                        id="icon-text-name-input"
                        name="text" // Important
                        className={`block px-4 w-full rounded-md shadow-sm sm:text-sm h-10 ${textError ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                        placeholder={t('value.namePlaceholder')}
                        type="text"
                        value={v.text || ''}
                        onChange={handleInputChange}
                    />
                    {textError && <p className="mt-1 text-xs text-red-600">{textError}</p>}
                </div>
            )}

            {/* Prix et Stock */}
            <ValuePricing value={v} addToValue={handlePricingChange} />

            {/* Confirmation */}
            <Confirm
                canConfirm={!textError && !imageError} // Actif si pas d'erreurs locales
                onCancel={onCancel}
                confirm={t('common.ok')}
                onConfirm={handleConfirm} />
        </div>
    );
}

// --- Composants de Rendu des Valeurs (IconTextValue, TextValue) ---

function IconTextValue({ value, feature, onRemove, onClick }: { onClick?: () => void; onRemove?: () => void; value: ValueInterface; feature: Partial<FeatureInterface> }) {
    const icon = value.icon?.[0];
    const { currentStore } = useGlobalStore();
    const { openChild } = useChildViewer();
    const { t } = useTranslation();

    return (
        // Utiliser flex, flex-col, items-center, gap, padding, rounded, border, hover, relative
        <div
            onClick={onClick}
            className="value-icon-text relative flex flex-col items-center gap-1 p-1.5 rounded-lg border border-gray-200 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition group w-20" // Taille fixe
            title={value.text || t('value.editOption')} // 🌍 i18n
        >
            {/* Bouton Supprimer */}
            {onRemove && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        openChild(<ChildViewer>
                            <ConfirmDelete title={t('value.confirmDelete', { name: value.text || 'cette option' })} onCancel={() => openChild(null)} onDelete={() => { onRemove(); openChild(null); }} />
                        </ChildViewer>, { background: '#3455' });
                    }}
                    className="absolute -top-2 -right-2 z-10 w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded-full shadow hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title={t('common.delete')}
                >
                    <IoClose size={14} />
                </button>
            )}
            {/* Icône */}
            {(feature?.type?.includes('icon')) && (
                <div
                    className="icon-value w-12 h-12 rounded-md bg-contain bg-center bg-no-repeat bg-gray-100 mb-1" // Utiliser contain
                    style={{ background: getImg(icon, 'contain', currentStore?.url) || getImg('/res/empty/empty-image.jpg', 'contain') }} // Placeholder si pas d'icône
                ></div>
            )}
            {/* Texte */}
            {feature?.type?.includes('text') && (
                <span className={`w-full text-xs text-center truncate ${value.text ? 'text-gray-700' : 'text-gray-400 italic'}`} title={value.text || t('value.emptyText')}>
                    {value.text || `(${t('value.emptyText')})`}
                </span>
            )}
        </div>
    );
}

function TextValue({ value, feature, onRemove, onClick }: { onClick?: () => void; onRemove?: () => void; value: ValueInterface; feature: Partial<FeatureInterface> }) {
    const { openChild } = useChildViewer();
    const { t } = useTranslation();

    return (
        // Utiliser flex, items-center, gap, padding, rounded, border, hover, relative
        <div
            onClick={onClick}
            className="value-text relative inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full border border-gray-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition group min-w-[60px]" // min-w pour éviter trop petit
            title={value.text || t('value.editOption')}
        >
            <span className={`text-xs truncate ${value.text ? 'text-gray-800' : 'text-gray-400 italic'}`} title={value.text || t('value.emptyText')}>
                {value.text || `(${t('value.emptyText')})`}
            </span>
            {/* Bouton Supprimer */}
            {onRemove && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        openChild(<ChildViewer>
                            <ConfirmDelete title={t('value.confirmDelete', { name: value.text || 'cette option' })} onCancel={() => openChild(null)} onDelete={() => { onRemove(); openChild(null); }} />
                        </ChildViewer>, { background: '#3455' });
                    }}
                    className="flex items-center justify-center w-4 h-4 bg-gray-200 text-gray-500 rounded-full hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity ml-1" // Apparait au survol
                    title={t('common.delete')}
                >
                    <IoClose size={10} />
                </button>
            )}
        </div>
    );
}