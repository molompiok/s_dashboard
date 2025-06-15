import { FeatureInterface, ValueInterface } from '../../api/Interfaces/Interfaces';
import { IoClose } from 'react-icons/io5';
import { useTranslation } from 'react-i18next'; // ✅ i18n
import { ChildViewer } from '../ChildViewer/ChildViewer'; // Pour popup delete
import { ConfirmDelete } from '../Confirm/ConfirmDelete'; // Pour popup delete
import { useChildViewer } from '../ChildViewer/useChildViewer';
import { getFileType } from '../Utils/functions';
import { getMedia } from '../Utils/StringFormater';


import "./_FV_ProductViews.css";

export { ProductViews };


// --- Composant de Rendu Value Color ---
function ProductViews({ value, feature, onRemove, onClick }: { onClick?: () => void; onRemove?: () => void; value: ValueInterface; feature: Partial<FeatureInterface> }) {
    const { openChild } = useChildViewer();
    const { t } = useTranslation();
    const v = value;
    console.log('%%%%%%%%%%%%%==> ', v);

    return (
        <div className='product-views-ctn w-[90px] h-[90px] pt-8 p-2'>
            <div
                className="product-views relative flex flex-col items-center gap-1 p-1.5 rounded-lg cursor-pointer transition hover:scale-105"
                onClick={onClick}
            >
                {
                    v.views?.slice(0, 3).reverse().map(((i, _) => (
                        getFileType(i) == 'image' ?
                            <div key={_} className={`img_${(v.views?.length == 1) ? '' : _}`} style={{
                                background: getMedia({ isBackground: true, source: i, from: 'api' })
                            }}></div>
                            : <video className={`img_${_}`} key={_} muted={true} src={getMedia({ source: i, from: 'api' })} />
                    )))
                }
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        openChild(<ChildViewer>
                            <ConfirmDelete title={t('value.confirmDelete', { name: value.text || 'cette couleur' })} onCancel={() => openChild(null)} onDelete={() => { onRemove?.(); openChild(null); }} />
                        </ChildViewer>, { background: '#3455' });
                    }}
                    className="absolute -top-5 scale-80 -right-2 z-10 w-6 h-6 flex items-center justify-center bg-gray-200 text-gray-500 rounded-full shadow hover:bg-gray-300  transition-opacity"
                    title={t('common.delete')}
                >
                    <IoClose size={14} />
                </button>
            </div>
        </div>
    );
}