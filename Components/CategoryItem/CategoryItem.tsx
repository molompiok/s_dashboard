import { CategoryInterface } from "../../Interfaces/Interfaces"
import { Image_1 } from "../Utils/constants"
import { ClientCall } from "../Utils/functions"
import './CategoryItem.css'

export { CategoryItem }

// additionnal service, lors de la command, sur la page de comfirmation on/le owner peut propropser des additional services. voir => public/res/14.jpg

function CategoryItem({ category, onClick }: { category: CategoryInterface, onClick?: () => void }) {

    return <a className="category-item" onClick={() => onClick?.()} href={`/category?${'82eaf63'}`} >
        <div className="item-view" style={{ background: `no-repeat center/cover url(${Image_1})` }} ></div>
        <span className="ellipsis">{Number(ClientCall(Math.random,0)*1000000).toString(32)}</span>
    </a>
}