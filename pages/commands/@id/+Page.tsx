import { IoApps, IoBagHandle, IoCall, IoCard, IoCart, IoCash, IoCheckmark, IoCheckmarkCircle, IoChevronDown, IoCloseOutline, IoCopyOutline, IoHome, IoLocationSharp, IoMail, IoPricetag, IoQrCode, IoReceipt, IoStorefront } from 'react-icons/io5';
import './+Page.css'
import './CommandProduct.css'
import './CommandUser.css'
import './CommandStatus.css'
import { QRCodeCanvas } from 'qrcode.react';
import { Image_1, OrderStatus } from '../../../Components/Utils/constants';
import { OrderStatusElement, statusColors } from '../../../Components/Status/Satus';
import { Topbar } from '../../../Components/TopBar/TopBar';
import { getId } from '../../../Components/Utils/functions';
import { CommandInterface, CommandItemInterface, ProductInterface, UserInterface } from '../../../Interfaces/Interfaces';
import { FaTruck } from 'react-icons/fa';
import { Separator } from '../../../Components/Separator/Separator';
import { useWindowSize } from '../../../Hooks/useWindowSize';
import { useEffect, useState } from 'react';
import { useApp } from '../../../renderer/AppStore/UseApp';
import { ChildViewer } from '../../../Components/ChildViewer/ChildViewer';
import { Receipt } from './Receipt/Receipt';
import { useCommandStore } from '../CommandStore';
import { useStore } from '../../stores/StoreStore';
import { usePageContext } from '../../../renderer/usePageContext';
import { markdownToPlainText } from '../../../Components/MarkdownViewer/MarkdownViewer';
import { getImg } from '../../../Components/Utils/StringFormater';
import IMask from "imask";
import { getDefaultValues } from '../../../Components/Utils/parseData';
export { Page, CommandTop, CommandProduct }

const limit = (l?:string|undefined|null,m:number = 16)=>{
  return ((l?.length||0)>16? l?.substring(0,m)+'..':l)||''
}

