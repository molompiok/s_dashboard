// Components/Feature/Feature.tsx

import { FeatureInterface, ValueInterface } from '../../api/Interfaces/Interfaces';
import { IoAdd, IoClose, IoEllipsisHorizontal, IoTrash } from 'react-icons/io5';
import { ClientCall, FeatureType } from '../Utils/functions';
import { IconTextValue, TextValue } from '../FV_IconText_Info/FV_Color_Info';
import { ColorValue } from '../FV_Color_Info/FV_Color_Info';

import { FeatureInfo } from '../FeatureInfo/FeatureInfo';
import { ConfirmDelete } from '../Confirm/ConfirmDelete';
import { useTranslation } from 'react-i18next'; // ✅ i18n

import { FV_IconText_Info } from '../FV_IconText_Info/FV_Color_Info';
import { ColorInfo } from '../FV_Color_Info/FV_Color_Info';
import logger from '../../api/Logger';
import { JSX, useMemo } from 'react';
import { ChildViewer } from '../ChildViewer/ChildViewer';
import { useChildViewer } from '../ChildViewer/useChildViewer';
import { ProductViews } from '../FV_ProductViews/FV_ProductViews';
// Importer d'autres formulaires Info ici (DateInfo, InputInfo, etc.)

export { Feature };

// Props du composant Feature
interface FeatureProps {
    feature: Partial<FeatureInterface>; // Utiliser Partial car peut être en cours de création
    setFeature: (cb: (current: Partial<FeatureInterface> | undefined) => Partial<FeatureInterface> | undefined) => void;
    onDelete: () => void; // Callback pour supprimer la feature du state parent
}

// Limite de valeurs par feature
const VALUE_LIMIT = 5;

