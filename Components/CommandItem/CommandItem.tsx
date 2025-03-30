import { CommandInterface, ProductInterface } from '../../Interfaces/Interfaces'
import './CommandItem.css'
import { OrderStatusElement, statusColors } from '../Status/Satus'
import { ClientCall } from '../Utils/functions'
import { IoChevronDown, IoCloseOutline, IoPricetag } from 'react-icons/io5'
import { Colors } from 'chart.js'
import { CommandProduct } from '../../pages/commands/@id/+Page'
import { getImg } from '../Utils/StringFormater'


export { CommandItem }

let i = 0

function CommandItem({ command, onClick, preview }: { preview?: boolean, onClick: () => void, command: CommandInterface }) {
    console.log(command.id,command.payment_status,{command});
    
    return <div className="command-item" onClick={onClick}>
        <div className="client-info">
            <div className='image-info'>
                <div className="image-client" style={{ background: getImg('') }}></div>
                <div className="info">
                    <h2>{command.user?.full_name}</h2>
                    <p>{command.items?.length} Products</p>
                    <p>id : #{command.id.substring(0,command.id.indexOf('-'))}</p>
                </div>
            </div>
            <div className="right">
                <span className='status'>{
                    (() => {
                        const keys = Object.keys(statusColors);
                        const i = Math.trunc(ClientCall(Math.random, 0) * keys.length)
                        const status = keys[i] as keyof typeof statusColors
                        return <OrderStatusElement status={(command.delivery_status||command.payment_status)?.toLocaleUpperCase() as any||''} />
                    })()
                }</span>
                <h3 className='price-command'>{command.total_price} {command.currency}</h3>
            </div>
        </div>
    </div>
}
