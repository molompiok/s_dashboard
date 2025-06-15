// Components/FV_IconText_Info/FV_IconText_Info.tsx

import { useRef, useState, useEffect } from 'react';
import { FeatureInterface, ValueInterface } from '../../api/Interfaces/Interfaces';
import { IoClose, IoCloudUploadOutline, IoPencil } from 'react-icons/io5';
import { getMedia } from '../Utils/StringFormater';
import { useGlobalStore } from '../../api/stores/StoreStore';
import { RiImageEditFill } from 'react-icons/ri';
import { Confirm } from '../Confirm/Confirm'; // Gardé
import { ValuePricing } from '../ValuePricing/ValuePricing'; // Gardé
import { useTranslation } from 'react-i18next'; // ✅ i18n
import { ChildViewer } from '../ChildViewer/ChildViewer';
import { ConfirmDelete } from '../Confirm/ConfirmDelete';
import { useChildViewer } from '../ChildViewer/useChildViewer';
import { ImageItem, ImageManager } from '../ImageManager/ImageManager';

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

    const imageItems: ImageItem[] = feature.is_default
        ? (v.views || []).map(w => ({
            id: typeof w == 'string' ? w : w.size + w.type + (w as File).name + (w as File).lastModified,
            source: w as string
        }))
        : []


    const handleImagesChange = (newImages: ImageItem[]) => {
        setValue(prev => ({ ...prev, views: newImages.map(i => i.source) }));
    };

    // URL de l'icône à afficher (preview locale ou URL serveur)
    const iconUrl = localIconPreview ? getMedia({ isBackground: true, source: localIconPreview }) : getMedia({ isBackground: true, source: v.icon?.[0], size: 'contain', from: 'api' });
    const showIconPlaceholder = !iconUrl;
    const showIconUpload = !feature.is_default && (feature.type === 'icon' || feature.type === 'icon_text');
    const showProductViews = !!feature.is_default

    return (
        <div className="icon-text-info p-4 sm:p-6 flex flex-col gap-6 bg-white/5 dark:bg-white/5 backdrop-blur-sm rounded-lg">
            {/* Section Icône (si type le requiert) */}
            {
                showProductViews && <ImageManager images={imageItems} onImagesChange={handleImagesChange} />
            }
            {showIconUpload && (
                <div className="space-y-2">
                    <label className='block text-sm font-semibold text-gray-800 dark:text-gray-200' htmlFor='icon-text-icon-input'>
                        {t('value.iconLabel')}
                    </label>
                    <label
                        htmlFor='icon-text-icon-input'
                        className={`relative block w-40 h-40 rounded-xl cursor-pointer overflow-hidden group transition-all duration-200 ${imageError
                                ? 'border-2 border-red-500 dark:border-red-400 bg-red-50/50 dark:bg-red-900/20'
                                : 'border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/20'
                            } backdrop-blur-sm`}
                    >
                        <div
                            className="absolute inset-0 bg-contain bg-center bg-no-repeat transition-opacity duration-200"
                            style={{ background: iconUrl }}
                        ></div>

                        {showIconPlaceholder && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 p-4 text-center transition-colors duration-200">
                                <IoCloudUploadOutline className="w-10 h-10 mb-2" />
                                <span className="text-sm font-medium">{t('value.selectIconPrompt')}</span>
                            </div>
                        )}

                        {!showIconPlaceholder && (
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 dark:group-hover:bg-black/40 transition-colors duration-200 flex items-end justify-end p-2">
                                <div className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                                    <RiImageEditFill className="w-5 h-5" />
                                </div>
                            </div>
                        )}

                        <input
                            id='icon-text-icon-input'
                            name="icon"
                            type="file"
                            accept='image/*'
                            className="sr-only"
                            onChange={handleFileChange}
                        />
                    </label>
                    {imageError && (
                        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-900/20 px-3 py-1 rounded-md backdrop-blur-sm">
                            {imageError}
                        </p>
                    )}
                </div>
            )}

            {/* Nom de l'option */}
            {(feature.type?.includes('text')) && (
                <div className="space-y-2">
                    <label className='text-sm font-semibold text-gray-800 dark:text-gray-200 flex justify-between items-center' htmlFor="icon-text-name-input">
                        <span className="flex items-center gap-2">
                            {t('value.nameLabel')}
                            <IoPencil className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full backdrop-blur-sm ${(v.text?.trim()?.length || 0) > 32
                                ? 'text-red-700 dark:text-red-300 bg-red-100/60 dark:bg-red-900/30'
                                : 'text-gray-600 dark:text-gray-400 bg-gray-100/60 dark:bg-gray-800/40'
                            }`}>
                            {(v.text?.trim()?.length || 0)} / 32
                        </span>
                    </label>
                    <div className="relative">
                        <input
                            ref={textRef}
                            id="icon-text-name-input"
                            name="text"
                            className={`block w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${textError
                                    ? 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30'
                                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30'
                                } focus:outline-none`}
                            placeholder={t('value.namePlaceholder')}
                            type="text"
                            value={v.text || ''}
                            onChange={handleInputChange}
                        />
                    </div>
                    {textError && (
                        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-900/20 px-3 py-1 rounded-md backdrop-blur-sm">
                            {textError}
                        </p>
                    )}
                </div>
            )}

            {/* Prix et Stock */}
            <div className="p-2 ">
                <ValuePricing value={v} addToValue={handlePricingChange} />
            </div>

            {/* Confirmation */}
            <div className="">
                <Confirm
                    canConfirm={!textError && !imageError}
                    onCancel={onCancel}
                    confirm={t('common.ok')}
                    onConfirm={handleConfirm}
                />
            </div>
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
        <div
            onClick={onClick}
            className="value-icon-text relative group flex flex-col items-center gap-2 p-1 rounded-xl border-2 border-gray-100/30 dark:border-gray-300/20 cursor-pointer transition-all duration-200  dark:bg-gray-900/10 backdrop-blur-sm hover:bg-white/30 dark:hover:bg-gray-600/10 hover:border-blue-400/60 dark:hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/20 dark:hover:shadow-blue-400/10"
            title={value.text || t('value.editOption')}
        >
            {/* Bouton Supprimer */}
            {onRemove && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        openChild(<ChildViewer>
                            <ConfirmDelete
                                title={t('value.confirmDelete', { name: value.text || 'cette option' })}
                                onCancel={() => openChild(null)}
                                onDelete={() => { onRemove(); openChild(null); }}
                            />
                        </ChildViewer>, { background: '#3455' });
                    }}
                    className="absolute -top-2 -right-2 z-10 w-6 h-6 flex items-center justify-center bg-red-500 dark:bg-red-600 text-white rounded-full shadow-lg hover:bg-red-600 dark:hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-75 group-hover:scale-100 backdrop-blur-sm"
                    title={t('common.delete')}
                >
                    <IoClose className="w-3.5 h-3.5" />
                </button>
            )}

            {/* Icône */}
            {(feature?.type?.includes('icon')) && (
                <div
                    className="icon-value w-18 h-18 rounded-lg bg-contain bg-center bg-no-repeat bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm group-hover:scale-105 transition-transform duration-200"
                    style={{
                        background: getMedia({ isBackground: true, source: icon, size: 'contain', from: 'api' }) ||
                            getMedia({ isBackground: true, source: '/res/empty/empty-image.jpg', size: 'contain' })
                    }}
                ></div>
            )}

            {/* Texte */}
            {feature?.type?.includes('text') && (
                <div className="w-full px-1">
                    <span className={`block text-xs text-center truncate transition-colors duration-200 ${value.text
                            ? 'text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-gray-100'
                            : 'text-gray-500 dark:text-gray-400 italic'
                        }`} title={value.text || t('value.emptyText')}>
                        {value.text || `(${t('value.emptyText')})`}
                    </span>
                </div>
            )}
        </div>
    );
}

function TextValue({ value, feature, onRemove, onClick }: { onClick?: () => void; onRemove?: () => void; value: ValueInterface; feature: Partial<FeatureInterface> }) {
    const { openChild } = useChildViewer();
    const { t } = useTranslation();

    return (
        <div
            onClick={onClick}
            className="value-text relative group inline-flex items-center gap-2 pl-4 pr-2 py-2 rounded-full border-2 border-white/30 dark:border-white/20 cursor-pointer transition-all duration-200 min-w-[80px] bg-white/25 dark:bg-white/15 backdrop-blur-sm hover:bg-white/35 dark:hover: hover:border-blue-400/60 dark:hover:border-blue-400/50 hover:shadow-md hover:shadow-blue-500/20 dark:hover:shadow-blue-400/10"
            title={value.text || t('value.editOption')}
        >
            <span className={`text-sm truncate font-medium transition-colors duration-200 ${value.text
                    ? 'text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-gray-100'
                    : 'text-gray-500 dark:text-gray-400 italic'
                }`} title={value.text || t('value.emptyText')}>
                {value.text || `(${t('value.emptyText')})`}
            </span>

            {/* Bouton Supprimer */}
            {onRemove && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        openChild(<ChildViewer>
                            <ConfirmDelete
                                title={t('value.confirmDelete', { name: value.text || 'cette option' })}
                                onCancel={() => openChild(null)}
                                onDelete={() => { onRemove(); openChild(null); }}
                            />
                        </ChildViewer>, { background: '#3455' });
                    }}
                    className="flex items-center justify-center w-5 h-5 bg-white/60 dark:bg-gray-700/60 text-gray-600 dark:text-gray-400 rounded-full hover:bg-red-500 dark:hover:bg-red-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-75 group-hover:scale-100 backdrop-blur-sm shadow-sm"
                    title={t('common.delete')}
                >
                    <IoClose className="w-3 h-3" />
                </button>
            )}
        </div>
    );
}