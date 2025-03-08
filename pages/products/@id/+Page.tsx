import { IoPencil } from 'react-icons/io5'
import './+Page.css'
import { CategoryItem } from '../../../Components/CategoryItem/CategoryItem'
import { CommandeList } from '../../../Components/Commandes/CommandesList'
import { useState } from 'react'
import { Topbar } from '../../../Components/TopBar/TopBar'
import { SwiperProducts } from '../../../Components/Swipers/SwiperProducts'
import { images } from "./images";
import { HoriszontalSwiper } from '../../../Components/Swipers/HoriszontalSwiper'

export function Page() {
  const [views, setViews] = useState<Record<string, string[]>>(images)
  const [viewId, setViewId] = useState<string>('1234');
  const defaultView = '1234';
  return <div className="product">
    <Topbar back={true} /> 
    <div className="views">
      <SwiperProducts images={views[viewId || defaultView]} />
    </div>
    <div className="image-manager">
    <HoriszontalSwiper/>
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