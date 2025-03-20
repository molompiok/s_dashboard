import React, { useRef, useState } from 'react';
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperType } from 'swiper/types';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import './HorizontalSwiper.css';

// import required modules
import { Pagination, Navigation } from 'swiper/modules';
import { useWindowSize } from '../../Hooks/useWindowSize';
import { ValueInterface } from '../../Interfaces/Interfaces';
import { IoArrowBackCircle, IoArrowBackCircleOutline, IoArrowForwardCircle, IoArrowForwardCircleOutline, IoTrash } from 'react-icons/io5';
import { BiSolidImageAdd } from 'react-icons/bi';
import { getFileType } from '../Utils/functions';
import { useApp } from '../../renderer/AppStore/UseApp';
import { ChildViewer } from '../ChildViewer/ChildViewer';
import { ConfirmDelete } from '../Confirm/ConfirmDelete';
import { useStore } from '../../pages/stores/StoreStore';
import { getImg } from '../Utils/StringFormater';

export { HoriszontalSwiper }


function HoriszontalSwiper({ values, onActiveIndexChange, onDeleteValue, goBack, forward }: { goBack: () => boolean, forward: () => boolean, onDeleteValue?: (index: number) => void, onActiveIndexChange?: (index: number) => void, values: ValueInterface[] }) {
    const [swiperRef, setSwiperRef] = useState<SwiperType | null>(null);
    const { currentStore } = useStore()
    const size = useWindowSize()
    const { openChild } = useApp();
    return values.length <= 0 ? <div style={{ width: '1200px' }}></div> : (
        <div className='horizontal-swiper'>
            <Swiper
                onActiveIndexChange={(_swiper) => {
                    onActiveIndexChange?.(_swiper.activeIndex);
                }}
                onSwiper={setSwiperRef}
                slidesPerView={size.width < 340 ? 2 : size.width > 800 ? 2 : 3}
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
                    values.map((v, index) => (
                        <SwiperSlide key={index} onClick={() => {
                            swiperRef?.slideTo(index)
                        }}>
                            {
                                v.views.slice(0, 4).map(((i, _) => (
                                    getFileType(i) == 'image' ?
                                        <div key={_} className={`img_${_}`}  style={{
                                            width: '100%',
                                            height: '100%',
                                            background: getImg(
                                                typeof i == 'string' ? i
                                                    : URL.createObjectURL(i),
                                                undefined, typeof i == 'string' ?
                                                currentStore?.url : undefined
                                            )
                                        }}></div>
                                        : <video className={`img_${_}`} key={_} muted={true} src={typeof i == 'string' ? `${currentStore?.url}${i.startsWith('/')?i:'/'+i}` : URL.createObjectURL(i)} />
                                )))
                            }
                            <span className='trash' onClick={() => {
                                openChild(<ChildViewer title='Voullez vous supprimer la variante ?' style={{ height: '140px' }}>
                                    <ConfirmDelete title='' onCancel={() => openChild(null, { back: false })} onDelete={() => {
                                        setTimeout(() => {
                                            openChild(null, { back: false });
                                            onDeleteValue?.(index)
                                        }, 500);
                                    }} />
                                </ChildViewer>)
                            }}><IoTrash /></span>
                            <div className="move">
                                <IoArrowBackCircleOutline style={{ opacity: index == 0 ? '0.6' : '' }} onClick={() => {
                                    if (index == 0) return
                                    goBack() && setTimeout(() => {
                                        swiperRef?.slideTo(index - 1)
                                    }, 100);
                                }} />
                                <IoArrowForwardCircleOutline style={{ opacity: values.length - 1 == index ? '0.6' : '', marginLeft: 'auto' }} onClick={() => {
                                    if (values.length - 1 == index) return
                                    forward() && setTimeout(() => {
                                        swiperRef?.slideTo(index + 1)
                                    }, 100);
                                }} />
                            </div>
                        </SwiperSlide>
                    ))
                }{
                    <SwiperSlide className="add-variant" onClick={() => {
                        swiperRef?.slideTo(values.length)
                    }}>
                        <div className={'img'}><BiSolidImageAdd /></div>
                    </SwiperSlide>
                }
                <div className='unlimited'></div>
            </Swiper>
        </div>
    );
}
