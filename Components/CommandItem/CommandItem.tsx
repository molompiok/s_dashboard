import { CommandInterface, ProductInterface } from '../../Interfaces/Interfaces'
import './CommandItem.css'
import { OrderStatusElement, statusColors } from '../Status/Satus'
import { ClientCall } from '../Utils/functions'
import { IoChevronDown, IoCloseOutline, IoPricetag } from 'react-icons/io5'
import { Colors } from 'chart.js'
import { CommandProduct } from '../../pages/commands/@id/+Page'


export { CommandItem }

let i = 0

function CommandItem({ command, onClick, preview }: { preview?: boolean, onClick: () => void, command: CommandInterface }) {

    return <div className="command-item" onClick={onClick}>
        <div className="client-info">
            <div className='image-info'>
                <div className="image-client" style={{ background: `no-repeat center/cover url(${'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTaG54nN4diXe39g4OABqF-WHgknQc0m2psIimQmhZM3wRG0k7f5tAdGIfgSALD0DB-HjM&usqp=CAU'})` }}></div>
                <div className="info">
                    <h2>Rigober Albiston</h2>
                    <p>3 Products</p>
                    <p>id : #255fac5</p>
                </div>
            </div>
            <div className="right">
                <span className='status'>{
                    (() => {
                        const keys = Object.keys(statusColors);
                        const i = Math.trunc(ClientCall(Math.random, 0) * keys.length)
                        const status = keys[i] as keyof typeof statusColors
                        return <OrderStatusElement status={status} />
                    })()
                }</span>
                <h3 className='price-command'>234 565 FCFA</h3>
            </div>
        </div>
        <div className="products-previews">
            {/// TODO les lost doivent inclures le rest pour afficher le SEE-MORE
                Array.from({ length: 8 }).slice(0, 3).map((_, i) => <CommandProduct key={i} product={{} as any} />)
            }
            {
                true && <div className="see-more">
                    <div>
                        <span>voir plus, {3} produits restant</span>
                        <IoChevronDown />
                    </div>
                </div>}
        </div>
    </div>
}
