import { IoCloudDownload, IoCloudDownloadOutline, IoDocuments, IoDocumentsOutline, IoDownload, IoDownloadOutline, IoPricetags, IoShareSocial, IoShareSocialOutline } from 'react-icons/io5'
import { CommandInterface } from '../../../../Interfaces/Interfaces'
import './Receipt.css'
import { CommandProduct, CommandTop } from '../+Page'
import { Separator } from '../../../../Components/Separator/Separator'
import { getImg } from '../../../../Components/Utils/StringFormater'


export { Receipt }

function Receipt({ command }: { command: CommandInterface }) {

    console.log(getImg('/res/images.png'));

    return <div className="receipt-veiew">
        <div className="top">
            <h2><span>RECU DE LA COMMANDE </span><IoCloudDownload /> <IoDocuments /><IoShareSocial /></h2>
        </div>
        <CommandTop showReceipt={false} />
        <h2 className='space-between'>List des Produits</h2>
        <div className="products-list">
            {/// TODO les lost doivent inclures le rest pour afficher le SEE-MORE
                Array.from({ length: 8 }).slice(0, 8).map((_, i) => <CommandProduct key={i} product={{} as any} />)
            }
        </div>
        <Separator />
        <h2 className='space-between'>Somme des Prix <span><IoPricetags />835 820 FCFA</span></h2>
        <p className='space-between'>Livraison <span>35 820 FCFA</span></p>
        <p className='space-between'>Reductions <span>- 5 820 FCFA</span></p>
        <h1 className='space-between'>Somme des Prix <span><IoPricetags />823 860 FCFA</span></h1>
        <Separator />
        <p className='space-between'><span>Mode de Payement  : <h3>{'Wave'}</h3></span><span className='icon-48-payment' style={{ background: getImg('/res/images.png', undefined, false) }}></span></p>
        <p className='space-between'><span>Mode de livraison : <h3>{'Livraison a domicile'}</h3></span> <span className='icon-48-delivery' style={{ background: getImg('/res/delivery_moto.png', undefined, false) }}></span></p>
    </div>
}