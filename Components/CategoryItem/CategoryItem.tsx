import { useEffect, useState } from "react"
import { CategoryInterface } from "../../Interfaces/Interfaces"
import { Image_1 } from "../Utils/constants"
import { ClientCall } from "../Utils/functions"
import { getImg } from "../Utils/StringFormater"
import './CategoryItem.css'
import { useCategory } from "../CategoriesList/CategoryStore"
import { Api_host } from "../../renderer/+config"
import { useStore } from "../../pages/stores/StoreStore"
import { IoClose } from "react-icons/io5"

export { CategoryItem }

// additionnal service, lors de la command, sur la page de comfirmation on/le owner peut propropser des additional services. voir => public/res/14.jpg

function CategoryItem({
    category,
    onClick,
    category_id,
    openCategory,
    hoverEffect,
    onDelete
}: {
    openCategory?: boolean,
    category_id?: string,
    category?: CategoryInterface,
    onClick?: (categorie: CategoryInterface) => void,
    onDelete?: (categorie: CategoryInterface) => void,
    hoverEffect?: boolean,
}) {
    const [c, setC] = useState(category);
    const { fetchCategoriesBy } = useCategory();
    const { currentStore } = useStore();
    const [s] = useState({
        init: false
    })
    useEffect(() => {
        if (!c && category_id) {
            const id = Math.random();
            console.log(id, category_id)
            if (s.init) return
            s.init = true
            fetchCategoriesBy({ categories_id: [category_id],with_product_count:true}).then(res => {
                if (!res?.[0]) return;
                setC(res[0]);
            })
        }
    }, [currentStore]);

    return c && <a key={category_id} className={"category-item " + (hoverEffect ? 'hover-effect' : '')} onClick={() => onClick?.(c)} href={(openCategory || undefined) && `/category?id=${c.id}`} >

        <div className={"delete "+(onDelete?'required':'') } onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete?.(c);
        }}>{
                onDelete ?
                    <IoClose /> :
                    0
            }

        </div>

        <div className="item-view" style={{ background: getImg(c.icon?.[0] || c.view?.[0], 'contain', Api_host) }} ></div>
        <span className="ellipsis">{c.name}</span>
    </a>
}