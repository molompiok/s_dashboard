import { CategoryInterface } from "../../renderer/Interfaces/Interfaces"
import './CategoryItem.css'

export {CategoryItem}


function CategoryItem({category ,onClick}:{category:CategoryInterface,onClick?:()=>void}) {
    
    return <a onClick={()=>onClick?.()} href={`/category?${'82eaf63'}`}  className="category-item">
    </a> 
}