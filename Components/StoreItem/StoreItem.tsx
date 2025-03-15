import { useState } from 'react';
import './StoreItem.css'
import { IoCart, IoPeople } from 'react-icons/io5';
import { getImg } from '../Utils/StringFormater';
import { AnnimationType } from '../../Interfaces/Interfaces';
import { Swiper as SwiperType } from 'swiper/types';

export {StoreItem}

function StoreItem({ store, index, swiper, animation , active}: {active?:boolean, store: any, index: number, animation: AnnimationType, swiper: SwiperType }) {
   
    let p = animation.translate + animation.slidesGrid[index]
    p = p / 5
    // console.log(swiper);
    const s = animation.size
    let op = 1 / (1 + Math.pow((p / s) * 4, 2)) - 0.5
    op = op < 0 ? 0 : op
    op = op * 2
    if (index == 1) console.log({ op, s, p });
  
    return <div className={`store-item ${active?'active':''}`}>
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
  