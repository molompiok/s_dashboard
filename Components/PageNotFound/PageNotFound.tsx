import { IoChevronBack, IoHome, IoHomeOutline } from "react-icons/io5"
import { getImg } from "../Utils/StringFormater"
import './PageNotFound.css'
import { JSX } from "react"

export { PageNotFound }
function PageNotFound({ title, description, image = '/res/empty/search.png', back, forward, url, iconForwardAfter,iconForwardBefore }: {iconForwardAfter?:JSX.Element|null,iconForwardBefore?:JSX.Element|null, url?:string, forward?: string, back?: boolean, description?: string, title?: string, image?: string }) {


    return <div className="page-not-found">
        <div className="icon-220" style={{ background: getImg(image) }}></div>
        {title && <h2>{title}</h2>}
        { description &&<p>{description}</p>}
        <div className="bottom">
            {
                back && <a onClick={() => {
                    history.back()
                }} className="home row"><IoChevronBack className='icon-25' /> Retour</a>
            }
            <a href={url||(!forward?'/':undefined)} className="home row">{iconForwardBefore===null?null: iconForwardBefore||<IoHomeOutline className='icon-25' />} {forward || 'Page d\'accueille '} {iconForwardAfter}</a>
        </div>
    </div>
}