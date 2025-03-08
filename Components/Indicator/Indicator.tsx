import { IoHelp } from 'react-icons/io5'
import './Indicator.css'


export {Indicator}

function Indicator({title,description}:{title:string,description?:string}) {
    

    return <div className="indicator"> 
    <IoHelp/>
    <div className="info">
        <h2>{title}</h2>
        {<p>{'descr iption descripti on desc ription description descrip tion description description '}</p>}
    </div>
    </div>
}