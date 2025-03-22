import { IoCloudUploadSharp } from 'react-icons/io5'
import { Button } from '../Button/Button'
import './SaveButton.css'
import { getImg } from '../Utils/StringFormater'

export { SaveButton }
const EffectRequired = {
    color: {
        required: {
            height: '100%',
            opacity: 1,
            background: 'var(--primary-gradiant)',
            boxShadow:'0px 6px 16px -8px var(--primary-color)',
        } satisfies React.CSSProperties,
        not_required: {
            height: '100%',
            opacity: 1,
            background: 'var(--gray-gradiant)',
        } satisfies React.CSSProperties
    },
    height: {
        required: {
            height: '0%',
            opacity: 0,
        } satisfies React.CSSProperties,
        not_required: {
            height: '100%',
            opacity: 1,
        } satisfies React.CSSProperties
    }
}
function SaveButton({ onClick, required, title, effect='color' ,loading}: {loading?:boolean, effect?: 'color' | 'height', title?: string, required?: boolean | void | undefined | null, onClick: () => void }) {

    return <Button className='save-button' icon={
        loading ? (
            <div className='icon-25' style={{background:getImg('/res/loading_white.gif')}}></div>
        ): <IoCloudUploadSharp/>
    } title={
        title || 'Sauvegarder les modifications'
    }
        justifyContent='center'
        forward={null}
        iconCtnStyle={{
            background: 'transparent',
            width: '48px'
        }}
        onClick={onClick} style={{
            borderRadius: '24px',
            cursor:required? 'pointer':'not-allowed',
            background: 'var(--primary-gradiant)',
            color: 'var(--discret-10)',
            fontSize: '1.1em',
            boxShadow:'0px 6px 16px -8px var(--gray-color)',
            ...(
                required ?
                EffectRequired[effect].required :
                EffectRequired[effect].not_required
            ),
        }} />
}