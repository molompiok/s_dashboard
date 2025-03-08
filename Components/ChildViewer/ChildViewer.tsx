import { useApp } from '../../renderer/Stores/UseApp';
import './ChildViewer.css'
import { IoCloseSharp } from "react-icons/io5";
export { ChildViewer }

function ChildViewer({ children, title,style }: {title?:string,children?: React.ReactNode , style?:React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>['style'] }) {
    
    const {openChild} = useApp()

    return <div className="child-viewer">
        <div className="top">
            <h1>{title}</h1>
            <IoCloseSharp className="close" onClick={()=>{
                openChild(null)
            }}/>
        </div>
        <div className="ctn" style={style}>
            {children}
        </div>
    </div>
}
