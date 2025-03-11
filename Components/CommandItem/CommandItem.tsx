import { CommandInterface } from '../../Interfaces/Interfaces'
import './CommandItem.css'
import { OrderStatusElement, statusColors } from '../Status/Satus'
import { ClientCall } from '../Utils/functions'


export { CommandItem }

let i = 0

function CommandItem({ command, onClick }: {onClick:()=>void, command: CommandInterface }) {

    return <div className="command-item" onClick={onClick}>
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        }}>
            <div className="image" style={{ background: `no-repeat center/cover url(${'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTaG54nN4diXe39g4OABqF-WHgknQc0m2psIimQmhZM3wRG0k7f5tAdGIfgSALD0DB-HjM&usqp=CAU'})` }}></div>
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
            <h3 className='price'>234 565 FCFA</h3>
        </div>
    </div>
}

//nogris frygs