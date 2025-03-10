import { getImg } from '../Utils/StringFormater'
import './ConfirmDelete.css'

export { ConfirmDelete }

function ConfirmDelete({ title, onCancel, onDelete ,style}: {style?:React.CSSProperties | undefined, title: string, onCancel: () => void, onDelete: () => void }) {


    return <div style ={style}className="confirm-delete">
        <div className="ctn">
            <div className="cancel" onClick={onCancel}>Anuller</div>
            <div className="delete" onClick={e => {
                const span = e.currentTarget.querySelector('span') as HTMLSpanElement
                span.style.display = 'inline-block'
                e.currentTarget.style.gap = '6px';
                e.currentTarget.style.paddingLeft = '6px';
                onDelete()
            }}><span style={{ display: 'none', background: getImg('/res/loading_white.gif', undefined, false) }}></span> Supprimer</div>
        </div>
    </div>
}