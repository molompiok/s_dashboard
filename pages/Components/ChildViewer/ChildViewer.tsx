import { useApp } from '../../../renderer/Stores/UseApp';
import './ChildViewer.css'
import { IoCloseSharp } from "react-icons/io5";
export { ChildViewer }

function ChildViewer({ children, title }: {title?:string,children?: React.ReactNode }) {
    
    const {openChild} = useApp()

    return <div className="child-viewer">
        <div className="top">
            <h1>{title}</h1>
            <IoCloseSharp className="close" onClick={()=>{
                openChild(null)
            }}/>
        </div>
        <div className="ctn">
            {children}
        </div>
    </div>
}