function Page() {
  const [command, setCommand] = useState<Partial<CommandInterface>>()
  const { getCommandById } = useCommandStore();
  const { currentStore } = useStore()
  const size = useWindowSize()
  const [s] = useState({
    init: false
  })

  const w = 380;
  const low = size.width < w;
  const currentStep = 5

  const { routeParams } = usePageContext()
  const command_id = routeParams['id'];
  useEffect(() => {
    currentStore && !s.init && getCommandById({ command_id: command_id || '' }).then(res => {
      s.init = true
      if (!res?.id) return;
      setCommand(res);
    })
  }, [currentStore])
  console.log({ id: command_id });

  console.log(command);

  return <div className="command">
    <Topbar back />
    <CommandTop command={command} />
    <h2>Information Client</h2>
    {command?.user && <CommandUser command={command} user={command?.user} />}
    <h2><b>List des Produits <b style={{ fontSize: '0.8em' }}>({command?.items?.length || 0})</b></b> <span><b>Total :</b> {command?.total_price} {command?.currency}</span></h2>
    <div className="products-list">
      {
        command?.items?.map((item) => <CommandProduct key={item.id} item={item} />)
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
        h = h.substring(0, h.lastIndexOf(':'))
        return (
          <div key={k} className="command-status">
            {!low && <div className="date">
              <span className="day">{d}</span>
              <span className="hour">{h}</span>
            </div>}
            <div className="step">
              <span className="icon" style={{ background: i < currentStep ? (statusColors as any)[k] : '#55555522' }}>
                {i < currentStep && <IoChevronDown />}
              </span>
              {Object.keys(statusColors).length - 1 != i && <div className="bar"></div>}
            </div>
            <div className="info">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h3>{<OrderStatusElement status={k as any} background={i < currentStep ? undefined : '#55555522'} color={i < 5 ? undefined : '#555555'} />}</h3>
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

function CommandUser({ user, command }: { command: Partial<CommandInterface>, user: Partial<UserInterface> }) {
  // TODO ajouter de belle card pour la livraison et le payement
  const { openChild } = useApp()
  return <div className="command-user">
    <div className="photo" style={{ background: `no-repeat center/cover url(${Image_1})` }}></div>
    <div className="infos">
      <h2 className="name" >{user.full_name}</h2>
      <div className="phone" onClick={() => {
        openChild(<ChildViewer><>
          <h2>📱 Contact Rapide</h2>

          {/* Bouton pour appeler */}
          <button onClick={() => window.open(`tel:${command.phone_number}`)}>
            📞 Appeler
          </button>

          {/* Bouton pour ouvrir WhatsApp */}
          <button onClick={() => window.open(`https://wa.me/${command.phone_number}`)}>
            💬 WhatsApp
          </button>

          {/* Bouton pour ouvrir Telegram */}
          <button onClick={() => window.open(`https://t.me/${command.phone_number}`)}>
            📩 Telegram
          </button>
        </></ChildViewer>)
      }}><IoCall />{command.phone_number && IMask.pipe(command.phone_number, { mask: command.formatted_phone_number || '' })}</div>
      <div className="email" onClick={() =>
        window.open(`mailto:${user.email}?subject=Contact&body=Bonjour`)
      }><IoMail />{user.email}</div>
      <div className="address"><IoLocationSharp /> {command.pickup_address || command.delivery_address}</div>
      <Separator />
      <div className="delivery-mode" onClick={() =>
        window.open(
          `https://www.google.com/maps/search/?api=1&query=${(command.delivery_latitude || command.pickup_latitude)},${command.delivery_latitude || command.pickup_latitude}`
        )
      }>
        {command.with_delivery ? <FaTruck className='logo' /> : <IoStorefront className='logo'/>}
        {command.with_delivery ? 'A Domicile' : 'En boutique'}
        <span><OrderStatusElement status={(command?.delivery_status || 'pending') as any} /></span>
      </div>
      <div className="payment-mode">
        {command.payment_method == 'cash' ? <IoCash className='logo'/> : <IoCard className='logo' />}
        {command.payment_method == 'cash' ? 'En Cash' : command.payment_method}
        <span><OrderStatusElement status={(command?.delivery_status || 'pending') as any} /></span>
      </div>
    </div>
  </div>
}

function CommandProduct({ item }: { item: CommandItemInterface }) {

  const isReturn = ['RETURNED'].includes(item.status)
  console.log(item);
  const { currentStore } = useStore()
  const defultValue = item.product && getDefaultValues(item.product)[0]
  
  return (
    <div className={`command-product ${isReturn ? 'return' : ''}`} >
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px'
      }}>
        <div className="image" style={{ background: getImg(defultValue?.views?.[0], undefined, currentStore?.url) }}></div>
        <div className="info">
          <div style={{
            display: 'flex',
            width: '100%',
            flexWrap: 'wrap',
            justifyContent: 'space-between'
          }}>
            <div style={{ marginBottom: '12px' }}>
              <h2 className='ellipsis'>{item.product?.name}</h2>
              <p className='ellipsis description'>{markdownToPlainText(item.product?.description || '')}</p>
              <p>Id: #{getId(item.id)}</p>
            </div>
            <div className="prices">

              <h3 className='price-product'>{item.quantity} <IoCloseOutline /> {item.price_unit} {item.currency}</h3>
              <h2 className='price-product'><IoPricetag /> {(item.quantity * item.price_unit).toLocaleString()} {item.currency}</h2>
            </div>
          </div>
          <ul className="values">{
            Object.entries(item.bind_name).map(([key, value]) => (
              <li key={key}>
                <span className='key'>{limit(key?.split(':')[0]+'jhfrg trth rthbr  yh tyhnty ty ')}</span>
                {
                  value.icon?.[0]
                    ? <span className='icon-32' style={{ background: getImg(value.icon?.[0]) }}></span>
                    : value.key && (!key?.split(':')[1] || key?.split(':')[1] == 'color') && <span className='icon-25' style={{ borderRadius: '50px', background: value.key }}></span>


                }
                <span className='value'>{limit((typeof value == 'string' ? value : value.text || value.key )+'eg rt trb rt bnry ney',16)}</span>
              </li>
            ))
          }</ul>
        </div>

      </div>
      <span className='status'>{
        (() => {
          return isReturn && <OrderStatusElement status={item.status.toLocaleUpperCase() as any} />
        })()
      }</span>
    </div>
  )
}

function CommandTop({ showReceipt, command }: { command?: Partial<CommandInterface>, showReceipt?: boolean }) {

  return <div className="command-top">
    {/* <QRCodeCanvas
      value={'lol'}
      size={120} // Taille en pixels
      bgColor="#ffffff" // Couleur de fond
      fgColor="#334455" // Couleur du QR Code
      level="H" // Niveau de correction d'erreur (L, M, Q, H)
    /> */}
    <div className="data">
      <h2 className='stats-command' style={{ fontSize: '1em' }}>
        <IoQrCode style={{ opacity: 0.6 }} />
        <b style={{ opacity: 0.6 }}> Id :</b>
        <span style={{ opacity: 0.9, fontSize: '0.9em' }}>#{getId(command?.id)}</span>
        <IoCopyOutline className={'copie-link'} style={{ opacity: 0.6 }} onClick={(e)=>{
          const element = e.currentTarget;
          element.classList.add('anim');
          setTimeout(() => {
            element.classList.remove('anim')
          }, 800);
        }}/>
      </h2>
    </div>
  </div>
}
