import { IoPencil } from 'react-icons/io5'
import './+Page.css'
import { CategoryItem } from '../../../Components/CategoryItem/CategoryItem'
import { CommandeList } from '../../../Components/CommandesList/CommandesList'
import { useEffect, useState } from 'react'
import { Topbar } from '../../../Components/TopBar/TopBar'
import { SwiperProducts } from '../../../Components/Swipers/SwiperProducts'
import { images as imgs } from "./images";
import { HoriszontalSwiper } from '../../../Components/Swipers/HoriszontalSwiper'
import { FeatureValueInterface } from '../../../Interfaces/Interfaces'
import { NEW_VIEW } from '../../../Components/Utils/constants'


//TODO add markdon dans la description du produit?
export function Page() {
  // const [currentValue, setCurrentValue] = useState<FeatureValueInterface>();
  const [values, setValues] = useState<FeatureValueInterface[]>(imgs as any);
  const [index, setindex] = useState(0);

  const clearValues = () => {
    return [...values].map(val => ({ ...val, views: (val.views || []).filter(view => view != NEW_VIEW) })).filter(val => val.views && val.views.length > 0);
  }

  useEffect(() => {
    const vs = clearValues();
    // setCurrentValue(vs[index]);
    setValues(vs)
  }, [index])

  // console.log({ values, index });


  return <div className="product">
    <Topbar back={true} />
    <div className="views no-selectable">
      <SwiperProducts views={values[index]?.views || []} setViews={(localViews) => {

        if (values[index] == undefined) {
          values[index] = {
            views: localViews
          } as any as FeatureValueInterface
        } else {
          values[index].views = localViews;
        }
        const vs = clearValues();
        setValues(vs)
      }} />
    </div>
    <div className="image-manager no-selectable">
      <HoriszontalSwiper values={clearValues() as any} onActiveIndexChange={(_index) => {
        setindex(_index)
      }} onDeleteValue={()=>{
        // setCurrentValue(vs[index]);
        setValues([
          ...values.slice(0,index),
          ...values.slice(index+1)
        ])
      }} forward={()=>{
        const nextValue = values[index+1];
        if(!nextValue || (nextValue.views.length == 0) || (nextValue.views.length == 1 && nextValue.views[0] ==NEW_VIEW )) return false;
        const currentvalue = values[index];
        setValues(values.map((v,i)=>i==index?nextValue:i==index+1?currentvalue:v));
        return true;
      }}goBack={()=>{
        const lastValue = values[index-1];
        if(!lastValue || (lastValue.views.length == 0) || (lastValue.views.length == 1 && lastValue.views[0] ==NEW_VIEW )) return false;
        const currentvalue = values[index];
        setValues(values.map((v,i)=>i==index?lastValue:i==index-1?currentvalue:v));
      return true;
      }} />
    </div>

    <h3>Nom du Produit <IoPencil /></h3>
    <h1>{'Montre pour enfant'}</h1>
    <h3>Decription <IoPencil /></h3>
    <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Eaque pariatur numquam nulla error recusandae alias quo possimus, et laboriosam quia dolores maxime explicabo ad rerum eum eveniet, cumque, est assumenda.</p>

    <h3>Prix<IoPencil /></h3>
    <h1>{'239 045 FCFA'}</h1>
    <h3>Category Parent</h3>
    <CategoryItem category={{} as any} />
    <h3>Options du Produits</h3>

    <CommandeList />
  </div>
}