import { Topbar } from '../index/TopBar'
import { CategoriesList } from './CategoriesList/CategoriesList'
import './Page.css'
import { ProductList } from './ProductList/ProductList'

export { Page }

function Page() {
  return (
    <div className="products">
      <Topbar/>
      <CategoriesList/>
      <ProductList/>
    </div>
  )
}
