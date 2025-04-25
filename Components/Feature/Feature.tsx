// Components/Feature/Feature.tsx
// import './Feature.css'; // ❌ Supprimer

import { FeatureInterface, ValueInterface } from '../../Interfaces/Interfaces';
import { IoAdd, IoClose, IoEllipsisHorizontal, IoTrash } from 'react-icons/io5';
import { ClientCall, FeatureType } from '../Utils/functions';
// import { useApp } from '../../renderer/AppStore/UseApp'; // Remplacé par useChildViewer
// Importer les différents rendus de Value
import { IconTextValue, TextValue } from '../FV_IconText_Info/FV_IconText_Info';
import { ColorValue } from '../FV_Color_Info/FV_Color_Info';
// Importer le popup d'édition de Feature et le popup d'édition/création de Value
import { FeatureInfo } from '../FeatureInfo/FeatureInfo';
import { ConfirmDelete } from '../Confirm/ConfirmDelete';
import { useTranslation } from 'react-i18next'; // ✅ i18n

export { Feature };

// Props du composant Feature
interface FeatureProps {
    feature: Partial<FeatureInterface>; // Utiliser Partial car peut être en cours de création
    setFeature: (cb: (current: Partial<FeatureInterface> | undefined) => Partial<FeatureInterface> | undefined) => void;
    onOpenRequired?: (feature: Partial<FeatureInterface>) => void; // Gardé si besoin externe
    onDelete: () => void; // Callback pour supprimer la feature du state parent
}

// Limite de valeurs par feature
const VALUE_LIMIT = 7;

