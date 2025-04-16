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
import { StoreInterface } from '../../Interfaces/Interfaces';
import { useStore } from './StoreStore';
import { ClientCall } from '../../Components/Utils/functions';

export { Page }


function Page() {
  const a = parseInt(ClientCall(()=>localStorage.getItem('store.manage')||'0'));
  const [index, setIndex] = useState(a);
  const [managedIndex, setManagedIndex] = useState(a);
  const { stores } = useStore();

  const [animationKey, setAnimationKey] = useState(0);
  const [page, setPage] = useState('p0');

  const changePage = (newPage:string) => {
    setPage(newPage);
    setAnimationKey(prev => prev + 1); // Change la clé pour forcer le re-render
  };

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
      <StoresList index={index} setIndex={(i) => {
        const l = stores?.list.length||0;
        if(i == index) return
        else if (index == l-1 && i==l){
          setIndex(i);
          changePage('left');
          return
        }
        else if (index == l && i ==l-1 ){
          setIndex(i);
          changePage('right');
          return
        }
        else if (i < index) changePage('p-1');
        else if (i > index) changePage('p1');
        setTimeout(() => {
          setIndex(i);
        }, 200);
      }} managedIndex={managedIndex} />
      <StoreDetail key={animationKey} postion={page} store={stores?.list[index]} isActive={index == managedIndex} onActiveRequired={() => {
        setManagedIndex(index);
        ClientCall(()=>localStorage.setItem('store.manage',index.toString()));
      }} />
<CurrentTheme />
<RecentThemes store={0} />
      {/* {stores?.list[index] && <ThemeList store={0} />} */}
    </div>
  )
}


function StoreDetail({ store, postion, isActive, onActiveRequired }: { onActiveRequired: () => void, postion: string, isActive?: boolean, store?: StoreInterface | null }) {


  return <div className={postion}>
    <div className={`manages-stores ${isActive ? 'active' : ''}`}>

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
        <div className="btn" onClick={onActiveRequired}>Changer de Boutique</div>
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

    
  </div>
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
      <div className="image" style={{ background: getImg('/res/store_img_5.png', 'cover') }}></div>
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

/*

[En-tête]

--------------  recherche  discrete -------------
|  filter (inactif) (active) (le store courrant)  
|  [recherche par nom]   voir tout >
-------------------------------------------------
--------------   list horizontal   ---------------
| list des store en petite card (icon, name , debut description )
| et la cover image en background
-------------------------------------------------

[section store info]
-------------------------------------------
| | Modifier | Paramètres | Stopper | 
| [Carte Statistiques]                   |
| Commandes: 38 (icône)                  |
| Visites: 38 (icône)                    |
| Points de ventes: 20/99 (icône)        |
| ...                                    |
-----------------------------------------

-------------------------------------------------
|[           ] Theme Nane Sublymus          [changer de theme]           
|[ theme img ] multi category 3D AR 3D seulement...
|[           ] [Badge ACTIF]     
|      (color) (text) ( disposition ) (pub) (faq ) (blog) [horisontal]                
-------------------------------------------------

[Section Thèmes]
-------------------------------------------------
Liste des Thèmes Récemment Utilisés
| [Thème 1] | [Thème 2] | [Thème 3] [horisontal]
-------------------------------------------------

*/