import { usePageContext } from '../../../../renderer/usePageContext'
import './+Page.css'

export function Page() {
    
    const {urlOriginal} = usePageContext()

    return <div className="variantes-page">
        {urlOriginal}
    </div>
}