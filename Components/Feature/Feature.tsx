import './Feature.css'
import { FeatureInterface, ValueInterface } from '../../Interfaces/Interfaces';
import { IoAdd, IoClose, IoEllipsisHorizontal, IoTrash } from 'react-icons/io5';
import { ClientCall } from '../Utils/functions';
import { useApp } from '../../renderer/AppStore/UseApp';
import { ChildViewer } from '../ChildViewer/ChildViewer';
import { FV_IconText_Info, IconTextValue, TextValue } from '../FV_IconText_Info/FV_IconText_Info';
import { ColorInfo, ColorValue } from '../FV_Color_Info/FV_Color_Info';
import { EDITED_DATA, NEW_ID_START } from '../Utils/constants';
import { ConfirmDelete } from '../Confirm/ConfirmDelete';

export { Feature,Value,getInfoPopup }

const VALUE_LIMIT = 7

function Feature({ feature, setFeature, onOpenRequired,onDelete }: {onDelete:()=>void, onOpenRequired?: (feature: Partial<FeatureInterface>) => void, setFeature: (cb: (feature: Partial<FeatureInterface> | undefined) => Partial<FeatureInterface> | undefined) => void, feature?: Partial<FeatureInterface> }) {
  const { openChild } = useApp()

  return <div className="feature">
    <div className="top">
      <h3 style={{ marginLeft: '24px' }}>{feature?.name} <span>( {feature?.type} )</span></h3>
      <IoEllipsisHorizontal className='icon-25 options' onClick={() => {
        feature && onOpenRequired?.(feature)
      }} />
      <IoTrash className='icon-25' onClick={() => {
        openChild(<ChildViewer>
          <ConfirmDelete title='Etez vous sur de vouloir supprimer cette variante' onCancel={() => {
            
            openChild(null);
          }} onDelete={()=>{
            onDelete();
            openChild(null);
          }} />
        </ChildViewer>, {
          background:'#3455'
        })
      }} />
    </div>
    <div className="list-values">
      {
        (feature?.values || [])?.map((v, i) => {
          return (
            <Value key={i} value={v} feature={feature as any} onRemove={() => {
              setFeature((current) => ({
                ...current,
                values: current?.values?.filter(_v => _v.id != v.id)
              }))
            }} onClick={() => {
              openChild(<ChildViewer>
                {
                  feature && getInfoPopup({
                    feature,
                    value: v,
                    onChange: (new_v) => {
                      (new_v as any)[EDITED_DATA] = EDITED_DATA
                      setFeature((current) => ({
                        ...current,
                        values: (current?.values || []).map(_v => (_v == new_v || _v.id == new_v.id) ? new_v : _v)
                      }));
                      openChild(null);
                    },
                    onCancel: () => {
                      openChild(null);
                    },
                  })
                }
              </ChildViewer>, {
                background: '#3455'
              })
            }} />
          )
        })
      }
      {
        (feature?.values?.length || 0) < VALUE_LIMIT && <div className="add-new" onClick={() => {
          openChild(<ChildViewer title={`Les Informations sur l'option la variante`}>
            {
              feature && getInfoPopup({
                feature,
                value: {
                  id: NEW_ID_START + ClientCall(Math.random, 0).toString(),
                  feature_id: feature?.id || '',
                  index: 1,
                  text: '',
                  continue_selling: false,
                  decreases_stock: true,
                  icon: [],
                  created_at: '',
                  updated_at: '',
                  views: [],
                },
                onChange: (new_v) => {
                  setFeature((current) => ({
                    ...current,
                    values: [...(current?.values || []), new_v]
                  }))
                  openChild(null)
                },
                onCancel: () => {
                  openChild(null);
                },
              })
            }
          </ChildViewer>, {
            background: '#3455'
          })
        }}>
          <IoAdd />
          <span>ajoutez ({(feature?.values?.length || 0)}/{VALUE_LIMIT})</span>
        </div>
      }
    </div>
  </div>
}



