import { Topbar } from '../../Components/TopBar/TopBar'
import { CategoriesList } from './CategoriesList/CategoriesList'
import './Page.css'
import { ProductList } from './ProductList/ProductList'

export { Page }

function Page() {
  return (
    <div className="products">
      <Topbar back={true}/>
      <CategoriesList/>
      <ProductList/>
    </div>
  )
}
