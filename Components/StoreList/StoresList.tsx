import { Swiper, SwiperSlide } from "swiper/react";
import { useWindowSize } from "../../Hooks/useWindowSize";
import { useEffect, useState } from "react";
import { Navigation, Pagination } from "swiper/modules";
import { StoreItem } from "../StoreItem/StoreItem";
import { Swiper as SwiperType } from 'swiper/types';
import { AnnimationType } from "../../Interfaces/Interfaces";

import './StoresList.css'
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { IoAdd, IoStorefront } from "react-icons/io5";
import { useApp } from "../../renderer/AppStore/UseApp";
import { StoreCreate } from "../../pages/StoreCreate/StoreCreate";


export {StoresList}

function StoresList({currentStore, setSelectedStore}:{currentStore:number, setSelectedStore:(store:number)=>void}) {
    const size = useWindowSize();
    const [swiperRef, setSwiperRef] = useState<SwiperType | null>(null);
    const [animation, setAnnimation] = useState<AnnimationType | null>(null);
    const { openChild} = useApp() 

    let s = size.width;
    
    const n = s < 550 ? (
      ((s - 260) / 290) * 1 + 1
    ) : 2;
  
    const p = s < 750 ? 30 : 50
  
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
  
    useEffect(()=>{
      swiperRef && swiperRef.slideTo(currentStore)
      
    },[swiperRef]);
    

    const stores = Array.from({ length: 5 })
    return <Swiper
      onActiveIndexChange={(_swiper) => {
        stores.length !== _swiper.realIndex && setSelectedStore(_swiper.realIndex)
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
      // navigation={true}
      modules={[Pagination]}
      className="stores-list no-selectable"
    >
      {
        stores.map((_, index) => (
          <SwiperSlide key={index} onClick={() => {
            swiperRef?.slideTo(index)
          }}>
            {swiperRef && animation && <StoreItem active={currentStore ==index} animation={animation} index={index} swiper={swiperRef} store />}
          </SwiperSlide>
        ))
      }{
        <SwiperSlide onClick={() => {
          swiperRef?.slideTo(stores.length)
        }}>
          {swiperRef && animation && <div className="add-new-store" onClick={()=>{
            openChild(<StoreCreate back={true}/>,{
              back:true,
            })
          }}>
              <IoStorefront/>
              <span><IoAdd/>Ajouter une nouvelle boutique</span>
          </div> }
        </SwiperSlide>
      }
    </Swiper>
  }