function Feature({ feature, setFeature, onOpenRequired, onDelete }: FeatureProps) {
    const { t } = useTranslation(); // ✅ i18n
    const { openChild } = useChildViewer();

    // --- Handlers ---
    const handleValueChange = (newValue: ValueInterface) => {
        // Marquer la valeur et la feature comme éditées
        newValue._request_mode = 'edited';
        setFeature((current) => {
             const updatedValues = (current?.values ?? []).map(_v => (_v.id === newValue.id) ? newValue : _v);
             // Vérifier si la valeur existait déjà pour éviter de marquer la feature si juste une valeur change
             const valueExisted = current?.values?.some(v => v.id === newValue.id);
             return {
                 ...current,
                 values: updatedValues,
                  // Marquer la feature seulement si la valeur n'existait pas? Non, toujours marquer.
                 _request_mode: 'edited'
             };
         });
        openChild(null); // Fermer le popup
    };

     const handleValueCreate = (newValue: ValueInterface) => {
         // Ajouter la nouvelle valeur et marquer la feature comme éditée
         setFeature((current) => ({
             ...current,
             values: [...(current?.values ?? []), newValue],
             _request_mode: 'edited'
         }));
         openChild(null);
    };

    const handleValueRemove = (valueIdToRemove: string) => {
        setFeature((current) => ({
            ...current,
            values: (current?.values ?? []).filter(_v => _v.id !== valueIdToRemove),
            _request_mode: 'edited' // Marquer comme édité après suppression
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
                      updatedFeature._request_mode= 'edited'; // Marquer comme éditée
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
             id:  ClientCall(()=>Date.now().toString(32)+Math.random().toString(32),0), // ID temporaire
             feature_id: feature?.id || '',
             index: (feature?.values?.length ?? 0) + 1, // Index suivant
             text: '', // Valeurs par défaut
         };

        openChild(<ChildViewer title={isCreating ? t('value.createTitle') : t('value.editTitle')}> 
             {(feature||undefined) && getInfoPopup({ // Utiliser getInfoPopup pour choisir le bon formulaire
                 feature,
                 value: valueData as ValueInterface,
                 onChange: isCreating ? handleValueCreate : handleValueChange,
                 onCancel: () => openChild(null),
             })||undefined}
         </ChildViewer>, { background: '#3455' });
    };

    // Vérifier si on peut ajouter une valeur
    const canAddValue = (feature?.values?.length ?? 0) < VALUE_LIMIT;

    return (
        // Conteneur Feature : bordure, padding, rounded, etc.
        <div className="feature border border-gray-200 rounded-lg p-3 bg-white/50">
            {/* En-tête Feature: Nom, Type, Actions */}
            <div className="top flex justify-between items-center mb-3 flex-wrap gap-2">
                {/* Utiliser text-base font-medium */}
                <h3 className="text-base font-medium text-gray-800 m-0">
                    {feature?.name || t('feature.untitled')} {/* 🌍 i18n */}
                     {/* Afficher type et requis de manière discrète */}
                    <span className="ml-2 text-xs font-normal text-gray-500">
                        ({t(`featureTypes.${feature?.type}`, feature?.type ?? '')}) {/* 🌍 i18n */}
                        {feature?.required && <span className="ml-1 text-red-500 font-medium">* {t('common.required')}</span>} 
                    </span>
                </h3>
                <div className="flex items-center gap-2">
                    <button onClick={handleOpenFeatureSettings} className="p-1 text-gray-400 hover:text-gray-600" title={t('feature.editSettings')}> {/* 🌍 i18n */}
                        <IoEllipsisHorizontal className='icon-25' />
                    </button>
                     {/* Ne pas permettre suppression de la feature par défaut */}
                     {!feature?.is_default && (
                         <button onClick={handleFeatureDelete} className="p-1 text-gray-400 hover:text-red-600" title={t('common.delete')}> 
                             <IoTrash className='icon-25' />
                         </button>
                     )}
                </div>
            </div>

            {/* Liste des Valeurs + Bouton Ajouter */}
             {/* Utiliser flex flex-wrap gap-2 */}
            <div className="list-values flex flex-wrap gap-2 items-start">
                {(feature?.values ?? []).map((v) => (
                    // Le composant Value choisit le bon rendu
                    <Value
                        key={v.id}
                        value={v}
                        feature={feature as FeatureInterface} // Passer la feature typée
                         onRemove={feature?.is_default ? undefined : () => handleValueRemove(v.id)} // Pas de suppression pour valeur de feature défaut?
                         onClick={() => handleOpenValuePopup(v)}
                    />
                ))}

                {/* Bouton Ajouter Valeur */}
                {canAddValue && (
                     <button
                         type="button"
                         onClick={() => handleOpenValuePopup()}
                         disabled={!canAddValue}
                         className={`add-new flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                     >
                         <IoAdd className='w-6 h-6 sm:w-8 sm:h-8' />
                         <span className='text-[10px] sm:text-xs font-medium whitespace-nowrap mt-1'>
                             {t('value.add')} ({feature?.values?.length ?? 0}/{VALUE_LIMIT})
                         </span>
                     </button>
                )}
                {!canAddValue && (
                     <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
                         <span className="text-[10px] text-gray-400 px-1 text-center">{t('value.limitReached', { limit: VALUE_LIMIT })}</span> 
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

// --- Fonction Utilitaire getInfoPopup --- (à mettre dans FeatureUtils.ts?)
import { FV_IconText_Info } from '../FV_IconText_Info/FV_IconText_Info';
import { ColorInfo } from '../FV_Color_Info/FV_Color_Info';
import logger from '../../api/Logger';
import { JSX, useMemo } from 'react';
import { useApp } from '../../renderer/AppStore/UseApp';
import { ChildViewer } from '../ChildViewer/ChildViewer';
import { useChildViewer } from '../ChildViewer/useChildViewer';
// Importer d'autres formulaires Info ici (DateInfo, InputInfo, etc.)

export function getInfoPopup({ value, feature, onChange, onCancel }: {
    feature: Partial<FeatureInterface>,
    onCancel?: () => void,
    value: ValueInterface,
    onChange: (value: ValueInterface) => void
}): JSX.Element | null {

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