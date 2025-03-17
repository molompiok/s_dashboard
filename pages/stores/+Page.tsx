// Import Swiper styles
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/grid';

import './Page.css'
import { useWindowSize } from '../../Hooks/useWindowSize';
import { useEffect, useState } from 'react';
import { FreeMode } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { getImg } from '../../Components/Utils/StringFormater';

import { Host } from '../../renderer/+config';
import { RecentThemes, ThemeList } from '../../Components/ThemeList/ThemeList';
import { StoresList } from '../../Components/StoreList/StoresList';
import { IoCart, IoChevronForward, IoClose, IoDesktop, IoFingerPrint, IoPause, IoPencil, IoPeopleSharp, IoPlay, IoSettings } from 'react-icons/io5';
import MyChart from '../index/MiniChart';
import { Separator } from '../../Components/Separator/Separator';
import { Progrees } from '../../Components/Progress/Pregress';

export { Page }


function Page() {

  const [currentStore, setCurrentStore] = useState(2);
  const [SelectedStore, setSelectedStore] = useState(0);
  const l = 9;
  const h = 240;
  const s = useWindowSize().width;
  const n = s <= 550 ? (s - 250) / 300 + 1
    : s < 750 && s >= 550 ? 2
      : s < 900 && s >= 750 ? (s - 750) / 150 + 2
        : 3
  const p = s < 550 ? 20 : 30;

  return (
    <div className="stores">
      <StoresList currentStore={currentStore} setSelectedStore={setSelectedStore} />
      <div className="animated-content">
        <CurrentTheme />
        <div className={`manages-stores ${currentStore == SelectedStore ? 'active' : ''}`}>

          <div className="manage-side">
            <div className="stats">
              <div className="section commades">
                <div className="min-info">
                  <h3><IoCart className='icon' /> {'Commandes'} <span>{'38'}</span></h3>
                </div>
                <MyChart color='greenLight' />
              </div>
              <div className="section visites">
                <div className="min-info">
                  <h3><IoPeopleSharp className='icon' /> {'Visites'} <span>{'38'}</span></h3>
                </div>
                <MyChart />
              </div>
            </div>
            <Separator color='var(--contrast-text-color-1)' />
            <div className="activities">
              <div className="activity">
                <h3>Points de ventes</h3>
                <Progrees progress={0.2} />
                <span>{20} / {99}</span>
              </div>
              <div className="activity">
                <h3>Collaborateurs</h3>
                <Progrees progress={0.2} />
                <span>{2} / {10}</span>
              </div>
              <div className="activity">
                <h3>Produits</h3>
                <Progrees progress={0.2} />
                <span>{2} / {10}</span>
              </div>
              <div className="activity">
                <h3>Pays</h3>
                <Progrees progress={0.2} />
                <span>{2} / {10}</span>
              </div>
              <div className="activity">
                <h3>Disque SSD <span>(Gb)</span></h3>
                <Progrees progress={0.2} />
                <span>{2} / {10}</span>
              </div>
            </div>
          </div>
          <div className="manage-side change-store">
            <h3 className='store-name'>{'Boutique name'}</h3>
            <p>Cliquer sur le boutton si dessous pour que l'app afficher les Informations de la boutique</p>
            <div className="btn" onClick={() => setCurrentStore(SelectedStore)}>Changer de Boutique</div>
          </div>
          <div className="manage-side store-options">
            <div className="play"><IoDesktop /> Rendre Disponible <IoChevronForward className='end' /></div>
            <div className="stop"><IoClose /> Stopper <IoChevronForward className='end' /></div>
            <div className="secur"><IoFingerPrint /> Securite <IoChevronForward className='end' /></div>
            <div className="edit"><IoPencil /> Modifier <IoChevronForward className='end' /></div>
            {/* <div className="stop"><IoSettings/> Parametre</div> */}
            <div className="stting"><IoSettings /> Parametre <IoChevronForward className='end' /></div>
          </div>
        </div>

        <RecentThemes store={0} />
        <ThemeList store={0} />
      </div>
    </div>
  )
}





function CurrentTheme() {
  const [store, setStore] = useState<any>({})
  const s = useWindowSize().width;
  const n = s < 550 ? (
    ((s - 260) / 290) * 1 + 2
  ) : s < 750 ? 3 : 4
  const p = s < 550 ? 20 : 30
  return <div className="current-theme" >
    <div className="detail-current-theme">
      <div className="image" style={{ background: getImg('/res/store_img_5.jpg', 'cover') }}></div>
      <div className="general">
        <h2>Theme Nane Sublymus</h2>
        <p className='theme-specialities'>{
          ['multi category', '3d', 'AR', '3D seulement', 'food', 'immobilier'].map(f => <span key={f}>{f}</span>)
        }</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h3 style={{ whiteSpace: 'nowrap' }}>STATUS :</h3>
          <div className="status">{'ACTIVE'}</div>
        </div>
      </div>
    </div>
    <Swiper
      slidesPerView={n}
      spaceBetween={p}
      freeMode={true}
      pagination={{
        clickable: true,
      }}
      modules={[FreeMode]}
      className="options no-selectable"
    >
      <SwiperSlide className="hidden"></SwiperSlide>
      <SwiperSlide className="Color">
        <img src={`${Host}/themes_options/colors.svg`} alt="" width={120} height={120} />
        <span>Colors</span>
      </SwiperSlide>
      <SwiperSlide className="Disposition">
        <img src={`${Host}/themes_options/text.svg`} alt="" width={120} height={120} />
        <span>Text</span>
      </SwiperSlide>
      <SwiperSlide className="Text">
        <img src={`${Host}/themes_options/disposition.svg`} alt="" width={120} height={120} />
        <span>Disposition</span>
      </SwiperSlide>
      <SwiperSlide className="pub">
        <img src={`${Host}/themes_options/pub.svg`} alt="" width={120} height={120} />
        <span>PUB</span>
      </SwiperSlide>
      <SwiperSlide className="blog">
        <img src={`${Host}/themes_options/blog.svg`} alt="" width={120} height={120} />
        <span>FAQ</span>
      </SwiperSlide>
      <SwiperSlide className="FAQ">
        <img src={`${Host}/themes_options/faq.svg`} alt="" width={120} height={120} />
        <span>Blog</span>
      </SwiperSlide>
      <SwiperSlide className="hidden"></SwiperSlide>
    </Swiper>
  </div>

}


