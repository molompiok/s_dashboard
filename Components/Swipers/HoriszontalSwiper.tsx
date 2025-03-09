import React, { useRef, useState } from 'react';
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import './HoriszontalSwiper.css';

// import required modules
import { Pagination, Navigation } from 'swiper/modules';
import { useWindowSize } from '../../Hooks/useWindowSize';
import { FeatureValueInterface } from '../../Interfaces/Interfaces';

export { HoriszontalSwiper }

function HoriszontalSwiper({ values ,onActiveIndexChange}: {onActiveIndexChange?:(index:number)=>void, values: FeatureValueInterface[] }) {
    const [swiperRef, setSwiperRef] = useState<any>(null);

    let appendNumber = 4;
    let prependNumber = 1;

    const prepend2 = () => {
        swiperRef?.prependSlide([
            '<div class="swiper-slide">Slide ' + --prependNumber + '</div>',
            '<div class="swiper-slide">Slide ' + --prependNumber + '</div>',
        ]);
    };

    const prepend = () => {
        swiperRef.prependSlide(
            '<div class="swiper-slide">Slide ' + --prependNumber + '</div>'
        );
    };

    const append = () => {
        swiperRef.appendSlide(
            '<div class="swiper-slide">Slide ' + ++appendNumber + '</div>'
        );
    };

    const append2 = () => {
        swiperRef.appendSlide([
            '<div class="swiper-slide">Slide ' + ++appendNumber + '</div>',
            '<div class="swiper-slide">Slide ' + ++appendNumber + '</div>',
        ]);
    };


    const size = useWindowSize()
    
    return (
        <div className='horizontal-swiper'>
            <Swiper
                onActiveIndexChange={(_swiper)=>{
                    onActiveIndexChange?.(_swiper.activeIndex);
                }}
                onSwiper={setSwiperRef}
                slidesPerView={size.width < 340 ? 2 : size.width > 800 ? 4 : 3}
                centeredSlides={true}
                spaceBetween={20}
                pagination={{
                    type: 'fraction',
                }}
                navigation={true}
                modules={[Pagination, Navigation]}
                className="mySwiper"
            >
                {
                    values.map((v,index) => (
                        <SwiperSlide onClick={()=>{
                            swiperRef.slideTo(index)
                        }}>
                           {
                            v.views.map(((img,i)=>(
                                <div className={`img_${i}`} style={{background: `no-repeat center/cover url(${img})` }}></div>
                            )))
                           }
                        </SwiperSlide>
                    ))
                }{
                    values.length
                }
                <div className='unlimited'></div>
            </Swiper>

            {/* <p className="append-buttons">
                <button onClick={() => prepend2()} className="prepend-2-slides">
                    Prepend 2 Slides
                </button>
                <button onClick={() => prepend()} className="prepend-slide">
                    Prepend Slide
                </button>
                <button onClick={() => append()} className="append-slide">
                    Append Slide
                </button>
                <button onClick={() => append2()} className="append-2-slides">
                    Append 2 Slides
                </button>
            </p> */}
        </div>
    );
}
