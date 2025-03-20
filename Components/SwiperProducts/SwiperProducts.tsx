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
import { getImg } from '../Utils/StringFormater';
import { getFileType } from '../Utils/functions';
import { NEW_VIEW } from '../Utils/constants';
import { ConfirmDelete } from '../Confirm/ConfirmDelete';
import { useStore } from '../../pages/stores/StoreStore';

export { SwiperProducts }
//IoArrowBackCircle IoArrowForwardCircle IoChevronBackCircle IoChevronForwardCircle

function SwiperProducts({ views, setViews }: { views: (string | Blob)[], setViews: (views: (string | Blob)[]) => void }) {
  const swiperRef = useRef<any>(null);
  const [localViews, setLocalViews] = useState(views);
  const [isHover, setHover] = useState(false);
  const [requireDetele, setRequireDetele] = useState(-1);
  const [mouseMove, setMouseMove] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { currentStore } = useStore()
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
    // console.log('DragOver');
    setHover(true)
  }

  // console.log({ views });


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
              <IoArrowBackCircleOutline style={{ opacity: index == 0 ? '0.6' : '' }} onClick={() => {
                if (index == 0) return
                const lastView = localViews[index - 1];
                const currentView = localViews[index];
                setLocalViews(localViews.map((v, i) => i == index ? lastView : i == index - 1 ? currentView : v));
                setTimeout(() => {
                  swiperRef.current.slideTo(index - 1)
                }, 100);
              }} />
              <IoArrowForwardCircleOutline style={{ opacity: localViews.length - 1 == index ? '0.6' : '', marginLeft: 'auto' }} onClick={() => {
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
                  onMouseMove={() => setMouseMove(true)}
                  onMouseLeave={() => setMouseMove(false)}>
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
                    <IoCloudUploadOutline />
                    Glisser Déposer Image/Video
                    <div className={"chose-file " + (mouseMove ? 'mouse-move' : '')}>
                      Chosir un fichier
                    </div>
                  </label>
                </div> :
                getFileType(i) == 'image' ?
                  <div className={`img_${index} view`} style={{
                    width: '100%',
                    height: '100%',
                    background: getImg(
                      typeof i == 'string' ? i
                        : URL.createObjectURL(i),
                      undefined, typeof i == 'string' ?
                      currentStore?.url : undefined
                    )
                  }}></div>
                  : <video style={{ filter: `blur(${requireDetele == index ? 5 : 0}px)` }} loop autoPlay={index == currentIndex} className={`img_${index} view`} key={index} muted={true} src={typeof i == 'string' ? `${currentStore?.url}${i.startsWith('/') ? i : '/' + i}` : URL.createObjectURL(i)} />
              // getFileType(i) == 'image' ?
              //   // <img style={{ filter: `blur(${requireDetele == index ? 5 : 0}px)` }} src={typeof i == 'string' ? i : URL.createObjectURL(i)} />
              //   <div className='' style={{
              //     width:'100%',
              //     height:'100%',
              //     filter: `blur(${requireDetele == index ? 5 : 0}px)`,
              //     background: getImg(
              //       typeof i == 'string' ? i
              //         : URL.createObjectURL(i),
              //       'contain', typeof i == 'string' ?
              //       currentStore?.url : undefined
              //     )
              //   }}></div>
              //   : <video style={{ filter: `blur(${requireDetele == index ? 5 : 0}px)` }} loop autoPlay={index == currentIndex} controls={false} muted={index != currentIndex} src={typeof i == 'string' ? i : URL.createObjectURL(i)} />

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