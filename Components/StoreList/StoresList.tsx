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
import { useStore } from "../../pages/stores/StoreStore";


export {StoresList}

function StoresList({index, setIndex,managedIndex}:{managedIndex:number,index:number, setIndex:(store:number)=>void}) {
    const size = useWindowSize();
    const [swiperRef, setSwiperRef] = useState<SwiperType | null>(null);
    const [animation, setAnnimation] = useState<AnnimationType | null>(null);
    const { openChild} = useApp() 
    const  {fetchOwnerStores, stores} = useStore();

    let s = size.width;
    
    const n = s < 550 ? (
      ((s - 260) / 490) * 1 + 1
    ) : s < 750 ? (
      ((s - 260) / 490) * 1 + 0.7
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
      setTimeout(() => {
        swiperRef && swiperRef.slideTo(index)
      }, 300);
      
    },[swiperRef]);
    
    useEffect(()=>{
      fetchOwnerStores({});
    },[])
    return <Swiper
      onActiveIndexChange={(_swiper) => {
        setIndex(_swiper.realIndex)
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
        stores?.list.map((s, i) => (
          <SwiperSlide key={i} onClick={() => {
            swiperRef?.slideTo(i)
          }}>
            {swiperRef && animation && <StoreItem active={managedIndex ==i} animation={animation} index={index} swiper={swiperRef} store={s} />}
          </SwiperSlide>
        ))
      }{
        <SwiperSlide onClick={() => {
          swiperRef?.slideTo(stores?.list.length||0)
        }}>
          {
          swiperRef && animation && <div className="add-new-store" onClick={()=>{
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
