import './SwiperProducts.css'
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
// import required modules
import { EffectCoverflow, Pagination } from 'swiper/modules';
import { useEffect, useRef, useState } from 'react';
import { IoAddSharp, IoArrowBackCircle, IoArrowForwardCircle, IoChevronBack, IoChevronForwardCircle, IoCloudUploadOutline, IoTrash } from 'react-icons/io5';
import { BiImageAdd } from 'react-icons/bi';
import { getImg } from '../Utils/StringFormater';
const NEW_IMAGE = 'newImage'
export { SwiperProducts }
//IoArrowBackCircle IoArrowForwardCircle IoChevronBackCircle IoChevronForwardCircle

function getFileType(file:string|Blob) {
  if(typeof file == 'string'){
    const ext = file.substring(file.lastIndexOf('.')+1,file.length);
    if(['webp','jpg','jpeg','png','avif','gif','tif', 'tiff','ico','svg'].includes(ext)){
      return 'image';
    }else if(['webm','mp4','mov','avi','wmv','avchd','mkv','flv','mxf','mts','m2ts','3gp','ogv'].includes(ext)){
      return 'video';
    }else if(file.startsWith('data:image')){
      return 'image'
    }else if(file.startsWith('data:video')){
      return 'video'
    }
  }else{
    if(file.type.split('/')[0] == 'image'){
      return 'image'
    }else if(file.type.split('/')[0] == 'video'){
      return 'video'
    }
  }
  return 
}

function SwiperProducts({ images }: { images: (string | Blob)[] }) {
  const swiperRef = useRef<any>(null);
  const [localImages, setLocalImages] = useState(images);
  const [isHover, setHover] = useState(false);
  const [requireDetele, setRequireDetele] = useState(-1);
  const [mouseMove, setMouseMove] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => {
    setLocalImages(images.length > 0 ? images : [NEW_IMAGE])
  }, [images]);
  useEffect(() => {
    setRequireDetele(-1)
  }, [localImages])
  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setLocalImages([
        ...localImages.slice(0, currentIndex),
        ...files,
        ...localImages.slice(currentIndex + 1)
      ])
    } else {
      //TODO log Error le type de fichier
    }
    setHover(false)
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    // console.log('DragOver');
    setHover(true)
  }

  return (
    <div className='swiper-products'>

      <Swiper
        onActiveIndexChange={(i) => {
          setCurrentIndex(i.activeIndex);
          setRequireDetele(-1)
        }}
        onRealIndexChange={() => setRequireDetele(-1)}
        onSwiper={(ref) => swiperRef.current = ref}
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
            //=> le slideTo foctionne tres bien  ici
            swiperRef.current.slideTo(index)
          }}>
            <OptionSlide index={index}
              localImages={localImages}
              setLocalImages={setLocalImages}
              swiperRef={swiperRef}
              onRequiredDelete={setRequireDetele}
            />
            {
              i == NEW_IMAGE ?
                <div className={`new-image ${isHover ? 'hover' : ''}`}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragLeave={(e) => setHover(false)}
                  onDragExit={(e) => setHover(false)}
                  onMouseMove={() => setMouseMove(true)}
                  onMouseLeave={() => setMouseMove(false)}>
                  <label htmlFor='chose-product-views' className="center"  >
                    <input id='chose-product-views' multiple type="file" accept={'image/*,video/*'} style={{ display: 'none' }} onChange={(e) => {
                      const files = e.currentTarget.files;
                      if (files) {
                        setLocalImages([
                          ...localImages.slice(0, index),
                          ...files,
                          ...localImages.slice(index + 1)
                        ])
                      }
                    }} />
                    <IoCloudUploadOutline />
                    Glisser Déposer Image/Video
                    <div className={"chose-file " + (mouseMove ? 'mouse-move' : '')}>
                      Chosir un fichier
                    </div>
                  </label>:
                </div> :
                getFileType(i) == 'image' ? 
                <img style={{ filter: `blur(${requireDetele == index ? 5 : 0}px)` }} src={typeof i == 'string' ? i : URL.createObjectURL(i)} />
                :<video  style={{ filter: `blur(${requireDetele == index ? 5 : 0}px)` }} loop autoPlay={index==currentIndex} controls={false} muted={index!=currentIndex} src={typeof i == 'string' ? i : URL.createObjectURL(i)}/>
            }
            {
              requireDetele == index && <div className="required-delete">
                <div className="ctn">
                  <div className="cancel" onClick={() => setRequireDetele(-1)}>Anuller</div>
                  <div className="delete" onClick={(e) => {
                    const span = e.currentTarget.querySelector('span') as HTMLSpanElement
                    span.style.display = 'inline-block'
                    e.currentTarget.style.gap='6px';
                    e.currentTarget.style.paddingLeft='6px';
                    setTimeout(() => {
                      const imgs = [
                        ...localImages.slice(0, index),
                        ...localImages.slice(index + 1),
                      ]
                      setLocalImages(imgs.length > 0 ? imgs : [NEW_IMAGE])
  
                    }, 500);
                  }}><span style={{display:'none',background:getImg('/res/loading_white.gif',undefined,false)}}></span> Supprimer</div>
                </div>
              </div>
            }
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}


function OptionSlide({ setLocalImages, localImages, index, swiperRef, onRequiredDelete }: { onRequiredDelete: (index: number) => void, setLocalImages: (imgs: (string | Blob)[]) => any, localImages: (string | Blob)[], index: number, swiperRef: any }) {

  return <div className="options">
    <span onClick={() => {
      setLocalImages([
        ...localImages.slice(0, index),
        NEW_IMAGE,
        ...localImages.slice(index)
      ])
    }}>
      <IoChevronBack title='Ajouter une image avant celle ci' />
      <IoAddSharp style={{ transform: 'translateX(-5px)' }} />
    </span>
    <label htmlFor={'change-product-views-' + index}>
      <input id={'change-product-views-' + index} multiple type="file" style={{ display: 'none' }} onChange={(e) => {
        const files = e.currentTarget.files;
        if (files) {
          setLocalImages([
            ...localImages.slice(0, index),
            ...files,
            ...localImages.slice(index + 1)
          ])
        }
      }} />
      <BiImageAdd />
    </label>
    <span onClick={() => {
      onRequiredDelete(index)
    }}><IoTrash /></span>
    <span style={{ transform: 'scaleX(-1)' }} onClick={() => {
      setLocalImages([
        ...localImages.slice(0, index + 1),
        NEW_IMAGE,
        ...localImages.slice(index + 1)
      ])
      setTimeout(() => swiperRef.current.slideTo(index + 1), 100);
    }}>
      <IoChevronBack />
      <IoAddSharp style={{ transform: 'translateX(-5px)' }} />
    </span>
  </div>
}