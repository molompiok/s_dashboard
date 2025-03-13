import { IoApps, IoBagHandle, IoCart, IoPencil } from 'react-icons/io5'
import './Page.css'
import { Indicator } from '../../Components/Indicator/Indicator'
import { CategoriesList } from '../products/CategoriesList/CategoriesList'
import { ProductList } from '../products/ProductList/ProductList'
import { Topbar } from '../../Components/TopBar/TopBar'
import { Image_1 } from '../../Components/Utils/constants'

export { Page }

function Page() {

  //<Indicator title='Nom de la categorie'/>
  //TODO animation quand on save un input (input + icon save) + emit animation event 
  return (
    <div className="category">
      <Topbar back={true}/>
      <div className="top">
        <div className="view" style={{background:`no-repeat center/cover url(${Image_1})`}} ></div>
        <div className="stats">
          <h3>Donnee de Performance</h3>
          <h2 className='stats-product'><IoBagHandle /> Produits <span>23</span></h2>
          <h2 className='stats-command'><IoCart /> Command <span>128</span></h2>
          <h2 className='stats-categories'><IoApps /> Sous Categorie <span>5</span></h2>
        </div>
      </div>
      <h3>Nom de la categorie <IoPencil/></h3>
      <h1>{'Montre pour enfant'}</h1>
      <h3>Decription <IoPencil/></h3>
      <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Eaque pariatur numquam nulla error recusandae alias quo possimus, et laboriosam quia dolores maxime explicabo ad rerum eum eveniet, cumque, est assumenda.</p>
      <CategoriesList title={'Liste des Sous Categories'}/>
      <ProductList/>
    </div>
  )
}
