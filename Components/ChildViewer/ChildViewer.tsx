import { JSX } from 'react';
import { useApp } from '../../renderer/AppStore/UseApp';
import './ChildViewer.css'
import { IoCloseSharp } from "react-icons/io5";
import { useChildViewer } from './useChildViewer';
export { ChildViewer }

function ChildViewer({ children, title,style,back }: {back?:boolean,title?:string,children?: JSX.Element, style?:React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>['style'] }) {
    
    const {openChild} = useChildViewer()

    return <div className="child-viewer">
        <div className="top">
            <div className="close"></div>
            <h3>{title}</h3>
            <IoCloseSharp className="close" onClick={()=>{
                openChild(null)
            }}/>
        </div>
        <div className="ctn" style={style}>
            {children}
        </div>
    </div>
}