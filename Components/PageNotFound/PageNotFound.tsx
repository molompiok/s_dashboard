import { IoChevronBack, IoHome, IoHomeOutline } from "react-icons/io5"
import { getImg } from "../Utils/StringFormater"
import './PageNotFound.css'

export { PageNotFound }
function PageNotFound({ title, description }: { description: string, title: string }) {


    return <div className="page-not-found">
        <div className="icon-220" style={{ background: getImg('/res/empty/search.png') }}></div>
        <h2>{title}</h2>
        <p>{description}</p>
        <div className="bottom">
            <a onClick={()=>{
                history.back()
            }} className="home row"><IoChevronBack className='icon-25' /> Retour</a>
            <a href='/' className="home row"><IoHomeOutline className='icon-25'/> Page d'accueille </a>
        </div>
    </div>
}