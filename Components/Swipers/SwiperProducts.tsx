import './SwiperProducts.css'
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
// import required modules
import { EffectCoverflow, Pagination } from 'swiper/modules';
import { useEffect, useState } from 'react';
import { IoAddSharp, IoArrowBackCircle, IoArrowForwardCircle, IoChevronBack, IoChevronForwardCircle, IoTrash } from 'react-icons/io5';
import { BiImageAdd } from 'react-icons/bi';
const NEW_IMAGE = 'newImage'
export { SwiperProducts }
//IoArrowBackCircle IoArrowForwardCircle IoChevronBackCircle IoChevronForwardCircle
function SwiperProducts({ images }: { images: (string | Blob)[] }) {
  const [swiperRef, setSwiperRef] = useState<any>(null);
  const [localImages, setLocalImages] =  useState(images) 
  useEffect(()=>{
    setLocalImages(images.length>0?images:[NEW_IMAGE])
  },[images]);
  return (
    <div className='swiper-products'>

      <Swiper
        onSwiper={setSwiperRef}
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
        {localImages.map((i, index) => (
          <SwiperSlide key={index} onClick={() => {
            swiperRef.slideTo(index)
          }}>
            <div className="options">
              <span onClick={()=>{
                setLocalImages([
                  ...localImages.slice(0, index),
                  NEW_IMAGE,
                  ...localImages.slice(index)
              ])
              }}>
                <IoChevronBack title='Ajouter une image avant celle ci' />
                <IoAddSharp style={{ transform: 'translateX(-5px)' }} />
              </span>
              <span><BiImageAdd /></span>
              <span onClick={()=>{
                const imgs = [
                  ...localImages.slice(0, index),
                  ...localImages.slice(index+1)
              ]
                setLocalImages(imgs.length>0?imgs:[NEW_IMAGE])
              }}><IoTrash /></span>
              <span style={{ transform: 'scaleX(-1)' }}  onClick={()=>{
                swiperRef.slideTo(index+1,0)
                setLocalImages([
                  ...localImages.slice(0, index+1),
                  NEW_IMAGE,
                  ...localImages.slice(index+1)
              ])
              }}>
                <IoChevronBack />
                <IoAddSharp style={{ transform: 'translateX(-5px)' }} />
              </span>
            </div>
            {
              i==NEW_IMAGE ?
              <div className="new-image"></div>:
              <img src={typeof i == 'string' ? i : URL.createObjectURL(i)} />
            }
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
