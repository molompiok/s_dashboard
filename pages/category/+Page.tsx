import { IoApps, IoBagHandle, IoCart, IoPencil } from 'react-icons/io5'
import './Page.css'
import { Indicator } from '../../Components/Indicator/Indicator'
import { CategoriesList } from '../products/CategoriesList/CategoriesList'
import { ProductList } from '../products/ProductList/ProductList'
import { Topbar } from '../../Components/TopBar/TopBar'
import { Image_1 } from '../../Components/Utils/constants'
import { useData } from '../../renderer/useData'
import type { Data } from './+data'
import { getImg } from '../../Components/Utils/StringFormater'
import { usePageContext } from '../../renderer/usePageContext'
import { Api_host } from '../../renderer/+config'

export { Page }

function Page() {

  const { category,logoUrl } = useData<Data>()
  
  return (
    <div className="category">
      <Topbar back={true}/>
      <div className="top">
        <div className="view" style={{background:getImg(category?.view[0],undefined,Api_host)}} ></div>
        <div className="stats">
          <h3>Donnee de Performance</h3>
          <h2 className='stats-product'><IoBagHandle /> Produits <span>23</span></h2>
          <h2 className='stats-command'><IoCart /> Command <span>128</span></h2>
          <h2 className='stats-categories'><IoApps /> Sous Categorie <span>5</span></h2>
        </div>
      </div>
      <h3>Nom de la categorie <IoPencil/></h3>
      <h1>{category?.name}</h1>
      <h3>Decription <IoPencil/></h3>
      <p>{category?.description}</p>
      <CategoriesList title={'Liste des Sous Categories'}/>
      <ProductList/>
    </div>
  )
}
