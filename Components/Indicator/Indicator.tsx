import { IoHelp } from 'react-icons/io5'
import './Indicator.css'


export {Indicator}

function Indicator({title,description, style,className}:{style?:React.CSSProperties | undefined,className?:string,title:string,description?:string}) {
    

    return <span style={style} className={"indicator "+ (className||'')}> 
    <IoHelp/>
    <div  className="info">
        <h2>{title}</h2>
        {<p>{description}</p>}
    </div>
    </span>
}