function Feature({ feature, setFeature, onDelete }: FeatureProps) {
    const { t } = useTranslation(); // ✅ i18n
    const { openChild } = useChildViewer();

    // --- Handlers ---
    const handleValueChange = (updatedValue: ValueInterface) => {
        updatedValue._request_mode = 'edited';
        setFeature((current) => {
            return {
                ...current,
                values: (current?.values ?? []).map(_v => (_v.id === updatedValue.id) ? updatedValue : _v),
            };
        });
        openChild(null); // Fermer le popup
    };

    const handleValueCreate = (newValue: ValueInterface) => {
        newValue._request_mode = 'new'
        setFeature((current) => ({
            ...current,
            values: [...(current?.values ?? []), newValue],
        }));
        openChild(null);
    };

    const handleValueRemove = (valueIdToRemove: string) => {
        setFeature((current) => ({
            ...current,
            values: (current?.values ?? []).filter(_v => _v.id !== valueIdToRemove),
        }));
        openChild(null); // Fermer la popup de confirmation
    };

    const handleFeatureDelete = () => {
        openChild(<ChildViewer>
            <ConfirmDelete
                title={t('feature.confirmDelete', { name: feature?.name || 'cette variante' })}
                onCancel={() => openChild(null)}
                onDelete={() => {
                    onDelete(); // Appeler le callback parent pour supprimer du state global
                    openChild(null);
                }} />
        </ChildViewer>, { background: '#3455' });
    };

    const handleOpenFeatureSettings = () => {
        // Utiliser onOpenRequired ou ouvrir directement FeatureInfo si on internalise
        openChild(<ChildViewer title={t('feature.editTitle')}>
            <FeatureInfo
                feature={feature as FeatureInterface} // Passer la feature complète
                onChange={(updatedFeature) => {
                    updatedFeature._request_mode = 'edited'; // Marquer comme éditée
                    setFeature(() => updatedFeature); // Remplacer la feature dans l'état parent
                    openChild(null);
                }}
                onCancel={() => openChild(null)}
            />
        </ChildViewer>, { background: '#3455' });
        // ou onOpenRequired?.(feature)
    };

    const handleOpenValuePopup = (value?: ValueInterface) => {
        // Si pas de valeur, c'est une création
        const isCreating = !value;
        const valueData = value ?? {
            id: ClientCall(() => Date.now().toString(32) + Math.random().toString(32), 0), // ID temporaire
            feature_id: feature?.id || '',
            index: (feature?.values?.length ?? 0) + 1, // Index suivant
            text: '', // Valeurs par défaut
        };

        openChild(<ChildViewer title={isCreating ? t('value.createTitle') : t('value.editTitle')}>
            {(feature || undefined) && getInfoPopup({ // Utiliser getInfoPopup pour choisir le bon formulaire
                feature,
                value: valueData as ValueInterface,
                onChange: isCreating ? handleValueCreate : handleValueChange,
                onCancel: () => openChild(null),
            }) || undefined}
        </ChildViewer>, { background: '#3455' });
    };

    // Vérifier si on peut ajouter une valeur
    const canAddValue = (feature?.values?.length ?? 0) < VALUE_LIMIT;
    const hashIconAdd = ([FeatureType.COLOR, FeatureType.DATE, FeatureType.ICON, FeatureType.ICON_TEXT] satisfies FeatureType[]).includes(feature.type as any);

    return (
        // Conteneur Feature avec backdrop blur et transparence adaptée au mode sombre
        <div className="feature group relative  bg-white/20 dark:bg-gray-900/10 border border-white/30 dark:border-white/20 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-white/25 dark:hover:bg-gray-600/10">
            {/* En-tête Feature: Nom, Type, Actions */}
            <div className="top flex justify-between items-start mb-4 gap-3">
                <div className="flex-1 min-w-0">
                    {/* Titre principal */}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate mb-1">
                        {feature?.name || t('feature.untitled')} {/* 🌍 i18n */}
                    </h3>

                    {/* Métadonnées (type et requis) */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100/60 dark:bg-blue-700/20 text-blue-800 dark:text-blue-200 backdrop-blur-sm">
                            {t(`featureTypes.${feature?.type}`, feature?.type ?? '')} {/* 🌍 i18n */}
                        </span>
                        {feature?.required && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100/60 dark:bg-red-900/40 text-red-800 dark:text-red-200 backdrop-blur-sm">
                                * {t('common.required')}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                        onClick={handleOpenFeatureSettings}
                        className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-150"
                        title={t('feature.editSettings')} /* 🌍 i18n */
                    >
                        <IoEllipsisHorizontal className="w-5 h-5" />
                    </button>

                    {/* Bouton de suppression (seulement si pas par défaut) */}
                    {!feature?.is_default && (
                        <button
                            onClick={handleFeatureDelete}
                            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-all duration-150"
                            title={t('common.delete')}
                        >
                            <IoTrash className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Liste des Valeurs + Bouton Ajouter */}
            <div className="list-values flex flex-wrap gap-3 items-center">
                {(feature?.values ?? []).map((v) => (
                    // Le composant Value choisit le bon rendu
                    <Value
                        key={v.id}
                        value={v}
                        feature={feature as FeatureInterface} // Passer la feature typée
                        onRemove={() => handleValueRemove(v.id)} // Pas de suppression pour valeur de feature défaut?
                        onClick={() => handleOpenValuePopup(v)}
                    />
                ))}

                {/* Bouton Ajouter Valeur */}
                {canAddValue && (
                    <button
                        type="button"
                        onClick={() => handleOpenValuePopup()}
                        disabled={!canAddValue}
                        className={`add-new group/btn flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-400/50 dark:border-gray-500/50 text-gray-600 dark:text-gray-400 hover:border-blue-500/70 dark:hover:border-blue-400/70 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-all duration-200 backdrop-blur-sm ${hashIconAdd
                                ? 'w-18 h-18 sm:w-20 sm:h-20'
                                : 'h-10 px-4 flex-row gap-2'
                            }`}
                    >
                        <IoAdd className={`transition-transform duration-200 group-hover/btn:scale-110 ${hashIconAdd ? 'w-6 h-6 sm:w-7 sm:h-7 mb-1' : 'w-4 h-4'
                            }`} />
                        <span className={`font-medium transition-colors duration-200 ${hashIconAdd
                                ? 'text-[10px] sm:text-xs text-center leading-tight'
                                : 'text-sm'
                            }`}>
                            {hashIconAdd ? (
                                <>
                                    <div>{t('value.add')}</div>
                                    <div className="text-gray-500 dark:text-gray-400">
                                        ({feature?.values?.length ?? 0}/{VALUE_LIMIT})
                                    </div>
                                </>
                            ) : (
                                `${t('value.add')} (${feature?.values?.length ?? 0}/${VALUE_LIMIT})`
                            )}
                        </span>
                    </button>
                )}

                {/* Indicateur de limite atteinte */}
                {!canAddValue && (
                    <div className={`flex items-center justify-center rounded-xl border-2 border-dashed border-gray-300/50 dark:border-gray-600/50 bg-gray-50/30 dark:bg-gray-800/30 backdrop-blur-sm ${hashIconAdd ? 'w-18 h-18 sm:w-20 sm:h-20' : 'h-10 px-4'
                        }`}>
                        <span className="text-xs text-gray-500 dark:text-gray-400 text-center font-medium">
                            {t('value.limitReached', { limit: VALUE_LIMIT })}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
// --- Composant interne Value (Dispatcher) ---
export function Value({ value, feature, onRemove, onClick }: { onClick?: () => void, onRemove?: () => void, value: ValueInterface, feature: FeatureInterface }) {
    // Choisir le composant de rendu basé sur feature.type
    const ValueComponent = useMemo(() => {
        if (feature.is_default) return ProductViews
        switch (feature.type) {
            case FeatureType.ICON_TEXT:
            case FeatureType.ICON:
                return IconTextValue;
            case FeatureType.TEXT:
                return TextValue;
            case FeatureType.COLOR:
                return ColorValue;
            // TODO: Ajouter les cas pour DATE, INPUT, FILE, etc.
            default:
                logger.warn(`Unsupported feature type for Value component: ${feature.type}`);
                return TextValue; // Fallback sur TextValue?
        }
    }, [feature.type]);

    return (
        <div className="f-value"> {/* Conteneur optionnel */}
            <ValueComponent value={value} feature={feature} onRemove={onRemove} onClick={onClick} />
        </div>
    );
}

export function getInfoPopup({ value, feature, onChange, onCancel }: {
    feature: Partial<FeatureInterface>,
    onCancel?: () => void,
    value: ValueInterface,
    onChange: (value: ValueInterface) => void
}): JSX.Element | null {
    if (feature.is_default) return <FV_IconText_Info feature={{...feature, type:'text'}} onChange={onChange} value={value} onCancel={onCancel} />;
    switch (feature.type) {
        case FeatureType.ICON_TEXT:
        case FeatureType.ICON:
        case FeatureType.TEXT:
            // TODO: Ajouter cas INPUT, FILE, etc. qui utilisent potentiellement FV_IconText_Info ou un autre
            return <FV_IconText_Info feature={feature} onChange={onChange} value={value} onCancel={onCancel} />;
        case FeatureType.COLOR:
            return <ColorInfo feature={feature} onChange={onChange} value={value} onCancel={onCancel} />;
        // TODO: Ajouter cas DATE, DOUBLE_DATE, LEVEL, RANGE
        // case FeatureType.DATE:
        //   return <DateInfo ... />
        default:
            logger.warn(`No specific info popup defined for feature type: ${feature.type}`);
            // Retourner un formulaire générique ou null? Pour l'instant IconText.
            return <FV_IconText_Info feature={feature} onChange={onChange} value={value} onCancel={onCancel} />;
    }
}