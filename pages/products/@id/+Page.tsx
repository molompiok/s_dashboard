import { IoPencil } from 'react-icons/io5'
import './+Page.css'
import { CategoryItem } from '../../../Components/CategoryItem/CategoryItem'
import { CommandeList } from '../../../Components/Commandes/CommandesList'
import { useEffect, useState } from 'react'
import { Topbar } from '../../../Components/TopBar/TopBar'
import { SwiperProducts } from '../../../Components/Swipers/SwiperProducts'
import { images } from "./images";
import { HoriszontalSwiper } from '../../../Components/Swipers/HoriszontalSwiper'

export function Page() {
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  useEffect(()=>{
    setCurrentImages(images[0].views)
  },[])
  console.log({currentImages});
  
  return <div className="product">
    <Topbar back={true} /> 
    <div className="views">
      <SwiperProducts images={currentImages} />
    </div>
    <div className="image-manager">
    <HoriszontalSwiper values={images as any} onActiveIndexChange={(index)=>{
      console.log({index});
      
      setCurrentImages([...images[index].views]);

    }}/>
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