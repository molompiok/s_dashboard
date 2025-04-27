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
import { IoArrowBackCircleOutline, IoArrowForwardCircleOutline, IoTrash } from 'react-icons/io5';
import { BiSolidImageAdd } from 'react-icons/bi';
import { getFileType } from '../Utils/functions';
import { ChildViewer } from '../ChildViewer/ChildViewer';
import { ConfirmDelete } from '../Confirm/ConfirmDelete';
import { useStore } from '../../pages/stores/StoreStore';
import { getImg } from '../Utils/StringFormater';
import { useChildViewer } from '../ChildViewer/useChildViewer';
import { globalActionZust } from '../../renderer/AppStore/globalActionZust';

export { HoriszontalSwiper }


function HoriszontalSwiper({ values, onActiveIndexChange, onDeleteValue, goBack, forward, newViewRequire , editValue}: {editValue:(value:ValueInterface)=>void,newViewRequire:(files:Blob[]) => void, goBack: () => boolean, forward: () => boolean, onDeleteValue?: (index: number) => void, onActiveIndexChange?: (index: number) => void, values: ValueInterface[] }) {
    const [swiperRef, setSwiperRef] = useState<SwiperType | null>(null);
    const { currentStore } = useStore()
    const size = useWindowSize()
    const { openChild } = useChildViewer();

    const s = useWindowSize().width;
    const n = s <= 580 ? ((s - 260) / 200) + 2
        : 3.4
    const p = s < 480 ? 0 : 0;


    return values.length <= 0 ? <div style={{ width: '1200px' }}></div> : (
        <div className='horizontal-swiper'>
            <Swiper
                onActiveIndexChange={(_swiper) => {
                    onActiveIndexChange?.(_swiper.activeIndex);
                }}
                onSwiper={setSwiperRef}
                slidesPerView={n}
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
                    values.sort((a, b) => b.index - a.index).map((v, index) => (
                        <SwiperSlide key={index} onClick={() => {
                            if(index == swiperRef?.realIndex){
                                editValue(v);
                                return
                            }
                            swiperRef?.slideTo(index)
                        }}>
                            {
                                v.views?.slice(0, 4).map(((i, _) => (
                                    getFileType(i) == 'image' ?
                                        <div key={_} className={`img_${_}`}  style={{
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
                            <span className='trash' onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                openChild(<ChildViewer title='Voullez vous supprimer la variante ?' style={{ height: '140px' }}>
                                    <ConfirmDelete title='' onCancel={() => openChild(null, { back: false })} onDelete={() => {
                                        setTimeout(() => {
                                            openChild(null, { back: false });
                                            onDeleteValue?.(index)
                                        }, 500);
                                    }} />
                                </ChildViewer>,{
                                    background:'#3455'
                                })
                            }}><IoTrash /></span>
                            <div className="move">
                                <IoArrowBackCircleOutline style={{ opacity: index == 0 ? '0.6' : '' }} onClick={(e) => {
                                    e.stopPropagation()
                                    if (index == 0) return
                                    goBack() && setTimeout(() => {
                                        swiperRef?.slideTo(index - 1)
                                    }, 100);
                                }}/>
                                <IoArrowForwardCircleOutline style={{ opacity: values.length - 1 == index ? '0.6' : '', marginLeft: 'auto' }} onClick={(e) => {
                                    e.stopPropagation()
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
                        {
                            swiperRef?.realIndex == values.length ?
                            <label htmlFor="add-new-value-image" className={'img'}>
                                <input style={{display:'none'}} type="file" name="add-new-value-image" id="add-new-value-image"  onChange={(e)=>{
                                     e.preventDefault();
                                     const files = e.target.files;
                                     if(!files) return
                                     newViewRequire(Array.from(files))
                                }}/>
                                <BiSolidImageAdd />
                            </label>:
                            <div className={'img'}><BiSolidImageAdd /></div>
                        }
                    </SwiperSlide>
                }
                <div className='unlimited'></div>
            </Swiper>
        </div>
    );
}
