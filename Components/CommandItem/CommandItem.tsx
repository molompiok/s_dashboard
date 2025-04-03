import { CommandInterface } from '../../Interfaces/Interfaces'
import './CommandItem.css'
import { OrderStatusElement } from '../Status/Satus'
import { getImg } from '../Utils/StringFormater'


export { CommandItem }

let i = 0

function CommandItem({ command, onClick, preview }: { preview?: boolean, onClick: () => void, command: CommandInterface }) {
    
    return <div className="command-item" onClick={onClick}>
        <div className="client-info">
            <div className='image-info'>
                <div className="image-client" style={{ background: getImg('/res/delivery_moto.png') }}></div>
                <div className="info">
                    <h2>{command.user?.full_name}</h2>
                    <p>{command.items_count||0} Products</p>
                    <p>id : #{command.id.substring(0, command.id.indexOf('-'))}</p>
                </div>
            </div>
            <div className="right">
                <span className='status'>
                    <OrderStatusElement status={(command.status || command.payment_status)?.toLocaleUpperCase() as any || ''} />
                </span>
                <h3 className='price-command'>{command.total_price} {command.currency}</h3>
            </div>
        </div>
    </div>
}
