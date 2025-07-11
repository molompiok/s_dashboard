//Components/SwiperProducts/SwiperProducts.tsx
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
import { IoAddSharp, IoArrowBackCircleOutline, IoArrowForwardCircleOutline, IoChevronBack, IoCloudUploadOutline, IoTrash } from 'react-icons/io5';
import { BiImageAdd } from 'react-icons/bi';
import { getMedia } from '../Utils/StringFormater';
import { getFileType } from '../Utils/functions';
import { NEW_VIEW } from '../Utils/constants';
import { ConfirmDelete } from '../Confirm/ConfirmDelete';
import { useGlobalStore } from '../../api/stores/StoreStore';
import { useTranslation } from 'react-i18next';

export { SwiperProducts }
//IoArrowBackCircle IoArrowForwardCircle IoChevronBackCircle IoChevronForwardCircle

function SwiperProducts({ views, setViews }: { views: (string | Blob)[], setViews: (views: (string | Blob)[]) => void }) {
  const swiperRef = useRef<any>(null);
  const [localViews, setLocalViews] = useState(views);
  const [isHover, setHover] = useState(false);
  const [requireDetele, setRequireDetele] = useState(-1);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const { t } = useTranslation()
  useEffect(() => {
    setLocalViews(views.length > 0 ? views : [NEW_VIEW])
  }, [views]);




  useEffect(() => {
    setRequireDetele(-1);
  }, [localViews])

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const v = [
        ...localViews.slice(0, currentIndex),
        ...files,
        ...localViews.slice(currentIndex + 1)
      ]
      setLocalViews(v);
      setViews(v);
    } else {
      //TODO log Error le type de fichier
    }
    setHover(false)
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
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
        {localViews.map((i, index) => (
          <SwiperSlide key={index} onClick={() => {
            //=> le slideTo foctionne tres bien  ici
            swiperRef.current.slideTo(index)
          }}>
            <OptionSlide index={index}
              localViews={localViews}
              setLocalViews={setLocalViews}
              setViews={setViews}
              swiperRef={swiperRef}
              onRequiredDelete={(index) => {
                const c = localViews[index] === NEW_VIEW;
                c ? (() => {
                  let v = [
                    ...localViews.slice(0, index),
                    ...localViews.slice(index + 1),
                  ]
                  v = v.length > 0 ? v : [NEW_VIEW];
                  setLocalViews(v)
                })() : setRequireDetele(index)
              }}
            />
            <div className="move" style={{ display: (localViews[index] == NEW_VIEW || requireDetele == index) ? 'none' : '' }}>
              <IoArrowBackCircleOutline style={{ opacity: index == 0 ? '0.6' : '' }} onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                if (index == 0) return
                const lastView = localViews[index - 1];
                const currentView = localViews[index];
                setLocalViews(localViews.map((v, i) => i == index ? lastView : i == index - 1 ? currentView : v));
                setTimeout(() => {
                  swiperRef.current.slideTo(index - 1)
                }, 100);
              }} />
              <IoArrowForwardCircleOutline style={{ opacity: localViews.length - 1 == index ? '0.6' : '', marginLeft: 'auto' }} onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                if (localViews.length - 1 == index) return
                const lastView = localViews[index + 1];
                const currentView = localViews[index];
                setLocalViews(localViews.map((v, i) => i == index ? lastView : i == index + 1 ? currentView : v));
                setTimeout(() => {
                  swiperRef.current.slideTo(index + 1)
                }, 100);
              }} />
            </div>
            {
              i == NEW_VIEW ?
                <div className={`new-image ${isHover ? 'hover' : ''}`}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragLeave={(e) => setHover(false)}
                  onDragExit={(e) => setHover(false)}
                  >
                  <label htmlFor='chose-product-views' className="center"  >
                    <input id='chose-product-views' multiple type="file" accept={'image/*,video/*'} style={{ display: 'none' }} onChange={(e) => {
                      const files = e.currentTarget.files;
                      if (!files) return
                      const v = [
                        ...localViews.slice(0, index),
                        ...files,
                        ...localViews.slice(index + 1)
                      ]
                      setLocalViews(v)
                      setViews(v)
                    }} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-blue-500 p-2 text-center">
                      <IoCloudUploadOutline size={32} />
                      <span className="mt-1 text-xs">{t('category.selectImagePrompt')}</span>
                    </div>
                  </label>
                </div> :
                getFileType(i) == 'image' ?
                  <div className={`img_${index} view`} style={{
                    width: '100%',
                    height: '100%',
                    background: getMedia({ isBackground: true, source: i, from: 'api' })
                  }}></div>
                  : <video style={{ filter: `blur(${requireDetele == index ? 5 : 0}px)` }} loop autoPlay={index == currentIndex} className={`img_${index} view`} key={index} muted={true} src={getMedia({ source: i, from: 'api' })} />
            }
            {
              requireDetele == index && <ConfirmDelete style={{ position: 'absolute' }} title='' onCancel={() => setRequireDetele(-1)} onDelete={() => {
                setTimeout(() => {
                  let v = [
                    ...localViews.slice(0, index),
                    ...localViews.slice(index + 1),
                  ]
                  v = v.length > 0 ? v : [NEW_VIEW];
                  setLocalViews(v)
                  setViews(v);

                }, 500);
              }} />
            }
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}


function OptionSlide({ setLocalViews, setViews, localViews, index, swiperRef, onRequiredDelete }: { setViews: (imgs: (string | Blob)[]) => void, onRequiredDelete: (index: number) => void, setLocalViews: (imgs: (string | Blob)[]) => any, localViews: (string | Blob)[], index: number, swiperRef: any }) {

  const canDelete = !(localViews.length == 1 && localViews[0] == NEW_VIEW);
  return <div className="options">
    <span onClick={() => {
      const v = [
        ...localViews.slice(0, index),
        NEW_VIEW,
        ...localViews.slice(index)
      ]
      setLocalViews(v)
      // setViews(v)
    }}>
      <IoChevronBack title='Ajouter une image avant celle ci' />
      <IoAddSharp style={{ transform: 'translateX(-5px)' }} />
    </span>
    <label htmlFor={'change-product-views-' + index}>
      <input id={'change-product-views-' + index} multiple type="file" style={{ display: 'none' }} onChange={(e) => {
        const files = e.currentTarget.files;
        if (!files) return
        const v = [
          ...localViews.slice(0, index),
          ...files,
          ...localViews.slice(index + 1)
        ]
        setLocalViews(v)
        setViews(v)

      }} />
      <BiImageAdd />
    </label>
    <span style={{ opacity: canDelete ? 1 : 0.5 }} onClick={() => {
      canDelete && onRequiredDelete(index)
    }}><IoTrash /></span>
    <span style={{ transform: 'scaleX(-1)' }} onClick={() => {
      const v = [
        ...localViews.slice(0, index + 1),
        NEW_VIEW,
        ...localViews.slice(index + 1)
      ]
      setLocalViews(v)
      // setViews(v)
      setTimeout(() => swiperRef.current.slideTo(index + 1), 100);
    }}>
      <IoChevronBack />
      <IoAddSharp style={{ transform: 'translateX(-5px)' }} />
    </span>
  </div>
}