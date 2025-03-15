// Import Swiper styles
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/pagination';
import 'swiper/css/navigation';


import './Page.css'
import { useWindowSize } from '../../Hooks/useWindowSize';
import { useEffect, useState } from 'react';
import { FreeMode, Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { IoCart, IoChevronDown, IoChevronForward, IoPeople } from 'react-icons/io5';
import { getImg } from '../../Components/Utils/StringFormater';
import { Swiper as SwiperType } from 'swiper/types';
import { Host } from '../../renderer/+config';

export { Page }

type AnnimationType = {
  slidesGrid: number[];
  translate: number;
  realIndex: number;
  size: number
}

function Page() {


  return (
    <div className="stores">
      <StoresList />
      <CurrentTheme />
      {/* <h3></h3> */}
      <div className="manages-stores">
        Afficher le store actutuelement manager et montrer quo'on peu manager le store presentement afficher
      </div>
      <div className="store-options">
        <div className="activity">
          <div className="stop"></div>
          <div className="restart"></div>
        </div>
        <div className="domaine"></div>
        <div className="performance"></div>
      </div>
      <h3>List des Themes Recement Utilise <span>{<IoChevronDown className='icon-25' />}</span></h3>
      <div className="recent-used-themes">
        {
          Array.from({ length: 4 }).map((_, i) => (
            <div className="used-theme"></div>
          ))
        }
      </div>
      <h3>Tout les Themes <span style={{ display: true ? '' : 'none' }}>{<IoChevronForward className='icon-25' />}</span></h3>
      <div className="preview-themes">
        {
          Array.from({ length: 4 }).splice(0, 4).map((_, i) => (
      /* i==4 && !list[5] */<div key={i} className="prev-theme"></div>
          ))
        }{
    /* list[5] =>*/ true && <div className="see-more"></div>
        }
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
      <div className="image" style={{ background: getImg('/res/store_img_5.jpg', 'cover', false) }}></div>
      <div className="general">
        <h2>Theme Nane Sublymus</h2>
        <p>{
          ['multi category', '3d', 'AR', '3D seulement', 'food', 'immobilier'].map(f => <span>{f}</span>)
        }</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h3>STATUS :</h3>
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
function StoresList() {
  const size = useWindowSize();
  const [swiperRef, setSwiperRef] = useState<SwiperType | null>(null);
  const [animation, setAnnimation] = useState<AnnimationType | null>(null);
  let s = size.width;

  const n = s < 550 ? (
    ((s - 260) / 290) * 1 + 1
  ) : 2;

  const p = s < 550 ? 30 : 50

  const [id, setId] = useState(0)
  const [animus, setAnimus] = useState(0)
  useEffect(() => {
    let i = 0;
    clearInterval(id)
    const _id = setInterval(() => {
      i++;
      if (!swiperRef) return clearInterval(_id);
      if (i > 20) clearInterval(_id);
      setAnnimation({
        realIndex: swiperRef.realIndex,
        slidesGrid: swiperRef.slidesGrid,
        translate: swiperRef.translate,
        size: (swiperRef as any).size
      })
    }, 100);
    setId(_id as any);
    return () => {
      clearInterval(id);
    }
  }, [animus]);

  return <Swiper
    onActiveIndexChange={(_swiper) => {
      // onActiveIndexChange?.(_swiper.activeIndex);
    }}
    onSliderMove={(s) => {
      setAnnimation({
        realIndex: s.realIndex,
        slidesGrid: s.slidesGrid,
        translate: s.translate,
        size: (s as any).size
      });
      setAnimus(animus + 1);
    }}
    onSwiper={s => { setSwiperRef(s), setAnnimation(s as any) }}
    slidesPerView={n}
    centeredSlides={true}
    spaceBetween={p}
    pagination={{
      type: 'fraction',
    }}
    navigation={true}
    modules={[Pagination, Navigation]}
    className="stores-swiper no-selectable"
  >
    {
      Array.from({ length: 5 }).map((_, index) => (
        <SwiperSlide key={index} onClick={() => {
          swiperRef?.slideTo(index)
        }}>
          {swiperRef && animation && <StoreItem animation={animation} index={index} swiper={swiperRef} store />}
        </SwiperSlide>
      ))
    }
  </Swiper>
}

function StoreItem({ store, index, swiper, animation }: { store: any, index: number, animation: AnnimationType, swiper: SwiperType }) {
  const [cp, setCp] = useState({ x: 0, y: 0 })
  const i = 0;

  let p = animation.translate + animation.slidesGrid[index]
  p = p / 5
  // console.log(swiper);
  const s = animation.size
  let op = 1 / (1 + Math.pow((p / s) * 4, 2)) - 0.5
  op = op < 0 ? 0 : op
  op = op * 2
  if (index == 1) console.log({ op, s, p });

  return <div className="store-item">
    <div className="back" style={{ background: getImg('/res/store_img_1.jpg', 'cover', false) }}></div>
    <div className="inner">
      <div className="top">
        <div className="icon-80 logo" style={{ background: getImg('/res/store_img_1.jpg', undefined, false) }}></div>
        <h1>Ladonal Market</h1>
      </div>
      <div className="cover-image"></div>
      <p>Description du stores visible pour les clients dans le about de la page du store/theme </p>
      <IoCart /> commandes
      <IoPeople /> Clients
    </div>
    <div className="cover-image annimated" style={{ opacity: `${op}`, left: `${p}px`, background: getImg('/res/store_img_1.jpg', undefined, false) }}></div>
  </div>
}

