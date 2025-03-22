import './Separator.css'

export {Separator}

function Separator({color, style}:{style?:React.CSSProperties,color?:string}) {
    

    return <div className="separator" style={{background:color,...style}}></div>
}