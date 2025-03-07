import { IoFilterSharp } from 'react-icons/io5'
import { useApp } from '../../../renderer/Stores/UseApp'
import { usePageContext } from '../../../renderer/usePageContext'
import { ChildViewer } from '../ChildViewer/ChildViewer'
import { CommandeDetail } from './CommandDetail'
import './CommandesList.css'

export { CommandeList }

function CommandeList() {
    const {openChild} = useApp()
    return <a href='/?open=command&id=342353456' className="commandes-list">
        <div className="top">
            <h2>Recent Transactions</h2>
            <div className="filter">
            <IoFilterSharp className='filter-icon'/>

            </div>
        </div>
        <div className="list">
            {Array.from({ length: 25 }).map((a,i) => (
                <div key={i /*TODO a.id */} className="command" onClick={()=>{
                    openChild(<ChildViewer title='Detail Command 358acb78'/>,{blur:4})
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap:'8px'
                    }}>
                        <div className="image" style={{ background: `no-repeat center/cover url(${'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTaG54nN4diXe39g4OABqF-WHgknQc0m2psIimQmhZM3wRG0k7f5tAdGIfgSALD0DB-HjM&usqp=CAU'})` }}></div>
                        <div className="info">
                            <h2>Rigober Albiston</h2>
                            <p>3 Products</p>
                            <p>id : #255fac5</p>
                        </div>
                    </div>
                        <div className="right">
                            <h1 className='price'>23 4565 FCFA</h1>
                            <h1 className='status'>en cours</h1>
                        </div>
                </div>
            ))}
        </div>
    </a>
}
