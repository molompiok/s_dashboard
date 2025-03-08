import './SwiperProducts.css'
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
// import required modules
import { EffectCoverflow, Pagination } from 'swiper/modules';

export{ SwiperProducts}

 function SwiperProducts({images}:{images:(string|Blob)[]}) {
  return (
    <div className='swiper-products'>
      <Swiper
        effect={'coverflow'}
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={'auto'}
        coverflowEffect={{
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: true,
        }}
        pagination={true}
        modules={[EffectCoverflow, Pagination]}
        className="mySwiper"
      >
        {images.map((i,c)=>(
        <SwiperSlide key={c}>
          <img  src={typeof i == 'string'?i:URL.createObjectURL(i)} />
        </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
