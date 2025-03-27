import { Topbar } from '../../Components/TopBar/TopBar'
import { CategoriesList } from '../../Components/CategoriesList/CategoriesList'
import './Page.css'
import { ProductList } from '../../Components/ProductList/ProductList'

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
