import './Separator.css'

export {Separator}

function Separator({color}:{color?:string}) {
    

    return <div className="separator" style={{background:color}}></div>
}