import './ThemeItem.css'
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/grid';
import { ClientCall } from '../Utils/functions';
import { getMedia } from '../Utils/StringFormater';
import { IoDiamond } from 'react-icons/io5';

export { ThemeItem }


function ThemeItem({ theme }: { theme: any }) {

  return <div className="theme-item">
    <div className="image" style={{ background: getMedia({isBackground:true,source:'/res/store_img_5.png'}) }}>
      {
        ClientCall(Math.random, 0) < 0.5 ? <div className="price">< IoDiamond />{'12 300F'}</div>
          : <div className="free">{'Gratuit'}</div>
      }
    </div>
    <p className='theme-specialities'>{
      ['multi category', '3d', 'AR', '3D seulement', 'food', 'immobilier'].map(f => <span key={f}>{f}</span>)
    }</p>

  </div>
}
