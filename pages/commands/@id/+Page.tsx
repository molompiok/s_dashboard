import { IoApps, IoBagHandle, IoCall, IoCard, IoCart, IoCheckmark, IoCheckmarkCircle, IoCloseOutline, IoLocationSharp, IoMail, IoPricetag, IoQrCode, IoReceipt } from 'react-icons/io5';
import './+Page.css'
import './CommandProduct.css'
import './CommandUser.css'
import './CommandStatus.css'
import { QRCodeCanvas } from 'qrcode.react';
import { Image_1, OrderStatus } from '../../../Components/Utils/constants';
import { OrderStatusElement, statusColors } from '../../../Components/Status/Satus';
import { Topbar } from '../../../Components/TopBar/TopBar';
import { ClientCall } from '../../../Components/Utils/functions';
import { ProductInterface } from '../../../Interfaces/Interfaces';
import { FaTruck } from 'react-icons/fa';
import { Separator } from '../../../Components/Separator/Separator';
import { kMaxLength } from 'buffer';
import { useWindowSize } from '../../../Hooks/useWindowSize';
import { useState } from 'react';
import { useApp } from '../../../renderer/Stores/UseApp';
import { ChildViewer } from '../../../Components/ChildViewer/ChildViewer';
import { Receipt } from './Receipt/Receipt';

export { Page ,CommandTop ,CommandProduct}

function CommandTop({showReceipt}:{showReceipt?:boolean}) {
  
  const {openChild} = useApp()
 
  return  <div className="command-top">
  <QRCodeCanvas
    value={'lol'}
    size={120} // Taille en pixels
    bgColor="#ffffff" // Couleur de fond
    fgColor="#334455" // Couleur du QR Code
    level="H" // Niveau de correction d'erreur (L, M, Q, H)
  />
  <div className="data">
    <h3>Resume de la command</h3>
    <h2 className='stats-product'><IoBagHandle /> Produits <span>6</span></h2>
    <h2 className='stats-categories'><IoApps /> Status <span><OrderStatusElement status='PICKED_UP' /></span></h2>
    <h2 className='stats-command'><IoQrCode /> Id <span>#ea7f18</span></h2>
    {showReceipt!=false && <h2 className='receipt' onClick={()=>{
      openChild(<ChildViewer>
        <Receipt command={{} as any}/>
      </ChildViewer>)
    }}><IoReceipt />{`receipt/${'ea7f18'}`}</h2>}
  </div>
</div>
}

function Page() {

   const size = useWindowSize()
  const w = 380;
  const low = size.width < w;
  const currentStep = 5
  return <div className="command">
    <Topbar back />
   <CommandTop />
    <h2>Information Client</h2>
    <CommandUser user />
    <h2>List des Produits <span>Total : 983 922 FCFA</span></h2>
    <div className="products-list">
      {/// TODO les lost doivent inclures le rest pour afficher le SEE-MORE
        Array.from({ length: 8 }).slice(0, 3).map((_, i) => <CommandProduct key={i} product={{} as any} />)
      }
    </div>
    <h2>Evolution des Status</h2>
    <div className="status-events">
      {Object.keys(statusColors).map((k: string, i) => {
        const d = new Date().toLocaleDateString('fr', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
        let h = new Date().toLocaleDateString('fr', {
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric'
        })
        h = h.split(' ')[1]
        h= h.substring(0,h.lastIndexOf(':'))
        return (
          <div className="command-status">
           {!low && <div className="date">
              <span className="day">{d}</span>
              <span className="hour">{h}</span>
            </div>}
            <div className="step">
              <span className="icon" style={{background:i<currentStep ?(statusColors as any)[k]:'#55555522'}}>
                {i<currentStep && <IoCheckmark />}
                </span>
              {Object.keys(statusColors).length-1 != i && <div className="bar"></div>}
            </div>
            <div className="info">
            <div style={{display:'flex', justifyContent:'space-between'}}>
              <h3>{<OrderStatusElement status={k as any} background={i<currentStep ?undefined:'#55555522'} color={i<5 ?undefined:'#555555'}/>}</h3>
            {low && <div className="date">
              <span className="day">{d}</span>
              <span className="hour">{h}</span>
            </div>}
              
            </div>
            <p>message du stautus pour aider le owner dans sa comprehention des status de sublymus</p>
            </div>
          </div>
        )
      })}
    </div>
  </div>
}
const featuresFilled = {
  color: '#red',
  volume: '34ml',
  type: 'carre',
  name: 'Ladona del aminas',
  date: '2025-03-31',
  heure: '15:33:00',
}

function CommandUser({ user }: { user: any }) {
  // TODO ajouter de belle card pour la livraison et le payement
  return <div className="command-user">
    <div className="photo" style={{ background: `no-repeat center/cover url(${Image_1})` }}></div>
    <div className="infos">
      <h2 className="name">Rabajois D'el Pkaco</h2>
      <div className="phone"><IoCall />+225 07 509 92 95 15</div>
      <div className="email"><IoMail />sublymus@gmail.com</div>
      <div className="address"><IoLocationSharp /> Mineva, Jardoparck, Abidjan, Cote D'ivoire</div>
      <Separator />
      <div className="delivery-mode"><FaTruck />Livraison à Domicile</div>
      <div className="payment-mode"><IoCard />Payement a la Livraison</div>
    </div>
  </div>
}

function CommandProduct({ product }: { product: ProductInterface }) {

  const keys = Object.keys(statusColors);
  const a = Math.trunc(ClientCall(Math.random, 0) * keys.length)
  const status = keys[a] as keyof typeof statusColors
  const isReturn = ['RETURNED'].includes(status)

  return (
    <div className={`command-product ${isReturn ? 'return' : ''}`} >
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px'
      }}>
        <div className="image" style={{ background: `no-repeat center/cover url(${'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTaG54nN4diXe39g4OABqF-WHgknQc0m2psIimQmhZM3wRG0k7f5tAdGIfgSALD0DB-HjM&usqp=CAU'})` }}></div>
        <div className="info">
          <div style={{
            display: 'flex',
            width: '100%',
            flexWrap: 'wrap',
            justifyContent: 'space-between'
          }}>
            <div style={{ marginBottom: '12px' }}>
              <h2 className='ellipsis'>{'Le Laconique 3.5 verion miracle'}</h2>
              <p className='ellipsis dscription'>Le Laconique 3.5 verion miracle</p>
              <p>Id: #83e82a</p>
            </div>
            <div className="prices">

              <h3 className='price-product'>{2} <IoCloseOutline /> 54 080 FCFA</h3>
              <h2 className='price-product'><IoPricetag />108 160 FCFA</h2>
            </div>
          </div>
          <ul className="values">{
            Object.keys(featuresFilled).map((k) => (
              <li key={k}><span className='key'>{k} </span> <span className='value'>{(featuresFilled as any)[k]}</span></li>
            ))
          }</ul>
        </div>

      </div>
      <span className='status'>{
        (() => {
          return isReturn && <OrderStatusElement status={status} />
        })()
      }</span>
    </div>
  )
}