function Value({ value, feature, onRemove, onClick }: { onClick?: () => void, onRemove?: () => void, value: ValueInterface, feature: Partial<FeatureInterface> }) {

  const MapValues = {
    get icon_text() {
      return <IconTextValue feature={feature} value={value} onRemove={onRemove} onClick={onClick} />
    },
    get text() {
      return <TextValue feature={feature} value={value} onRemove={onRemove} onClick={onClick} />
    },
    get icon() {
      return <IconTextValue feature={feature} value={value} onRemove={onRemove} onClick={onClick} />
    },
    get color() {
      return <ColorValue feature={feature} value={value} onRemove={onRemove} onClick={onClick} />
    },

    get date() {
      return <IconTextValue feature={feature} value={value} onRemove={onRemove} onClick={onClick} />
    },
    get double_date() {
      return <IconTextValue feature={feature} value={value} onRemove={onRemove} onClick={onClick} />
    },
    get level() {
      return <IconTextValue feature={feature} value={value} onRemove={onRemove} onClick={onClick} />
    },
    get rang() {
      return <IconTextValue feature={feature} value={value} onRemove={onRemove} onClick={onClick} />
    },
    get input() {
      return <IconTextValue feature={feature} value={value} onRemove={onRemove} onClick={onClick} />
    },
    get file() {
      return <IconTextValue feature={feature} value={value} onRemove={onRemove} onClick={onClick} />
    }
  }
  return <div className="f-value">
    {(MapValues as any)[feature?.type || 'text'] || <IconTextValue feature={feature} value={value} />}
  </div>
}


function getInfoPopup({ value, feature, onChange, onCancel }: { feature: Partial<FeatureInterface>, onCancel?: () => void, value: ValueInterface, onChange: (value: ValueInterface) => void }) {
  const infos = {
    get icon_text() {
      return <FV_IconText_Info feature={feature} onChange={onChange} value={value} onCancel={onCancel} />
    },
    get icon() {
      return <FV_IconText_Info feature={feature} onChange={onChange} value={value} onCancel={onCancel} />
    },
    get text() {
      return <FV_IconText_Info feature={feature} onChange={onChange} value={value} onCancel={onCancel} />
    },
    get color() {
      return <ColorInfo feature={feature} onChange={onChange} value={value} onCancel={onCancel} />
    },

    get date() {
      return <FV_IconText_Info feature={feature} onChange={onChange} value={value} onCancel={onCancel} />
    },
    get double_date() {
      return <FV_IconText_Info feature={feature} onChange={onChange} value={value} onCancel={onCancel} />
    },
    get level() {
      return <FV_IconText_Info feature={feature} onChange={onChange} value={value} onCancel={onCancel} />
    },
    get rang() {
      return <FV_IconText_Info feature={feature} onChange={onChange} value={value} onCancel={onCancel} />
    },
    get input() {
      return <FV_IconText_Info feature={feature} onChange={onChange} value={value} onCancel={onCancel} />
    },
    get file() {
      return <FV_IconText_Info feature={feature} onChange={onChange} value={value} onCancel={onCancel} />
    }
  }
  return (infos as any)[feature.type || 'icon_text'];
}

// function DateValue({ value, onRemove, feature }: { feature: Partial<FeatureInterface>, onRemove?: () => void, value: ValueInterface }) {

//   return <div className="date-value"></div>
// }
// function ColorValue({ value, onRemove, feature }: { feature: Partial<FeatureInterface>, onRemove?: () => void, value: ValueInterface }) {

//   return <div className="color-value"></div>
// }
// function FileValue({ value, onRemove, feature }: { feature: Partial<FeatureInterface>, onRemove?: () => void, value: ValueInterface }) {

//   return <div className="file-value"></div>
// }
// function InputValue({ value, onRemove, feature }: { feature: Partial<FeatureInterface>, onRemove?: () => void, value: ValueInterface }) {

//   return <div className="input-value"></div>
// }
// function SlideValue({ value, onRemove, feature }: { feature: Partial<FeatureInterface>, onRemove?: () => void, value: ValueInterface }) {

//   return <div className="slide-value"></div>
// }

