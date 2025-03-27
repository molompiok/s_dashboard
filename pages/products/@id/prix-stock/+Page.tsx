import { useEffect, useState } from "react"
import './+Page.css'
import { getInfoPopup, Value } from "../../../../Components/Feature/Feature"
import { getAllCombinations } from "../../../../Components/Utils/functions"
import { FeatureInterface, ProductInterface, ValueInterface } from "../../../../Interfaces/Interfaces"
import { useProductStore } from "../../ProductStore"
import { usePageContext } from "../../../../renderer/usePageContext"
import { useStore } from "../../../stores/StoreStore"
import { IoCheckmark } from "react-icons/io5"
import { useApp } from "../../../../renderer/AppStore/UseApp"
import { ChildViewer } from "../../../../Components/ChildViewer/ChildViewer"
import { features } from "process"
import { ValuePricing } from "../../../../Components/ValuePricing/ValuePricing"
import { Comfirm } from "../../../../Components/Confirm/Confirm"

export { Page }
function Page() {
  const { fetchProductBy, updateProduct } = useProductStore();
  const { routeParams } = usePageContext()
  const [product, setProduct] = useState<Partial<ProductInterface>>()
  const { currentStore } = useStore();
  const [filter, setFilter] = useState<Record<string, string[]>>({})
  const [s] = useState({
    init: false,
    features:[] as any[]
  })

  

  const resetProduct = (id: string) => {
    if (!currentStore) return;
    fetchProductBy({ product_id: routeParams.id }).then(res => {
      if (!res?.id) return
      s.init = true;
      s.features = res?.features || [];
      setProduct(res)
    })
  }
  useEffect(() => {
    !s.init && resetProduct(routeParams.id)
  }, [currentStore])

  const saveRequired = async () => {
    try {
      if (!product) return;
      const res = await updateProduct(product, s?.features || [])
      setTimeout(() => {
        console.log('Save Value Button ', res);
        if (!res?.id) return;
        resetProduct(res.id)
        console.log('reset value  Product  ', res);
      }, 1000);
    } catch (error) { }
  }

  return <div className="bind-product">
    {
      product?.features?.map(f => {

        return (f.values?.length || 0) > 0 && <div className="bind-feature">
          <h3>{f.name}</h3>
          <div className="bind-feature-values">
            {
              f.values?.map(v => (
                <div className={"checkable no-selectable " + (filter[f.id]?.includes(v.id) ? 'ok' : '')} onClick={() => {
                  console.log('click', filter);

                  setFilter((current) => ({
                    ...current,
                    [f.id]: current[f.id]?.includes(v.id) ? current[f.id]?.filter(id => id !== v.id) : [...(current[f.id] || []), v.id]
                  }))
                }}>
                  <div className="check" ><IoCheckmark className="mark" /></div>
                  <Value feature={f} value={v} />
                </div>
              ))
            }
          </div>

        </div>
      })
    }
    {
      product && getAllCombinations(product as any).filter(c => {
        for (const f_id of Object.keys(filter)) {
          // return true;
          if (!filter[f_id]?.includes(c.bind[f_id])) { return false }
        }
        return true
      }).map(bind => (
        <div className="bind">
          <div className="bind-rows">{Object.keys(bind.bind).map((f_id: string) => {
            const f = product?.features?.find(f => f.id == f_id)
            const v = f?.values?.find(v => v.id == bind.bind[f_id])
            // const isDefaultFeature = product.default_feature_id == f?.id;
            return v && f && <ValueRow feature={f} saveRequired={saveRequired} value={v}/>
          })}</div>
          <div className="rt price"><b>Prix de base</b><span style={{ whiteSpace: 'nowrap' }}>{product?.price} {'FCFA'}</span></div>
          <div className="rt price"><b>Prix total du produit </b><span style={{ whiteSpace: 'nowrap' }}>{(product?.price || 0) + (bind.additional_price || 0)} {'FCFA'}</span></div>
          <div className={" rt stock" + (bind.stock ?? 'no')}><b>Stock </b><span>{bind.stock ?? 'illimité'}</span></div>
          <div className="rt decreases_stock"><b>diminu le stock </b><span className={"check " + (bind.decreases_stock ?? 'no')}></span></div>
          <div className="rt continue_selling"><b>Vendre sans stock </b><span className={"check " + ((bind.decreases_stock && bind.continue_selling) ?? 'no')}></span></div>
        </div>
      ))
    }
  </div>
}

function ValueRow({feature:f,value:crurent_v,saveRequired}:{saveRequired:()=>void,feature:FeatureInterface,value:ValueInterface}) {
  const {openChild} = useApp()
  const [dynamic_value ,setV] = useState(crurent_v)
  console.log(dynamic_value);
  
  return <div className="bind-row" onClick={() => {
    openChild(<ChildViewer title={`Les Informations sur l'option la variante`}>
      <div className="pricing">
      {
        <ValuePricing addToValue={(_v)=>{
          const d = {...dynamic_value,..._v}
          // console.log('add to value',d);
          
          setV(d);
        }} value={dynamic_value}/>
      }
      <Comfirm canConfirm={ true } onCancel={()=>{
         openChild(null)
      }} confirm='enrgistrer' onConfirm={() => {
        f.values = f.values?.map(_v=>_v.id == crurent_v.id?{...crurent_v,...dynamic_value}:_v);
        saveRequired();
        openChild(null)
      }} />
      </div>
    </ChildViewer>, {
      background: '#3455'
    })
  }}>
    <div className="bind-cell-feature ellipsis">{f.name}</div>
    <div className="bind-cell-value"><Value feature={f} value={crurent_v} /></div>
    <div className="bind-column">
      <div className="bind-cell-price">
        <span>+{crurent_v.additional_price || 0}</span>
        <div>FCFA</div>
      </div>
      <div className={"bind-cell-stock " + (crurent_v?.stock ?? 'no')}>
        <span>{crurent_v?.stock ?? 'illimité'}</span>
        <div>stock</div>
      </div>
    </div>
  </div>
}