import { useEffect, useState } from "react"
import { CategoryInterface } from "../../Interfaces/Interfaces"
import { Image_1 } from "../Utils/constants"
import { ClientCall } from "../Utils/functions"
import { getImg } from "../Utils/StringFormater"
import './CategoryItem.css'
import { useCategory } from "../../pages/products/CategoriesList/CategoryStore"
import { Api_host } from "../../renderer/+config"
import { useStore } from "../../pages/stores/StoreStore"

export { CategoryItem }

// additionnal service, lors de la command, sur la page de comfirmation on/le owner peut propropser des additional services. voir => public/res/14.jpg

function CategoryItem({ category, onClick, category_id ,openCategory}: {openCategory?:boolean,category_id?:string, category?: CategoryInterface, onClick?: () => void }) {
    const [c,setC] = useState(category); 
    const {fetchCategoryBy} = useCategory();
    const {currentStore} = useStore()
    useEffect(()=>{
        if(!c && category_id){
            fetchCategoryBy({category_id}).then(res=>{
                if(!res?.id) return;
                setC(res);
            })
        }
    },[currentStore]);
    return c && <a className="category-item" onClick={() => onClick?.()} href={(openCategory||undefined)&&`/category?id=${c.id}`} >
        <div className="item-view" style={{ background: getImg(c.view[0],undefined, Api_host)  }} ></div>
        <span className="ellipsis">{c.name}</span>
    </a>
}